import {
  OrderItemStatus,
  OrderStatus,
  Prisma,
  UserRole,
} from "../../../generated/prisma/client";
import {
  OrderItemWhereInput,
  OrderWhereInput,
} from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { medicineStockServices } from "../medicine/medicine.stock.service";
import { IStockOperation } from "../medicine/medicine.type";
import { orderStatusServices } from "./order.status.service";
import {
  IGetAllOrdersQueries,
  IGetCustomerOrdersQueries,
  IGetSellerOrdersQueries,
  IOrderPayload,
} from "./order.type";

const getOrders = async (payload: IGetAllOrdersQueries) => {
  const { skip, take, orderBy, status } = payload;

  const whereFilters: OrderWhereInput = {
    ...(status && {
      OR: [{ status: { in: status } }],
    }),
  };

  const result = await prisma.order.findMany({
    where: whereFilters,
    include: {
      orderItems: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          subTotal: true,
          medicine: {
            select: {
              id: true,
              genericName: true,
              brandName: true,
              price: true,
            },
          },
        },
      },
    },
    omit: {
      customerId: true,
    },
    // pagination
    skip: skip,
    take: take,
    // sorting
    ...(orderBy && { orderBy }),
  });

  const total = await prisma.order.count({ where: whereFilters });

  return { data: result, total };
};

const getOrderById = async (
  orderId: string,
  customerId: string,
  customerRole: UserRole,
) => {
  // 1. Initial authorization check
  const orderCheck = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, customerId: true },
  });

  if (!orderCheck) {
    throw new Error(`Order with ID ${orderId} not found!`);
  }

  if (
    customerRole === UserRole.CUSTOMER &&
    orderCheck.customerId !== customerId
  ) {
    throw new Error("You are not authorized to view this order!");
  }

  const result = await prisma.order.findUnique({
    where: {
      id: orderId,
      ...(customerRole === UserRole.CUSTOMER && { customerId }),
    },
    include: {
      orderItems: {
        select: {
          id: true,
          status: true,
          quantity: true,
          unitPrice: true,
          subTotal: true,
          ...((customerRole === UserRole.ADMIN ||
            customerRole === UserRole.SELLER) && {
            seller: {
              select: { id: true, name: true, email: true, image: true },
            },
          }),
          medicine: {
            select: {
              id: true,
              slug: true,
              sellerId: true,
              genericName: true,
              brandName: true,
              price: true,

              reviews: {
                where: {
                  orderId: orderId, // Only reviews for THIS order
                  customerId: orderCheck.customerId,
                },
              },
            },
          },
        },
      },
      ...(customerRole === UserRole.SELLER || customerRole === UserRole.ADMIN
        ? {
            customer: {
              select: { id: true, name: true, email: true, image: true },
            },
          }
        : {}),
    },
    omit: {
      ...((customerRole === UserRole.CUSTOMER ||
        customerRole === UserRole.ADMIN) && { customerId: true }),
    },
  });

  // 3. Proper formatting for the frontend
  const formattedOrderItems = result!.orderItems.map((item) => {
    // Check if a review exists in the array
    const review = item.medicine.reviews?.[0] || null;

    // Remove the raw reviews array from the medicine object
    const { reviews, ...medicineInfo } = item.medicine;

    return {
      ...item,
      medicine: medicineInfo,
      isReviewed: !!review,
      reviewId: review?.id || null,
    };
  });

  return {
    ...result,
    orderItems: formattedOrderItems,
  };
};

const getCustomerOrders = async (
  customerId: string,
  queries: IGetCustomerOrdersQueries,
) => {
  const { skip, take, orderBy } = queries;

  const result = await prisma.order.findMany({
    where: { customerId },
    include: {
      orderItems: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          subTotal: true,
          medicine: {
            select: {
              id: true,
              genericName: true,
              brandName: true,
              price: true,
            },
          },
        },
      },
    },
    omit: {
      customerId: true,
    },
    // pagination
    skip: skip,
    take: take,
    // sorting
    ...(orderBy && { orderBy }),
  });

  const total = await prisma.order.count({ where: { customerId } });

  return { data: result, total };
};

const getSellerOrders = async (
  sellerId: string,
  payload: IGetSellerOrdersQueries,
) => {
  const { skip, take, orderBy, status } = payload;

  const whereFilters = {
    sellerId,
    ...(status && { status }),
  } as OrderItemWhereInput;

  const result = await prisma.orderItem.findMany({
    where: whereFilters,
    include: {
      medicine: {
        select: {
          id: true,
          slug: true,
          genericName: true,
          brandName: true,
          price: true,
        },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          createdAt: true,
          shippingName: true,
          shippingAddress: true,
          shippingCity: true,
          shippingPostalCode: true,
        },
      },
    },
    // pagination
    skip: skip,
    take: take,
    // sorting
    ...(orderBy && {
      orderBy: {
        order: {
          createdAt: orderBy?.sortOrder || "desc",
        },
      },
    }),
  });

  if (sellerId !== result[0]?.sellerId) {
    throw new Error("You are not authorized to view this seller's orders!");
  }

  const total = await prisma.orderItem.count({ where: whereFilters });

  return { data: result, total };
};

