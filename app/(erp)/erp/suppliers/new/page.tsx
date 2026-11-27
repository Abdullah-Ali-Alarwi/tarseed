"use client";

import { useCallback, useEffect, useState } from "react";
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

import { supabase } from "@/lib/supabase";
import { createSupplier, getSuppliers } from "@/lib/api/suppliers";

type AnyRecord = Record<string, any>;

export default function NewSupplierPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [currentUser, setCurrentUser] = useState<AnyRecord | null>(null);

  const [supplierParentAccount, setSupplierParentAccount] =
    useState<AnyRecord | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // =====================================
  // جلب حساب الموردين الرئيسي 2101
  // =====================================

  const getSupplierParentAccount = async (
    currentCompanyId: string,
  ): Promise<AnyRecord> => {
    const { data: account, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("companyId", currentCompanyId)
      .eq("code", "2101")
      .eq("name", "الموردون")
      .maybeSingle();

    if (error) {
      console.error("Get supplier parent account error:", error);
      throw new Error(`تعذر جلب حساب الموردين: ${error.message}`);
    }

    if (!account) {
      throw new Error(
        "حساب الموردين 2101 غير موجود لهذه الشركة. يرجى مراجعة شجرة الحسابات.",
      );
    }

    if (account.type !== "liability" || account.nature !== "credit") {
      throw new Error(
        "خصائص حساب الموردين غير صحيحة. يجب أن يكون liability و credit.",
      );
    }

    if (account.isGroup !== true) {
      throw new Error("حساب الموردين 2101 يجب أن يكون حسابًا تجميعيًا.");
    }

    if (account.status !== "active" || account.isActive !== true) {
      throw new Error("حساب الموردين 2101 غير نشط.");
    }

    if (account.extra?.allowPosting === true) {
      throw new Error("حساب الموردين الرئيسي يجب ألا يقبل الترحيل المباشر.");
    }

    return account;
  };

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

      if (!authUser.companyId) {
        throw new Error("المستخدم غير مرتبط بشركة");
      }

      const currentCompanyId = String(authUser.companyId);

      setCurrentUser(authUser);
      setCompanyId(currentCompanyId);

      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", currentCompanyId)
        .maybeSingle();

      if (companyError) {
        console.error("Get company error:", companyError);
        throw new Error("تعذر جلب بيانات الشركة");
      }

      if (!company) {
        throw new Error("لم يتم العثور على الشركة المرتبطة بالمستخدم");
      }

      setCompanyName(company.name || "");

      const parentAccount = await getSupplierParentAccount(currentCompanyId);

      setSupplierParentAccount(parentAccount);
    } catch (error) {
      console.error("Load supplier form error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "تعذر تحميل بيانات الشركة والحسابات",
      );
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
  // التحقق من البيانات
  // =====================================

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = "اسم المورد مطلوب";
    }

    if (!companyId) {
      newErrors.company = "تعذر تحديد الشركة";
    }

    if (!supplierParentAccount) {
      newErrors.account = "حساب الموردين الرئيسي غير موجود";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("يرجى مراجعة الحقول المطلوبة");
      return false;
    }

    return true;
  };

  // =====================================
  // إنشاء كود الحساب الفرعي
  // النمط: 2101001, 2101002, 2101003
  // =====================================

  const generateSupplierAccountCode = async (
    parentAccount: AnyRecord,
  ): Promise<string> => {
    const parentCode = String(parentAccount.code);

    const { data: children, error } = await supabase
      .from("accounts")
      .select("code")
      .eq("companyId", companyId)
      .eq("parentId", String(parentAccount.id));

    if (error) {
      console.error("Get supplier child accounts error:", error);

      throw new Error("تعذر قراءة الحسابات الفرعية للموردين");
    }

    let maxNumber = 0;

    (children || []).forEach((account: AnyRecord) => {
      const code = String(account.code || "");

      if (!code.startsWith(parentCode)) return;

      const suffix = code.substring(parentCode.length);

      // نقبل فقط الأرقام الموجودة بعد 2101
      if (!/^\d+$/.test(suffix)) return;

      const number = Number(suffix);

      if (Number.isInteger(number) && number > maxNumber) {
        maxNumber = number;
      }
    });

    return `${parentCode}${String(maxNumber + 1).padStart(3, "0")}`;
  };

  // =====================================
  // إنشاء الحساب المحاسبي للمورد
  // =====================================

  const createSupplierAccount = async (
    supplierId: string,
    supplierName: string,
  ): Promise<AnyRecord> => {
    if (!supplierParentAccount) {
      throw new Error("حساب الموردين الرئيسي غير موجود");
    }

    const parentAccount = supplierParentAccount;

    const accountCode = await generateSupplierAccountCode(parentAccount);

    const now = new Date().toISOString();

    const newAccount = {
      id: crypto.randomUUID(),

      companyId,

      code: accountCode,
      name: supplierName,

      type: "liability",
      nature: "credit",

      parentId: String(parentAccount.id),

      isGroup: false,
      isSystem: false,
      systemKey: null,

      status: "active",
      isActive: true,

      extra: {
        level: Number(parentAccount.extra?.level || 3) + 1,

        balance: 0,

        entityId: supplierId,
        entityType: "supplier",

        parentCode: "2101",

        accountType: "liability",

        allowPosting: true,

        description: `الحساب المحاسبي الخاص بالمورد: ${supplierName}`,
      },

      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from("accounts")
      .insert(newAccount)
      .select()
      .single();

    if (error) {
      console.error("Create supplier account error:", error);

      throw new Error(`تعذر إنشاء الحساب المحاسبي: ${error.message}`);
    }

    return data;
  };

  // =====================================
  // حفظ المورد والحساب المحاسبي
  // =====================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saving || !validate()) return;

    let createdAccountId = "";

    try {
      setSaving(true);

      const supplierName = form.name.trim();

      // فحص تكرار اسم المورد
      const existingSuppliers = await getSuppliers(companyId);

      const duplicate = existingSuppliers.some(
        (supplier: AnyRecord) =>
          supplier.name?.trim().toLowerCase() === supplierName.toLowerCase(),
      );

      if (duplicate) {
        toast.error("يوجد مورد بنفس الاسم في هذه الشركة");
        return;
      }

      // إنشاء معرف المورد أولًا
      const supplierId = crypto.randomUUID();

      // إنشاء الحساب المحاسبي وربطه بمعرف المورد
      const account = await createSupplierAccount(supplierId, supplierName);

      createdAccountId = String(account.id);

      const now = new Date().toISOString();

      // إنشاء سجل المورد
      const supplier = {
        id: supplierId,

        companyId,

        name: supplierName,
        phone: form.phone.trim(),
        address: form.address.trim(),

        accountId: String(account.id),
        accountCode: String(account.code),
        accountName: String(account.name),

        parentAccountId: String(supplierParentAccount.id),
        parentAccountCode: String(supplierParentAccount.code),

        balance: 0,

        notes: form.notes.trim(),

        status: "active",
        isActive: true,

        createdBy:
          currentUser?.name ||
          currentUser?.fullName ||
          currentUser?.username ||
          "",

        createdById: String(currentUser?.id || ""),

        createdAt: now,
        updatedAt: now,
      };

      await createSupplier(supplier);

      // نجاح العملية
      createdAccountId = "";

      toast.success("تمت إضافة المورد وإنشاء حسابه المحاسبي بنجاح");

      router.push("/erp/suppliers");
      router.refresh();
    } catch (error: any) {
      console.error("Create supplier error:", error);

      // محاولة التراجع عن الحساب إذا فشل إنشاء المورد
      if (createdAccountId) {
        const { error: deleteError } = await supabase
          .from("accounts")
          .delete()
          .eq("id", createdAccountId)
          .eq("companyId", companyId);

        if (deleteError) {
          console.error("Rollback supplier account error:", deleteError);

          toast.error(
            "فشل إنشاء المورد، وتعذر حذف الحساب الذي أُنشئ. يرجى مراجعة شجرة الحسابات.",
          );

          return;
        }
      }

      toast.error(error?.message || "حدث خطأ أثناء إضافة المورد");
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // شاشة التحميل
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/erp/suppliers")}
            className="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-100"
          >
            <FiArrowRight size={17} />
          </button>

          <div>
            <h1 className="text-xl font-bold text-gray-900">إضافة مورد جديد</h1>

            <p className="mt-1 text-xs text-gray-500">
              تسجيل بيانات المورد وإنشاء حسابه في شجرة الحسابات
            </p>
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

            {/* الربط المحاسبي */}

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 font-bold text-gray-900">
                <FiCreditCard className="text-[#0E1F33]" />
                الربط المحاسبي
              </h2>

              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FiCheckCircle className="text-green-600" />
                  الحساب الرئيسي
                </div>

                <p className="mt-2 font-bold text-[#0E1F33]">
                  {supplierParentAccount?.code} - {supplierParentAccount?.name}
                </p>

                <div className="my-3 border-t border-dashed border-gray-200" />

                <div className="text-xs text-gray-500">
                  الحساب الفرعي الذي سيتم إنشاؤه
                </div>

                <p className="mt-2 font-semibold text-gray-800">
                  {form.name || "اسم المورد"}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  سيتم إنشاء كود الحساب تلقائيًا مثل 2101001.
                </p>
              </div>

              <div className="mt-4 rounded-lg bg-green-50 p-3 text-xs leading-6 text-green-900">
                <strong>ملاحظة محاسبية:</strong>
                <br />
                عند حفظ المورد، ينشئ النظام حسابًا فرعيًا مستقلًا تحت حساب
                الموردين 2101، ويربط الحساب بسجل المورد. لا يتم إنشاء قيد محاسبي
                عند إضافة المورد.
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
                  <p className="text-xs text-gray-500">الحساب الرئيسي</p>

                  <p className="mt-1 font-semibold">
                    {supplierParentAccount
                      ? `${supplierParentAccount.code} - ${supplierParentAccount.name}`
                      : "غير محدد"}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500">الحساب الفرعي</p>

                  <p className="mt-1 font-semibold text-[#0E1F33]">
                    {form.name || "سيتم إنشاؤه عند الحفظ"}
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
                    تأكد من صحة بيانات المورد. سيتم إنشاء حساب محاسبي مستقل له
                    داخل شجرة الحسابات، وستُستخدم بيانات الحساب عند إنشاء فواتير
                    الشراء.
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
            onClick={() => router.push("/erp/suppliers")}
            className="h-11 rounded-lg border border-gray-200 bg-white px-6 font-semibold hover:bg-gray-50"
          >
            إلغاء
          </button>

          <button
            type="submit"
            disabled={saving || !supplierParentAccount}
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
