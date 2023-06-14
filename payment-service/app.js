import express from "express";
import dotenv from "dotenv";
import router from "./routes/paymentRoutes.js";
import cron from "node-cron";
import { cancelTransactions } from "./controllers/paymentController.js";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api/payment", router);

// cron.schedule("0 * * * * *", () => {
//   removeAndRollback();
// });

app.listen(port, () => console.log(`Payment service running on port ${port}`));
