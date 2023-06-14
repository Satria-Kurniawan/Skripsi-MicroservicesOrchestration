import { PrismaClient } from "@prisma/client";
import { PrismaClient as PrismaClientUser } from "../prisma/generated/client_user/index.js";
import { PrismaClient as PrismaClientProduct } from "../prisma/generated/client_product/index.js";
import { PrismaClient as PrismaClientBilling } from "../prisma/generated/client_billing/index.js";
import { PrismaClient as PrismaClientPayment } from "../prisma/generated/client_payment/index.js";
import { PrismaClient as PrismaClientShipping } from "../prisma/generated/client_shipping/index.js";
import { faker } from "@faker-js/faker";

const prismaOrder = new PrismaClient();
const prismaUser = new PrismaClientUser();
const prismaProduct = new PrismaClientProduct();
const prismaBilling = new PrismaClientBilling();
const prismaPayment = new PrismaClientPayment();
const prismaShipping = new PrismaClientShipping();

async function main() {
  let products = [];
  let users = [];
  let billings = [];
  let orders = [];

  const dataLength = 1000;

  for (let i = 0; i < dataLength; i++) {
    const user = await prismaUser.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        password: faker.internet.password(),
      },
    });
    users.push(user);
  }

  for (let i = 0; i < dataLength; i++) {
    const product = await prismaProduct.product.create({
      data: {
        brand: faker.company.name(),
        name: faker.commerce.product(),
        price: parseInt(faker.commerce.price()),
        quantities: faker.number.int(),
        description: faker.lorem.text(),
      },
    });
    products.push(product);
  }

  const currentDate = new Date();
  const dueDate = new Date(currentDate.setDate(currentDate.getDate() + 1));

  for (let i = 0; i < dataLength; i++) {
    const billing = await prismaBilling.billing.create({
      data: {
        amount: 500000,
        dueDate,
        paymentMethod: "OVO",
        paymentStatus: "Menunggu pembayaran.",
        userId: users[Math.floor(Math.random() * users.length)].id,
      },
    });
    billings.push(billing);
  }

  for (let i = 0; i < dataLength; i++) {
    const order = await prismaOrder.order.create({
      data: {
        status: "Menunggu pembayaran.",
        amount: 500000,
        price: 250000,
        quantity: 2,
        shippingAddress: faker.location.streetAddress(),
        shippingCarrier: faker.company.name(),
        note: faker.lorem.text(),
        productId: products[Math.floor(Math.random() * products.length)].id,
        billingId: billings[Math.floor(Math.random() * billings.length)].id,
        userId: users[Math.floor(Math.random() * users.length)].id,
      },
    });
    orders.push(order);
  }

  for (let i = 0; i < dataLength; i++) {
    await prismaPayment.temporaryTransaction.create({
      data: {
        orderId: orders[Math.floor(Math.random() * orders.length)].id,
        billingId: billings[Math.floor(Math.random() * billings.length)].id,
        productId: products[Math.floor(Math.random() * products.length)].id,
        expiresAt: faker.date.anytime(),
        productStock: 100,
        orderQuantity: 1,
      },
    });
  }

  for (let i = 0; i < dataLength; i++) {
    await prismaShipping.shipping.create({
      data: {
        status: "Dikemas",
        carrier: faker.company.name(),
        currentLocation: faker.location.streetAddress(),
        shippingAddress: faker.location.streetAddress(),
        trackingNumber: faker.number.int().toString(),
        userId: users[Math.floor(Math.random() * users.length)].id,
        orderId: orders[Math.floor(Math.random() * orders.length)].id,
      },
    });
  }
}

main()
  .then(() => console.log("Data dummy berhasil digenerate."))
  .catch((e) => console.log(e))
  .finally(async () => {
    await prismaUser.$disconnect();
    await prismaProduct.$disconnect();
    await prismaOrder.$disconnect();
    await prismaBilling.$disconnect();
    await prismaPayment.$disconnect();
    await prismaShipping.$disconnect();
  });
