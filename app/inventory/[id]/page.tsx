"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import {
  FiArrowRight,
  FiPackage,
  FiShoppingCart,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCalendar,
  FiFileText,
  FiAlertTriangle,
} from "react-icons/fi";
import { useERPStore } from "@/Store/erpStore";

type MovementType = "شراء" | "بيع";

type Movement = {
  id: string;
  type: MovementType;
  date: string;
  invoiceNumber: string;
  partyName: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
};

export default function InventoryProductDetailsPage() {
  const params = useParams();

  const productId = String(params.id);

  /* =====================================================
     ZUSTAND
  ===================================================== */

  const products = useERPStore((state) => state.products);
  const purchases = useERPStore((state) => state.purchases);
  const sales = useERPStore((state) => state.sales);

  /* =====================================================
     FORMAT MONEY
  ===================================================== */

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (date: string) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  /* =====================================================
     PRODUCT
  ===================================================== */

  const product = useMemo(() => {
    return products.find((item) => item.id === productId);
  }, [products, productId]);

  /* =====================================================
     PURCHASE MOVEMENTS
  ===================================================== */

  const purchaseMovements = useMemo<Movement[]>(() => {
    if (!product) {
      return [];
    }

    const movements: Movement[] = [];

    purchases.forEach((purchase) => {
      purchase.items.forEach((item, index) => {
        if (item.productId !== product.id) {
          return;
        }

        const quantity = getNumericAmount(item.quantity);
        const price = getNumericAmount(item.price);
        const discount = getNumericAmount(item.discount);
        const tax = getNumericAmount(item.tax);

        const calculatedTotal =
          quantity * price - (quantity * price * discount) / 100;

        const total =
          Number.isFinite(Number(item.total)) && Number(item.total) > 0
            ? Number(item.total)
            : calculatedTotal;

        movements.push({
          id: `${purchase.id}-purchase-${index}`,
          type: "شراء",
          date: purchase.date,
          invoiceNumber: purchase.invoiceNumber,
          partyName: purchase.supplierId || "مورد",
          quantity,
          price,
          discount,
          tax,
          total,
        });
      });
    });

    return movements;
  }, [purchases, product]);

  /* =====================================================
     SALES MOVEMENTS
  ===================================================== */

  const saleMovements = useMemo<Movement[]>(() => {
    if (!product) {
      return [];
    }

    const movements: Movement[] = [];

    sales.forEach((sale) => {
      sale.items.forEach((item, index) => {
        if (item.productId !== product.id) {
          return;
        }

        const quantity = getNumericAmount(item.quantity);
        const price = getNumericAmount(item.price);
        const discount = getNumericAmount(item.discount);
        const tax = getNumericAmount(item.tax);

        const calculatedTotal =
          quantity * price - (quantity * price * discount) / 100;

        const total =
          Number.isFinite(Number(item.total)) && Number(item.total) > 0
            ? Number(item.total)
            : calculatedTotal;

        movements.push({
          id: `${sale.id}-sale-${index}`,
          type: "بيع",
          date: sale.date,
          invoiceNumber: sale.invoiceNumber,
          partyName: sale.customerName || "عميل",
          quantity,
          price,
          discount,
          tax,
          total,
        });
      });
    });

    return movements;
  }, [sales, product]);

  /* =====================================================
     TOTAL PURCHASES
  ===================================================== */

  const totalPurchasedQuantity = useMemo(() => {
    return purchaseMovements.reduce(
      (sum, movement) => sum + movement.quantity,
      0,
    );
  }, [purchaseMovements]);

  /* =====================================================
     TOTAL SALES
  ===================================================== */

  const totalSoldQuantity = useMemo(() => {
    return saleMovements.reduce((sum, movement) => sum + movement.quantity, 0);
  }, [saleMovements]);

  /* =====================================================
     CURRENT STOCK
  ===================================================== */

  const currentQuantity = Math.max(
    totalPurchasedQuantity - totalSoldQuantity,
    0,
  );

  /* =====================================================
     PURCHASE VALUE
  ===================================================== */

  const totalPurchaseValue = useMemo(() => {
    return purchaseMovements.reduce(
      (sum, movement) => sum + movement.quantity * movement.price,
      0,
    );
  }, [purchaseMovements]);

  /* =====================================================
     PURCHASE DISCOUNTS
  ===================================================== */

  const totalPurchaseDiscount = useMemo(() => {
    return purchaseMovements.reduce((sum, movement) => {
      const value =
        movement.quantity * movement.price * (movement.discount / 100);

      return sum + value;
    }, 0);
  }, [purchaseMovements]);

  /* =====================================================
     NET PURCHASE VALUE
  ===================================================== */

  const netPurchaseValue = totalPurchaseValue - totalPurchaseDiscount;

  /* =====================================================
     AVERAGE PURCHASE PRICE
  ===================================================== */

  const averagePurchasePrice =
    totalPurchasedQuantity > 0 ? netPurchaseValue / totalPurchasedQuantity : 0;

  /* =====================================================
     SALES VALUE
  ===================================================== */

  const totalSalesValue = useMemo(() => {
    return saleMovements.reduce((sum, movement) => sum + movement.total, 0);
  }, [saleMovements]);

  /* =====================================================
     SALES DISCOUNTS
  ===================================================== */

  const totalSalesDiscount = useMemo(() => {
    return saleMovements.reduce((sum, movement) => {
      const value =
        movement.quantity * movement.price * (movement.discount / 100);

      return sum + value;
    }, 0);
  }, [saleMovements]);

  /* =====================================================
     NET SALES VALUE
  ===================================================== */

  const netSalesValue =
    totalSalesValue > 0
      ? totalSalesValue
      : saleMovements.reduce((sum, movement) => {
          const value =
            movement.quantity * movement.price -
            movement.quantity * movement.price * (movement.discount / 100);

          return sum + value;
        }, 0);

  /* =====================================================
     AVERAGE SALE PRICE
  ===================================================== */

  const averageSalePrice =
    totalSoldQuantity > 0 ? netSalesValue / totalSoldQuantity : 0;

  /* =====================================================
     COST OF GOODS SOLD
     
     يتم احتساب تكلفة الكمية المباعة
     باستخدام متوسط سعر الشراء.
  ===================================================== */

  const costOfSoldGoods = totalSoldQuantity * averagePurchasePrice;

  /* =====================================================
     PROFIT
  ===================================================== */

  const profit = netSalesValue - costOfSoldGoods;

  /* =====================================================
     PROFIT MARGIN
  ===================================================== */

  const profitMargin = netSalesValue > 0 ? (profit / netSalesValue) * 100 : 0;

  /* =====================================================
     TOTAL MOVEMENTS
  ===================================================== */

  const movements = useMemo(() => {
    return [...purchaseMovements, ...saleMovements].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      return dateB - dateA;
    });
  }, [purchaseMovements, saleMovements]);

  /* =====================================================
     NOT FOUND
  ===================================================== */

  if (!product) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-6"
          >
            <FiArrowRight />
            العودة إلى المخزون
          </Link>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
            <FiAlertTriangle size={45} className="mx-auto text-red-400 mb-4" />

            <h1 className="text-xl font-bold text-gray-800">الصنف غير موجود</h1>

            <p className="text-sm text-gray-500 mt-2">
              لم يتم العثور على الصنف المطلوب.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/inventory"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600 mb-3"
            >
              <FiArrowRight size={17} />
              العودة إلى المخزون
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FiPackage size={25} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {product.name}
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                  كود الصنف:{" "}
                  <span className="font-semibold text-amber-600">
                    {product.code}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <Link
            href={`/inventory`}
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-lg font-medium transition"
          >
            <FiPackage size={18} />
            قائمة المخزون
          </Link>
        </div>

        {/* =====================================================
            PRODUCT INFO
        ===================================================== */}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <InfoItem label="كود الصنف" value={String(product.code ?? "-")} />

            <InfoItem label="اسم الصنف" value={product.name} />

            <InfoItem label="وحدة القياس" value={String(product.unit ?? "-")} />
          </div>
        </div>
        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <StatCard
            title="إجمالي المشتريات"
            value={formatMoney(totalPurchasedQuantity)}
            subtitle={product.unit}
            icon={FiTrendingDown}
          />

          <StatCard
            title="إجمالي المبيعات"
            value={formatMoney(totalSoldQuantity)}
            subtitle={product.unit}
            icon={FiTrendingUp}
          />

          <StatCard
            title="المتبقي في المخزون"
            value={formatMoney(currentQuantity)}
            subtitle={product.unit}
            icon={FiPackage}
            warning={currentQuantity <= 10}
          />

          <StatCard
            title="الربح"
            value={formatMoney(profit)}
            subtitle="ريال"
            icon={FiDollarSign}
            positive={profit >= 0}
          />
        </div>

        {/* =====================================================
            FINANCIAL SUMMARY
        ===================================================== */}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">الملخص المالي للصنف</h2>

            <p className="text-xs text-gray-400 mt-1">
              ملخص حركة الشراء والبيع والربح
            </p>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <FinancialItem
                label="قيمة المشتريات"
                value={`${formatMoney(netPurchaseValue)} ريال`}
              />

              <FinancialItem
                label="متوسط سعر الشراء"
                value={`${formatMoney(averagePurchasePrice)} ريال`}
              />

              <FinancialItem
                label="قيمة المبيعات"
                value={`${formatMoney(netSalesValue)} ريال`}
              />

              <FinancialItem
                label="متوسط سعر البيع"
                value={`${formatMoney(averageSalePrice)} ريال`}
              />

              <FinancialItem
                label="تكلفة البضاعة المباعة"
                value={`${formatMoney(costOfSoldGoods)} ريال`}
              />

              <FinancialItem
                label="الربح المحقق"
                value={`${formatMoney(profit)} ريال`}
                valueClass={profit >= 0 ? "text-green-600" : "text-red-600"}
              />

              <FinancialItem
                label="هامش الربح"
                value={`${formatMoney(profitMargin)}%`}
                valueClass={profit >= 0 ? "text-green-600" : "text-red-600"}
              />

              <FinancialItem
                label="إجمالي الخصومات"
                value={`${formatMoney(
                  totalPurchaseDiscount + totalSalesDiscount,
                )} ريال`}
              />
            </div>
          </div>
        </div>

        {/* =====================================================
            INVENTORY STATUS
        ===================================================== */}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-gray-800">حالة المخزون</h2>

              <p className="text-sm text-gray-500 mt-1">
                الكمية الحالية مقارنة بحركة الشراء والبيع
              </p>
            </div>

            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                currentQuantity <= 10
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-600"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  currentQuantity <= 10 ? "bg-red-500" : "bg-green-500"
                }`}
              />

              {currentQuantity <= 10 ? "المخزون منخفض" : "المخزون متوفر"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            <QuantityBox
              title="المشتريات"
              quantity={totalPurchasedQuantity}
              unit={product.unit}
              icon={FiTrendingDown}
            />

            <QuantityBox
              title="المبيعات"
              quantity={totalSoldQuantity}
              unit={product.unit}
              icon={FiTrendingUp}
            />

            <QuantityBox
              title="الرصيد الحالي"
              quantity={currentQuantity}
              unit={product.unit}
              icon={FiPackage}
            />
          </div>
        </div>

        {/* =====================================================
            DETAILED MOVEMENTS
        ===================================================== */}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-gray-800">كشف حركة الصنف</h2>

                <p className="text-xs text-gray-400 mt-1">
                  جميع عمليات الشراء والبيع الخاصة بهذا الصنف
                </p>
              </div>

              <div className="text-sm text-gray-500">
                عدد العمليات:{" "}
                <span className="font-semibold text-gray-700">
                  {movements.length}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[1200px]">
              <thead className="bg-gray-50">
                <tr className="text-sm text-gray-500">
                  <th className="px-5 py-4 font-medium whitespace-nowrap">
                    التاريخ
                  </th>

                  <th className="px-5 py-4 font-medium whitespace-nowrap">
                    نوع الحركة
                  </th>

                  <th className="px-5 py-4 font-medium whitespace-nowrap">
                    رقم الفاتورة
                  </th>

                  <th className="px-5 py-4 font-medium whitespace-nowrap">
                    العميل / المورد
                  </th>

                  <th className="px-5 py-4 font-medium whitespace-nowrap">
                    الكمية
                  </th>

                  <th className="px-5 py-4 font-medium whitespace-nowrap">
                    سعر الوحدة
                  </th>

                  <th className="px-5 py-4 font-medium whitespace-nowrap">
                    الخصم
                  </th>

                  <th className="px-5 py-4 font-medium whitespace-nowrap">
                    الضريبة
                  </th>

                  <th className="px-5 py-4 font-medium whitespace-nowrap">
                    الإجمالي
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {movements.length > 0 ? (
                  movements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="hover:bg-gray-50 transition"
                    >
                      {/* DATE */}

                      <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FiCalendar size={16} className="text-gray-400" />

                          {formatDate(movement.date)}
                        </div>
                      </td>

                      {/* TYPE */}

                      <td className="px-5 py-4">
                        {movement.type === "شراء" ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                            <FiTrendingDown size={14} />
                            شراء
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-600 text-xs font-medium">
                            <FiTrendingUp size={14} />
                            بيع
                          </span>
                        )}
                      </td>

                      {/* INVOICE */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <FiFileText size={16} className="text-gray-400" />

                          {movement.invoiceNumber}
                        </div>
                      </td>

                      {/* PARTY */}

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {movement.partyName}
                      </td>

                      {/* QUANTITY */}

                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-700">
                          {formatMoney(movement.quantity)}
                        </span>

                        <span className="text-xs text-gray-400 mr-1">
                          {product.unit}
                        </span>
                      </td>

                      {/* PRICE */}

                      <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatMoney(movement.price)} ريال
                      </td>

                      {/* DISCOUNT */}

                      <td className="px-5 py-4 text-sm text-gray-500">
                        {formatMoney(movement.discount)}%
                      </td>

                      {/* TAX */}

                      <td className="px-5 py-4 text-sm text-gray-500">
                        {formatMoney(movement.tax)}%
                      </td>

                      {/* TOTAL */}

                      <td className="px-5 py-4 font-semibold text-gray-700 whitespace-nowrap">
                        {formatMoney(movement.total)} ريال
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      لا توجد أي حركة شراء أو بيع لهذا الصنف
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =====================================================
   INFO ITEM
===================================================== */

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <p className="text-xs text-gray-400 mb-2">{label}</p>

      <p className="font-semibold text-gray-700">{value}</p>
    </div>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  warning = false,
  positive = true,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  warning?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <div className="flex items-end gap-2 mt-2">
            <h2
              className={`text-2xl font-bold ${
                title === "الربح"
                  ? positive
                    ? "text-green-600"
                    : "text-red-600"
                  : "text-gray-800"
              }`}
            >
              {value}
            </h2>

            <span className="text-xs text-gray-400 mb-1">{subtitle}</span>
          </div>
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            warning
              ? "bg-red-50 text-red-500"
              : title === "الربح"
                ? positive
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
                : "bg-amber-50 text-amber-600"
          }`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   FINANCIAL ITEM
===================================================== */

function FinancialItem({
  label,
  value,
  valueClass = "text-gray-800",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <p className="text-xs text-gray-400 mb-2">{label}</p>

      <p className={`font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

/* =====================================================
   QUANTITY BOX
===================================================== */

function QuantityBox({
  title,
  quantity,
  unit,
  icon: Icon,
}: {
  title: string;
  quantity: number;
  unit: string;
  icon: React.ElementType;
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
          <Icon size={20} />
        </div>

        <div>
          <p className="text-xs text-gray-400">{title}</p>

          <p className="font-bold text-gray-800 mt-1">
            {Number(quantity || 0).toLocaleString("ar-SA")}

            <span className="text-xs font-normal text-gray-400 mr-1">
              {unit}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   NUMERIC VALUE
===================================================== */

function getNumericAmount(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    return Number(value.replace(/[^\d.-]/g, "")) || 0;
  }

  return 0;
}
