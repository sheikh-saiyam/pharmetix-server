import express from "express";
import { requireAuth } from "../../middlewares";
import { UserRole } from "../../../generated/prisma/enums";
import { orderControllers } from "./order.controller";

const router = express.Router();

router.get("/all", requireAuth(UserRole.ADMIN), orderControllers.getOrders);

router.get(
  "/seller",
  requireAuth(UserRole.SELLER),
  orderControllers.getSellerOrders,
);

router.get(
  "/customer",
  requireAuth(UserRole.CUSTOMER),
  orderControllers.getCustomerOrders,
);

router.post("/", requireAuth(UserRole.CUSTOMER), orderControllers.createOrder);

router.patch(
  "/cancel-order/:orderId",
  requireAuth(UserRole.CUSTOMER),
  orderControllers.cancelOrder,
);

export const orderRouter = router;
