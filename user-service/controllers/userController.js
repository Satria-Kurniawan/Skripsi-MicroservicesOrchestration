import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { generateAccessToken } from "../utils/generateToken.js";

const prisma = new PrismaClient();

export async function signUp(req, res) {
  const { name, email, password, passwordConfirmation } = req.body;

  if (!name || !email || !password || !passwordConfirmation) {
    return res.status(400).json({
      ok: false,
      message: "Mohon lengkapi data.",
      statusCode: 400,
    });
  }

  if (password !== passwordConfirmation) {
    return res.status(400).json({
      ok: false,
      message: "Konfirmasi password tidak sesuai.",
      statusCode: 400,
    });
  }

  try {
    const emailHasBeenUsed = await prisma.user.findFirst({
      where: { email: email },
    });

    if (emailHasBeenUsed) {
      return res.status(400).json({
        ok: false,
        message: "Email sudah digunakan.",
        statusCode: 400,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      ok: true,
      message: "Berhasil melakukan pendaftaran akun.",
      statusCode: 201,
      data: { user },
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

export async function signIn(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      message: "Mohon lengkapi data.",
      statusCode: 400,
    });
  }

  try {
    const userFound = await prisma.user.findFirst({
      where: { email: email },
    });

    if (!userFound) {
      return res.status(404).json({
        ok: false,
        message: "Email/akun belum terdaftar.",
        statusCode: 404,
      });
    }

    const passwordMatched = await bcrypt.compare(password, userFound.password);

    if (!passwordMatched) {
      return res.status(403).json({
        ok: false,
        message: "Password yang anda masukan salah.",
        statusCode: 403,
      });
    }

    const user = {
      id: userFound.id,
      name: userFound.name,
      email: userFound.email,
      avatar: userFound.avatar,
    };

    const accessToken = generateAccessToken(user);

    res.status(200).json({
      ok: true,
      message: `Berhasil login sebagai ${user.name}.`,
      statusCode: 200,
      data: { user, accessToken },
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

export async function getMe(req, res) {
  const user = req.user;

  res.status(200).json({
    ok: true,
    message: "Success",
    statusCode: 200,
    data: { user },
  });
}

export async function getUserById(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        address: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "Pengguna tidak ditemukan.",
        statusCode: 404,
      });
    }

    res.status(200).json({
      ok: true,
      message: "Success",
      statusCode: 200,
      data: { user },
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

export async function getAllUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        address: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      ok: false,
      message: "Success",
      statusCode: 200,
      data: { users },
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
