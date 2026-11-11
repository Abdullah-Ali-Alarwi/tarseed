"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  FiPackage,
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiAlertCircle,
  FiArrowLeft,
} from "react-icons/fi";
import { toast } from "sonner";

const API = axios.create({
  baseURL: "http://localhost:3001",
});

interface Product {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId?: string;
  categoryName?: string;
  unitId?: string;
  unitName?: string;
  warehouseId?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  currentStock?: number;
  minStock?: number;
  description?: string;
  status: "active" | "inactive";
}

interface Category {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  status: string;
}

const getCookie = (name: string) => {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.substring(name.length + 1)) : "";
};

export default function ProductsPage() {
  const [companyId, setCompanyId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const type = getCookie("type");

      if (!type || type === "platform") {
        toast.error("هذه الصفحة مخصصة لمستخدمي الشركات");
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
      console.error(error);
      toast.error("حدث خطأ أثناء تحميل الصفحة");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (currentCompanyId: string) => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        API.get("/products", {
          params: { companyId: currentCompanyId },
        }),
        API.get("/categories", {
          params: { companyId: currentCompanyId },
        }),
      ]);

      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل المنتجات");
    }
  };

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(`هل تريد حذف المنتج ${product.name}؟`);

    if (!confirmed) return;

    try {
      await API.delete(`/products/${product.id}`);

      setProducts((prev) => prev.filter((item) => item.id !== product.id));

      toast.success("تم حذف المنتج بنجاح");
    } catch (error) {
      console.error(error);
      toast.error("تعذر حذف المنتج");
    }
  };

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !value ||
        product.name?.toLowerCase().includes(value) ||
        product.sku?.toLowerCase().includes(value) ||
        product.barcode?.toLowerCase().includes(value) ||
        product.categoryName?.toLowerCase().includes(value);

      const matchesCategory =
        categoryFilter === "all" ||
        String(product.categoryId) === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  const activeProducts = products.filter(
    (item) => item.status === "active",
  ).length;

  const inactiveProducts = products.filter(
    (item) => item.status === "inactive",
  ).length;

  const lowStockProducts = products.filter(
    (item) => Number(item.currentStock || 0) <= Number(item.minStock || 0),
  ).length;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <FiRefreshCw className="animate-spin text-3xl text-blue-600" />
      </div>
    );
  }

  if (!companyId) {
    return (
      <div
        dir="rtl"
        className="m-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700"
      >
        تعذر تحديد الشركة المرتبطة بالمستخدم.
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-5 p-4 md:p-6">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
            <FiPackage size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">المنتجات</h1>

            <p className="mt-1 text-sm text-gray-500">
              إدارة المنتجات المسجلة في الشركة
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadData(companyId)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
          >
            <FiRefreshCw />
            تحديث
          </button>

          <Link
            href="/erp/products/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FiPlus size={18} />
            إضافة منتج جديد
          </Link>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="إجمالي المنتجات" value={products.length} />

        <StatCard title="المنتجات النشطة" value={activeProducts} />

        <StatCard title="المنتجات غير النشطة" value={inactiveProducts} />

        <StatCard title="مخزون منخفض" value={lowStockProducts} />
      </div>

      {/* SEARCH AND FILTER */}

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 md:flex-row">
        <div className="relative flex-1">
          <FiSearch className="absolute right-3 top-3.5 text-gray-400" />

          <input
            type="text"
            placeholder="ابحث باسم المنتج أو رقم الصنف أو الباركود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-3 pr-10 pl-4 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">جميع المجموعات</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* PRODUCTS TABLE */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div>
            <h2 className="font-bold text-gray-800">قائمة المنتجات</h2>

            <p className="mt-1 text-xs text-gray-500">
              عدد النتائج: {filteredProducts.length}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-right text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-4">رقم الصنف</th>
                <th className="px-4 py-4">اسم المنتج</th>
                <th className="px-4 py-4">المجموعة</th>
                <th className="px-4 py-4">الوحدة</th>
                <th className="px-4 py-4">سعر الشراء</th>
                <th className="px-4 py-4">سعر البيع</th>
                <th className="px-4 py-4">المخزون</th>
                <th className="px-4 py-4">الحالة</th>
                <th className="px-4 py-4">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="transition hover:bg-gray-50">
                  <td className="px-4 py-4 font-mono font-semibold text-blue-700">
                    {product.sku}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-semibold text-gray-800">
                      {product.name}
                    </div>

                    {product.barcode && (
                      <div className="mt-1 text-xs text-gray-400">
                        {product.barcode}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-gray-600">
                    {product.categoryName || "—"}
                  </td>

                  <td className="px-4 py-4 text-gray-600">
                    {product.unitName || "—"}
                  </td>

                  <td className="px-4 py-4">
                    {Number(product.purchasePrice || 0).toLocaleString()}
                  </td>

                  <td className="px-4 py-4 font-semibold">
                    {Number(product.sellingPrice || 0).toLocaleString()}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={
                        Number(product.currentStock || 0) <=
                        Number(product.minStock || 0)
                          ? "font-semibold text-red-600"
                          : "font-semibold text-green-600"
                      }
                    >
                      {product.currentStock ?? 0}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        product.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {product.status === "active" ? "نشط" : "غير نشط"}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/erp/products/new?id=${product.id}`}
                        title="تعديل المنتج"
                        className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                      >
                        <FiEdit size={17} />
                      </Link>

                      <button
                        onClick={() => handleDelete(product)}
                        title="حذف المنتج"
                        className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                      >
                        <FiTrash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-gray-400">
                    <FiAlertCircle className="mx-auto mb-3 text-3xl" />

                    {search
                      ? "لا توجد نتائج مطابقة للبحث"
                      : "لا توجد منتجات حتى الآن"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <FiArrowLeft />
        تتم إضافة المنتجات من خلال صفحة إضافة منتج جديد.
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>

      <h3 className="mt-3 text-2xl font-bold text-gray-800">
        {value.toLocaleString()}
      </h3>
    </div>
  );
}
