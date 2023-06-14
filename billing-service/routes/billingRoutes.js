import express from "express";
import {
  createBilling,
  getBillingById,
  updateBilling,
} from "../controllers/billingController.js";
import { withAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", withAuth, createBilling);
router.get("/:billingId", getBillingById);
router.put("/update/:billingId", updateBilling);

export default router;
