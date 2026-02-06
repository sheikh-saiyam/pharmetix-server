import express from "express";
import { requireAuth } from "../../middlewares";
import { UserRole } from "../../../generated/prisma/enums";
import { reviewControllers } from "./review.controller";

const router = express.Router();

router.get("/", reviewControllers.getReviews);

router.post(
  "/",
  requireAuth(UserRole.CUSTOMER),
  reviewControllers.createReview,
);

export const reviewRouter = router;
