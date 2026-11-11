export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";

export type AccountNature = "debit" | "credit";

export type AccountId = string | number;

export interface Account {
  id: AccountId;
  companyId: string;

  code: string;
  name: string;
  nameEn?: string;

  parentId: AccountId | null;

  type: AccountType;
  nature: AccountNature;

  level: number;

  isGroup: boolean;
  allowPosting: boolean;
  isActive: boolean;

  // الرصيد المالي للحساب
  balance?: number;

  description?: string;
  createdAt: string;
}

export interface AccountFormData {
  code: string;
  name: string;
  nameEn: string;

  parentId: AccountId | null;

  type: AccountType;
  nature: AccountNature;

  isGroup: boolean;
  allowPosting: boolean;

  description: string;
}

export interface AccountStats {
  total: number;
  assets: number;
  liabilities: number;
  equity: number;
  revenue: number;
  expenses: number;
}

export interface AccountFilters {
  search: string;
  type: string;
  status: string;
}

export interface JournalLine {
  id: AccountId;
  accountId: AccountId;
}