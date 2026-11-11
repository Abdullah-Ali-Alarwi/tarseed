"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import type { ReactNode } from "react";
import { toast } from "sonner";

import {
  FiArrowRight,
  FiRefreshCw,
  FiPackage,
  FiDollarSign,
  FiShoppingCart,
  FiShoppingBag,
  FiTrendingUp,
  FiCalendar,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiMapPin,
  FiTag,
  FiHash,
  FiLayers,
  FiClock,
  FiActivity,
  FiBox,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiInfo,
} from "react-icons/fi";

/* =========================================================
   API
========================================================= */

const api = axios.create({
  baseURL: "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================================
   TYPES
========================================================= */

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

  purchasePrice: number;
  sellingPrice: number;

  currentStock: number;
  minStock: number;

  trackInventory?: boolean;

  description?: string;

  status: "active" | "inactive";

  createdAt?: string;
  updatedAt?: string;
}

interface Warehouse {
  id: string;
  companyId: string;
  name: string;
}

interface DocumentItem {
  productId: string;
  warehouseId?: string;

  quantity: number;

  price?: number;
  purchasePrice?: number;
  sellingPrice?: number;

  total?: number;
}

interface Document {
  id: string;
  companyId: string;

  warehouseId?: string;

  status: string;
  date: string;

  total?: number;

  items?: DocumentItem[];
}

interface InventoryMovement {
  id: string;
  companyId: string;

  warehouseId?: string;

  fromWarehouseId?: string;
  toWarehouseId?: string;

  productId: string;
  productName?: string;

  type: string;
  quantity: number;

  reference?: string;

  date?: string;
  createdAt?: string;
}

type ExpiryStatus = "expired" | "near" | "valid";

/* =========================================================
   HELPERS
========================================================= */

const number = (value: unknown): number => {
  const result = Number(value);

  return Number.isFinite(result) ? result : 0;
};

const money = (value: number) =>
  new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const quantityFormat = (value: number) =>
  new Intl.NumberFormat("ar-YE", {
    maximumFractionDigits: 2,
  }).format(value);

const dateFormat = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("ar-YE");
};

const getCookie = (name: string) => {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : "";
};

const isCompleted = (status?: string) =>
  ["completed", "paid", "approved", "confirmed"].includes(
    String(status || "").toLowerCase(),
  );

const getExpiryDate = (purchaseDate: string) => {
  const date = new Date(purchaseDate);

  if (Number.isNaN(date.getTime())) return "";

  date.setFullYear(date.getFullYear() + 1);

  return date.toISOString();
};

const getExpiryStatus = (expiryDate: string): ExpiryStatus => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const difference = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (difference < 0) return "expired";

  if (difference <= 30) return "near";

  return "valid";
};

