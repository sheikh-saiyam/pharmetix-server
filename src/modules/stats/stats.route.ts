import express from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { requireAuth } from "../../middlewares";
import { statsControllers } from "./stats.controller";

const router = express.Router();

router.get(
  "/admin",
  requireAuth(UserRole.ADMIN),
  statsControllers.getAdminStats,
);

router.get(
  "/seller",
  requireAuth(UserRole.SELLER),
  statsControllers.getSellerStats,
);

export const statsRouter = router;
