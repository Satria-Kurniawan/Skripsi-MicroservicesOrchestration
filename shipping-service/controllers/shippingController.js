import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createShipping(req, res) {
  const { carrier, shippingAddress, userId, orderId } = req.body;

  try {
    const shippingData = await prisma.shipping.create({
      data: {
        carrier,
        currentLocation: "",
        shippingAddress,
        status: "Dikemas",
        trackingNumber: "sfjksefjksef",
        userId,
        orderId,
      },
    });

    res.status(201).json({
      ok: true,
      data: { shippingData },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "Internal server error.",
    });
  }
}
