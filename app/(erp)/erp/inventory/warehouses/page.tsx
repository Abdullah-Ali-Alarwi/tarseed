"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { getUserByUsername } from "@/lib/api/users";

import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiX,
  FiSave,
  FiMapPin,
  FiPackage,
  FiStar,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowUpRight,
} from "react-icons/fi";
import {
  IoCaretForwardCircle,
  IoFlowerSharp,
  IoPlayForwardCircleSharp,
} from "react-icons/io5";
import { ImFileWord, ImForward } from "react-icons/im";

// ============================================
// Types
// ============================================

interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  code: string;
  location?: string | null;
  description?: string | null;
  isDefault?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface WarehouseStock {
  id: string;
  companyId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  productName?: string;
}

interface WarehouseForm {
  name: string;
  code: string;
  location: string;
  description: string;
  isDefault: boolean;
  status: string;
}

interface WarehouseSummary {
  productsCount: number;
  totalQuantity: number;
}

// ============================================
// Constants
// ============================================

const EMPTY_FORM: WarehouseForm = {
  name: "",
  code: "",
  location: "",
  description: "",
  isDefault: false,
  status: "active",
};

// ============================================
// Helpers
// ============================================

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ar-YE").format(value);
}

function formatDate(value?: string): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }

  return "حدث خطأ غير متوقع";
}

// ============================================
// Component
// ============================================

