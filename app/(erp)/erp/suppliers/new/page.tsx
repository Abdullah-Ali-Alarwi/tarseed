"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiSave,
  FiRefreshCw,
  FiUser,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiCreditCard,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

type AnyRecord = Record<string, any>;

export default function NewSupplierPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [accounts, setAccounts] = useState<AnyRecord[]>([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    accountCode: "2101",
    accountName: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // =====================================
  // تحميل بيانات المستخدم والشركة
  // =====================================

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const storedUser = localStorage.getItem("authUser");

      if (!storedUser) {
        toast.error("يرجى تسجيل الدخول أولاً");
        router.push("/login");
        return;
      }

      const authUser = JSON.parse(storedUser);

      if (authUser.type === "platform") {
        toast.error("لا يمكن لمستخدم المنصة إضافة مورد");
        router.push("/wezzan/dashboard");
        return;
      }

      const username = authUser.username;

      const usersResponse = await api.get("/users", {
        params: { username },
      });

      const user = usersResponse.data.find(
        (item: AnyRecord) => item.username === username,
      );

      if (!user?.companyId) {
        toast.error("المستخدم غير مرتبط بشركة");
        return;
      }

      const currentCompanyId = String(user.companyId);

      setCompanyId(currentCompanyId);

      const [companiesRes, accountsRes] = await Promise.all([
        api.get("/companies", {
          params: { id: currentCompanyId },
        }),
        api.get("/accounts", {
          params: { companyId: currentCompanyId },
        }),
      ]);

      const company = companiesRes.data.find(
        (item: AnyRecord) => String(item.id) === currentCompanyId,
      );

      setCompanyName(company?.name || company?.companyName || "");

      const activeAccounts = accountsRes.data.filter(
        (account: AnyRecord) =>
          account.isActive !== false &&
          account.status !== "inactive" &&
          account.isGroup !== true,
      );

      setAccounts(activeAccounts);

      const supplierAccount = activeAccounts.find(
        (account: AnyRecord) => String(account.code) === "2101",
      );

      if (supplierAccount) {
        setForm((prev) => ({
          ...prev,
          accountCode: String(supplierAccount.code),
          accountName: supplierAccount.name,
        }));
      }
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل بيانات الشركة والحسابات");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // =====================================
  // تحديث الحقول
  // =====================================

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  // =====================================
  // اختيار الحساب المحاسبي
  // =====================================

  const handleAccountChange = (accountId: string) => {
    const account = accounts.find((item) => String(item.id) === accountId);

    setForm((prev) => ({
      ...prev,
      accountCode: account ? String(account.code) : "",
      accountName: account?.name || "",
    }));
  };

  // =====================================
  // التحقق من البيانات
  // =====================================

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = "اسم المورد مطلوب";
    }

    if (!form.accountCode || !form.accountName) {
      newErrors.accountCode = "يرجى اختيار الحساب المحاسبي";
    }

    if (!companyId) {
      newErrors.company = "تعذر تحديد الشركة";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("يرجى مراجعة الحقول المطلوبة");
      return false;
    }

    return true;
  };

  // =====================================
  // حفظ المورد
  // =====================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saving || !validate()) return;

    try {
      setSaving(true);

      // التأكد من عدم تكرار اسم المورد داخل الشركة
      const suppliersResponse = await api.get("/suppliers", {
        params: { companyId },
      });

      const duplicate = suppliersResponse.data.some(
        (supplier: AnyRecord) =>
          supplier.name?.trim().toLowerCase() ===
          form.name.trim().toLowerCase(),
      );

      if (duplicate) {
        toast.error("يوجد مورد بنفس الاسم في هذه الشركة");
        return;
      }

      const now = new Date().toISOString();

      const supplier = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        companyId,

        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),

        // ربط المورد بحساب الموردين
        accountCode: form.accountCode,
        accountName: form.accountName,

        // الرصيد الابتدائي صفر
        balance: 0,

        notes: form.notes.trim(),

        status: "active",
        isActive: true,

        createdAt: now,
        updatedAt: now,
      };

      await api.post("/suppliers", supplier);

      toast.success("تمت إضافة المورد بنجاح");

      router.push("/suppliers");
      router.refresh();
    } catch (error: any) {
      console.error("Create supplier error:", error);

      toast.error(
        error?.response?.data?.message || "حدث خطأ أثناء إضافة المورد",
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // التحميل
  // =====================================

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[60vh] items-center justify-center">
        <FiRefreshCw className="animate-spin text-2xl text-[#0E1F33]" />
      </div>
    );
  }

  // =====================================
  // الواجهة
  // =====================================

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-50 p-3 text-sm text-gray-800 sm:p-6"
    >
      {/* رأس الصفحة */}

      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/suppliers")}
              className="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-100"
            >
              <FiArrowRight size={17} />
            </button>

            <div>
              <h1 className="text-xl font-bold text-gray-900">
                إضافة مورد جديد
              </h1>

              <p className="mt-1 text-xs text-gray-500">
                تسجيل بيانات المورد وربطه بالحسابات المحاسبية
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-2">
          <p className="text-[11px] text-gray-500">الشركة</p>

          <p className="font-semibold text-[#0E1F33]">
            {companyName || `الشركة ${companyId}`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* بيانات المورد */}

          <div className="space-y-5 lg:col-span-2">
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 font-bold text-gray-900">
                <FiUser className="text-[#0E1F33]" />
                المعلومات الأساسية
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-gray-600">
                    اسم المورد
                    <span className="mr-1 text-red-500">*</span>
                  </label>

                  <input
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="أدخل اسم المورد"
                    className={`h-11 w-full rounded-lg border px-3 outline-none transition focus:border-[#0E1F33] ${
                      errors.name ? "border-red-400" : "border-gray-200"
                    }`}
                  />

                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
                    <FiPhone />
                    رقم الهاتف
                  </label>

                  <input
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="مثال: 777000000"
                    type="tel"
                    className="h-11 w-full rounded-lg border border-gray-200 px-3 outline-none focus:border-[#0E1F33]"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
                    <FiMapPin />
                    العنوان
                  </label>

                  <input
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="المدينة أو العنوان"
                    className="h-11 w-full rounded-lg border border-gray-200 px-3 outline-none focus:border-[#0E1F33]"
                  />
                </div>
              </div>
            </section>

            {/* الحساب المحاسبي */}

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 font-bold text-gray-900">
                <FiCreditCard className="text-[#0E1F33]" />
                الربط المحاسبي
              </h2>

              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-600">
                  حساب المورد
                  <span className="mr-1 text-red-500">*</span>
                </label>

                <select
                  value={
                    accounts.find(
                      (account) => String(account.code) === form.accountCode,
                    )?.id || ""
                  }
                  onChange={(e) => handleAccountChange(e.target.value)}
                  className={`h-11 w-full rounded-lg border bg-white px-3 outline-none focus:border-[#0E1F33] ${
                    errors.accountCode ? "border-red-400" : "border-gray-200"
                  }`}
                >
                  <option value="">اختر الحساب المحاسبي</option>

                  {accounts
                    .filter((account) => String(account.code).startsWith("21"))
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                </select>

                {errors.accountCode && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.accountCode}
                  </p>
                )}

                {form.accountCode && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-800">
                    <FiCheckCircle />
                    الحساب المحدد: {form.accountCode} - {form.accountName}
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs leading-6 text-blue-900">
                <strong>ملاحظة محاسبية:</strong>
                <br />
                ربط المورد بحساب الموردين يسمح بتسجيل المشتريات الآجلة عليه. لا
                يتم إنشاء قيد محاسبي عند إنشاء المورد نفسه.
              </div>
            </section>

            {/* الملاحظات */}

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
                <FiFileText />
                ملاحظات إضافية
              </h2>

              <textarea
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={4}
                placeholder="أي معلومات إضافية عن المورد..."
                className="w-full resize-none rounded-lg border border-gray-200 p-3 outline-none focus:border-[#0E1F33]"
              />
            </section>
          </div>

          {/* ملخص المورد */}

          <div className="space-y-4">
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-bold text-gray-900">ملخص المورد</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500">اسم المورد</p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {form.name || "لم يتم الإدخال"}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500">رقم الهاتف</p>

                  <p className="mt-1 font-semibold">{form.phone || "—"}</p>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500">الحساب المحاسبي</p>

                  <p className="mt-1 font-semibold">
                    {form.accountCode
                      ? `${form.accountCode} - ${form.accountName}`
                      : "لم يتم الاختيار"}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500">الرصيد الابتدائي</p>

                  <p className="mt-1 text-lg font-bold text-[#0E1F33]">0.00</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2 text-amber-800">
                <FiAlertCircle className="mt-0.5 shrink-0" />

                <div>
                  <p className="font-bold">تنبيه</p>

                  <p className="mt-1 text-xs leading-6">
                    تأكد من صحة بيانات المورد والحساب المحاسبي. ستُستخدم هذه
                    البيانات عند إنشاء فواتير الشراء.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* أزرار الحفظ */}

        <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/suppliers")}
            className="h-11 rounded-lg border border-gray-200 bg-white px-6 font-semibold hover:bg-gray-50"
          >
            إلغاء
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0E1F33] px-8 font-semibold text-white transition hover:bg-[#193653] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}

            {saving ? "جارٍ الحفظ..." : "حفظ المورد"}
          </button>
        </div>
      </form>
    </div>
  );
}