const getDaysRemaining = (expiryDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  return Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const productId = String(params.id);

  const [loading, setLoading] = useState(true);

  const [product, setProduct] = useState<Product | null>(null);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);

  const [sales, setSales] = useState<Document[]>([]);
  const [purchases, setPurchases] = useState<Document[]>([]);

  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  const [movementFilter, setMovementFilter] = useState("all");

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const type = getCookie("type");
      const companyId = getCookie("companyId");

      if (!["owner", "erp"].includes(type)) {
        toast.error("ليس لديك صلاحية الوصول");
        router.replace("/login");
        return;
      }

      if (!companyId) {
        toast.error("لم يتم العثور على الشركة المرتبطة بالمستخدم");
        router.replace("/login");
        return;
      }

      const [productRes, warehousesRes, salesRes, purchasesRes, movementsRes] =
        await Promise.all([
          api.get("/products", {
            params: {
              id: productId,
              companyId,
            },
          }),

          api.get("/warehouses", {
            params: {
              companyId,
            },
          }),

          api.get("/sales", {
            params: {
              companyId,
            },
          }),

          api.get("/purchases", {
            params: {
              companyId,
            },
          }),

          api.get("/inventoryMovements", {
            params: {
              companyId,
            },
          }),
        ]);

      const foundProduct = productRes.data.find(
        (item: Product) =>
          String(item.id) === productId &&
          String(item.companyId) === String(companyId),
      );

      if (!foundProduct) {
        toast.error("المنتج غير موجود");
        router.replace("/erp/inventory");
        return;
      }

      setProduct(foundProduct);

      const foundWarehouse = warehousesRes.data.find(
        (item: Warehouse) =>
          String(item.id) === String(foundProduct.warehouseId) &&
          String(item.companyId) === String(companyId),
      );

      setWarehouse(foundWarehouse || null);

      setSales(salesRes.data || []);
      setPurchases(purchasesRes.data || []);
      setMovements(movementsRes.data || []);
    } catch (error) {
      console.error(error);

      toast.error("حدث خطأ أثناء تحميل بيانات المنتج");
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =========================================================
     FILTER DOCUMENTS
  ========================================================= */

  const productSales = useMemo(() => {
    if (!product) return [];

    return sales.filter((sale) => {
      if (!isCompleted(sale.status)) return false;

      return (sale.items || []).some(
        (item) =>
          String(item.productId) === String(product.id) &&
          (!item.warehouseId ||
            String(item.warehouseId) === String(product.warehouseId)),
      );
    });
  }, [sales, product]);

  const productPurchases = useMemo(() => {
    if (!product) return [];

    return purchases.filter((purchase) => {
      if (!isCompleted(purchase.status)) return false;

      return (purchase.items || []).some(
        (item) =>
          String(item.productId) === String(product.id) &&
          (!item.warehouseId ||
            String(item.warehouseId) === String(product.warehouseId)),
      );
    });
  }, [purchases, product]);

  /* =========================================================
     PRODUCT DOCUMENT ITEMS
  ========================================================= */

  const salesItems = useMemo(() => {
    if (!product) return [];

    return productSales.flatMap((sale) =>
      (sale.items || [])
        .filter(
          (item) =>
            String(item.productId) === String(product.id) &&
            (!item.warehouseId ||
              String(item.warehouseId) === String(product.warehouseId)),
        )
        .map((item) => ({
          ...item,
          documentDate: sale.date,
        })),
    );
  }, [productSales, product]);

  const purchaseItems = useMemo(() => {
    if (!product) return [];

    return productPurchases.flatMap((purchase) =>
      (purchase.items || [])
        .filter(
          (item) =>
            String(item.productId) === String(product.id) &&
            (!item.warehouseId ||
              String(item.warehouseId) === String(product.warehouseId)),
        )
        .map((item) => ({
          ...item,
          documentDate: purchase.date,
        })),
    );
  }, [productPurchases, product]);

  /* =========================================================
     MOVEMENTS
  ========================================================= */

  const productMovements = useMemo(() => {
    if (!product) return [];

    return movements.filter(
      (movement) =>
        String(movement.productId) === String(product.id) &&
        (String(movement.warehouseId || "") ===
          String(product.warehouseId || "") ||
          String(movement.fromWarehouseId || "") ===
            String(product.warehouseId || "") ||
          String(movement.toWarehouseId || "") ===
            String(product.warehouseId || "")),
    );
  }, [movements, product]);

  const filteredMovements = useMemo(() => {
    if (movementFilter === "all") return productMovements;

    return productMovements.filter((movement) => {
      const type = movement.type.toLowerCase();

      if (movementFilter === "incoming") {
        return (
          type.includes("in") ||
          type.includes("purchase") ||
          type.includes("opening")
        );
      }

      if (movementFilter === "outgoing") {
        return type.includes("out") || type.includes("sale");
      }

      if (movementFilter === "transfer") {
        return type.includes("transfer");
      }

      if (movementFilter === "adjustment") {
        return type.includes("adjustment");
      }

      return true;
    });
  }, [productMovements, movementFilter]);

  /* =========================================================
     CALCULATIONS
  ========================================================= */

  const stats = useMemo(() => {
    if (!product) return null;

    const currentStock = number(product.currentStock);

    const purchasePrice = number(product.purchasePrice);
    const sellingPrice = number(product.sellingPrice);

    const stockCost = currentStock * purchasePrice;

    const stockSellingValue = currentStock * sellingPrice;

    const expectedProfit = stockSellingValue - stockCost;

    const totalSalesQuantity = salesItems.reduce(
      (sum, item) => sum + number(item.quantity),
      0,
    );

    const totalPurchasesQuantity = purchaseItems.reduce(
      (sum, item) => sum + number(item.quantity),
      0,
    );

    const totalSalesAmount = salesItems.reduce(
      (sum, item) =>
        sum +
        number(
          item.total ??
            number(item.quantity) *
              number(item.sellingPrice ?? item.price ?? sellingPrice),
        ),
      0,
    );

    const totalPurchasesAmount = purchaseItems.reduce(
      (sum, item) =>
        sum +
        number(
          item.total ??
            number(item.quantity) *
              number(item.purchasePrice ?? item.price ?? purchasePrice),
        ),
      0,
    );

    const lowStock = currentStock <= number(product.minStock);

    const outOfStock = currentStock <= 0;

    const profitPerUnit = sellingPrice - purchasePrice;

    const profitMargin =
      sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0;

    return {
      currentStock,
      purchasePrice,
      sellingPrice,

      stockCost,
      stockSellingValue,
      expectedProfit,

      totalSalesQuantity,
      totalPurchasesQuantity,

      totalSalesAmount,
      totalPurchasesAmount,

      lowStock,
      outOfStock,

      profitPerUnit,
      profitMargin,

      movementCount: productMovements.length,
    };
  }, [product, salesItems, purchaseItems, productMovements]);

  /* =========================================================
     EXPIRY ESTIMATION
  ========================================================= */

  const expiryLots = useMemo(() => {
    if (!product) return [];

    /*
      كل عملية شراء تعتبر دفعة مؤقتة.

      تاريخ الإنتاج = تاريخ الشراء.
      تاريخ الانتهاء = تاريخ الشراء + سنة.

      هذه الحسابات تقديرية وليست نظام دفعات حقيقيًا.
    */

    const lots = purchaseItems
      .filter((item) => number(item.quantity) > 0)
      .map((item, index) => {
        const purchaseDate =
          item.documentDate || product.createdAt || new Date().toISOString();

        const expiryDate = getExpiryDate(purchaseDate);

        return {
          id: `${product.id}-${index}`,
          purchaseDate,
          expiryDate,
          quantity: number(item.quantity),
          status: getExpiryStatus(expiryDate),
          daysRemaining: getDaysRemaining(expiryDate),
        };
      })
      .sort(
        (a, b) =>
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
      );

    /*
      عند عدم وجود مشتريات، نستخدم تاريخ إنشاء المنتج
      كتاريخ إنتاج افتراضي للرصيد الحالي.
    */

    if (lots.length === 0 && number(product.currentStock) > 0) {
      const purchaseDate = product.createdAt || new Date().toISOString();

      const expiryDate = getExpiryDate(purchaseDate);

      lots.push({
        id: `${product.id}-default`,
        purchaseDate,
        expiryDate,
        quantity: number(product.currentStock),
        status: getExpiryStatus(expiryDate),
        daysRemaining: getDaysRemaining(expiryDate),
      });
    }

    return lots;
  }, [product, purchaseItems]);

  const expiryStats = useMemo(() => {
    const expired = expiryLots
      .filter((lot) => lot.status === "expired")
      .reduce((sum, lot) => sum + lot.quantity, 0);

    const near = expiryLots
      .filter((lot) => lot.status === "near")
      .reduce((sum, lot) => sum + lot.quantity, 0);

    const valid = expiryLots
      .filter((lot) => lot.status === "valid")
      .reduce((sum, lot) => sum + lot.quantity, 0);

    return {
      expired,
      near,
      valid,
    };
  }, [expiryLots]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FiRefreshCw className="animate-spin text-base" />
          جاري تحميل بيانات المنتج...
        </div>
      </div>
    );
  }

  if (!product || !stats) {
    return (
      <div dir="rtl" className="p-6 text-center text-sm text-gray-500">
        لم يتم العثور على المنتج.
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div dir="rtl" className="space-y-4 p-3 text-xs md:p-4">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400">
            <Link href="/erp/inventory" className="hover:text-blue-600">
              المخزون
            </Link>

            <span>/</span>

            <Link
              href="/erp/inventory/warehouses"
              className="hover:text-blue-600"
            >
              المستودعات
            </Link>

            <span>/</span>

            <span>{product.name}</span>
          </div>

          <h1 className="text-lg font-bold text-gray-800 md:text-xl">
            {product.name}
          </h1>

          <p className="mt-1 text-[10px] text-gray-400">
            تفاصيل المنتج وتحليل المخزون والأرباح والصلاحية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 text-[11px] text-gray-600 hover:bg-gray-50"
          >
            <FiRefreshCw />
            تحديث
          </button>

          <Link
            href={`/erp/inventory/warehouses/${product.warehouseId}`}
            className="flex items-center gap-1.5 rounded-md bg-gray-800 px-3 py-2 text-[11px] text-white hover:bg-gray-700"
          >
            <FiArrowRight />
            المستودع
          </Link>
        </div>
      </div>

      {/* PRODUCT INFORMATION */}

      <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <FiPackage className="text-blue-600" />
            المعلومات الأساسية
          </h2>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-1 text-[10px] ${
                product.status === "active"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {product.status === "active" ? "نشط" : "غير نشط"}
            </span>

            <span
              className={`rounded-full px-2 py-1 text-[10px] ${
                stats.outOfStock
                  ? "bg-red-50 text-red-700"
                  : stats.lowStock
                    ? "bg-orange-50 text-orange-700"
                    : "bg-green-50 text-green-700"
              }`}
            >
              {stats.outOfStock
                ? "نفد المخزون"
                : stats.lowStock
                  ? "مخزون منخفض"
                  : "متوفر"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <InfoItem
            icon={<FiPackage />}
            label="اسم المنتج"
            value={product.name}
          />

          <InfoItem
            icon={<FiHash />}
            label="رمز المنتج"
            value={product.sku || "-"}
          />

          <InfoItem
            icon={<FiTag />}
            label="الباركود"
            value={product.barcode || "-"}
          />

          <InfoItem
            icon={<FiLayers />}
            label="التصنيف"
            value={product.categoryName || "-"}
          />

          <InfoItem
            icon={<FiBox />}
            label="الوحدة"
            value={product.unitName || "-"}
          />

          <InfoItem
            icon={<FiMapPin />}
            label="المستودع"
            value={warehouse?.name || "-"}
          />

          <InfoItem icon={<FiHash />} label="رقم المنتج" value={product.id} />

          <InfoItem
            icon={<FiCalendar />}
            label="تاريخ الإنشاء"
            value={dateFormat(product.createdAt)}
          />
        </div>

        {product.description && (
          <p className="mt-3 border-t pt-3 text-[11px] leading-5 text-gray-500">
            {product.description}
          </p>
        )}
      </div>

      {/* PRICES */}

      <SectionTitle title="الأسعار والربحية" />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          title="سعر الشراء"
          value={money(stats.purchasePrice)}
          icon={<FiShoppingBag />}
          color="blue"
        />

        <StatCard
          title="سعر البيع"
          value={money(stats.sellingPrice)}
          icon={<FiShoppingCart />}
          color="green"
        />

        <StatCard
          title="الربح للوحدة"
          value={money(stats.profitPerUnit)}
          icon={<FiTrendingUp />}
          color="purple"
        />

        <StatCard
          title="هامش الربح"
          value={`${money(stats.profitMargin)}%`}
          icon={<FiDollarSign />}
          color="indigo"
        />
      </div>

      {/* STOCK */}

      <SectionTitle title="الرصيد وقيمة المخزون" />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          title="الرصيد الافتتاحي"
          value="غير مسجل"
          icon={<FiInfo />}
          color="orange"
        />

        <StatCard
          title="الكمية المتوفرة"
          value={quantityFormat(stats.currentStock)}
          icon={<FiPackage />}
          color="blue"
        />

        <StatCard
          title="الحد الأدنى"
          value={quantityFormat(number(product.minStock))}
          icon={<FiAlertTriangle />}
          color="orange"
        />

        <StatCard
          title="تكلفة المخزون"
          value={money(stats.stockCost)}
          icon={<FiDollarSign />}
          color="blue"
        />

        <StatCard
          title="القيمة بسعر البيع"
          value={money(stats.stockSellingValue)}
          icon={<FiTrendingUp />}
          color="green"
        />

        <StatCard
          title="الربح المتوقع"
          value={money(stats.expectedProfit)}
          icon={<FiTrendingUp />}
          color="purple"
        />
      </div>

      {/* SALES & PURCHASES */}

      <SectionTitle title="المبيعات والمشتريات" />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <FinancialCard
          title="إجمالي المبيعات"
          amount={stats.totalSalesAmount}
          quantity={stats.totalSalesQuantity}
          icon={<FiShoppingCart />}
          color="green"
        />

        <FinancialCard
          title="إجمالي المشتريات"
          amount={stats.totalPurchasesAmount}
          quantity={stats.totalPurchasesQuantity}
          icon={<FiShoppingBag />}
          color="blue"
        />
      </div>

      {/* EXPIRY */}

      <SectionTitle title="صلاحية المنتج" />

      <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-gray-800">
              متابعة تواريخ الصلاحية
            </h2>

            <p className="mt-1 text-[10px] text-gray-400">
              تاريخ الإنتاج الافتراضي هو تاريخ الشراء، والانتهاء بعد سنة.
            </p>
          </div>

          <span className="rounded-md bg-orange-50 px-2 py-1 text-[10px] text-orange-700">
            صلاحية تقديرية
          </span>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <MiniStat
            title="صالح"
            value={quantityFormat(expiryStats.valid)}
            color="green"
          />

          <MiniStat
            title="قارب على الانتهاء"
            value={quantityFormat(expiryStats.near)}
            color="orange"
          />

          <MiniStat
            title="منتهي"
            value={quantityFormat(expiryStats.expired)}
            color="red"
          />
        </div>

        {expiryLots.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">
            لا توجد بيانات صلاحية.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-right text-[11px]">
              <thead className="bg-gray-50 text-[10px] text-gray-500">
                <tr>
                  <th className="px-3 py-2.5">رقم الدفعة</th>
                  <th className="px-3 py-2.5">تاريخ الإنتاج</th>
                  <th className="px-3 py-2.5">تاريخ الانتهاء</th>
                  <th className="px-3 py-2.5">الكمية المسجلة</th>
                  <th className="px-3 py-2.5">الأيام المتبقية</th>
                  <th className="px-3 py-2.5">الحالة</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {expiryLots.map((lot, index) => (
                  <tr key={lot.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium">{index + 1}</td>

                    <td className="px-3 py-2.5">
                      {dateFormat(lot.purchaseDate)}
                    </td>

                    <td className="px-3 py-2.5">
                      {dateFormat(lot.expiryDate)}
                    </td>

                    <td className="px-3 py-2.5 font-semibold">
                      {quantityFormat(lot.quantity)}
                    </td>

                    <td className="px-3 py-2.5">
                      {lot.daysRemaining < 0
                        ? `منذ ${Math.abs(lot.daysRemaining)} يوم`
                        : `${lot.daysRemaining} يوم`}
                    </td>

                    <td className="px-3 py-2.5">
                      <ExpiryBadge status={lot.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 p-2.5 text-[10px] leading-5 text-amber-800">
          <FiInfo className="mt-0.5 shrink-0" />

          <p>
            هذه البيانات تقديرية. الكميات المعروضة تمثل كميات الشراء المسجلة لكل
            دفعة، وليست بالضرورة الكميات المتبقية منها. لا يتم حاليًا توزيع
            المبيعات على الدفعات أو خصم الكميات المنتهية من الرصيد.
          </p>
        </div>
      </div>

      {/* MOVEMENTS */}

      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-3 py-3">
          <div>
            <h2 className="text-sm font-bold text-gray-800">
              سجل حركات المنتج
            </h2>

            <p className="mt-1 text-[10px] text-gray-400">
              جميع الحركات المسجلة لهذا المنتج
            </p>
          </div>

          <select
            value={movementFilter}
            onChange={(e) => setMovementFilter(e.target.value)}
            className="rounded-md border bg-white px-2 py-2 text-[10px] outline-none"
          >
            <option value="all">جميع الحركات</option>
            <option value="incoming">الوارد</option>
            <option value="outgoing">الصادر</option>
            <option value="transfer">التحويلات</option>
            <option value="adjustment">التسويات</option>
          </select>
        </div>

        {filteredMovements.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            <FiActivity className="mx-auto mb-2 text-2xl" />
            لا توجد حركات مسجلة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-right text-[11px]">
              <thead className="bg-gray-50 text-[10px] text-gray-500">
                <tr>
                  <th className="px-3 py-2.5">نوع الحركة</th>
                  <th className="px-3 py-2.5">الكمية</th>
                  <th className="px-3 py-2.5">المرجع</th>
                  <th className="px-3 py-2.5">التاريخ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {[...filteredMovements]
                  .sort(
                    (a, b) =>
                      new Date(b.date || b.createdAt || 0).getTime() -
                      new Date(a.date || a.createdAt || 0).getTime(),
                  )
                  .map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-gray-700">
                        {movement.type}
                      </td>

                      <td className="px-3 py-2.5 font-bold">
                        {quantityFormat(number(movement.quantity))}
                      </td>

                      <td className="px-3 py-2.5 text-gray-500">
                        {movement.reference || "-"}
                      </td>

                      <td className="px-3 py-2.5 text-gray-500">
                        {dateFormat(movement.date || movement.createdAt)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER */}

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
        <div className="flex items-start gap-2 text-blue-800">
          <FiInfo className="mt-0.5 shrink-0" />

          <div>
            <h3 className="text-xs font-bold">ملاحظة حول الحسابات</h3>

            <p className="mt-1 text-[10px] leading-5">
              تكلفة المخزون الحالية محسوبة باستخدام الكمية الحالية مضروبة في سعر
              الشراء الموجود في بطاقة المنتج. والربح المتوقع هو الفرق بين القيمة
              البيعية وتكلفة المخزون، وليس صافي الربح المحاسبي الفعلي.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <div className="shrink-0 rounded-md bg-gray-50 p-2 text-sm text-gray-500">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] text-gray-400">{label}</p>

        <p className="mt-1 truncate text-xs font-semibold text-gray-800">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="border-r-[3px] border-blue-600 pr-2 text-sm font-bold text-gray-800">
      {title}
    </h2>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <div className="min-w-0 rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[10px] text-gray-500 sm:text-xs">{title}</p>

        <div className={`shrink-0 rounded-md p-2 text-sm ${colors[color]}`}>
          {icon}
        </div>
      </div>

      <h3 className="mt-2 break-words text-base font-bold text-gray-800 sm:text-lg">
        {value}
      </h3>
    </div>
  );
}

/* =========================================================
   FINANCIAL CARD
========================================================= */

function FinancialCard({
  title,
  amount,
  quantity,
  icon,
  color,
}: {
  title: string;
  amount: number;
  quantity: number;
  icon: ReactNode;
  color: string;
}) {
  const styles: Record<string, string> = {
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-bold text-gray-800">
          {icon}
          {title}
        </h3>

        <span className={`rounded-md p-2 ${styles[color]}`}>{icon}</span>
      </div>

      <p className="mt-3 text-[10px] text-gray-400">إجمالي القيمة</p>

      <h2 className="mt-1 text-lg font-bold text-gray-800">{money(amount)}</h2>

      <div className="mt-3 flex items-center justify-between border-t pt-2">
        <span className="text-[10px] text-gray-400">إجمالي الكمية</span>

        <span className="text-xs font-bold text-gray-800">
          {quantityFormat(quantity)}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  const styles: Record<string, string> = {
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className={`rounded-md p-3 ${styles[color]}`}>
      <p className="text-[10px] opacity-80">{title}</p>

      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

/* =========================================================
   EXPIRY BADGE
========================================================= */

function ExpiryBadge({ status }: { status: ExpiryStatus }) {
  if (status === "expired") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-red-50 px-2 py-1 text-[9px] text-red-700">
        <FiXCircle />
        منتهي
      </span>
    );
  }

  if (status === "near") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-orange-50 px-2 py-1 text-[9px] text-orange-700">
        <FiAlertTriangle />
        قريب الانتهاء
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-green-50 px-2 py-1 text-[9px] text-green-700">
      <FiCheckCircle />
      صالح
    </span>
  );
}
