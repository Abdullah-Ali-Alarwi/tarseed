"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";

import {
  FiHome,
  FiPackage,
  FiRefreshCw,
  FiTrendingUp,
  FiDollarSign,
  FiShoppingCart,
  FiShoppingBag,
  FiAlertTriangle,
  FiXCircle,
  FiCheckCircle,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiLayers,
  FiMapPin,
  FiHash,
  FiArrowRight,
  FiDatabase,
  FiActivity,
} from "react-icons/fi";

import { getCurrentActor, saveActivityLog } from "../../../lib/activity";

/* =========================================================
   API
========================================================= */

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================================
   TYPES
========================================================= */

interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  location?: string;
  description?: string;
  isDefault?: boolean;
  status: "active" | "inactive";

  createdBy?: string;
  createdByName?: string;
  createdAt?: string;

  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: string;
}

interface Product {
  id: string;
  companyId: string;
  warehouseId?: string;
  name: string;
  sku: string;
  unitName?: string;

  purchasePrice: number;
  sellingPrice: number;

  currentStock: number;
  minStock: number;

  averageCost?: number;
  trackInventory: boolean;
  status: "active" | "inactive";
}

interface WarehouseStock {
  id: string | number;
  companyId: string;
  productId: string;
  warehouseId: string;
  quantity: number;

  averageCost?: number;
  unitCost?: number;
  costPrice?: number;

  updatedAt?: string;
  updatedBy?: string;
  updatedByName?: string;
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

interface SalesPurchase {
  id: string | number;
  companyId: string;
  warehouseId?: string;
  status: string;
  date: string;
  total?: number;
  items?: DocumentItem[];
}

interface InventoryMovement {
  id: string | number;
  companyId: string;
  warehouseId?: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;

  productId: string;
  productName?: string;
  type: string;
  quantity: number;

  reference?: string;
  referenceNumber?: string;
  date?: string;
  createdAt?: string;

  createdBy?: string;
  createdByName?: string;
}

interface Transfer {
  id: string | number;
  companyId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  quantity: number;
  status: string;
  date: string;
}

interface Adjustment {
  id: string | number;
  companyId: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  type?: string;
  status: string;
  date?: string;
}

interface Stocktake {
  id: string | number;
  companyId: string;
  warehouseId: string;
  status: string;
  date?: string;
}

/* =========================================================
   HELPERS
========================================================= */

const number = (value: unknown) => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};

const money = (value: number) =>
  new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const isCompleted = (status?: string) =>
  ["completed", "paid", "approved", "confirmed"].includes(
    String(status || "").toLowerCase(),
  );

const getCookie = (name: string) => {
  if (typeof document === "undefined") return "";

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : "";
};

const getDocumentItemTotal = (
  item: DocumentItem,
  type: "sales" | "purchases",
) => {
  if (item.total !== undefined && item.total !== null) {
    return number(item.total);
  }

  const price =
    type === "sales"
      ? number(item.sellingPrice ?? item.price)
      : number(item.purchasePrice ?? item.price);

  return number(item.quantity) * price;
};

const formatDate = (date?: string) => {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString("ar-YE");
};

/* =========================================================
   PAGE
========================================================= */

