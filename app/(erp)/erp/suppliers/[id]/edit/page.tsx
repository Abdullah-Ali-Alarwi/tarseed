"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiSave,
  FiTruck,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiAlertCircle,
} from "react-icons/fi";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type Supplier = {
  id: string;
  companyId: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  accountId?: string | null;
  accountCode?: string | null;
  accountName?: string | null;
  notes?: string | null;
  status?: string | null;
  isActive?: boolean | null;
};
function companyFromSession(): string | null {
  try {
    const raw = localStorage.getItem("authUser");
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.type === "platform" || !user?.companyId
      ? null
      : String(user.companyId);
  } catch {
    return null;
  }
}

export default function EditSupplierPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supplierId = String(params?.id || "");
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const loadSupplier = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const companyId = companyFromSession();
      if (!companyId)
        throw new Error(
          "تعذر تحديد الشركة الحالية. تأكد من تسجيل الدخول بحساب ERP.",
        );
      if (!supplierId) throw new Error("معرّف المورد غير صالح.");
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", supplierId)
        .eq("companyId", companyId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        setSupplier(null);
        setLoadError("لم يتم العثور على المورد ضمن الشركة الحالية.");
        return;
      }
      const row = data as Supplier;
      setSupplier(row);
      setName(row.name || "");
      setPhone(row.phone || "");
      setAddress(row.address || "");
      setNotes(row.notes || "");
    } catch (error) {
      console.error("Load supplier for edit error:", error);
      setSupplier(null);
      setLoadError(
        error instanceof Error ? error.message : "حدث خطأ أثناء تحميل المورد.",
      );
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    void loadSupplier();
  }, [loadSupplier]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supplier || saving) return;
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("اسم المورد مطلوب");
      return;
    }
    const companyId = companyFromSession();
    if (!companyId || companyId !== supplier.companyId) {
      toast.error("لا يمكن تعديل مورد خارج الشركة الحالية.");
      return;
    }

    setSaving(true);
    try {
      const updates = {
        name: cleanName,
        phone: phone.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
        updatedAt: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("suppliers")
        .update(updates)
        .eq("id", supplier.id)
        .eq("companyId", companyId)
        .select("id,accountId")
        .maybeSingle();
      if (error) throw error;
      if (!data)
        throw new Error(
          "لم يتم تحديث المورد؛ تحقق من الصلاحيات أو من وجود السجل.",
        );

      // تحديث اسم الحساب المرتبط فقط؛ لا نغيّر accountId أو code أو الرصيد.
      if (data.accountId) {
        const { error: accountError } = await supabase
          .from("accounts")
          .update({ name: cleanName, updatedAt: new Date().toISOString() })
          .eq("id", data.accountId)
          .eq("companyId", companyId);
        if (accountError) {
          console.error(
            "Supplier saved but linked account name was not updated:",
            accountError,
          );
          toast.warning(
            "تم حفظ بيانات المورد، لكن تعذر تحديث اسم حسابه في شجرة الحسابات.",
            { description: accountError.message },
          );
          router.push(`/erp/suppliers/${supplier.id}`);
          router.refresh();
          return;
        }
      }

      toast.success("تم تعديل بيانات المورد بنجاح");
      router.push(`/erp/suppliers/${supplier.id}`);
      router.refresh();
    } catch (error) {
      console.error("Update supplier error:", error);
      toast.error("تعذر تعديل المورد", {
        description:
          error instanceof Error ? error.message : "حدث خطأ غير متوقع.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <main
        dir="rtl"
        className="flex min-h-[60vh] items-center justify-center bg-slate-50 p-6"
      >
        <p className="text-sm text-slate-500">جارٍ تحميل بيانات المورد...</p>
      </main>
    );
  if (!supplier)
    return (
      <main
        dir="rtl"
        className="flex min-h-[70vh] items-center justify-center bg-slate-50 p-4"
      >
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <FiAlertCircle className="mx-auto mb-3 text-amber-500" size={30} />
          <h1 className="text-xl font-bold text-slate-800">المورد غير موجود</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {loadError || "لم يتم العثور على المورد المطلوب."}
          </p>
          <Link
            href="/erp/suppliers"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm text-white"
          >
            <FiArrowRight /> العودة إلى الموردين
          </Link>
        </div>
      </main>
    );

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 p-4 md:p-7">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link
            href={`/erp/suppliers/${supplier.id}`}
            className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
          >
            <FiArrowRight /> تفاصيل المورد
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">تعديل المورد</h1>
          <p className="mt-1 text-sm text-slate-500">
            حدّث بيانات المورد مع الحفاظ على ارتباطه بحسابه المحاسبي.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 md:p-7"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <FiTruck size={23} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">{supplier.name}</h2>
              <p className="mt-1 text-xs text-slate-400">
                رقم المورد: {supplier.id}
              </p>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              اسم المورد <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-500"
              placeholder="أدخل اسم المورد"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <FiPhone /> رقم الهاتف
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-500"
                placeholder="رقم الهاتف"
              />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <FiMapPin /> العنوان
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-500"
                placeholder="عنوان المورد"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <FiFileText /> ملاحظات
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-500"
              placeholder="ملاحظات إضافية عن المورد"
            />
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
            الحساب المحاسبي المرتبط:{" "}
            <strong>{supplier.accountCode || "غير مرتبط"}</strong>. لن يتم تغيير
            رقم الحساب أو رصيده عند حفظ هذه البيانات.
          </div>
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
            <Link
              href={`/erp/suppliers/${supplier.id}`}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiSave /> {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
