import { supabase } from "@/lib/supabase";

/* =========================
   Types
========================= */

export interface JournalLine {
  id?: string;

  companyId: string;
  journalId: string;

  accountId: string;
  accountCode?: string;
  accountName?: string;

  debit: number;
  credit: number;

  description?: string;

  supplierId?: string;
  customerId?: string;

  journalNumber?: string;
  entryNumber?: string;

  date?: string;

  referenceType?: string;
  referenceId?: string;

  status?: string;

  createdBy?: string;
  createdById?: string;
  createdByName?: string;
  createdByUsername?: string;
  createdByRole?: string;
  createdByType?: string;

  createdAt?: string;
}

/* =========================
   Get All Journal Lines
========================= */

export async function getJournalLines(companyId?: string) {
  let query = supabase
    .from("journalLines")
    .select("*")
    .order("createdAt", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as JournalLine[];
}

/* =========================
   Get Journal Line By ID
========================= */

export async function getJournalLineById(id: string) {
  const { data, error } = await supabase
    .from("journalLines")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as JournalLine;
}

/* =========================
   Get Lines By Journal
========================= */

export async function getJournalLinesByJournal(
  journalId: string,
  companyId?: string
) {
  let query = supabase
    .from("journalLines")
    .select("*")
    .eq("journalId", journalId)
    .order("createdAt", { ascending: true });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as JournalLine[];
}

/* =========================
   Get Lines By Account
========================= */

export async function getJournalLinesByAccount(
  accountId: string,
  companyId?: string
) {
  let query = supabase
    .from("journalLines")
    .select("*")
    .eq("accountId", accountId)
    .order("createdAt", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as JournalLine[];
}

/* =========================
   Get Lines By Account Code
========================= */

export async function getJournalLinesByAccountCode(
  accountCode: string,
  companyId: string
) {
  const { data, error } = await supabase
    .from("journalLines")
    .select("*")
    .eq("accountCode", accountCode)
    .eq("companyId", companyId)
    .order("createdAt", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as JournalLine[];
}

/* =========================
   Get Lines By Supplier
========================= */

export async function getJournalLinesBySupplier(
  supplierId: string,
  companyId?: string
) {
  let query = supabase
    .from("journalLines")
    .select("*")
    .eq("supplierId", supplierId)
    .order("createdAt", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as JournalLine[];
}

/* =========================
   Get Lines By Reference
========================= */

export async function getJournalLinesByReference(
  referenceType: string,
  referenceId: string,
  companyId?: string
) {
  let query = supabase
    .from("journalLines")
    .select("*")
    .eq("referenceType", referenceType)
    .eq("referenceId", referenceId);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as JournalLine[];
}

/* =========================
   Get Lines By Date Range
========================= */

export async function getJournalLinesByDateRange(
  startDate: string,
  endDate: string,
  companyId?: string
) {
  let query = supabase
    .from("journalLines")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as JournalLine[];
}

/* =========================
   Get Debit Lines
========================= */

export async function getDebitJournalLines(companyId?: string) {
  let query = supabase
    .from("journalLines")
    .select("*")
    .gt("debit", 0);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as JournalLine[];
}

/* =========================
   Get Credit Lines
========================= */

export async function getCreditJournalLines(companyId?: string) {
  let query = supabase
    .from("journalLines")
    .select("*")
    .gt("credit", 0);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as JournalLine[];
}

/* =========================
   Search Journal Lines
========================= */

export async function searchJournalLines(
  search: string,
  companyId?: string
) {
  let query = supabase
    .from("journalLines")
    .select("*")
    .or(
      `accountName.ilike.%${search}%,accountCode.ilike.%${search}%,description.ilike.%${search}%,entryNumber.ilike.%${search}%,journalNumber.ilike.%${search}%`
    )
    .order("createdAt", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as JournalLine[];
}

/* =========================
   Create Journal Line
========================= */

export async function createJournalLine(line: JournalLine) {
  const { data, error } = await supabase
    .from("journalLines")
    .insert(line)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as JournalLine;
}

/* =========================
   Create Multiple Journal Lines
========================= */

export async function createJournalLines(lines: JournalLine[]) {
  const { data, error } = await supabase
    .from("journalLines")
    .insert(lines)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data as JournalLine[];
}

/* =========================
   Update Journal Line
========================= */

export async function updateJournalLine(
  id: string,
  updates: Partial<JournalLine>
) {
  const { data, error } = await supabase
    .from("journalLines")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as JournalLine;
}

/* =========================
   Delete Journal Line
========================= */

export async function deleteJournalLine(id: string) {
  const { error } = await supabase
    .from("journalLines")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

/* =========================
   Get Journal Debit Total
========================= */

export async function getJournalDebitTotal(journalId: string) {
  const { data, error } = await supabase
    .from("journalLines")
    .select("debit")
    .eq("journalId", journalId);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).reduce(
    (total, line) => total + Number(line.debit || 0),
    0
  );
}

/* =========================
   Get Journal Credit Total
========================= */

export async function getJournalCreditTotal(journalId: string) {
  const { data, error } = await supabase
    .from("journalLines")
    .select("credit")
    .eq("journalId", journalId);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).reduce(
    (total, line) => total + Number(line.credit || 0),
    0
  );
}

/* =========================
   Check Journal Balance
========================= */

export async function checkJournalBalance(journalId: string) {
  const { data, error } = await supabase
    .from("journalLines")
    .select("debit, credit")
    .eq("journalId", journalId);

  if (error) {
    throw new Error(error.message);
  }

  const debitTotal = (data || []).reduce(
    (total, line) => total + Number(line.debit || 0),
    0
  );

  const creditTotal = (data || []).reduce(
    (total, line) => total + Number(line.credit || 0),
    0
  );

  return {
    debitTotal,
    creditTotal,
    difference: debitTotal - creditTotal,
    isBalanced: debitTotal === creditTotal,
  };
}