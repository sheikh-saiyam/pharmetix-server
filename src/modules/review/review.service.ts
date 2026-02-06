import { OrderStatus } from "../../../generated/prisma/enums";
import { ReviewWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { IGetReviewsQueries, IReviewPayload } from "./review.type";

const getReviews = async (limit: number = 6) => {
  const result = await prisma.review.findMany({
    take: limit,
    include: {
      medicine: {
        select: {
          id: true,
          slug: true,
          genericName: true,
          brandName: true,
        },
      },
      customer: {
        select: {
          name: true,
          image: true,
        },
      },
    },
    omit: {
      medicineId: true,
      customerId: true,
      orderId: true,
      updatedAt: true,
    },
  });

  return result;
};

const getAllReviews = async (payload: IGetReviewsQueries) => {
  const { skip, take, orderBy } = payload;

  const whereFilters: ReviewWhereInput = {
    ...(payload.rating !== undefined && { rating: payload.rating }),
  };

  const result = await prisma.review.findMany({
    // filters
    where: whereFilters,
    // pagination
    skip: skip,
    take: take,
    // sorting
    ...(orderBy && { orderBy }),
    include: {
      order: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      medicine: {
        select: {
          id: true,
          slug: true,
          genericName: true,
          brandName: true,
        },
      },
      customer: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
    },
    omit: {
      medicineId: true,
      customerId: true,
      orderId: true,
      updatedAt: true,
    },
  });

  const total = await prisma.review.count({
    where: whereFilters,
  });

  return { data: result, total };
};

const createReview = async (customerId: string, payload: IReviewPayload) => {
  const { orderId, medicineId, rating } = payload;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Check order existence and ownership
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customerId: true,
        status: true,
      },
    });

    if (!order) {
      throw new Error("Order not found!");
    }

    if (order.customerId !== customerId) {
      throw new Error("You are not allowed to review this order!");
    }

    // 2. Ensure order is delivered
    if (order.status !== OrderStatus.DELIVERED) {
      throw new Error("You can only review medicines from delivered orders!");
    }

    // 3. Ensure medicine exists in this order
    const orderItem = await tx.orderItem.findFirst({
      where: { orderId, medicineId },
      select: { id: true },
    });

    if (!orderItem) {
      throw new Error("This medicine was not part of the specified order!");
    }

    // 4️. Prevent duplicate review (order + medicine + customer)
    const existingReview = await tx.review.findFirst({
      where: {
        orderId,
        medicineId,
        customerId,
      },
      select: { id: true },
    });

    if (existingReview) {
      throw new Error(
        "You have already reviewed this medicine for this order!",
      );
    }

    // Validate rating
    if (typeof rating !== "number" || rating < 0 || rating > 5) {
      throw new Error("Rating must be a number between 0 and 5!");
    }

    const review = await tx.review.create({
      data: { ...payload, customerId },
    });

    return review;
  });

  return result;
};

export const reviewServices = { getReviews, getAllReviews, createReview };
