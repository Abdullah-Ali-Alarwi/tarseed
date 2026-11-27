"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

import { supabase } from "@/lib/supabase";

/* =====================================================
   CONSTANTS
===================================================== */

const INVENTORY_ACCOUNT_CODE = "1104";
const CAPITAL_ACCOUNT_CODE = "3101";

/* =====================================================
   TYPES
===================================================== */

interface CurrentUser {
  id: string;
  username: string;
  name?: string;
  fullName?: string;
  role?: string;
  type: string;
  companyId: string;
  status?: string;
  isActive?: boolean;
  auth_user_id?: string;
}

interface Account {
  id: string;
  companyId: string;
  code: string;
  name: string;
  isGroup: boolean;
  isActive?: boolean;
}

interface Product {
  id: string;
  companyId: string;
  name: string;
  sku?: string;
  unitName?: string;
  status: string;
  trackInventory?: boolean;
}

interface Warehouse {
  id: string;
  companyId: string;
  name: string;
}

interface WarehouseStock {
  id: string;
  companyId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  averageCost?: number;
  unitCost?: number;
  inventoryValue?: number;
}

interface InventoryMovement {
  id: string;
  companyId: string;
  productId: string;
  productName: string;
  productSKU?: string;
  warehouseId: string;
  warehouseName: string;
  type: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  date: string;
  notes?: string;
  createdAt: string;
  extra?: {
    unitName?: string;
    unitCost?: number;
    totalCost?: number;
    createdBy?: string;
    createdByName?: string;
    createdByUsername?: string;
    createdByRole?: string;
    [key: string]: unknown;
  } | null;
}

