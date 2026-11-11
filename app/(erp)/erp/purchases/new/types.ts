export type PaymentMethod = "cash" | "bank" | "credit";

export type TaxMode = "none" | "tax";

export type PurchaseFormItem = {
  id: number;
  productId: string;
  quantity: number;
  price: number;
  discount: number;
};

export type SupplierWithAccount = {
  accountCode?: string;
  accountName?: string;
};