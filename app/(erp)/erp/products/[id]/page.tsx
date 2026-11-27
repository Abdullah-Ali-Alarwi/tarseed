"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  companyId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  categoryId: string | null;
  categoryName: string | null;
  unitId: string | null;
  unitName: string | null;
  warehouseId: string | null;
  purchasePrice: number | string | null;
  sellingPrice: number | string | null;
  currentStock: number | string | null;
  minStock: number | string | null;
  description: string | null;
  status: string | null;
  createdAt: string | null;
  trackInventory: boolean | null;
  itemId: string | null;
  extra: Record<string, unknown> | null;
  updatedAt: string | null;
};

const formatNumber = (value: number | string | null | undefined) => {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
};

const formatCurrency = (value: number | string | null | undefined) =>
  `${formatNumber(value)} ر.ي`;

const formatDate = (value: string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [warehouseName, setWarehouseName] = useState("—");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProduct = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError("");

    try {
      const storedUser = localStorage.getItem("authUser");

      if (!storedUser) {
        setError("يرجى تسجيل الدخول أولاً.");
        return;
      }

      const user = JSON.parse(storedUser);

      if (!user.companyId || user.type === "platform") {
        setError("لا يمكن الوصول إلى بيانات هذا الصنف.");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("companyId", user.companyId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setProduct(null);
        return;
      }

      setProduct(data as Product);

      if (data.warehouseId) {
        const { data: warehouse, error: warehouseError } = await supabase
          .from("warehouses")
          .select("id, name")
          .eq("id", data.warehouseId)
          .eq("companyId", user.companyId)
          .maybeSingle();

        if (warehouseError) throw warehouseError;

        setWarehouseName(warehouse?.name ?? "غير محدد");
      } else {
        setWarehouseName("غير محدد");
      }
    } catch (err) {
      console.error("Product details error:", err);
      setError("حدث خطأ أثناء تحميل بيانات الصنف.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const getStockStatus = () => {
    if (!product) return null;

    if (product.trackInventory === false) {
      return {
        label: "غير متتبع",
        className: "bg-slate-100 text-slate-600",
      };
    }

    const stock = Number(product.currentStock ?? 0);
    const minStock = Number(product.minStock ?? 0);

    if (stock <= 0) {
      return {
        label: "نفد المخزون",
        className: "bg-red-50 text-red-600",
      };
    }

    if (stock <= minStock) {
      return {
        label: "مخزون منخفض",
        className: "bg-amber-50 text-amber-700",
      };
    }

    return {
      label: "متوفر",
      className: "bg-emerald-50 text-emerald-700",
    };
  };

  const getProductStatus = () => {
    if (product?.status === "active") {
      return {
        label: "نشط",
        className: "bg-emerald-50 text-emerald-700",
      };
    }

    return {
      label: "غير نشط",
      className: "bg-slate-100 text-slate-600",
    };
  };

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
          <p className="text-sm">جاري تحميل بيانات الصنف...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400">
          !
        </div>

        <h2 className="mt-4 text-xl font-bold text-slate-800">
          {error ? "تعذر تحميل الصنف" : "الصنف غير موجود"}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {error || "لم يتم العثور على الصنف المطلوب ضمن أصناف الشركة الحالية."}
        </p>

        <div className="mt-5 flex gap-2">
          <button
            onClick={loadProduct}
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            إعادة المحاولة
          </button>

          <Link
            href="/erp/products"
            className="rounded-lg bg-[#0E1F33] px-5 py-2.5 text-sm font-medium text-white"
          >
            العودة للأصناف
          </Link>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus();
  const productStatus = getProductStatus();

  const profit =
    Number(product.sellingPrice ?? 0) - Number(product.purchasePrice ?? 0);

  const profitMargin =
    Number(product.sellingPrice ?? 0) > 0
      ? (profit / Number(product.sellingPrice)) * 100
      : 0;

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <Link href="/erp/products" className="hover:text-slate-700">
              الأصناف
            </Link>

            <span>/</span>

            <span className="text-slate-600">تفاصيل الصنف</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">
              {product.name}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${productStatus.className}`}
            >
              {productStatus.label}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            تفاصيل ومعلومات الصنف وإعدادات المخزون
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadProduct}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ↻ تحديث
          </button>

          <Link
            href={`/erp/products/${product.id}/edit`}
            className="rounded-lg bg-[#0E1F33] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            تعديل الصنف
          </Link>
        </div>
      </div>

      {/* بطاقات الأسعار والمخزون */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          title="سعر الشراء"
          value={formatCurrency(product.purchasePrice)}
          icon="↓"
          color="blue"
        />

        <InfoCard
          title="سعر البيع"
          value={formatCurrency(product.sellingPrice)}
          icon="↑"
          color="green"
        />

        <InfoCard
          title="الرصيد الحالي"
          value={
            product.trackInventory === false
              ? "غير متتبع"
              : `${formatNumber(product.currentStock)} ${product.unitName || ""}`
          }
          icon="▦"
          color="purple"
        />

        <InfoCard
          title="الحد الأدنى للمخزون"
          value={
            product.trackInventory === false
              ? "—"
              : `${formatNumber(product.minStock)} ${product.unitName || ""}`
          }
          icon="!"
          color="amber"
        />
      </div>

      {/* معلومات الصنف */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <SectionTitle
          title="المعلومات الأساسية"
          description="البيانات التعريفية للصنف"
        />

        <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:grid-cols-2 xl:grid-cols-3">
          <Detail label="اسم الصنف" value={product.name} />

          <Detail label="كود الصنف" value={product.sku || "—"} />

          <Detail label="الباركود" value={product.barcode || "—"} />

          <Detail
            label="التصنيف"
            value={product.categoryName || "بدون تصنيف"}
          />

          <Detail label="وحدة القياس" value={product.unitName || "—"} />

          <Detail
            label="المستودع"
            value={
              product.trackInventory === false ? "غير مرتبط" : warehouseName
            }
          />

          <Detail
            label="معرف الصنف الداخلي"
            value={product.itemId || "—"}
            direction="ltr"
          />

          <Detail label="تاريخ الإنشاء" value={formatDate(product.createdAt)} />

          <Detail label="آخر تحديث" value={formatDate(product.updatedAt)} />
        </div>
      </section>

      {/* معلومات الأسعار */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <SectionTitle
          title="تفاصيل الأسعار"
          description="معلومات التكلفة وسعر البيع"
        />

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">سعر الشراء</p>
            <p className="mt-2 text-xl font-bold text-slate-800">
              {formatCurrency(product.purchasePrice)}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">سعر البيع</p>
            <p className="mt-2 text-xl font-bold text-slate-800">
              {formatCurrency(product.sellingPrice)}
            </p>
          </div>

          <div className="rounded-lg bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">
              فرق السعر بين البيع والشراء
            </p>

            <p
              className={`mt-2 text-xl font-bold ${
                profit >= 0 ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {formatCurrency(profit)}
            </p>

            <p className="mt-1 text-xs text-emerald-700">
              هامش الربح التقريبي: {formatNumber(profitMargin)}%
            </p>
          </div>
        </div>
      </section>

      {/* حالة المخزون */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <SectionTitle
          title="حالة المخزون"
          description="إعدادات متابعة الكميات"
        />

        <div className="space-y-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-700">تتبع المخزون</p>

              <p className="mt-1 text-xs text-slate-400">
                {product.trackInventory
                  ? "هذا الصنف يخضع لمتابعة المخزون"
                  : "هذا الصنف لا يخضع لمتابعة المخزون"}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                product.trackInventory
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {product.trackInventory ? "مفعل" : "غير مفعل"}
            </span>
          </div>

          {product.trackInventory !== false && (
            <>
              <div className="h-px bg-slate-100" />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-700">
                    حالة توفر المخزون
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    بناءً على الرصيد الحالي والحد الأدنى
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${stockStatus?.className}`}
                >
                  {stockStatus?.label}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">الرصيد الحالي</p>

                  <p className="mt-2 text-xl font-bold text-slate-800">
                    {formatNumber(product.currentStock)}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">الحد الأدنى</p>

                  <p className="mt-2 text-xl font-bold text-slate-800">
                    {formatNumber(product.minStock)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* الوصف */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <SectionTitle
          title="الوصف والملاحظات"
          description="الوصف الإضافي للصنف"
        />

        <div className="p-5">
          {product.description ? (
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {product.description}
            </p>
          ) : (
            <p className="text-sm text-slate-400">لا يوجد وصف لهذا الصنف.</p>
          )}
        </div>
      </section>

      {/* الأزرار السفلية */}
      <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
        <Link
          href="/erp/products"
          className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-center text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          العودة إلى قائمة الأصناف
        </Link>

        <button
          onClick={() => router.push(`/erp/products/${product.id}/edit`)}
          className="rounded-lg bg-[#0E1F33] px-8 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          تعديل بيانات الصنف
        </button>
      </div>
    </div>
  );
}

// بطاقة معلومات
function InfoCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: "blue" | "green" | "purple" | "amber";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{title}</p>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${colors[color]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 break-words text-xl font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

// عنوان القسم
function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-slate-100 px-5 py-4">
      <h2 className="font-bold text-slate-800">{title}</h2>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  );
}

// حقل تفاصيل
function Detail({
  label,
  value,
  direction,
}: {
  label: string;
  value: string;
  direction?: "ltr";
}) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>

      <p
        dir={direction}
        className="mt-2 break-words text-sm font-semibold text-slate-700"
      >
        {value}
      </p>
    </div>
  );
}
