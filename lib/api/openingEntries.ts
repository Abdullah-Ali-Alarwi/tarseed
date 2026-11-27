import { supabase } from "@/lib/supabase";
import { getAccounts } from "@/lib/api/accounts";

/* =====================================================
   TYPES
===================================================== */

export interface OpeningEntryExtra {
  groupId: string;

  entryType: "opening_balance";

  accountId: string;
  accountCode: string;
  accountName: string;

  date: string;

  debit: number;
  credit: number;

  description: string;
  reference: string;

  relatedAccountId?: string;
  relatedAccountCode?: string;
  relatedAccountName?: string;

  createdAt: string;
  updatedAt: string;
}

export interface OpeningEntry {
  id: string;
  companyId: string;
  extra: OpeningEntryExtra;
  createdAt?: string;
  updatedAt?: string;
}

export type OpeningBalanceSide = "debit" | "credit";

export interface CreateOpeningEntryInput {
  companyId: string;

  accountId: string;

  amount: number;

  side: OpeningBalanceSide;

  date?: string;

  description?: string;

  reference?: string;
}

/* =====================================================
   HELPERS
===================================================== */

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeAmount(amount: number) {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("يجب إدخال مبلغ افتتاحي أكبر من صفر.");
  }

  return Number(value.toFixed(2));
}

function createReference() {
  return `OPENING-${crypto.randomUUID()}`;
}

/* =====================================================
   GET OPENING ENTRIES
===================================================== */

export async function getOpeningEntries(companyId: string) {
  if (!companyId) {
    throw new Error("معرّف الشركة غير موجود.");
  }

  const { data, error } = await supabase
    .from("openingEntries")
    .select("*")
    .eq("companyId", companyId)
    .order("createdAt", { ascending: true });

  if (error) {
    console.error("Get opening entries error:", error);
    throw error;
  }

  return (data || []) as OpeningEntry[];
}

/* =====================================================
   GET OPENING ENTRY BY ID
===================================================== */

export async function getOpeningEntryById(
  id: string,
  companyId: string,
) {
  if (!id || !companyId) {
    throw new Error("معرّف الحركة والشركة مطلوبان.");
  }

  const { data, error } = await supabase
    .from("openingEntries")
    .select("*")
    .eq("id", id)
    .eq("companyId", companyId)
    .maybeSingle();

  if (error) {
    console.error("Get opening entry error:", error);
    throw error;
  }

  return data as OpeningEntry | null;
}

/* =====================================================
   GET OPENING ENTRY PAIR
===================================================== */

export async function getOpeningEntryPair(
  groupId: string,
  companyId: string,
) {
  if (!groupId || !companyId) {
    throw new Error("معرّف مجموعة الحركة والشركة مطلوبان.");
  }

  const entries = await getOpeningEntries(companyId);

  return entries.filter(
    (entry) => entry.extra?.groupId === groupId,
  );
}

/* =====================================================
   CREATE OPENING ENTRY PAIR
===================================================== */

/**
 * ينشئ حركتين افتتاحيتين متوازنتين:
 *
 * 1. الحركة على الحساب المطلوب.
 * 2. الحركة المقابلة على حساب تسوية الأرصدة الافتتاحية 3103.
 *
 * لا ينشئ قيدًا في journals أو journalLines.
 *
 * side:
 * - debit  : رصيد افتتاحي مدين للحساب.
 * - credit : رصيد افتتاحي دائن للحساب.
 */

