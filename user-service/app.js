import express from "express";
import dotenv from "dotenv";
import router from "./routes/userRoutes.js";

const app = express();
dotenv.config();
const port = process.env.PORT || 8001;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/user/", router);

app.listen(port, () => console.log(`Listening on port ${port}`));
