import { supabase } from "@/lib/supabase";

import {
  createCustomerAccount,
  getCustomerMainAccount,
  getAccounts,
  updateAccount,
} from "@/lib/api/accounts";

// =====================================================
// TYPES
// =====================================================

export interface Customer {
  id?: string;
  companyId: string;
  code: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  balance: number;
  notes?: string | null;
  isActive: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  createdById?: string;
  updatedBy?: string;
}

// =====================================================
// HELPERS
// =====================================================

async function getCustomerAccount(
  customerId: string,
  companyId: string,
) {
  const accounts = await getAccounts(companyId);

  return (
    accounts.find(
      (account) =>
        account.entityType === "customer" &&
        String(account.entityId) === String(customerId),
    ) || null
  );
}

// =====================================================
// GET CUSTOMERS
// =====================================================

export async function getCustomers(
  companyId: string,
) {
  if (!companyId) {
    throw new Error("معرّف الشركة غير موجود.");
  }

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("companyId", companyId)
    .order("createdAt", { ascending: false });

  if (error) throw error;

  return (data || []) as Customer[];
}

// =====================================================
// GET CUSTOMER BY ID
// =====================================================

export async function getCustomerById(
  id: string,
  companyId: string,
) {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("companyId", companyId)
    .single();

  if (error) throw error;

  return data as Customer;
}

// =====================================================
// CREATE CUSTOMER
// =====================================================

export async function createCustomer(
  customer: Customer,
) {
  if (!customer.companyId) {
    throw new Error(
      "معرّف الشركة مطلوب لإضافة العميل.",
    );
  }

  if (!customer.name?.trim()) {
    throw new Error("اسم العميل مطلوب.");
  }

  const companyId = String(customer.companyId);

  const customerId =
    customer.id || crypto.randomUUID();

  // لا نخزن الرصيد المحاسبي داخل جدول العملاء

  const customerData = {
    ...customer,

    id: customerId,
    companyId,

    name: customer.name.trim(),
    balance: 0,
  };

  // =====================================================
  // VERIFY CUSTOMER MAIN ACCOUNT
  // =====================================================

  const mainAccount =
    await getCustomerMainAccount(companyId);

  if (!mainAccount) {
    throw new Error(
      `حساب العملاء الرئيسي 1103 غير موجود للشركة ${companyId}. تأكد من وجود حساب تجميعي بهذا الكود ومن صلاحيات قراءة جدول accounts.`,
    );
  }

  if (mainAccount.isGroup !== true) {
    throw new Error(
      `حساب العملاء 1103 موجود، لكنه ليس حسابًا تجميعيًا. القيمة الحالية isGroup: ${String(
        mainAccount.isGroup,
      )}`,
    );
  }

  if (
    mainAccount.isActive === false ||
    mainAccount.status === "inactive"
  ) {
    throw new Error(
      "حساب العملاء الرئيسي 1103 غير مفعل.",
    );
  }

  if (mainAccount.type !== "asset") {
    throw new Error(
      `نوع حساب العملاء 1103 غير صحيح. النوع الحالي: ${mainAccount.type}`,
    );
  }

  // =====================================================
  // CREATE CUSTOMER RECORD
  // =====================================================

  const { data, error } = await supabase
    .from("customers")
    .insert(customerData)
    .select()
    .single();

  if (error) {
    console.error(
      "Create customer error:",
      error,
    );

    throw error;
  }

  if (!data?.id) {
    throw new Error(
      "تمت إضافة العميل لكن لم يتم إرجاع معرّفه.",
    );
  }

  // =====================================================
  // CREATE CUSTOMER ACCOUNT
  // =====================================================

  try {
    const customerAccount =
      await createCustomerAccount(
        companyId,
        String(data.id),
        String(data.name),
      );

    // التأكد من ارتباط الحساب بالعميل الصحيح

    if (
      customerAccount.entityType !== "customer" ||
      String(customerAccount.entityId) !== String(data.id)
    ) {
      throw new Error(
        "تم إنشاء الحساب المحاسبي لكن بيانات ارتباطه بالعميل غير صحيحة.",
      );
    }

    // التأكد من أن الحساب ضمن الأصول

    if (customerAccount.type !== "asset") {
      throw new Error(
        "حساب العميل لم يتم إنشاؤه ضمن الأصول.",
      );
    }

    // التأكد من أن الحساب تحت حساب العملاء الرئيسي

    if (
      String(customerAccount.parentId) !==
      String(mainAccount.id)
    ) {
      throw new Error(
        "تم إنشاء حساب العميل تحت حساب رئيسي غير صحيح.",
      );
    }

    return data as Customer;
  } catch (accountError) {
    console.error(
      "Create customer account error:",
      accountError,
    );

    // محاولة التراجع عن إنشاء العميل

    const { error: rollbackError } = await supabase
      .from("customers")
      .delete()
      .eq("id", String(data.id))
      .eq("companyId", companyId);

    if (rollbackError) {
      console.error(
        "Customer rollback error:",
        rollbackError,
      );

      throw new Error(
        "تعذر إنشاء الحساب المحاسبي، كما تعذر التراجع عن إضافة العميل. يرجى مراجعة العميل ودليل الحسابات.",
      );
    }

    throw accountError;
  }
}

