import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createBilling(req, res) {
  const { amount, paymentMethod } = req.body;

  if (!amount || !paymentMethod) {
    return res.status(400).json({
      ok: false,
      message: "Mohon lengkapi data.",
      statusCode: 400,
    });
  }

  try {
    const userId = req.user.id;

    const currentDate = new Date();
    const dueDate = new Date(currentDate.setDate(currentDate.getDate() + 1));

    const paymentStatus = "Menunggu pembayaran.";

    let paymentCode = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (let i = 0; i < 20; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      paymentCode += characters.charAt(randomIndex);
    }

    const billing = await prisma.billing.create({
      data: {
        amount: parseInt(amount),
        paymentMethod,
        dueDate,
        paymentStatus,
        userId,
        paymentCode,
      },
    });

    res.status(201).json({
      ok: true,
      message: "Success.",
      statusCode: 201,
      data: { billing },
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
