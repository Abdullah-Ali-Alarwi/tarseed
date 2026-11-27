"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Option = {
  id: string;
  name: string;
  code?: string | null;
  symbol?: string | null;
  isDefault?: boolean | null;
};

type ProductForm = {
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  unitId: string;
  warehouseId: string;
  purchasePrice: string;
  sellingPrice: string;
  currentStock: string;
  minStock: string;
  description: string;
  trackInventory: boolean;
  status: string;
};

const initialForm: ProductForm = {
  name: "",
  sku: "",
  barcode: "",
  categoryId: "",
  unitId: "",
  warehouseId: "",
  purchasePrice: "0",
  sellingPrice: "0",
  currentStock: "0",
  minStock: "0",
  description: "",
  trackInventory: true,
  status: "active",
};

export default function NewProductPage() {
  const router = useRouter();

  const [companyId, setCompanyId] = useState("");
  const [categories, setCategories] = useState<Option[]>([]);
  const [units, setUnits] = useState<Option[]>([]);
  const [warehouses, setWarehouses] = useState<Option[]>([]);

  const [form, setForm] = useState<ProductForm>(initialForm);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUserAndOptions = async () => {
      try {
        const storedUser = localStorage.getItem("authUser");

        if (!storedUser) {
          toast.error("يرجى تسجيل الدخول أولاً");
          setLoadingData(false);
          return;
        }

        const user = JSON.parse(storedUser);

        if (!user.companyId) {
          toast.error("لم يتم العثور على الشركة المرتبطة بالمستخدم");
          setLoadingData(false);
          return;
        }

        if (user.type === "platform") {
          toast.error("لا يمكن لمستخدم المنصة إضافة أصناف");
          setLoadingData(false);
          return;
        }

        setCompanyId(user.companyId);

        const [categoriesResult, unitsResult, warehousesResult] =
          await Promise.all([
            supabase
              .from("categories")
              .select("id, name, code, status")
              .eq("companyId", user.companyId)
              .eq("status", "active")
              .order("name"),

            supabase
              .from("units")
              .select("id, name, symbol, status, isDefault")
              .eq("companyId", user.companyId)
              .eq("status", "active")
              .order("name"),

            supabase
              .from("warehouses")
              .select("id, name, code, status, isDefault")
              .eq("companyId", user.companyId)
              .eq("status", "active")
              .order("name"),
          ]);

        if (categoriesResult.error) throw categoriesResult.error;
        if (unitsResult.error) throw unitsResult.error;
        if (warehousesResult.error) throw warehousesResult.error;

        const loadedCategories = categoriesResult.data ?? [];
        const loadedUnits = unitsResult.data ?? [];
        const loadedWarehouses = warehousesResult.data ?? [];

        setCategories(loadedCategories);
        setUnits(loadedUnits);
        setWarehouses(loadedWarehouses);

        const defaultUnit =
          loadedUnits.find((unit) => unit.isDefault) ?? loadedUnits[0];

        const defaultWarehouse =
          loadedWarehouses.find((warehouse) => warehouse.isDefault) ??
          loadedWarehouses[0];

        setForm((previous) => ({
          ...previous,
          unitId: defaultUnit?.id ?? "",
          warehouseId: defaultWarehouse?.id ?? "",
        }));
      } catch (error) {
        console.error("Load product options error:", error);
        toast.error("حدث خطأ أثناء تحميل بيانات الأصناف");
      } finally {
        setLoadingData(false);
      }
    };

    loadUserAndOptions();
  }, []);

  const updateField = (field: keyof ProductForm, value: string | boolean) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error("يرجى إدخال اسم الصنف");
      return false;
    }

    if (!form.unitId) {
      toast.error("يرجى اختيار وحدة الصنف");
      return false;
    }

    if (!form.warehouseId && form.trackInventory) {
      toast.error("يرجى اختيار المستودع");
      return false;
    }

    const numericFields = [
      { label: "سعر الشراء", value: form.purchasePrice },
      { label: "سعر البيع", value: form.sellingPrice },
      { label: "الرصيد الحالي", value: form.currentStock },
      { label: "الحد الأدنى للمخزون", value: form.minStock },
    ];

    for (const field of numericFields) {
      const value = Number(field.value);

      if (!Number.isFinite(value) || value < 0) {
        toast.error(
          `${field.label} يجب أن يكون رقمًا صحيحًا أو عشريًا غير سالب`,
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm() || !companyId) return;

    setSaving(true);

    try {
      const selectedCategory = categories.find(
        (category) => category.id === form.categoryId,
      );

      const selectedUnit = units.find((unit) => unit.id === form.unitId);

      const selectedWarehouse = warehouses.find(
        (warehouse) => warehouse.id === form.warehouseId,
      );

      const productId = crypto.randomUUID();
      const itemId = crypto.randomUUID();
      const now = new Date().toISOString();

      const productData = {
        id: productId,
        companyId,

        name: form.name.trim(),
        sku: form.sku.trim() || null,
        barcode: form.barcode.trim() || null,

        categoryId: selectedCategory?.id ?? null,
        categoryName: selectedCategory?.name ?? null,

        unitId: selectedUnit?.id ?? null,
        unitName: selectedUnit?.name ?? null,

        warehouseId: form.trackInventory
          ? (selectedWarehouse?.id ?? null)
          : null,

        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),

        currentStock: form.trackInventory ? Number(form.currentStock) : 0,

        minStock: form.trackInventory ? Number(form.minStock) : 0,

        description: form.description.trim() || null,
        status: form.status,
        trackInventory: form.trackInventory,

        itemId,
        createdAt: now,
        updatedAt: now,

        extra: {
          id: productId,
          itemId,
          companyId,

          name: form.name.trim(),
          sku: form.sku.trim() || null,
          barcode: form.barcode.trim() || null,

          categoryId: selectedCategory?.id ?? null,
          categoryName: selectedCategory?.name ?? null,

          unitId: selectedUnit?.id ?? null,
          unitName: selectedUnit?.name ?? null,

          warehouseId: form.trackInventory
            ? (selectedWarehouse?.id ?? null)
            : null,

          purchasePrice: Number(form.purchasePrice),
          sellingPrice: Number(form.sellingPrice),

          currentStock: form.trackInventory ? Number(form.currentStock) : 0,

          minStock: form.trackInventory ? Number(form.minStock) : 0,

          description: form.description.trim(),
          trackInventory: form.trackInventory,
          status: form.status,
          createdAt: now,
        },
      };

      const { error } = await supabase.from("products").insert(productData);

      if (error) throw error;

      toast.success("تمت إضافة الصنف بنجاح");

      router.push("/erp/products");
      router.refresh();
    } catch (error) {
      console.error("Create product error:", error);

      const message =
        error instanceof Error ? error.message : "حدث خطأ أثناء حفظ الصنف";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
          <p className="text-sm">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* العنوان */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <Link href="/erp/products" className="hover:text-slate-700">
              الأصناف
            </Link>
            <span>/</span>
            <span className="text-slate-600">إضافة صنف جديد</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800">إضافة صنف جديد</h1>

          <p className="mt-1 text-sm text-slate-500">
            أدخل بيانات الصنف والأسعار وإعدادات المخزون
          </p>
        </div>

        <Link
          href="/erp/products"
          className="w-fit rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          العودة للأصناف
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* البيانات الأساسية */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-800">البيانات الأساسية</h2>
            <p className="mt-1 text-xs text-slate-400">
              المعلومات التعريفية للصنف
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 xl:grid-cols-3">
            <Field label="اسم الصنف" required>
              <input
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="مثال: عسل سدر"
                className={inputClass}
              />
            </Field>

            <Field label="كود الصنف (SKU)">
              <input
                value={form.sku}
                onChange={(e) => updateField("sku", e.target.value)}
                placeholder="مثال: PRD-001"
                className={inputClass}
              />
            </Field>

            <Field label="الباركود">
              <input
                dir="ltr"
                value={form.barcode}
                onChange={(e) => updateField("barcode", e.target.value)}
                placeholder="2000000000001"
                className={inputClass}
              />
            </Field>

            <Field label="التصنيف">
              <select
                value={form.categoryId}
                onChange={(e) => updateField("categoryId", e.target.value)}
                className={inputClass}
              >
                <option value="">بدون تصنيف</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {category.code ? ` (${category.code})` : ""}
                  </option>
                ))}
              </select>

              {categories.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  لا توجد تصنيفات نشطة لهذه الشركة.
                </p>
              )}
            </Field>

            <Field label="وحدة القياس" required>
              <select
                required
                value={form.unitId}
                onChange={(e) => updateField("unitId", e.target.value)}
                className={inputClass}
              >
                <option value="">اختر الوحدة</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                    {unit.symbol ? ` (${unit.symbol})` : ""}
                  </option>
                ))}
              </select>

              {units.length === 0 && (
                <p className="mt-1 text-xs text-red-600">
                  لا توجد وحدات نشطة. أضف وحدة أولاً.
                </p>
              )}
            </Field>

            <Field label="المستودع">
              <select
                value={form.warehouseId}
                onChange={(e) => updateField("warehouseId", e.target.value)}
                disabled={!form.trackInventory}
                className={inputClass}
              >
                <option value="">اختر المستودع</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                    {warehouse.code ? ` (${warehouse.code})` : ""}
                  </option>
                ))}
              </select>

              {form.trackInventory && warehouses.length === 0 && (
                <p className="mt-1 text-xs text-red-600">
                  لا توجد مستودعات نشطة لهذه الشركة.
                </p>
              )}
            </Field>
          </div>
        </section>

        {/* الأسعار */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-800">الأسعار</h2>
            <p className="mt-1 text-xs text-slate-400">
              تحديد أسعار شراء وبيع الصنف
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            <Field label="سعر الشراء">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.purchasePrice}
                  onChange={(e) => updateField("purchasePrice", e.target.value)}
                  className={`${inputClass} pl-14`}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  ر.ي
                </span>
              </div>
            </Field>

            <Field label="سعر البيع">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={(e) => updateField("sellingPrice", e.target.value)}
                  className={`${inputClass} pl-14`}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  ر.ي
                </span>
              </div>
            </Field>
          </div>
        </section>

        {/* المخزون */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-800">إعدادات المخزون</h2>
            <p className="mt-1 text-xs text-slate-400">
              تحديد طريقة متابعة كمية الصنف
            </p>
          </div>

          <div className="space-y-5 p-5">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.trackInventory}
                onChange={(e) =>
                  updateField("trackInventory", e.target.checked)
                }
                className="h-4 w-4 accent-slate-800"
              />

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  تتبع المخزون
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  تفعيل متابعة الكميات وحركات المخزون لهذا الصنف
                </p>
              </div>
            </label>

            {form.trackInventory && (
              <div className="grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 md:grid-cols-2">
                <Field label="الرصيد الحالي / الافتتاحي">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.currentStock}
                    onChange={(e) =>
                      updateField("currentStock", e.target.value)
                    }
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    الكمية الحالية التي سيتم تسجيلها عند إنشاء الصنف.
                  </p>
                </Field>

                <Field label="الحد الأدنى للمخزون">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minStock}
                    onChange={(e) => updateField("minStock", e.target.value)}
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    يظهر تنبيه عند وصول الكمية إلى هذا الحد أو أقل.
                  </p>
                </Field>
              </div>
            )}

            {!form.trackInventory && (
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                لن تتم متابعة الكميات لهذا الصنف، وسيتم حفظ رصيده وحده الأدنى
                بصفر.
              </div>
            )}
          </div>
        </section>

        {/* معلومات إضافية */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-800">معلومات إضافية</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            <Field label="حالة الصنف">
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className={inputClass}
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </Field>

            <Field label="الوصف">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="أدخل وصفًا اختياريًا للصنف..."
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        {/* الأزرار */}
        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Link
            href="/erp/products"
            className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-center text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            إلغاء
          </Link>

          <button
            type="submit"
            disabled={
              saving ||
              !companyId ||
              !form.unitId ||
              (form.trackInventory && !form.warehouseId)
            }
            className="rounded-lg bg-[#0E1F33] px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "جاري الحفظ..." : "حفظ الصنف"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="mr-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
