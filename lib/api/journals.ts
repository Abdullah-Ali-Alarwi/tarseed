import { supabase } from "@/lib/supabase";

/* =========================
   Types
========================= */

export interface Journal {
  id?: string;
  companyId: string;

  journalNumber?: string;
  entryNumber?: string;

  date: string;
  description: string;

  reference?: string;
  referenceNumber?: string;
  referenceType?: string;
  referenceId?: string;

  status: string;

  debitTotal?: number;
  creditTotal?: number;

  totalDebit?: number;
  totalCredit?: number;

  createdBy?: string;
  createdById?: string;
  createdByName?: string;
  createdByUsername?: string;
  createdByRole?: string;
  createdByType?: string;

  postedBy?: string;
  postedById?: string;
  postedByName?: string;
  postedByUsername?: string;
  postedAt?: string;

  updatedBy?: string;
  updatedById?: string;
  updatedByName?: string;
  updatedAt?: string;

  createdAt?: string;
}

/* =========================
   Get All Journals
========================= */

export async function getJournals(companyId?: string) {
  let query = supabase
    .from("journals")
    .select("*")
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Journal[];
}

/* =========================
   Get Journal By ID
========================= */

export async function getJournalById(id: string) {
  const { data, error } = await supabase
    .from("journals")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Journal;
}

/* =========================
   Get Journal By Number
========================= */

export async function getJournalByNumber(
  journalNumber: string,
  companyId?: string
) {
  let query = supabase
    .from("journals")
    .select("*")
    .or(
      `journalNumber.eq.${journalNumber},entryNumber.eq.${journalNumber}`
    );

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Journal | null;
}

/* =========================
   Get Journals By Status
========================= */

export async function getJournalsByStatus(
  status: string,
  companyId?: string
) {
  let query = supabase
    .from("journals")
    .select("*")
    .eq("status", status)
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Journal[];
}

/* =========================
   Get Journals By Reference
========================= */

export async function getJournalsByReference(
  referenceType: string,
  companyId?: string
) {
  let query = supabase
    .from("journals")
    .select("*")
    .eq("referenceType", referenceType)
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Journal[];
}

/* =========================
   Get Journals By Date Range
========================= */

export async function getJournalsByDateRange(
  startDate: string,
  endDate: string,
  companyId?: string
) {
  let query = supabase
    .from("journals")
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

  return data as Journal[];
}

/* =========================
   Search Journals
========================= */

export async function searchJournals(
  search: string,
  companyId?: string
) {
  let query = supabase
    .from("journals")
    .select("*")
    .or(
      `journalNumber.ilike.%${search}%,entryNumber.ilike.%${search}%,description.ilike.%${search}%,referenceNumber.ilike.%${search}%`
    )
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Journal[];
}

/* =========================
   Create Journal
========================= */

export async function createJournal(journal: Journal) {
  const { data, error } = await supabase
    .from("journals")
    .insert(journal)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Journal;
}

/* =========================
   Update Journal
========================= */

export async function updateJournal(
  id: string,
  updates: Partial<Journal>
) {
  const { data, error } = await supabase
    .from("journals")
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Journal;
}

/* =========================
   Delete Journal
========================= */

export async function deleteJournal(id: string) {
  const { error } = await supabase
    .from("journals")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}