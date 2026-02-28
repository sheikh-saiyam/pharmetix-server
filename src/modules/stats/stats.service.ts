import { UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const getAdminStats = async () => {
  const result = await prisma.$transaction(
    async (tx) => {
      // user stats
      const [
        totalUsers,
        totalAdmins,
        totalSellers,
        totalCustomers,
        totalActiveUsers,
        totalBannedUsers,
      ] = await Promise.all([
        await tx.user.count(),
        await tx.user.count({ where: { role: "ADMIN" } }),
        await tx.user.count({ where: { role: "SELLER" } }),
        await tx.user.count({ where: { role: "CUSTOMER" } }),
        await tx.user.count({ where: { status: UserStatus.ACTIVE } }),
        await tx.user.count({
          where: {
            OR: [
              { status: UserStatus.BANNED },
              { status: UserStatus.INACTIVE },
            ],
          },
        }),
      ]);

      // category stats
      const [
        totalCategories,
        totalActiveCategories,
        totalInactiveCategories,
        totalDeletedCategories,
        totalFeaturedCategories,
        topCategories,
      ] = await Promise.all([
        await tx.category.count(),
        await tx.category.count({ where: { isActive: true } }),
        await tx.category.count({ where: { isActive: false } }),
        await tx.category.count({ where: { isDeleted: true } }),
        await tx.category.count({ where: { isFeatured: true } }),
        await tx.category.findMany({
          take: 10,
          orderBy: { medicines: { _count: "desc" } },
          select: {
            id: true,
            name: true,
            _count: { select: { medicines: true } },
          },
        }),
      ]);

      // medicine stats
      const [
        totalMedicines,
        totalActiveMedicines,
        totalInactiveMedicines,
        totalDeletedMedicines,
        outOfStockMedicines,
        lowStockMedicines,
        topSellingMedicines,
        topRatedMedicines,
      ] = await Promise.all([
        await tx.medicine.count(),
        await tx.medicine.count({ where: { isActive: true } }),
        await tx.medicine.count({ where: { isActive: false } }),
        await tx.medicine.count({ where: { isDeleted: true } }),
        await tx.medicine.findMany({
          take: 10,
          where: { stockQuantity: 0 },
          select: {
            id: true,
            brandName: true,
            genericName: true,
            price: true,
            piecePrice: true,
          },
        }),
        await tx.medicine.findMany({
          take: 10,
          where: { stockQuantity: { gt: 0, lt: 50 } },
          select: {
            id: true,
            brandName: true,
            genericName: true,
            price: true,
            piecePrice: true,
          },
        }),
        await tx.medicine.findMany({
          take: 10,
          orderBy: { orderItems: { _count: "desc" } },
          select: {
            id: true,
            brandName: true,
            genericName: true,
            price: true,
            piecePrice: true,
            _count: { select: { orderItems: true } },
          },
        }),
        await tx.medicine.findMany({
          take: 10,
          orderBy: { reviews: { _count: "desc" } },
          select: {
            id: true,
            brandName: true,
            genericName: true,
            price: true,
            piecePrice: true,
          },
        }),
      ]);

      // order stats
      const [
        totalOrders,
        totalPlacedOrders,
        totalCancelledOrders,
        totalProcessingOrders,
        totalShippedOrders,
        totalDeliveredOrders,
        // revenue stats
        totalRevenue,
        totalRevenueForToday,
        totalRevenueForThisWeek,
        totalRevenueForThisMonth,
        totalRevenueForThisYear,
      ] = await Promise.all([
        await tx.order.count(),
        await tx.order.count({ where: { status: "PLACED" } }),
        await tx.order.count({ where: { status: "CANCELLED" } }),
        await tx.order.count({ where: { status: "PROCESSING" } }),
        await tx.order.count({ where: { status: "SHIPPED" } }),
        await tx.order.count({ where: { status: "DELIVERED" } }),
        // revenue stats
        await tx.order.aggregate({
          _sum: { totalAmount: true },
        }),
        await tx.order.aggregate({
          _sum: { totalAmount: true },
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(),
            },
          },
        }),
        await tx.order.aggregate({
          _sum: { totalAmount: true },
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7)),
              lt: new Date(),
            },
          },
        }),
        await tx.order.aggregate({
          _sum: { totalAmount: true },
          where: {
            createdAt: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
              lt: new Date(),
            },
          },
        }),
        await tx.order.aggregate({
          _sum: { totalAmount: true },
          where: {
            createdAt: {
              gte: new Date(
                new Date().setFullYear(new Date().getFullYear() - 1),
              ),
              lt: new Date(),
            },
          },
        }),
      ]);

      const ordersPerDay = (await tx.$queryRaw`
     SELECT
       DATE("createdAt") AS date,
       COUNT(*)::int AS "ordersCount",
       COALESCE(SUM("totalAmount"), 0)::float AS revenue
     FROM "orders"
     WHERE "createdAt" >= NOW() - INTERVAL '30 days'
     AND "status" != 'CANCELLED'
     GROUP BY DATE("createdAt")
     ORDER BY date ASC;
    `) as { date: Date; ordersCount: number; revenue: number }[];

      return {
        userStats: {
          totalUsers,
          totalAdmins,
          totalSellers,
          totalCustomers,
          totalActiveUsers,
          totalBannedUsers,
        },
        categoryStats: {
          totalCategories,
          totalActiveCategories,
          totalInactiveCategories,
          totalDeletedCategories,
          totalFeaturedCategories,
          topCategories,
        },
        medicineStats: {
          totalMedicines,
          totalActiveMedicines,
          totalInactiveMedicines,
          totalDeletedMedicines,
          outOfStockMedicines,
          lowStockMedicines,
          topSellingMedicines,
          topRatedMedicines,
        },
        orderStats: {
          totalOrders,
          totalPlacedOrders,
          totalCancelledOrders,
          totalProcessingOrders,
          totalShippedOrders,
          totalDeliveredOrders,
        },
        revenueStats: {
          totalRevenue: totalRevenue._sum.totalAmount,
          totalRevenueForToday: totalRevenueForToday._sum.totalAmount,
          totalRevenueForThisWeek: totalRevenueForThisWeek._sum.totalAmount,
          totalRevenueForThisMonth: totalRevenueForThisMonth._sum.totalAmount,
          totalRevenueForThisYear: totalRevenueForThisYear._sum.totalAmount,
        },
        ordersPerDay,
      };
    },
    {
      timeout: 15000, // 15 seconds to be safe on Vercel
      maxWait: 10000,
    },
  );

  return result;
};

