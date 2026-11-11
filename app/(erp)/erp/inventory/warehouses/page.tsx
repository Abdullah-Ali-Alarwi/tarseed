"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";

import {
  FiHome,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
  FiRefreshCw,
  FiMapPin,
  FiCheckCircle,
  FiPackage,
  FiAlertCircle,
  FiDollarSign,
  FiLayers,
  FiTrendingDown,
  FiFilter,
  FiEye,
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

type WarehouseStatus = "active" | "inactive";

interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  location: string;
  description: string;
  status: WarehouseStatus;
  createdAt?: string;
}

interface Product {
  id: string;
  companyId: string;
  warehouseId?: string;
  name: string;
  sku?: string;
  unitName?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  currentStock?: number;
  minStock?: number;
  status?: string;
}

// ========================================
// Helpers
// ========================================

const getCookie = (name: string) => {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.substring(name.length + 1)) : "";
};

const number = (value: unknown) => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};

const money = (value: number) =>
  new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const emptyForm = {
  name: "",
  location: "",
  description: "",
  status: "active" as WarehouseStatus,
};

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-xs font-medium text-gray-700";

// ========================================
// Main Component
// ========================================

export default function WarehousesPage() {
  const [companyId, setCompanyId] = useState("");

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  // ======================================
  // Initialize
  // ======================================

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const userType = getCookie("type");
      const currentCompanyId = getCookie("companyId");

      if (!["owner", "erp"].includes(userType)) {
        toast.error("هذه الصفحة مخصصة لمستخدمي الشركات");
        return;
      }

      if (!currentCompanyId) {
        toast.error("لم يتم العثور على الشركة المرتبطة بالمستخدم");
        return;
      }

      setCompanyId(currentCompanyId);

      await loadData(currentCompanyId);
    } catch (error) {
      console.error("Initialize Error:", error);
      toast.error("حدث خطأ أثناء تحميل الصفحة");
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // Load Data
  // ======================================

  const loadData = async (currentCompanyId: string) => {
    try {
      const [warehouseRes, productRes] = await Promise.all([
        api.get("/warehouses", {
          params: { companyId: currentCompanyId },
        }),

        api.get("/products", {
          params: { companyId: currentCompanyId },
        }),
      ]);

      setWarehouses(
        warehouseRes.data.filter(
          (item: Warehouse) =>
            String(item.companyId) === String(currentCompanyId),
        ),
      );

      setProducts(
        productRes.data.filter(
          (item: Product) =>
            String(item.companyId) === String(currentCompanyId),
        ),
      );
    } catch (error) {
      console.error("Load Data Error:", error);
      toast.error("تعذر تحميل بيانات المستودعات");
    }
  };

  // ======================================
  // Refresh
  // ======================================

  const handleRefresh = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      await loadData(companyId);
      toast.success("تم تحديث البيانات");
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // Warehouse Statistics
  // ======================================

  const activeWarehouses = warehouses.filter(
    (item) => item.status === "active",
  );

  const inactiveWarehouses = warehouses.filter(
    (item) => item.status === "inactive",
  );

  const totalProducts = products.length;

  const totalStockQuantity = products.reduce(
    (sum, product) => sum + number(product.currentStock),
    0,
  );

  const totalStockCost = products.reduce(
    (sum, product) =>
      sum + number(product.currentStock) * number(product.purchasePrice),
    0,
  );

  const lowStockProducts = products.filter(
    (product) =>
      product.status !== "inactive" &&
      number(product.currentStock) <= number(product.minStock),
  );

  const lowStockPercentage =
    totalProducts > 0 ? (lowStockProducts.length / totalProducts) * 100 : 0;

  // ======================================
  // Warehouse Products
  // ======================================

  const getWarehouseProducts = (warehouseId: string) => {
    return products.filter(
      (product) => String(product.warehouseId) === String(warehouseId),
    );
  };

  // ======================================
  // Warehouse Statistics
  // ======================================

  const getWarehouseStats = (warehouseId: string) => {
    const warehouseProducts = getWarehouseProducts(warehouseId);

    const quantity = warehouseProducts.reduce(
      (sum, product) => sum + number(product.currentStock),
      0,
    );

    const cost = warehouseProducts.reduce(
      (sum, product) =>
        sum + number(product.currentStock) * number(product.purchasePrice),
      0,
    );

    const lowProducts = warehouseProducts.filter(
      (product) =>
        product.status !== "inactive" &&
        number(product.currentStock) <= number(product.minStock),
    );

    const outOfStock = warehouseProducts.filter(
      (product) => number(product.currentStock) <= 0,
    ).length;

    const lowPercentage =
      warehouseProducts.length > 0
        ? (lowProducts.length / warehouseProducts.length) * 100
        : 0;

    return {
      productsCount: warehouseProducts.length,
      quantity,
      cost,
      lowCount: lowProducts.length,
      outOfStock,
      lowPercentage,
    };
  };

  // ======================================
  // Locations
  // ======================================

  const locations = useMemo(() => {
    return Array.from(
      new Set(
        warehouses
          .map((item) => item.location?.trim())
          .filter((item): item is string => Boolean(item)),
      ),
    );
  }, [warehouses]);

  // ======================================
  // Filters
  // ======================================

  const filteredWarehouses = warehouses.filter((warehouse) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      warehouse.name.toLowerCase().includes(searchText) ||
      (warehouse.location || "").toLowerCase().includes(searchText) ||
      (warehouse.description || "").toLowerCase().includes(searchText) ||
      String(warehouse.id).toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "all" || warehouse.status === statusFilter;

    const matchesLocation =
      locationFilter === "all" || warehouse.location === locationFilter;

    const stats = getWarehouseStats(warehouse.id);

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "hasProducts" && stats.productsCount > 0) ||
      (stockFilter === "empty" && stats.productsCount === 0) ||
      (stockFilter === "low" && stats.lowCount > 0) ||
      (stockFilter === "out" && stats.outOfStock > 0);

    return matchesSearch && matchesStatus && matchesLocation && matchesStock;
  });

  // ======================================
  // Open Add Form
  // ======================================

  const handleAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  // ======================================
  // Open Edit Form
  // ======================================

  const handleEdit = (warehouse: Warehouse) => {
    setEditingId(String(warehouse.id));

    setForm({
      name: warehouse.name,
      location: warehouse.location || "",
      description: warehouse.description || "",
      status: warehouse.status,
    });

    setShowForm(true);
  };

  // ======================================
  // Form Changes
  // ======================================

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ======================================
  // Save Warehouse
  // ======================================

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!companyId) {
      toast.error("الشركة غير محددة");
      return;
    }

    const name = form.name.trim();

    if (!name) {
      toast.error("أدخل اسم المستودع");
      return;
    }

    const duplicateName = warehouses.some(
      (warehouse) =>
        warehouse.name.trim().toLowerCase() === name.toLowerCase() &&
        String(warehouse.id) !== editingId,
    );

    if (duplicateName) {
      toast.error("اسم المستودع مستخدم مسبقاً");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        companyId,
        name,
        location: form.location.trim(),
        description: form.description.trim(),
        status: form.status,
      };

      if (editingId) {
        const currentWarehouse = warehouses.find(
          (item) => String(item.id) === editingId,
        );

        if (
          !currentWarehouse ||
          String(currentWarehouse.companyId) !== String(companyId)
        ) {
          toast.error("لا يمكنك تعديل هذا المستودع");
          return;
        }

        await api.patch(`/warehouses/${editingId}`, payload);

        toast.success("تم تحديث المستودع بنجاح");
      } else {
        await api.post("/warehouses", {
          ...payload,
          createdAt: new Date().toISOString(),
        });

        toast.success("تمت إضافة المستودع بنجاح");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadData(companyId);
    } catch (error) {
      console.error("Save Warehouse Error:", error);
      toast.error("حدث خطأ أثناء حفظ المستودع");
    } finally {
      setSaving(false);
    }
  };

  // ======================================
  // Delete Warehouse
  // ======================================

  const handleDelete = async (warehouse: Warehouse) => {
    if (String(warehouse.companyId) !== String(companyId)) {
      toast.error("لا يمكنك حذف مستودع تابع لشركة أخرى");
      return;
    }

    if (warehouses.length <= 1) {
      toast.error("يجب الاحتفاظ بمستودع واحد على الأقل");
      return;
    }

    const hasProducts = products.some(
      (product) => String(product.warehouseId) === String(warehouse.id),
    );

    if (hasProducts) {
      toast.error("لا يمكن حذف مستودع يحتوي على أصناف");
      return;
    }

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف المستودع "${warehouse.name}"؟`,
    );

    if (!confirmed) return;

    try {
      await api.delete(`/warehouses/${warehouse.id}`);

      toast.success("تم حذف المستودع بنجاح");

      await loadData(companyId);
    } catch (error) {
      console.error("Delete Warehouse Error:", error);
      toast.error("تعذر حذف المستودع");
    }
  };

  // ======================================
  // Reset Filters
  // ======================================

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setLocationFilter("all");
    setStockFilter("all");
  };

  // ======================================
  // Loading
  // ======================================

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <FiRefreshCw className="animate-spin text-2xl text-blue-600" />
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
        className="m-4 rounded-lg border border-red-200 bg-red-50 p-5 text-center text-red-700"
      >
        <FiAlertCircle className="mx-auto mb-2 text-2xl" />

        <h2 className="text-sm font-bold">
          لم يتم العثور على الشركة المرتبطة بالمستخدم
        </h2>

        <p className="mt-2 text-xs">تحقق من وجود companyId في Cookies.</p>
      </div>
    );
  }

  // ======================================
  // Main UI
  // ======================================

  return (
    <div dir="rtl" className="space-y-4 p-3 md:p-4">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[10px] text-gray-400">
            <span>المخزون</span>
            <span>/</span>
            <span className="font-medium text-blue-600">المستودعات</span>
          </div>

          <h1 className="text-lg font-bold text-gray-800">إدارة المستودعات</h1>

          <p className="mt-1 text-[11px] text-gray-500">
            إدارة المستودعات والكميات وتكاليف المخزون.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-[11px] text-gray-700 hover:bg-gray-50"
          >
            <FiRefreshCw />
            تحديث
          </button>

          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-[11px] font-medium text-white hover:bg-blue-700"
          >
            <FiPlus />
            إضافة مستودع
          </button>
        </div>
      </div>

      {/* COMPANY INFO */}

      <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
        <div>
          <p className="text-[10px] text-blue-600">الشركة الحالية</p>

          <p className="mt-1 text-xs font-bold text-blue-900">
            رقم الشركة: {companyId}
          </p>
        </div>

        <FiHome className="text-xl text-blue-600" />
      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard
          title="إجمالي المستودعات"
          value={warehouses.length}
          icon={<FiHome />}
          color="blue"
        />

        <StatCard
          title="المستودعات النشطة"
          value={activeWarehouses.length}
          icon={<FiCheckCircle />}
          color="green"
        />

        <StatCard
          title="غير النشطة"
          value={inactiveWarehouses.length}
          icon={<FiAlertCircle />}
          color="red"
        />

        <StatCard
          title="إجمالي الأصناف"
          value={totalProducts}
          icon={<FiPackage />}
          color="indigo"
        />

        <StatCard
          title="إجمالي الكمية"
          value={money(totalStockQuantity)}
          icon={<FiLayers />}
          color="blue"
        />

        <StatCard
          title="تكلفة المخزون"
          value={money(totalStockCost)}
          icon={<FiDollarSign />}
          color="green"
        />

        <StatCard
          title="أصناف منخفضة"
          value={lowStockProducts.length}
          icon={<FiTrendingDown />}
          color="orange"
        />

        <StatCard
          title="نسبة المخزون المنخفض"
          value={`${lowStockPercentage.toFixed(1)}%`}
          icon={<FiAlertCircle />}
          color="red"
        />
      </div>

      {/* FILTERS */}

      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <FiFilter className="text-blue-600" />
            البحث والتصفية
          </h2>

          <button
            onClick={resetFilters}
            className="text-[10px] text-blue-600 hover:underline"
          >
            إعادة ضبط الفلاتر
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}

          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="ابحث عن مستودع..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pr-9 pl-3 text-xs outline-none focus:border-blue-500"
            />
          </div>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={inputClass}
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>

          {/* Location */}

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className={inputClass}
          >
            <option value="all">جميع المواقع</option>

            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          {/* Stock */}

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className={inputClass}
          >
            <option value="all">جميع حالات المخزون</option>
            <option value="hasProducts">يحتوي على أصناف</option>
            <option value="empty">فارغ</option>
            <option value="low">يحتوي على مخزون منخفض</option>
            <option value="out">يحتوي على أصناف نافدة</option>
          </select>
        </div>

        <p className="mt-2 text-[10px] text-gray-400">
          عدد النتائج: {filteredWarehouses.length} من {warehouses.length}
        </p>
      </div>

      {/* WAREHOUSE TABLE */}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-3 py-3">
          <div>
            <h2 className="text-sm font-bold text-gray-800">
              قائمة المستودعات
            </h2>

            <p className="mt-1 text-[10px] text-gray-400">
              بيانات المستودعات والكميات والتكلفة
            </p>
          </div>

          <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] text-blue-700">
            {filteredWarehouses.length} مستودع
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-right text-[11px]">
            <thead className="bg-gray-50 text-[10px] text-gray-500">
              <tr>
                <th className="px-3 py-3">المستودع</th>
                <th className="px-3 py-3">الموقع</th>
                <th className="px-3 py-3">عدد الأصناف</th>
                <th className="px-3 py-3">الكمية المتوفرة</th>
                <th className="px-3 py-3">تكلفة المخزون</th>
                <th className="px-3 py-3">الأصناف المنخفضة</th>
                <th className="px-3 py-3">نسبة الانخفاض</th>
                <th className="px-3 py-3">الحالة</th>
                <th className="px-3 py-3 text-center">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredWarehouses.map((warehouse) => {
                const stats = getWarehouseStats(warehouse.id);

                return (
                  <tr
                    key={warehouse.id}
                    className="transition hover:bg-gray-50"
                  >
                    {/* Warehouse Name / Link */}

                    <td className="px-3 py-3">
                      <Link
                        href={`/erp/inventory/warehouses/${warehouse.id}`}
                        className="group flex items-center gap-2"
                      >
                        <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                          <FiHome size={15} />
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 group-hover:text-blue-600 group-hover:underline">
                            {warehouse.name}
                          </p>

                          <p className="mt-1 text-[9px] text-gray-400">
                            عرض تفاصيل المستودع
                          </p>
                        </div>

                        <FiEye className="text-gray-300 group-hover:text-blue-600" />
                      </Link>
                    </td>

                    {/* Location */}

                    <td className="px-3 py-3 text-gray-600">
                      <div className="flex items-center gap-1">
                        <FiMapPin className="text-gray-400" />
                        {warehouse.location || "-"}
                      </div>
                    </td>

                    {/* Products */}

                    <td className="px-3 py-3">
                      <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                        {stats.productsCount}
                      </span>
                    </td>

                    {/* Quantity */}

                    <td className="px-3 py-3 font-semibold text-gray-800">
                      {money(stats.quantity)}
                    </td>

                    {/* Cost */}

                    <td className="px-3 py-3 font-semibold text-green-700">
                      {money(stats.cost)}
                    </td>

                    {/* Low Stock */}

                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 ${
                          stats.lowCount > 0
                            ? "bg-orange-50 text-orange-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {stats.lowCount}
                      </span>
                    </td>

                    {/* Low Percentage */}

                    <td className="px-3 py-3">
                      <div className="flex min-w-[90px] items-center gap-2">
                        <span
                          className={`font-bold ${
                            stats.lowPercentage > 0
                              ? "text-orange-600"
                              : "text-green-600"
                          }`}
                        >
                          {stats.lowPercentage.toFixed(1)}%
                        </span>

                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${
                              stats.lowPercentage >= 50
                                ? "bg-red-500"
                                : stats.lowPercentage > 0
                                  ? "bg-orange-400"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(stats.lowPercentage, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status */}

                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] ${
                          warehouse.status === "active"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {warehouse.status === "active" ? "نشط" : "غير نشط"}
                      </span>
                    </td>

                    {/* Actions */}

                    <td className="px-3 py-3">
                      <div className="flex justify-center gap-1.5">
                        <Link
                          href={`/erp/inventory/warehouses/${warehouse.id}`}
                          title="التفاصيل"
                          className="rounded-md bg-indigo-50 p-2 text-indigo-600 hover:bg-indigo-100"
                        >
                          <FiEye size={14} />
                        </Link>

                        <button
                          onClick={() => handleEdit(warehouse)}
                          title="تعديل"
                          className="rounded-md bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                        >
                          <FiEdit2 size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(warehouse)}
                          title="حذف"
                          className="rounded-md bg-red-50 p-2 text-red-600 hover:bg-red-100"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredWarehouses.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    <FiHome className="mx-auto mb-2 text-2xl" />

                    <p className="text-xs">
                      لا توجد مستودعات مطابقة للفلاتر المحددة.
                    </p>

                    <button
                      onClick={resetFilters}
                      className="mt-2 text-[11px] text-blue-600 hover:underline"
                    >
                      إعادة ضبط الفلاتر
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-3">
          <div className="my-auto w-full max-w-xl rounded-xl bg-white shadow-xl">
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-sm font-bold text-gray-800">
                  {editingId ? "تعديل المستودع" : "إضافة مستودع جديد"}
                </h2>

                <p className="mt-1 text-[10px] text-gray-500">
                  أدخل بيانات المستودع.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
              >
                <FiX size={17} />
              </button>
            </div>

            {/* Form */}

            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                {/* Name */}

                <div className="sm:col-span-2">
                  <label className={labelClass}>اسم المستودع *</label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="المستودع الرئيسي"
                    required
                  />
                </div>

                {/* Location */}

                <div>
                  <label className={labelClass}>الموقع</label>

                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="المقر الرئيسي"
                  />
                </div>

                {/* Status */}

                <div>
                  <label className={labelClass}>الحالة</label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>

                {/* Description */}

                <div className="sm:col-span-2">
                  <label className={labelClass}>الوصف</label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className={inputClass}
                    placeholder="وصف مختصر للمستودع..."
                  />
                </div>

                {/* Company */}

                <div className="rounded-md bg-blue-50 p-3 text-[11px] text-blue-700 sm:col-span-2">
                  سيتم ربط هذا المستودع بالشركة الحالية تلقائياً.
                </div>
              </div>

              {/* Footer */}

              <div className="flex justify-end gap-2 border-t p-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? (
                    <FiRefreshCw className="animate-spin" />
                  ) : (
                    <FiSave />
                  )}

                  {saving ? "جارٍ الحفظ..." : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// STAT CARD
// ========================================

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <div className="min-w-0 rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[10px] text-gray-500">{title}</p>

        <div className={`shrink-0 rounded-md p-2 text-sm ${colors[color]}`}>
          {icon}
        </div>
      </div>

      <h3 className="mt-2 break-words text-base font-bold text-gray-800">
        {value}
      </h3>
    </div>
  );
}
