import { createCompany } from "@/lib/api/companies";
import { createUser } from "@/lib/api/users";
import { createDefaultAccounts } from "@/lib/api/accounts";

// ========================================
// TYPES
// ========================================

type CreateOwnerParams = {
  companyData: Record<string, unknown>;
  userData: Record<string, unknown>;
};

type CreateOwnerResult = {
  company: {
    id: string;
    name: string;
    [key: string]: unknown;
  };
  user: unknown;
};

// ========================================
// CREATE OWNER
// ========================================

export async function createOwner({
  companyData,
  userData,
}: CreateOwnerParams): Promise<CreateOwnerResult> {

  // ========================================
  // 1. CREATE COMPANY
  // ========================================

  const company = await createCompany(companyData);

  if (!company?.id) {
    throw new Error("لم يتم إنشاء الشركة بشكل صحيح.");
  }

  // ========================================
  // 2. CREATE DEFAULT ACCOUNTS
  // ========================================

  await createDefaultAccounts(String(company.id));

  // ========================================
  // 3. CREATE OWNER USER
  // ========================================

  const user = await createUser({
    ...userData,

    companyId: String(company.id),
    companyname: company.name,

    type: "erp",
    role: "owner",

    status: "active",
    isActive: true,
  } as Parameters<typeof createUser>[0]);

  // ========================================
  // 4. RETURN RESULT
  // ========================================

  return {
    company,
    user,
  };
}