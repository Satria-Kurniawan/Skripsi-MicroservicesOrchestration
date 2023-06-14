import express from "express";
import dotenv from "dotenv";
import router from "./routes/productRoutes.js";

const app = express();
dotenv.config();
const port = process.env.PORT || 8002;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api/product", router);

app.listen(port, () => console.log(`Product service running on port ${port}`));
