"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { getUserByUsername } from "@/lib/api/users";

import {
  FiPackage,
  FiHome,
  FiSettings,
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiRefreshCw,
  FiArrowLeft,
  FiAlertTriangle,
  FiActivity,
  FiClipboard,
  FiTruck,
  FiPlus,
  FiDollarSign,
  FiTrendingUp,
  FiLayers,
  FiShoppingCart,
} from "react-icons/fi";

// ========================================
// Types
// ========================================

interface Product {
  id: string;
  companyId: string;
  name: string;
  sku?: string;
  barcode?: string;

  purchasePrice?: number;
  sellingPrice?: number;

  quantity?: number;
  stock?: number;
  currentStock?: number;

  minStock?: number;
  reorderLevel?: number;

  warehouseId?: string;
  status?: string;
}

interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  status?: string;
}

interface WarehouseStock {
  id: string;
  companyId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  updatedAt?: string;
}

interface InventoryMovement {
  id: string;
  companyId: string;
  productId?: string;
  productName?: string;
  warehouseId?: string;
  warehouseName?: string;

  type?: string;
  movementType?: string;

  quantity?: number;
  reference?: string;

  date?: string;
  createdAt?: string;
}

// ========================================
// Helpers
// ========================================

const getCookie = (name: string) => {
  if (typeof document === "undefined") return "";

  const cookies = document.cookie.split("; ");

  const cookie = cookies.find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.substring(name.length + 1)) : "";
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("ar-YE", {
    maximumFractionDigits: 2,
  }).format(value);
};

const formatMoney = (value: number) => {
  return `${formatNumber(value)}`;
};

const formatDate = (date?: string) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleDateString("ar-YE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStock = (value?: number) => {
  const number = Number(value ?? 0);

  return Number.isFinite(number) ? number : 0;
};

// ========================================
// Main Page
// ========================================

