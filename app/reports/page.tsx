"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FiBarChart2,
  FiDollarSign,
  FiShoppingCart,
  FiPackage,
  FiUsers,
  FiTruck,
  FiBookOpen,
  FiFileText,
  FiArrowLeft,
} from "react-icons/fi";
import { useERPStore } from "@/Store/erpStore";

export default function ReportsPage() {
  const { sales, purchases, products, journalEntries } = useERPStore();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ======================================================
  // التقارير
  // ======================================================

  const reports = [
    {
      title: "قائمة الدخل",
      description: "عرض الإيرادات والمصروفات وصافي الربح أو الخسارة.",
      icon: FiDollarSign,
      href: "/reports/income-statement",
      category: "تقارير مالية",
    },
    {
      title: "الميزانية العمومية",
      description: "عرض الأصول والالتزامات وحقوق الملكية.",
      icon: FiBarChart2,
      href: "/reports/balance-sheet",
      category: "تقارير مالية",
    },
    {
      title: "ميزان المراجعة",
      description: "عرض أرصدة الحسابات المدينة والدائنة.",
      icon: FiBookOpen,
      href: "/reports/trial-balance",
      category: "تقارير مالية",
    },
    {
      title: "الأستاذ العام",
      description: "عرض جميع الحركات والأرصدة الخاصة بالحسابات.",
      icon: FiFileText,
      href: "/reports/general-ledger",
      category: "تقارير مالية",
    },
    {
      title: "تقرير المبيعات",
      description: "تحليل المبيعات حسب الفترة والعملاء والأصناف.",
      icon: FiShoppingCart,
      href: "/reports/sales",
      category: "تقارير المبيعات",
    },
    {
      title: "تقرير المشتريات",
      description: "عرض وتحليل المشتريات حسب الفترة والموردين.",
      icon: FiShoppingCart,
      href: "/reports/purchases",
      category: "تقارير المشتريات",
    },
    {
      title: "تقرير المخزون",
      description: "عرض كميات وقيم الأصناف وحركة المخزون.",
      icon: FiPackage,
      href: "/reports/inventory",
      category: "تقارير المخزون",
    },
    {
      title: "كشف حساب العملاء",
      description: "عرض أرصدة العملاء وحركة الحساب والتحصيلات.",
      icon: FiUsers,
      href: "/reports/customers",
      category: "تقارير العملاء",
    },
    {
      title: "كشف حساب الموردين",
      description: "عرض أرصدة الموردين والفواتير والمدفوعات.",
      icon: FiTruck,
      href: "/reports/suppliers",
      category: "تقارير الموردين",
    },
  ];

  // ======================================================
  // المبيعات حسب الفترة
  // ======================================================

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesFrom = !fromDate || sale.date >= fromDate;

      const matchesTo = !toDate || sale.date <= toDate;

      return matchesFrom && matchesTo;
    });
  }, [sales, fromDate, toDate]);

  // ======================================================
  // المشتريات حسب الفترة
  // ======================================================

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const matchesFrom = !fromDate || purchase.date >= fromDate;

      const matchesTo = !toDate || purchase.date <= toDate;

      return matchesFrom && matchesTo;
    });
  }, [purchases, fromDate, toDate]);

  // ======================================================
  // القيود المرحلة حسب الفترة
  // ======================================================

  const postedJournals = useMemo(() => {
    return journalEntries.filter((entry) => {
      if (entry.status !== "posted") {
        return false;
      }

      const matchesFrom = !fromDate || entry.date >= fromDate;

      const matchesTo = !toDate || entry.date <= toDate;

      return matchesFrom && matchesTo;
    });
  }, [journalEntries, fromDate, toDate]);

  // ======================================================
  // إجمالي المبيعات
  // ======================================================

  const totalSales = useMemo(() => {
    return filteredSales.reduce(
      (sum, sale) => sum + (Number(sale.total) || 0),
      0,
    );
  }, [filteredSales]);

  // ======================================================
  // إجمالي المشتريات
  // ======================================================

  const totalPurchases = useMemo(() => {
    return filteredPurchases.reduce(
      (sum, purchase) => sum + (Number(purchase.total) || 0),
      0,
    );
  }, [filteredPurchases]);

  // ======================================================
  // قيمة المخزون
  //
  // الكمية = المشتريات - المبيعات
  // التكلفة = متوسط أسعار الشراء
  // ======================================================

  const inventoryValue = useMemo(() => {
    return products.reduce((total, product) => {
      let purchasedQuantity = 0;
      let purchasedValue = 0;
      let soldQuantity = 0;

      // المشتريات
      filteredPurchases.forEach((purchase) => {
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
      filteredSales.forEach((sale) => {
        sale.items.forEach((item) => {
          if (item.productId === product.id) {
            soldQuantity += Number(item.quantity) || 0;
          }
        });
      });

      const currentStock = Math.max(purchasedQuantity - soldQuantity, 0);

      const averagePurchasePrice =
        purchasedQuantity > 0 ? purchasedValue / purchasedQuantity : 0;

      return total + currentStock * averagePurchasePrice;
    }, 0);
  }, [products, filteredPurchases, filteredSales]);

  // ======================================================
  // إجمالي الإيرادات من القيود
  // ======================================================

  const totalRevenue = useMemo(() => {
    return postedJournals.reduce((sum, entry) => {
      return (
        sum +
        entry.lines
          .filter((line) => String(line.accountCode).startsWith("4"))
          .reduce((lineSum, line) => lineSum + (Number(line.credit) || 0), 0)
      );
    }, 0);
  }, [postedJournals]);

  // ======================================================
  // إجمالي المصروفات من القيود
  // ======================================================

  const totalExpenses = useMemo(() => {
    return postedJournals.reduce((sum, entry) => {
      return (
        sum +
        entry.lines
          .filter((line) => {
            const code = String(line.accountCode);

            return code.startsWith("5") || code.startsWith("6");
          })
          .reduce((lineSum, line) => lineSum + (Number(line.debit) || 0), 0)
      );
    }, 0);
  }, [postedJournals]);

  // ======================================================
  // صافي الربح
  //
  // نعتمد القيود عندما تكون موجودة،
  // وإلا نستخدم المبيعات - المشتريات
  // ======================================================

  const netProfit =
    totalRevenue !== 0 || totalExpenses !== 0
      ? totalRevenue - totalExpenses
      : totalSales - totalPurchases;

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
  // إنشاء رابط التقرير مع الفترة
  // ======================================================

  const buildReportHref = (href: string) => {
    const params = new URLSearchParams();

    if (fromDate) {
      params.set("from", fromDate);
    }

    if (toDate) {
      params.set("to", toDate);
    }

    const query = params.toString();

    return query ? `${href}?${query}` : href;
  };

  // ======================================================
  // تطبيق الفترة
  // ======================================================

  const applyCurrentPeriod = () => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams();

    if (fromDate) {
      params.set("from", fromDate);
    }

    if (toDate) {
      params.set("to", toDate);
    }

    const query = params.toString();

    window.history.replaceState(
      null,
      "",
      query ? `/reports?${query}` : "/reports",
    );
  };

  // ======================================================
  // إعادة ضبط الفترة
  // ======================================================

  const resetPeriod = () => {
    setFromDate("");
    setToDate("");

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/reports");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      {/* ==================================================
          Header
      ================================================== */}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">التقارير</h1>

        <p className="text-sm text-gray-500 mt-1">
          التقارير المالية والإدارية لنظام ERP
        </p>
      </div>

      {/* ==================================================
          Summary
      ================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <SummaryCard
          title="إجمالي المبيعات"
          value={formatMoney(totalSales)}
          subtitle="ريال"
          icon={FiShoppingCart}
        />

        <SummaryCard
          title="إجمالي المشتريات"
          value={formatMoney(totalPurchases)}
          subtitle="ريال"
          icon={FiDollarSign}
        />

        <SummaryCard
          title="قيمة المخزون"
          value={formatMoney(inventoryValue)}
          subtitle="ريال"
          icon={FiPackage}
        />

        <SummaryCard
          title="صافي الربح"
          value={formatMoney(netProfit)}
          subtitle="ريال"
          icon={FiBarChart2}
        />
      </div>

      {/* ==================================================
          Period
      ================================================== */}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-2">من تاريخ</label>

            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-2">
              إلى تاريخ
            </label>

            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <button
            type="button"
            onClick={applyCurrentPeriod}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition"
          >
            تطبيق الفترة
          </button>

          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={resetPeriod}
              className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium transition"
            >
              إلغاء الفترة
            </button>
          )}
        </div>
      </div>

      {/* ==================================================
          Reports
      ================================================== */}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">جميع التقارير</h2>

            {(fromDate || toDate) && (
              <p className="text-xs text-gray-500 mt-1">
                الفترة المحددة: {fromDate || "البداية"} إلى{" "}
                {toDate || "النهاية"}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((report) => {
            const Icon = report.icon;

            return (
              <Link
                key={report.href}
                href={buildReportHref(report.href)}
                className="group bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-amber-200 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Icon size={24} />
                  </div>

                  <FiArrowLeft
                    size={20}
                    className="text-gray-300 group-hover:text-amber-600 transition"
                  />
                </div>

                <span className="inline-block mt-5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                  {report.category}
                </span>

                <h3 className="font-bold text-gray-800 mt-4">{report.title}</h3>

                <p className="text-sm text-gray-500 leading-6 mt-2">
                  {report.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ==================================================
          Export
      ================================================== */}

      <div className="bg-gray-900 rounded-xl p-6 sm:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h2 className="text-xl font-bold">تصدير التقارير</h2>

            <p className="text-gray-400 text-sm mt-2">
              يمكنك لاحقًا ربط هذه الأزرار بتصدير التقارير إلى Excel أو PDF.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="px-5 py-2.5 rounded-lg bg-white text-gray-800 text-sm font-medium hover:bg-gray-100 transition"
            >
              تصدير Excel
            </button>

            <button
              type="button"
              className="px-5 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition"
            >
              تصدير PDF
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// ======================================================
// Summary Card
// ======================================================

type SummaryCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
};

function SummaryCard({ title, value, subtitle, icon: Icon }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <div className="flex items-end gap-2 mt-2">
            <h2 className="text-2xl font-bold text-gray-800">{value}</h2>

            <span className="text-xs text-gray-400 mb-1">{subtitle}</span>
          </div>
        </div>

        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