const createOrder = async (customerId: string, payload: IOrderPayload) => {
  const {
    shippingName,
    shippingPhone,
    shippingAddress,
    shippingCity,
    shippingPostalCode,
    orderItems,
  } = payload;

  const getMedicines = async (tx: Prisma.TransactionClient) => {
    return Promise.all(
      orderItems.map(async (order) => {
        const result = await tx.medicine.findUnique({
          where: { id: order.medicineId },
          select: {
            id: true,
            sellerId: true,
            price: true,
            stockQuantity: true,
          },
        });

        if (!result) {
          throw new Error(`Medicine with ID ${order.medicineId} not found`);
        }

        if (isNaN(order.quantity)) {
          throw new Error(
            `Invalid quantity for medicine ID ${order.medicineId}`,
          );
        }

        if (order.quantity > result.stockQuantity) {
          throw new Error(
            `Insufficient stock for medicine ID ${order.medicineId}`,
          );
        }

        const totalPrice = result.price * order.quantity;

        return {
          medicineId: result.id,
          sellerId: result.sellerId,
          quantity: order.quantity,
          unitPrice: result.price,
          subTotal: totalPrice,
        };
      }),
    );
  };

  const result = await prisma.$transaction(async (tx) => {
    const orderItems = await getMedicines(tx);

    // Calculate total amount
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.subTotal,
      0,
    );

    // 1. Create order
    const newOrder = await tx.order.create({
      data: {
        customerId,
        totalAmount,
        shippingName,
        shippingPhone,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
      },
      select: { id: true },
    });

    // Prepare order items
    const orderItemsWithOrderId = orderItems.map((order) => {
      return { ...order, orderId: newOrder.id };
    });

    // 2. Create order_items
    await tx.orderItem.createMany({
      data: orderItemsWithOrderId,
    });

    // 3. Decrease medicine stock
    await Promise.all(
      orderItemsWithOrderId.map((order) =>
        medicineStockServices.updateMedicineStock(
          order.medicineId,
          IStockOperation.DEC,
          order.quantity,
          tx,
        ),
      ),
    );

    // 4. Get order data
    const orderData = await tx.order.findUnique({
      where: { id: newOrder.id },
      include: {
        orderItems: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            subTotal: true,
            medicineId: true,
          },
        },
      },
    });

    return orderData;
  });

  return result;
};

const changeOrderStatus = async (
  orderId: string,
  updatedStatus: OrderStatus,
) => {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found!`);
    }

    if (order.status === updatedStatus) {
      throw new Error(`Order status is already ${updatedStatus}!`);
    }

    const result = await orderStatusServices.updateOrderStatus(
      orderId,
      updatedStatus,
      tx,
    );

    return result;
  });

  return result;
};

const changeOrderItemStatus = async (
  sellerId: string,
  role: UserRole,
  orderItemId: string,
  updatedStatus: OrderItemStatus,
) => {
  const result = await prisma.$transaction(async (tx) => {
    const orderItem = await tx.orderItem.findUnique({
      where: { id: orderItemId },
      select: { id: true, sellerId: true, status: true },
    });

    if (!orderItem) {
      throw new Error(`Order item with ID ${orderItemId} not found!`);
    }

    if (role === UserRole.SELLER && orderItem.sellerId !== sellerId) {
      throw new Error("You are not authorized to update this order item!");
    }

    if (orderItem.status === updatedStatus) {
      throw new Error(`Order item status is already ${updatedStatus}!`);
    }

    const updatedOrderItem = await orderStatusServices.updateOrderItemStatus(
      orderItemId,
      updatedStatus,
      tx,
    );

    return updatedOrderItem;
  });

  return result;
};

const cancelCustomerOrder = async (customerId: string, orderId: string) => {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          select: {
            id: true,
            medicineId: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found!`);
    }

    if (order.customerId !== customerId) {
      throw new Error("You are not authorized to cancel this order!");
    }

    if (
      order.status === OrderStatus.PROCESSING ||
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.DELIVERED
    ) {
      throw new Error(
        `Order cannot be cancelled because it is already ${order.status}!`,
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new Error("Order is already CANCELLED!");
    }

    // 1. Change order status to "CANCELLED"
    await orderStatusServices.updateOrderStatus(
      orderId,
      OrderStatus.CANCELLED,
      tx,
    );

    // 2. Increase medicine stock back
    await Promise.all(
      order.orderItems.map((item) =>
        medicineStockServices.updateMedicineStock(
          item.medicineId,
          IStockOperation.INC,
          item.quantity,
          tx,
        ),
      ),
    );

    // 3. Get updated order
    const updatedOrder = await tx.order.findUnique({
      where: { id: orderId },
      omit: { customerId: true },
    });

    return updatedOrder;
  });

  return result;
};

export const orderServices = {
  getOrders,
  getOrderById,
  getCustomerOrders,
  getSellerOrders,
  createOrder,
  changeOrderStatus,
  changeOrderItemStatus,
  cancelCustomerOrder,
};
