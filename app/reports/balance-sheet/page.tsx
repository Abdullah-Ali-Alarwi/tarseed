"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiCalendar,
  FiPrinter,
  FiRefreshCw,
  FiTrendingUp,
  FiCreditCard,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

const OPENING_CAPITAL = 1800000;

export default function BalanceSheetPage() {
  const [reportDate, setReportDate] = useState("2026-08-31");
  const [refreshKey, setRefreshKey] = useState(0);

  const sales = useERPStore((state) => state.sales);
  const purchases = useERPStore((state) => state.purchases);
  const products = useERPStore((state) => state.products);
  const customers = useERPStore((state) => state.customers);
  const suppliers = useERPStore((state) => state.suppliers);
  const journals = useERPStore((state) => state.journalEntries);

  // ======================================================
  // تنسيق المبالغ
  // ======================================================

  const formatMoney = (value: number) => {
    return value.toLocaleString("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // ======================================================
  // بيانات التقرير
  // ======================================================

  const reportData = useMemo(() => {
    const salesUpToDate = sales.filter((sale) => sale.date <= reportDate);

    const purchasesUpToDate = purchases.filter(
      (purchase) => purchase.date <= reportDate,
    );

    const journalsUpToDate = journals.filter(
      (journal) => journal.date <= reportDate,
    );

    // ====================================================
    // دالة حساب المخزون
    // ====================================================

    const calculateInventoryValue = () => {
      return products.reduce((total, product) => {
        let purchasedQuantity = 0;
        let purchasedValue = 0;
        let soldQuantity = 0;

        // المشتريات
        purchasesUpToDate.forEach((purchase) => {
          purchase.items.forEach((item) => {
            if (item.productId === product.id) {
              const quantity = Number(item.quantity) || 0;
              const price = Number(item.price) || 0;

              purchasedQuantity += quantity;
              purchasedValue += quantity * price;
            }
          });
        });

        // المبيعات
        salesUpToDate.forEach((sale) => {
          sale.items.forEach((item) => {
            if (item.productId === product.id) {
              soldQuantity += Number(item.quantity) || 0;
            }
          });
        });

        const stock = Math.max(purchasedQuantity - soldQuantity, 0);

        const averagePurchasePrice =
          purchasedQuantity > 0 ? purchasedValue / purchasedQuantity : 0;

        return total + stock * averagePurchasePrice;
      }, 0);
    };

    /* =====================================================
       الأصول
    ===================================================== */

    const cashFromSales = salesUpToDate
      .filter((sale) => sale.paymentMethod === "cash")
      .reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);

    const cashFromJournals = journalsUpToDate
      .filter((journal) => journal.status === "posted")
      .flatMap((journal) => journal.lines)
      .filter((line) => line.accountCode === "1101")
      .reduce(
        (sum, line) =>
          sum + (Number(line.debit) || 0) - (Number(line.credit) || 0),
        0,
      );

    const bankFromSales = salesUpToDate
      .filter((sale) => sale.paymentMethod === "bank")
      .reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);

    const bankFromJournals = journalsUpToDate
      .filter((journal) => journal.status === "posted")
      .flatMap((journal) => journal.lines)
      .filter((line) => line.accountCode === "1102")
      .reduce(
        (sum, line) =>
          sum + (Number(line.debit) || 0) - (Number(line.credit) || 0),
        0,
      );

    const customerReceivables = customers.reduce(
      (sum, customer) => sum + (Number(customer.balance) || 0),
      0,
    );

    const customerReceivablesFromSales = salesUpToDate
      .filter((sale) => sale.paymentMethod === "credit")
      .reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);

    const customerReceivablesFromJournals = journalsUpToDate
      .filter((journal) => journal.status === "posted")
      .flatMap((journal) => journal.lines)
      .filter((line) => line.accountCode === "1103")
      .reduce(
        (sum, line) =>
          sum + (Number(line.debit) || 0) - (Number(line.credit) || 0),
        0,
      );

    // ====================================================
    // المخزون من حركات المشتريات والمبيعات
    // ====================================================

    const inventoryValue = calculateInventoryValue();

    const inventoryFromJournals = journalsUpToDate
      .filter((journal) => journal.status === "posted")
      .flatMap((journal) => journal.lines)
      .filter((line) => line.accountCode === "1104")
      .reduce(
        (sum, line) =>
          sum + (Number(line.debit) || 0) - (Number(line.credit) || 0),
        0,
      );

    /*
      نستخدم أرصدة العملاء من المتجر عندما تكون موجودة،
      وإلا نعتمد على القيود،
      ثم المبيعات الآجلة.
    */

    const receivables =
      customerReceivables > 0
        ? customerReceivables
        : customerReceivablesFromJournals > 0
          ? customerReceivablesFromJournals
          : customerReceivablesFromSales;

    /*
      قيمة المخزون من حركة المنتجات،
      وإذا لم توجد قيمة نستخدم قيود المخزون.
    */

    const inventory =
      inventoryValue > 0 ? inventoryValue : inventoryFromJournals;

    const cash = cashFromJournals > 0 ? cashFromJournals : cashFromSales;

    const bank = bankFromJournals > 0 ? bankFromJournals : bankFromSales;

    const prepaidExpenses = 0;

    const currentAssets = [
      {
        name: "النقدية بالصندوق",
        amount: Math.max(cash, 0),
      },
      {
        name: "البنوك",
        amount: Math.max(bank, 0),
      },
      {
        name: "العملاء والذمم المدينة",
        amount: Math.max(receivables, 0),
      },
      {
        name: "المخزون",
        amount: Math.max(inventory, 0),
      },
      {
        name: "المصروفات المدفوعة مقدماً",
        amount: prepaidExpenses,
      },
    ];

    const nonCurrentAssets = [
      {
        name: "المباني",
        amount: 0,
      },
      {
        name: "السيارات والمركبات",
        amount: 0,
      },
      {
        name: "الأثاث والمعدات",
        amount: 0,
      },
      {
        name: "أجهزة الحاسب",
        amount: 0,
      },
    ];

    const accumulatedDepreciation = 0;

    const totalCurrentAssets = currentAssets.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const totalNonCurrentAssetsBeforeDepreciation = nonCurrentAssets.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const totalNonCurrentAssets =
      totalNonCurrentAssetsBeforeDepreciation - accumulatedDepreciation;

    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    /* =====================================================
       الخصوم
    ===================================================== */

    const supplierBalances = suppliers.reduce(
      (sum, supplier) => sum + (Number(supplier.balance) || 0),
      0,
    );

    const supplierCreditPurchases = purchasesUpToDate
      .filter((purchase) => purchase.paymentMethod === "credit")
      .reduce((sum, purchase) => sum + (Number(purchase.total) || 0), 0);

    const supplierPayablesFromJournals = journalsUpToDate
      .filter((journal) => journal.status === "posted")
      .flatMap((journal) => journal.lines)
      .filter((line) => line.accountCode === "2101")
      .reduce(
        (sum, line) =>
          sum + (Number(line.credit) || 0) - (Number(line.debit) || 0),
        0,
      );

    const supplierPayables =
      supplierBalances > 0
        ? supplierBalances
        : supplierPayablesFromJournals > 0
          ? supplierPayablesFromJournals
          : supplierCreditPurchases;

    const currentLiabilities = [
      {
        name: "الموردون والدائنون",
        amount: Math.max(supplierPayables, 0),
      },
      {
        name: "المصروفات المستحقة",
        amount: 0,
      },
      {
        name: "الرواتب المستحقة",
        amount: 0,
      },
      {
        name: "ضريبة القيمة المضافة المستحقة",
        amount: 0,
      },
    ];

    const nonCurrentLiabilities = [
      {
        name: "قروض طويلة الأجل",
        amount: 0,
      },
    ];

    const totalCurrentLiabilities = currentLiabilities.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const totalNonCurrentLiabilities = nonCurrentLiabilities.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const totalLiabilities =
      totalCurrentLiabilities + totalNonCurrentLiabilities;

    /* =====================================================
       حقوق الملكية
    ===================================================== */

    const totalSales = salesUpToDate.reduce(
      (sum, sale) => sum + (Number(sale.total) || 0),
      0,
    );

    const totalPurchases = purchasesUpToDate.reduce(
      (sum, purchase) => sum + (Number(purchase.total) || 0),
      0,
    );

    const currentNetProfit = totalSales - totalPurchases;

    const retainedEarnings = 0;

    const equity = [
      {
        name: "رأس المال",
        amount: OPENING_CAPITAL,
      },
      {
        name: "أرباح محتجزة",
        amount: retainedEarnings,
      },
    ];

    const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0);

    const totalEquityWithProfit = totalEquity + currentNetProfit;

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquityWithProfit;

    const difference = totalAssets - totalLiabilitiesAndEquity;

    const isBalanced = Math.abs(difference) < 0.01;

    return {
      currentAssets,
      nonCurrentAssets,
      accumulatedDepreciation,
      totalCurrentAssets,
      totalNonCurrentAssetsBeforeDepreciation,
      totalNonCurrentAssets,
      totalAssets,
      currentLiabilities,
      nonCurrentLiabilities,
      totalCurrentLiabilities,
      totalNonCurrentLiabilities,
      totalLiabilities,
      equity,
      currentNetProfit,
      totalEquity,
      totalEquityWithProfit,
      totalLiabilitiesAndEquity,
      difference,
      isBalanced,
      totalSales,
      totalPurchases,
    };
  }, [
    sales,
    purchases,
    products,
    customers,
    suppliers,
    journals,
    reportDate,
    refreshKey,
  ]);

  const {
    currentAssets,
    nonCurrentAssets,
    accumulatedDepreciation,
    totalCurrentAssets,
    totalNonCurrentAssets,
    totalAssets,
    currentLiabilities,
    nonCurrentLiabilities,
    totalCurrentLiabilities,
    totalLiabilities,
    equity,
    currentNetProfit,
    totalEquityWithProfit,
    totalLiabilitiesAndEquity,
    difference,
    isBalanced,
  } = reportData;

  // ======================================================
  // الطباعة
  // ======================================================

  const handlePrint = () => {
    window.print();
  };

  // ======================================================
  // التحديث
  // ======================================================

  const handleRefresh = () => {
    setRefreshKey((value) => value + 1);
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-100 p-4 md:p-6">
      {/* ==================================================
          Header
      ================================================== */}

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

            <span className="text-gray-800 font-medium">
              الميزانية العمومية
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              الميزانية العمومية
            </h1>

            <span className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              قائمة المركز المالي
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            تقرير أصول والتزامات وحقوق ملكية المنشأة
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

      {/* ==================================================
          تاريخ التقرير
      ================================================== */}

      <section className="print:hidden bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
        <div className="p-5 md:p-6 border-b-2 border-gray-200">
          <div className="flex items-center gap-2">
            <FiCalendar size={20} className="text-amber-600" />

            <div>
              <h2 className="font-bold text-gray-900">تاريخ التقرير</h2>

              <p className="text-sm text-gray-500 mt-1">
                اختر تاريخ قائمة المركز المالي
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                كما في تاريخ
              </label>

              <input
                type="date"
                value={reportDate}
                onChange={(event) => setReportDate(event.target.value)}
                className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg px-4 text-sm text-gray-900 font-medium outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleRefresh}
                className="w-full h-12 inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition"
              >
                <FiRefreshCw size={18} />
                تحديث التقرير
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          التقرير
      ================================================== */}

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden print:border-0 print:shadow-none">
        {/* Header التقرير */}

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
                قائمة المركز المالي
              </h2>

              <p className="text-sm text-gray-600 mt-2">
                كما في تاريخ <span className="font-bold">{reportDate}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            Summary Cards
        ================================================== */}

        <div className="p-5 md:p-6 border-b border-gray-200 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الأصول</p>

                  <p className="text-2xl font-bold text-blue-700 mt-2">
                    {formatMoney(totalAssets)}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">ريال</p>
                </div>

                <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center">
                  <FiTrendingUp size={22} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الخصوم</p>

                  <p className="text-2xl font-bold text-red-700 mt-2">
                    {formatMoney(totalLiabilities)}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">ريال</p>
                </div>

                <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center">
                  <FiCreditCard size={22} className="text-red-600" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">حقوق الملكية</p>

                  <p className="text-2xl font-bold text-green-700 mt-2">
                    {formatMoney(totalEquityWithProfit)}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">ريال</p>
                </div>

                <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center">
                  <FiDollarSign size={22} className="text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            تفاصيل الميزانية
        ================================================== */}

        <div className="p-5 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ==================================================
                الأصول
            ================================================== */}

            <div>
              <div className="flex items-center justify-between bg-blue-900 text-white px-5 py-4 rounded-t-xl">
                <h3 className="text-lg font-bold">الأصول</h3>

                <span className="font-bold">{formatMoney(totalAssets)}</span>
              </div>

              <div className="border-2 border-gray-300 border-t-0 rounded-b-xl overflow-hidden">
                <div className="bg-blue-50 px-5 py-3 border-b border-blue-200">
                  <h4 className="font-bold text-blue-900">الأصول المتداولة</h4>
                </div>

                {currentAssets.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-5 py-3 border-b border-gray-200"
                  >
                    <span className="text-gray-700">{item.name}</span>

                    <span className="font-medium text-gray-900">
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between px-5 py-4 bg-gray-100 border-b-2 border-gray-300">
                  <span className="font-bold text-gray-900">
                    إجمالي الأصول المتداولة
                  </span>

                  <span className="font-bold text-blue-700">
                    {formatMoney(totalCurrentAssets)}
                  </span>
                </div>

                <div className="bg-blue-50 px-5 py-3 border-b border-blue-200">
                  <h4 className="font-bold text-blue-900">
                    الأصول غير المتداولة
                  </h4>
                </div>

                {nonCurrentAssets.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-5 py-3 border-b border-gray-200"
                  >
                    <span className="text-gray-700">{item.name}</span>

                    <span className="font-medium text-gray-900">
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                  <span className="text-gray-700">(-) مجمع الإهلاك</span>

                  <span className="font-medium text-red-600">
                    ({formatMoney(accumulatedDepreciation)})
                  </span>
                </div>

                <div className="flex items-center justify-between px-5 py-4 bg-gray-100 border-b-2 border-gray-300">
                  <span className="font-bold text-gray-900">
                    صافي الأصول غير المتداولة
                  </span>

                  <span className="font-bold text-blue-700">
                    {formatMoney(totalNonCurrentAssets)}
                  </span>
                </div>

                <div className="flex items-center justify-between px-5 py-5 bg-blue-900 text-white">
                  <span className="font-bold text-lg">إجمالي الأصول</span>

                  <span className="font-bold text-lg">
                    {formatMoney(totalAssets)}
                  </span>
                </div>
              </div>
            </div>

            {/* ==================================================
                الخصوم وحقوق الملكية
            ================================================== */}

            <div>
              <div className="flex items-center justify-between bg-gray-900 text-white px-5 py-4 rounded-t-xl">
                <h3 className="text-lg font-bold">الخصوم وحقوق الملكية</h3>

                <span className="font-bold">
                  {formatMoney(totalLiabilitiesAndEquity)}
                </span>
              </div>

              <div className="border-2 border-gray-300 border-t-0 rounded-b-xl overflow-hidden">
                <div className="bg-red-50 px-5 py-3 border-b border-red-200">
                  <h4 className="font-bold text-red-900">الخصوم المتداولة</h4>
                </div>

                {currentLiabilities.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-5 py-3 border-b border-gray-200"
                  >
                    <span className="text-gray-700">{item.name}</span>

                    <span className="font-medium text-gray-900">
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between px-5 py-4 bg-gray-100 border-b-2 border-gray-300">
                  <span className="font-bold text-gray-900">
                    إجمالي الخصوم المتداولة
                  </span>

                  <span className="font-bold text-red-700">
                    {formatMoney(totalCurrentLiabilities)}
                  </span>
                </div>

                <div className="bg-red-50 px-5 py-3 border-b border-red-200">
                  <h4 className="font-bold text-red-900">
                    الخصوم غير المتداولة
                  </h4>
                </div>

                {nonCurrentLiabilities.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-5 py-3 border-b border-gray-200"
                  >
                    <span className="text-gray-700">{item.name}</span>

                    <span className="font-medium text-gray-900">
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between px-5 py-4 bg-gray-100 border-b-2 border-gray-300">
                  <span className="font-bold text-gray-900">إجمالي الخصوم</span>

                  <span className="font-bold text-red-700">
                    {formatMoney(totalLiabilities)}
                  </span>
                </div>

                <div className="bg-green-50 px-5 py-3 border-b border-green-200">
                  <h4 className="font-bold text-green-900">حقوق الملكية</h4>
                </div>

                {equity.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-5 py-3 border-b border-gray-200"
                  >
                    <span className="text-gray-700">{item.name}</span>

                    <span className="font-medium text-gray-900">
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                  <span className="text-gray-700">صافي ربح / خسارة الفترة</span>

                  <span
                    className={`font-bold ${
                      currentNetProfit >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {currentNetProfit < 0
                      ? `(${formatMoney(Math.abs(currentNetProfit))})`
                      : formatMoney(currentNetProfit)}
                  </span>
                </div>

                <div className="flex items-center justify-between px-5 py-4 bg-gray-100 border-b-2 border-gray-300">
                  <span className="font-bold text-gray-900">
                    إجمالي حقوق الملكية
                  </span>

                  <span className="font-bold text-green-700">
                    {formatMoney(totalEquityWithProfit)}
                  </span>
                </div>

                <div className="flex items-center justify-between px-5 py-5 bg-gray-900 text-white">
                  <span className="font-bold text-lg">
                    إجمالي الخصوم وحقوق الملكية
                  </span>

                  <span className="font-bold text-lg">
                    {formatMoney(totalLiabilitiesAndEquity)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              حالة الميزانية
          ================================================== */}

          <div
            className={`mt-8 rounded-xl border-2 p-5 ${
              isBalanced
                ? "bg-green-50 border-green-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                  isBalanced ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {isBalanced ? (
                  <FiCheckCircle size={24} className="text-green-600" />
                ) : (
                  <FiAlertCircle size={24} className="text-red-600" />
                )}
              </div>

              <div className="flex-1">
                <h3
                  className={`font-bold ${
                    isBalanced ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {isBalanced ? "الميزانية متوازنة" : "الميزانية غير متوازنة"}
                </h3>

                <p
                  className={`text-sm mt-1 ${
                    isBalanced ? "text-green-700" : "text-red-700"
                  }`}
                >
                  الأصول = الخصوم + حقوق الملكية
                </p>

                {!isBalanced && (
                  <p className="text-sm text-red-700 mt-2 font-semibold">
                    الفرق: {formatMoney(Math.abs(difference))} ريال
                  </p>
                )}
              </div>

              <div className="text-left">
                <p className="text-xs text-gray-500">الفرق</p>

                <p
                  className={`font-bold ${
                    isBalanced ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {formatMoney(Math.abs(difference))}
                </p>
              </div>
            </div>
          </div>

          {/* ==================================================
              التوقيعات
          ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-center">
            <div>
              <p className="font-bold text-gray-800">إعداد التقرير</p>

              <div className="border-b border-gray-400 mt-12"></div>
            </div>

            <div>
              <p className="font-bold text-gray-800">المحاسب</p>

              <div className="border-b border-gray-400 mt-12"></div>
            </div>

            <div>
              <p className="font-bold text-gray-800">المدير</p>

              <div className="border-b border-gray-400 mt-12"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          Print CSS
      ====================================================== */}

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
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

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </main>
  );
}
