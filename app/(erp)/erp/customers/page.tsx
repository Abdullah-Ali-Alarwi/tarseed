"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode, FormEvent } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiUsers,
  FiDollarSign,
  FiShoppingBag,
  FiX,
  FiSave,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiCheckCircle,
  FiUser,
} from "react-icons/fi";

import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type Customer,
} from "@/lib/api/customers";

import { getAccounts } from "@/lib/api/accounts";

import {
  getOpeningEntries,
  createOpeningEntry,
  type OpeningEntry,
} from "@/lib/api/openingEntries";

import { supabase } from "@/lib/supabase";

/* =====================================================
   TYPES
===================================================== */

type Sale = {
  id: string;
  companyId: string | number;
  customerId?: string;

  total?: number;
  totalAmount?: number;
  grandTotal?: number;

  paidAmount?: number;
  remainingAmount?: number;

  status?: string;
};

type Actor = {
  id: string;
  username: string;
  companyId: string;

  name?: string;
  fullName?: string;

  type: "platform" | "erp" | "owner";

  is_active?: boolean;
  isActive?: boolean;
  status?: string;
};

type CustomerForm = {
  name: string;
  phone: string;
  address: string;
  balance: string;
  notes: string;
};

type Account = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type?: string;
  nature?: string;
  parentId?: string | null;
  entityType?: string;
  entityId?: string;
  isActive?: boolean;
  isGroup?: boolean;
};

/* =====================================================
   CONSTANTS
===================================================== */

const emptyForm: CustomerForm = {
  name: "",
  phone: "",
  address: "",
  balance: "0",
  notes: "",
};

/* =====================================================
   HELPERS
===================================================== */

const money = (value: number) =>
  new Intl.NumberFormat("ar-YE", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const getSaleTotal = (sale: Sale) =>
  Number(sale.total ?? sale.totalAmount ?? sale.grandTotal ?? 0);

const getSalePaid = (sale: Sale) => Number(sale.paidAmount ?? 0);

const getSaleRemaining = (sale: Sale) =>
  Number(
    sale.remainingAmount ?? Math.max(getSaleTotal(sale) - getSalePaid(sale), 0),
  );

const getSaleIsCancelled = (sale: Sale) =>
  ["cancelled", "canceled", "ملغي", "ملغاة"].includes(
    String(sale.status || "").toLowerCase(),
  );

const generateCustomerCode = (customers: Customer[]) => {
  const numbers = customers
    .map((customer) => {
      const match = customer.code?.match(/^CUS-(\d+)$/);
      return match ? Number(match[1]) : 0;
    })
    .filter((number) => number > 0);

  const nextNumber = Math.max(0, ...numbers) + 1;

  return `CUS-${String(nextNumber).padStart(4, "0")}`;
};

const logError = (title: string, error: any) => {
  console.error(title);

  if (error instanceof Error) {
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("Cause:", error.cause);
  }

  if (error && typeof error === "object") {
    console.error("Error details:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      status: error.status,
      name: error.name,
    });
  }

  console.error("Raw error:", error);

  try {
    console.error(
      "Serialized error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    );
  } catch {
    console.error("Could not serialize error.");
  }
};

/* =====================================================
   AUTH
===================================================== */

const getStoredUser = (): Actor | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("authUser");

    if (!stored) return null;

    const user = JSON.parse(stored);

    if (
      !user ||
      typeof user !== "object" ||
      Array.isArray(user) ||
      !user.id ||
      !user.companyId ||
      !["erp", "owner"].includes(user.type)
    ) {
      return null;
    }

    if (
      user.is_active === false ||
      user.isActive === false ||
      (user.status && user.status !== "active")
    ) {
      return null;
    }

    return {
      id: String(user.id),
      username: String(user.username || ""),
      companyId: String(user.companyId),

      name: user.name,
      fullName: user.fullName,

      type: user.type,

      is_active: user.is_active,
      isActive: user.isActive,
      status: user.status,
    };
  } catch {
    return null;
  }
};

