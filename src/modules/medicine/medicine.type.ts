import { DosageForm } from "../../../generated/prisma/enums";

export enum IStockOperation {
  INC = "INC",
  DEC = "DEC",
}

export interface IMedicinePayload {
  // identity
  slug?: string;
  brandName: string;
  genericName: string;
  manufacturer: string;

  // medical info
  strength: string; // "500mg"
  dosageForm: DosageForm; // TABLET | SYRUP | CAPSULE
  unit: string; // "tablet", "ml"
  packSize: number; // 10 tablets, 100ml
  dosageInfo?: string;

  // pricing
  price: number; // price per pack
  piecePrice?: number; // optional

  // inventory
  stockQuantity: number;
  expiryDate: Date | string;
  isActive?: boolean;

  // display
  image: string;
  description: string;

  // relations
  categoryId: string;
  sellerId: string;
}

export interface IGetMedicinesQueries {
  // pagination
  skip: number;
  take: number;
  // sorting
  orderBy: { [key: string]: "asc" | "desc" } | undefined;
  // filters
  search: string | undefined;
  priceMin: number | undefined;
  priceMax: number | undefined;
  manufacturer: string | undefined;
  dosageForm: DosageForm | undefined;
  categoryId: string | undefined;
  isActive?: boolean;
  isFeatured?: boolean;
}
