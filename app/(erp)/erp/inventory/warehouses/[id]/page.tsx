"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  FiArrowRight,
  FiEdit,
  FiMapPin,
  FiPackage,
  FiBox,
  FiCalendar,
  FiRefreshCw,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
} from "react-icons/fi";

type Warehouse = {
  id: string;
  companyId: string;
  name: string;
  code: string;
  location: string;
  status: string;
  isDefault: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryName: string;
  unitName: string;
  warehouseId: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  status: string;
  trackInventory: boolean | null;
};

type AuthUser = {
  companyId?: string;
  type?: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("ar-YE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function WarehouseDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const warehouseId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const storedUser = localStorage.getItem("authUser");

      if (!storedUser) {
        router.replace("/login");
        return;
      }

      const user: AuthUser = JSON.parse(storedUser);

      if (!user.companyId || user.type === "platform") {
        setError("لا يمكن الوصول إلى بيانات هذا المستودع.");
        return;
      }

      // جلب بيانات المستودع
      const { data: warehouseData, error: warehouseError } = await supabase
        .from("warehouses")
        .select("*")
        .eq("id", warehouseId)
        .eq("companyId", user.companyId)
        .maybeSingle();

      if (warehouseError) throw warehouseError;

      if (!warehouseData) {
        setWarehouse(null);
        setProducts([]);
        setError("لم يتم العثور على المستودع المطلوب.");
        return;
      }

      setWarehouse(warehouseData as Warehouse);

      // جلب المنتجات المرتبطة بالمستودع
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("companyId", user.companyId)
        .eq("warehouseId", warehouseId)
        .order("createdAt", { ascending: false });

      if (productsError) throw productsError;

      setProducts((productsData || []) as Product[]);
    } catch (err: unknown) {
      console.error("Warehouse details error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل بيانات المستودع.",
      );
    } finally {
      setLoading(false);
    }
  }, [warehouseId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // المنتجات الظاهرة بعد البحث
  const filteredProducts = products.filter((product) => {
    const value = search.trim().toLowerCase();

    if (!value) return true;

    return (
      product.name?.toLowerCase().includes(value) ||
      product.sku?.toLowerCase().includes(value) ||
      product.barcode?.toLowerCase().includes(value) ||
      product.categoryName?.toLowerCase().includes(value)
    );
  });

  // الإحصائيات
  const trackedProducts = products.filter(
    (product) => product.trackInventory !== false,
  );

  const totalProducts = products.length;

  const totalStock = trackedProducts.reduce(
    (sum, product) => sum + Number(product.currentStock || 0),
    0,
  );

  const lowStockProducts = trackedProducts.filter(
    (product) =>
      Number(product.currentStock || 0) > 0 &&
      Number(product.currentStock || 0) <= Number(product.minStock || 0),
  );

  const outOfStockProducts = trackedProducts.filter(
    (product) => Number(product.currentStock || 0) <= 0,
  );

  const activeProducts = products.filter(
    (product) => product.status === "active",
  );

  // حالة المنتج
  const getStockStatus = (product: Product) => {
    if (product.trackInventory === false) {
      return {
        label: "غير مخزني",
        className: "bg-gray-100 text-gray-600",
        icon: <FiBox />,
      };
    }

    const stock = Number(product.currentStock || 0);
    const minimum = Number(product.minStock || 0);

    if (stock <= 0) {
      return {
        label: "نفد المخزون",
        className: "bg-red-100 text-red-700",
        icon: <FiXCircle />,
      };
    }

    if (stock <= minimum) {
      return {
        label: "مخزون منخفض",
        className: "bg-amber-100 text-amber-700",
        icon: <FiAlertCircle />,
      };
    }

    return {
      label: "متوفر",
      className: "bg-green-100 text-green-700",
      icon: <FiCheckCircle />,
    };
  };

  // شاشة التحميل
  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

          <p className="text-sm text-gray-500">جاري تحميل بيانات المستودع...</p>
        </div>
      </div>
    );
  }

  // شاشة الخطأ
  if (error || !warehouse) {
    return (
      <div dir="rtl" className="space-y-5">
        <Link
          href="/erp/inventory/warehouses"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
        >
          <FiArrowRight />
          العودة إلى المستودعات
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <FiAlertCircle className="mx-auto mb-3 text-3xl text-red-500" />

          <h2 className="font-bold text-red-700">تعذر تحميل المستودع</h2>

          <p className="mt-2 text-sm text-red-600">
            {error || "المستودع غير موجود."}
          </p>

          <button
            onClick={loadData}
            className="mt-5 rounded-lg bg-red-600 px-5 py-2 text-sm text-white hover:bg-red-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/erp/inventory/warehouses"
            className="rounded-lg border border-gray-200 p-2.5 text-gray-600 hover:bg-gray-50"
          >
            <FiArrowRight size={20} />
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">
                {warehouse.name}
              </h1>

              {warehouse.isDefault && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  المستودع الافتراضي
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-gray-500">
              تفاصيل المستودع والمنتجات الموجودة فيه
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FiRefreshCw />
            تحديث
          </button>

          <Link
            href={`/erp/inventory/warehouses/${warehouse.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FiEdit />
            تعديل المستودع
          </Link>
        </div>
      </div>

      {/* Warehouse information */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <FiBox className="text-blue-600" />

          <h2 className="font-bold text-gray-800">معلومات المستودع</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-1 text-xs text-gray-500">اسم المستودع</p>

            <p className="font-semibold text-gray-800">
              {warehouse.name || "-"}
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs text-gray-500">رمز المستودع</p>

            <p className="font-semibold text-gray-800">
              {warehouse.code || "-"}
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs text-gray-500">الموقع</p>

            <p className="flex items-center gap-2 font-semibold text-gray-800">
              <FiMapPin className="text-gray-400" />

              {warehouse.location || "-"}
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs text-gray-500">الحالة</p>

            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                warehouse.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {warehouse.status === "active" ? "نشط" : "غير نشط"}
            </span>
          </div>

          <div>
            <p className="mb-1 text-xs text-gray-500">تاريخ الإنشاء</p>

            <p className="flex items-center gap-2 text-sm text-gray-700">
              <FiCalendar className="text-gray-400" />

              {formatDate(warehouse.createdAt)}
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs text-gray-500">آخر تحديث</p>

            <p className="flex items-center gap-2 text-sm text-gray-700">
              <FiCalendar className="text-gray-400" />

              {formatDate(warehouse.updatedAt)}
            </p>
          </div>
        </div>

        {warehouse.description && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs text-gray-500">وصف المستودع</p>

            <p className="text-sm leading-7 text-gray-700">
              {warehouse.description}
            </p>
          </div>
        )}
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي المنتجات</p>

              <p className="mt-2 text-2xl font-bold text-gray-800">
                {totalProducts}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FiPackage size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي الكميات</p>

              <p className="mt-2 text-2xl font-bold text-gray-800">
                {money(totalStock)}
              </p>
            </div>

            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <FiBox size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">مخزون منخفض</p>

              <p className="mt-2 text-2xl font-bold text-amber-600">
                {lowStockProducts.length}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <FiAlertCircle size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">نفد المخزون</p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {outOfStockProducts.length}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-3 text-red-600">
              <FiXCircle size={24} />
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5">
          <div>
            <h2 className="font-bold text-gray-800">منتجات المستودع</h2>

            <p className="mt-1 text-xs text-gray-500">
              المنتجات المسجلة على هذا المستودع
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute right-3 top-3 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-3 pr-10 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-right text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="px-5 py-4 font-medium">المنتج</th>

                <th className="px-5 py-4 font-medium">التصنيف</th>

                <th className="px-5 py-4 font-medium">الوحدة</th>

                <th className="px-5 py-4 font-medium">الكمية</th>

                <th className="px-5 py-4 font-medium">الحد الأدنى</th>

                <th className="px-5 py-4 font-medium">سعر الشراء</th>

                <th className="px-5 py-4 font-medium">سعر البيع</th>

                <th className="px-5 py-4 font-medium">حالة المخزون</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-gray-400"
                  >
                    {search
                      ? "لا توجد منتجات تطابق البحث."
                      : "لا توجد منتجات مرتبطة بهذا المستودع."}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);

                  return (
                    <tr
                      key={product.id}
                      className="border-t border-gray-100 transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/erp/products/${product.id}`}
                          className="font-semibold text-gray-800 hover:text-blue-600"
                        >
                          {product.name}
                        </Link>

                        <p className="mt-1 text-xs text-gray-400">
                          {product.sku || product.barcode || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {product.categoryName || "-"}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {product.unitName || "-"}
                      </td>

                      <td className="px-5 py-4 font-semibold text-gray-800">
                        {product.trackInventory === false
                          ? "-"
                          : money(Number(product.currentStock || 0))}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {product.trackInventory === false
                          ? "-"
                          : money(Number(product.minStock || 0))}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {money(Number(product.purchasePrice || 0))}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {money(Number(product.sellingPrice || 0))}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${stockStatus.className}`}
                        >
                          {stockStatus.icon}
                          {stockStatus.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
          عرض {filteredProducts.length} من أصل {totalProducts} منتج
        </div>
      </section>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-400">معرف المستودع: {warehouse.id}</p>

        <Link
          href="/erp/inventory/warehouses"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          <FiArrowRight />
          العودة إلى قائمة المستودعات
        </Link>
      </div>
    </div>
  );
}
