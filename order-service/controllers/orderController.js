import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// DUA SERVICE
// export async function createOrder(req, res) {
//   const productId = req.query.productId;
//   const { paymentMethod, quantity, note } = req.body;

//   const userResponse = await fetch(
//     `${process.env.USER_SERVICE_HOST}/api/user/id/${req.user.id}`
//   );

//   const userResult = await userResponse.json();

//   if (!userResult.ok) return res.status(userResult.statusCode).json(userResult);

//   const { phone, address } = userResult.data.user;

//   if (!phone) {
//     return res.status(400).json({
//       ok: false,
//       message: "Pengguna belum menambahkan data nomor telepon.",
//       statusCode: 400,
//     });
//   }

//   if (!address) {
//     return res.status(400).json({
//       ok: false,
//       message: "Pengguna belum menambahkan data alamat rumah.",
//       statusCode: 400,
//     });
//   }

//   res.send("OK");
// }

// TIGA SERVICE
// export async function createOrder(req, res) {
//   const productId = req.query.productId;
//   const { paymentMethod, quantity, note } = req.body;

//   if (!productId) {
//     return res.status(400).json({
//       ok: false,
//       message: "Id produk wajib diisi pada query params.",
//       statusCode: 400,
//     });
//   }

//   const productResponse = await fetch(
//     `${process.env.PRODUCT_SERVICE_HOST}/api/product/id/${productId}`
//   );

//   const productResult = await productResponse.json();

//   if (!productResult.ok)
//     return res.status(productResult.statusCode).json(productResult);

//   const productAvailable = productResult.data.product.quantities > 0;

//   if (!productAvailable) {
//     return res.status(400).json({
//       ok: false,
//       message: "Produk habis.",
//       statusCode: 400,
//     });
//   }

//   const userResponse = await fetch(
//     `${process.env.USER_SERVICE_HOST}/api/user/id/${req.user.id}`
//   );

//   const userResult = await userResponse.json();

//   if (!userResult.ok) return res.status(userResult.statusCode).json(userResult);

//   const { phone, address } = userResult.data.user;

//   if (!phone) {
//     return res.status(400).json({
//       ok: false,
//       message: "Pengguna belum menambahkan data nomor telepon.",
//       statusCode: 400,
//     });
//   }

//   if (!address) {
//     return res.status(400).json({
//       ok: false,
//       message: "Pengguna belum menambahkan data alamat rumah.",
//       statusCode: 400,
//     });
//   }

//   res.send("OK");
// }

