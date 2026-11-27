"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiEye,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiX,
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
  FiCalendar,
  FiMapPin,
} from "react-icons/fi";
import { IoFileTrayFull } from "react-icons/io5";
import { BiArrowToLeft } from "react-icons/bi";

/* =========================
   Types
========================= */

type TransferStatus = "pending" | "completed" | "cancelled";

type Warehouse = {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  status?: string;
};

type Product = {
  id: string;
  companyId: string;
  name: string;
  sku?: string;
  unitName?: string;
  warehouseId?: string;
  currentStock?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  trackInventory?: boolean;
  status?: string;
};

type WarehouseStock = {
  id: string;
  companyId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  updatedAt?: string;
  extra?: Record<string, any>;
};

type Transfer = {
  id: string;
  companyId: string;
  transferNumber: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  productId: string;
  productName: string;
  productSKU?: string;
  quantity: number;
  unitName?: string;
  date: string;
  notes?: string;
  status: TransferStatus;
  createdAt: string;
  updatedAt?: string;
  extra?: Record<string, any>;
};

type TransferForm = {
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  quantity: string;
  date: string;
  notes: string;
};

type Actor = {
  userId: string;
  userName: string;
  username: string;
  userRole: string;
  companyId: string;
};

/* =========================
   Helpers
========================= */

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: TransferForm = {
  fromWarehouseId: "",
  toWarehouseId: "",
  productId: "",
  quantity: "",
  date: today(),
  notes: "",
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(value || 0);

const formatDate = (value?: string) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("ar-YE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getActor = (): Actor | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("authUser");

    if (!stored) return null;

    const user = JSON.parse(stored);

    if (!user?.companyId) return null;

    return {
      userId: String(user.id || user.userId || ""),
      userName: user.name || user.fullName || user.username || "",
      username: user.username || "",
      userRole: user.role || "",
      companyId: String(user.companyId),
    };
  } catch {
    return null;
  }
};

const isActive = (status?: string) => {
  if (!status) return true;

  return !["inactive", "disabled", "موقوف", "غير نشط"].includes(
    status.toLowerCase(),
  );
};

/* =========================
   Component
========================= */

