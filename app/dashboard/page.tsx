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

import { useERPStore } from "@/Store/erpStore";

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  /* =======================================================
     ERP STORE
  ======================================================= */

  const sales = useERPStore((state) => state.sales);
  const purchases = useERPStore((state) => state.purchases);
  const customers = useERPStore((state) => state.customers);
  const suppliers = useERPStore((state) => state.suppliers);
  const products = useERPStore((state) => state.products);

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

      /* PURCHASES */

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

      /* SALES */

      sales.forEach((sale) => {
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

      /* CURRENT QUANTITY */

      const quantity = Math.max(purchasedQuantity - soldQuantity, 0);

      /* AVERAGE PURCHASE PRICE */

      const averagePurchasePrice =
        purchaseQuantity > 0 ? purchaseValue / purchaseQuantity : 0;

      /* INVENTORY VALUE */

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
      change: `${purchasesChange >= 0 ? "+" : ""}${purchasesChange.toFixed(1)}%`,
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
    <div
      className="min-h-screen bg-slate-50 p-2.5 sm:p-3 md:p-4 lg:p-5"
      dir="rtl"
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-4 sm:mb-5">
        <h1 className="text-lg font-bold text-slate-800 sm:text-xl md:text-2xl">
          لوحة التحكم
        </h1>

        <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
          مرحباً بك في نظام الإدارة المحاسبية
        </p>
      </div>

      {/* ===================================================
          STATISTICS
      =================================================== */}

      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:mb-5 sm:gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="
                group
                block
                rounded-xl
                border
                border-slate-200
                bg-white
                p-3
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:border-blue-200
                hover:shadow-md
                active:scale-[0.99]
                sm:rounded-2xl
                sm:p-3.5
              "
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="mb-1 text-[10px] text-slate-500 sm:text-xs">
                    {stat.title}
                  </p>

                  <div className="flex items-end gap-1.5">
                    <h2 className="truncate text-base font-bold text-slate-800 sm:text-lg">
                      {stat.value}
                    </h2>

                    <span className="mb-0.5 shrink-0 text-[8px] text-slate-400 sm:text-[10px]">
                      {stat.currency}
                    </span>
                  </div>
                </div>

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-100 sm:h-9 sm:w-9">
                  <Icon size={17} />
                </div>
              </div>

              <div className="mt-2 flex items-center gap-1 text-[9px] sm:text-[10px]">
                {stat.positive ? (
                  <FiArrowUpRight className="text-green-500" size={12} />
                ) : (
                  <FiArrowDownRight className="text-red-500" size={12} />
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

                <span className="mr-0.5 text-[8px] text-slate-400 sm:text-[9px]">
                  من البيانات الحالية
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ===================================================
          SALES + QUICK ACTIONS
      =================================================== */}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
        {/* SALES */}

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 sm:text-base">
                ملخص المبيعات
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
                إجمالي المبيعات: {formatMoney(totalSales)} ريال
              </p>
            </div>

            <Link
              href="/sales"
              className="shrink-0 rounded-md bg-blue-50 px-2.5 py-1.5 text-[10px] font-medium text-blue-600 transition hover:bg-blue-100 sm:text-xs"
            >
              عرض المبيعات
            </Link>
          </div>

          <div className="h-40 overflow-hidden border-b border-slate-100 sm:h-48">
            <div className="flex h-full items-end justify-between gap-1">
              {salesChart.map((item, index) => (
                <div
                  key={index}
                  className="flex h-full flex-1 flex-col items-center justify-end"
                >
                  <div className="relative flex w-full justify-center">
                    {item.amount > 0 && (
                      <span className="absolute -top-5 whitespace-nowrap text-[7px] text-slate-400 sm:-top-6 sm:text-[9px]">
                        {formatMoney(item.amount)}
                      </span>
                    )}

                    <div
                      className="
                        w-full
                        max-w-8
                        rounded-t-md
                        bg-blue-600
                        transition
                        hover:bg-blue-700
                        sm:max-w-9
                      "
                      style={{
                        height: `${item.height}%`,
                      }}
                    />
                  </div>

                  <span className="mt-1.5 text-[8px] text-slate-400 sm:text-[10px]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[9px] text-slate-400 sm:text-[10px]">
            <span>{totalSalesInvoices} فاتورة مبيعات</span>

            <span>المدفوع: {formatMoney(paidSales)} ريال</span>
          </div>
        </div>

        {/* QUICK ACTIONS */}

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
          <h2 className="mb-2.5 text-sm font-bold text-slate-800 sm:text-base">
            العمليات السريعة
          </h2>

          <div className="space-y-0.5">
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

      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:mt-4 sm:rounded-2xl sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 sm:text-base">
              ملخص المشتريات
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
              إجمالي المشتريات: {formatMoney(totalPurchases)} ريال
            </p>
          </div>

          <Link
            href="/purchases"
            className="shrink-0 rounded-md bg-emerald-50 px-2.5 py-1.5 text-[10px] font-medium text-emerald-600 transition hover:bg-emerald-100 sm:text-xs"
          >
            عرض المشتريات
          </Link>
        </div>

        <div className="h-36 overflow-hidden border-b border-slate-100 sm:h-44">
          <div className="flex h-full items-end justify-between gap-1">
            {purchasesChart.map((item, index) => (
              <div
                key={index}
                className="flex h-full flex-1 flex-col items-center justify-end"
              >
                <div className="relative flex w-full justify-center">
                  {item.amount > 0 && (
                    <span className="absolute -top-5 whitespace-nowrap text-[7px] text-slate-400 sm:-top-6 sm:text-[9px]">
                      {formatMoney(item.amount)}
                    </span>
                  )}

                  <div
                    className="
                      w-full
                      max-w-8
                      rounded-t-md
                      bg-emerald-600
                      transition
                      hover:bg-emerald-700
                      sm:max-w-9
                    "
                    style={{
                      height: `${item.height}%`,
                    }}
                  />
                </div>

                <span className="mt-1.5 text-[8px] text-slate-400 sm:text-[10px]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[9px] text-slate-400 sm:text-[10px]">
          <span>{totalPurchaseInvoices} فاتورة مشتريات</span>

          <span>المدفوع: {formatMoney(paidPurchases)} ريال</span>
        </div>
      </div>

      {/* ===================================================
          RECENT SALES + PURCHASES
      =================================================== */}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 lg:grid-cols-2 lg:gap-4">
        {/* RECENT SALES */}

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 sm:text-base">
                آخر فواتير المبيعات
              </h2>

              <p className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">
                آخر فواتير المبيعات المسجلة
              </p>
            </div>

            <Link
              href="/sales"
              className="text-[10px] font-medium text-blue-600 hover:text-blue-700 sm:text-xs"
            >
              عرض الكل
            </Link>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
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
              <div className="py-6 text-center text-xs text-slate-400">
                لا توجد فواتير مبيعات
              </div>
            )}
          </div>
        </div>

        {/* RECENT PURCHASES */}

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 sm:text-base">
                آخر فواتير المشتريات
              </h2>

              <p className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">
                آخر فواتير المشتريات المسجلة
              </p>
            </div>

            <Link
              href="/purchases"
              className="text-[10px] font-medium text-emerald-600 hover:text-emerald-700 sm:text-xs"
            >
              عرض الكل
            </Link>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
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
              <div className="py-6 text-center text-xs text-slate-400">
                لا توجد فواتير مشتريات
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================
          INVENTORY
      =================================================== */}

      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:mt-4 sm:rounded-2xl sm:p-4">
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 sm:text-base">
              حالة المخزون
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
              مستويات المخزون الحالية
            </p>
          </div>

          <Link
            href="/inventory"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              bg-blue-50
              text-blue-600
              transition
              hover:bg-blue-100
              sm:h-9
              sm:w-9
            "
          >
            <FiPackage size={17} />
          </Link>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {inventoryDisplay.length > 0 ? (
            inventoryDisplay.map((item, index) => (
              <Link
                key={`${item.name}-${index}`}
                href="/inventory"
                className="block rounded-lg p-1.5 transition hover:bg-slate-50"
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
            <div className="py-6 text-center text-xs text-slate-400">
              لا توجد بيانات مخزون
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <span className="text-slate-500">إجمالي الأصناف</span>

            <Link
              href="/inventory"
              className="font-bold text-blue-600 hover:text-blue-700"
            >
              {totalProducts} صنف
            </Link>
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-xs">
            <span className="text-slate-500">إجمالي الكميات</span>

            <span className="font-bold text-slate-700">
              {formatMoney(totalInventoryItems)}
            </span>
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-xs">
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

      <div className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 md:grid-cols-2 md:gap-4">
        {/* CUSTOMER BALANCES */}

        <Link
          href="/customers"
          className="
            group
            block
            rounded-xl
            border
            border-slate-200
            bg-white
            p-3
            shadow-sm
            transition
            hover:-translate-y-0.5
            hover:border-blue-200
            hover:shadow-md
            sm:rounded-2xl
            sm:p-4
          "
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 sm:text-xs">
                أرصدة العملاء
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-800 sm:text-xl">
                {formatMoney(totalCustomerBalances)}
              </h2>

              <p className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">
                إجمالي المبالغ المستحقة على العملاء
              </p>

              <p className="mt-2 text-[9px] font-medium text-blue-500 opacity-0 transition group-hover:opacity-100">
                عرض العملاء ←
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-100 sm:h-10 sm:w-10">
              <FiUsers size={18} />
            </div>
          </div>
        </Link>

        {/* SUPPLIER BALANCES */}

        <Link
          href="/suppliers"
          className="
            group
            block
            rounded-xl
            border
            border-slate-200
            bg-white
            p-3
            shadow-sm
            transition
            hover:-translate-y-0.5
            hover:border-emerald-200
            hover:shadow-md
            sm:rounded-2xl
            sm:p-4
          "
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 sm:text-xs">
                أرصدة الموردين
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-800 sm:text-xl">
                {formatMoney(totalSupplierBalances)}
              </h2>

              <p className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">
                إجمالي المبالغ المستحقة للموردين
              </p>

              <p className="mt-2 text-[9px] font-medium text-emerald-600 opacity-0 transition group-hover:opacity-100">
                عرض الموردين ←
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100 sm:h-10 sm:w-10">
              <FiTruck size={18} />
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
        gap-2.5
        rounded-lg
        p-2
        text-right
        transition
        hover:bg-blue-50
        active:scale-[0.99]
        sm:p-2.5
      "
    >
      <div
        className="
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-blue-50
          text-blue-600
          transition
          group-hover:bg-blue-100
          sm:h-9
          sm:w-9
        "
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-700 sm:text-xs">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[8px] text-slate-400 sm:text-[10px]">
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
        px-1.5
        pb-2.5
        transition
        hover:bg-slate-50
        sm:pb-3
      "
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-700 sm:text-xs">
          {number}
        </p>

        <p className="mt-0.5 truncate text-[9px] text-slate-400 sm:text-[10px]">
          {customer}
        </p>
      </div>

      <div className="shrink-0 text-left">
        <p className="text-[10px] font-semibold text-slate-700 sm:text-xs">
          {amount}
        </p>

        <span
          className={`
            mt-0.5
            inline-block
            rounded
            px-1.5
            py-0.5
            text-[8px]
            font-medium
            sm:px-2
            sm:text-[9px]
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
        px-1.5
        pb-2.5
        transition
        hover:bg-slate-50
        sm:pb-3
      "
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-700 sm:text-xs">
          {number}
        </p>

        <p className="mt-0.5 truncate text-[9px] text-slate-400 sm:text-[10px]">
          {supplier}
        </p>
      </div>

      <div className="shrink-0 text-left">
        <p className="text-[10px] font-semibold text-slate-700 sm:text-xs">
          {amount}
        </p>

        <span
          className={`
            mt-0.5
            inline-block
            rounded
            px-1.5
            py-0.5
            text-[8px]
            font-medium
            sm:px-2
            sm:text-[9px]
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
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-medium text-slate-700 sm:text-xs">
          {name}
        </span>

        <span className="shrink-0 text-[9px] text-slate-400 sm:text-[10px]">
          {quantity.toLocaleString("ar-SA")} {unit}
        </span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-slate-100 sm:h-1.5">
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
