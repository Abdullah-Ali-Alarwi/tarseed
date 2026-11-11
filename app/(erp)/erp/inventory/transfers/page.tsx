"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiX,
  FiSave,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiPackage,
  FiRefreshCw,
  FiFilter,
  FiEye,
  FiAlertCircle,
  FiArrowLeftCircle,
} from "react-icons/fi";
import { toast } from "sonner";
import { FaWarehouse } from "react-icons/fa";

/* =========================================================
   API
========================================================= */

const API = axios.create({
  baseURL: "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================================
   TYPES
========================================================= */

type TransferStatus = "pending" | "completed" | "cancelled";

type MovementType = "transfer_in" | "transfer_out";

interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  status?: "active" | "inactive";
}

interface Product {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  unitName?: string;
  warehouseId?: string;
  currentStock?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  trackInventory?: boolean;
  status?: "active" | "inactive";
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
  productId: string;
  productName: string;
  productSKU: string;
  warehouseId: string;
  warehouseName: string;
  type: MovementType;
  quantity: number;
  referenceType: "transfer";
  referenceId: string;
  referenceNumber: string;
  date: string;
  notes?: string;
  createdAt: string;
}

interface Transfer {
  id: string;
  companyId: string;
  transferNumber: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  productId: string;
  productName: string;
  productSKU: string;
  quantity: number;
  unitName: string;
  date: string;
  notes: string;
  status: TransferStatus;
  createdAt: string;
}

interface TransferForm {
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  quantity: string;
  date: string;
  notes: string;
}

/* =========================================================
   HELPERS
========================================================= */

const today = () => new Date().toISOString().slice(0, 10);

const number = (value: unknown) => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(value);

const emptyForm: TransferForm = {
  fromWarehouseId: "",
  toWarehouseId: "",
  productId: "",
  quantity: "",
  date: today(),
  notes: "",
};

/* =========================================================
   COMPONENT
========================================================= */

export default function TransfersPage() {
  /* =========================
     STATE
  ========================= */

  const [companyId, setCompanyId] = useState("");

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStock[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);

  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(
    null,
  );

  const [form, setForm] = useState<TransferForm>(emptyForm);

  const [availableStock, setAvailableStock] = useState(0);
  const [checkingStock, setCheckingStock] = useState(false);

  /* =========================
     INITIALIZATION
  ========================= */

  const loadData = useCallback(async (currentCompanyId: string) => {
    setLoading(true);

    try {
      const requests = [
        { name: "transfers", url: "/transfers" },
        { name: "warehouses", url: "/warehouses" },
        { name: "products", url: "/products" },
        { name: "warehouseStocks", url: "/warehouseStocks" },
      ];

      const results = await Promise.all(
        requests.map(async (request) => {
          try {
            const response = await API.get(request.url, {
              params: { companyId: currentCompanyId },
            });

            return {
              name: request.name,
              data: response.data,
              error: null,
            };
          } catch (error) {
            console.error(`Failed loading ${request.name}:`, error);

            return {
              name: request.name,
              data: [],
              error,
            };
          }
        }),
      );

      const failed = results.filter((item) => item.error);

      if (failed.length) {
        failed.forEach((item) => {
          console.error(`Collection error: ${item.name}`);
        });

        toast.error(
          `تعذر تحميل بعض البيانات: ${failed
            .map((item) => item.name)
            .join("، ")}`,
        );
      }

      const getData = (name: string) =>
        results.find((item) => item.name === name)?.data || [];

      setTransfers(
        getData("transfers").filter(
          (item: Transfer) => item.companyId === currentCompanyId,
        ),
      );

      setWarehouses(
        getData("warehouses").filter(
          (item: Warehouse) =>
            item.companyId === currentCompanyId && item.status !== "inactive",
        ),
      );

      setProducts(
        getData("products").filter(
          (item: Product) =>
            item.companyId === currentCompanyId &&
            item.status !== "inactive" &&
            item.trackInventory !== false,
        ),
      );

      setWarehouseStocks(
        getData("warehouseStocks").filter(
          (item: WarehouseStock) => item.companyId === currentCompanyId,
        ),
      );
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        const type = document.cookie
          .split("; ")
          .find((item) => item.startsWith("type="))
          ?.split("=")[1];

        const storedCompanyId = document.cookie
          .split("; ")
          .find((item) => item.startsWith("companyId="))
          ?.split("=")[1];

        if (!type || !["owner", "erp"].includes(type)) {
          toast.error("ليس لديك صلاحية الوصول إلى هذه الصفحة");
          setLoading(false);
          return;
        }

        if (!storedCompanyId) {
          toast.error("لم يتم العثور على الشركة المرتبطة بالمستخدم");
          setLoading(false);
          return;
        }

        setCompanyId(storedCompanyId);
        await loadData(storedCompanyId);
      } catch (error) {
        console.error(error);
        toast.error("حدث خطأ أثناء التهيئة");
        setLoading(false);
      }
    };

    initialize();
  }, [loadData]);

  /* =========================================================
     WAREHOUSE STOCK
  ========================================================= */

  /**
   * warehouseStocks هو المصدر الأساسي للرصيد الحالي.
   *
   * إذا لم يوجد سجل للمنتج في المستودع:
   * نستخدم currentStock فقط للمستودع الافتتاحي
   * المحدد في products.warehouseId.
   */

  const getAvailableStock = useCallback(
    (productId: string, warehouseId: string) => {
      const stockRecord = warehouseStocks.find(
        (item) =>
          item.productId === productId &&
          item.warehouseId === warehouseId &&
          item.companyId === companyId,
      );

      if (stockRecord) {
        return number(stockRecord.quantity);
      }

      const product = products.find((item) => item.id === productId);

      if (product && product.warehouseId === warehouseId) {
        return number(product.currentStock);
      }

      return 0;
    },
    [warehouseStocks, products, companyId],
  );

  /* =========================
     STOCK CHECK
  ========================= */

  useEffect(() => {
    const check = async () => {
      if (!form.productId || !form.fromWarehouseId) {
        setAvailableStock(0);
        return;
      }

      setCheckingStock(true);

      try {
        const quantity = getAvailableStock(
          form.productId,
          form.fromWarehouseId,
        );

        setAvailableStock(quantity);
      } finally {
        setCheckingStock(false);
      }
    };

    check();
  }, [form.productId, form.fromWarehouseId, getAvailableStock]);

  /* =========================================================
     TRANSFER NUMBER
  ========================================================= */

  const generateTransferNumber = () => {
    const numbers = transfers
      .map((item) => {
        const match = item.transferNumber?.match(/TRF-(\d+)/);
        return match ? Number(match[1]) : 0;
      })
      .filter((item) => Number.isFinite(item));

    const next = Math.max(0, ...numbers) + 1;

    return `TRF-${String(next).padStart(4, "0")}`;
  };

  /* =========================================================
     MODAL
  ========================================================= */

  const openAddModal = () => {
    setEditingTransfer(null);

    setForm({
      ...emptyForm,
      date: today(),
    });

    setShowModal(true);
  };

  const openEditModal = (transfer: Transfer) => {
    if (transfer.status !== "pending") {
      toast.error("يمكن تعديل التحويلات المعلقة فقط");
      return;
    }

    setEditingTransfer(transfer);

    setForm({
      fromWarehouseId: transfer.fromWarehouseId,
      toWarehouseId: transfer.toWarehouseId,
      productId: transfer.productId,
      quantity: String(transfer.quantity),
      date: transfer.date,
      notes: transfer.notes || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTransfer(null);
    setForm(emptyForm);
  };

  /* =========================================================
     FORM VALIDATION
  ========================================================= */

  const validateForm = () => {
    if (!form.fromWarehouseId || !form.toWarehouseId) {
      toast.error("يرجى تحديد المستودع المرسل والمستقبل");
      return false;
    }

    if (form.fromWarehouseId === form.toWarehouseId) {
      toast.error("لا يمكن التحويل إلى نفس المستودع");
      return false;
    }

    if (!form.productId) {
      toast.error("يرجى اختيار المنتج");
      return false;
    }

    const quantity = number(form.quantity);

    if (quantity <= 0) {
      toast.error("يجب أن تكون الكمية أكبر من صفر");
      return false;
    }

    if (!form.date) {
      toast.error("يرجى تحديد تاريخ التحويل");
      return false;
    }

    const fromWarehouse = warehouses.find(
      (item) => item.id === form.fromWarehouseId,
    );

    const toWarehouse = warehouses.find(
      (item) => item.id === form.toWarehouseId,
    );

    const product = products.find((item) => item.id === form.productId);

    if (!fromWarehouse || !toWarehouse || !product) {
      toast.error("بيانات التحويل غير صحيحة");
      return false;
    }

    if (
      number(form.quantity) > getAvailableStock(product.id, fromWarehouse.id)
    ) {
      toast.error("الكمية المطلوبة أكبر من الرصيد المتاح");
      return false;
    }

    return true;
  };

  /* =========================================================
     CREATE / UPDATE TRANSFER
  ========================================================= */

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      const product = products.find((item) => item.id === form.productId)!;

      const fromWarehouse = warehouses.find(
        (item) => item.id === form.fromWarehouseId,
      )!;

      const toWarehouse = warehouses.find(
        (item) => item.id === form.toWarehouseId,
      )!;

      const quantity = number(form.quantity);

      const payload = {
        companyId,

        transferNumber:
          editingTransfer?.transferNumber || generateTransferNumber(),

        fromWarehouseId: fromWarehouse.id,
        fromWarehouseName: fromWarehouse.name,

        toWarehouseId: toWarehouse.id,
        toWarehouseName: toWarehouse.name,

        productId: product.id,
        productName: product.name,
        productSKU: product.sku,

        quantity,
        unitName: product.unitName || "وحدة",

        date: form.date,
        notes: form.notes.trim(),

        status: "pending" as TransferStatus,

        createdAt: editingTransfer?.createdAt || new Date().toISOString(),
      };

      if (editingTransfer) {
        await API.patch(`/transfers/${editingTransfer.id}`, payload);

        toast.success("تم تحديث التحويل بنجاح");
      } else {
        await API.post("/transfers", payload);

        toast.success("تم إنشاء طلب التحويل بنجاح");
      }

      closeModal();
      await loadData(companyId);
    } catch (error) {
      console.error(error);
      toast.error("تعذر حفظ التحويل");
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     WAREHOUSE STOCK RECORD HELPERS
  ========================================================= */

  const findStockRecord = async (productId: string, warehouseId: string) => {
    const response = await API.get("/warehouseStocks", {
      params: {
        companyId,
        productId,
        warehouseId,
      },
    });

    const records = response.data.filter(
      (item: WarehouseStock) =>
        item.companyId === companyId &&
        item.productId === productId &&
        item.warehouseId === warehouseId,
    );

    return records[0] as WarehouseStock | undefined;
  };

  /**
   * تحديث رصيد مستودع معين.
   *
   * إذا لم يوجد سجل:
   * يتم إنشاؤه بالكمية الجديدة.
   */

  const setWarehouseStock = async (
    productId: string,
    warehouseId: string,
    newQuantity: number,
  ) => {
    if (newQuantity < 0) {
      throw new Error("لا يمكن أن يكون رصيد المستودع سالبًا");
    }

    const existing = await findStockRecord(productId, warehouseId);

    const payload = {
      companyId,
      productId,
      warehouseId,
      quantity: Number(newQuantity.toFixed(3)),
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      await API.patch(`/warehouseStocks/${existing.id}`, payload);

      return {
        action: "updated" as const,
        id: existing.id,
        oldQuantity: number(existing.quantity),
      };
    }

    const response = await API.post("/warehouseStocks", payload);

    return {
      action: "created" as const,
      id: response.data.id,
      oldQuantity: 0,
    };
  };

  const rollbackWarehouseStock = async (record: {
    action: "updated" | "created";
    id: string;
    oldQuantity: number;
  }) => {
    if (record.action === "updated") {
      await API.patch(`/warehouseStocks/${record.id}`, {
        quantity: record.oldQuantity,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await API.delete(`/warehouseStocks/${record.id}`);
    }
  };

  /* =========================================================
     INVENTORY MOVEMENTS
  ========================================================= */

  const createMovement = async (
    transfer: Transfer,
    type: MovementType,
    warehouseId: string,
    warehouseName: string,
  ) => {
    const payload = {
      companyId,

      productId: transfer.productId,
      productName: transfer.productName,
      productSKU: transfer.productSKU,

      warehouseId,
      warehouseName,

      type,
      quantity: transfer.quantity,

      referenceType: "transfer" as const,
      referenceId: String(transfer.id),
      referenceNumber: transfer.transferNumber,

      date: transfer.date,
      notes: transfer.notes || "",

      createdAt: new Date().toISOString(),
    };

    const response = await API.post("/inventoryMovements", payload);

    return response.data.id as string;
  };

  /* =========================================================
     COMPLETE TRANSFER
  ========================================================= */

  const completeTransfer = async (transfer: Transfer) => {
    if (transfer.status !== "pending") {
      toast.error("هذا التحويل ليس معلقًا");
      return;
    }

    if (transfer.fromWarehouseId === transfer.toWarehouseId) {
      toast.error("المستودع المرسل والمستقبل متطابقان");
      return;
    }

    setSaving(true);

    let sourceChange: {
      action: "updated" | "created";
      id: string;
      oldQuantity: number;
    } | null = null;

    let destinationChange: {
      action: "updated" | "created";
      id: string;
      oldQuantity: number;
    } | null = null;

    const movementIds: string[] = [];

    try {
      // إعادة تحميل سجلات الرصيد قبل الاعتماد
      const [sourceStock, destinationStock] = await Promise.all([
        findStockRecord(transfer.productId, transfer.fromWarehouseId),

        findStockRecord(transfer.productId, transfer.toWarehouseId),
      ]);

      const product = products.find((item) => item.id === transfer.productId);

      if (!product) {
        throw new Error("لم يتم العثور على المنتج");
      }

      // رصيد المصدر الحالي
      const sourceQuantity = sourceStock
        ? number(sourceStock.quantity)
        : product.warehouseId === transfer.fromWarehouseId
          ? number(product.currentStock)
          : 0;

      // رصيد الوجهة الحالي
      const destinationQuantity = destinationStock
        ? number(destinationStock.quantity)
        : product.warehouseId === transfer.toWarehouseId
          ? number(product.currentStock)
          : 0;

      const transferQuantity = number(transfer.quantity);

      if (transferQuantity <= 0) {
        throw new Error("كمية التحويل غير صحيحة");
      }

      if (sourceQuantity < transferQuantity) {
        throw new Error(
          `الرصيد غير كافٍ. الرصيد المتاح: ${formatNumber(sourceQuantity)}`,
        );
      }

      const newSourceQuantity = Number(
        (sourceQuantity - transferQuantity).toFixed(3),
      );

      const newDestinationQuantity = Number(
        (destinationQuantity + transferQuantity).toFixed(3),
      );

      // 1. خصم الكمية من المستودع المرسل
      sourceChange = await setWarehouseStock(
        transfer.productId,
        transfer.fromWarehouseId,
        newSourceQuantity,
      );

      // 2. إضافة الكمية إلى المستودع المستقبل
      destinationChange = await setWarehouseStock(
        transfer.productId,
        transfer.toWarehouseId,
        newDestinationQuantity,
      );

      // 3. تسجيل حركة خروج
      const sourceMovementId = await createMovement(
        transfer,
        "transfer_out",
        transfer.fromWarehouseId,
        transfer.fromWarehouseName,
      );

      movementIds.push(sourceMovementId);

      // 4. تسجيل حركة دخول
      const destinationMovementId = await createMovement(
        transfer,
        "transfer_in",
        transfer.toWarehouseId,
        transfer.toWarehouseName,
      );

      movementIds.push(destinationMovementId);

      // 5. اعتماد التحويل
      await API.patch(`/transfers/${transfer.id}`, {
        status: "completed",
      });

      toast.success(
        `تم التحويل بنجاح. المتبقي في المرسل: ${formatNumber(
          newSourceQuantity,
        )} ${transfer.unitName}`,
      );

      await loadData(companyId);
    } catch (error) {
      console.error("Transfer completion error:", error);

      // محاولة التراجع عن الحركات التي تم إنشاؤها
      for (const id of movementIds) {
        try {
          await API.delete(`/inventoryMovements/${id}`);
        } catch (rollbackError) {
          console.error("Movement rollback failed:", rollbackError);
        }
      }

      // التراجع عن رصيد المستودع المستقبل
      if (destinationChange) {
        try {
          await rollbackWarehouseStock(destinationChange);
        } catch (rollbackError) {
          console.error("Destination rollback failed:", rollbackError);
        }
      }

      // التراجع عن رصيد المستودع المرسل
      if (sourceChange) {
        try {
          await rollbackWarehouseStock(sourceChange);
        } catch (rollbackError) {
          console.error("Source rollback failed:", rollbackError);
        }
      }

      const message =
        error instanceof Error ? error.message : "حدث خطأ أثناء تنفيذ التحويل";

      toast.error(message);
      await loadData(companyId);
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     CANCEL TRANSFER
  ========================================================= */

  const cancelTransfer = async (transfer: Transfer) => {
    if (transfer.status !== "pending") {
      toast.error("يمكن إلغاء التحويلات المعلقة فقط");
      return;
    }

    if (!window.confirm("هل تريد إلغاء هذا التحويل؟")) {
      return;
    }

    try {
      setSaving(true);

      await API.patch(`/transfers/${transfer.id}`, {
        status: "cancelled",
      });

      toast.success("تم إلغاء التحويل");

      await loadData(companyId);
    } catch (error) {
      console.error(error);
      toast.error("تعذر إلغاء التحويل");
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE TRANSFER
  ========================================================= */

  const deleteTransfer = async (transfer: Transfer) => {
    if (transfer.status === "completed") {
      toast.error("لا يمكن حذف تحويل مكتمل");
      return;
    }

    if (!window.confirm("هل تريد حذف طلب التحويل؟")) {
      return;
    }

    try {
      setSaving(true);

      await API.delete(`/transfers/${transfer.id}`);

      toast.success("تم حذف التحويل");

      await loadData(companyId);
    } catch (error) {
      console.error(error);
      toast.error("تعذر حذف التحويل");
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     FILTERS
  ========================================================= */

  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        transfer.transferNumber?.toLowerCase().includes(searchValue) ||
        transfer.productName?.toLowerCase().includes(searchValue) ||
        transfer.productSKU?.toLowerCase().includes(searchValue) ||
        transfer.fromWarehouseName?.toLowerCase().includes(searchValue) ||
        transfer.toWarehouseName?.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all" || transfer.status === statusFilter;

      const matchesWarehouse =
        warehouseFilter === "all" ||
        transfer.fromWarehouseId === warehouseFilter ||
        transfer.toWarehouseId === warehouseFilter;

      return matchesSearch && matchesStatus && matchesWarehouse;
    });
  }, [transfers, search, statusFilter, warehouseFilter]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const statistics = useMemo(() => {
    const pending = transfers.filter(
      (item) => item.status === "pending",
    ).length;

    const completed = transfers.filter(
      (item) => item.status === "completed",
    ).length;

    const cancelled = transfers.filter(
      (item) => item.status === "cancelled",
    ).length;

    return {
      total: transfers.length,
      pending,
      completed,
      cancelled,
    };
  }, [transfers]);

  /* =========================================================
     STATUS
  ========================================================= */

  const statusInfo = (status: TransferStatus) => {
    switch (status) {
      case "completed":
        return {
          label: "مكتمل",
          className: "bg-emerald-50 text-emerald-700",
          icon: <FiCheckCircle />,
        };

      case "cancelled":
        return {
          label: "ملغي",
          className: "bg-red-50 text-red-700",
          icon: <FiXCircle />,
        };

      default:
        return {
          label: "معلق",
          className: "bg-amber-50 text-amber-700",
          icon: <FiClock />,
        };
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <FiRefreshCw className="animate-spin text-xl" />
          جاري تحميل بيانات التحويلات...
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-5 p-3 text-slate-800 md:p-5">
      {/* ================= HEADER ================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FiArrowLeftCircle className="text-2xl text-blue-700" />

            <h1 className="text-xl font-bold md:text-2xl">تحويلات المخزون</h1>
          </div>

          <p className="mt-1 text-xs text-slate-500 md:text-sm">
            إدارة نقل المنتجات والكميات بين المستودعات
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => loadData(companyId)}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            <FiRefreshCw />
            تحديث
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            <FiPlus />
            تحويل جديد
          </button>
        </div>
      </div>

      {/* ================= STATISTICS ================= */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="إجمالي التحويلات"
          value={statistics.total}
          icon={<FiArrowLeftCircle />}
          color="blue"
        />

        <StatCard
          title="التحويلات المعلقة"
          value={statistics.pending}
          icon={<FiClock />}
          color="amber"
        />

        <StatCard
          title="التحويلات المكتملة"
          value={statistics.completed}
          icon={<FiCheckCircle />}
          color="green"
        />

        <StatCard
          title="التحويلات الملغية"
          value={statistics.cancelled}
          icon={<FiXCircle />}
          color="red"
        />
      </div>

      {/* ================= FILTERS ================= */}

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث برقم التحويل أو المنتج..."
              className="w-full rounded-lg border border-slate-200 py-2 pr-9 pl-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <FiFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-9 pl-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">كل الحالات</option>
              <option value="pending">معلق</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          <div>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">كل المستودعات</option>

              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-4 py-3">رقم التحويل</th>
                <th className="px-4 py-3">المنتج</th>
                <th className="px-4 py-3">المستودع المرسل</th>
                <th className="px-4 py-3">المستودع المستقبل</th>
                <th className="px-4 py-3">الكمية</th>
                <th className="px-4 py-3">التاريخ</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredTransfers.map((transfer) => {
                const status = statusInfo(transfer.status);

                return (
                  <tr
                    key={transfer.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-semibold text-blue-700">
                      {transfer.transferNumber}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium">{transfer.productName}</div>

                      <div className="text-xs text-slate-400">
                        {transfer.productSKU}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FaWarehouse className="text-slate-400" />
                        {transfer.fromWarehouseName}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FaWarehouse className="text-emerald-600" />
                        {transfer.toWarehouseName}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-semibold">
                      {formatNumber(transfer.quantity)} {transfer.unitName}
                    </td>

                    <td className="px-4 py-3 text-slate-500">
                      {transfer.date}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTransfer(transfer)}
                          title="التفاصيل"
                          className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                        >
                          <FiEye />
                        </button>

                        {transfer.status === "pending" && (
                          <>
                            <button
                              onClick={() => openEditModal(transfer)}
                              title="تعديل"
                              className="rounded-md p-2 text-blue-600 hover:bg-blue-50"
                            >
                              <FiEdit />
                            </button>

                            <button
                              onClick={() => completeTransfer(transfer)}
                              disabled={saving}
                              title="اعتماد التحويل"
                              className="rounded-md p-2 text-emerald-600 hover:bg-emerald-50"
                            >
                              <FiCheckCircle />
                            </button>

                            <button
                              onClick={() => cancelTransfer(transfer)}
                              disabled={saving}
                              title="إلغاء"
                              className="rounded-md p-2 text-amber-600 hover:bg-amber-50"
                            >
                              <FiXCircle />
                            </button>

                            <button
                              onClick={() => deleteTransfer(transfer)}
                              disabled={saving}
                              title="حذف"
                              className="rounded-md p-2 text-red-600 hover:bg-red-50"
                            >
                              <FiTrash2 />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTransfers.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    <FiPackage className="mx-auto mb-2 text-3xl" />
                    لا توجد تحويلات مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          عدد النتائج: {filteredTransfers.length}
        </div>
      </div>

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-5 py-4">
              <div>
                <h2 className="font-bold">
                  {editingTransfer ? "تعديل التحويل" : "إنشاء تحويل جديد"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  حدد المنتج والمستودع والكمية المراد تحويلها
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              {/* FROM / TO */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    المستودع المرسل
                  </label>

                  <select
                    value={form.fromWarehouseId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        fromWarehouseId: e.target.value,
                      }))
                    }
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">اختر المستودع</option>

                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    المستودع المستقبل
                  </label>

                  <select
                    value={form.toWarehouseId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        toWarehouseId: e.target.value,
                      }))
                    }
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">اختر المستودع</option>

                    {warehouses
                      .filter((item) => item.id !== form.fromWarehouseId)
                      .map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* PRODUCT */}

              <div>
                <label className="mb-2 block text-sm font-medium">المنتج</label>

                <select
                  value={form.productId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      productId: e.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">اختر المنتج</option>

                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.sku}
                    </option>
                  ))}
                </select>
              </div>

              {/* STOCK INFO */}

              {form.productId && form.fromWarehouseId && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      الرصيد المتاح في المستودع المرسل
                    </span>

                    <span className="text-lg font-bold text-blue-700">
                      {checkingStock ? "..." : formatNumber(availableStock)}
                    </span>
                  </div>
                </div>
              )}

              {/* QUANTITY / DATE */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    الكمية
                  </label>

                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    required
                    placeholder="أدخل الكمية"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />

                  {number(form.quantity) > availableStock && (
                    <p className="mt-1 text-xs text-red-600">
                      الكمية أكبر من الرصيد المتاح
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    تاريخ التحويل
                  </label>

                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* NOTES */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  ملاحظات
                </label>

                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="ملاحظات إضافية..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* ACTIONS */}

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm hover:bg-slate-50"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    number(form.quantity) > availableStock ||
                    number(form.quantity) <= 0
                  }
                  className="flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiSave />

                  {saving
                    ? "جاري الحفظ..."
                    : editingTransfer
                      ? "حفظ التعديلات"
                      : "إنشاء التحويل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          TRANSFER DETAILS
      ===================================================== */}

      {selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="font-bold">تفاصيل التحويل</h2>

              <button
                onClick={() => setSelectedTransfer(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">رقم التحويل</p>

                <p className="mt-1 font-bold text-blue-700">
                  {selectedTransfer.transferNumber}
                </p>
              </div>

              <DetailRow label="المنتج" value={selectedTransfer.productName} />

              <DetailRow
                label="رمز المنتج"
                value={selectedTransfer.productSKU}
              />

              <DetailRow
                label="المستودع المرسل"
                value={selectedTransfer.fromWarehouseName}
              />

              <DetailRow
                label="المستودع المستقبل"
                value={selectedTransfer.toWarehouseName}
              />

              <DetailRow
                label="الكمية"
                value={`${formatNumber(
                  selectedTransfer.quantity,
                )} ${selectedTransfer.unitName}`}
              />

              <DetailRow label="التاريخ" value={selectedTransfer.date} />

              <DetailRow
                label="الحالة"
                value={statusInfo(selectedTransfer.status).label}
              />

              <DetailRow
                label="ملاحظات"
                value={selectedTransfer.notes || "لا توجد"}
              />

              <button
                onClick={() => setSelectedTransfer(null)}
                className="w-full rounded-lg bg-slate-800 py-2.5 text-sm text-white hover:bg-slate-900"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FOOTNOTE ================= */}

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-800">
        <FiAlertCircle className="mt-1 shrink-0" />

        <p>
          عند اعتماد التحويل يتم تحديث أرصدة المستودعات في warehouseStocks،
          وتسجيل حركتي خروج ودخول في inventoryMovements. لا يتم تعديل الرصيد
          الافتتاحي الموجود في سجل المنتج.
        </p>
      </div>
    </div>
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
  value: number;
  icon: React.ReactNode;
  color: "blue" | "amber" | "green" | "red";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500">{title}</p>

          <p className="mt-2 text-xl font-bold">{formatNumber(value)}</p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${colors[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 text-sm">
      <span className="text-slate-500">{label}</span>

      <span className="text-left font-medium">{value}</span>
    </div>
  );
}
