import express from "express";
import { requireAuth } from "../../middlewares";
import { UserRole } from "../../../generated/prisma/enums";
import { orderControllers } from "./order.controller";

const router = express.Router();

router.post("/", requireAuth(UserRole.CUSTOMER), orderControllers.createOrder);

export const orderRouter = router;