export default function InventoryPage() {
  const [companyId, setCompanyId] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStock[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  const [loading, setLoading] = useState(true);

  // ======================================
  // Initialize
  // ======================================

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const type = getCookie("type");
      const username = getCookie("username");

      if (!type || !username) {
        toast.error("لم يتم العثور على بيانات تسجيل الدخول");
        return;
      }

      if (type === "platform") {
        toast.error("هذه الصفحة مخصصة لمستخدمي الشركات");
        return;
      }

      // جلب المستخدم من Supabase
      const response = await getUserByUsername(username);

      const user = Array.isArray(response) ? response[0] : response;

      if (!user) {
        toast.error("تعذر العثور على بيانات المستخدم");
        return;
      }

      // التحقق من حالة المستخدم
      if (
        user.isActive === false ||
        user.status === "inactive" ||
        user.status === "غير نشط"
      ) {
        toast.error("حساب المستخدم غير نشط");
        return;
      }

      // التحقق من نوع الحساب
      if (user.type === "platform") {
        toast.error("لا يمكن لحساب المنصة الدخول إلى مخزون الشركات");
        return;
      }

      // تحديد الشركة من سجل المستخدم
      const currentCompanyId = String(user.companyId || "");

      if (!currentCompanyId) {
        toast.error("المستخدم غير مرتبط بشركة");
        return;
      }

      setCompanyId(currentCompanyId);

      await loadInventory(currentCompanyId);
    } catch (error) {
      console.error("Inventory Initialize Error:", error);

      toast.error("حدث خطأ أثناء تهيئة صفحة المخزون");
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // Load Inventory Data From Supabase
  // ======================================

  const loadInventory = async (currentCompanyId: string) => {
    try {
      const [
        productsResponse,
        warehousesResponse,
        warehouseStocksResponse,
        movementsResponse,
      ] = await Promise.all([
        supabase.from("products").select("*").eq("companyId", currentCompanyId),

        supabase
          .from("warehouses")
          .select("*")
          .eq("companyId", currentCompanyId),

        supabase
          .from("warehouseStocks")
          .select("*")
          .eq("companyId", currentCompanyId),

        supabase
          .from("inventoryMovements")
          .select("*")
          .eq("companyId", currentCompanyId)
          .order("createdAt", { ascending: false }),
      ]);

      // التحقق من أخطاء Supabase
      if (productsResponse.error) {
        throw productsResponse.error;
      }

      if (warehousesResponse.error) {
        throw warehousesResponse.error;
      }

      if (warehouseStocksResponse.error) {
        throw warehouseStocksResponse.error;
      }

      if (movementsResponse.error) {
        throw movementsResponse.error;
      }

      // التأكد من أن البيانات مصفوفات
      const productsData = (productsResponse.data ?? []) as Product[];

      const warehousesData = (warehousesResponse.data ?? []) as Warehouse[];

      const warehouseStocksData = (warehouseStocksResponse.data ??
        []) as WarehouseStock[];

      const movementsData = (movementsResponse.data ??
        []) as InventoryMovement[];

      // تحديث الحالة
      setProducts(productsData);

      setWarehouses(warehousesData);

      setWarehouseStocks(warehouseStocksData);

      setMovements(
        [...movementsData].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0).getTime();

          const dateB = new Date(b.createdAt || b.date || 0).getTime();

          return dateB - dateA;
        }),
      );
    } catch (error) {
      console.error("Load Inventory Error:", error);

      toast.error("تعذر تحميل بيانات المخزون من قاعدة البيانات");
    }
  };

  // ======================================
  // Refresh
  // ======================================

  const handleRefresh = async () => {
    if (!companyId) return;

    try {
      setLoading(true);

      await loadInventory(companyId);

      toast.success("تم تحديث بيانات المخزون");
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // Product Stock Map
  // ======================================

  const productStockMap = useMemo(() => {
    const result: Record<string, number> = {};

    warehouseStocks.forEach((stock) => {
      result[stock.productId] =
        (result[stock.productId] || 0) + getStock(stock.quantity);
    });

    return result;
  }, [warehouseStocks]);

  // ======================================
  // Statistics
  // ======================================

  const activeProducts = products.filter(
    (product) => product.status !== "inactive",
  );

  const activeWarehouses = warehouses.filter(
    (warehouse) => warehouse.status !== "inactive",
  );

  const totalQuantity = useMemo(() => {
    return warehouseStocks.reduce(
      (total, stock) => total + getStock(stock.quantity),
      0,
    );
  }, [warehouseStocks]);

  const totalPurchaseValue = useMemo(() => {
    return warehouseStocks.reduce((total, stock) => {
      const product = products.find((item) => item.id === stock.productId);

      if (!product) return total;

      return total + getStock(stock.quantity) * getStock(product.purchasePrice);
    }, 0);
  }, [warehouseStocks, products]);

  const totalSellingValue = useMemo(() => {
    return warehouseStocks.reduce((total, stock) => {
      const product = products.find((item) => item.id === stock.productId);

      if (!product) return total;

      return total + getStock(stock.quantity) * getStock(product.sellingPrice);
    }, 0);
  }, [warehouseStocks, products]);

  const expectedProfit = totalSellingValue - totalPurchaseValue;

  const lowStockProducts = activeProducts.filter((product) => {
    const stock = productStockMap[product.id] || 0;

    const minimum = getStock(product.minStock ?? product.reorderLevel);

    return (
      (product.minStock !== undefined || product.reorderLevel !== undefined) &&
      stock <= minimum
    );
  });

  const productsWithoutCost = activeProducts.filter((product) => {
    const quantity = productStockMap[product.id] || 0;

    return quantity > 0 && !getStock(product.purchasePrice);
  });

  const productsWithoutSellingPrice = activeProducts.filter((product) => {
    const quantity = productStockMap[product.id] || 0;

    return quantity > 0 && !getStock(product.sellingPrice);
  });

  const totalMovements = movements.length;

  const stockedProductsCount = activeProducts.filter(
    (product) => (productStockMap[product.id] || 0) > 0,
  ).length;

  // ======================================
  // Warehouse Statistics
  // ======================================

  const warehouseStatistics = useMemo(() => {
    return activeWarehouses.map((warehouse) => {
      const stocks = warehouseStocks.filter(
        (stock) => stock.warehouseId === warehouse.id,
      );

      let quantity = 0;
      let purchaseValue = 0;
      let sellingValue = 0;

      stocks.forEach((stock) => {
        const product = products.find((item) => item.id === stock.productId);

        const stockQuantity = getStock(stock.quantity);

        quantity += stockQuantity;

        if (product) {
          purchaseValue += stockQuantity * getStock(product.purchasePrice);

          sellingValue += stockQuantity * getStock(product.sellingPrice);
        }
      });

      return {
        ...warehouse,
        quantity,
        purchaseValue,
        sellingValue,
        productsCount: stocks.filter((stock) => getStock(stock.quantity) > 0)
          .length,
      };
    });
  }, [activeWarehouses, warehouseStocks, products]);

  // ======================================
  // Movement Labels
  // ======================================

  const getMovementLabel = (movement: InventoryMovement) => {
    const type = (movement.type || movement.movementType || "").toLowerCase();

    if (
      ["in", "purchase", "receipt", "incoming", "transfer_in"].includes(type)
    ) {
      return {
        label: "إدخال مخزون",
        color: "bg-green-50 text-green-700",
        icon: FiArrowDownCircle,
      };
    }

    if (["out", "sale", "issue", "outgoing", "transfer_out"].includes(type)) {
      return {
        label: "إخراج مخزون",
        color: "bg-red-50 text-red-700",
        icon: FiArrowUpCircle,
      };
    }

    if (["transfer", "adjustment", "تسوية"].includes(type)) {
      return {
        label: "تحويل / تسوية",
        color: "bg-blue-50 text-blue-700",
        icon: FiRefreshCw,
      };
    }

    return {
      label: movement.type || movement.movementType || "حركة مخزون",
      color: "bg-gray-100 text-gray-700",
      icon: FiActivity,
    };
  };

  // ======================================
  // Quick Links
  // ======================================

  const quickLinks = [
    {
      title: "إضافة منتج",
      description: "إدارة أصناف ومنتجات الشركة",
      href: "/erp/products",
      icon: FiPackage,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "المستودعات",
      description: "إدارة مستودعات الشركة",
      href: "/erp/inventory/warehouses",
      icon: FiHome,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "إعدادات المخزون",
      description: "مجموعات الأصناف ووحدات القياس",
      href: "/erp/inventory/inventorySetting",
      icon: FiSettings,
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "حركات المخزون",
      description: "متابعة حركة الأصناف",
      href: "/erp/inventory/movements",
      icon: FiActivity,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "تسويات المخزون",
      description: "تسجيل فروقات الكميات",
      href: "/erp/inventory/adjustments",
      icon: FiClipboard,
      color: "bg-pink-50 text-pink-600",
    },
    {
      title: "تحويلات المخزون",
      description: "نقل الأصناف بين المستودعات",
      href: "/erp/inventory/transfers",
      icon: FiTruck,
      color: "bg-cyan-50 text-cyan-600",
    },
  ];

  // ======================================
  // Loading
  // ======================================

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="mx-auto animate-spin text-4xl text-blue-600" />

          <p className="mt-4 text-sm text-gray-500">
            جارٍ تحميل بيانات المخزون...
          </p>
        </div>
      </div>
    );
  }

  // ======================================
  // Company Error
  // ======================================

  if (!companyId) {
    return (
      <div
        dir="rtl"
        className="m-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700"
      >
        <FiAlertTriangle className="mx-auto mb-3 text-3xl" />

        <h2 className="font-bold">
          لم يتم العثور على الشركة المرتبطة بالمستخدم
        </h2>

        <p className="mt-2 text-sm">
          تحقق من تسجيل الدخول وارتباط المستخدم بالشركة.
        </p>
      </div>
    );
  }

  // ======================================
  // Main UI
  // ======================================

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <span>الرئيسية</span>
            <span>/</span>
            <span className="font-medium text-blue-600">المخزون</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800">إدارة المخزون</h1>

          <p className="mt-2 text-sm text-gray-500">
            متابعة الكميات والقيمة المالية وتوزيع المخزون على المستودعات.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FiRefreshCw />
            تحديث
          </button>

          <Link
            href="/erp/products"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FiPlus />
            إضافة صنف
          </Link>
        </div>
      </div>

      {/* Company Info */}

      <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div>
          <p className="text-xs text-blue-600">الشركة الحالية</p>

          <p className="mt-1 font-bold text-blue-900">
            رقم الشركة: {companyId}
          </p>
        </div>

        <div className="rounded-lg bg-white p-3 text-blue-600">
          <FiHome size={24} />
        </div>
      </div>

      {/* Main Statistics */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="الأصناف النشطة"
          value={formatNumber(activeProducts.length)}
          icon={<FiPackage size={25} />}
          color="blue"
          description={`أصناف لديها رصيد: ${formatNumber(stockedProductsCount)}`}
          href="/erp/products"
          linkText="عرض الأصناف"
        />

        <StatCard
          title="المستودعات النشطة"
          value={formatNumber(activeWarehouses.length)}
          icon={<FiHome size={25} />}
          color="purple"
          description="عدد المستودعات المسجلة"
          href="/erp/inventory/warehouses"
          linkText="عرض المستودعات"
        />

        <StatCard
          title="إجمالي الكميات"
          value={formatNumber(totalQuantity)}
          icon={<FiLayers size={25} />}
          color="cyan"
          description="مجموع أرصدة جميع المستودعات"
        />

        <StatCard
          title="أصناف منخفضة المخزون"
          value={formatNumber(lowStockProducts.length)}
          icon={<FiAlertTriangle size={25} />}
          color="orange"
          description="حسب حد إعادة الطلب المسجل"
        />
      </div>

      {/* Financial Statistics */}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            القيمة المالية للمخزون
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            القيم محسوبة من أرصدة المستودعات وأسعار المنتجات المسجلة.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="قيمة المخزون بالتكلفة المسجلة"
            value={formatMoney(totalPurchaseValue)}
            icon={<FiDollarSign size={25} />}
            color="blue"
            description="الكمية المتوفرة × سعر الشراء"
          />

          <StatCard
            title="القيمة المتوقعة للبيع"
            value={formatMoney(totalSellingValue)}
            icon={<FiShoppingCart size={25} />}
            color="green"
            description="الكمية المتوفرة × سعر البيع"
          />

          <StatCard
            title="الربح المتوقع"
            value={formatMoney(expectedProfit)}
            icon={<FiTrendingUp size={25} />}
            color={expectedProfit >= 0 ? "green" : "red"}
            description="فرق سعر البيع والشراء للكميات الحالية"
          />

          <StatCard
            title="إجمالي حركات المخزون"
            value={formatNumber(totalMovements)}
            icon={<FiActivity size={25} />}
            color="purple"
            description="جميع الحركات المسجلة للشركة"
          />
        </div>
      </section>

      {/* Valuation Notes */}

      {(productsWithoutCost.length > 0 ||
        productsWithoutSellingPrice.length > 0 ||
        warehouseStocks.length === 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="mt-1 shrink-0 text-amber-600" />

            <div className="space-y-2">
              <h3 className="font-bold text-amber-800">
                ملاحظات على تقييم المخزون
              </h3>

              {warehouseStocks.length === 0 && (
                <p className="text-sm text-amber-800">
                  لا توجد أرصدة مسجلة في جدول warehouseStocks. لذلك لن يتم
                  استخدام currentStock من المنتجات بدلًا منها.
                </p>
              )}

              {productsWithoutCost.length > 0 && (
                <p className="text-sm text-amber-800">
                  يوجد {formatNumber(productsWithoutCost.length)} صنفًا لديه
                  رصيد دون سعر شراء مسجل.
                </p>
              )}

              {productsWithoutSellingPrice.length > 0 && (
                <p className="text-sm text-amber-800">
                  يوجد {formatNumber(productsWithoutSellingPrice.length)} صنفًا
                  لديه رصيد دون سعر بيع مسجل.
                </p>
              )}

              <p className="text-xs text-amber-700">
                القيم المعروضة تقديرية، ولا تمثل حتى الآن تكلفة المخزون
                المحاسبية المعتمدة.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Statistics */}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5">
          <h2 className="font-bold text-gray-800">المخزون حسب المستودع</h2>

          <p className="mt-1 text-xs text-gray-500">
            توزيع الكميات والقيم المالية على مستودعات الشركة.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-right text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-4">المستودع</th>
                <th className="px-5 py-4">عدد الأصناف</th>
                <th className="px-5 py-4">إجمالي الكميات</th>
                <th className="px-5 py-4">قيمة الشراء</th>
                <th className="px-5 py-4">قيمة البيع</th>
                <th className="px-5 py-4">الفرق المتوقع</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {warehouseStatistics.map((warehouse) => {
                const profit = warehouse.sellingValue - warehouse.purchaseValue;

                return (
                  <tr key={warehouse.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-800">
                        {warehouse.name}
                      </div>

                      <div className="mt-1 text-xs text-gray-400">
                        {warehouse.code || warehouse.id}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {formatNumber(warehouse.productsCount)}
                    </td>

                    <td className="px-5 py-4 font-semibold text-gray-800">
                      {formatNumber(warehouse.quantity)}
                    </td>

                    <td className="px-5 py-4 text-blue-700">
                      {formatMoney(warehouse.purchaseValue)}
                    </td>

                    <td className="px-5 py-4 text-green-700">
                      {formatMoney(warehouse.sellingValue)}
                    </td>

                    <td
                      className={`px-5 py-4 font-semibold ${
                        profit >= 0 ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {formatMoney(profit)}
                    </td>
                  </tr>
                );
              })}

              {warehouseStatistics.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-gray-400"
                  >
                    لا توجد مستودعات مسجلة.
                  </td>
                </tr>
              )}
            </tbody>

            {warehouseStatistics.length > 0 && (
              <tfoot className="bg-gray-50 font-bold text-gray-800">
                <tr>
                  <td className="px-5 py-4">الإجمالي</td>

                  <td className="px-5 py-4">-</td>

                  <td className="px-5 py-4">{formatNumber(totalQuantity)}</td>

                  <td className="px-5 py-4 text-blue-700">
                    {formatMoney(totalPurchaseValue)}
                  </td>

                  <td className="px-5 py-4 text-green-700">
                    {formatMoney(totalSellingValue)}
                  </td>

                  <td className="px-5 py-4 text-green-700">
                    {formatMoney(expectedProfit)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Quick Links */}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-800">إدارة المخزون</h2>

          <p className="mt-1 text-sm text-gray-500">
            الوصول السريع إلى أقسام المخزون.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className={`rounded-xl p-4 ${item.color}`}>
                    <Icon size={24} />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-800">{item.title}</h3>

                    <p className="mt-1 text-xs text-gray-500">
                      {item.description}
                    </p>
                  </div>
                </div>

                <FiArrowLeft className="text-gray-400 transition group-hover:-translate-x-1 group-hover:text-blue-600" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Movements */}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="font-bold text-gray-800">آخر حركات المخزون</h2>

            <p className="mt-1 text-xs text-gray-500">
              أحدث العمليات المسجلة على المخزون.
            </p>
          </div>

          <Link
            href="/erp/inventory/movements"
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            عرض الكل
            <FiArrowLeft />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-right text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-4">الصنف</th>
                <th className="px-5 py-4">نوع الحركة</th>
                <th className="px-5 py-4">الكمية</th>
                <th className="px-5 py-4">المستودع</th>
                <th className="px-5 py-4">التاريخ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {movements.slice(0, 6).map((movement) => {
                const movementInfo = getMovementLabel(movement);

                const MovementIcon = movementInfo.icon;

                return (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {movement.productName || movement.productId || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${movementInfo.color}`}
                      >
                        <MovementIcon size={14} />
                        {movementInfo.label}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-semibold text-gray-700">
                      {formatNumber(Number(movement.quantity || 0))}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {movement.warehouseName || movement.warehouseId || "-"}
                    </td>

                    <td className="px-5 py-4 text-gray-500">
                      {formatDate(movement.createdAt || movement.date)}
                    </td>
                  </tr>
                );
              })}

              {movements.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-gray-400"
                  >
                    لا توجد حركات مخزون مسجلة حتى الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ========================================
// Statistics Card
// ========================================

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "purple" | "cyan" | "orange" | "green" | "red";
  description: string;
  href?: string;
  linkText?: string;
}

function StatCard({
  title,
  value,
  icon,
  color,
  description,
  href,
  linkText,
}: StatCardProps) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    cyan: "bg-cyan-50 text-cyan-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{title}</p>

          <h2 className="mt-3 break-words text-2xl font-bold text-gray-800">
            {value}
          </h2>
        </div>

        <div className={`shrink-0 rounded-xl p-4 ${colors[color]}`}>{icon}</div>
      </div>

      <p className="mt-4 text-xs text-gray-400">{description}</p>

      {href && (
        <Link
          href={href}
          className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          {linkText || "عرض التفاصيل"}
          <FiArrowLeft />
        </Link>
      )}
    </div>
  );
}
