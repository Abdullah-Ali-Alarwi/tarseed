"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type StockFilter = "all" | "available" | "low" | "out";
type StatusFilter = "all" | "active" | "inactive";

const numberValue = (value: number | string | null | undefined) => {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
};

const formatNumber = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(numberValue(value));

const formatCurrency = (value: number | string | null | undefined) =>
  `${formatNumber(value)} ر.ي`;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  const [companyId, setCompanyId] = useState("");

  // الحصول على الشركة الحالية
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("authUser");

      if (!storedUser) {
        setError("لم يتم العثور على بيانات المستخدم. يرجى تسجيل الدخول.");
        setLoading(false);
        return;
      }

      const user = JSON.parse(storedUser);

      if (!user.companyId) {
        setError("لم يتم العثور على الشركة المرتبطة بهذا المستخدم.");
        setLoading(false);
        return;
      }

      setCompanyId(user.companyId);
    } catch {
      setError("تعذر قراءة بيانات المستخدم.");
      setLoading(false);
    }
  }, []);

  // جلب الأصناف من Supabase
  const fetchProducts = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("companyId", companyId)
        .order("createdAt", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setProducts((data ?? []) as Product[]);
    } catch (err) {
      console.error("Products fetch error:", err);
      setError("حدث خطأ أثناء تحميل الأصناف. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      fetchProducts();
    }
  }, [companyId, fetchProducts]);

  // التصنيفات الموجودة في الأصناف
  const categories = useMemo(() => {
    const uniqueCategories = new Map<string, string>();

    products.forEach((product) => {
      if (product.categoryId) {
        uniqueCategories.set(
          product.categoryId,
          product.categoryName || "بدون اسم",
        );
      }
    });

    return Array.from(uniqueCategories.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [products]);

  // الإحصائيات
  const stats = useMemo(() => {
    const activeProducts = products.filter(
      (product) => product.status === "active",
    );

    const inactiveProducts = products.filter(
      (product) => product.status !== "active",
    );

    const inventoryProducts = products.filter(
      (product) => product.trackInventory !== false,
    );

    const lowStockProducts = inventoryProducts.filter((product) => {
      const stock = numberValue(product.currentStock);
      const minStock = numberValue(product.minStock);

      return stock > 0 && stock <= minStock;
    });

    const outOfStockProducts = inventoryProducts.filter(
      (product) => numberValue(product.currentStock) <= 0,
    );

    return {
      total: products.length,
      active: activeProducts.length,
      inactive: inactiveProducts.length,
      lowStock: lowStockProducts.length,
      outOfStock: outOfStockProducts.length,
    };
  }, [products]);

  // البحث والتصفية
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        product.name?.toLowerCase().includes(searchValue) ||
        product.sku?.toLowerCase().includes(searchValue) ||
        product.barcode?.toLowerCase().includes(searchValue);

      const matchesCategory =
        categoryFilter === "all" || product.categoryId === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active"
          ? product.status === "active"
          : product.status !== "active");

      const stock = numberValue(product.currentStock);
      const minStock = numberValue(product.minStock);
      const tracksInventory = product.trackInventory !== false;

      let matchesStock = true;

      if (stockFilter === "available") {
        matchesStock = !tracksInventory || stock > minStock;
      } else if (stockFilter === "low") {
        matchesStock = tracksInventory && stock > 0 && stock <= minStock;
      } else if (stockFilter === "out") {
        matchesStock = tracksInventory && stock <= 0;
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    });
  }, [products, search, categoryFilter, statusFilter, stockFilter]);

  const getStockStatus = (product: Product) => {
    if (product.trackInventory === false) {
      return {
        label: "غير متتبع",
        className: "bg-slate-100 text-slate-600",
      };
    }

    const stock = numberValue(product.currentStock);
    const minStock = numberValue(product.minStock);

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

  const getProductStatus = (status: string | null) => {
    if (status === "active") {
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

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* العنوان */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">الأصناف</h1>

          <p className="mt-1 text-sm text-slate-500">
            إدارة الأصناف والمنتجات والأسعار والمخزون
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchProducts}
            disabled={loading || !companyId}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            ↻ تحديث
          </button>

          <Link
            href="/erp/products/new"
            className="rounded-lg bg-[#0E1F33] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            + إضافة صنف
          </Link>
        </div>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>

          <button onClick={fetchProducts} className="font-semibold underline">
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="إجمالي الأصناف"
          value={stats.total}
          icon="▦"
          color="blue"
        />

        <StatCard
          title="الأصناف النشطة"
          value={stats.active}
          icon="✓"
          color="green"
        />

        <StatCard
          title="الأصناف غير النشطة"
          value={stats.inactive}
          icon="○"
          color="gray"
        />

        <StatCard
          title="مخزون منخفض"
          value={stats.lowStock}
          icon="!"
          color="amber"
        />

        <StatCard
          title="نفد المخزون"
          value={stats.outOfStock}
          icon="↓"
          color="red"
        />
      </div>

      {/* البحث والتصفية */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الكود أو الباركود..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-slate-400"
          >
            <option value="all">جميع التصنيفات</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-slate-400"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as StockFilter)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-slate-400"
          >
            <option value="all">جميع حالات المخزون</option>
            <option value="available">متوفر</option>
            <option value="low">مخزون منخفض</option>
            <option value="out">نفد المخزون</option>
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            عدد النتائج:{" "}
            <span className="font-bold text-slate-700">
              {filteredProducts.length}
            </span>
          </p>

          <button
            onClick={() => {
              setSearch("");
              setCategoryFilter("all");
              setStatusFilter("all");
              setStockFilter("all");
            }}
            className="text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            إعادة ضبط الفلاتر
          </button>
        </div>
      </div>

      {/* جدول الأصناف */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-800">قائمة الأصناف</h2>

          <span className="text-xs text-slate-400">
            {filteredProducts.length} صنف
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-right text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">الصنف</th>
                <th className="px-4 py-4 font-semibold">الكود</th>
                <th className="px-4 py-4 font-semibold">التصنيف</th>
                <th className="px-4 py-4 font-semibold">الوحدة</th>
                <th className="px-4 py-4 font-semibold">سعر الشراء</th>
                <th className="px-4 py-4 font-semibold">سعر البيع</th>
                <th className="px-4 py-4 font-semibold">الرصيد الحالي</th>
                <th className="px-4 py-4 font-semibold">حالة المخزون</th>
                <th className="px-4 py-4 font-semibold">الحالة</th>
                <th className="px-5 py-4 text-center font-semibold">
                  الإجراءات
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-5 py-16 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
                      جاري تحميل الأصناف...
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center">
                    <div className="text-3xl text-slate-300">▦</div>

                    <p className="mt-3 font-medium text-slate-700">
                      لا توجد أصناف
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      لم يتم العثور على أصناف تطابق البحث أو الفلاتر المحددة.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const productStatus = getProductStatus(product.status);

                  return (
                    <tr
                      key={product.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      {/* اسم الصنف */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {product.name}
                          </p>

                          {product.barcode && (
                            <p className="mt-1 text-xs text-slate-400">
                              باركود: {product.barcode}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* الكود */}
                      <td className="px-4 py-4 font-medium text-slate-600">
                        {product.sku || "—"}
                      </td>

                      {/* التصنيف */}
                      <td className="px-4 py-4 text-slate-600">
                        {product.categoryName || "بدون تصنيف"}
                      </td>

                      {/* الوحدة */}
                      <td className="px-4 py-4 text-slate-600">
                        {product.unitName || "—"}
                      </td>

                      {/* سعر الشراء */}
                      <td className="px-4 py-4 text-slate-600">
                        {formatCurrency(product.purchasePrice)}
                      </td>

                      {/* سعر البيع */}
                      <td className="px-4 py-4 font-semibold text-slate-800">
                        {formatCurrency(product.sellingPrice)}
                      </td>

                      {/* المخزون */}
                      <td className="px-4 py-4">
                        {product.trackInventory === false ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <div>
                            <span className="font-semibold text-slate-800">
                              {formatNumber(product.currentStock)}
                            </span>

                            <span className="mr-1 text-xs text-slate-400">
                              {product.unitName || ""}
                            </span>

                            <p className="mt-1 text-xs text-slate-400">
                              الحد الأدنى: {formatNumber(product.minStock)}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* حالة المخزون */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${stockStatus.className}`}
                        >
                          {stockStatus.label}
                        </span>
                      </td>

                      {/* الحالة */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${productStatus.className}`}
                        >
                          {productStatus.label}
                        </span>
                      </td>

                      {/* الإجراءات */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/erp/products/${product.id}`}
                            title="التفاصيل"
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                          >
                            التفاصيل
                          </Link>

                          <Link
                            href={`/erp/products/${product.id}/edit`}
                            title="تعديل"
                            className="rounded-lg border border-blue-100 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                          >
                            تعديل
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* أسفل الجدول */}
        {!loading && products.length > 0 && (
          <div className="flex flex-col justify-between gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:flex-row">
            <span>
              عرض {filteredProducts.length} من أصل {products.length} صنف
            </span>

            <span>البيانات معروضة حسب الشركة الحالية</span>
          </div>
        )}
      </div>
    </div>
  );
}

// بطاقة الإحصائيات
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: "blue" | "green" | "gray" | "amber" | "red";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    gray: "bg-slate-100 text-slate-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${colors[color]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold text-slate-800">
        {formatNumber(value)}
      </p>
    </div>
  );
}
