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
import { useERPStore } from "@/Store/erpStore";

export default function ProductsPage() {
  // =========================================================
  // ERP STORE
  // =========================================================

  const products = useERPStore((state) => state.products);
  const deleteProduct = useERPStore((state) => state.deleteProduct);
  const updateProduct = useERPStore((state) => state.updateProduct);

  // =========================================================
  // FILTER STATE
  // =========================================================

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("الكل");
  const [statusFilter, setStatusFilter] = useState("الكل");

  // =========================================================
  // MODALS
  // =========================================================

  const [selectedProduct, setSelectedProduct] = useState<
    (typeof products)[number] | null
  >(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  // =========================================================
  // CATEGORIES
  // =========================================================

  const categories = useMemo(() => {
    const values = products
      .map((product) => product.category?.trim())
      .filter(Boolean) as string[];

    return ["الكل", ...Array.from(new Set(values))];
  }, [products]);

  // =========================================================
  // FILTERED PRODUCTS
  // =========================================================

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    return products.filter((product) => {
      const productName = product.name?.toLowerCase() || "";
      const productCode = String(product.code || "").toLowerCase();
      const productCategory = product.category?.toLowerCase() || "";

      const matchesSearch =
        !value ||
        productName.includes(value) ||
        productCode.includes(value) ||
        productCategory.includes(value);

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

  // =========================================================
  // STATISTICS
  // =========================================================

  const activeCount = products.filter(
    (product) => product.isActive !== false,
  ).length;

  const inactiveCount = products.filter(
    (product) => product.isActive === false,
  ).length;

  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  const handleDelete = () => {
    if (!deleteId) return;

    const product = products.find((item) => item.id === deleteId);

    try {
      deleteProduct(deleteId);

      toast.success("تم حذف الصنف", {
        description: product
          ? `تم حذف "${product.name}" من قائمة الأصناف.`
          : "تم حذف الصنف بنجاح.",
        duration: 4000,
      });

      setDeleteId(null);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error deleting product:", error);

      toast.error("حدث خطأ أثناء حذف الصنف", {
        description: "تعذر حذف الصنف.",
        duration: 4000,
      });
    }
  };

  // =========================================================
  // TOGGLE STATUS
  // =========================================================

  const toggleStatus = (product: (typeof products)[number]) => {
    const newStatus = product.isActive === false;

    try {
      updateProduct(product.id, {
        isActive: newStatus,
      });

      toast.success(newStatus ? "تم تفعيل الصنف" : "تم إيقاف الصنف", {
        description: `تم تغيير حالة "${product.name}".`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error updating product status:", error);

      toast.error("حدث خطأ أثناء تغيير الحالة", {
        description: "تعذر تحديث حالة الصنف.",
        duration: 4000,
      });
    }
  };

  // =========================================================
  // RESET FILTERS
  // =========================================================

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("الكل");
    setStatusFilter("الكل");
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50 px-2.5 py-3 sm:px-4 sm:py-4 lg:px-5"
    >
      <div className="mx-auto max-w-7xl">
        {/* ===================================================
            Header
        =================================================== */}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs text-gray-500">
              <FiBox size={14} />
              <span>إدارة الأصناف</span>
            </div>

            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              الأصناف والمنتجات
            </h1>

            <p className="mt-0.5 text-xs text-gray-500">
              إدارة جميع الأصناف المسجلة في النظام
            </p>
          </div>

          <Link
            href="/products/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FiPlus size={16} />
            إضافة صنف جديد
          </Link>
        </div>

        {/* ===================================================
            Statistics
        =================================================== */}

        <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {/* Total */}

          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">إجمالي الأصناف</p>

                <p className="mt-0.5 text-xl font-bold text-gray-900">
                  {products.length}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                <FiBox size={19} />
              </div>
            </div>
          </div>

          {/* Active */}

          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">الأصناف النشطة</p>

                <p className="mt-0.5 text-xl font-bold text-green-600">
                  {activeCount}
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-2.5 text-green-600">
                <span className="block h-2.5 w-2.5 rounded-full bg-green-500" />
              </div>
            </div>
          </div>

          {/* Inactive */}

          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">الأصناف غير النشطة</p>

                <p className="mt-0.5 text-xl font-bold text-red-600">
                  {inactiveCount}
                </p>
              </div>

              <div className="rounded-lg bg-red-50 p-2.5 text-red-600">
                <span className="block h-2.5 w-2.5 rounded-full bg-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            Search / Filters
        =================================================== */}

        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
            {/* Search */}

            <div className="relative md:col-span-1">
              <FiSearch
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الكود أو التصنيف..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pr-9 pl-3 text-xs outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Category */}

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "الكل" ? "جميع التصنيفات" : category}
                </option>
              ))}
            </select>

            {/* Status */}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
              <option value="الكل">جميع الحالات</option>
              <option value="نشط">نشط</option>
              <option value="غير نشط">غير نشط</option>
            </select>
          </div>
        </div>

        {/* ===================================================
            Products
        =================================================== */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Header */}

          <div className="flex items-center justify-between border-b border-gray-100 px-3.5 py-3 sm:px-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">قائمة الأصناف</h2>

              <p className="mt-0.5 text-[11px] text-gray-500">
                عرض {filteredProducts.length} من أصل {products.length} صنف
              </p>
            </div>

            {(search ||
              categoryFilter !== "الكل" ||
              statusFilter !== "الكل") && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                إعادة ضبط
              </button>
            )}
          </div>

          {/* =================================================
              Desktop Table
          ================================================= */}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[800px] text-right">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200 text-xs text-gray-600">
                  <th className="px-4 py-3 font-semibold">الكود</th>

                  <th className="px-4 py-3 font-semibold">اسم الصنف</th>

                  <th className="px-4 py-3 font-semibold">الوحدة</th>

                  <th className="px-4 py-3 font-semibold">التصنيف</th>

                  <th className="px-4 py-3 font-semibold">الحالة</th>

                  <th className="px-4 py-3 text-center font-semibold">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-2.5 rounded-full bg-gray-100 p-3 text-gray-400">
                          <FiBox size={24} />
                        </div>

                        <p className="text-sm font-semibold text-gray-700">
                          لا توجد أصناف
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          لم يتم العثور على أصناف مطابقة للبحث.
                        </p>

                        <Link
                          href="/products/new"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          <FiPlus size={14} />
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
                      {/* Code */}

                      <td className="px-4 py-2.5">
                        <div className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 font-mono text-xs font-semibold text-gray-700">
                          <FiHash size={12} />
                          {product.code}
                        </div>
                      </td>

                      {/* Name */}

                      <td className="px-4 py-2.5">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {product.name}
                          </p>

                          {product.description && (
                            <p className="mt-0.5 max-w-xs truncate text-[11px] text-gray-500">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Unit */}

                      <td className="px-4 py-2.5 text-xs text-gray-600">
                        {product.unit || "وحدة"}
                      </td>

                      {/* Category */}

                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-700">
                          <FiTag size={11} />
                          {product.category || "عام"}
                        </span>
                      </td>

                      {/* Status */}

                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => toggleStatus(product)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            product.isActive === false
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              product.isActive === false
                                ? "bg-red-500"
                                : "bg-green-500"
                            }`}
                          />

                          {product.isActive === false ? "غير نشط" : "نشط"}
                        </button>
                      </td>

                      {/* Actions */}

                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(product)}
                            title="عرض التفاصيل"
                            className="rounded-md border border-gray-200 p-1.5 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <FiEye size={14} />
                          </button>

                          <Link
                            href={`/products/${product.id}/edit`}
                            title="تعديل"
                            className="rounded-md border border-gray-200 p-1.5 text-gray-600 transition hover:border-yellow-200 hover:bg-yellow-50 hover:text-yellow-600"
                          >
                            <FiEdit size={14} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteId(product.id)}
                            title="حذف"
                            className="rounded-md border border-gray-200 p-1.5 text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              Mobile Cards
          ================================================= */}

          <div className="divide-y divide-gray-100 md:hidden">
            {filteredProducts.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto mb-2.5 w-fit rounded-full bg-gray-100 p-3 text-gray-400">
                  <FiBox size={24} />
                </div>

                <p className="text-sm font-semibold text-gray-700">
                  لا توجد أصناف
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  لم يتم العثور على أصناف مطابقة.
                </p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-3.5 transition hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[11px] font-bold text-gray-700">
                          #{product.code}
                        </span>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            product.isActive === false
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {product.isActive === false ? "غير نشط" : "نشط"}
                        </span>
                      </div>

                      <h3 className="truncate text-sm font-bold text-gray-900">
                        {product.name}
                      </h3>

                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-700">
                          الوحدة: {product.unit || "وحدة"}
                        </span>

                        <span className="rounded-md bg-purple-50 px-2 py-0.5 text-purple-700">
                          {product.category || "عام"}
                        </span>
                      </div>

                      {product.description && (
                        <p className="mt-1.5 line-clamp-2 text-[11px] text-gray-500">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      className="shrink-0 rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100"
                    >
                      <FiEye size={15} />
                    </button>
                  </div>

                  <div className="mt-3 flex gap-1.5">
                    <Link
                      href={`/products/${product.id}/edit`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-gray-200 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <FiEdit size={13} />
                      تعديل
                    </Link>

                    <button
                      type="button"
                      onClick={() => toggleStatus(product)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-gray-200 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {product.isActive === false ? "تفعيل" : "إيقاف"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteId(product.id)}
                      className="flex items-center justify-center rounded-md border border-red-100 px-2.5 py-1.5 text-red-600 hover:bg-red-50"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          Details Modal
      ===================================================== */}

      {selectedProduct && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-3"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}

            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  تفاصيل الصنف
                </h2>

                <p className="mt-0.5 text-[11px] text-gray-500">
                  بيانات الصنف المسجلة في النظام
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Body */}

            <div className="space-y-3 p-4">
              <div className="rounded-lg bg-gray-50 p-3.5 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <FiBox size={24} />
                </div>

                <h3 className="text-lg font-bold text-gray-900">
                  {selectedProduct.name}
                </h3>

                <p className="mt-0.5 font-mono text-xs text-gray-500">
                  كود الصنف: {selectedProduct.code}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Code */}

                <div className="rounded-lg border border-gray-100 p-2.5">
                  <p className="text-[11px] text-gray-500">الكود</p>

                  <p className="mt-0.5 font-mono text-sm font-bold text-gray-900">
                    {selectedProduct.code}
                  </p>
                </div>

                {/* Unit */}

                <div className="rounded-lg border border-gray-100 p-2.5">
                  <p className="text-[11px] text-gray-500">الوحدة</p>

                  <p className="mt-0.5 text-sm font-semibold text-gray-900">
                    {selectedProduct.unit || "وحدة"}
                  </p>
                </div>

                {/* Category */}

                <div className="rounded-lg border border-gray-100 p-2.5">
                  <p className="text-[11px] text-gray-500">التصنيف</p>

                  <p className="mt-0.5 text-sm font-semibold text-gray-900">
                    {selectedProduct.category || "عام"}
                  </p>
                </div>

                {/* Status */}

                <div className="rounded-lg border border-gray-100 p-2.5">
                  <p className="text-[11px] text-gray-500">الحالة</p>

                  <p
                    className={`mt-0.5 text-sm font-semibold ${
                      selectedProduct.isActive === false
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {selectedProduct.isActive === false ? "غير نشط" : "نشط"}
                  </p>
                </div>
              </div>

              {/* Description */}

              {selectedProduct.description && (
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="mb-1.5 text-[11px] text-gray-500">الوصف</p>

                  <p className="text-xs leading-5 text-gray-700">
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              {/* Actions */}

              <div className="flex gap-2 pt-0.5">
                <Link
                  href={`/products/${selectedProduct.id}/edit`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <FiEdit size={14} />
                  تعديل الصنف
                </Link>

                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          Delete Confirmation
      ===================================================== */}

      {deleteId && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-3"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-lg bg-red-50 p-2.5 text-red-600">
                <FiTrash2 size={20} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-gray-900">حذف الصنف</h2>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  هل أنت متأكد من حذف هذا الصنف؟ لا يمكن التراجع عن عملية الحذف.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                نعم، حذف
              </button>

              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
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
