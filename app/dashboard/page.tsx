"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiTruck,
  FiPackage,
  FiArrowUpRight,
  FiArrowDownRight,
  FiFileText,
  FiUserPlus,
  FiBookOpen,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function Dashboard() {
  /* =====================================================
     ZUSTAND
  ===================================================== */

  const sales = useERPStore((state) => state.sales);
  const purchases = useERPStore((state) => state.purchases);
  const customers = useERPStore((state) => state.customers);
  const suppliers = useERPStore((state) => state.suppliers);
  const products = useERPStore((state) => state.products);

  /* =====================================================
     HELPERS
  ===================================================== */

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  /* =====================================================
     SALES
  ===================================================== */

  const totalSales = useMemo(() => {
    return sales.reduce((total, invoice) => total + getSaleTotal(invoice), 0);
  }, [sales]);

  const totalSalesInvoices = sales.length;

  const paidSales = useMemo(() => {
    return sales
      .filter((invoice) => invoice.paymentMethod !== "credit")
      .reduce((total, invoice) => total + getSaleTotal(invoice), 0);
  }, [sales]);

  /* =====================================================
     PURCHASES
  ===================================================== */

  const totalPurchases = useMemo(() => {
    return purchases.reduce(
      (total, purchase) => total + getPurchaseTotal(purchase),
      0,
    );
  }, [purchases]);

  const totalPurchaseInvoices = purchases.length;

  const paidPurchases = useMemo(() => {
    return purchases
      .filter((purchase) => purchase.paymentMethod !== "credit")
      .reduce((total, purchase) => total + getPurchaseTotal(purchase), 0);
  }, [purchases]);

  /* =====================================================
     CUSTOMERS
  ===================================================== */

  const totalCustomers = customers.length;

  /* =====================================================
     SUPPLIERS
  ===================================================== */

  const totalSuppliers = suppliers.length;

  /* =====================================================
     INVENTORY
     
     الكمية الحالية =
     إجمالي المشتريات - إجمالي المبيعات
  ===================================================== */

  const inventoryData = useMemo(() => {
    return products.map((product) => {
      let purchasedQuantity = 0;
      let soldQuantity = 0;

      let purchaseValue = 0;
      let purchaseQuantity = 0;

      /* -----------------------------------------------
         المشتريات
      ----------------------------------------------- */

      purchases.forEach((purchase) => {
        purchase.items.forEach((item) => {
          if (item.productId === product.id) {
            const quantity = getNumericAmount(item.quantity);
            const price = getNumericAmount(item.price);

            purchasedQuantity += quantity;

            purchaseQuantity += quantity;
            purchaseValue += quantity * price;
          }
        });
      });

      /* -----------------------------------------------
         المبيعات
      ----------------------------------------------- */

      sales.forEach((sale) => {
        sale.items.forEach((item) => {
          if (item.productId === product.id) {
            soldQuantity += getNumericAmount(item.quantity);
          }
        });
      });

      /* -----------------------------------------------
         الكمية الحالية
      ----------------------------------------------- */

      const quantity = Math.max(purchasedQuantity - soldQuantity, 0);

      /* -----------------------------------------------
         متوسط سعر الشراء
      ----------------------------------------------- */

      const averagePurchasePrice =
        purchaseQuantity > 0 ? purchaseValue / purchaseQuantity : 0;

      /* -----------------------------------------------
         قيمة المخزون
      ----------------------------------------------- */

      const inventoryValue = quantity * averagePurchasePrice;

      return {
        id: product.id,
        code: product.code,
        name: product.name,
        unit: product.unit,
        quantity,
        averagePurchasePrice,
        inventoryValue,
      };
    });
  }, [products, purchases, sales]);

  const totalProducts = products.length;

  const totalInventoryItems = useMemo(() => {
    return inventoryData.reduce(
      (total, product) => total + product.quantity,
      0,
    );
  }, [inventoryData]);

  const totalInventoryValue = useMemo(() => {
    return inventoryData.reduce(
      (total, product) => total + product.inventoryValue,
      0,
    );
  }, [inventoryData]);

  /* =====================================================
     SALES CHANGE
  ===================================================== */

  const salesChange = useMemo(() => {
    if (sales.length < 2) {
      return 0;
    }

    const sortedSales = [...sales].sort((a, b) =>
      String(b.date).localeCompare(String(a.date)),
    );

    const middle = Math.ceil(sortedSales.length / 2);

    const current = sortedSales
      .slice(0, middle)
      .reduce((total, invoice) => total + getSaleTotal(invoice), 0);

    const previous = sortedSales
      .slice(middle)
      .reduce((total, invoice) => total + getSaleTotal(invoice), 0);

    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
  }, [sales]);

  /* =====================================================
     PURCHASE CHANGE
  ===================================================== */

  const purchasesChange = useMemo(() => {
    if (purchases.length < 2) {
      return 0;
    }

    const sortedPurchases = [...purchases].sort((a, b) =>
      String(b.date).localeCompare(String(a.date)),
    );

    const middle = Math.ceil(sortedPurchases.length / 2);

    const current = sortedPurchases
      .slice(0, middle)
      .reduce((total, purchase) => total + getPurchaseTotal(purchase), 0);

    const previous = sortedPurchases
      .slice(middle)
      .reduce((total, purchase) => total + getPurchaseTotal(purchase), 0);

    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
  }, [purchases]);

  /* =====================================================
     STATISTICS
  ===================================================== */

  const stats = [
    {
      title: "إجمالي المبيعات",
      value: formatMoney(totalSales),
      currency: "ريال",
      change: `${salesChange >= 0 ? "+" : ""}${salesChange.toFixed(1)}%`,
      icon: FiDollarSign,
      positive: salesChange >= 0,
    },
    {
      title: "إجمالي المشتريات",
      value: formatMoney(totalPurchases),
      currency: "ريال",
      change: `${
        purchasesChange >= 0 ? "+" : ""
      }${purchasesChange.toFixed(1)}%`,
      icon: FiShoppingCart,
      positive: purchasesChange >= 0,
    },
    {
      title: "العملاء",
      value: totalCustomers.toLocaleString("ar-SA"),
      currency: "عميل",
      change: `+${totalCustomers}`,
      icon: FiUsers,
      positive: true,
    },
    {
      title: "الموردين",
      value: totalSuppliers.toLocaleString("ar-SA"),
      currency: "مورد",
      change: `+${totalSuppliers}`,
      icon: FiTruck,
      positive: true,
    },
  ];

  /* =====================================================
     SALES CHART
  ===================================================== */

  const salesChart = useMemo(() => {
    const result = Array.from({ length: 12 }, (_, index) => ({
      label: `${index + 1}`,
      amount: 0,
    }));

    sales.forEach((invoice) => {
      const day = getDay(invoice.date);

      if (day >= 1 && day <= 12) {
        result[day - 1].amount += getSaleTotal(invoice);
      }
    });

    const max = Math.max(...result.map((item) => item.amount), 1);

    return result.map((item) => ({
      ...item,
      height: item.amount === 0 ? 3 : Math.max((item.amount / max) * 100, 8),
    }));
  }, [sales]);

  /* =====================================================
     PURCHASE CHART
  ===================================================== */

  const purchasesChart = useMemo(() => {
    const result = Array.from({ length: 12 }, (_, index) => ({
      label: `${index + 1}`,
      amount: 0,
    }));

    purchases.forEach((purchase) => {
      const day = getDay(purchase.date);

      if (day >= 1 && day <= 12) {
        result[day - 1].amount += getPurchaseTotal(purchase);
      }
    });

    const max = Math.max(...result.map((item) => item.amount), 1);

    return result.map((item) => ({
      ...item,
      height: item.amount === 0 ? 3 : Math.max((item.amount / max) * 100, 8),
    }));
  }, [purchases]);

  /* =====================================================
     RECENT SALES
  ===================================================== */

  const recentSales = useMemo(() => {
    return [...sales]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 5);
  }, [sales]);

  /* =====================================================
     RECENT PURCHASES
  ===================================================== */

  const recentPurchases = useMemo(() => {
    return [...purchases]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 5);
  }, [purchases]);

  /* =====================================================
     INVENTORY DISPLAY
  ===================================================== */

  const inventoryDisplay = useMemo(() => {
    return inventoryData.slice(0, 5).map((product) => {
      const minimumStock = 10;

      const percentage = Math.min(
        Math.max((product.quantity / (minimumStock * 2)) * 100, 5),
        100,
      );

      return {
        name: product.name,
        quantity: product.quantity,
        unit: product.unit,
        percentage,
      };
    });
  }, [inventoryData]);

  /* =====================================================
     CUSTOMER RECEIVABLES
  ===================================================== */

  const totalCustomerBalances = useMemo(() => {
    return customers.reduce(
      (total, customer) => total + getNumericAmount(customer.balance),
      0,
    );
  }, [customers]);

  /* =====================================================
     SUPPLIER PAYABLES
  ===================================================== */

  const totalSupplierBalances = useMemo(() => {
    return suppliers.reduce(
      (total, supplier) => total + getNumericAmount(supplier.balance),
      0,
    );
  }, [suppliers]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6" dir="rtl">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          لوحة التحكم
        </h1>

        <p className="text-slate-500 mt-2">
          مرحباً بك في نظام الإدارة المحاسبية
        </p>
      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="
                bg-white
                rounded-2xl
                border
                border-slate-200
                p-5
                shadow-sm
                hover:shadow-md
                hover:border-blue-200
                transition
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-2">{stat.title}</p>

                  <div className="flex items-end gap-2">
                    <h2 className="text-2xl font-bold text-slate-800">
                      {stat.value}
                    </h2>

                    <span className="text-xs text-slate-400 mb-1">
                      {stat.currency}
                    </span>
                  </div>
                </div>

                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon size={23} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1 text-sm">
                {stat.positive ? (
                  <FiArrowUpRight className="text-green-500" />
                ) : (
                  <FiArrowDownRight className="text-red-500" />
                )}

                <span
                  className={
                    stat.positive
                      ? "text-green-500 font-medium"
                      : "text-red-500 font-medium"
                  }
                >
                  {stat.change}
                </span>

                <span className="text-slate-400 mr-1">من البيانات الحالية</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================
          SALES + QUICK ACTIONS
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SALES */}

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-bold text-slate-800 text-lg">
                ملخص المبيعات
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                إجمالي المبيعات: {formatMoney(totalSales)} ريال
              </p>
            </div>

            <div className="text-sm text-slate-500 bg-slate-50 px-4 py-2 rounded-lg">
              {totalSalesInvoices} فاتورة
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-2 border-b border-slate-100">
            {salesChart.map((item, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col justify-end items-center h-full"
              >
                <div className="relative w-full flex justify-center">
                  {item.amount > 0 && (
                    <span className="absolute -top-7 text-[10px] text-slate-400 whitespace-nowrap">
                      {formatMoney(item.amount)}
                    </span>
                  )}

                  <div
                    className="
                      w-full
                      max-w-10
                      bg-blue-600
                      rounded-t-lg
                      hover:bg-blue-700
                      transition
                    "
                    style={{
                      height: `${item.height}%`,
                    }}
                  />
                </div>

                <span className="text-xs text-slate-400 mt-2">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-2 mt-4 text-xs text-slate-400">
            <span>المبيعات الفعلية</span>

            <span>المدفوع: {formatMoney(paidSales)} ريال</span>
          </div>
        </div>

        {/* QUICK ACTIONS */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 text-lg mb-5">
            العمليات السريعة
          </h2>

          <div className="space-y-2">
            <QuickAction
              href="/sales/new"
              icon={<FiFileText />}
              title="فاتورة مبيعات"
              description="إنشاء فاتورة جديدة"
            />

            <QuickAction
              href="/purchases/new"
              icon={<FiShoppingCart />}
              title="فاتورة مشتريات"
              description="إضافة فاتورة مشتريات"
            />

            <QuickAction
              href="/customers/new"
              icon={<FiUserPlus />}
              title="إضافة عميل"
              description="تسجيل عميل جديد"
            />

            <QuickAction
              href="/products/new"
              icon={<FiPackage />}
              title="إضافة صنف"
              description="إضافة منتج للمخزون"
            />

            <QuickAction
              href="/accounting/accounts"
              icon={<FiBookOpen />}
              title="إضافة حساب"
              description="إضافة حساب إلى دليل الحسابات"
            />

            <QuickAction
              href="/accounting/journal/new"
              icon={<FiBookOpen />}
              title="قيد محاسبي"
              description="إضافة قيد يومية"
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          PURCHASES OVERVIEW
      ===================================================== */}

      <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">ملخص المشتريات</h2>

            <p className="text-sm text-slate-400 mt-1">
              إجمالي المشتريات: {formatMoney(totalPurchases)} ريال
            </p>
          </div>

          <Link
            href="/purchases"
            className="
              text-sm
              text-blue-600
              hover:text-blue-700
              font-medium
              bg-blue-50
              px-4
              py-2
              rounded-lg
            "
          >
            عرض المشتريات
          </Link>
        </div>

        <div className="h-56 flex items-end justify-between gap-2 border-b border-slate-100">
          {purchasesChart.map((item, index) => (
            <div
              key={index}
              className="flex-1 flex flex-col justify-end items-center h-full"
            >
              <div className="relative w-full flex justify-center">
                {item.amount > 0 && (
                  <span className="absolute -top-7 text-[10px] text-slate-400 whitespace-nowrap">
                    {formatMoney(item.amount)}
                  </span>
                )}

                <div
                  className="
                    w-full
                    max-w-10
                    bg-emerald-600
                    rounded-t-lg
                    hover:bg-emerald-700
                    transition
                  "
                  style={{
                    height: `${item.height}%`,
                  }}
                />
              </div>

              <span className="text-xs text-slate-400 mt-2">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-2 mt-4 text-xs text-slate-400">
          <span>{totalPurchaseInvoices} فاتورة مشتريات</span>

          <span>المدفوع: {formatMoney(paidPurchases)} ريال</span>
        </div>
      </div>

      {/* =====================================================
          RECENT SALES + PURCHASES
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* RECENT SALES */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="font-bold text-slate-800 text-lg">
                آخر فواتير المبيعات
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                آخر فواتير المبيعات المسجلة
              </p>
            </div>

            <Link
              href="/sales"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              عرض الكل
            </Link>
          </div>

          <div className="space-y-4">
            {recentSales.length > 0 ? (
              recentSales.map((invoice) => (
                <Invoice
                  key={invoice.id}
                  number={`#${invoice.invoiceNumber}`}
                  customer={invoice.customerName}
                  amount={`${formatMoney(getSaleTotal(invoice))} ريال`}
                  status={getDisplayStatus(invoice)}
                  href={`/sales/${invoice.id}`}
                />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                لا توجد فواتير مبيعات
              </div>
            )}
          </div>
        </div>

        {/* RECENT PURCHASES */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="font-bold text-slate-800 text-lg">
                آخر فواتير المشتريات
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                آخر فواتير المشتريات المسجلة
              </p>
            </div>

            <Link
              href="/purchases"
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              عرض الكل
            </Link>
          </div>

          <div className="space-y-4">
            {recentPurchases.length > 0 ? (
              recentPurchases.map((purchase) => (
                <Purchase
                  key={purchase.id}
                  number={`#${purchase.invoiceNumber}`}
                  supplier={purchase.supplierName}
                  amount={`${formatMoney(getPurchaseTotal(purchase))} ريال`}
                  status={getDisplayStatus(purchase)}
                  href={`/purchases/${purchase.id}`}
                />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                لا توجد فواتير مشتريات
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          INVENTORY
      ===================================================== */}

      <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">حالة المخزون</h2>

            <p className="text-sm text-slate-400 mt-1">
              مستويات المخزون الحالية
            </p>
          </div>

          <Link
            href="/inventory"
            className="
              w-10
              h-10
              rounded-lg
              bg-blue-50
              text-blue-600
              flex
              items-center
              justify-center
              hover:bg-blue-100
              transition
            "
          >
            <FiPackage size={21} />
          </Link>
        </div>

        <div className="space-y-5">
          {inventoryDisplay.length > 0 ? (
            inventoryDisplay.map((item, index) => (
              <InventoryItem
                key={`${item.name}-${index}`}
                name={item.name}
                quantity={item.quantity}
                unit={item.unit}
                percentage={item.percentage}
              />
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              لا توجد بيانات مخزون
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between text-sm">
          <span className="text-slate-500">إجمالي الأصناف</span>

          <span className="font-bold text-slate-700">{totalProducts} صنف</span>
        </div>

        <div className="mt-2 flex justify-between text-sm">
          <span className="text-slate-500">إجمالي الكميات</span>

          <span className="font-bold text-slate-700">
            {formatMoney(totalInventoryItems)}
          </span>
        </div>

        <div className="mt-2 flex justify-between text-sm">
          <span className="text-slate-500">قيمة المخزون</span>

          <span className="font-bold text-slate-700">
            {formatMoney(totalInventoryValue)} ريال
          </span>
        </div>
      </div>

      {/* =====================================================
          CUSTOMER + SUPPLIER BALANCES
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* CUSTOMER BALANCES */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">أرصدة العملاء</p>

              <h2 className="text-2xl font-bold text-slate-800 mt-2">
                {formatMoney(totalCustomerBalances)}
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                إجمالي المبالغ المستحقة على العملاء
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FiUsers size={22} />
            </div>
          </div>
        </div>

        {/* SUPPLIER BALANCES */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">أرصدة الموردين</p>

              <h2 className="text-2xl font-bold text-slate-800 mt-2">
                {formatMoney(totalSupplierBalances)}
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                إجمالي المبالغ المستحقة للموردين
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FiTruck size={22} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   DAY
===================================================== */

function getDay(date: unknown): number {
  if (!date) {
    return 0;
  }

  if (typeof date !== "string") {
    return 0;
  }

  const slashParts = date.split("/");

  if (slashParts.length === 3) {
    const first = Number(slashParts[0]);

    if (first >= 1 && first <= 31) {
      return first;
    }
  }

  const parsedDate = new Date(date);

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.getDate();
  }

  return 0;
}

/* =====================================================
   SALES TOTAL
===================================================== */

function getSaleTotal(invoice: {
  total?: number;
  amount?: number | string;
  items?: {
    quantity: number;
    price: number;
    discount?: number;
    tax?: number;
    total?: number;
  }[];
}) {
  if (typeof invoice.total === "number") {
    return invoice.total;
  }

  if (invoice.amount !== undefined) {
    return getNumericAmount(invoice.amount);
  }

  if (invoice.items?.length) {
    return invoice.items.reduce((total, item) => {
      if (typeof item.total === "number") {
        return total + item.total;
      }

      const subtotal =
        getNumericAmount(item.quantity) * getNumericAmount(item.price);

      const discount = getNumericAmount(item.discount);

      return total + Math.max(subtotal - discount, 0);
    }, 0);
  }

  return 0;
}

/* =====================================================
   PURCHASE TOTAL
===================================================== */

function getPurchaseTotal(purchase: {
  total?: number;
  amount?: number | string;
  items?: {
    quantity: number;
    price: number;
    discount?: number;
    tax?: number;
    total?: number;
  }[];
}) {
  if (typeof purchase.total === "number") {
    return purchase.total;
  }

  if (purchase.amount !== undefined) {
    return getNumericAmount(purchase.amount);
  }

  if (purchase.items?.length) {
    return purchase.items.reduce((total, item) => {
      if (typeof item.total === "number") {
        return total + item.total;
      }

      const subtotal =
        getNumericAmount(item.quantity) * getNumericAmount(item.price);

      const discount = getNumericAmount(item.discount);

      return total + Math.max(subtotal - discount, 0);
    }, 0);
  }

  return 0;
}

/* =====================================================
   NUMERIC VALUE
===================================================== */

function getNumericAmount(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value.replace(/[^\d.-]/g, "")) || 0;
  }

  return 0;
}

/* =====================================================
   STATUS
===================================================== */

function getDisplayStatus(item: {
  paymentMethod?: "cash" | "bank" | "credit";
  status?: string;
}) {
  if (item.status) {
    return item.status;
  }

  if (item.paymentMethod === "credit") {
    return "آجلة";
  }

  if (item.paymentMethod === "cash" || item.paymentMethod === "bank") {
    return "مدفوعة";
  }

  return "غير محدد";
}

/* =====================================================
   QUICK ACTION
===================================================== */

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="
        w-full
        flex
        items-center
        gap-3
        p-3
        rounded-xl
        hover:bg-blue-50
        transition
        text-right
        group
      "
    >
      <div
        className="
          w-10
          h-10
          rounded-lg
          bg-blue-50
          group-hover:bg-blue-100
          flex
          items-center
          justify-center
          text-blue-600
          text-lg
          transition
          shrink-0
        "
      >
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>

        <p className="text-xs text-slate-400 mt-1">{description}</p>
      </div>
    </Link>
  );
}

/* =====================================================
   SALES INVOICE
===================================================== */

function Invoice({
  number,
  customer,
  amount,
  status,
  href,
}: {
  number: string;
  customer: string;
  amount: string;
  status: string;
  href: string;
}) {
  const statusStyle =
    status === "مدفوعة" || status === "مكتملة"
      ? "bg-green-50 text-green-600"
      : status === "معلقة" || status === "آجلة"
        ? "bg-yellow-50 text-yellow-600"
        : "bg-red-50 text-red-600";

  return (
    <Link
      href={href}
      className="
        flex
        items-center
        justify-between
        border-b
        border-slate-100
        pb-4
        hover:bg-slate-50
        rounded-lg
        px-2
        -mx-2
        transition
      "
    >
      <div>
        <p className="text-sm font-semibold text-slate-700">{number}</p>

        <p className="text-xs text-slate-400 mt-1">{customer}</p>
      </div>

      <div className="text-left">
        <p className="text-sm font-semibold text-slate-700">{amount}</p>

        <span
          className={`
            inline-block
            mt-1
            px-2.5
            py-1
            rounded-md
            text-xs
            font-medium
            ${statusStyle}
          `}
        >
          {status}
        </span>
      </div>
    </Link>
  );
}

/* =====================================================
   PURCHASE
===================================================== */

function Purchase({
  number,
  supplier,
  amount,
  status,
  href,
}: {
  number: string;
  supplier: string;
  amount: string;
  status: string;
  href: string;
}) {
  const statusStyle =
    status === "مدفوعة" || status === "مكتملة"
      ? "bg-green-50 text-green-600"
      : status === "آجلة"
        ? "bg-yellow-50 text-yellow-600"
        : "bg-red-50 text-red-600";

  return (
    <Link
      href={href}
      className="
        flex
        items-center
        justify-between
        border-b
        border-slate-100
        pb-4
        hover:bg-slate-50
        rounded-lg
        px-2
        -mx-2
        transition
      "
    >
      <div>
        <p className="text-sm font-semibold text-slate-700">{number}</p>

        <p className="text-xs text-slate-400 mt-1">{supplier}</p>
      </div>

      <div className="text-left">
        <p className="text-sm font-semibold text-slate-700">{amount}</p>

        <span
          className={`
            inline-block
            mt-1
            px-2.5
            py-1
            rounded-md
            text-xs
            font-medium
            ${statusStyle}
          `}
        >
          {status}
        </span>
      </div>
    </Link>
  );
}

/* =====================================================
   INVENTORY
===================================================== */

function InventoryItem({
  name,
  quantity,
  unit,
  percentage,
}: {
  name: string;
  quantity: number;
  unit: string;
  percentage: number;
}) {
  let progressStyle = "bg-blue-600";

  if (percentage <= 25) {
    progressStyle = "bg-red-500";
  } else if (percentage <= 50) {
    progressStyle = "bg-yellow-500";
  }

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">{name}</span>

        <span className="text-xs text-slate-400">
          {quantity.toLocaleString("ar-SA")} {unit}
        </span>
      </div>

      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${progressStyle} rounded-full transition-all`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}
