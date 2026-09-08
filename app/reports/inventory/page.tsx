"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiBox,
  FiPrinter,
  FiRefreshCw,
  FiSearch,
  FiAlertTriangle,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

type InventoryRow = {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  purchasePrice: number;
  sellingPrice: number;
};

const getCategory = (code: string) => {
  if (code.startsWith("1")) {
    return "العسل";
  }

  if (code.startsWith("2")) {
    return "الزيوت";
  }

  if (code.startsWith("3")) {
    return "خدمات العمرة";
  }

  return "أخرى";
};

export default function InventoryReportPage() {
  const [category, setCategory] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const products = useERPStore((state) => state.products);
  const purchases = useERPStore((state) => state.purchases);
  const sales = useERPStore((state) => state.sales);

  // ======================================================
  // تنسيق المبالغ
  // ======================================================

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // ======================================================
  // حساب بيانات المخزون
  // ======================================================

  const inventory = useMemo<InventoryRow[]>(() => {
    return products.map((product) => {
      // --------------------------------------------------
      // المشتريات الخاصة بالصنف
      // --------------------------------------------------

      const productPurchases = purchases
        .filter((purchase) =>
          purchase.items.some((item) => item.productId === product.id),
        )
        .flatMap((purchase) =>
          purchase.items
            .filter((item) => item.productId === product.id)
            .map((item) => ({
              date: purchase.date,
              price: Number(item.price) || 0,
              quantity: Number(item.quantity) || 0,
            })),
        )
        .sort((a, b) => b.date.localeCompare(a.date));

      // --------------------------------------------------
      // المبيعات الخاصة بالصنف
      // --------------------------------------------------

      const productSales = sales
        .filter((sale) =>
          sale.items.some((item) => item.productId === product.id),
        )
        .flatMap((sale) =>
          sale.items
            .filter((item) => item.productId === product.id)
            .map((item) => ({
              date: sale.date,
              price: Number(item.price) || 0,
              quantity: Number(item.quantity) || 0,
            })),
        )
        .sort((a, b) => b.date.localeCompare(a.date));

      // --------------------------------------------------
      // آخر سعر شراء
      // --------------------------------------------------

      const lastPurchase = productPurchases[0];

      const purchasePrice = lastPurchase?.price || 0;

      // --------------------------------------------------
      // آخر سعر بيع
      // --------------------------------------------------

      const lastSale = productSales[0];

      const sellingPrice = lastSale?.price || 0;

      // --------------------------------------------------
      // إجمالي الكميات المشتراة
      // --------------------------------------------------

      const purchasedQuantity = productPurchases.reduce(
        (total, item) => total + item.quantity,
        0,
      );

      // --------------------------------------------------
      // إجمالي الكميات المباعة
      // --------------------------------------------------

      const soldQuantity = productSales.reduce(
        (total, item) => total + item.quantity,
        0,
      );

      // --------------------------------------------------
      // الرصيد الحالي
      // --------------------------------------------------

      const quantity = Math.max(purchasedQuantity - soldQuantity, 0);

      /*
        الحد الأدنى تجريبيًا في هذه المرحلة.
        يمكن لاحقًا إضافة minStock إلى Product داخل Zustand.
      */

      const minQuantity = 10;

      return {
        id: product.id,
        code: product.code,
        name: product.name,
        category: getCategory(product.code),
        unit: product.unit,
        quantity,
        minQuantity,
        purchasePrice,
        sellingPrice,
      };
    });
  }, [products, purchases, sales, refreshKey]);

  // ======================================================
  // حالة المخزون
  // ======================================================

  const getStockStatus = (item: InventoryRow) => {
    if (item.quantity <= 0) {
      return "نفد";
    }

    if (item.quantity <= item.minQuantity) {
      return "منخفض";
    }

    return "متوفر";
  };

  // ======================================================
  // التصنيفات
  // ======================================================

  const categories = useMemo(() => {
    return Array.from(new Set(inventory.map((item) => item.category)));
  }, [inventory]);

  // ======================================================
  // الفلترة
  // ======================================================

  const filteredInventory = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return inventory.filter((item) => {
      const categoryMatch = !category || item.category === category;

      const statusMatch = !stockStatus || getStockStatus(item) === stockStatus;

      const searchMatch =
        !searchValue ||
        item.name.toLowerCase().includes(searchValue) ||
        item.code.toLowerCase().includes(searchValue);

      return categoryMatch && statusMatch && searchMatch;
    });
  }, [inventory, category, stockStatus, search]);

  // ======================================================
  // الإحصائيات
  // ======================================================

  const totalProducts = filteredInventory.length;

  const totalQuantity = filteredInventory.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const totalPurchaseValue = filteredInventory.reduce(
    (sum, item) => sum + item.quantity * item.purchasePrice,
    0,
  );

  const totalSellingValue = filteredInventory.reduce(
    (sum, item) => sum + item.quantity * item.sellingPrice,
    0,
  );

  const expectedProfit = totalSellingValue - totalPurchaseValue;

  const lowStockCount = filteredInventory.filter(
    (item) => getStockStatus(item) === "منخفض",
  ).length;

  const outOfStockCount = filteredInventory.filter(
    (item) => getStockStatus(item) === "نفد",
  ).length;

  // ======================================================
  // إعادة ضبط الفلاتر
  // ======================================================

  const resetFilters = () => {
    setCategory("");
    setStockStatus("");
    setSearch("");
  };

  // ======================================================
  // تحديث
  // ======================================================

  const handleRefresh = () => {
    setRefreshKey((value) => value + 1);
  };

  // ======================================================
  // الطباعة
  // ======================================================

  const handlePrint = () => {
    window.print();
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-100 p-4 md:p-6">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="print:hidden flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Link href="/" className="hover:text-amber-600 transition">
              الرئيسية
            </Link>

            <FiArrowRight size={14} />

            <Link href="/reports" className="hover:text-amber-600 transition">
              التقارير
            </Link>

            <FiArrowRight size={14} />

            <span className="text-gray-800 font-medium">تقرير المخزون</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              تقرير المخزون
            </h1>

            <span className="px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
              مخزون
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            عرض الأصناف والكميات والقيمة الحالية للمخزون
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/reports"
            className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-lg text-sm font-semibold transition"
          >
            <FiArrowRight size={18} />
            العودة للتقارير
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-5 py-3 rounded-lg text-sm font-semibold transition"
          >
            <FiPrinter size={18} />
            طباعة التقرير
          </button>
        </div>
      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <section className="print:hidden bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
        <div className="p-5 md:p-6 border-b-2 border-gray-200">
          <div className="flex items-center gap-2">
            <FiSearch size={20} className="text-amber-600" />

            <div>
              <h2 className="font-bold text-gray-900">خيارات التقرير</h2>

              <p className="text-sm text-gray-500 mt-1">
                ابحث عن صنف أو حدد التصنيف وحالة المخزون
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* البحث */}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                البحث
              </label>

              <div className="relative">
                <FiSearch
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="اسم الصنف أو الكود..."
                  className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg pr-10 pl-3 text-sm text-gray-900 font-medium placeholder:text-gray-500 outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                />
              </div>
            </div>

            {/* التصنيف */}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                التصنيف
              </label>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg px-3 text-sm text-gray-900 font-medium outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              >
                <option value="">جميع التصنيفات</option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* الحالة */}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                حالة المخزون
              </label>

              <select
                value={stockStatus}
                onChange={(event) => setStockStatus(event.target.value)}
                className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg px-3 text-sm text-gray-900 font-medium outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              >
                <option value="">جميع الحالات</option>

                <option value="متوفر">متوفر</option>

                <option value="منخفض">مخزون منخفض</option>

                <option value="نفد">نفد المخزون</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg text-sm font-semibold transition"
            >
              <FiRefreshCw size={18} />
              إعادة ضبط
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg text-sm font-semibold transition"
            >
              <FiRefreshCw size={18} />
              تحديث التقرير
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          REPORT
      ====================================================== */}

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden print:border-0 print:shadow-none">
        {/* ===================================================
            REPORT HEADER
        ==================================================== */}

        <div className="p-6 md:p-8 border-b-2 border-gray-300">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg">
                  ERP
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    شركة الجابري
                  </h2>

                  <p className="text-sm text-gray-500">
                    للعسل والزيوت الطبيعة وخدمات العمرة
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600">البيضاء - اليمن</p>

              <p className="text-sm text-gray-600 mt-1">
                هاتف: <bdi dir="ltr">734 434 443</bdi>
              </p>
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                تقرير المخزون
              </h2>

              <p className="text-sm text-gray-600 mt-2">
                تقرير حالة وقيمة المخزون الحالية
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            REPORT CONTENT
        ==================================================== */}

        <div className="p-5 md:p-8">
          {/* =================================================
              SUMMARY
          ================================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="border-2 border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">عدد الأصناف</p>

                <FiBox size={20} className="text-gray-500" />
              </div>

              <p className="text-2xl font-bold text-gray-900 mt-3">
                {totalProducts.toLocaleString("ar-SA")}
              </p>

              <p className="text-xs text-gray-500 mt-1">صنف</p>
            </div>

            <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-5">
              <p className="text-sm text-gray-600">إجمالي الكميات</p>

              <p className="text-2xl font-bold text-blue-700 mt-3">
                {totalQuantity.toLocaleString("ar-SA")}
              </p>

              <p className="text-xs text-gray-500 mt-1">وحدة</p>
            </div>

            <div className="border-2 border-green-200 bg-green-50 rounded-xl p-5">
              <p className="text-sm text-gray-600">قيمة المخزون بالتكلفة</p>

              <p className="text-xl font-bold text-green-700 mt-3">
                {formatMoney(totalPurchaseValue)}
              </p>

              <p className="text-xs text-gray-500 mt-1">ريال</p>
            </div>

            <div className="border-2 border-amber-200 bg-amber-50 rounded-xl p-5">
              <p className="text-sm text-gray-600">قيمة المخزون بالبيع</p>

              <p className="text-xl font-bold text-amber-700 mt-3">
                {formatMoney(totalSellingValue)}
              </p>

              <p className="text-xs text-gray-500 mt-1">ريال</p>
            </div>

            <div className="border-2 border-red-200 bg-red-50 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">أصناف تحتاج إعادة طلب</p>

                <FiAlertTriangle size={20} className="text-red-600" />
              </div>

              <p className="text-2xl font-bold text-red-700 mt-3">
                {lowStockCount.toLocaleString("ar-SA")}
              </p>

              <p className="text-xs text-gray-500 mt-1">صنف</p>
            </div>
          </div>

          {/* =================================================
              INVENTORY VALUE
          ================================================== */}

          <div className="mb-6 p-5 rounded-xl border-2 border-gray-300 bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900">
                  القيمة المتوقعة للمخزون
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  الفرق بين قيمة المخزون بسعر البيع وسعر التكلفة
                </p>
              </div>

              <div className="text-left">
                <p
                  className={`text-2xl font-bold ${
                    expectedProfit >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {expectedProfit < 0
                    ? `(${formatMoney(Math.abs(expectedProfit))})`
                    : formatMoney(expectedProfit)}
                </p>

                <p className="text-xs text-gray-500">هامش قيمة متوقع</p>
              </div>
            </div>
          </div>

          {/* =================================================
              INVENTORY TABLE
          ================================================== */}

          <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="border border-gray-700 px-4 py-4 text-center text-sm font-bold">
                      #
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                      كود الصنف
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                      الصنف
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                      التصنيف
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                      الوحدة
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-center text-sm font-bold">
                      الكمية
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                      سعر التكلفة
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                      قيمة التكلفة
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                      سعر البيع
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                      قيمة البيع
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-center text-sm font-bold">
                      الحالة
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInventory.length > 0 ? (
                    filteredInventory.map((item, index) => {
                      const status = getStockStatus(item);

                      const purchaseValue = item.quantity * item.purchasePrice;

                      const sellingValue = item.quantity * item.sellingPrice;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-600">
                            {index + 1}
                          </td>

                          <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-blue-700">
                            {item.code}
                          </td>

                          <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-gray-900">
                            {item.name}
                          </td>

                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                            {item.category}
                          </td>

                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                            {item.unit}
                          </td>

                          <td className="border border-gray-300 px-4 py-3 text-center text-sm font-bold text-gray-900">
                            {item.quantity.toLocaleString("ar-SA")}
                          </td>

                          <td className="border border-gray-300 px-4 py-3 text-left text-sm text-gray-700">
                            {formatMoney(item.purchasePrice)}
                          </td>

                          <td className="border border-gray-300 px-4 py-3 text-left text-sm font-bold text-gray-900">
                            {formatMoney(purchaseValue)}
                          </td>

                          <td className="border border-gray-300 px-4 py-3 text-left text-sm text-gray-700">
                            {formatMoney(item.sellingPrice)}
                          </td>

                          <td className="border border-gray-300 px-4 py-3 text-left text-sm font-bold text-gray-900">
                            {formatMoney(sellingValue)}
                          </td>

                          <td className="border border-gray-300 px-4 py-3 text-center">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                                status === "متوفر"
                                  ? "bg-green-100 text-green-700"
                                  : status === "منخفض"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={11}
                        className="border border-gray-300 px-4 py-12 text-center text-gray-500"
                      >
                        لا توجد أصناف مطابقة للبحث
                      </td>
                    </tr>
                  )}
                </tbody>

                <tfoot>
                  <tr className="bg-gray-100">
                    <td
                      colSpan={5}
                      className="border-2 border-gray-400 px-4 py-4 text-right font-bold text-gray-900"
                    >
                      إجمالي التقرير
                    </td>

                    <td className="border-2 border-gray-400 px-4 py-4 text-center font-bold text-gray-900">
                      {totalQuantity.toLocaleString("ar-SA")}
                    </td>

                    <td className="border-2 border-gray-400"></td>

                    <td className="border-2 border-gray-400 px-4 py-4 text-left font-bold text-green-700">
                      {formatMoney(totalPurchaseValue)}
                    </td>

                    <td className="border-2 border-gray-400"></td>

                    <td className="border-2 border-gray-400 px-4 py-4 text-left font-bold text-amber-700">
                      {formatMoney(totalSellingValue)}
                    </td>

                    <td className="border-2 border-gray-400"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* =================================================
              LOW STOCK
          ================================================== */}

          {(lowStockCount > 0 || outOfStockCount > 0) && (
            <div className="mt-6 border-2 border-amber-300 bg-amber-50 rounded-xl overflow-hidden print:break-inside-avoid">
              <div className="p-5 border-b border-amber-200 flex items-center gap-3">
                <FiAlertTriangle size={22} className="text-amber-600" />

                <div>
                  <h3 className="font-bold text-gray-900">تنبيه المخزون</h3>

                  <p className="text-sm text-gray-600 mt-1">
                    توجد أصناف تحتاج إلى متابعة المخزون أو إعادة الطلب
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-amber-100">
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-800">
                        الصنف
                      </th>

                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-800">
                        الكمية الحالية
                      </th>

                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-800">
                        الحد الأدنى
                      </th>

                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-800">
                        الحالة
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredInventory
                      .filter((item) => getStockStatus(item) !== "متوفر")
                      .map((item) => {
                        const itemStatus = getStockStatus(item);

                        return (
                          <tr
                            key={item.id}
                            className="border-t border-amber-200"
                          >
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">
                              {item.name}
                            </td>

                            <td className="px-4 py-3 text-center text-sm font-bold text-red-600">
                              {item.quantity.toLocaleString("ar-SA")}
                            </td>

                            <td className="px-4 py-3 text-center text-sm text-gray-700">
                              {item.minQuantity.toLocaleString("ar-SA")}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                                  itemStatus === "نفد"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-200 text-amber-800"
                                }`}
                              >
                                {itemStatus === "نفد"
                                  ? "نفد المخزون"
                                  : "إعادة طلب"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-center">
            <div>
              <p className="font-bold text-gray-800">إعداد التقرير</p>

              <div className="border-b border-gray-400 mt-12"></div>
            </div>

            <div>
              <p className="font-bold text-gray-800">أمين المخزن</p>

              <div className="border-b border-gray-400 mt-12"></div>
            </div>

            <div>
              <p className="font-bold text-gray-800">المدير</p>

              <div className="border-b border-gray-400 mt-12"></div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRINT CSS
      ====================================================== */}

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          html,
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body {
            color: #111827 !important;
          }

          main {
            background: white !important;
            padding: 0 !important;
            min-height: auto !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          section {
            box-shadow: none !important;
          }

          table {
            width: 100% !important;
          }

          thead {
            display: table-header-group;
          }

          tr {
            break-inside: avoid;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </main>
  );
}
