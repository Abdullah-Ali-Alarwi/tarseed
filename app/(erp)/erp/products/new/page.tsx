"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  FiArrowRight,
  FiPackage,
  FiLayers,
  FiBox,
  FiHash,
  FiDollarSign,
  FiSave,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiBarChart,
  FiAward,
} from "react-icons/fi";

/* =====================================================
   API
===================================================== */

const API_URL = "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* =====================================================
   TYPES
===================================================== */

interface Category {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  status?: string;
}

interface Unit {
  id: string;
  companyId: string;
  name: string;
  symbol: string;
  status?: string;
}

interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  status?: string;
}

interface Item {
  id: string;
  companyId: string;
  name: string;
  sku?: string;
  barcode?: string;
  categoryId: string;
  categoryName?: string;
  unitId: string;
  unitName?: string;
  status?: string;
}

interface ProductForm {
  itemId: string;
  sku: string;
  barcode: string;
  warehouseId: string;
  purchasePrice: string;
  sellingPrice: string;
  currentStock: string;
  minStock: string;
  description: string;
}

/* =====================================================
   COMPONENT
===================================================== */

export default function NewProductPage() {
  const router = useRouter();

  const [companyId, setCompanyId] = useState("");

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ProductForm>({
    itemId: "",
    sku: "",
    barcode: "",
    warehouseId: "",
    purchasePrice: "",
    sellingPrice: "",
    currentStock: "0",
    minStock: "0",
    description: "",
  });

  /* =====================================================
     LOAD USER AND DATA
  ===================================================== */

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const cookies = document.cookie.split("; ");

      const getCookie = (name: string) => {
        const cookie = cookies.find((item) => item.startsWith(`${name}=`));

        return cookie
          ? decodeURIComponent(cookie.substring(name.length + 1))
          : "";
      };

      const userType = getCookie("type");

      if (userType === "platform") {
        toast.error("هذا القسم مخصص لمستخدمي الشركات");
        return;
      }

      const currentCompanyId = getCookie("companyId");

      if (!currentCompanyId) {
        toast.error("لم يتم العثور على الشركة المرتبطة بالمستخدم");
        return;
      }

      setCompanyId(currentCompanyId);

      await loadData(currentCompanyId);
    } catch (error) {
      console.error("Initialize error:", error);
      toast.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     LOAD DATA
  ===================================================== */

  const loadData = async (currentCompanyId: string) => {
    try {
      const [itemsRes, categoriesRes, unitsRes, warehousesRes] =
        await Promise.all([
          api.get("/products", {
            params: { companyId: currentCompanyId },
          }),

          api.get("/categories", {
            params: { companyId: currentCompanyId },
          }),

          api.get("/units", {
            params: { companyId: currentCompanyId },
          }),

          api.get("/warehouses", {
            params: { companyId: currentCompanyId },
          }),
        ]);

      setItems(
        itemsRes.data.filter(
          (item: Item) =>
            item.companyId === currentCompanyId && item.status !== "inactive",
        ),
      );

      setCategories(
        categoriesRes.data.filter(
          (item: Category) =>
            item.companyId === currentCompanyId && item.status !== "inactive",
        ),
      );

      setUnits(
        unitsRes.data.filter(
          (item: Unit) =>
            item.companyId === currentCompanyId && item.status !== "inactive",
        ),
      );

      setWarehouses(
        warehousesRes.data.filter(
          (item: Warehouse) =>
            item.companyId === currentCompanyId && item.status !== "inactive",
        ),
      );
    } catch (error) {
      console.error("Load data error:", error);
      toast.error("تعذر تحميل بيانات الأصناف والمستودعات");
    }
  };

  /* =====================================================
     SELECTED ITEM
  ===================================================== */

  const selectedItem = useMemo(
    () => items.find((item) => String(item.id) === form.itemId),
    [items, form.itemId],
  );

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) => String(category.id) === String(selectedItem?.categoryId),
      ),
    [categories, selectedItem],
  );

  const selectedUnit = useMemo(
    () =>
      units.find((unit) => String(unit.id) === String(selectedItem?.unitId)),
    [units, selectedItem],
  );

  /* =====================================================
     GENERATE SKU
  ===================================================== */

  const generateSKU = () => {
    const maxNumber = items.reduce((max, item) => {
      const match = item.sku?.match(/^PRD-(\d+)$/);

      if (!match) return max;

      return Math.max(max, Number(match[1]));
    }, 0);

    return `PRD-${String(maxNumber + 1).padStart(4, "0")}`;
  };

  /* =====================================================
     HANDLE ITEM CHANGE
  ===================================================== */

  const handleItemChange = (itemId: string) => {
    const item = items.find((product) => String(product.id) === itemId);

    setForm((prev) => ({
      ...prev,
      itemId,
      sku: item?.sku || generateSKU(),
      barcode: item?.barcode || "",
    }));
  };

  /* =====================================================
     HANDLE INPUT CHANGE
  ===================================================== */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================================
     VALIDATION
  ===================================================== */

  const validateForm = () => {
    if (!form.itemId) {
      toast.error("يرجى اختيار الصنف");
      return false;
    }

    if (!form.warehouseId) {
      toast.error("يرجى اختيار المستودع");
      return false;
    }

    if (form.purchasePrice === "" || form.sellingPrice === "") {
      toast.error("يرجى إدخال أسعار الشراء والبيع");
      return false;
    }

    const purchasePrice = Number(form.purchasePrice);
    const sellingPrice = Number(form.sellingPrice);
    const currentStock = Number(form.currentStock);
    const minStock = Number(form.minStock);

    if (
      [purchasePrice, sellingPrice, currentStock, minStock].some(
        (value) => !Number.isFinite(value) || value < 0,
      )
    ) {
      toast.error("تأكد من صحة القيم الرقمية");
      return false;
    }

    return true;
  };

  /* =====================================================
     SAVE
  ===================================================== */

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!companyId) {
      toast.error("الشركة غير محددة");
      return;
    }

    if (!validateForm()) return;

    if (!selectedItem) {
      toast.error("الصنف المحدد غير موجود");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        companyId,

        // الصنف المختار
        itemId: selectedItem.id,
        name: selectedItem.name,

        // المجموعة والوحدة من الصنف
        categoryId: selectedItem.categoryId,
        categoryName: selectedCategory?.name || selectedItem.categoryName || "",

        unitId: selectedItem.unitId,
        unitName: selectedUnit?.name || selectedItem.unitName || "",

        // بيانات المنتج
        sku: form.sku,
        barcode: form.barcode,
        warehouseId: form.warehouseId,

        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),

        currentStock: Number(form.currentStock),
        minStock: Number(form.minStock),

        description: form.description.trim(),

        status: "active",
        createdAt: new Date().toISOString(),
      };

      await api.post("/products", payload);

      toast.success("تمت إضافة المنتج بنجاح");

      router.push("/erp/products");
      router.refresh();
    } catch (error) {
      console.error("Save product error:", error);
      toast.error("حدث خطأ أثناء حفظ المنتج");
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     STYLES
  ===================================================== */

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-blue-600">
          <FiRefreshCw className="animate-spin text-2xl" />
          <span className="text-sm font-medium">جارٍ تحميل البيانات...</span>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div
        dir="rtl"
        className="m-5 rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
      >
        <FiAlertCircle className="mx-auto mb-3 text-3xl text-red-500" />
        <h2 className="font-bold text-red-700">لم يتم العثور على الشركة</h2>
        <p className="mt-2 text-sm text-red-600">
          تحقق من بيانات المستخدم المسجل ووجود companyId.
        </p>
      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div dir="rtl" className="min-h-screen space-y-6 p-4 md:p-6">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/erp/products"
              className="transition hover:text-blue-600"
            >
              المنتجات
            </Link>

            <span>/</span>

            <span className="font-medium text-blue-600">إضافة منتج</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800">إضافة منتج جديد</h1>

          <p className="mt-2 text-sm text-slate-500">
            اختر الصنف وحدد بيانات المنتج والمخزون والأسعار.
          </p>
        </div>

        <Link
          href="/erp/products"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <FiArrowRight />
          العودة للمنتجات
        </Link>
      </div>

      {/* Main Form */}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Item Information */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FiPackage size={21} />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">بيانات الصنف</h2>
              <p className="mt-1 text-xs text-slate-500">
                اختر الصنف من الأصناف المسجلة مسبقاً.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            {/* Item Select */}

            <div className="md:col-span-2">
              <label className={labelClass}>
                اسم المنتج <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <FiPackage className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <select
                  name="itemId"
                  value={form.itemId}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className={`${inputClass} pr-11`}
                  required
                >
                  <option value="">اختر الصنف</option>

                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.sku ? ` — ${item.sku}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {items.length === 0 && (
                <p className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                  <FiAlertCircle />
                  لا توجد أصناف مسجلة. أضف الأصناف أولاً من إعدادات المخزون.
                </p>
              )}
            </div>

            {/* Category */}

            <div>
              <label className={labelClass}>المجموعة</label>

              <div className="relative">
                <FiLayers className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  value={selectedCategory?.name || ""}
                  readOnly
                  placeholder="تظهر تلقائياً بعد اختيار الصنف"
                  className={`${inputClass} bg-slate-50 pr-11`}
                />
              </div>
            </div>

            {/* Unit */}

            <div>
              <label className={labelClass}>وحدة القياس</label>

              <div className="relative">
                <FiBox className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  value={selectedUnit?.name || ""}
                  readOnly
                  placeholder="تظهر تلقائياً بعد اختيار الصنف"
                  className={`${inputClass} bg-slate-50 pr-11`}
                />
              </div>
            </div>

            {/* SKU */}

            <div>
              <label className={labelClass}>رقم المنتج</label>

              <div className="relative">
                <FiHash className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  name="sku"
                  value={form.sku}
                  readOnly
                  className={`${inputClass} bg-slate-50 pr-11 font-mono`}
                  placeholder="يُحدد تلقائياً"
                />
              </div>
            </div>

            {/* Barcode */}

            <div>
              <label className={labelClass}>الباركود</label>

              <div className="relative">
                <FiBarChart className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  name="barcode"
                  value={form.barcode}
                  onChange={handleChange}
                  className={`${inputClass} pr-11`}
                  placeholder="أدخل الباركود"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Warehouse and Stock */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <FiAward size={21} />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">بيانات المخزون</h2>

              <p className="mt-1 text-xs text-slate-500">
                حدد المستودع والكمية الحالية والحد الأدنى.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass}>
                المستودع <span className="text-red-500">*</span>
              </label>

              <select
                name="warehouseId"
                value={form.warehouseId}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">اختر المستودع</option>

                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                    {warehouse.code ? ` (${warehouse.code})` : ""}
                  </option>
                ))}
              </select>

              {warehouses.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  لا توجد مستودعات نشطة لهذه الشركة.
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>الكمية الحالية</label>

              <input
                type="number"
                name="currentStock"
                min="0"
                step="any"
                value={form.currentStock}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>الحد الأدنى للمخزون</label>

              <input
                type="number"
                name="minStock"
                min="0"
                step="any"
                value={form.minStock}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Prices */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <FiDollarSign size={21} />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">الأسعار</h2>

              <p className="mt-1 text-xs text-slate-500">
                حدد سعر الشراء وسعر البيع.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                سعر الشراء <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                name="purchasePrice"
                min="0"
                step="any"
                value={form.purchasePrice}
                onChange={handleChange}
                className={inputClass}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className={labelClass}>
                سعر البيع <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                name="sellingPrice"
                min="0"
                step="any"
                value={form.sellingPrice}
                onChange={handleChange}
                className={inputClass}
                placeholder="0.00"
                required
              />
            </div>

            {form.purchasePrice !== "" && form.sellingPrice !== "" && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 md:col-span-2">
                <p className="text-xs font-medium text-blue-700">فرق السعر</p>

                <p className="mt-1 text-xl font-bold text-blue-800">
                  {(
                    Number(form.sellingPrice) - Number(form.purchasePrice)
                  ).toLocaleString("en-US")}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Description */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className={labelClass}>وصف المنتج</label>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className={inputClass}
            placeholder="أدخل وصفاً أو ملاحظات عن المنتج..."
          />
        </section>

        {/* Actions */}

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Link
            href="/erp/products"
            className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            إلغاء
          </Link>

          <button
            type="submit"
            disabled={saving || items.length === 0 || warehouses.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <FiRefreshCw className="animate-spin" />
                جارٍ الحفظ...
              </>
            ) : (
              <>
                <FiSave />
                حفظ المنتج
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
