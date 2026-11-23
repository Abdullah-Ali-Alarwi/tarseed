import { supabase } from "@/lib/supabase";

export async function createCompany(companyData: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("companies")
    .insert(companyData)
    .select()
    .single();

  if (error) {
    console.error("Create company error:", error);
    throw new Error(error.message);
  }

  return data;
}