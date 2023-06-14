import { validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function addProduct(req, res) {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      message: "Mohon lengkapi data!",
      errors: validationErrors.array(),
    });
  }

  const { name, description, price, quantities, brand } = req.body;
  const priceInt = parseInt(price);
  const quantitiesInt = parseInt(quantities);

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: priceInt,
        quantities: quantitiesInt,
        brand,
      },
    });

    res.status(201).json({
      ok: true,
      message: "Berhasil menambahkan produk.",
      statusCode: 201,
      data: { product },
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

export async function getAllProducts(req, res) {
  try {
    const products = await prisma.product.findMany();

    res.status(200).json({
      ok: true,
      message: "Success",
      statusCode: 200,
      data: { products },
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

export async function getProductById(req, res) {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.productId },
    });

    if (!product) {
      return res.status(404).json({
        ok: false,
        message: "Produk tidak ditemukan.",
        statusCode: 404,
      });
    }

    res.status(200).json({
      ok: true,
      message: "Success",
      statusCode: 200,
      data: { product },
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

export async function updateProductById(req, res) {
  const { productId } = req.params;
  const { quantities } = req.body;

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { quantities: parseInt(quantities) },
    });

    res.status(200).json({
      ok: true,
      data: { updatedProduct },
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