export default function TransfersPage() {
  const [actor, setActor] = useState<Actor | null>(null);

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStock[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(
    null,
  );

  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);

  const [form, setForm] = useState<TransferForm>(emptyForm);

  /* =========================
     Initial actor
  ========================= */

  useEffect(() => {
    const currentActor = getActor();

    if (!currentActor) {
      toast.error("تعذر تحديد المستخدم أو الشركة");
      setLoading(false);
      return;
    }

    setActor(currentActor);
  }, []);

  /* =========================
     Load data
  ========================= */

  const loadData = useCallback(async () => {
    if (!actor?.companyId) return;

    try {
      setLoading(true);

      const [transfersResult, warehousesResult, productsResult, stocksResult] =
        await Promise.all([
          supabase
            .from("transfers")
            .select("*")
            .eq("companyId", actor.companyId)
            .order("createdAt", { ascending: false }),

          supabase
            .from("warehouses")
            .select("*")
            .eq("companyId", actor.companyId),

          supabase
            .from("products")
            .select("*")
            .eq("companyId", actor.companyId),

          supabase
            .from("warehouseStocks")
            .select("*")
            .eq("companyId", actor.companyId),
        ]);

      if (transfersResult.error) throw transfersResult.error;
      if (warehousesResult.error) throw warehousesResult.error;
      if (productsResult.error) throw productsResult.error;
      if (stocksResult.error) throw stocksResult.error;

      setTransfers((transfersResult.data || []) as Transfer[]);

      setWarehouses(
        ((warehousesResult.data || []) as Warehouse[]).filter((item) =>
          isActive(item.status),
        ),
      );

      setProducts(
        ((productsResult.data || []) as Product[]).filter(
          (item) => isActive(item.status) && item.trackInventory !== false,
        ),
      );

      setWarehouseStocks((stocksResult.data || []) as WarehouseStock[]);
    } catch (error: any) {
      console.error("Load transfers error:", error);
      toast.error(error.message || "حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor) loadData();
  }, [actor, loadData]);

  /* =========================
     Stock helpers
  ========================= */

  const getStockQuantity = (productId: string, warehouseId: string) => {
    const stock = warehouseStocks.find(
      (item) =>
        item.productId === productId && item.warehouseId === warehouseId,
    );

    if (stock) return Number(stock.quantity || 0);

    const product = products.find((item) => item.id === productId);

    if (product?.warehouseId === warehouseId) {
      return Number(product.currentStock || 0);
    }

    return 0;
  };

  const getStockRecord = async (productId: string, warehouseId: string) => {
    if (!actor) throw new Error("تعذر تحديد الشركة");

    const { data, error } = await supabase
      .from("warehouseStocks")
      .select("*")
      .eq("companyId", actor.companyId)
      .eq("productId", productId)
      .eq("warehouseId", warehouseId);

    if (error) throw error;

    if (data && data.length > 1) {
      throw new Error(
        "يوجد أكثر من سجل رصيد لنفس المنتج والمستودع. يرجى معالجة السجلات المكررة.",
      );
    }

    return data?.[0] as WarehouseStock | undefined;
  };

  const updateStock = async (
    productId: string,
    warehouseId: string,
    newQuantity: number,
  ) => {
    if (!actor) throw new Error("تعذر تحديد الشركة");

    const existing = await getStockRecord(productId, warehouseId);

    const now = new Date().toISOString();

    if (existing) {
      const { data, error } = await supabase
        .from("warehouseStocks")
        .update({
          quantity: newQuantity,
          updatedAt: now,
          extra: {
            ...(existing.extra || {}),
            updatedBy: actor.userId,
            updatedByName: actor.userName,
            updatedByUsername: actor.username,
            updatedByRole: actor.userRole,
          },
        })
        .eq("id", existing.id)
        .eq("companyId", actor.companyId)
        .select("*")
        .single();

      if (error) throw error;
      if (!data) throw new Error("تعذر تحديث رصيد المستودع");

      return {
        type: "updated" as const,
        oldQuantity: Number(existing.quantity || 0),
        newQuantity,
        recordId: existing.id,
      };
    }

    const { data, error } = await supabase
      .from("warehouseStocks")
      .insert({
        id: crypto.randomUUID(),
        companyId: actor.companyId,
        productId,
        warehouseId,
        quantity: newQuantity,
        updatedAt: now,
        extra: {
          createdBy: actor.userId,
          createdByName: actor.userName,
          createdByUsername: actor.username,
          createdByRole: actor.userRole,
        },
      })
      .select("*")
      .single();

    if (error) throw error;
    if (!data) throw new Error("تعذر إنشاء رصيد المستودع");

    return {
      type: "created" as const,
      oldQuantity: 0,
      newQuantity,
      recordId: data.id,
    };
  };

  const rollbackStock = async (
    productId: string,
    warehouseId: string,
    operation: {
      type: "created" | "updated";
      oldQuantity: number;
      recordId: string;
    },
  ) => {
    if (!actor) return;

    if (operation.type === "created") {
      const { error } = await supabase
        .from("warehouseStocks")
        .delete()
        .eq("id", operation.recordId)
        .eq("companyId", actor.companyId);

      if (error) throw error;
      return;
    }

    const { error } = await supabase
      .from("warehouseStocks")
      .update({
        quantity: operation.oldQuantity,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", operation.recordId)
      .eq("companyId", actor.companyId);

    if (error) throw error;
  };

  /* =========================
     Transfer number
  ========================= */

  const generateTransferNumber = () => {
    const numbers = transfers
      .map((item) => {
        const match = item.transferNumber?.match(/^TRF-(\d+)$/);
        return match ? Number(match[1]) : 0;
      })
      .filter((number) => number > 0);

    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;

    return `TRF-${String(nextNumber).padStart(4, "0")}`;
  };

  /* =========================
     Form helpers
  ========================= */

  const openCreateForm = () => {
    setEditingTransfer(null);
    setForm({
      ...emptyForm,
      date: today(),
      fromWarehouseId: warehouses[0]?.id || "",
    });
    setShowForm(true);
  };

  const openEditForm = (transfer: Transfer) => {
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

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTransfer(null);
    setForm(emptyForm);
  };

  const selectedProduct = products.find((item) => item.id === form.productId);

  const availableStock =
    form.productId && form.fromWarehouseId
      ? getStockQuantity(form.productId, form.fromWarehouseId)
      : 0;

  /* =========================
     Save transfer
  ========================= */

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!actor) {
      toast.error("تعذر تحديد المستخدم");
      return;
    }

    const quantity = Number(form.quantity);

    if (!form.fromWarehouseId || !form.toWarehouseId) {
      toast.error("يرجى تحديد المستودعين");
      return;
    }

    if (form.fromWarehouseId === form.toWarehouseId) {
      toast.error("لا يمكن اختيار نفس المستودع كمصدر ووجهة");
      return;
    }

    if (!form.productId) {
      toast.error("يرجى اختيار المنتج");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("أدخل كمية صحيحة");
      return;
    }

    if (!form.date) {
      toast.error("يرجى تحديد تاريخ التحويل");
      return;
    }

    const fromWarehouse = warehouses.find(
      (item) => item.id === form.fromWarehouseId,
    );

    const toWarehouse = warehouses.find(
      (item) => item.id === form.toWarehouseId,
    );

    const product = products.find((item) => item.id === form.productId);

    if (!fromWarehouse || !toWarehouse || !product) {
      toast.error("بيانات المنتج أو المستودعات غير صحيحة");
      return;
    }

    if (!editingTransfer) {
      if (quantity > availableStock) {
        toast.error(
          `الكمية المتاحة في المستودع هي ${formatNumber(availableStock)}`,
        );
        return;
      }
    } else {
      const originalStock = getStockQuantity(
        editingTransfer.productId,
        editingTransfer.fromWarehouseId,
      );

      const availableForEdit = originalStock + editingTransfer.quantity;

      if (
        form.productId === editingTransfer.productId &&
        form.fromWarehouseId === editingTransfer.fromWarehouseId &&
        quantity > availableForEdit
      ) {
        toast.error(`الكمية المتاحة هي ${formatNumber(availableForEdit)}`);
        return;
      }

      if (
        form.productId !== editingTransfer.productId ||
        form.fromWarehouseId !== editingTransfer.fromWarehouseId
      ) {
        if (quantity > availableStock) {
          toast.error(`الكمية المتاحة هي ${formatNumber(availableStock)}`);
          return;
        }
      }
    }

    try {
      setSaving(true);

      const now = new Date().toISOString();

      const payload = {
        companyId: actor.companyId,
        fromWarehouseId: fromWarehouse.id,
        fromWarehouseName: fromWarehouse.name,
        toWarehouseId: toWarehouse.id,
        toWarehouseName: toWarehouse.name,
        productId: product.id,
        productName: product.name,
        productSKU: product.sku || "",
        quantity,
        unitName: product.unitName || "",
        date: form.date,
        notes: form.notes.trim(),
        updatedAt: now,
      };

      if (editingTransfer) {
        const { data, error } = await supabase
          .from("transfers")
          .update(payload)
          .eq("id", editingTransfer.id)
          .eq("companyId", actor.companyId)
          .eq("status", "pending")
          .select("*")
          .single();

        if (error) throw error;
        if (!data) throw new Error("تعذر تحديث التحويل");

        toast.success("تم تحديث التحويل بنجاح");
      } else {
        const { error } = await supabase.from("transfers").insert({
          id: crypto.randomUUID(),
          ...payload,
          transferNumber: generateTransferNumber(),
          status: "pending",
          createdAt: now,
          extra: {
            createdBy: actor.userId,
            createdByName: actor.userName,
            createdByUsername: actor.username,
            createdByRole: actor.userRole,
          },
        });

        if (error) throw error;

        toast.success("تم إنشاء التحويل بنجاح");
      }

      closeForm();
      await loadData();
    } catch (error: any) {
      console.error("Save transfer error:", error);
      toast.error(error.message || "حدث خطأ أثناء حفظ التحويل");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     Create inventory movement
  ========================= */

  const createMovement = async ({
    product,
    warehouse,
    quantity,
    type,
    transfer,
  }: {
    product: Product;
    warehouse: Warehouse;
    quantity: number;
    type: "transfer_in" | "transfer_out";
    transfer: Transfer;
  }) => {
    if (!actor) throw new Error("تعذر تحديد المستخدم");

    const { data, error } = await supabase
      .from("inventoryMovements")
      .insert({
        id: crypto.randomUUID(),
        companyId: actor.companyId,
        productId: product.id,
        productName: product.name,
        productSKU: product.sku || "",
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        type,
        quantity,
        referenceType: "transfer",
        referenceId: transfer.id,
        referenceNumber: transfer.transferNumber,
        date: transfer.date,
        notes: transfer.notes || "",
        createdAt: new Date().toISOString(),
        extra: {
          createdBy: actor.userId,
          createdByName: actor.userName,
          createdByUsername: actor.username,
          createdByRole: actor.userRole,
        },
      })
      .select("id")
      .single();

    if (error) throw error;
    if (!data) throw new Error("تعذر تسجيل حركة المخزون");

    return data.id as string;
  };

  /* =========================
     Complete transfer
  ========================= */

  const completeTransfer = async (transfer: Transfer) => {
    if (!actor) return;

    if (transfer.status !== "pending") {
      toast.error("هذا التحويل ليس معلقًا");
      return;
    }

    const confirmed = window.confirm(
      `هل تريد إتمام التحويل ${transfer.transferNumber}؟`,
    );

    if (!confirmed) return;

    let sourceOperation: {
      type: "created" | "updated";
      oldQuantity: number;
      recordId: string;
    } | null = null;

    let destinationOperation: {
      type: "created" | "updated";
      oldQuantity: number;
      recordId: string;
    } | null = null;

    const movementIds: string[] = [];

    try {
      setSaving(true);

      // إعادة قراءة التحويل من قاعدة البيانات
      const { data: currentTransfer, error: transferError } = await supabase
        .from("transfers")
        .select("*")
        .eq("id", transfer.id)
        .eq("companyId", actor.companyId)
        .single();

      if (transferError) throw transferError;

      if (currentTransfer.status !== "pending") {
        throw new Error("تم تغيير حالة التحويل مسبقًا");
      }

      const product = products.find((item) => item.id === transfer.productId);

      const sourceWarehouse = warehouses.find(
        (item) => item.id === transfer.fromWarehouseId,
      );

      const destinationWarehouse = warehouses.find(
        (item) => item.id === transfer.toWarehouseId,
      );

      if (!product || !sourceWarehouse || !destinationWarehouse) {
        throw new Error("تعذر العثور على المنتج أو المستودعات");
      }

      // قراءة الرصيد الحالي من قاعدة البيانات
      const sourceStock = await getStockRecord(
        transfer.productId,
        transfer.fromWarehouseId,
      );

      const sourceQuantity = sourceStock
        ? Number(sourceStock.quantity || 0)
        : product.warehouseId === transfer.fromWarehouseId
          ? Number(product.currentStock || 0)
          : 0;

      if (sourceQuantity < transfer.quantity) {
        throw new Error(
          `الرصيد غير كافٍ. الرصيد الحالي: ${formatNumber(sourceQuantity)}`,
        );
      }

      const destinationStock = await getStockRecord(
        transfer.productId,
        transfer.toWarehouseId,
      );

      const destinationQuantity = Number(destinationStock?.quantity || 0);

      // خصم المصدر
      sourceOperation = await updateStock(
        transfer.productId,
        transfer.fromWarehouseId,
        sourceQuantity - transfer.quantity,
      );

      // إضافة الوجهة
      destinationOperation = await updateStock(
        transfer.productId,
        transfer.toWarehouseId,
        destinationQuantity + transfer.quantity,
      );

      // تسجيل حركة الخروج
      const outMovementId = await createMovement({
        product,
        warehouse: sourceWarehouse,
        quantity: transfer.quantity,
        type: "transfer_out",
        transfer,
      });

      movementIds.push(outMovementId);

      // تسجيل حركة الدخول
      const inMovementId = await createMovement({
        product,
        warehouse: destinationWarehouse,
        quantity: transfer.quantity,
        type: "transfer_in",
        transfer,
      });

      movementIds.push(inMovementId);

      // تحديث حالة التحويل
      const { data: updatedTransfer, error: updateError } = await supabase
        .from("transfers")
        .update({
          status: "completed",
          updatedAt: new Date().toISOString(),
          extra: {
            ...(currentTransfer.extra || {}),
            completedBy: actor.userId,
            completedByName: actor.userName,
            completedByUsername: actor.username,
            completedByRole: actor.userRole,
            completedAt: new Date().toISOString(),
          },
        })
        .eq("id", transfer.id)
        .eq("companyId", actor.companyId)
        .eq("status", "pending")
        .select("id")
        .single();

      if (updateError) throw updateError;
      if (!updatedTransfer) {
        throw new Error("تعذر تحديث حالة التحويل");
      }

      toast.success("تم إتمام التحويل وتحديث أرصدة المستودعات");

      await loadData();
    } catch (error: any) {
      console.error("Complete transfer error:", error);

      // محاولة التراجع عن العمليات السابقة
      try {
        if (movementIds.length > 0) {
          const { error: movementDeleteError } = await supabase
            .from("inventoryMovements")
            .delete()
            .in("id", movementIds)
            .eq("companyId", actor.companyId);

          if (movementDeleteError) throw movementDeleteError;
        }

        if (destinationOperation) {
          await rollbackStock(
            transfer.productId,
            transfer.toWarehouseId,
            destinationOperation,
          );
        }

        if (sourceOperation) {
          await rollbackStock(
            transfer.productId,
            transfer.fromWarehouseId,
            sourceOperation,
          );
        }
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);

        toast.error(
          "حدث خطأ أثناء التراجع عن العمليات. يرجى مراجعة أرصدة المستودعات وحركات المخزون.",
        );
      }

      toast.error(error.message || "تعذر إتمام التحويل");
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     Cancel transfer
  ========================= */

  const cancelTransfer = async (transfer: Transfer) => {
    if (!actor) return;

    if (transfer.status !== "pending") {
      toast.error("يمكن إلغاء التحويلات المعلقة فقط");
      return;
    }

    if (!window.confirm("هل تريد إلغاء هذا التحويل؟")) return;

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from("transfers")
        .update({
          status: "cancelled",
          updatedAt: new Date().toISOString(),
          extra: {
            ...(transfer.extra || {}),
            cancelledBy: actor.userId,
            cancelledByName: actor.userName,
            cancelledByUsername: actor.username,
            cancelledByRole: actor.userRole,
            cancelledAt: new Date().toISOString(),
          },
        })
        .eq("id", transfer.id)
        .eq("companyId", actor.companyId)
        .eq("status", "pending")
        .select("id")
        .single();

      if (error) throw error;
      if (!data) throw new Error("تعذر إلغاء التحويل");

      toast.success("تم إلغاء التحويل");
      await loadData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "تعذر إلغاء التحويل");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     Delete transfer
  ========================= */

  const deleteTransfer = async (transfer: Transfer) => {
    if (!actor) return;

    if (transfer.status === "completed") {
      toast.error("لا يمكن حذف تحويل مكتمل");
      return;
    }

    if (!window.confirm("هل أنت متأكد من حذف هذا التحويل؟")) return;

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from("transfers")
        .delete()
        .eq("id", transfer.id)
        .eq("companyId", actor.companyId)
        .neq("status", "completed")
        .select("id")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "لم يتم حذف التحويل. ربما تغيرت حالته أو لا تملك صلاحية الحذف.",
        );
      }

      toast.success("تم حذف التحويل");
      await loadData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "تعذر حذف التحويل");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     Details
  ========================= */

  const openDetails = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setShowDetails(true);
  };

  /* =========================
     Filters
  ========================= */

  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      const searchValue = search.trim().toLowerCase();

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

  const pendingCount = transfers.filter(
    (item) => item.status === "pending",
  ).length;

  const completedCount = transfers.filter(
    (item) => item.status === "completed",
  ).length;

  const cancelledCount = transfers.filter(
    (item) => item.status === "cancelled",
  ).length;

  /* =========================
     Status component
  ========================= */

  const StatusBadge = ({ status }: { status: TransferStatus }) => {
    const config = {
      pending: {
        text: "معلق",
        className: "bg-amber-100 text-amber-700",
        icon: <FiClock />,
      },
      completed: {
        text: "مكتمل",
        className: "bg-green-100 text-green-700",
        icon: <FiCheckCircle />,
      },
      cancelled: {
        text: "ملغي",
        className: "bg-red-100 text-red-700",
        icon: <FiXCircle />,
      },
    };

    const item = config[status] || config.pending;

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${item.className}`}
      >
        {item.icon}
        {item.text}
      </span>
    );
  };

  /* =========================
     Render
  ========================= */

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">تحويلات المخزون</h1>

          <p className="mt-1 text-sm text-slate-500">
            إدارة تحويل المنتجات بين المستودعات ومتابعة حالتها.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            تحديث
          </button>

          <button
            onClick={openCreateForm}
            disabled={warehouses.length < 2 || products.length === 0}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiPlus />
            تحويل جديد
          </button>
        </div>
      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي التحويلات</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {formatNumber(transfers.length)}
              </h3>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <IoFileTrayFull size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">قيد الانتظار</p>
              <h3 className="mt-2 text-2xl font-bold text-amber-600">
                {formatNumber(pendingCount)}
              </h3>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
              <FiClock size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">مكتملة</p>
              <h3 className="mt-2 text-2xl font-bold text-green-600">
                {formatNumber(completedCount)}
              </h3>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <FiCheckCircle size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">ملغاة</p>
              <h3 className="mt-2 text-2xl font-bold text-red-600">
                {formatNumber(cancelledCount)}
              </h3>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-red-600">
              <FiXCircle size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم التحويل أو المنتج..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pr-10 pl-3 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div className="relative">
            <FiFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pr-10 pl-3 text-sm outline-none focus:border-slate-400"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">معلق</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          <div className="relative">
            <FiMapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pr-10 pl-3 text-sm outline-none focus:border-slate-400"
            >
              <option value="all">جميع المستودعات</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transfers Table */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="font-bold text-slate-800">قائمة التحويلات</h2>

          <span className="text-sm text-slate-500">
            {filteredTransfers.length} تحويل
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <FiRefreshCw className="mx-auto mb-3 animate-spin" size={24} />
            جاري تحميل التحويلات...
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="p-12 text-center">
            <BiArrowToLeft className="mx-auto mb-3 text-slate-300" size={40} />

            <p className="font-medium text-slate-600">لا توجد تحويلات</p>

            <p className="mt-1 text-sm text-slate-400">
              لم يتم العثور على تحويلات تطابق البحث.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-right text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">رقم التحويل</th>
                  <th className="px-4 py-3 font-medium">المنتج</th>
                  <th className="px-4 py-3 font-medium">من مستودع</th>
                  <th className="px-4 py-3 font-medium">إلى مستودع</th>
                  <th className="px-4 py-3 font-medium">الكمية</th>
                  <th className="px-4 py-3 font-medium">التاريخ</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium">الإجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredTransfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {transfer.transferNumber}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-800">
                        {transfer.productName}
                      </p>

                      {transfer.productSKU && (
                        <p className="mt-1 text-xs text-slate-400">
                          {transfer.productSKU}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {transfer.fromWarehouseName}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {transfer.toWarehouseName}
                    </td>

                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {formatNumber(transfer.quantity)} {transfer.unitName}
                    </td>

                    <td className="px-4 py-4 text-slate-500">
                      {formatDate(transfer.date)}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={transfer.status} />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          title="التفاصيل"
                          onClick={() => openDetails(transfer)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <FiEye size={17} />
                        </button>

                        {transfer.status === "pending" && (
                          <>
                            <button
                              title="تعديل"
                              onClick={() => openEditForm(transfer)}
                              className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                            >
                              <FiEdit size={17} />
                            </button>

                            <button
                              title="إتمام التحويل"
                              onClick={() => completeTransfer(transfer)}
                              disabled={saving}
                              className="rounded-lg p-2 text-green-600 hover:bg-green-50 disabled:opacity-50"
                            >
                              <FiCheck size={17} />
                            </button>

                            <button
                              title="إلغاء"
                              onClick={() => cancelTransfer(transfer)}
                              disabled={saving}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <FiX size={17} />
                            </button>
                          </>
                        )}

                        {transfer.status !== "completed" && (
                          <button
                            title="حذف"
                            onClick={() => deleteTransfer(transfer)}
                            disabled={saving}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <FiTrash2 size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editingTransfer ? "تعديل التحويل" : "إنشاء تحويل جديد"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  أدخل بيانات نقل المنتجات بين المستودعات.
                </p>
              </div>

              <button
                onClick={closeForm}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    المستودع المصدر *
                  </label>

                  <select
                    required
                    value={form.fromWarehouseId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        fromWarehouseId: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-slate-400"
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
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    المستودع المستلم *
                  </label>

                  <select
                    required
                    value={form.toWarehouseId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        toWarehouseId: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-slate-400"
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

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  المنتج *
                </label>

                <select
                  required
                  value={form.productId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      productId: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-slate-400"
                >
                  <option value="">اختر المنتج</option>

                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                      {product.sku ? ` - ${product.sku}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {form.productId && form.fromWarehouseId && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">
                      الرصيد المتاح في المستودع المصدر
                    </span>

                    <span className="font-bold text-blue-800">
                      {formatNumber(availableStock)}{" "}
                      {selectedProduct?.unitName || ""}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    الكمية *
                  </label>

                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    required
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    placeholder="أدخل الكمية"
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    تاريخ التحويل *
                  </label>

                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
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
                  placeholder="ملاحظات إضافية حول التحويل..."
                  className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {saving && <FiRefreshCw className="animate-spin" />}

                  {editingTransfer ? "حفظ التعديلات" : "إنشاء التحويل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}

      {showDetails && selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  تفاصيل التحويل
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedTransfer.transferNumber}
                </p>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">الحالة</span>
                <StatusBadge status={selectedTransfer.status} />
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="mb-2 text-xs text-slate-500">المنتج</p>

                <p className="font-bold text-slate-800">
                  {selectedTransfer.productName}
                </p>

                {selectedTransfer.productSKU && (
                  <p className="mt-1 text-xs text-slate-500">
                    رمز المنتج: {selectedTransfer.productSKU}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="mb-2 text-xs text-slate-500">المستودع المصدر</p>

                  <p className="font-semibold text-slate-800">
                    {selectedTransfer.fromWarehouseName}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="mb-2 text-xs text-slate-500">
                    المستودع المستلم
                  </p>

                  <p className="font-semibold text-slate-800">
                    {selectedTransfer.toWarehouseName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="mb-2 text-xs text-slate-500">الكمية</p>

                  <p className="text-lg font-bold text-slate-800">
                    {formatNumber(selectedTransfer.quantity)}{" "}
                    {selectedTransfer.unitName}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="mb-2 text-xs text-slate-500">تاريخ التحويل</p>

                  <p className="font-semibold text-slate-800">
                    {formatDate(selectedTransfer.date)}
                  </p>
                </div>
              </div>

              {selectedTransfer.notes && (
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="mb-2 text-xs text-slate-500">الملاحظات</p>

                  <p className="whitespace-pre-wrap text-sm text-slate-700">
                    {selectedTransfer.notes}
                  </p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-400">
                  تاريخ إنشاء التحويل: {formatDate(selectedTransfer.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 p-4">
              <button
                onClick={() => setShowDetails(false)}
                className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
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