const getSellerStats = async (sellerId: string) => {
  const result = await prisma.$transaction(
    async (tx) => {
      const [
        totalMedicines,
        totalActiveMedicines,
        totalInactiveMedicines,
        totalDeletedMedicines,
        outOfStockMedicines,
        lowStockMedicines,
        topSellingMedicines,
        topRatedMedicines,
      ] = await Promise.all([
        await tx.medicine.count({ where: { sellerId } }),
        await tx.medicine.count({ where: { sellerId, isActive: true } }),
        await tx.medicine.count({ where: { sellerId, isActive: false } }),
        await tx.medicine.count({ where: { sellerId, isDeleted: true } }),
        await tx.medicine.findMany({
          take: 10,
          where: { sellerId, stockQuantity: 0 },
          select: {
            id: true,
            brandName: true,
            genericName: true,
            price: true,
            piecePrice: true,
          },
        }),
        await tx.medicine.findMany({
          take: 10,
          where: { sellerId, stockQuantity: { gt: 0, lt: 50 } },
          select: {
            id: true,
            brandName: true,
            genericName: true,
            price: true,
            piecePrice: true,
          },
        }),
        await tx.medicine.findMany({
          take: 10,
          where: { sellerId },
          orderBy: { orderItems: { _count: "desc" } },
          select: {
            id: true,
            brandName: true,
            genericName: true,
            price: true,
            piecePrice: true,
            _count: { select: { orderItems: true } },
          },
        }),
        await tx.medicine.findMany({
          take: 10,
          where: { sellerId },
          orderBy: { reviews: { _count: "desc" } },
          select: {
            id: true,
            brandName: true,
            genericName: true,
            price: true,
            piecePrice: true,
          },
        }),
      ]);

      // seller order_items stats
      const [
        totalOrderItems,
        totalProcessingOrderItems,
        totalShippedOrderItems,
        totalRevenue,
      ] = await Promise.all([
        await tx.orderItem.count({ where: { sellerId } }),
        await tx.orderItem.count({
          where: { sellerId, status: "PROCESSING" },
        }),
        await tx.orderItem.count({
          where: { sellerId, status: "SHIPPED" },
        }),
        await tx.orderItem.aggregate({
          _sum: { subTotal: true },
          where: { sellerId },
        }),
      ]);

      const orderItemsPerDay = (await tx.$queryRaw`
     SELECT
       DATE(o."createdAt") AS date,
       COUNT(oi."id")::int AS "ordersCount",
       COALESCE(SUM(oi."subTotal"), 0)::float AS revenue
     FROM "order_items" oi
     JOIN "orders" o ON o."id" = oi."orderId"
     WHERE o."createdAt" >= NOW() - INTERVAL '30 days'
       AND oi."sellerId" = ${sellerId}
       AND o."status" != 'CANCELLED'
     GROUP BY DATE(o."createdAt")
     ORDER BY date ASC;
    `) as { date: Date; ordersCount: number; revenue: number }[];

      return {
        medicineStats: {
          totalMedicines,
          totalActiveMedicines,
          totalInactiveMedicines,
          totalDeletedMedicines,
          outOfStockMedicines,
          lowStockMedicines,
          topSellingMedicines,
          topRatedMedicines,
        },
        orderItemsStats: {
          totalOrderItems,
          totalProcessingOrderItems,
          totalShippedOrderItems,
          totalRevenue: totalRevenue._sum.subTotal,
        },
        orderItemsPerDay,
      };
    },
    {
      timeout: 15000, // 15 seconds to be safe on Vercel
      maxWait: 10000,
    },
  );

  return result;
};

export const statsServices = {
  getAdminStats,
  getSellerStats,
};
