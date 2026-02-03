import { prisma } from "../../lib/prisma";
import { IStockOperation } from "./medicine.type";

const updateMedicineStock = async (
  medicineId: string,
  stockOperation: IStockOperation,
  stockQuantity: number,
) => {
  if (stockQuantity <= 0) {
    throw new Error("Stock quantity must be a positive number");
  }
  const result = await prisma.medicine.update({
    where: { id: medicineId },
    data: {
      ...(stockOperation === "INC"
        ? { stockQuantity: { increment: Number(stockQuantity) } }
        : { stockQuantity: { decrement: Number(stockQuantity) } }),
    },
    select: { id: true, stockQuantity: true },
  });

  return result;
};

export const medicineStockServices = {
  updateMedicineStock,
};
