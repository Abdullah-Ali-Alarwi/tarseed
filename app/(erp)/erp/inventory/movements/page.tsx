"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import {
  FiActivity,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiPackage,
  FiFileText,
  FiX,
  FiLayers,
  FiAward,
} from "react-icons/fi";

/* =========================================================
   TYPES
========================================================= */

type MovementType = "transfer_in" | "transfer_out" | string;

interface InventoryMovement {
  id: string | number;
  companyId: string;

  type: MovementType;

  productId: string;
  productName: string;
  productSKU?: string;

  warehouseId: string;
  warehouseName: string;

  quantity: number;

  referenceType?: string;
  referenceId?: string | number;
  referenceNumber?: string;

  date: string;
  notes?: string;
  createdAt?: string;
}

interface Warehouse {
  id: string;
  companyId: string;
  name: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

const movementTypes = [
  { value: "all", label: "جميع الحركات" },
  { value: "transfer_in", label: "تحويل وارد" },
  { value: "transfer_out", label: "تحويل صادر" },
];

/* =========================================================
   HELPERS
========================================================= */

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie
    ? decodeURIComponent(cookie.split("=").slice(1).join("="))
    : null;
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("ar-YE").format(
    Number.isFinite(value) ? value : 0,
  );
};

const formatDate = (date: string) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("ar-YE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (date?: string) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleTimeString("ar-YE");
};

const getMovementLabel = (type: string) => {
  switch (type) {
    case "transfer_in":
      return "تحويل وارد";

    case "transfer_out":
      return "تحويل صادر";

    default:
      return type || "حركة أخرى";
  }
};

const isIncoming = (type: string) => {
  return type === "transfer_in";
};

const getMovementReference = (movement: InventoryMovement) => {
  if (movement.referenceNumber) {
    return movement.referenceNumber;
  }

  if (movement.referenceId) {
    return String(movement.referenceId);
  }

  return "-";
};

/* =========================================================
   PAGE
========================================================= */