interface OpeningLine {
  productId: string;
  warehouseId: string;
  quantity: string;
  unitCost: string;
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
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message || fallback;
  }

  return fallback;
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
     GET CURRENT AUTH USER
  ===================================================== */

  const getAuthenticatedUser = useCallback(async () => {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      throw new Error("انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مجدداً.");
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!user) {
      throw new Error("تعذر العثور على بيانات المستخدم المرتبطة بحساب Auth");
    }

    if (!user.isActive || user.status !== "active") {
      throw new Error("حساب المستخدم غير نشط");
    }

    if (user.type === "platform") {
      throw new Error("هذه الصفحة مخصصة لمستخدمي الشركات");
    }

    if (!user.companyId) {
      throw new Error("المستخدم غير مرتبط بأي شركة");
    }

    return {
      ...user,
      id: String(user.id),
      companyId: String(user.companyId),
      username: String(user.username),
    } as CurrentUser;
  }, []);

  /* =====================================================
     LOAD DATA
  ===================================================== */

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const user = await getAuthenticatedUser();

      const currentCompanyId = user.companyId;

      setCurrentUser(user);
      setCompanyId(currentCompanyId);

      const [
        productsResponse,
        warehousesResponse,
        stocksResponse,
        movementsResponse,
        accountsResponse,
      ] = await Promise.all([
        supabase
          .from("products")
          .select("id, companyId, name, sku, unitName, status, trackInventory")
          .eq("companyId", currentCompanyId)
          .eq("status", "active"),

        supabase
          .from("warehouses")
          .select("id, companyId, name")
          .eq("companyId", currentCompanyId),

        supabase
          .from("warehouseStocks")
          .select(
            "id, companyId, productId, warehouseId, quantity, averageCost, unitCost, inventoryValue",
          )
          .eq("companyId", currentCompanyId),

        supabase
          .from("inventoryMovements")
          .select("*")
          .eq("companyId", currentCompanyId)
          .eq("type", "opening_balance")
          .order("createdAt", { ascending: false }),

        supabase
          .from("accounts")
          .select("id, companyId, code, name, isGroup, isActive")
          .eq("companyId", currentCompanyId),
      ]);

      if (productsResponse.error) {
        throw productsResponse.error;
      }

      if (warehousesResponse.error) {
        throw warehousesResponse.error;
      }

      if (stocksResponse.error) {
        throw stocksResponse.error;
      }

      if (movementsResponse.error) {
        throw movementsResponse.error;
      }

      if (accountsResponse.error) {
        throw accountsResponse.error;
      }

      setProducts(
        (productsResponse.data || []).filter(
          (item) => item.trackInventory !== false,
        ) as Product[],
      );

      setWarehouses((warehousesResponse.data || []) as Warehouse[]);

      setStocks((stocksResponse.data || []) as WarehouseStock[]);

      setMovements((movementsResponse.data || []) as InventoryMovement[]);

      setAccounts(
        (accountsResponse.data || []).filter(
          (item) => item.isActive !== false,
        ) as Account[],
      );
    } catch (error) {
      console.error("Opening balances load error:", error);

      toast.error(getErrorMessage(error, "حدث خطأ أثناء تحميل البيانات"));

      setCompanyId("");
      setCurrentUser(null);

      setProducts([]);
      setWarehouses([]);
      setStocks([]);
      setMovements([]);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthenticatedUser]);

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

    if (!inventoryAccount) {
      toast.error("حساب المخزون 1104 غير موجود أو غير قابل للترحيل");
      return;
    }

    if (!capitalAccount) {
      toast.error("حساب رأس المال 3101 غير موجود أو غير قابل للترحيل");
      return;
    }

    /* ================================================
       VALIDATE LINES
    ================================================ */

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

    const documentTotal = lines.reduce(
      (sum, line) => sum + number(line.quantity) * number(line.unitCost),
      0,
    );

    if (!Number.isFinite(documentTotal) || documentTotal <= 0) {
      toast.error("إجمالي تكلفة الأرصدة غير صحيح");
      return;
    }

    setSaving(true);

    try {
      /* ================================================
         1. REVALIDATE AUTH USER
      ================================================ */

      const user = await getAuthenticatedUser();

      if (
        String(user.id) !== String(currentUser.id) ||
        String(user.companyId) !== String(companyId)
      ) {
        throw new Error("تغيرت بيانات المستخدم أو الشركة. يرجى تحديث الصفحة.");
      }

      /* ================================================
         2. PREPARE ACTOR
      ================================================ */

      const actorName = user.fullName || user.name || user.username;

      const actor = {
        userId: String(user.id),
        userName: actorName,
        username: user.username,
        userRole: user.role || user.type,
      };

      /* ================================================
         3. PREPARE REFERENCE
      ================================================ */

      const referenceNumber = reference.trim() || createReferenceNumber();

      /* ================================================
         4. PREPARE LINES
      ================================================ */

      const rpcLines = lines.map((line) => ({
        productId: line.productId,
        warehouseId: line.warehouseId,
        quantity: number(line.quantity),
        unitCost: number(line.unitCost),
      }));

      /* ================================================
         5. CALL SUPABASE RPC
      ================================================ */

      const { data, error } = await supabase.rpc(
        "create_inventory_opening_entry",
        {
          p_company_id: companyId,
          p_date: date,
          p_reference_number: referenceNumber,
          p_notes: notes.trim(),
          p_actor: actor,
          p_lines: rpcLines,
        },
      );

      if (error) {
        throw error;
      }

      if (!data || data.success !== true) {
        throw new Error(data?.message || "لم يتم تأكيد حفظ الأرصدة الافتتاحية");
      }

      /* ================================================
         6. SUCCESS
      ================================================ */

      toast.success(
        `تم تسجيل الأرصدة الافتتاحية وترحيل القيد ${data.journalNumber || ""} بنجاح`,
      );

      setShowForm(false);

      setLines([{ ...emptyLine }]);

      setReference("");
      setNotes("");
      setDate(today());

      await loadData();
    } catch (error) {
      console.error("Opening balance save error:", error);

      toast.error(
        getErrorMessage(error, "حدث خطأ أثناء حفظ الأرصدة الافتتاحية"),
        {
          duration: 7000,
        },
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
    (sum, item) => sum + number(item.extra?.totalCost),
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

        <button
          type="button"
          onClick={loadData}
          className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
        >
          إعادة المحاولة
        </button>
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
                      {movement.extra?.unitName || ""}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {money(number(movement.extra?.unitCost))}
                  </td>

                  <td className="px-5 py-4 font-semibold text-green-700">
                    {money(number(movement.extra?.totalCost))}
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
                disabled={saving}
                className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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
