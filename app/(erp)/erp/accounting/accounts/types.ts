export type AccountId = string;

export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";

export type AccountNature = "debit" | "credit";

export interface Account {
  id: AccountId;
  companyId: string;

  code: string;
  name: string;
  nameEn?: string | null;

  type: AccountType;
  nature: AccountNature;

  parentId: AccountId | null;
  parentCode?: string | null;

  level: number;

  isGroup: boolean;
  allowPosting: boolean;

  isSystem: boolean;
  isActive: boolean;

  status?: string;
  systemKey?: string | null;

  balance: number;
  description?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface AccountFormData {
  code: string;
  name: string;
  nameEn: string;

  type: AccountType;
  nature: AccountNature;

  parentId: AccountId | null;

  isGroup: boolean;
  allowPosting: boolean;

  description: string;
}

export interface AccountFilters {
  search?: string;
  type?: AccountType | "all";
  status?: "active" | "inactive" | "all";
  parentId?: AccountId | null;
}