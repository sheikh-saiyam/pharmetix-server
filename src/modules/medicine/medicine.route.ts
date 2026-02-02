import express from "express";
import { requireAuth } from "../../middlewares";
import { UserRole } from "../../../generated/prisma/enums";
import { medicineControllers } from "./medicine.controller";

const router = express.Router();

router.get("/", medicineControllers.getMedicines);

router.get("/:identifier", medicineControllers.getMedicineById);

router.post(
  "/",
  requireAuth(UserRole.SELLER),
  medicineControllers.createMedicine,
);

router.patch(
  "/:id",
  requireAuth(UserRole.SELLER),
  medicineControllers.updateMedicine,
);

export const medicineRouter = router;