export default function InventoryMovementsPage() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [loading, setLoading] = useState(true);

  const [companyId, setCompanyId] = useState("");

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");

  const [selectedMovement, setSelectedMovement] =
    useState<InventoryMovement | null>(null);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadData = async () => {
    try {
      setLoading(true);

      const type = getCookie("type");
      const currentCompanyId = getCookie("companyId");

      // منع مستخدم المنصة من دخول بيانات الشركة
      if (!type || !["owner", "erp", "employee"].includes(type)) {
        setMovements([]);
        setWarehouses([]);

        toast.error("ليس لديك صلاحية الوصول إلى حركات المخزون");
        return;
      }

      if (!currentCompanyId) {
        setMovements([]);
        setWarehouses([]);

        toast.error("لم يتم العثور على الشركة المرتبطة بالمستخدم");
        return;
      }

      setCompanyId(currentCompanyId);

      const [movementsResponse, warehousesResponse] = await Promise.all([
        api.get("/inventoryMovements", {
          params: {
            companyId: currentCompanyId,
          },
        }),

        api.get("/warehouses", {
          params: {
            companyId: currentCompanyId,
          },
        }),
      ]);

      const movementsData = Array.isArray(movementsResponse.data)
        ? movementsResponse.data
        : [];

      const warehousesData = Array.isArray(warehousesResponse.data)
        ? warehousesResponse.data
        : [];

      // حماية إضافية لعزل بيانات الشركات
      const companyMovements = movementsData.filter(
        (item: InventoryMovement) =>
          String(item.companyId) === String(currentCompanyId),
      );

      const companyWarehouses = warehousesData.filter(
        (item: Warehouse) =>
          String(item.companyId) === String(currentCompanyId),
      );

      setMovements(companyMovements);
      setWarehouses(companyWarehouses);
    } catch (error) {
      console.error("Load inventory movements error:", error);

      setMovements([]);
      setWarehouses([]);

      toast.error("حدث خطأ أثناء تحميل حركات المخزون");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        String(movement.productName || "")
          .toLowerCase()
          .includes(searchText) ||
        String(movement.productSKU || "")
          .toLowerCase()
          .includes(searchText) ||
        String(movement.warehouseName || "")
          .toLowerCase()
          .includes(searchText) ||
        String(movement.referenceNumber || "")
          .toLowerCase()
          .includes(searchText) ||
        String(movement.referenceId || "")
          .toLowerCase()
          .includes(searchText) ||
        String(movement.id).toLowerCase().includes(searchText);

      const matchesType =
        selectedType === "all" || movement.type === selectedType;

      const matchesWarehouse =
        selectedWarehouse === "all" ||
        String(movement.warehouseId) === String(selectedWarehouse);

      return matchesSearch && matchesType && matchesWarehouse;
    });
  }, [movements, search, selectedType, selectedWarehouse]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const incomingMovements = movements.filter(
    (movement) => movement.type === "transfer_in",
  );

  const outgoingMovements = movements.filter(
    (movement) => movement.type === "transfer_out",
  );

  const totalIncoming = incomingMovements.reduce(
    (total, movement) => total + Number(movement.quantity || 0),
    0,
  );

  const totalOutgoing = outgoingMovements.reduce(
    (total, movement) => total + Number(movement.quantity || 0),
    0,
  );

  const netMovement = totalIncoming - totalOutgoing;

  /* =========================================================
     RESET FILTERS
  ========================================================= */

  const resetFilters = () => {
    setSearch("");
    setSelectedType("all");
    setSelectedWarehouse("all");
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div dir="rtl" className="m-5 space-y-6 pb-10">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <span>المخزون</span>
            <span>/</span>
            <span className="text-blue-600">حركات المخزون</span>
          </div>

          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
            <FiActivity className="text-blue-600" />
            حركات المخزون
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            متابعة جميع الحركات التي تؤثر على أرصدة المنتجات في المستودعات.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          تحديث البيانات
        </button>
      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Movements */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي الحركات</p>

              <h2 className="mt-3 text-2xl font-bold text-slate-800">
                {formatNumber(movements.length)}
              </h2>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-xl text-blue-600">
              <FiActivity />
            </div>
          </div>
        </div>

        {/* Incoming */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي الكميات الواردة</p>

              <h2 className="mt-3 text-2xl font-bold text-green-600">
                {formatNumber(totalIncoming)}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {formatNumber(incomingMovements.length)} حركة
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-3 text-xl text-green-600">
              <FiArrowDownLeft />
            </div>
          </div>
        </div>

        {/* Outgoing */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي الكميات الصادرة</p>

              <h2 className="mt-3 text-2xl font-bold text-red-600">
                {formatNumber(totalOutgoing)}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {formatNumber(outgoingMovements.length)} حركة
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-3 text-xl text-red-600">
              <FiArrowUpRight />
            </div>
          </div>
        </div>

        {/* Difference */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">صافي حركة التحويلات</p>

              <h2
                className={`mt-3 text-2xl font-bold ${
                  netMovement >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatNumber(netMovement)}
              </h2>
            </div>

            <div className="rounded-xl bg-purple-50 p-3 text-xl text-purple-600">
              <FiLayers />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 font-bold text-slate-700">
          <FiFilter className="text-blue-600" />
          البحث والتصفية
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}

          <div className="relative">
            <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المنتج أو المستودع أو المرجع..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-11 pl-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Movement Type */}

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            {movementTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {/* Warehouse */}

          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">جميع المستودعات</option>

            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            عدد النتائج:
            <span className="mr-1 font-bold text-slate-800">
              {formatNumber(filteredMovements.length)}
            </span>
          </p>

          <button
            onClick={resetFilters}
            className="flex items-center gap-2 text-sm text-slate-500 transition hover:text-red-600"
          >
            <FiX />
            إعادة ضبط الفلاتر
          </button>
        </div>
      </div>

      {/* =====================================================
          MOVEMENTS TABLE
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-800">سجل حركات المخزون</h2>

            <p className="mt-1 text-xs text-slate-400">
              سجل العمليات المسجلة على مخزون الشركة
            </p>
          </div>

          <FiFileText className="text-xl text-slate-400" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FiRefreshCw className="mb-3 animate-spin text-3xl text-blue-600" />

            <p className="text-sm text-slate-500">جاري تحميل الحركات...</p>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 rounded-full bg-slate-100 p-5 text-3xl text-slate-400">
              <FiPackage />
            </div>

            <h3 className="font-bold text-slate-700">لا توجد حركات مخزون</h3>

            <p className="mt-2 text-sm text-slate-400">
              لم يتم العثور على حركات مطابقة للبحث.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-right">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">رقم الحركة</th>

                  <th className="px-5 py-4 font-semibold">نوع الحركة</th>

                  <th className="px-5 py-4 font-semibold">المنتج</th>

                  <th className="px-5 py-4 font-semibold">المستودع</th>

                  <th className="px-5 py-4 font-semibold">الكمية</th>

                  <th className="px-5 py-4 font-semibold">المرجع</th>

                  <th className="px-5 py-4 font-semibold">التاريخ</th>

                  <th className="px-5 py-4 font-semibold">التفاصيل</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map((movement) => (
                  <tr
                    key={movement.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-sm font-medium text-slate-700">
                      #{movement.id}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                          isIncoming(movement.type)
                            ? "bg-green-50 text-green-700"
                            : movement.type === "transfer_out"
                              ? "bg-red-50 text-red-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isIncoming(movement.type) ? (
                          <FiArrowDownLeft />
                        ) : movement.type === "transfer_out" ? (
                          <FiArrowUpRight />
                        ) : (
                          <FiActivity />
                        )}

                        {getMovementLabel(movement.type)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {movement.productName || "-"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {movement.productSKU || "-"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <FiAward className="text-slate-400" />
                        {movement.warehouseName || "-"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-sm font-bold ${
                          isIncoming(movement.type)
                            ? "text-green-600"
                            : movement.type === "transfer_out"
                              ? "text-red-600"
                              : "text-slate-700"
                        }`}
                      >
                        {isIncoming(movement.type)
                          ? "+"
                          : movement.type === "transfer_out"
                            ? "-"
                            : ""}

                        {formatNumber(Number(movement.quantity))}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {getMovementReference(movement)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(movement.date)}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelectedMovement(movement)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
                      >
                        عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {selectedMovement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedMovement(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="font-bold text-slate-800">
                  تفاصيل حركة المخزون
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  رقم الحركة: #{selectedMovement.id}
                </p>
              </div>

              <button
                onClick={() => setSelectedMovement(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Body */}

            <div className="space-y-5 p-6">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="mb-2 text-xs text-slate-500">نوع الحركة</p>

                <h3 className="font-bold text-slate-800">
                  {getMovementLabel(selectedMovement.type)}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-2 text-xs text-slate-400">اسم المنتج</p>

                  <p className="font-semibold text-slate-700">
                    {selectedMovement.productName || "-"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-slate-400">رمز المنتج</p>

                  <p className="font-semibold text-slate-700">
                    {selectedMovement.productSKU || "-"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-slate-400">المستودع</p>

                  <p className="font-semibold text-slate-700">
                    {selectedMovement.warehouseName || "-"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-slate-400">الكمية</p>

                  <p className="font-bold text-blue-600">
                    {formatNumber(Number(selectedMovement.quantity))}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-slate-400">نوع المرجع</p>

                  <p className="font-semibold text-slate-700">
                    {selectedMovement.referenceType || "-"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-slate-400">رقم المرجع</p>

                  <p className="font-semibold text-slate-700">
                    {getMovementReference(selectedMovement)}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-slate-400">التاريخ</p>

                  <p className="font-semibold text-slate-700">
                    {formatDate(selectedMovement.date)}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-slate-400">وقت التسجيل</p>

                  <p className="font-semibold text-slate-700">
                    {formatTime(selectedMovement.createdAt)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-4">
                <p className="mb-2 text-xs text-slate-400">ملاحظات</p>

                <p className="text-sm text-slate-600">
                  {selectedMovement.notes || "لا توجد ملاحظات"}
                </p>
              </div>
            </div>

            {/* Modal Footer */}

            <div className="border-t border-slate-100 p-4">
              <button
                onClick={() => setSelectedMovement(null)}
                className="w-full rounded-xl bg-slate-800 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
