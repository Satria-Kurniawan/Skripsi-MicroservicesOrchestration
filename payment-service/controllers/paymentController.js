import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

export async function saveTemporaryTransaction(req, res) {
  const {
    productId,
    productStock,
    orderId,
    orderQuantity,
    billingId,
    expiresAt,
  } = req.body;

  const expires = new Date(expiresAt).toISOString();

  try {
    await prisma.temporaryTransaction.create({
      data: {
        productStock: parseInt(productStock),
        orderQuantity: parseInt(orderQuantity),
        orderId,
        productId,
        billingId,
        expiresAt: expires,
      },
    });

    res.status(201).json({ ok: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "Kesalahan pada server.",
      statusCode: 500,
    });
  }
}

export async function confirmPayment(req, res) {
  const { billingId } = req.query;
  const { paymentStatus } = req.body;

  try {
    const billingResponse = await fetch(
      `${process.env.BILLING_SERVICE_HOST}/api/billing/update/${billingId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      }
    );

    const billingResult = await billingResponse.json();

    if (!billingResult.ok)
      return res.status(billingResult.statusCode).json(billingResult);

    const orderResponse = await fetch(
      `${process.env.ORDER_SERVICE_HOST}/api/order/update/${billingId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      }
    );

    const orderResult = await orderResponse.json();

    if (!orderResult.ok)
      return res.status(billingResult.statusCode).json(orderResult);

    const { shippingAddress, shippingCarrier, userId } =
      orderResult.data.orderData;

    let shippingResult;

    if (paymentStatus === "PAID") {
      const shippingResponse = await fetch(
        `${process.env.SHIPPING_SERVICE_HOST}/api/shipping/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            carrier: shippingCarrier,
            shippingAddress,
            userId,
            orderId: orderResult.data.orderData.id,
          }),
        }
      );
      shippingResult = await shippingResponse.json();

      if (!shippingResult.ok)
        return res.status(shippingResult.statusCode).json(shippingResult);
    }

    const result = {
      billingData: billingResult.data.billingData,
      orderData: orderResult.data.orderData,
      shippingData: shippingResult.data.shippingData,
    };

    res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "Kesalahan pada server.",
      statusCode: 500,
    });
  }
}

export async function cancelTransactions(req, res) {
  try {
    const currentDate = new Date().toISOString();

    const temporaryTransactions = await prisma.temporaryTransaction.findMany({
      where: { expiresAt: { lt: currentDate } },
    });

    if (!temporaryTransactions.length)
      // return console.log("no expired transactions");
      return res
        .status(404)
        .json({ ok: false, message: "No expired transactions." });

    const cancel = new Promise(async (resolve, reject) => {
      for (const transaction of temporaryTransactions) {
        const rolbackStock =
          transaction.productStock + transaction.orderQuantity;

        const productResponse = await fetch(
          `${process.env.PRODUCT_SERVICE_HOST}/api/product/update/${transaction.productId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantities: rolbackStock }),
          }
        );
        const productResult = await productResponse.json();

        const billingResponse = await fetch(
          `${process.env.BILLING_SERVICE_HOST}/api/billing/update/${transaction.billingId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentStatus: "EXPIRED" }),
          }
        );
        const billingResult = await billingResponse.json();

        const orderResponse = await fetch(
          `${process.env.ORDER_SERVICE_HOST}/api/order/update/${transaction.billingId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentStatus: "EXPIRED" }),
          }
        );
        const orderResult = await orderResponse.json();

        if (productResult.ok && billingResult.ok && orderResult.ok)
          resolve({
            message: "Transactions cancel success",
            temporaryTransactions,
          });
        else reject("error");
      }
    });

    cancel
      .then(async (result) => {
        // await prisma.temporaryTransaction.deleteMany({
        //   where: { expiresAt: { lt: currentDate } },
        // });

        // console.log(result);
        res.send(result);
      })
      .catch((error) => {
        // console.log(error);
        res.send(error);
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "Kesalahan pada server.",
      statusCode: 500,
    });
  }
}