export async function createOpeningEntry(
  input: CreateOpeningEntryInput,
) {
  const {
    companyId,
    accountId,
    amount,
    side,
    date,
    description,
    reference,
  } = input;

  /* =========================
     VALIDATION
  ========================= */

  if (!companyId) {
    throw new Error("معرّف الشركة مطلوب.");
  }

  if (!accountId) {
    throw new Error("الحساب المحاسبي مطلوب.");
  }

  if (side !== "debit" && side !== "credit") {
    throw new Error("طبيعة الرصيد الافتتاحي غير صحيحة.");
  }

  const openingAmount = normalizeAmount(amount);

  const openingDate = date || getToday();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(openingDate)) {
    throw new Error("تاريخ الرصيد الافتتاحي غير صحيح.");
  }

  /* =========================
     LOAD ACCOUNTS
  ========================= */

  const accounts = await getAccounts(companyId);

  const targetAccount = accounts.find(
    (account) => String(account.id) === String(accountId),
  );

  if (!targetAccount) {
    throw new Error("الحساب المحاسبي المطلوب غير موجود.");
  }

  if (targetAccount.isActive === false) {
    throw new Error("لا يمكن تسجيل رصيد افتتاحي لحساب غير مفعل.");
  }

  if (targetAccount.isGroup === true) {
    throw new Error(
      "لا يمكن تسجيل رصيد افتتاحي على حساب تجميعي. اختر حسابًا تفصيليًا.",
    );
  }

  if (targetAccount.allowPosting === false) {
    throw new Error("هذا الحساب لا يسمح بتسجيل الحركات المحاسبية.");
  }

  /* =========================
     GET OPENING SETTLEMENT ACCOUNT
  ========================= */

  const settlementAccount = accounts.find(
    (account) =>
      String(account.code) === "3103" &&
      account.isActive !== false &&
      account.isGroup !== true &&
      account.allowPosting !== false,
  );

  if (!settlementAccount) {
    throw new Error(
      "حساب تسوية الأرصدة الافتتاحية 3103 غير موجود أو غير صالح للاستخدام.",
    );
  }

  if (String(targetAccount.id) === String(settlementAccount.id)) {
    throw new Error(
      "لا يمكن استخدام حساب تسوية الأرصدة الافتتاحية طرفًا وطرفًا مقابلًا في الحركة نفسها.",
    );
  }

  /* =========================
     CHECK DUPLICATES
  ========================= */

  const existingEntries = await getOpeningEntries(companyId);

  const hasExistingOpening = existingEntries.some(
    (entry) =>
      entry.extra?.entryType === "opening_balance" &&
      String(entry.extra?.accountId) === String(targetAccount.id),
  );

  if (hasExistingOpening) {
    throw new Error(
      "يوجد رصيد افتتاحي مسجل لهذا الحساب بالفعل. لا يمكن تكرار تسجيله.",
    );
  }

  /* =========================
     PREPARE ENTRY PAIR
  ========================= */

  const now = new Date().toISOString();

  const groupId = crypto.randomUUID();

  const entryReference = reference?.trim() || createReference();

  const entryDescription =
    description?.trim() || "رصيد افتتاحي";

  const targetDebit = side === "debit" ? openingAmount : 0;

  const targetCredit = side === "credit" ? openingAmount : 0;

  const settlementDebit = side === "credit" ? openingAmount : 0;

  const settlementCredit = side === "debit" ? openingAmount : 0;

  const targetEntry: OpeningEntry = {
    id: crypto.randomUUID(),

    companyId,

    createdAt: now,

    updatedAt: now,

    extra: {
      groupId,

      entryType: "opening_balance",

      accountId: String(targetAccount.id),

      accountCode: String(targetAccount.code),

      accountName: String(targetAccount.name),

      date: openingDate,

      debit: targetDebit,

      credit: targetCredit,

      description: entryDescription,

      reference: entryReference,

      relatedAccountId: String(settlementAccount.id),

      relatedAccountCode: String(settlementAccount.code),

      relatedAccountName: String(settlementAccount.name),

      createdAt: now,

      updatedAt: now,
    },
  };

  const settlementEntry: OpeningEntry = {
    id: crypto.randomUUID(),

    companyId,

    createdAt: now,

    updatedAt: now,

    extra: {
      groupId,

      entryType: "opening_balance",

      accountId: String(settlementAccount.id),

      accountCode: String(settlementAccount.code),

      accountName: String(settlementAccount.name),

      date: openingDate,

      debit: settlementDebit,

      credit: settlementCredit,

      description: entryDescription,

      reference: entryReference,

      relatedAccountId: String(targetAccount.id),

      relatedAccountCode: String(targetAccount.code),

      relatedAccountName: String(targetAccount.name),

      createdAt: now,

      updatedAt: now,
    },
  };

  /* =========================
     INSERT BOTH ENTRIES
  ========================= */

  const { data, error } = await supabase
    .from("openingEntries")
    .insert([
      {
        id: targetEntry.id,
        companyId,
        extra: targetEntry.extra,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: settlementEntry.id,
        companyId,
        extra: settlementEntry.extra,
        createdAt: now,
        updatedAt: now,
      },
    ])
    .select("*");

  if (error) {
    console.error("Create opening entry error:", error);
    throw error;
  }

  return {
    groupId,
    reference: entryReference,
    entries: (data || []) as OpeningEntry[],
  };
}

/* =====================================================
   DELETE OPENING ENTRY PAIR
===================================================== */

/**
 * يحذف طرفي الحركة الافتتاحية معًا.
 *
 * لا يحذف حركة واحدة ويترك الطرف الآخر.
 */

export async function deleteOpeningEntry(
  entryId: string,
  companyId: string,
) {
  if (!entryId || !companyId) {
    throw new Error("معرّف الحركة والشركة مطلوبان.");
  }

  /* =========================
     GET ENTRY
  ========================= */

  const entry = await getOpeningEntryById(entryId, companyId);

  if (!entry) {
    throw new Error("الحركة الافتتاحية غير موجودة.");
  }

  const groupId = entry.extra?.groupId;

  if (!groupId) {
    throw new Error(
      "هذه الحركة لا تحتوي على معرّف المجموعة، ولا يمكن حذفها بهذه الطريقة.",
    );
  }

  /* =========================
     GET PAIR
  ========================= */

  const pair = await getOpeningEntryPair(groupId, companyId);

  if (pair.length !== 2) {
    throw new Error(
      "الحركة الافتتاحية غير مكتملة. يجب مراجعة البيانات قبل حذفها.",
    );
  }

  /* =========================
     DELETE BOTH
  ========================= */

  const ids = pair.map((item) => item.id);

  const { data, error } = await supabase
    .from("openingEntries")
    .delete()
    .eq("companyId", companyId)
    .in("id", ids)
    .select("id");

  if (error) {
    console.error("Delete opening entry error:", error);
    throw error;
  }

  if (!data || data.length !== 2) {
    throw new Error(
      "لم يتم التأكد من حذف طرفي الحركة الافتتاحية بالكامل.",
    );
  }

  return true;
}