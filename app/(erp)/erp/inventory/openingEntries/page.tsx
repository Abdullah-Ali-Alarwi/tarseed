"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiSave,
  FiTrash2,
  FiPackage,
  FiCalendar,
  FiDollarSign,
  FiAlertCircle,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";
import { IoHourglassOutline } from "react-icons/io5";

import {
  getCurrentActor,
  getCreateActivity,
  logCreate,
} from "../../lib/activity";

/* =====================================================
   API
===================================================== */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* =====================================================
   CONSTANTS
===================================================== */

const INVENTORY_ACCOUNT_CODE = "1104";
const CAPITAL_ACCOUNT_CODE = "3101";

/* =====================================================
   TYPES
===================================================== */

interface CurrentUser {
  id: string | number;
  username: string;
  name?: string;
  fullName?: string;
  role?: string;
  type: string;
  companyId?: string | number;
}

interface Account {
  id: string | number;
  companyId: string | number;
  code: string;
  name: string;
  type: string;
  nature?: string;
  isGroup?: boolean;
  isActive?: boolean;
  allowPosting?: boolean;
}

interface Product {
  id: string;
  companyId: string;
  name: string;
  sku?: string;
  barcode?: string;
  unitId?: string;
  unitName?: string;
  categoryName?: string;
  status: string;
  trackInventory?: boolean;
}

interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  status: string;
}

interface WarehouseStock {
  id: string;
  companyId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  updatedAt?: string;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
}

interface InventoryMovement {
  id: string | number;
  companyId: string;
  productId: string;
  productName: string;
  productSKU?: string;
  warehouseId: string;
  warehouseName: string;
  type: string;
  quantity: number;
  unitName?: string;
  unitCost?: number;
  totalCost?: number;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  date: string;
  notes?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
}

interface OpeningLine {
  productId: string;
  warehouseId: string;
  quantity: string;
  unitCost: string;
}

interface Journal {
  id: string | number;
  companyId: string;
  entryNumber: string;
  date: string;
  description: string;
  referenceType: string;
  referenceId?: string;
  status: string;
  totalDebit: number;
  totalCredit: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

interface JournalLine {
  id?: string | number;
  journalId: string | number;
  companyId: string;
  accountId: string | number;
  accountCode: string;
  accountName: string;
  date: string;
  debit: number;
  credit: number;
  description: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

/* =====================================================
   FORM
===================================================== */

const emptyLine: OpeningLine = {
  productId: "",
  warehouseId: "",
  quantity: "",
  unitCost: "",
};

const today = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =====================================================
   HELPERS
===================================================== */

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.substring(name.length + 1));
}

function money(value: number) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function number(value: unknown) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      fallback
    );
  }

  return error instanceof Error ? error.message : fallback;
}

function createEntryNumber() {
  return `JRN-${Date.now()}`;
}

function createReferenceNumber() {
  return `OPN-${Date.now()}`;
}

/* =====================================================
   PAGE
===================================================== */

