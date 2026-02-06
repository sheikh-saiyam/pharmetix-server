import express from "express";
import { requireAuth } from "../../middlewares";
import { UserRole } from "../../../generated/prisma/enums";
import { orderControllers } from "./order.controller";

const router = express.Router();

router.get(
  "/all",
  requireAuth(UserRole.ADMIN, UserRole.SELLER),
  orderControllers.getOrders,
);

router.get("/:orderId", requireAuth(), orderControllers.getOrderById);

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
  orderControllers.cancelCustomerOrder,
);

router.patch(
  "/change-status/:orderId",
  requireAuth(UserRole.ADMIN),
  orderControllers.changeOrderStatus,
);

router.patch(
  "/item/change-status/:orderItemId",
  requireAuth(UserRole.SELLER),
  orderControllers.changeOrderItemStatus,
);

export const orderRouter = router;
