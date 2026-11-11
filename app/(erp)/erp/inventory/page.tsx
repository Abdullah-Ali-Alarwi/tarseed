"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";

import {
  FiPackage,
  FiHome,
  FiLayers,
  FiBox,
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
} from "react-icons/fi";

// ========================================
// API
// ========================================

const api = axios.create({
  baseURL: "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

// ========================================
// Types
// ========================================

interface Product {
  id: string;
  companyId: string;
  name: string;
  sku?: string;
  barcode?: string;
  quantity?: number;
  stock?: number;
  currentStock?: number;
  minStock?: number;
  reorderLevel?: number;
  status?: string;
}

interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  status?: string;
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
  const cookies = document.cookie.split("; ");

  const cookie = cookies.find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.substring(name.length + 1)) : "";
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("ar-YE").format(value);
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

// ========================================
// Main Page
// ========================================

export default function InventoryPage() {
  const [companyId, setCompanyId] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
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
      const currentCompanyId = getCookie("companyId");

      if (!type) {
        toast.error("لم يتم العثور على بيانات تسجيل الدخول");
        return;
      }

      if (type === "platform") {
        toast.error("هذه الصفحة مخصصة لمستخدمي الشركات");
        return;
      }

      if (!currentCompanyId) {
        toast.error("لم يتم العثور على الشركة المرتبطة بالمستخدم");
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
  // Load Inventory Data
  // ======================================

  const loadInventory = async (currentCompanyId: string) => {
    try {
      const [productsResponse, warehousesResponse, movementsResponse] =
        await Promise.all([
          api.get("/products", {
            params: { companyId: currentCompanyId },
          }),

          api.get("/warehouses", {
            params: { companyId: currentCompanyId },
          }),

          api.get("/inventoryMovements", {
            params: { companyId: currentCompanyId },
          }),
        ]);

      setProducts(productsResponse.data);
      setWarehouses(warehousesResponse.data);
      setMovements(
        [...movementsResponse.data].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0).getTime();

          const dateB = new Date(b.createdAt || b.date || 0).getTime();

          return dateB - dateA;
        }),
      );
    } catch (error) {
      console.error("Load Inventory Error:", error);
      toast.error("تعذر تحميل بيانات المخزون");
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
  // Statistics
  // ======================================

  const activeProducts = products.filter(
    (product) => product.status !== "inactive",
  );

  const activeWarehouses = warehouses.filter(
    (warehouse) => warehouse.status !== "inactive",
  );

  const lowStockProducts = products.filter((product) => {
    const stock = product.currentStock ?? product.stock ?? product.quantity;

    const minimum = product.minStock ?? product.reorderLevel;

    return (
      typeof stock === "number" &&
      typeof minimum === "number" &&
      stock <= minimum
    );
  });

  const totalMovements = movements.length;

  // ======================================
  // Movement Labels
  // ======================================

  const getMovementLabel = (movement: InventoryMovement) => {
    const type = (movement.type || movement.movementType || "").toLowerCase();

    if (["in", "purchase", "receipt", "incoming"].includes(type)) {
      return {
        label: "إدخال مخزون",
        color: "bg-green-50 text-green-700",
        icon: FiArrowDownCircle,
      };
    }

    if (["out", "sale", "issue", "outgoing"].includes(type)) {
      return {
        label: "إخراج مخزون",
        color: "bg-red-50 text-red-700",
        icon: FiArrowUpCircle,
      };
    }

    if (["transfer", "تسوية", "adjustment"].includes(type)) {
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
      title: "اضافة منتج",
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

        <p className="mt-2 text-sm">تحقق من وجود companyId في Cookies.</p>
      </div>
    );
  }

  // ======================================
  // Main UI
  // ======================================

  return (
    <div dir="rtl" className="space-y-7 p-4 md:p-6">
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
            متابعة الأصناف والمستودعات وحركة المخزون.
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

      {/* Statistics */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Products */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي الأصناف النشطة</p>

              <h2 className="mt-3 text-3xl font-bold text-gray-800">
                {formatNumber(activeProducts.length)}
              </h2>
            </div>

            <div className="rounded-xl bg-blue-50 p-4 text-blue-600">
              <FiPackage size={26} />
            </div>
          </div>

          <Link
            href="/erp/products"
            className="mt-5 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            عرض الأصناف
            <FiArrowLeft />
          </Link>
        </div>

        {/* Warehouses */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">المستودعات النشطة</p>

              <h2 className="mt-3 text-3xl font-bold text-gray-800">
                {formatNumber(activeWarehouses.length)}
              </h2>
            </div>

            <div className="rounded-xl bg-purple-50 p-4 text-purple-600">
              <FiHome size={26} />
            </div>
          </div>

          <Link
            href="/erp/inventory/warehouses"
            className="mt-5 flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800"
          >
            عرض المستودعات
            <FiArrowLeft />
          </Link>
        </div>

        {/* Low Stock */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">أصناف منخفضة المخزون</p>

              <h2 className="mt-3 text-3xl font-bold text-gray-800">
                {formatNumber(lowStockProducts.length)}
              </h2>
            </div>

            <div className="rounded-xl bg-orange-50 p-4 text-orange-600">
              <FiAlertTriangle size={26} />
            </div>
          </div>

          <p className="mt-5 text-xs text-gray-400">
            حسب حد إعادة الطلب المسجل للصنف
          </p>
        </div>

        {/* Movements */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي حركات المخزون</p>

              <h2 className="mt-3 text-3xl font-bold text-gray-800">
                {formatNumber(totalMovements)}
              </h2>
            </div>

            <div className="rounded-xl bg-green-50 p-4 text-green-600">
              <FiActivity size={26} />
            </div>
          </div>

          <p className="mt-5 text-xs text-gray-400">
            جميع الحركات المسجلة للشركة
          </p>
        </div>
      </div>

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