export default function InventoryOpeningEntriesPage() {
  const [companyId, setCompanyId] = useState("");

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [date, setDate] = useState(today());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const [lines, setLines] = useState<OpeningLine[]>([{ ...emptyLine }]);

  /* =====================================================
     LOAD DATA
  ===================================================== */

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const username = getCookie("username");

      if (!username) {
        throw new Error("يرجى تسجيل الدخول أولاً");
      }

      const userResponse = await api.get<CurrentUser[]>("/users", {
        params: { username },
      });

      const user = userResponse.data.find((item) => item.username === username);

      if (!user) {
        throw new Error("تعذر العثور على المستخدم");
      }

      if (user.type === "platform") {
        throw new Error("هذه الصفحة مخصصة لمستخدمي الشركات");
      }

      if (!user.companyId) {
        throw new Error("المستخدم غير مرتبط بأي شركة");
      }

      const currentCompanyId = String(user.companyId);

      setCompanyId(currentCompanyId);
      setCurrentUser(user);

      const [
        productsResponse,
        warehousesResponse,
        stocksResponse,
        movementsResponse,
        accountsResponse,
      ] = await Promise.all([
        api.get<Product[]>("/products", {
          params: { companyId: currentCompanyId },
        }),

        api.get<Warehouse[]>("/warehouses", {
          params: { companyId: currentCompanyId },
        }),

        api.get<WarehouseStock[]>("/warehouseStocks", {
          params: { companyId: currentCompanyId },
        }),

        api.get<InventoryMovement[]>("/inventoryMovements", {
          params: { companyId: currentCompanyId },
        }),

        api.get<Account[]>("/accounts", {
          params: { companyId: currentCompanyId },
        }),
      ]);

      setProducts(
        productsResponse.data.filter(
          (item) =>
            String(item.companyId) === currentCompanyId &&
            item.status === "active" &&
            item.trackInventory !== false,
        ),
      );

      setWarehouses(
        warehousesResponse.data.filter(
          (item) =>
            String(item.companyId) === currentCompanyId &&
            item.status === "active",
        ),
      );

      setStocks(
        stocksResponse.data.filter(
          (item) => String(item.companyId) === currentCompanyId,
        ),
      );

      setMovements(
        movementsResponse.data.filter(
          (item) =>
            String(item.companyId) === currentCompanyId &&
            item.type === "opening_balance",
        ),
      );

      setAccounts(
        accountsResponse.data.filter(
          (item) =>
            String(item.companyId) === currentCompanyId &&
            item.isActive !== false,
        ),
      );
    } catch (error) {
      console.error("Opening balances load error:", error);

      toast.error(getErrorMessage(error, "حدث خطأ أثناء تحميل البيانات"));

      setCompanyId("");
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =====================================================
     ACCOUNT VALIDATION
  ===================================================== */

  const inventoryAccount = useMemo(
    () =>
      accounts.find(
        (account) =>
          account.code === INVENTORY_ACCOUNT_CODE && account.isGroup === false,
      ),
    [accounts],
  );

  const capitalAccount = useMemo(
    () =>
      accounts.find(
        (account) =>
          account.code === CAPITAL_ACCOUNT_CODE && account.isGroup === false,
      ),
    [accounts],
  );

  /* =====================================================
     TOTALS
  ===================================================== */

  const totalQuantity = useMemo(() => {
    return lines.reduce((sum, line) => sum + number(line.quantity), 0);
  }, [lines]);

  const totalCost = useMemo(() => {
    return lines.reduce(
      (sum, line) => sum + number(line.quantity) * number(line.unitCost),
      0,
    );
  }, [lines]);

  /* =====================================================
     LINE MANAGEMENT
  ===================================================== */

  function updateLine(index: number, field: keyof OpeningLine, value: string) {
    setLines((previous) =>
      previous.map((line, i) =>
        i === index
          ? {
              ...line,
              [field]: value,
            }
          : line,
      ),
    );
  }

  function addLine() {
    setLines((previous) => [...previous, { ...emptyLine }]);
  }

  function removeLine(index: number) {
    if (lines.length === 1) {
      toast.error("يجب أن يحتوي المستند على سطر واحد على الأقل");
      return;
    }

    setLines((previous) => previous.filter((_, i) => i !== index));
  }

  /* =====================================================
     GET CURRENT STOCK
  ===================================================== */

  function getCurrentStock(productId: string, warehouseId: string) {
    const stock = stocks.find(
      (item) =>
        String(item.productId) === productId &&
        String(item.warehouseId) === warehouseId,
    );

    return number(stock?.quantity);
  }

  /* =====================================================
     ACTOR VALIDATION
  ===================================================== */

  function validateCurrentActor(user: CurrentUser) {
    const actor = getCurrentActor();

    if (!actor) {
      throw new Error(
        "تعذر تحديد هوية المستخدم من جلسة النظام. أعد تسجيل الدخول.",
      );
    }

    if (
      String(actor.userId) !== String(user.id) ||
      String(actor.companyId) !== String(user.companyId)
    ) {
      throw new Error(
        "بيانات المستخدم في الجلسة لا تتطابق مع بيانات الشركة. أعد تسجيل الدخول.",
      );
    }

    return actor;
  }

  /* =====================================================
     ROLLBACK
  ===================================================== */

  async function rollbackChanges(data: {
    movementIds: (string | number)[];
    journalId: string | number | null;
    journalLineIds: (string | number)[];
    stockChanges: {
      id: string | null;
      created: boolean;
      quantityBefore: number;
      productId: string;
      warehouseId: string;
    }[];
  }) {
    const { movementIds, journalId, journalLineIds, stockChanges } = data;

    const rollbackTasks: Promise<unknown>[] = [];

    // حذف تفاصيل القيد أولاً
    journalLineIds.forEach((id) => {
      rollbackTasks.push(api.delete(`/journalLines/${id}`));
    });

    // حذف رأس القيد
    if (journalId !== null) {
      rollbackTasks.push(api.delete(`/journals/${journalId}`));
    }

    // حذف الحركات المخزنية
    movementIds.forEach((id) => {
      rollbackTasks.push(api.delete(`/inventoryMovements/${id}`));
    });

    // إعادة أرصدة المستودعات
    stockChanges.forEach((change) => {
      if (change.created) {
        rollbackTasks.push(
          (async () => {
            const response = await api.get<WarehouseStock[]>(
              "/warehouseStocks",
              {
                params: {
                  companyId,
                  productId: change.productId,
                  warehouseId: change.warehouseId,
                },
              },
            );

            const createdStock = response.data.find(
              (item) =>
                String(item.companyId) === companyId &&
                String(item.productId) === change.productId &&
                String(item.warehouseId) === change.warehouseId,
            );

            if (createdStock) {
              await api.delete(`/warehouseStocks/${createdStock.id}`);
            }
          })(),
        );
      } else if (change.id) {
        rollbackTasks.push(
          api.patch(`/warehouseStocks/${change.id}`, {
            quantity: change.quantityBefore,
            updatedAt: new Date().toISOString(),
          }),
        );
      }
    });

    const results = await Promise.allSettled(rollbackTasks);

    const failed = results.filter((result) => result.status === "rejected");

    if (failed.length) {
      console.error("Some rollback operations failed:", failed);
      throw new Error(
        "حدث خطأ أثناء التراجع عن بعض العمليات. راجع البيانات قبل إعادة المحاولة.",
      );
    }
  }

  /* =====================================================
     SAVE
  ===================================================== */

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    if (!companyId || !currentUser) {
      toast.error("لم يتم تحديد الشركة أو المستخدم");
      return;
    }

    if (!date) {
      toast.error("حدد تاريخ الرصيد الافتتاحي");
      return;
    }

    if (!lines.length) {
      toast.error("أضف صنفاً واحداً على الأقل");
      return;
    }

    // التأكد من وجود الحسابات المحاسبية
    if (!inventoryAccount) {
      toast.error(
        "حساب المخزون 1104 غير موجود أو غير قابل للترحيل في دليل حسابات الشركة",
      );
      return;
    }

    if (!capitalAccount) {
      toast.error(
        "حساب رأس المال 3101 غير موجود أو غير قابل للترحيل في دليل حسابات الشركة",
      );
      return;
    }

    const selectedKeys = lines.map(
      (line) => `${line.productId}_${line.warehouseId}`,
    );

    if (selectedKeys.some((key) => key.startsWith("_") || key.endsWith("_"))) {
      toast.error("حدد الصنف والمستودع لكل سطر");
      return;
    }

    if (new Set(selectedKeys).size !== selectedKeys.length) {
      toast.error("لا يمكن تكرار الصنف في المستودع نفسه");
      return;
    }

    // التحقق من جميع الأسطر قبل بدء الحفظ
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const quantity = number(line.quantity);
      const unitCost = number(line.unitCost);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        toast.error(`أدخل كمية صحيحة في السطر ${i + 1}`);
        return;
      }

      if (!Number.isFinite(unitCost) || unitCost < 0) {
        toast.error(`تكلفة الوحدة غير صحيحة في السطر ${i + 1}`);
        return;
      }

      const product = products.find(
        (item) => String(item.id) === line.productId,
      );

      const warehouse = warehouses.find(
        (item) => String(item.id) === line.warehouseId,
      );

      if (!product || !warehouse) {
        toast.error(`الصنف أو المستودع في السطر ${i + 1} غير صالح`);
        return;
      }

      const alreadyExists = movements.some(
        (movement) =>
          String(movement.productId) === line.productId &&
          String(movement.warehouseId) === line.warehouseId,
      );

      if (alreadyExists) {
        toast.error(
          `تم تسجيل رصيد افتتاحي مسبقاً للصنف ${product.name} في المستودع ${warehouse.name}`,
        );
        return;
      }
    }

    const username = getCookie("username");

    if (!username) {
      toast.error("تعذر تحديد المستخدم الحالي");
      return;
    }

    setSaving(true);

    const createdMovementIds: (string | number)[] = [];
    const createdJournalLineIds: (string | number)[] = [];

    let createdJournalId: string | number | null = null;

    const stockChanges: {
      id: string | null;
      created: boolean;
      quantityBefore: number;
      productId: string;
      warehouseId: string;
    }[] = [];

    try {
      // إعادة التحقق من المستخدم قبل الحفظ
      const userResponse = await api.get<CurrentUser[]>("/users", {
        params: { username },
      });

      const user = userResponse.data.find((item) => item.username === username);

      if (
        !user ||
        String(user.companyId) !== companyId ||
        user.type === "platform"
      ) {
        throw new Error("تعذر التحقق من المستخدم أو الشركة");
      }

      // التحقق من هوية المستخدم المستخدمة في سجل النشاط
      validateCurrentActor(user);

      const actorName = user.fullName || user.name || user.username;

      const actorId = String(user.id);
      const actorRole = user.role || user.type;

      const referenceNumber = reference.trim() || createReferenceNumber();

      const createdAt = new Date().toISOString();

      // تجميع إجمالي قيمة المستند
      const documentTotal = lines.reduce(
        (sum, line) => sum + number(line.quantity) * number(line.unitCost),
        0,
      );

      if (!Number.isFinite(documentTotal) || documentTotal <= 0) {
        throw new Error("إجمالي تكلفة الأرصدة غير صحيح");
      }

      /* ================================================
         1. إنشاء الحركات المخزنية وتحديث الأرصدة
      ================================================ */

      for (const line of lines) {
        const product = products.find(
          (item) => String(item.id) === line.productId,
        );

        const warehouse = warehouses.find(
          (item) => String(item.id) === line.warehouseId,
        );

        if (!product || !warehouse) {
          throw new Error("تعذر العثور على الصنف أو المستودع");
        }

        const quantity = number(line.quantity);
        const unitCost = number(line.unitCost);
        const totalLineCost = quantity * unitCost;

        const currentStock = stocks.find(
          (item) =>
            String(item.productId) === line.productId &&
            String(item.warehouseId) === line.warehouseId,
        );

        // بيانات حركة المخزون
        const movementPayload = {
          ...getCreateActivity(),

          companyId,

          productId: String(product.id),
          productName: product.name,
          productSKU: product.sku || "",

          warehouseId: String(warehouse.id),
          warehouseName: warehouse.name,

          type: "opening_balance",

          quantity,
          unitName: product.unitName || "",

          unitCost,
          totalCost: totalLineCost,

          referenceType: "opening_balance",
          referenceNumber,
          referenceId: referenceNumber,

          date,
          notes: notes.trim(),

          createdBy: actorId,
          createdByName: actorName,
          createdByUsername: username,
          createdByRole: actorRole,
          createdAt,
        };

        // تسجيل الحركة المخزنية
        const movementResponse = await api.post(
          "/inventoryMovements",
          movementPayload,
        );

        createdMovementIds.push(movementResponse.data.id);

        // تحديث رصيد المستودع
        const quantityBefore = currentStock ? number(currentStock.quantity) : 0;

        const newQuantity = quantityBefore + quantity;

        if (currentStock) {
          await api.patch(`/warehouseStocks/${currentStock.id}`, {
            quantity: newQuantity,

            updatedBy: actorId,
            updatedByName: actorName,
            updatedByUsername: username,
            updatedByRole: actorRole,

            updatedAt: new Date().toISOString(),
          });

          stockChanges.push({
            id: String(currentStock.id),
            created: false,
            quantityBefore,
            productId: String(product.id),
            warehouseId: String(warehouse.id),
          });
        } else {
          const stockResponse = await api.post("/warehouseStocks", {
            ...getCreateActivity(),

            companyId,
            productId: String(product.id),
            warehouseId: String(warehouse.id),

            quantity: newQuantity,

            createdBy: actorId,
            createdByName: actorName,
            createdAt,

            updatedBy: actorId,
            updatedByName: actorName,
            updatedAt: createdAt,
          });

          stockChanges.push({
            id: String(stockResponse.data.id),
            created: true,
            quantityBefore: 0,
            productId: String(product.id),
            warehouseId: String(warehouse.id),
          });
        }
      }

      /* ================================================
         2. إنشاء رأس القيد المحاسبي
      ================================================ */

      const entryNumber = createEntryNumber();

      const journalPayload: Omit<Journal, "id"> = {
        ...getCreateActivity(),

        companyId,

        entryNumber,

        date,

        description: `إثبات الأرصدة الافتتاحية للمخزون - ${referenceNumber}`,

        referenceType: "opening_balance",
        referenceId: referenceNumber,

        status: "posted",

        totalDebit: documentTotal,
        totalCredit: documentTotal,

        createdBy: actorId,
        createdByName: actorName,
        createdAt,
      };

      const journalResponse = await api.post("/journals", journalPayload);

      createdJournalId = journalResponse.data.id;

      /* ================================================
         3. إنشاء تفاصيل القيد المحاسبي
      ================================================ */

      const journalLines: Omit<JournalLine, "id">[] = [
        {
          ...getCreateActivity(),

          journalId: createdJournalId,
          companyId,

          accountId: inventoryAccount.id,
          accountCode: inventoryAccount.code,
          accountName: inventoryAccount.name,

          date,

          debit: documentTotal,
          credit: 0,

          description: `إثبات قيمة المخزون الافتتاحي - ${referenceNumber}`,

          createdBy: actorId,
          createdByName: actorName,
          createdAt,
        },

        {
          ...getCreateActivity(),

          journalId: createdJournalId,
          companyId,

          accountId: capitalAccount.id,
          accountCode: capitalAccount.code,
          accountName: capitalAccount.name,

          date,

          debit: 0,
          credit: documentTotal,

          description: `مقابل الأرصدة الافتتاحية للمخزون - ${referenceNumber}`,

          createdBy: actorId,
          createdByName: actorName,
          createdAt,
        },
      ];

      for (const journalLine of journalLines) {
        const response = await api.post("/journalLines", journalLine);

        createdJournalLineIds.push(response.data.id);
      }

      /* ================================================
         4. تسجيل النشاط
      ================================================ */

      const activityData = {
        referenceNumber,
        date,
        totalQuantity,
        totalCost: documentTotal,
        lines: lines.map((line) => {
          const product = products.find(
            (item) => String(item.id) === line.productId,
          );

          const warehouse = warehouses.find(
            (item) => String(item.id) === line.warehouseId,
          );

          return {
            productId: line.productId,
            productName: product?.name || "",
            warehouseId: line.warehouseId,
            warehouseName: warehouse?.name || "",
            quantity: number(line.quantity),
            unitCost: number(line.unitCost),
            totalCost: number(line.quantity) * number(line.unitCost),
          };
        }),
      };

      // لا نلغي العملية المحاسبية إذا تعذر تسجيل النشاط.
      const activityResults = await Promise.allSettled([
        logCreate(
          "الأرصدة الافتتاحية",
          `إضافة أرصدة افتتاحية للمخزون بالمرجع ${referenceNumber}`,
          String(createdJournalId),
          referenceNumber,
          activityData,
        ),

        logCreate(
          "القيود المحاسبية",
          `إنشاء قيد افتتاحي للمخزون رقم ${entryNumber}`,
          String(createdJournalId),
          entryNumber,
          {
            referenceNumber,
            totalDebit: documentTotal,
            totalCredit: documentTotal,
            journalId: createdJournalId,
            journalLineIds: createdJournalLineIds,
          },
        ),
      ]);

      activityResults.forEach((result) => {
        if (result.status === "rejected") {
          console.error("Activity log error:", result.reason);
        }
      });

      /* ================================================
         5. SUCCESS
      ================================================ */

      toast.success("تم تسجيل الأرصدة الافتتاحية وترحيل القيد المحاسبي بنجاح");

      setShowForm(false);

      setLines([{ ...emptyLine }]);

      setReference("");
      setNotes("");
      setDate(today());

      await loadData();
    } catch (error) {
      console.error("Opening balance save error:", error);

      // التراجع عن العمليات إذا فشلت أي خطوة من خطوات الحفظ
      try {
        await rollbackChanges({
          movementIds: createdMovementIds,
          journalId: createdJournalId,
          journalLineIds: createdJournalLineIds,
          stockChanges,
        });
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);

        toast.error(
          "فشلت العملية، كما تعذر التراجع الكامل. راجع الحركات والقيود قبل المحاولة مجدداً.",
          {
            duration: 8000,
          },
        );

        setSaving(false);
        return;
      }

      toast.error(
        getErrorMessage(error, "حدث خطأ أثناء حفظ الأرصدة الافتتاحية"),
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredMovements = movements.filter((movement) => {
    const searchText = search.toLowerCase();

    return (
      movement.productName?.toLowerCase().includes(searchText) ||
      movement.productSKU?.toLowerCase().includes(searchText) ||
      movement.warehouseName?.toLowerCase().includes(searchText) ||
      movement.referenceNumber?.toLowerCase().includes(searchText)
    );
  });

  /* =====================================================
     STATS
  ===================================================== */

  const totalOpeningQuantity = movements.reduce(
    (sum, item) => sum + number(item.quantity),
    0,
  );

  const totalOpeningCost = movements.reduce(
    (sum, item) => sum + number(item.totalCost),
    0,
  );

  /* =====================================================
     STYLES
  ===================================================== */

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <FiRefreshCw className="animate-spin" size={22} />
          جاري تحميل الأرصدة الافتتاحية...
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div
        dir="rtl"
        className="m-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"
      >
        <div className="flex items-center gap-2 font-bold">
          <FiAlertCircle size={22} />
          تعذر فتح صفحة الأرصدة الافتتاحية
        </div>

        <p className="mt-2 text-sm">
          تحقق من تسجيل الدخول وربط المستخدم بالشركة.
        </p>
      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 text-sm text-slate-400">
            المخزون / الأرصدة الافتتاحية
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            الأرصدة الافتتاحية
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            تحديد الكميات والتكاليف الأولية للأصناف في المستودعات.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <FiPlus size={18} />
          إضافة رصيد افتتاحي
        </button>
      </div>

      {/* ACCOUNTING STATUS */}

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="mt-0.5 text-blue-600" size={20} />

          <div>
            <p className="font-bold text-blue-900">
              الربط المحاسبي للأرصدة الافتتاحية
            </p>

            <p className="mt-1 text-sm text-blue-800">
              سيتم ترحيل قيمة المخزون إلى حساب 1104، ومقابلها إلى حساب رأس المال
              3101، مع ربط القيد بالمستخدم الذي نفّذ العملية.
            </p>

            <p className="mt-2 text-xs text-blue-700">
              المستخدم الحالي:{" "}
              {currentUser?.fullName ||
                currentUser?.name ||
                currentUser?.username}
            </p>
          </div>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">عدد الحركات</p>

              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {movements.length}
              </h3>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FiPackage size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي الكميات</p>

              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {money(totalOpeningQuantity)}
              </h3>
            </div>

            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <FiPackage size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي تكلفة الرصيد</p>

              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {money(totalOpeningCost)}
              </h3>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <FiDollarSign size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">عدد المستودعات</p>

              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {warehouses.length}
              </h3>
            </div>

            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <IoHourglassOutline size={23} />
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center">
          <div>
            <h2 className="font-bold text-slate-800">سجل الأرصدة الافتتاحية</h2>

            <p className="mt-1 text-xs text-slate-500">
              الحركات المسجلة للشركة الحالية
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <FiSearch
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={17}
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث عن صنف أو مستودع..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pr-10 pl-3 text-sm outline-none focus:border-blue-500 sm:w-64"
              />
            </div>

            <button
              onClick={() => loadData()}
              className="rounded-xl border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50"
              title="تحديث"
            >
              <FiRefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4">الصنف</th>
                <th className="px-5 py-4">المستودع</th>
                <th className="px-5 py-4">الكمية</th>
                <th className="px-5 py-4">تكلفة الوحدة</th>
                <th className="px-5 py-4">إجمالي التكلفة</th>
                <th className="px-5 py-4">التاريخ</th>
                <th className="px-5 py-4">المرجع</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredMovements.map((movement) => (
                <tr key={movement.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-800">
                      {movement.productName}
                    </div>

                    <div className="mt-1 text-xs text-slate-400">
                      {movement.productSKU || "-"}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {movement.warehouseName}
                  </td>

                  <td className="px-5 py-4 font-semibold text-slate-800">
                    {money(movement.quantity)}
                    <span className="mr-1 text-xs text-slate-400">
                      {movement.unitName}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {money(number(movement.unitCost))}
                  </td>

                  <td className="px-5 py-4 font-semibold text-green-700">
                    {money(number(movement.totalCost))}
                  </td>

                  <td className="px-5 py-4 text-slate-600">{movement.date}</td>

                  <td className="px-5 py-4 text-slate-500">
                    {movement.referenceNumber || "-"}
                  </td>
                </tr>
              ))}

              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <FiPackage
                      size={35}
                      className="mx-auto mb-3 text-slate-300"
                    />

                    <p className="font-semibold text-slate-500">
                      لا توجد أرصدة افتتاحية مسجلة
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      ابدأ بإضافة رصيد افتتاحي للأصناف والمستودعات.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD FORM MODAL */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3">
          <div className="my-auto w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  إضافة الأرصدة الافتتاحية
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  أدخل الكميات والتكاليف لكل صنف ومستودع.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="max-h-[70vh] space-y-6 overflow-y-auto p-5">
                {/* BASIC INFORMATION */}

                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="mb-4 font-bold text-slate-800">
                    بيانات المستند
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className={labelClass}>
                        <span className="inline-flex items-center gap-2">
                          <FiCalendar />
                          تاريخ الرصيد
                        </span>
                      </label>

                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <label className={labelClass}>رقم المرجع</label>

                      <input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="مثال: OPN-001"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>ملاحظات</label>

                      <input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="ملاحظات المستند..."
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* LINES */}

                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-4">
                    <div>
                      <h3 className="font-bold text-slate-800">
                        الأصناف والأرصدة
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        يمكنك إضافة أكثر من صنف ومستودع في المستند نفسه.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addLine}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      <FiPlus />
                      إضافة صنف
                    </button>
                  </div>

                  <div className="space-y-4 p-4">
                    {lines.map((line, index) => {
                      const product = products.find(
                        (item) => String(item.id) === line.productId,
                      );

                      const currentStock =
                        line.productId && line.warehouseId
                          ? getCurrentStock(line.productId, line.warehouseId)
                          : 0;

                      const lineTotal =
                        number(line.quantity) * number(line.unitCost);

                      return (
                        <div
                          key={index}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                              الصنف رقم {index + 1}
                            </span>

                            <button
                              type="button"
                              onClick={() => removeLine(index)}
                              className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                              title="حذف السطر"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <label className={labelClass}>الصنف</label>

                              <select
                                value={line.productId}
                                onChange={(e) =>
                                  updateLine(index, "productId", e.target.value)
                                }
                                className={inputClass}
                                required
                              >
                                <option value="">اختر الصنف</option>

                                {products.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name} - {item.sku || ""}
                                  </option>
                                ))}
                              </select>

                              {product && (
                                <p className="mt-2 text-xs text-slate-400">
                                  وحدة القياس: {product.unitName || "-"}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className={labelClass}>المستودع</label>

                              <select
                                value={line.warehouseId}
                                onChange={(e) =>
                                  updateLine(
                                    index,
                                    "warehouseId",
                                    e.target.value,
                                  )
                                }
                                className={inputClass}
                                required
                              >
                                <option value="">اختر المستودع</option>

                                {warehouses.map((warehouse) => (
                                  <option
                                    key={warehouse.id}
                                    value={warehouse.id}
                                  >
                                    {warehouse.name}
                                  </option>
                                ))}
                              </select>

                              {line.productId && line.warehouseId && (
                                <p className="mt-2 text-xs text-slate-400">
                                  الرصيد الحالي: {money(currentStock)}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className={labelClass}>
                                الكمية الافتتاحية
                              </label>

                              <input
                                type="number"
                                min="0.001"
                                step="any"
                                value={line.quantity}
                                onChange={(e) =>
                                  updateLine(index, "quantity", e.target.value)
                                }
                                placeholder="0"
                                className={inputClass}
                                required
                              />
                            </div>

                            <div>
                              <label className={labelClass}>تكلفة الوحدة</label>

                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={line.unitCost}
                                onChange={(e) =>
                                  updateLine(index, "unitCost", e.target.value)
                                }
                                placeholder="0.00"
                                className={inputClass}
                                required
                              />
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
                            <div className="text-xs text-slate-500">
                              إجمالي تكلفة هذا الصنف
                            </div>

                            <div className="font-bold text-green-700">
                              {money(lineTotal)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ACCOUNTING PREVIEW */}

                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="mb-3 font-bold text-slate-800">
                    المعالجة المحاسبية المتوقعة
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[450px] text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-4 py-3 text-right">الحساب</th>
                          <th className="px-4 py-3 text-left">مدين</th>
                          <th className="px-4 py-3 text-left">دائن</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">
                              {inventoryAccount?.name || "المخزون"}
                            </div>

                            <div className="text-xs text-slate-400">1104</div>
                          </td>

                          <td className="px-4 py-3 text-left font-semibold text-blue-700">
                            {money(totalCost)}
                          </td>

                          <td className="px-4 py-3 text-left">-</td>
                        </tr>

                        <tr>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">
                              {capitalAccount?.name || "رأس المال"}
                            </div>

                            <div className="text-xs text-slate-400">3101</div>
                          </td>

                          <td className="px-4 py-3 text-left">-</td>

                          <td className="px-4 py-3 text-left font-semibold text-green-700">
                            {money(totalCost)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-lg bg-green-50 p-3 text-sm">
                    <span className="font-semibold text-green-800">
                      فرق القيد
                    </span>

                    <span className="font-bold text-green-800">{money(0)}</span>
                  </div>
                </div>

                {/* TOTALS */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm text-blue-700">إجمالي الكميات</p>

                    <h3 className="mt-2 text-2xl font-bold text-blue-900">
                      {money(totalQuantity)}
                    </h3>
                  </div>

                  <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                    <p className="text-sm text-green-700">
                      إجمالي تكلفة الأرصدة
                    </p>

                    <h3 className="mt-2 text-2xl font-bold text-green-800">
                      {money(totalCost)}
                    </h3>
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={saving || !inventoryAccount || !capitalAccount}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <FiRefreshCw className="animate-spin" />
                  ) : (
                    <FiSave />
                  )}

                  {saving ? "جاري الحفظ والترحيل..." : "حفظ وترحيل الأرصدة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
