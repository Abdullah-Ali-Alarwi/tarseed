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
  FiUserCheck,
} from "react-icons/fi";

import { useSalesStore } from "@/Store/salesStore";
import { usePurchasesStore } from "@/Store/purchasesStore";
import { useCustomersStore } from "@/Store/customersStore";
import { useSuppliersStore } from "@/Store/suppliersStore";
import { useProductsStore } from "@/Store/productsStore";

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  /* =======================================================
     ZUSTAND STORES
  ======================================================= */

  const sales = useSalesStore((state) => state.sales);
  const purchases = usePurchasesStore((state) => state.purchases);
  const customers = useCustomersStore((state) => state.customers);
  const suppliers = useSuppliersStore((state) => state.suppliers);
  const products = useProductsStore((state) => state.products);

  /* =======================================================
     HELPERS
  ======================================================= */

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  /* =======================================================
     SALES
  ======================================================= */

  const totalSales = useMemo(() => {
    return sales.reduce((total, invoice) => total + getSaleTotal(invoice), 0);
  }, [sales]);

  const totalSalesInvoices = sales.length;

  const paidSales = useMemo(() => {
    return sales
      .filter(
        (invoice) =>
          invoice.status !== "cancelled" && invoice.paymentMethod !== "credit",
      )
      .reduce((total, invoice) => total + getSaleTotal(invoice), 0);
  }, [sales]);

  /* =======================================================
     PURCHASES
  ======================================================= */

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

  /* =======================================================
     CUSTOMERS
  ======================================================= */

  const totalCustomers = customers.length;

  /* =======================================================
     SUPPLIERS
  ======================================================= */

  const totalSuppliers = suppliers.length;

  /* =======================================================
     INVENTORY
  ======================================================= */

  const inventoryData = useMemo(() => {
    return products.map((product) => {
      let purchasedQuantity = 0;
      let soldQuantity = 0;

      let purchaseValue = 0;
      let purchaseQuantity = 0;

      /* ---------------------------------------------------
         PURCHASES
      --------------------------------------------------- */

      purchases.forEach((purchase) => {
        purchase.items.forEach((item) => {
          if (item.productId !== product.id) {
            return;
          }

          const quantity = getNumericAmount(item.quantity);
          const price = getNumericAmount(item.price);

          purchasedQuantity += quantity;
          purchaseQuantity += quantity;
          purchaseValue += quantity * price;
        });
      });

      /* ---------------------------------------------------
         SALES
      --------------------------------------------------- */

      sales.forEach((sale) => {
        // الفواتير الملغاة لا تؤثر على المخزون
        if (sale.status === "cancelled") {
          return;
        }

        sale.items.forEach((item) => {
          if (item.productId !== product.id) {
            return;
          }

          soldQuantity += getNumericAmount(item.quantity);
        });
      });

      /* ---------------------------------------------------
         CURRENT QUANTITY
      --------------------------------------------------- */

      const quantity = Math.max(purchasedQuantity - soldQuantity, 0);

      /* ---------------------------------------------------
         AVERAGE PURCHASE PRICE
      --------------------------------------------------- */

      const averagePurchasePrice =
        purchaseQuantity > 0 ? purchaseValue / purchaseQuantity : 0;

      /* ---------------------------------------------------
         INVENTORY VALUE
      --------------------------------------------------- */

      const inventoryValue = quantity * averagePurchasePrice;

      return {
        id: product.id,
        code: product.code,
        name: product.name,
        unit: product.unit || "وحدة",
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

  /* =======================================================
     SALES CHANGE
  ======================================================= */

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

  /* =======================================================
     PURCHASE CHANGE
  ======================================================= */

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

  /* =======================================================
     STATISTICS
  ======================================================= */

  const stats = [
    {
      title: "إجمالي المبيعات",
      value: formatMoney(totalSales),
      currency: "ريال",
      change: `${salesChange >= 0 ? "+" : ""}${salesChange.toFixed(1)}%`,
      icon: FiDollarSign,
      positive: salesChange >= 0,
      href: "/sales",
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
      href: "/purchases",
    },
    {
      title: "العملاء",
      value: totalCustomers.toLocaleString("ar-SA"),
      currency: "عميل",
      change: `+${totalCustomers}`,
      icon: FiUsers,
      positive: true,
      href: "/customers",
    },
    {
      title: "الموردين",
      value: totalSuppliers.toLocaleString("ar-SA"),
      currency: "مورد",
      change: `+${totalSuppliers}`,
      icon: FiTruck,
      positive: true,
      href: "/suppliers",
    },
  ];

  /* =======================================================
     SALES CHART
  ======================================================= */

  const salesChart = useMemo(() => {
    const result = Array.from({ length: 12 }, (_, index) => ({
      label: `${index + 1}`,
      amount: 0,
    }));

    sales.forEach((invoice) => {
      if (invoice.status === "cancelled") {
        return;
      }

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

  /* =======================================================
     PURCHASE CHART
  ======================================================= */

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

  /* =======================================================
     RECENT SALES
  ======================================================= */

  const recentSales = useMemo(() => {
    return [...sales]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 5);
  }, [sales]);

  /* =======================================================
     RECENT PURCHASES
  ======================================================= */

  const recentPurchases = useMemo(() => {
    return [...purchases]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 5);
  }, [purchases]);

  /* =======================================================
     INVENTORY DISPLAY
  ======================================================= */

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

  /* =======================================================
     CUSTOMER BALANCES
  ======================================================= */

  const totalCustomerBalances = useMemo(() => {
    return customers.reduce(
      (total, customer) => total + getNumericAmount(customer.balance),
      0,
    );
  }, [customers]);

  /* =======================================================
     SUPPLIER BALANCES
  ======================================================= */

  const totalSupplierBalances = useMemo(() => {
    return suppliers.reduce(
      (total, supplier) => total + getNumericAmount(supplier.balance),
      0,
    );
  }, [suppliers]);

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6" dir="rtl">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl md:text-3xl">
          لوحة التحكم
        </h1>

        <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
          مرحباً بك في نظام الإدارة المحاسبية
        </p>
      </div>

      {/* ===================================================
          STATISTICS
      =================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:mb-8 lg:grid-cols-4 lg:gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="
                group
                block
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-4
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:border-blue-200
                hover:shadow-md
                active:scale-[0.99]
                sm:p-5
              "
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="mb-2 text-xs text-slate-500 sm:text-sm">
                    {stat.title}
                  </p>

                  <div className="flex items-end gap-2">
                    <h2 className="truncate text-xl font-bold text-slate-800 sm:text-2xl">
                      {stat.value}
                    </h2>

                    <span className="mb-1 shrink-0 text-[10px] text-slate-400 sm:text-xs">
                      {stat.currency}
                    </span>
                  </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100 sm:h-12 sm:w-12">
                  <Icon size={21} />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1 text-xs sm:mt-4 sm:text-sm">
                {stat.positive ? (
                  <FiArrowUpRight className="text-green-500" />
                ) : (
                  <FiArrowDownRight className="text-red-500" />
                )}

                <span
                  className={
                    stat.positive
                      ? "font-medium text-green-500"
                      : "font-medium text-red-500"
                  }
                >
                  {stat.change}
                </span>

                <span className="mr-1 text-[10px] text-slate-400 sm:text-xs">
                  من البيانات الحالية
                </span>
              </div>

              <div className="mt-3 border-t border-slate-100 pt-2 text-[10px] text-blue-500 opacity-0 transition group-hover:opacity-100">
                عرض التفاصيل ←
              </div>
            </Link>
          );
        })}
      </div>

      {/* ===================================================
          SALES + QUICK ACTIONS
      =================================================== */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        {/* SALES */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:col-span-2">
          <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                ملخص المبيعات
              </h2>

              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                إجمالي المبيعات: {formatMoney(totalSales)} ريال
              </p>
            </div>

            <Link
              href="/sales"
              className="w-fit rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
            >
              عرض المبيعات
            </Link>
          </div>

          <div className="h-52 overflow-hidden border-b border-slate-100 sm:h-64">
            <div className="flex h-full items-end justify-between gap-1.5 sm:gap-2">
              {salesChart.map((item, index) => (
                <div
                  key={index}
                  className="flex h-full flex-1 flex-col items-center justify-end"
                >
                  <div className="relative flex w-full justify-center">
                    {item.amount > 0 && (
                      <span className="absolute -top-6 whitespace-nowrap text-[8px] text-slate-400 sm:-top-7 sm:text-[10px]">
                        {formatMoney(item.amount)}
                      </span>
                    )}

                    <div
                      className="
                        w-full
                        max-w-10
                        rounded-t-lg
                        bg-blue-600
                        transition
                        hover:bg-blue-700
                      "
                      style={{
                        height: `${item.height}%`,
                      }}
                    />
                  </div>

                  <span className="mt-2 text-[9px] text-slate-400 sm:text-xs">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-2 text-[10px] text-slate-400 sm:flex-row sm:text-xs">
            <span>{totalSalesInvoices} فاتورة مبيعات</span>

            <span>المدفوع: {formatMoney(paidSales)} ريال</span>
          </div>
        </div>

        {/* QUICK ACTIONS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-bold text-slate-800 sm:mb-5 sm:text-lg">
            العمليات السريعة
          </h2>

          <div className="space-y-1">
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
              href="/suppliers/new"
              icon={<FiUserCheck />}
              title="إضافة مورد"
              description="تسجيل مورد جديد"
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

      {/* ===================================================
          PURCHASES OVERVIEW
      =================================================== */}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 sm:text-lg">
              ملخص المشتريات
            </h2>

            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              إجمالي المشتريات: {formatMoney(totalPurchases)} ريال
            </p>
          </div>

          <Link
            href="/purchases"
            className="w-fit rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600 transition hover:bg-emerald-100 sm:px-4 sm:text-sm"
          >
            عرض المشتريات
          </Link>
        </div>

        <div className="h-48 overflow-hidden border-b border-slate-100 sm:h-56">
          <div className="flex h-full items-end justify-between gap-1.5 sm:gap-2">
            {purchasesChart.map((item, index) => (
              <div
                key={index}
                className="flex h-full flex-1 flex-col items-center justify-end"
              >
                <div className="relative flex w-full justify-center">
                  {item.amount > 0 && (
                    <span className="absolute -top-6 whitespace-nowrap text-[8px] text-slate-400 sm:-top-7 sm:text-[10px]">
                      {formatMoney(item.amount)}
                    </span>
                  )}

                  <div
                    className="
                      w-full
                      max-w-10
                      rounded-t-lg
                      bg-emerald-600
                      transition
                      hover:bg-emerald-700
                    "
                    style={{
                      height: `${item.height}%`,
                    }}
                  />
                </div>

                <span className="mt-2 text-[9px] text-slate-400 sm:text-xs">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-2 text-[10px] text-slate-400 sm:flex-row sm:text-xs">
          <span>{totalPurchaseInvoices} فاتورة مشتريات</span>

          <span>المدفوع: {formatMoney(paidPurchases)} ريال</span>
        </div>
      </div>

      {/* ===================================================
          RECENT SALES + PURCHASES
      =================================================== */}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 lg:grid-cols-2 lg:gap-6">
        {/* RECENT SALES */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between sm:mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                آخر فواتير المبيعات
              </h2>

              <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
                آخر فواتير المبيعات المسجلة
              </p>
            </div>

            <Link
              href="/sales"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 sm:text-sm"
            >
              عرض الكل
            </Link>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {recentSales.length > 0 ? (
              recentSales.map((invoice) => (
                <Invoice
                  key={invoice.id}
                  number={`#${invoice.invoiceNumber}`}
                  customer={invoice.customerName || "عميل نقدي"}
                  amount={`${formatMoney(getSaleTotal(invoice))} ريال`}
                  status={getDisplayStatus(invoice)}
                  href={`/sales/${invoice.id}`}
                />
              ))
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">
                لا توجد فواتير مبيعات
              </div>
            )}
          </div>
        </div>

        {/* RECENT PURCHASES */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between sm:mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                آخر فواتير المشتريات
              </h2>

              <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
                آخر فواتير المشتريات المسجلة
              </p>
            </div>

            <Link
              href="/purchases"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 sm:text-sm"
            >
              عرض الكل
            </Link>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {recentPurchases.length > 0 ? (
              recentPurchases.map((purchase) => (
                <Purchase
                  key={purchase.id}
                  number={`#${purchase.invoiceNumber}`}
                  supplier={purchase.supplier || "مورد غير محدد"}
                  amount={`${formatMoney(getPurchaseTotal(purchase))} ريال`}
                  status={getDisplayStatus(purchase)}
                  href={`/purchases/${purchase.id}`}
                />
              ))
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">
                لا توجد فواتير مشتريات
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================
          INVENTORY
      =================================================== */}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-6">
        <div className="mb-5 flex items-center justify-between sm:mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 sm:text-lg">
              حالة المخزون
            </h2>

            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              مستويات المخزون الحالية
            </p>
          </div>

          <Link
            href="/inventory"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              bg-blue-50
              text-blue-600
              transition
              hover:bg-blue-100
              sm:h-10
              sm:w-10
            "
          >
            <FiPackage size={20} />
          </Link>
        </div>

        <div className="space-y-4 sm:space-y-5">
          {inventoryDisplay.length > 0 ? (
            inventoryDisplay.map((item, index) => (
              <Link
                key={`${item.name}-${index}`}
                href="/inventory"
                className="block rounded-lg p-2 transition hover:bg-slate-50"
              >
                <InventoryItem
                  name={item.name}
                  quantity={item.quantity}
                  unit={item.unit}
                  percentage={item.percentage}
                />
              </Link>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-slate-400">
              لا توجد بيانات مخزون
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4 sm:mt-6">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500">إجمالي الأصناف</span>

            <Link
              href="/inventory"
              className="font-bold text-blue-600 hover:text-blue-700"
            >
              {totalProducts} صنف
            </Link>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500">إجمالي الكميات</span>

            <span className="font-bold text-slate-700">
              {formatMoney(totalInventoryItems)}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500">قيمة المخزون</span>

            <span className="font-bold text-slate-700">
              {formatMoney(totalInventoryValue)} ريال
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================
          CUSTOMER + SUPPLIER BALANCES
      =================================================== */}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 md:grid-cols-2 md:gap-6">
        {/* CUSTOMER BALANCES */}

        <Link
          href="/customers"
          className="
            group
            block
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
            transition
            hover:-translate-y-0.5
            hover:border-blue-200
            hover:shadow-md
            sm:p-6
          "
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 sm:text-sm">أرصدة العملاء</p>

              <h2 className="mt-2 text-xl font-bold text-slate-800 sm:text-2xl">
                {formatMoney(totalCustomerBalances)}
              </h2>

              <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
                إجمالي المبالغ المستحقة على العملاء
              </p>

              <p className="mt-3 text-[10px] font-medium text-blue-500 opacity-0 transition group-hover:opacity-100">
                عرض العملاء ←
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100 sm:h-12 sm:w-12">
              <FiUsers size={22} />
            </div>
          </div>
        </Link>

        {/* SUPPLIER BALANCES */}

        <Link
          href="/suppliers"
          className="
            group
            block
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
            transition
            hover:-translate-y-0.5
            hover:border-emerald-200
            hover:shadow-md
            sm:p-6
          "
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 sm:text-sm">
                أرصدة الموردين
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-800 sm:text-2xl">
                {formatMoney(totalSupplierBalances)}
              </h2>

              <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
                إجمالي المبالغ المستحقة للموردين
              </p>

              <p className="mt-3 text-[10px] font-medium text-emerald-600 opacity-0 transition group-hover:opacity-100">
                عرض الموردين ←
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100 sm:h-12 sm:w-12">
              <FiTruck size={22} />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

/* =========================================================
   DAY
========================================================= */

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

/* =========================================================
   NUMERIC VALUE
========================================================= */

function getNumericAmount(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    return Number(value.replace(/[^\d.-]/g, "")) || 0;
  }

  return 0;
}

/* =========================================================
   SALES TOTAL
========================================================= */

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

/* =========================================================
   PURCHASE TOTAL
========================================================= */

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

/* =========================================================
   STATUS
========================================================= */

function getDisplayStatus(item: {
  paymentMethod?: "cash" | "bank" | "credit";
  status?: string;
}) {
  if (item.status === "cancelled") {
    return "ملغاة";
  }

  if (item.status === "paid" || item.status === "completed") {
    return "مدفوعة";
  }

  if (item.status === "pending") {
    return "معلقة";
  }

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

/* =========================================================
   QUICK ACTION
========================================================= */

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
        group
        flex
        w-full
        items-center
        gap-3
        rounded-xl
        p-2.5
        text-right
        transition
        hover:bg-blue-50
        active:scale-[0.99]
        sm:p-3
      "
    >
      <div
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-blue-50
          text-blue-600
          transition
          group-hover:bg-blue-100
          sm:h-10
          sm:w-10
        "
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-700 sm:text-sm">
          {title}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-400 sm:mt-1 sm:text-xs">
          {description}
        </p>
      </div>
    </Link>
  );
}

/* =========================================================
   SALES INVOICE
========================================================= */

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
        : status === "ملغاة"
          ? "bg-red-50 text-red-600"
          : "bg-slate-50 text-slate-500";

  return (
    <Link
      href={href}
      className="
        flex
        items-center
        justify-between
        rounded-lg
        border-b
        border-slate-100
        px-2
        pb-3
        transition
        hover:bg-slate-50
        sm:pb-4
      "
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-700 sm:text-sm">
          {number}
        </p>

        <p className="mt-1 truncate text-[10px] text-slate-400 sm:text-xs">
          {customer}
        </p>
      </div>

      <div className="shrink-0 text-left">
        <p className="text-xs font-semibold text-slate-700 sm:text-sm">
          {amount}
        </p>

        <span
          className={`
            mt-1
            inline-block
            rounded-md
            px-2
            py-0.5
            text-[9px]
            font-medium
            sm:px-2.5
            sm:py-1
            sm:text-xs
            ${statusStyle}
          `}
        >
          {status}
        </span>
      </div>
    </Link>
  );
}

/* =========================================================
   PURCHASE
========================================================= */

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
      : status === "آجلة" || status === "معلقة"
        ? "bg-yellow-50 text-yellow-600"
        : status === "ملغاة"
          ? "bg-red-50 text-red-600"
          : "bg-slate-50 text-slate-500";

  return (
    <Link
      href={href}
      className="
        flex
        items-center
        justify-between
        rounded-lg
        border-b
        border-slate-100
        px-2
        pb-3
        transition
        hover:bg-slate-50
        sm:pb-4
      "
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-700 sm:text-sm">
          {number}
        </p>

        <p className="mt-1 truncate text-[10px] text-slate-400 sm:text-xs">
          {supplier}
        </p>
      </div>

      <div className="shrink-0 text-left">
        <p className="text-xs font-semibold text-slate-700 sm:text-sm">
          {amount}
        </p>

        <span
          className={`
            mt-1
            inline-block
            rounded-md
            px-2
            py-0.5
            text-[9px]
            font-medium
            sm:px-2.5
            sm:py-1
            sm:text-xs
            ${statusStyle}
          `}
        >
          {status}
        </span>
      </div>
    </Link>
  );
}

/* =========================================================
   INVENTORY ITEM
========================================================= */

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
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="truncate text-xs font-medium text-slate-700 sm:text-sm">
          {name}
        </span>

        <span className="shrink-0 text-[10px] text-slate-400 sm:text-xs">
          {quantity.toLocaleString("ar-SA")} {unit}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 sm:h-2">
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