// =====================================================
// UPDATE CUSTOMER
// =====================================================

export async function updateCustomer(
  id: string,
  companyId: string,
  updates: Partial<Customer>,
) {
  const {
    id: ignoredId,
    companyId: ignoredCompanyId,
    balance: ignoredBalance,
    ...safeUpdates
  } = updates;

  const { data, error } = await supabase
    .from("customers")
    .update({
      ...safeUpdates,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("companyId", companyId)
    .select()
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error(
      "لم يتم العثور على العميل أو لا تملك صلاحية تعديله.",
    );
  }

  try {
    const account = await getCustomerAccount(
      id,
      companyId,
    );

    if (account) {
      const accountUpdates: Record<string, any> = {};

      if (safeUpdates.name !== undefined) {
        accountUpdates.name = String(
          safeUpdates.name,
        ).trim();
      }

      if (
        safeUpdates.isActive !== undefined ||
        safeUpdates.status !== undefined
      ) {
        const isActive =
          safeUpdates.isActive !== undefined
            ? safeUpdates.isActive
            : safeUpdates.status !== "inactive";

        accountUpdates.isActive = isActive;

        accountUpdates.status = isActive
          ? "active"
          : "inactive";
      }

      if (Object.keys(accountUpdates).length > 0) {
        await updateAccount(
          account.id,
          accountUpdates,
          companyId,
        );
      }
    }
  } catch (accountError) {
    console.error(
      "Update customer account error:",
      accountError,
    );

    throw new Error(
      "تم تحديث بيانات العميل، لكن تعذر تحديث حسابه المحاسبي. يرجى مراجعة دليل الحسابات.",
    );
  }

  return data as Customer;
}

// =====================================================
// DELETE CUSTOMER
// =====================================================

export async function deleteCustomer(
  id: string,
  companyId: string,
) {
  const account = await getCustomerAccount(
    id,
    companyId,
  );

  // تعطيل الحساب المحاسبي بدل حذفه

  if (account) {
    await updateAccount(
      account.id,
      {
        isActive: false,
        status: "inactive",
      },
      companyId,
    );
  }

  const { data, error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("companyId", companyId)
    .select("id");

  if (
    error ||
    !data ||
    data.length === 0
  ) {
    if (account) {
      try {
        await updateAccount(
          account.id,
          {
            isActive: true,
            status: "active",
          },
          companyId,
        );
      } catch (rollbackError) {
        console.error(
          "Customer account rollback error:",
          rollbackError,
        );
      }
    }

    if (error) throw error;

    throw new Error(
      "لم يتم العثور على العميل أو لا يمكن حذفه.",
    );
  }

  return true;
}