/* =====================================================
   PAGE
===================================================== */

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [openingEntries, setOpeningEntries] = useState<OpeningEntry[]>([]);

  const [actor, setActor] = useState<Actor | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [form, setForm] = useState<CustomerForm>(emptyForm);

  /* =====================================================
     CUSTOMER ACCOUNT
  ===================================================== */

  const getCustomerAccount = useCallback(
    (customerId: string) => {
      return (
        accounts.find(
          (account) =>
            account.entityType === "customer" &&
            String(account.entityId) === String(customerId),
        ) || null
      );
    },
    [accounts],
  );

  /* =====================================================
     CUSTOMER OPENING BALANCE
  ===================================================== */

  const getCustomerOpeningBalance = useCallback(
    (customerId: string) => {
      const account = getCustomerAccount(customerId);

      if (!account) return 0;

      return openingEntries
        .filter(
          (entry) => String(entry.extra?.accountId) === String(account.id),
        )
        .reduce(
          (sum, entry) =>
            sum +
            Number(entry.extra?.debit || 0) -
            Number(entry.extra?.credit || 0),
          0,
        );
    },
    [openingEntries, getCustomerAccount],
  );

  const hasCustomerOpeningEntry = useCallback(
    (customerId: string) => {
      const account = getCustomerAccount(customerId);

      if (!account) return false;

      return openingEntries.some(
        (entry) => String(entry.extra?.accountId) === String(account.id),
      );
    },
    [openingEntries, getCustomerAccount],
  );

  /* =====================================================
     LOAD DATA
  ===================================================== */

  const loadData = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const currentUser = getStoredUser();

        if (!currentUser) {
          toast.error("تعذر التحقق من المستخدم أو الشركة.");
          router.push("/login");
          return;
        }

        setActor(currentUser);

        const companyId = String(currentUser.companyId);

        // تحميل العملاء
        const companyCustomers = await getCustomers(companyId);

        companyCustomers.sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""), "ar"),
        );

        setCustomers(companyCustomers);

        // تحميل الحسابات
        const companyAccounts = await getAccounts(companyId);

        setAccounts(companyAccounts as Account[]);

        // تحميل الأرصدة الافتتاحية
        const entries = await getOpeningEntries(companyId);

        setOpeningEntries(entries);

        // تحميل المبيعات
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select("*")
          .eq("companyId", companyId);

        if (salesError) {
          logError("Sales query error:", salesError);

          setSales([]);

          toast.error("تم تحميل العملاء، لكن تعذر تحميل المبيعات.");
        } else {
          setSales(
            (salesData || []).filter(
              (sale: Sale) => String(sale.companyId) === companyId,
            ),
          );
        }
      } catch (error: any) {
        logError("Customers load error:", error);

        toast.error(error?.message || "حدث خطأ أثناء تحميل بيانات العملاء.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredCustomers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return customers;

    return customers.filter((customer) =>
      [customer.name, customer.code, customer.phone, customer.address].some(
        (field) =>
          String(field || "")
            .toLowerCase()
            .includes(value),
      ),
    );
  }, [customers, search]);

  /* =====================================================
     CUSTOMER SALES
  ===================================================== */

  const getCustomerSales = useCallback(
    (customerId: string) =>
      sales.filter(
        (sale) =>
          String(sale.customerId) === String(customerId) &&
          !getSaleIsCancelled(sale),
      ),
    [sales],
  );

  const getCustomerStatistics = useCallback(
    (customerId: string) => {
      const customerSales = getCustomerSales(customerId);

      return {
        count: customerSales.length,

        total: customerSales.reduce((sum, sale) => sum + getSaleTotal(sale), 0),

        paid: customerSales.reduce((sum, sale) => sum + getSalePaid(sale), 0),

        remaining: customerSales.reduce(
          (sum, sale) => sum + getSaleRemaining(sale),
          0,
        ),
      };
    },
    [getCustomerSales],
  );

  /* =====================================================
     STATISTICS
  ===================================================== */

  const statistics = useMemo(() => {
    const activeCustomers = customers.filter(
      (customer) =>
        customer.isActive !== false && customer.status !== "inactive",
    );

    const totalSales = customers.reduce(
      (sum, customer) => sum + getCustomerStatistics(customer.id!).total,
      0,
    );

    const totalBalance = customers.reduce(
      (sum, customer) =>
        sum + Math.max(getCustomerOpeningBalance(customer.id || ""), 0),
      0,
    );

    return {
      total: customers.length,
      active: activeCustomers.length,
      sales: totalSales,
      balance: totalBalance,
    };
  }, [customers, getCustomerStatistics, getCustomerOpeningBalance]);

  /* =====================================================
     MODAL
  ===================================================== */

  const openCreateModal = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);

    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      balance: "0",
      notes: customer.notes || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCustomer(null);
    setForm(emptyForm);
  };

  /* =====================================================
     SAVE CUSTOMER
  ===================================================== */

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!actor?.companyId) {
      toast.error("تعذر تحديد الشركة.");
      return;
    }

    if (!form.name.trim()) {
      toast.error("يرجى إدخال اسم العميل.");
      return;
    }

    const openingBalance = Number(form.balance);

    if (!Number.isFinite(openingBalance) || openingBalance < 0) {
      toast.error("يرجى إدخال رصيد صحيح.");
      return;
    }

    try {
      setSaving(true);

      const now = new Date().toISOString();

      const actorName = actor.fullName || actor.name || actor.username;

      const companyId = String(actor.companyId);

      /* =========================
         UPDATE CUSTOMER
      ========================= */

      if (editingCustomer?.id) {
        await updateCustomer(editingCustomer.id, companyId, {
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          notes: form.notes.trim() || null,
          updatedAt: now,
          updatedBy: actorName,
        });

        toast.success("تم تحديث بيانات العميل بنجاح.");
      } else {
        /* =========================
           CREATE CUSTOMER
        ========================= */

        const code = generateCustomerCode(customers);

        const createdCustomer = await createCustomer({
          name: form.name.trim(),

          phone: form.phone.trim() || null,

          address: form.address.trim() || null,

          // لا نخزن الرصيد المحاسبي في جدول customers
          balance: 0,

          notes: form.notes.trim() || null,

          companyId,

          code,

          isActive: true,

          status: "active",

          createdAt: now,

          updatedAt: now,

          createdBy: actorName,

          createdById: actor.id,

          updatedBy: actorName,
        } as Customer);

        /* =========================
           CREATE OPENING BALANCE
        ========================= */

        if (openingBalance > 0) {
          try {
            // إعادة تحميل الحسابات للتأكد من حساب العميل
            const refreshedAccounts = await getAccounts(companyId);

            const customerAccount = refreshedAccounts.find(
              (account: any) =>
                account.entityType === "customer" &&
                String(account.entityId) === String(createdCustomer.id),
            );

            if (!customerAccount) {
              throw new Error(
                "تم إنشاء العميل، لكن لم يتم العثور على حسابه المحاسبي تحت حساب العملاء 1103.",
              );
            }

            // التحقق من أن الحساب تابع للأصول والعملاء
            if (
              String(customerAccount.type) !== "asset" ||
              String(customerAccount.code).startsWith("2101")
            ) {
              throw new Error(
                "الحساب المرتبط بالعميل ليس حساب عملاء صحيحًا ضمن الأصول المتداولة.",
              );
            }

            await createOpeningEntry({
              companyId,

              accountId: String(customerAccount.id),

              amount: openingBalance,

              // العملاء أرصدتهم الافتتاحية مدينة
              side: "debit",

              date: new Date().toISOString().slice(0, 10),

              description: `الرصيد الافتتاحي للعميل ${form.name.trim()}`,
            });
          } catch (openingError) {
            logError("Customer opening balance error:", openingError);

            /*
             * محاولة التراجع عن إضافة العميل.
             */

            try {
              if (createdCustomer.id) {
                await deleteCustomer(String(createdCustomer.id), companyId);
              }
            } catch (rollbackError) {
              logError("Customer rollback error:", rollbackError);

              throw new Error(
                "فشل تسجيل الرصيد الافتتاحي، وتعذر التراجع عن إنشاء العميل. يرجى مراجعة العميل وحسابه المحاسبي.",
              );
            }

            throw new Error(
              openingError instanceof Error
                ? `تعذر تسجيل الرصيد الافتتاحي: ${openingError.message} تم التراجع عن إضافة العميل.`
                : "تعذر تسجيل الرصيد الافتتاحي وتم التراجع عن إضافة العميل.",
            );
          }
        }

        toast.success("تم إضافة العميل وحسابه المحاسبي بنجاح.");
      }

      setShowModal(false);
      setEditingCustomer(null);
      setForm(emptyForm);

      await loadData(true);
    } catch (error: any) {
      logError("Customer save error:", error);

      toast.error(
        error?.message ||
          error?.details ||
          error?.hint ||
          "حدث خطأ أثناء حفظ بيانات العميل. راجع Console لمعرفة التفاصيل.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE CUSTOMER
  ===================================================== */

  const handleDelete = async (customer: Customer) => {
    if (!customer.id) return;

    const customerSales = getCustomerSales(customer.id);

    if (customerSales.length > 0) {
      toast.error("لا يمكن حذف العميل لوجود فواتير مبيعات مرتبطة به.");
      return;
    }

    if (hasCustomerOpeningEntry(customer.id)) {
      toast.error(
        "لا يمكن حذف العميل لوجود رصيد افتتاحي مرتبط بحسابه. يجب معالجة الرصيد الافتتاحي أولًا.",
      );
      return;
    }

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف العميل "${customer.name}"؟`,
    );

    if (!confirmed) return;

    try {
      if (!actor?.companyId) {
        toast.error("تعذر تحديد الشركة.");
        return;
      }

      await deleteCustomer(customer.id, String(actor.companyId));

      setCustomers((prev) => prev.filter((item) => item.id !== customer.id));

      toast.success("تم حذف العميل بنجاح.");
    } catch (error: any) {
      logError("Customer delete error:", error);

      toast.error(error?.message || "تعذر حذف العميل.");
    }
  };

  /* =====================================================
     TOGGLE STATUS
  ===================================================== */

  const toggleStatus = async (customer: Customer) => {
    if (!customer.id || !actor?.companyId) {
      toast.error("تعذر تحديد العميل أو الشركة.");
      return;
    }

    try {
      const isActive =
        customer.isActive === false || customer.status === "inactive";

      const newStatus = !isActive;

      await updateCustomer(customer.id, String(actor.companyId), {
        isActive: newStatus,
        status: newStatus ? "active" : "inactive",
        updatedAt: new Date().toISOString(),
        updatedBy: actor.fullName || actor.name || actor.username,
      });

      setCustomers((prev) =>
        prev.map((item) =>
          item.id === customer.id
            ? {
                ...item,
                isActive: newStatus,
                status: newStatus ? "active" : "inactive",
              }
            : item,
        ),
      );

      toast.success(newStatus ? "تم تفعيل العميل." : "تم إيقاف العميل.");
    } catch (error: any) {
      logError("Customer status error:", error);

      toast.error(error?.message || "تعذر تحديث حالة العميل.");
    }
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/erp/dashboard" className="hover:text-blue-600">
              الرئيسية
            </Link>

            <span>/</span>

            <span className="text-slate-700">العملاء</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800">العملاء</h1>

          <p className="mt-1 text-sm text-slate-500">
            إدارة بيانات العملاء وحساباتهم ومتابعة المبيعات
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            تحديث
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <FiPlus />
            إضافة عميل
          </button>
        </div>
      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="إجمالي العملاء"
          value={money(statistics.total)}
          icon={<FiUsers />}
          color="blue"
        />

        <StatCard
          title="العملاء النشطون"
          value={money(statistics.active)}
          icon={<FiCheckCircle />}
          color="green"
        />

        <StatCard
          title="إجمالي المبيعات"
          value={money(statistics.sales)}
          icon={<FiShoppingBag />}
          color="purple"
        />

        <StatCard
          title="أرصدة العملاء الافتتاحية"
          value={money(statistics.balance)}
          icon={<FiDollarSign />}
          color="orange"
        />
      </div>

      {/* Search */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث باسم العميل أو الكود أو رقم الهاتف..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-11 pl-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
          />
        </div>
      </div>

      {/* Customers Table */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-800">قائمة العملاء</h2>

            <p className="mt-1 text-xs text-slate-500">
              عدد النتائج: {filteredCustomers.length}
            </p>
          </div>

          <Link
            href="/erp/sales/new"
            className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-100"
          >
            <FiShoppingBag />
            فاتورة مبيعات جديدة
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center gap-3 text-slate-500">
            <FiRefreshCw className="animate-spin text-xl" />
            جاري تحميل العملاء...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <FiUsers className="mx-auto mb-3 text-4xl text-slate-300" />

            <p className="font-medium text-slate-600">
              {search ? "لا توجد نتائج مطابقة للبحث" : "لا يوجد عملاء حتى الآن"}
            </p>

            {!search && (
              <button
                onClick={openCreateModal}
                className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm text-white hover:bg-blue-700"
              >
                إضافة أول عميل
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-right text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-4">كود العميل</th>
                  <th className="px-5 py-4">اسم العميل</th>
                  <th className="px-5 py-4">رقم الهاتف</th>
                  <th className="px-5 py-4">الفواتير</th>
                  <th className="px-5 py-4">إجمالي المبيعات</th>
                  <th className="px-5 py-4">المدفوع</th>
                  <th className="px-5 py-4">المتبقي</th>
                  <th className="px-5 py-4">الرصيد الافتتاحي</th>
                  <th className="px-5 py-4">الحالة</th>
                  <th className="px-5 py-4">الإجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((customer) => {
                  const stats = getCustomerStatistics(customer.id || "");

                  const openingBalance = getCustomerOpeningBalance(
                    customer.id || "",
                  );

                  const isActive =
                    customer.isActive !== false &&
                    customer.status !== "inactive";

                  return (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                          {customer.code || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/erp/customers/${customer.id}`}
                          className="font-semibold text-slate-800 transition hover:text-blue-600"
                        >
                          {customer.name}
                        </Link>

                        {customer.address && (
                          <p className="mt-1 max-w-[180px] truncate text-xs text-slate-400">
                            {customer.address}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {customer.phone || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {stats.count}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-800">
                        {money(stats.total)}
                      </td>

                      <td className="px-5 py-4 font-medium text-green-600">
                        {money(stats.paid)}
                      </td>

                      <td className="px-5 py-4 font-medium text-orange-600">
                        {money(stats.remaining)}
                      </td>

                      <td className="px-5 py-4 font-medium text-blue-600">
                        {money(getCustomerOpeningBalance(customer.id || ""))}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleStatus(customer)}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {isActive ? "نشط" : "غير نشط"}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/erp/customers/${customer.id}`}
                            title="عرض التفاصيل"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <FiEye />
                          </Link>

                          <button
                            onClick={() => openEditModal(customer)}
                            title="تعديل"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                          >
                            <FiEdit2 />
                          </button>

                          <button
                            onClick={() => handleDelete(customer)}
                            title="حذف"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
          <div className="my-6 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editingCustomer ? "تعديل بيانات العميل" : "إضافة عميل جديد"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  أدخل بيانات العميل الأساسية
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <FormField label="اسم العميل" required icon={<FiUser />}>
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    placeholder="أدخل اسم العميل"
                    className="form-input"
                  />
                </FormField>

                <FormField label="رقم الهاتف" icon={<FiPhone />}>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone: e.target.value,
                      })
                    }
                    placeholder="رقم الهاتف"
                    className="form-input"
                  />
                </FormField>

                <FormField label="العنوان" icon={<FiMapPin />}>
                  <input
                    value={form.address}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        address: e.target.value,
                      })
                    }
                    placeholder="عنوان العميل"
                    className="form-input"
                  />
                </FormField>

                <div>
                  <FormField label="الرصيد الافتتاحي" icon={<FiDollarSign />}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        editingCustomer
                          ? Math.abs(
                              getCustomerOpeningBalance(
                                editingCustomer.id || "",
                              ),
                            ).toString()
                          : form.balance
                      }
                      disabled={!!editingCustomer}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          balance: e.target.value,
                        })
                      }
                      className={`form-input ${
                        editingCustomer ? "cursor-not-allowed bg-slate-100" : ""
                      }`}
                    />
                  </FormField>

                  {editingCustomer ? (
                    <p className="mt-2 text-xs leading-5 text-amber-600">
                      تعديل الرصيد الافتتاحي يتم من شاشة الأرصدة الافتتاحية،
                      وليس من بيانات العميل.
                    </p>
                  ) : (
                    <div className="mt-3 rounded-lg bg-blue-50 p-3">
                      <p className="text-xs font-medium text-blue-700">
                        طبيعة الرصيد: مدين
                      </p>

                      <p className="mt-1 text-xs text-blue-600">
                        سيتم تسجيل الرصيد على حساب العميل ضمن الأصول المتداولة.
                      </p>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <FormField label="ملاحظات" icon={<FiFileText />}>
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          notes: e.target.value,
                        })
                      }
                      placeholder="ملاحظات إضافية عن العميل..."
                      className="form-input resize-none"
                    />
                  </FormField>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 p-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <FiRefreshCw className="animate-spin" />
                  ) : (
                    <FiSave />
                  )}

                  {saving
                    ? "جاري الحفظ..."
                    : editingCustomer
                      ? "حفظ التعديلات"
                      : "إضافة العميل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styles */}

      <style jsx>{`
        .form-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 11px 12px;
          font-size: 13px;
          color: #334155;
          outline: none;
          background: white;
          transition: all 0.2s;
        }

        .form-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
        }

        .form-input::placeholder {
          color: #94a3b8;
        }

        .form-input:disabled {
          color: #64748b;
          background: #f1f5f9;
        }
      `}</style>
    </div>
  );
}

/* =====================================================
   STATISTICS CARD
===================================================== */

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>

        <div className={`rounded-xl p-3 ${colors[color]}`}>{icon}</div>
      </div>

      <p className="mt-4 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

/* =====================================================
   FORM FIELD
===================================================== */

function FormField({
  label,
  children,
  icon,
  required,
}: {
  label: string;
  children: ReactNode;
  icon?: ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        {icon && <span className="text-slate-400">{icon}</span>}

        {label}

        {required && <span className="text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}