export default function WarehouseDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const warehouseId = String(params.id);

  const [loading, setLoading] = useState(true);

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);

  const [companyId, setCompanyId] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStock[]>([]);

  const [sales, setSales] = useState<SalesPurchase[]>([]);
  const [purchases, setPurchases] = useState<SalesPurchase[]>([]);

  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [stocktakes, setStocktakes] = useState<Stocktake[]>([]);

  /* =========================================================
     ACTIVITY LOG
  ========================================================= */

  const logWarehouseView = async (
    currentWarehouse: Warehouse,
    currentCompanyId: string,
  ) => {
    try {
      const actor = getCurrentActor();

      if (!actor?.userId || !actor?.companyId) {
        console.warn("Activity log skipped: current actor is unavailable.");
        return;
      }

      if (String(actor.companyId) !== String(currentCompanyId)) {
        console.warn("Activity log skipped: company mismatch.");
        return;
      }

      await saveActivityLog({
        companyId: currentCompanyId,

        userId: actor.userId,
        userName: actor.userName || actor.username,
        username: actor.username,
        userRole: actor.userRole,

        action: "view",
        module: "المستودعات",

        description: `عرض تفاصيل المستودع: ${currentWarehouse.name}`,

        recordId: String(currentWarehouse.id),
        recordName: currentWarehouse.name,

        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      // فشل تسجيل النشاط لا يجب أن يمنع عرض الصفحة.
      console.warn("Failed to log warehouse view:", error);
    }
  };

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadData = async () => {
    try {
      setLoading(true);

      const actor = getCurrentActor();
      const userType = getCookie("type");

      // منع مستخدم المنصة من الدخول إلى بيانات المستودعات.
      if (userType === "platform") {
        toast.error("ليس لديك صلاحية الوصول إلى مستودعات الشركات");
        router.replace("/login");
        return;
      }

      // يجب توفر هوية مستخدم مرتبطة بشركة.
      if (!actor?.userId || !actor?.companyId) {
        toast.error("تعذر تحديد المستخدم أو الشركة المرتبطة به");
        router.replace("/login");
        return;
      }

      const currentCompanyId = String(actor.companyId);

      setCompanyId(currentCompanyId);

      const endpoints = [
        "warehouses",
        "products",
        "warehouseStocks",
        "sales",
        "purchases",
        "inventoryMovements",
        "transfers",
        "stockAdjustments",
        "stocktakes",
      ];

      const responses = await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const response = await api.get(`/${endpoint}`, {
              params: {
                companyId: currentCompanyId,
              },
            });

            return Array.isArray(response.data) ? response.data : [];
          } catch (error) {
            console.error(`Failed loading ${endpoint}:`, error);

            throw new Error(`تعذر تحميل البيانات: ${endpoint}`);
          }
        }),
      );

      const [
        warehousesData,
        productsData,
        stocksData,
        salesData,
        purchasesData,
        movementsData,
        transfersData,
        adjustmentsData,
        stocktakesData,
      ] = responses;

      // تأكيد عزل بيانات الشركة حتى لو أعاد API بيانات إضافية.
      const companyWarehouses = warehousesData.filter(
        (item: Warehouse) => String(item.companyId) === currentCompanyId,
      );

      const companyProducts = productsData.filter(
        (item: Product) => String(item.companyId) === currentCompanyId,
      );

      const companyStocks = stocksData.filter(
        (item: WarehouseStock) => String(item.companyId) === currentCompanyId,
      );

      const companySales = salesData.filter(
        (item: SalesPurchase) => String(item.companyId) === currentCompanyId,
      );

      const companyPurchases = purchasesData.filter(
        (item: SalesPurchase) => String(item.companyId) === currentCompanyId,
      );

      const companyMovements = movementsData.filter(
        (item: InventoryMovement) =>
          String(item.companyId) === currentCompanyId,
      );

      const companyTransfers = transfersData.filter(
        (item: Transfer) => String(item.companyId) === currentCompanyId,
      );

      const companyAdjustments = adjustmentsData.filter(
        (item: Adjustment) => String(item.companyId) === currentCompanyId,
      );

      const companyStocktakes = stocktakesData.filter(
        (item: Stocktake) => String(item.companyId) === currentCompanyId,
      );

      const foundWarehouse = companyWarehouses.find(
        (item: Warehouse) => String(item.id) === warehouseId,
      );

      if (!foundWarehouse) {
        toast.error("المستودع غير موجود أو لا يتبع شركتك");
        router.replace("/erp/inventory/inventorySetting");
        return;
      }

      setWarehouse(foundWarehouse);

      setProducts(
        companyProducts.filter(
          (item: Product) => item.trackInventory !== false,
        ),
      );

      setWarehouseStocks(companyStocks);

      setSales(companySales);
      setPurchases(companyPurchases);

      setMovements(companyMovements);
      setTransfers(companyTransfers);

      setAdjustments(companyAdjustments);
      setStocktakes(companyStocktakes);

      // تسجيل عرض المستودع بواسطة المستخدم الحالي.
      await logWarehouseView(foundWarehouse, currentCompanyId);
    } catch (error) {
      console.error("Warehouse loading error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحميل بيانات المستودع",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId]);

  /* =========================================================
     GET PRODUCT STOCK IN THIS WAREHOUSE

     المصدر الأساسي: warehouseStocks

     المصدر البديل:
     products.currentStock إذا لم يوجد سجل warehouseStocks
     وكان المنتج مرتبطًا بهذا المستودع.
  ========================================================= */

  const warehouseProducts = useMemo(() => {
    return products
      .map((product) => {
        const stockRecord = warehouseStocks.find(
          (stock) =>
            String(stock.productId) === String(product.id) &&
            String(stock.warehouseId) === warehouseId &&
            String(stock.companyId) === String(product.companyId),
        );

        const hasWarehouseStock = Boolean(stockRecord);

        const quantity = hasWarehouseStock
          ? number(stockRecord?.quantity)
          : String(product.warehouseId) === warehouseId
            ? number(product.currentStock)
            : 0;

        // استخدام تكلفة المخزون المسجلة إن توفرت،
        // ثم متوسط التكلفة، ثم سعر الشراء كقيمة بديلة.
        const unitCost =
          number(stockRecord?.averageCost) ||
          number(stockRecord?.unitCost) ||
          number(stockRecord?.costPrice) ||
          number(product.averageCost) ||
          number(product.purchasePrice);

        return {
          ...product,

          warehouseQuantity: quantity,
          warehouseUnitCost: unitCost,

          hasWarehouseStock,
        };
      })
      .filter(
        (product) =>
          product.hasWarehouseStock ||
          String(product.warehouseId) === warehouseId,
      );
  }, [products, warehouseStocks, warehouseId]);

  /* =========================================================
     FILTER DATA
  ========================================================= */

  const warehouseMovements = useMemo(
    () =>
      movements.filter(
        (movement) =>
          String(movement.warehouseId) === warehouseId ||
          String(movement.fromWarehouseId) === warehouseId ||
          String(movement.toWarehouseId) === warehouseId,
      ),
    [movements, warehouseId],
  );

  const warehouseTransfers = useMemo(
    () =>
      transfers.filter(
        (transfer) =>
          isCompleted(transfer.status) &&
          (String(transfer.fromWarehouseId) === warehouseId ||
            String(transfer.toWarehouseId) === warehouseId),
      ),
    [transfers, warehouseId],
  );

  const warehouseAdjustments = useMemo(
    () =>
      adjustments.filter(
        (item) =>
          String(item.warehouseId) === warehouseId && isCompleted(item.status),
      ),
    [adjustments, warehouseId],
  );

  const warehouseStocktakes = useMemo(
    () =>
      stocktakes.filter(
        (item) =>
          String(item.warehouseId) === warehouseId && isCompleted(item.status),
      ),
    [stocktakes, warehouseId],
  );

  const warehouseSales = useMemo(
    () =>
      sales.filter(
        (sale) =>
          isCompleted(sale.status) &&
          (String(sale.warehouseId) === warehouseId ||
            (sale.items || []).some(
              (item) => String(item.warehouseId) === warehouseId,
            )),
      ),
    [sales, warehouseId],
  );

  const warehousePurchases = useMemo(
    () =>
      purchases.filter(
        (purchase) =>
          isCompleted(purchase.status) &&
          (String(purchase.warehouseId) === warehouseId ||
            (purchase.items || []).some(
              (item) => String(item.warehouseId) === warehouseId,
            )),
      ),
    [purchases, warehouseId],
  );

  /* =========================================================
     DOCUMENT TOTALS FOR THIS WAREHOUSE
  ========================================================= */

  const getWarehouseDocumentTotals = (
    documents: SalesPurchase[],
    type: "sales" | "purchases",
  ) => {
    return documents.reduce(
      (result, document) => {
        const items = document.items || [];

        if (items.length === 0) {
          if (String(document.warehouseId) === warehouseId) {
            result.amount += number(document.total);
          }

          return result;
        }

        const warehouseItems = items.filter(
          (item) =>
            String(item.warehouseId || document.warehouseId) === warehouseId,
        );

        result.quantity += warehouseItems.reduce(
          (sum, item) => sum + number(item.quantity),
          0,
        );

        result.amount += warehouseItems.reduce(
          (sum, item) => sum + getDocumentItemTotal(item, type),
          0,
        );

        return result;
      },
      {
        amount: 0,
        quantity: 0,
      },
    );
  };

  /* =========================================================
     CALCULATIONS
  ========================================================= */

  const stats = useMemo(() => {
    const totalProducts = warehouseProducts.length;

    const lowStock = warehouseProducts.filter((product) => {
      const minimum = number(product.minStock);

      return (
        minimum > 0 &&
        product.warehouseQuantity > 0 &&
        product.warehouseQuantity <= minimum
      );
    }).length;

    const outOfStock = warehouseProducts.filter(
      (product) => product.warehouseQuantity <= 0,
    ).length;

    // الرصيد الفعلي لكل منتج في هذا المستودع.
    const stockQuantity = warehouseProducts.reduce(
      (sum, product) => sum + product.warehouseQuantity,
      0,
    );

    // قيمة المخزون بالتكلفة المتاحة لكل منتج.
    const stockCost = warehouseProducts.reduce(
      (sum, product) =>
        sum + product.warehouseQuantity * product.warehouseUnitCost,
      0,
    );

    // قيمة تقديرية بسعر البيع.
    const stockSellingValue = warehouseProducts.reduce(
      (sum, product) =>
        sum + product.warehouseQuantity * number(product.sellingPrice),
      0,
    );

    const salesTotals = getWarehouseDocumentTotals(warehouseSales, "sales");

    const purchasesTotals = getWarehouseDocumentTotals(
      warehousePurchases,
      "purchases",
    );

    const incomingTransfers = warehouseTransfers
      .filter((transfer) => String(transfer.toWarehouseId) === warehouseId)
      .reduce((sum, item) => sum + number(item.quantity), 0);

    const outgoingTransfers = warehouseTransfers
      .filter((transfer) => String(transfer.fromWarehouseId) === warehouseId)
      .reduce((sum, item) => sum + number(item.quantity), 0);

    return {
      totalProducts,

      lowStock,
      outOfStock,

      stockQuantity,
      stockCost,
      stockSellingValue,

      // الفرق التقديري وليس الربح المحقق.
      estimatedStockMargin: stockSellingValue - stockCost,

      salesTotal: salesTotals.amount,
      purchasesTotal: purchasesTotals.amount,

      salesQuantity: salesTotals.quantity,
      purchasesQuantity: purchasesTotals.quantity,

      incomingTransfers,
      outgoingTransfers,

      movementCount: warehouseMovements.length,
      adjustmentCount: warehouseAdjustments.length,
      stocktakeCount: warehouseStocktakes.length,
    };
  }, [
    warehouseProducts,
    warehouseSales,
    warehousePurchases,
    warehouseTransfers,
    warehouseMovements,
    warehouseAdjustments,
    warehouseStocktakes,
    warehouseId,
  ]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FiRefreshCw className="animate-spin text-base" />
          جاري تحميل بيانات المستودع...
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div dir="rtl" className="p-5 text-center text-xs text-gray-500">
        لم يتم العثور على المستودع.
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
          <div className="mb-1 flex items-center gap-1.5 text-[10px] text-gray-400">
            <Link
              href="/erp/inventory/inventorySetting"
              className="hover:text-blue-600"
            >
              إعدادات المخزون
            </Link>

            <span>/</span>
            <span>المستودعات</span>
            <span>/</span>
            <span>{warehouse.name}</span>
          </div>

          <h1 className="text-lg font-bold text-gray-800 md:text-xl">
            {warehouse.name}
          </h1>

          <p className="mt-1 text-[10px] text-gray-400">
            لوحة تفاصيل وتحليل المخزون
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 text-[11px] text-gray-600 transition hover:bg-gray-50"
          >
            <FiRefreshCw />
            تحديث
          </button>

          <Link
            href="/erp/inventory/inventorySetting"
            className="flex items-center gap-1.5 rounded-md bg-gray-800 px-3 py-2 text-[11px] text-white transition hover:bg-gray-700"
          >
            <FiArrowRight />
            رجوع
          </Link>
        </div>
      </div>

      {/* WAREHOUSE INFORMATION */}

      <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <FiHome className="text-blue-600" />
            معلومات المستودع
          </h2>

          <div className="flex items-center gap-2">
            {warehouse.isDefault && (
              <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] text-blue-700">
                افتراضي
              </span>
            )}

            <span
              className={`rounded-full px-2 py-1 text-[10px] ${
                warehouse.status === "active"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {warehouse.status === "active" ? "نشط" : "غير نشط"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoItem
            icon={<FiHome />}
            label="اسم المستودع"
            value={warehouse.name}
          />

          <InfoItem
            icon={<FiHash />}
            label="رمز المستودع"
            value={warehouse.code || "-"}
          />

          <InfoItem
            icon={<FiMapPin />}
            label="الموقع"
            value={warehouse.location || "غير محدد"}
          />

          <InfoItem
            icon={<FiHash />}
            label="رقم المستودع"
            value={String(warehouse.id)}
          />
        </div>

        {warehouse.description && (
          <p className="mt-3 border-t pt-3 text-[11px] leading-5 text-gray-500">
            {warehouse.description}
          </p>
        )}

        {/* AUDIT INFORMATION */}

        <div className="mt-3 grid grid-cols-1 gap-2 border-t pt-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <FiActivity className="text-blue-600" />

            <span>
              أنشئ بواسطة:
              <strong className="mr-1 text-gray-700">
                {warehouse.createdByName || "غير مسجل"}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <FiRefreshCw className="text-blue-600" />

            <span>
              آخر تعديل بواسطة:
              <strong className="mr-1 text-gray-700">
                {warehouse.updatedByName || "لا يوجد تعديل مسجل"}
              </strong>
            </span>
          </div>

          <div className="text-[10px] text-gray-400">
            تاريخ الإنشاء: {formatDate(warehouse.createdAt)}
          </div>

          <div className="text-[10px] text-gray-400">
            آخر تحديث: {formatDate(warehouse.updatedAt)}
          </div>
        </div>
      </div>

      {/* INVENTORY SUMMARY */}

      <SectionTitle title="ملخص المخزون الحالي" />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6">
        <StatCard
          title="عدد المنتجات"
          value={stats.totalProducts}
          icon={<FiPackage />}
          color="blue"
        />

        <StatCard
          title="إجمالي الكمية المتبقية"
          value={money(stats.stockQuantity)}
          icon={<FiLayers />}
          color="indigo"
        />

        <StatCard
          title="تكلفة المخزون المتبقي"
          value={money(stats.stockCost)}
          icon={<FiDollarSign />}
          color="green"
        />

        <StatCard
          title="القيمة التقديرية بسعر البيع"
          value={money(stats.stockSellingValue)}
          icon={<FiTrendingUp />}
          color="purple"
        />

        <StatCard
          title="فرق القيمة التقديري"
          value={money(stats.estimatedStockMargin)}
          icon={<FiTrendingUp />}
          color="green"
        />

        <StatCard
          title="مخزون منخفض"
          value={stats.lowStock}
          icon={<FiAlertTriangle />}
          color="orange"
        />

        <StatCard
          title="نفد المخزون"
          value={stats.outOfStock}
          icon={<FiXCircle />}
          color="red"
        />

        <StatCard
          title="حركات المخزون"
          value={stats.movementCount}
          icon={<FiRefreshCw />}
          color="blue"
        />
      </div>

      {/* SALES AND PURCHASES */}

      <SectionTitle title="المبيعات والمشتريات" />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <FinancialCard
          title="إجمالي المبيعات"
          icon={<FiShoppingCart />}
          amount={stats.salesTotal}
          quantity={stats.salesQuantity}
          color="green"
        />

        <FinancialCard
          title="إجمالي المشتريات"
          icon={<FiShoppingBag />}
          amount={stats.purchasesTotal}
          quantity={stats.purchasesQuantity}
          color="blue"
        />
      </div>

      {/* TRANSFERS */}

      <SectionTitle title="التحويلات والتسويات والجرد" />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          title="تحويلات واردة"
          value={money(stats.incomingTransfers)}
          icon={<FiArrowDownLeft />}
          color="green"
        />

        <StatCard
          title="تحويلات صادرة"
          value={money(stats.outgoingTransfers)}
          icon={<FiArrowUpRight />}
          color="orange"
        />

        <StatCard
          title="عمليات التسوية"
          value={stats.adjustmentCount}
          icon={<FiRefreshCw />}
          color="blue"
        />

        <StatCard
          title="عمليات الجرد"
          value={stats.stocktakeCount}
          icon={<FiCheckCircle />}
          color="purple"
        />
      </div>

      {/* PRODUCTS TABLE */}

      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-3">
          <div>
            <h2 className="text-sm font-bold text-gray-800">
              تفاصيل منتجات المستودع
            </h2>

            <p className="mt-1 text-[10px] text-gray-400">
              الرصيد الحالي وفق سجلات أرصدة المستودعات
            </p>
          </div>

          <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] text-blue-700">
            {warehouseProducts.length} منتج
          </span>
        </div>

        {warehouseProducts.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            <FiPackage className="mx-auto mb-2 text-2xl" />
            لا توجد منتجات مرتبطة بهذا المستودع.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-right text-[11px]">
              <thead className="bg-gray-50 text-[10px] text-gray-500">
                <tr>
                  <th className="px-3 py-2.5">المنتج</th>
                  <th className="px-3 py-2.5">الرمز</th>
                  <th className="px-3 py-2.5">الوحدة</th>
                  <th className="px-3 py-2.5">تكلفة الوحدة</th>
                  <th className="px-3 py-2.5">سعر البيع</th>
                  <th className="px-3 py-2.5">المتبقي</th>
                  <th className="px-3 py-2.5">تكلفة المتبقي</th>
                  <th className="px-3 py-2.5">القيمة البيعية</th>
                  <th className="px-3 py-2.5">فرق القيمة</th>
                  <th className="px-3 py-2.5">الحالة</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {warehouseProducts.map((product) => {
                  const quantity = number(product.warehouseQuantity);

                  const purchasePrice = number(product.warehouseUnitCost);
                  const sellingPrice = number(product.sellingPrice);

                  const cost = quantity * purchasePrice;
                  const sellingValue = quantity * sellingPrice;
                  const estimatedDifference = sellingValue - cost;

                  const minStock = number(product.minStock);

                  const isLow =
                    minStock > 0 && quantity > 0 && quantity <= minStock;

                  const isOut = quantity <= 0;

                  return (
                    <tr
                      key={product.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-3 py-2.5 font-semibold text-gray-800">
                        <Link
                          href={`/erp/products/${product.id}`}
                          className="transition hover:text-blue-600 hover:underline"
                        >
                          {product.name}
                        </Link>
                      </td>

                      <td className="px-3 py-2.5 text-gray-500">
                        {product.sku}
                      </td>

                      <td className="px-3 py-2.5 text-gray-500">
                        {product.unitName || "-"}
                      </td>

                      <td className="px-3 py-2.5">{money(purchasePrice)}</td>

                      <td className="px-3 py-2.5">{money(sellingPrice)}</td>

                      <td className="px-3 py-2.5 font-bold text-gray-800">
                        {money(quantity)}
                      </td>

                      <td className="px-3 py-2.5 text-blue-700">
                        {money(cost)}
                      </td>

                      <td className="px-3 py-2.5 text-green-700">
                        {money(sellingValue)}
                      </td>

                      <td className="px-3 py-2.5 font-semibold text-green-700">
                        {money(estimatedDifference)}
                      </td>

                      <td className="px-3 py-2.5">
                        <span
                          className={`whitespace-nowrap rounded-full px-2 py-1 text-[9px] ${
                            isOut
                              ? "bg-red-50 text-red-700"
                              : isLow
                                ? "bg-orange-50 text-orange-700"
                                : "bg-green-50 text-green-700"
                          }`}
                        >
                          {isOut
                            ? "نفد المخزون"
                            : isLow
                              ? "مخزون منخفض"
                              : "متوفر"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MOVEMENTS TABLE */}

      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="border-b px-3 py-3">
          <h2 className="text-sm font-bold text-gray-800">سجل حركات المخزون</h2>

          <p className="mt-1 text-[10px] text-gray-400">
            الحركات المسجلة لهذا المستودع
          </p>
        </div>

        {warehouseMovements.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            لا توجد حركات مخزون مسجلة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right text-[11px]">
              <thead className="bg-gray-50 text-[10px] text-gray-500">
                <tr>
                  <th className="px-3 py-2.5">المنتج</th>
                  <th className="px-3 py-2.5">نوع الحركة</th>
                  <th className="px-3 py-2.5">الكمية</th>
                  <th className="px-3 py-2.5">المرجع</th>
                  <th className="px-3 py-2.5">نفذها المستخدم</th>
                  <th className="px-3 py-2.5">التاريخ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {[...warehouseMovements]
                  .sort(
                    (a, b) =>
                      new Date(b.date || b.createdAt || 0).getTime() -
                      new Date(a.date || a.createdAt || 0).getTime(),
                  )
                  .map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-gray-700">
                        {movement.productName || movement.productId}
                      </td>

                      <td className="px-3 py-2.5">{movement.type}</td>

                      <td className="px-3 py-2.5 font-semibold">
                        {money(number(movement.quantity))}
                      </td>

                      <td className="px-3 py-2.5 text-gray-500">
                        {movement.referenceNumber || movement.reference || "-"}
                      </td>

                      <td className="px-3 py-2.5 text-gray-500">
                        {movement.createdByName || "-"}
                      </td>

                      <td className="px-3 py-2.5 text-gray-500">
                        {formatDate(movement.date || movement.createdAt)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ACCOUNTING NOTE */}

      <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-[10px] leading-5 text-blue-800">
        <FiDatabase className="mt-1 shrink-0 text-sm" />

        <div>
          <p className="font-bold">ملاحظات محاسبية حول بيانات المستودع</p>

          <p className="mt-1">
            يتم احتساب الرصيد الحالي من سجل أرصدة المستودعات (warehouseStocks)،
            ويُستخدم رصيد المنتج الأصلي فقط عند عدم وجود سجل خاص به في المستودع.
            سجل الحركات مخصص للتدقيق ولا يُضاف مرة أخرى إلى الرصيد.
          </p>

          <p className="mt-1">
            تكلفة المخزون المعروضة تعتمد على متوسط التكلفة أو تكلفة الوحدة
            المسجلة إن توفرت، وإلا تستخدم سعر الشراء كقيمة بديلة. لذلك يجب
            اعتماد طريقة تقييم مخزون موحدة مثل المتوسط المرجح أو FIFO عند إعداد
            القوائم المالية النهائية.
          </p>

          <p className="mt-1">
            القيمة البيعية وفرق القيمة المعروضين تقديريان، ولا يمثلان إيرادًا
            محققًا أو صافي ربح. قائمة الدخل تعتمد على المبيعات المحققة وتكلفة
            البضاعة المباعة والمصروفات والقيود المحاسبية المعتمدة.
          </p>
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

        <div
          className={`shrink-0 rounded-md p-2 text-sm ${
            colors[color] || colors.blue
          }`}
        >
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
  icon,
  amount,
  quantity,
  color,
}: {
  title: string;
  icon: ReactNode;
  amount: number;
  quantity: number;
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

        <span className={`rounded-md p-2 ${styles[color] || styles.blue}`}>
          {icon}
        </span>
      </div>

      <p className="mt-3 text-[10px] text-gray-400">إجمالي القيمة</p>

      <h2 className="mt-1 text-lg font-bold text-gray-800">{money(amount)}</h2>

      <div className="mt-3 flex items-center justify-between border-t pt-2">
        <span className="text-[10px] text-gray-400">إجمالي الكمية</span>

        <span className="text-xs font-bold text-gray-800">
          {money(quantity)}
        </span>
      </div>
    </div>
  );
}