export default function WarehousesPage() {
  // ------------------------------------------
  // States
  // ------------------------------------------

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WarehouseForm>(EMPTY_FORM);

  // ------------------------------------------
  // Load Warehouses
  // ------------------------------------------

  const loadWarehouses = useCallback(async (currentCompanyId: string) => {
    try {
      setLoading(true);

      const [warehousesResponse, stocksResponse] = await Promise.all([
        supabase
          .from("warehouses")
          .select("*")
          .eq("companyId", currentCompanyId)
          .order("createdAt", { ascending: false }),

        supabase
          .from("warehouseStocks")
          .select("*")
          .eq("companyId", currentCompanyId),
      ]);

      if (warehousesResponse.error) {
        throw warehousesResponse.error;
      }

      if (stocksResponse.error) {
        throw stocksResponse.error;
      }

      setWarehouses((warehousesResponse.data ?? []) as Warehouse[]);
      setStocks((stocksResponse.data ?? []) as WarehouseStock[]);
    } catch (error) {
      console.error("Load warehouses error:", error);
      toast.error("تعذر تحميل بيانات المستودعات");
    } finally {
      setLoading(false);
    }
  }, []);

  // ------------------------------------------
  // Initialize
  // ------------------------------------------

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const type = getCookie("type");
        const username = getCookie("username");

        if (!username || type === "platform") {
          toast.error("ليس لديك صلاحية الوصول إلى هذه الصفحة");
          setLoading(false);
          return;
        }

        const userResult = await getUserByUsername(username);

        const user = Array.isArray(userResult) ? userResult[0] : userResult;

        if (!user) {
          toast.error("تعذر العثور على بيانات المستخدم");
          setLoading(false);
          return;
        }

        if (
          user.isActive === false ||
          user.status === "inactive" ||
          user.status === "غير نشط"
        ) {
          toast.error("حساب المستخدم غير نشط");
          setLoading(false);
          return;
        }

        if (user.type === "platform") {
          toast.error("لا يمكن لمستخدم المنصة الوصول إلى هذه الصفحة");
          setLoading(false);
          return;
        }

        if (!user.companyId) {
          toast.error("المستخدم غير مرتبط بشركة");
          setLoading(false);
          return;
        }

        if (!mounted) return;

        setCompanyId(String(user.companyId));

        await loadWarehouses(String(user.companyId));
      } catch (error) {
        console.error("Initialize warehouses error:", error);
        toast.error("حدث خطأ أثناء التحقق من المستخدم");
        setLoading(false);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [loadWarehouses]);

  // ------------------------------------------
  // Warehouse Summary
  // ------------------------------------------

  const getWarehouseSummary = (warehouseId: string): WarehouseSummary => {
    const warehouseStocks = stocks.filter(
      (stock) => String(stock.warehouseId) === String(warehouseId),
    );

    const productsCount = new Set(
      warehouseStocks.map((stock) => stock.productId),
    ).size;

    const totalQuantity = warehouseStocks.reduce(
      (total, stock) => total + Number(stock.quantity || 0),
      0,
    );

    return {
      productsCount,
      totalQuantity,
    };
  };

  // ------------------------------------------
  // Statistics
  // ------------------------------------------

  const statistics = useMemo(() => {
    const activeWarehouses = warehouses.filter(
      (warehouse) => warehouse.status === "active",
    ).length;

    const inactiveWarehouses = warehouses.filter(
      (warehouse) => warehouse.status !== "active",
    ).length;

    const defaultWarehouse = warehouses.find(
      (warehouse) => warehouse.isDefault,
    );

    const totalQuantity = stocks.reduce(
      (total, stock) => total + Number(stock.quantity || 0),
      0,
    );

    const totalProducts = new Set(stocks.map((stock) => stock.productId)).size;

    return {
      total: warehouses.length,
      active: activeWarehouses,
      inactive: inactiveWarehouses,
      defaultWarehouse,
      totalQuantity,
      totalProducts,
    };
  }, [warehouses, stocks]);

  // ------------------------------------------
  // Filter
  // ------------------------------------------

  const filteredWarehouses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return warehouses.filter((warehouse) => {
      const matchesSearch =
        !normalizedSearch ||
        warehouse.name.toLowerCase().includes(normalizedSearch) ||
        warehouse.code.toLowerCase().includes(normalizedSearch) ||
        (warehouse.location || "").toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && warehouse.status === "active") ||
        (statusFilter === "inactive" && warehouse.status !== "active");

      return matchesSearch && matchesStatus;
    });
  }, [warehouses, search, statusFilter]);

  // ------------------------------------------
  // Open Create Form
  // ------------------------------------------

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  // ------------------------------------------
  // Open Edit Form
  // ------------------------------------------

  const openEditForm = (warehouse: Warehouse) => {
    setEditingId(warehouse.id);

    setForm({
      name: warehouse.name || "",
      code: warehouse.code || "",
      location: warehouse.location || "",
      description: warehouse.description || "",
      isDefault: Boolean(warehouse.isDefault),
      status: warehouse.status || "active",
    });

    setShowForm(true);
  };

  // ------------------------------------------
  // Handle Form Changes
  // ------------------------------------------

  const handleFormChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = event.target;

    if (type === "checkbox") {
      const checked = (event.target as HTMLInputElement).checked;

      setForm((previous) => ({
        ...previous,
        [name]: checked,
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ------------------------------------------
  // Save Warehouse
  // ------------------------------------------

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!companyId) {
      toast.error("تعذر تحديد الشركة");
      return;
    }

    const name = form.name.trim();

    if (!name) {
      toast.error("أدخل اسم المستودع");
      return;
    }

    try {
      setSaving(true);

      const now = new Date().toISOString();

      // --------------------------------------
      // Generate Warehouse Code Automatically
      // --------------------------------------

      let warehouseCode = form.code.trim();

      if (!editingId) {
        const { data: existingWarehouses, error: warehousesError } =
          await supabase
            .from("warehouses")
            .select("code")
            .eq("companyId", companyId);

        if (warehousesError) throw warehousesError;

        const warehouseNumber = (existingWarehouses?.length || 0) + 1;

        warehouseCode = `WH-${String(warehouseNumber).padStart(3, "0")}`;

        // التأكد من عدم تكرار الرمز
        const { data: duplicated, error: duplicateError } = await supabase
          .from("warehouses")
          .select("id")
          .eq("companyId", companyId)
          .eq("code", warehouseCode)
          .maybeSingle();

        if (duplicateError) throw duplicateError;

        if (duplicated) {
          throw new Error(
            `رمز المستودع ${warehouseCode} مستخدم مسبقاً. أعد تحميل الصفحة وحاول مرة أخرى.`,
          );
        }
      }

      const payload = {
        companyId,
        name,
        code: warehouseCode,
        location: form.location.trim(),
        description: form.description.trim(),
        isDefault: form.isDefault,
        status: form.status,
      };

      // --------------------------------------
      // If Default Warehouse
      // --------------------------------------

      if (form.isDefault) {
        const otherDefaults = warehouses.filter(
          (warehouse) =>
            warehouse.isDefault && String(warehouse.id) !== String(editingId),
        );

        for (const warehouse of otherDefaults) {
          const { data, error } = await supabase
            .from("warehouses")
            .update({
              isDefault: false,
              updatedAt: now,
            })
            .eq("id", warehouse.id)
            .eq("companyId", companyId)
            .select("id")
            .maybeSingle();

          if (error) throw error;

          if (!data) {
            throw new Error(
              `تعذر تحديث المستودع الافتراضي السابق: ${warehouse.name}`,
            );
          }
        }
      }

      // --------------------------------------
      // Update
      // --------------------------------------

      if (editingId) {
        const { data, error } = await supabase
          .from("warehouses")
          .update({
            ...payload,
            code: form.code.trim(),
            updatedAt: now,
          })
          .eq("id", editingId)
          .eq("companyId", companyId)
          .select("*")
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          throw new Error(
            "لم يتم تحديث المستودع. تحقق من صلاحيات التعديل وسياسات RLS.",
          );
        }

        toast.success("تم تحديث المستودع بنجاح");
      } else {
        // --------------------------------------
        // Create
        // --------------------------------------

        const { data, error } = await supabase
          .from("warehouses")
          .insert({
            id: crypto.randomUUID(),
            ...payload,
            createdAt: now,
            updatedAt: now,
          })
          .select("*")
          .single();

        if (error) throw error;

        if (!data) {
          throw new Error("لم يتم إنشاء المستودع");
        }

        toast.success(`تمت إضافة المستودع بنجاح بالرمز ${warehouseCode}`);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);

      await loadWarehouses(companyId);
    } catch (error) {
      console.error("Save warehouse error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------
  // Delete Warehouse
  // ------------------------------------------

  const handleDelete = async (warehouse: Warehouse) => {
    if (!companyId) return;

    const relatedStocks = stocks.filter(
      (stock) => String(stock.warehouseId) === String(warehouse.id),
    );

    if (relatedStocks.length > 0) {
      toast.error("لا يمكن حذف المستودع لوجود سجلات مخزون مرتبطة به");
      return;
    }

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف المستودع "${warehouse.name}"؟`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(warehouse.id);

      const { data, error } = await supabase
        .from("warehouses")
        .delete()
        .eq("id", warehouse.id)
        .eq("companyId", companyId)
        .select("id")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "لم يتم حذف المستودع. تحقق من صلاحيات الحذف وسياسات RLS.",
        );
      }

      toast.success("تم حذف المستودع بنجاح");

      await loadWarehouses(companyId);
    } catch (error) {
      console.error("Delete warehouse error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  // ------------------------------------------
  // Refresh
  // ------------------------------------------

  const handleRefresh = async () => {
    if (!companyId) return;

    await loadWarehouses(companyId);
    toast.success("تم تحديث البيانات");
  };

  // ============================================
  // Loading
  // ============================================

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <FiRefreshCw
            className="mx-auto animate-spin text-blue-600"
            size={32}
          />

          <p className="mt-4 text-sm text-slate-500">
            جاري تحميل المستودعات...
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // UI
  // ============================================

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* ====================================== */}
      {/* Header */}
      {/* ====================================== */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <IoPlayForwardCircleSharp size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                إدارة المستودعات
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                إدارة مستودعات الشركة ومتابعة أرصدتها
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <FiRefreshCw size={16} />
            تحديث
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <FiPlus size={18} />
            إضافة مستودع
          </button>
        </div>
      </div>

      {/* ====================================== */}
      {/* Statistics */}
      {/* ====================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Warehouses */}

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي المستودعات</p>

              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {formatNumber(statistics.total)}
              </h3>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <ImForward size={22} />
            </div>
          </div>
        </div>

        {/* Active Warehouses */}

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">المستودعات النشطة</p>

              <h3 className="mt-2 text-2xl font-bold text-green-600">
                {formatNumber(statistics.active)}
              </h3>
            </div>

            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <FiCheckCircle size={22} />
            </div>
          </div>
        </div>

        {/* Products */}

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">الأصناف المخزنة</p>

              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {formatNumber(statistics.totalProducts)}
              </h3>
            </div>

            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <FiPackage size={22} />
            </div>
          </div>
        </div>

        {/* Total Quantity */}

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي الكميات</p>

              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {formatNumber(statistics.totalQuantity)}
              </h3>
            </div>

            <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
              <FiPackage size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* ====================================== */}
      {/* Default Warehouse */}
      {/* ====================================== */}

      {statistics.defaultWarehouse && (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
              <FiStar size={20} />
            </div>

            <div>
              <p className="text-xs font-medium text-amber-700">
                المستودع الافتراضي
              </p>

              <p className="mt-1 font-bold text-slate-800">
                {statistics.defaultWarehouse.name}
              </p>
            </div>
          </div>

          <Link
            href={`/erp/inventory/warehouses/${statistics.defaultWarehouse.id}`}
            className="flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-900"
          >
            عرض المستودع
            <FiArrowUpRight size={16} />
          </Link>
        </div>
      )}

      {/* ====================================== */}
      {/* Filters */}
      {/* ====================================== */}

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <FiSearch
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم المستودع أو الرمز أو الموقع..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-11 pl-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>

            <span className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
              {formatNumber(filteredWarehouses.length)} مستودع
            </span>
          </div>
        </div>
      </div>

      {/* ====================================== */}
      {/* Warehouses Table */}
      {/* ====================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-800">قائمة المستودعات</h2>

            <p className="mt-1 text-xs text-slate-500">
              جميع المستودعات المسجلة في الشركة
            </p>
          </div>

          <IoFlowerSharp className="text-slate-400" size={22} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-right">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">المستودع</th>

                <th className="px-5 py-4 font-semibold">الرمز</th>

                <th className="px-5 py-4 font-semibold">الموقع</th>

                <th className="px-5 py-4 font-semibold">عدد الأصناف</th>

                <th className="px-5 py-4 font-semibold">إجمالي الكمية</th>

                <th className="px-5 py-4 font-semibold">الحالة</th>

                <th className="px-5 py-4 font-semibold">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredWarehouses.map((warehouse) => {
                const summary = getWarehouseSummary(warehouse.id);

                const isActive = warehouse.status === "active";

                return (
                  <tr
                    key={warehouse.id}
                    className="transition hover:bg-slate-50"
                  >
                    {/* Name */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <IoCaretForwardCircle size={19} />
                        </div>

                        <div>
                          <Link
                            href={`/erp/inventory/warehouses/${warehouse.id}`}
                            className="font-semibold text-slate-800 transition hover:text-blue-600"
                          >
                            {warehouse.name}
                          </Link>

                          {warehouse.isDefault && (
                            <span className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                              <FiStar size={12} />
                              افتراضي
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Code */}

                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs text-slate-700">
                        {warehouse.code || "-"}
                      </span>
                    </td>

                    {/* Location */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <FiMapPin
                          className="shrink-0 text-slate-400"
                          size={15}
                        />
                        {warehouse.location || "-"}
                      </div>
                    </td>

                    {/* Products */}

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {formatNumber(summary.productsCount)}
                    </td>

                    {/* Quantity */}

                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                      {formatNumber(summary.totalQuantity)}
                    </td>

                    {/* Status */}

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                          isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive ? "bg-green-500" : "bg-red-500"
                          }`}
                        />

                        {isActive ? "نشط" : "غير نشط"}
                      </span>
                    </td>

                    {/* Actions */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/erp/inventory/warehouses/${warehouse.id}`}
                          title="عرض التفاصيل"
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                        >
                          <FiArrowUpRight size={16} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => openEditForm(warehouse)}
                          title="تعديل"
                          className="rounded-lg bg-amber-50 p-2 text-amber-600 transition hover:bg-amber-100"
                        >
                          <FiEdit2 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(warehouse)}
                          disabled={deletingId === warehouse.id}
                          title="حذف"
                          className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === warehouse.id ? (
                            <FiRefreshCw className="animate-spin" size={16} />
                          ) : (
                            <FiTrash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Empty State */}

              {filteredWarehouses.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <ImFileWord size={26} />
                    </div>

                    <h3 className="mt-4 font-semibold text-slate-700">
                      {search || statusFilter !== "all"
                        ? "لا توجد نتائج مطابقة"
                        : "لا توجد مستودعات حتى الآن"}
                    </h3>

                    <p className="mt-2 text-sm text-slate-400">
                      {search || statusFilter !== "all"
                        ? "جرّب تغيير كلمات البحث أو الفلاتر"
                        : "ابدأ بإضافة أول مستودع لشركتك"}
                    </p>

                    {!search && statusFilter === "all" && (
                      <button
                        type="button"
                        onClick={openCreateForm}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        <FiPlus size={17} />
                        إضافة مستودع
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}

        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <p className="text-xs text-slate-500">
            عرض {formatNumber(filteredWarehouses.length)} من أصل{" "}
            {formatNumber(warehouses.length)} مستودع
          </p>
        </div>
      </div>

      {/* ====================================== */}
      {/* Create / Edit Modal */}
      {/* ====================================== */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  {editingId ? <FiEdit2 size={20} /> : <FiPlus size={20} />}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingId ? "تعديل المستودع" : "إضافة مستودع جديد"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    أدخل بيانات المستودع الأساسية
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Form */}

            <form onSubmit={handleSave}>
              <div className="space-y-5 p-5">
                {/* Name */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    اسم المستودع
                    <span className="mr-1 text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="مثال: المستودع الرئيسي"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Code and Location */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      رمز المستودع
                      <span className="mr-1 text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      name="code"
                      value={form.code}
                      onChange={handleFormChange}
                      placeholder="WH-001"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      الموقع
                    </label>

                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleFormChange}
                      placeholder="مثال: صنعاء - شارع..."
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Description */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    الوصف
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows={3}
                    placeholder="ملاحظات أو تفاصيل إضافية عن المستودع..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Status */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    الحالة
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>

                {/* Default Warehouse */}

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={form.isDefault}
                    onChange={handleFormChange}
                    className="mt-1 h-4 w-4 accent-amber-500"
                  />

                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <FiStar className="text-amber-500" size={16} />
                      تعيين كمستودع افتراضي
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      سيتم إلغاء تعيين المستودع الافتراضي السابق عند الحفظ.
                    </p>
                  </div>
                </label>
              </div>

              {/* Modal Footer */}

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <FiRefreshCw className="animate-spin" size={17} />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <FiSave size={17} />
                      {editingId ? "حفظ التعديلات" : "إضافة المستودع"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
