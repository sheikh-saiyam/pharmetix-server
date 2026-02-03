import express from "express";
import { requireAuth } from "../../middlewares";
import { UserRole } from "../../../generated/prisma/enums";
import { medicineControllers } from "./medicine.controller";

const router = express.Router();

router.get("/", medicineControllers.getMedicines);

// Seller only
router.get(
  "/seller",
  requireAuth(UserRole.SELLER),
  medicineControllers.getSellerMedicines,
);

router.get("/:identifier", medicineControllers.getMedicineById);

// Seller only
router.post(
  "/",
  requireAuth(UserRole.SELLER),
  medicineControllers.createMedicine,
);

// Seller only
router.patch(
  "/:id",
  requireAuth(UserRole.SELLER),
  medicineControllers.updateMedicine,
);

export const medicineRouter = router;
