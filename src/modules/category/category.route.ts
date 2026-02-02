import express from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { requireAuth } from "../../middlewares";
import { categoryControllers } from "./category.controller";

const router = express.Router();

router.get("/", categoryControllers.getCategories);

router.post(
  "/",
  requireAuth(UserRole.ADMIN),
  categoryControllers.createCategory,
);

router.patch(
  "/:id",
  requireAuth(UserRole.ADMIN),
  categoryControllers.updateCategory,
);

export const categoryRouter = router;