// FULL SERVICE
export async function createOrder(req, res) {
  const productId = req.query.productId;
  const { paymentMethod, quantity, note, shippingCarrier } = req.body;

  if (!productId) {
    return res.status(400).json({
      ok: false,
      message: "Id produk wajib diisi pada query params.",
      statusCode: 400,
    });
  }

  const productResponse = await fetch(
    `${process.env.PRODUCT_SERVICE_HOST}/api/product/id/${productId}`
  );

  const productResult = await productResponse.json();

  if (!productResult.ok)
    return res.status(productResult.statusCode).json(productResult);

  const productAvailable = productResult.data.product.quantities > 0;

  if (!productAvailable) {
    return res.status(400).json({
      ok: false,
      message: "Produk habis.",
      statusCode: 400,
    });
  }

  const productUpdateResponse = await fetch(
    `${process.env.PRODUCT_SERVICE_HOST}/api/product/update/${productId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantities: productResult.data.product.quantities - quantity,
      }),
    }
  );

  const productUpdateResult = await productUpdateResponse.json();

  if (!productUpdateResult.ok)
    return res.status(statusCode).json(productUpdateResult);

  const userResponse = await fetch(
    `${process.env.USER_SERVICE_HOST}/api/user/id/${req.user.id}`
  );

  const userResult = await userResponse.json();

  if (!userResult.ok) return res.status(userResult.statusCode).json(userResult);

  const { phone, address } = userResult.data.user;

  if (!phone) {
    return res.status(400).json({
      ok: false,
      message: "Pengguna belum menambahkan data nomor telepon.",
      statusCode: 400,
    });
  }

  if (!address) {
    return res.status(400).json({
      ok: false,
      message: "Pengguna belum menambahkan data alamat rumah.",
      statusCode: 400,
    });
  }

  const accessToken = req.headers.authorization.split(" ")[1];
  const amount =
    parseInt(productResult.data.product.price) * parseInt(quantity);

  const billingResponse = await fetch(
    `${process.env.BILLING_SERVICE_HOST}/api/billing/create`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ amount, paymentMethod }),
    }
  );

  const billingResult = await billingResponse.json();

  if (!billingResult.ok)
    return res.status(billingResult.statusCode).json(billingResult);

  try {
    const order = await prisma.order.create({
      data: {
        status: "UNPAID",
        quantity: parseInt(quantity),
        price: productResult.data.product.price,
        amount,
        shippingAddress: address,
        shippingCarrier,
        note,
        productId,
        billingId: billingResult.data.billing.id,
        userId: req.user.id,
      },
    });

    const temporaryTransactionResponse = await fetch(
      `${process.env.PAYMENT_SERVICE_HOST}/api/payment/save-temporary`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          productId,
          billingId: billingResult.data.billing.id,
          expiresAt: billingResult.data.billing.dueDate,
          productStock: productResult.data.product.quantities - quantity,
          orderQuantity: quantity,
        }),
      }
    );

    const temporaryTransactionResult =
      await temporaryTransactionResponse.json();

    if (!temporaryTransactionResult.ok)
      return res
        .status(temporaryTransactionResult.statusCode)
        .json(temporaryTransactionResult);

    res.status(201).json({
      ok: true,
      message: "Berhasil melakukan order.",
      statusCode: 201,
      data: { order },
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

export async function updateOrderByBillingId(req, res) {
  const { billingId } = req.params;
  const { paymentStatus } = req.body;

  try {
    const updatedOrder = await prisma.order.updateMany({
      where: { billingId },
      data: { status: paymentStatus },
    });

    if (updatedOrder.count === 0)
      return res.status(400).json({
        ok: false,
        message: "Order tidak ditemukan.",
      });

    const orderData = await prisma.order.findFirst({
      where: { billingId },
    });

    res.status(200).json({
      ok: true,
      data: { orderData },
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

export async function test2Microservices(req, res) {
  const { userId } = req.query;
  if (!userId) return res.send("Invalid query params.");

  try {
    const userResponse = await fetch(
      `${process.env.USER_SERVICE_HOST}/api/user/id/${userId}`
    );

    const userResult = await userResponse.json();

    if (!userResult.ok) return res.send("Error get user.");

    const { user } = userResult.data;

    res.status(200).json({
      ok: true,
      message:
        "Berhasil test 2 Microservices (Order-Service dan User-Service).",
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Internal server error.",
    });
  }
}

export async function test3Microservices(req, res) {
  const { userId, billingId } = req.query;
  if (!userId || !billingId) return res.send("Invalid query params.");

  try {
    const userResponse = await fetch(
      `${process.env.USER_SERVICE_HOST}/api/user/id/${userId}`
    );

    const userResult = await userResponse.json();

    if (!userResult.ok) return res.send("Error get user.");

    const { user } = userResult.data;

    const billingResponse = await fetch(
      `${process.env.BILLING_SERVICE_HOST}/api/billing/${billingId}`
    );

    const billingResult = await billingResponse.json();

    if (!billingResult.ok) return res.send("Error get billing.");

    const { billing } = billingResult.data;

    res.status(200).json({
      ok: true,
      message:
        "Berhasil test 3 Microservices (Order-Service dan User-Service).",
      data: { user, billing },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Internal server error.",
    });
  }
}
