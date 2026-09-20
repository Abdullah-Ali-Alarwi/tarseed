"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FiBox,
  FiEdit,
  FiEye,
  FiHash,
  FiPlus,
  FiSearch,
  FiTag,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";
import { useProductsStore } from "@/Store/productsStore";

export default function ProductsPage() {
  const products = useProductsStore((state) => state.products);
  const deleteProduct = useProductsStore((state) => state.deleteProduct);
  const updateProduct = useProductsStore((state) => state.updateProduct);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("الكل");
  const [statusFilter, setStatusFilter] = useState("الكل");

  const [selectedProduct, setSelectedProduct] = useState<
    (typeof products)[number] | null
  >(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const values = products
      .map((product) => product.category?.trim())
      .filter(Boolean) as string[];

    return ["الكل", ...Array.from(new Set(values))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !value ||
        product.name.toLowerCase().includes(value) ||
        product.code.toLowerCase().includes(value) ||
        product.category?.toLowerCase().includes(value);

      const matchesCategory =
        categoryFilter === "الكل" ||
        product.category?.trim() === categoryFilter;

      const matchesStatus =
        statusFilter === "الكل" ||
        (statusFilter === "نشط" && product.isActive !== false) ||
        (statusFilter === "غير نشط" && product.isActive === false);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const activeCount = products.filter(
    (product) => product.isActive !== false,
  ).length;

  const inactiveCount = products.filter(
    (product) => product.isActive === false,
  ).length;

  const handleDelete = () => {
    if (!deleteId) return;

    const product = products.find((item) => item.id === deleteId);

    deleteProduct(deleteId);

    toast.success("تم حذف الصنف", {
      description: product
        ? `تم حذف "${product.name}" من قائمة الأصناف.`
        : "تم حذف الصنف بنجاح.",
    });

    setDeleteId(null);
    setSelectedProduct(null);
  };

  const toggleStatus = (product: (typeof products)[number]) => {
    const newStatus = product.isActive === false;

    updateProduct(product.id, {
      isActive: newStatus,
    });

    toast.success(newStatus ? "تم تفعيل الصنف" : "تم إيقاف الصنف", {
      description: `تم تغيير حالة "${product.name}".`,
    });
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <FiBox />
              <span>إدارة الأصناف</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              الأصناف والمنتجات
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              إدارة جميع الأصناف المسجلة في النظام
            </p>
          </div>

          <Link
            href="/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FiPlus size={18} />
            إضافة صنف جديد
          </Link>
        </div>

        {/* Statistics */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي الأصناف</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {products.length}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <FiBox size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">الأصناف النشطة</p>
                <p className="mt-1 text-2xl font-bold text-green-600">
                  {activeCount}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-3 text-green-600">
                <span className="block h-3 w-3 rounded-full bg-green-500" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">الأصناف غير النشطة</p>
                <p className="mt-1 text-2xl font-bold text-red-600">
                  {inactiveCount}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <span className="block h-3 w-3 rounded-full bg-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Search / Filters */}
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative md:col-span-1">
              <FiSearch
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الكود أو التصنيف..."
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pr-10 pl-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "الكل" ? "جميع التصنيفات" : category}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
              <option value="الكل">جميع الحالات</option>
              <option value="نشط">نشط</option>
              <option value="غير نشط">غير نشط</option>
            </select>
          </div>
        </div>

        {/* Products */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-bold text-gray-900">قائمة الأصناف</h2>

              <p className="mt-1 text-xs text-gray-500">
                عرض {filteredProducts.length} من أصل {products.length} صنف
              </p>
            </div>

            {(search ||
              categoryFilter !== "الكل" ||
              statusFilter !== "الكل") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("الكل");
                  setStatusFilter("الكل");
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                إعادة ضبط
              </button>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[850px] text-right">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200 text-sm text-gray-600">
                  <th className="px-5 py-4 font-semibold">الكود</th>
                  <th className="px-5 py-4 font-semibold">اسم الصنف</th>
                  <th className="px-5 py-4 font-semibold">الوحدة</th>
                  <th className="px-5 py-4 font-semibold">التصنيف</th>
                  <th className="px-5 py-4 font-semibold">الحالة</th>
                  <th className="px-5 py-4 text-center font-semibold">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-3 rounded-full bg-gray-100 p-4 text-gray-400">
                          <FiBox size={28} />
                        </div>

                        <p className="font-semibold text-gray-700">
                          لا توجد أصناف
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          لم يتم العثور على أصناف مطابقة للبحث.
                        </p>

                        <Link
                          href="/products/new"
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          <FiPlus />
                          إضافة صنف
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-gray-100 transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-sm font-semibold text-gray-700">
                          <FiHash size={14} />
                          {product.code}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {product.name}
                          </p>

                          {product.description && (
                            <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {product.unit || "وحدة"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700">
                          <FiTag size={13} />
                          {product.category || "عام"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => toggleStatus(product)}
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            product.isActive === false
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              product.isActive === false
                                ? "bg-red-500"
                                : "bg-green-500"
                            }`}
                          />

                          {product.isActive === false ? "غير نشط" : "نشط"}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(product)}
                            title="عرض التفاصيل"
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <FiEye size={16} />
                          </button>

                          <Link
                            href={`/products/${product.id}/edit`}
                            title="تعديل"
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-yellow-200 hover:bg-yellow-50 hover:text-yellow-600"
                          >
                            <FiEdit size={16} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteId(product.id)}
                            title="حذف"
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-gray-100 md:hidden">
            {filteredProducts.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto mb-3 w-fit rounded-full bg-gray-100 p-4 text-gray-400">
                  <FiBox size={28} />
                </div>

                <p className="font-semibold text-gray-700">لا توجد أصناف</p>

                <p className="mt-1 text-sm text-gray-500">
                  لم يتم العثور على أصناف مطابقة.
                </p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 transition hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-xs font-bold text-gray-700">
                          #{product.code}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            product.isActive === false
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {product.isActive === false ? "غير نشط" : "نشط"}
                        </span>
                      </div>

                      <h3 className="truncate font-bold text-gray-900">
                        {product.name}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-blue-700">
                          الوحدة: {product.unit || "وحدة"}
                        </span>

                        <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-purple-700">
                          {product.category || "عام"}
                        </span>
                      </div>

                      {product.description && (
                        <p className="mt-2 line-clamp-2 text-xs text-gray-500">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      className="shrink-0 rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100"
                    >
                      <FiEye size={17} />
                    </button>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/products/${product.id}/edit`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <FiEdit />
                      تعديل
                    </Link>

                    <button
                      type="button"
                      onClick={() => toggleStatus(product)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {product.isActive === false ? "تفعيل" : "إيقاف"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteId(product.id)}
                      className="flex items-center justify-center rounded-lg border border-red-100 px-3 py-2 text-red-600 hover:bg-red-50"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  تفاصيل الصنف
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  بيانات الصنف المسجلة في النظام
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-xl bg-gray-50 p-4 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <FiBox size={30} />
                </div>

                <h3 className="text-xl font-bold text-gray-900">
                  {selectedProduct.name}
                </h3>

                <p className="mt-1 font-mono text-sm text-gray-500">
                  كود الصنف: {selectedProduct.code}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-500">الكود</p>
                  <p className="mt-1 font-mono font-bold text-gray-900">
                    {selectedProduct.code}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-500">الوحدة</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedProduct.unit || "وحدة"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-500">التصنيف</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedProduct.category || "عام"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-500">الحالة</p>
                  <p
                    className={`mt-1 font-semibold ${
                      selectedProduct.isActive === false
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {selectedProduct.isActive === false ? "غير نشط" : "نشط"}
                  </p>
                </div>
              </div>

              {selectedProduct.description && (
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="mb-2 text-xs text-gray-500">الوصف</p>
                  <p className="text-sm leading-6 text-gray-700">
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Link
                  href={`/products/${selectedProduct.id}/edit`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <FiEdit />
                  تعديل الصنف
                </Link>

                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start gap-4">
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <FiTrash2 size={24} />
              </div>

              <div>
                <h2 className="font-bold text-gray-900">حذف الصنف</h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  هل أنت متأكد من حذف هذا الصنف؟ لا يمكن التراجع عن عملية الحذف.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                نعم، حذف
              </button>

              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
