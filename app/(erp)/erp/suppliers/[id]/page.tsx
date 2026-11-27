"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiEdit2,
  FiTruck,
  FiPhone,
  FiMapPin,
  FiHash,
  FiDollarSign,
  FiFileText,
  FiRefreshCw,
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
  balance?: number | string | null;
  notes?: string | null;
  status?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};
type Account = {
  id: string;
  code: string;
  name: string;
  nature?: string;
  type?: string;
  extra?: { balance?: number | string | null } | null;
};

function companyFromSession(): string | null {
  try {
    const raw = localStorage.getItem("authUser");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.type === "platform" || !u?.companyId ? null : String(u.companyId);
  } catch {
    return null;
  }
}
function amount(value: unknown) {
  const n = Number(value ?? 0);
  return (Number.isFinite(n) ? n : 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
function date(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("ar-SA-u-nu-latn");
}

export default function SupplierDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supplierId = String(params?.id || "");
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadSupplier = useCallback(async () => {
    if (!supplierId) {
      setLoadError("معرّف المورد غير صالح.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const companyId = companyFromSession();
      if (!companyId)
        throw new Error(
          "تعذر تحديد الشركة الحالية أو أن الحساب لا يملك صلاحية الوصول إلى الموردين.",
        );
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", supplierId)
        .eq("companyId", companyId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        setSupplier(null);
        setAccount(null);
        setLoadError("لم يتم العثور على المورد ضمن الشركة الحالية.");
        return;
      }
      const row = data as Supplier;
      setSupplier(row);
      if (row.accountId) {
        const { data: accountData, error: accountError } = await supabase
          .from("accounts")
          .select("id,code,name,nature,type,extra")
          .eq("id", row.accountId)
          .eq("companyId", companyId)
          .maybeSingle();
        if (accountError) throw accountError;
        setAccount((accountData as Account | null) ?? null);
      } else setAccount(null);
    } catch (error) {
      console.error("Load supplier details error:", error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحميل بيانات المورد.",
      );
      setSupplier(null);
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    void loadSupplier();
  }, [loadSupplier]);

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
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <FiAlertCircle size={26} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">
            تعذر العثور على المورد
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {loadError || "لم يتم العثور على المورد المطلوب."}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => void loadSupplier()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm"
            >
              <FiRefreshCw /> إعادة المحاولة
            </button>
            <Link
              href="/erp/suppliers"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white"
            >
              <FiArrowRight /> العودة للموردين
            </Link>
          </div>
        </div>
      </main>
    );

  const accountBalance = account
    ? Number(account.extra?.balance ?? 0) || 0
    : Number(supplier.balance ?? 0) || 0;
  const active = supplier.isActive !== false && supplier.status !== "inactive";

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 p-4 md:p-7">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/erp/suppliers"
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
            >
              <FiArrowRight /> الموردون
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">تفاصيل المورد</h1>
            <p className="mt-1 text-sm text-slate-500">
              عرض بيانات المورد وحسابه المحاسبي المرتبط.
            </p>
          </div>
          <Link
            href={`/erp/suppliers/${supplier.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            <FiEdit2 /> تعديل المورد
          </Link>
        </div>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <FiTruck size={26} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {supplier.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {supplier.accountCode
                    ? `رقم الحساب: ${supplier.accountCode}`
                    : "لا يوجد حساب محاسبي مرتبط"}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
            >
              {active ? "نشط" : "غير نشط"}
            </span>
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FiPhone /> رقم الهاتف
            </div>
            <p className="mt-3 font-semibold text-slate-800">
              {supplier.phone || "غير مسجل"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FiMapPin /> العنوان
            </div>
            <p className="mt-3 font-semibold text-slate-800">
              {supplier.address || "غير مسجل"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FiDollarSign /> رصيد المورد
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-800">
              {amount(accountBalance)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              يُقرأ من رصيد الحساب المرتبط في شجرة الحسابات.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FiHash /> الحساب المحاسبي
            </div>
            <p className="mt-3 font-semibold text-slate-800">
              {account?.code || supplier.accountCode || "غير مرتبط"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {account?.name || supplier.accountName || "—"}
            </p>
            {!account && supplier.accountId && (
              <p className="mt-2 text-xs text-amber-600">
                تعذر قراءة الحساب المرتبط؛ تحقق من وجوده وصلاحيات الوصول.
              </p>
            )}
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-6">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800">
            <FiFileText /> معلومات إضافية
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-400">تاريخ الإضافة</p>
              <p className="mt-1 text-sm text-slate-700">
                {date(supplier.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">آخر تحديث</p>
              <p className="mt-1 text-sm text-slate-700">
                {date(supplier.updatedAt)}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-400">ملاحظات</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {supplier.notes || "لا توجد ملاحظات."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
