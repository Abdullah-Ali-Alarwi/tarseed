"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
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
  FiAlertCircle,
  FiCheckCircle,
  FiUser,
} from "react-icons/fi";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});

type Customer = {
  id: string;
  companyId: string;
  code?: string;
  name: string;
  phone?: string;
  address?: string;
  balance?: number;
  notes?: string;
  accountCode?: string;
  accountName?: string;
  isActive?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  createdById?: string;
  updatedBy?: string;
};

type Sale = {
  id: string;
  companyId: string;
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
  type?: string;
};

type CustomerForm = {
  name: string;
  phone: string;
  address: string;
  balance: string;
  notes: string;
  accountCode: string;
  accountName: string;
};

const emptyForm: CustomerForm = {
  name: "",
  phone: "",
  address: "",
  balance: "0",
  notes: "",
  accountCode: "1201",
  accountName: "العملاء",
};

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

const getUsername = () => {
  if (typeof document === "undefined") return "";

  return (
    document.cookie
      .split("; ")
      .find((item) => item.startsWith("username="))
      ?.split("=")[1] || ""
  );
};

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

const getSaleIsCancelled = (sale: Sale) =>
  ["cancelled", "canceled", "ملغي", "ملغاة"].includes(
    String(sale.status || "").toLowerCase(),
  );

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [actor, setActor] = useState<Actor | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [form, setForm] = useState<CustomerForm>(emptyForm);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const username = getUsername();

      if (!username) {
        toast.error("لم يتم العثور على المستخدم المسجل.");
        router.push("/login");
        return;
      }

      const userResponse = await api.get("/users", {
        params: {
          username: decodeURIComponent(username),
        },
      });

      const currentUser: Actor | undefined = userResponse.data?.[0];

      if (
        !currentUser ||
        currentUser.type === "platform" ||
        !currentUser.companyId
      ) {
        toast.error("ليس لديك صلاحية الوصول إلى بيانات العملاء.");
        setCustomers([]);
        setSales([]);
        return;
      }

      setActor(currentUser);

      const [customersResponse, salesResponse] = await Promise.all([
        api.get("/customers", {
          params: { companyId: currentUser.companyId },
        }),
        api.get("/sales", {
          params: { companyId: currentUser.companyId },
        }),
      ]);

      const companyCustomers: Customer[] = (
        customersResponse.data || []
      ).filter(
        (customer: Customer) =>
          String(customer.companyId) === String(currentUser.companyId),
      );

      const companySales: Sale[] = (salesResponse.data || []).filter(
        (sale: Sale) =>
          String(sale.companyId) === String(currentUser.companyId),
      );

      // إضافة كود للعملاء القدامى الذين لا يملكون كوداً.
      const customersWithoutCode = companyCustomers.filter(
        (customer) => !customer.code,
      );

      let updatedCustomers = [...companyCustomers];

      if (customersWithoutCode.length > 0) {
        let currentCustomers = [...companyCustomers];

        for (const customer of customersWithoutCode) {
          const code = generateCustomerCode(currentCustomers);

          try {
            await api.patch(`/customers/${customer.id}`, {
              code,
            });

            const updated = {
              ...customer,
              code,
            };

            currentCustomers = currentCustomers.map((item) =>
              item.id === customer.id ? updated : item,
            );
          } catch (error) {
            console.error("Customer code update error:", error);
          }
        }

        updatedCustomers = currentCustomers;
      }

      updatedCustomers.sort((a, b) =>
        String(a.name).localeCompare(String(b.name), "ar"),
      );

      setCustomers(updatedCustomers);
      setSales(companySales);
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء تحميل بيانات العملاء.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const getCustomerSales = (customerId: string) =>
    sales.filter(
      (sale) =>
        String(sale.customerId) === String(customerId) &&
        !getSaleIsCancelled(sale),
    );

  const getCustomerStatistics = (customerId: string) => {
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
  };

  const statistics = useMemo(() => {
    const activeCustomers = customers.filter(
      (customer) =>
        customer.isActive !== false && customer.status !== "inactive",
    );

    const totalSales = customers.reduce(
      (sum, customer) => sum + getCustomerStatistics(customer.id).total,
      0,
    );

    const totalBalance = customers.reduce(
      (sum, customer) => sum + Number(customer.balance || 0),
      0,
    );

    return {
      total: customers.length,
      active: activeCustomers.length,
      sales: totalSales,
      balance: totalBalance,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, sales]);

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
      balance: String(customer.balance || 0),
      notes: customer.notes || "",
      accountCode: customer.accountCode || "1201",
      accountName: customer.accountName || "العملاء",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCustomer(null);
    setForm(emptyForm);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!actor?.companyId) {
      toast.error("تعذر تحديد الشركة.");
      return;
    }

    if (!form.name.trim()) {
      toast.error("يرجى إدخال اسم العميل.");
      return;
    }

    try {
      setSaving(true);

      const now = new Date().toISOString();

      if (editingCustomer) {
        const payload = {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          balance: Number(form.balance || 0),
          notes: form.notes.trim(),
          accountCode: form.accountCode,
          accountName: form.accountName,
          updatedAt: now,
          updatedBy: actor.fullName || actor.name || actor.username,
        };

        await api.patch(`/customers/${editingCustomer.id}`, payload);

        toast.success("تم تحديث بيانات العميل بنجاح.");
      } else {
        // جلب أحدث قائمة قبل إنشاء الكود لتجنب تكراره قدر الإمكان.
        const response = await api.get("/customers", {
          params: {
            companyId: actor.companyId,
          },
        });

        const latestCustomers: Customer[] = (response.data || []).filter(
          (customer: Customer) =>
            String(customer.companyId) === String(actor.companyId),
        );

        const code = generateCustomerCode(latestCustomers);

        const payload = {
          id: `customer-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

          companyId: actor.companyId,
          code,

          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          balance: Number(form.balance || 0),
          notes: form.notes.trim(),

          accountCode: form.accountCode,
          accountName: form.accountName,

          isActive: true,
          status: "active",

          createdAt: now,
          updatedAt: now,

          createdBy: actor.fullName || actor.name || actor.username,
          createdById: actor.id,
        };

        await api.post("/customers", payload);

        toast.success("تم إضافة العميل بنجاح.");
      }

      closeModal();
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء حفظ بيانات العميل.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    const customerSales = getCustomerSales(customer.id);

    if (customerSales.length > 0) {
      toast.error("لا يمكن حذف العميل لوجود فواتير مبيعات مرتبطة به.");
      return;
    }

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف العميل "${customer.name}"؟`,
    );

    if (!confirmed) return;

    try {
      await api.delete(`/customers/${customer.id}`);

      setCustomers((prev) => prev.filter((item) => item.id !== customer.id));

      toast.success("تم حذف العميل بنجاح.");
    } catch (error) {
      console.error(error);
      toast.error("تعذر حذف العميل.");
    }
  };

  const toggleStatus = async (customer: Customer) => {
    try {
      const isActive =
        customer.isActive === false || customer.status === "inactive";

      const newStatus = !isActive;

      await api.patch(`/customers/${customer.id}`, {
        isActive: newStatus,
        status: newStatus ? "active" : "inactive",
        updatedAt: new Date().toISOString(),
        updatedBy: actor?.fullName || actor?.username,
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
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحديث حالة العميل.");
    }
  };

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
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
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
          title="أرصدة العملاء"
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
            <table className="w-full min-w-[1000px] text-right text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-4">كود العميل</th>
                  <th className="px-5 py-4">اسم العميل</th>
                  <th className="px-5 py-4">رقم الهاتف</th>
                  <th className="px-5 py-4">الفواتير</th>
                  <th className="px-5 py-4">إجمالي المبيعات</th>
                  <th className="px-5 py-4">المدفوع</th>
                  <th className="px-5 py-4">المتبقي</th>
                  <th className="px-5 py-4">الحالة</th>
                  <th className="px-5 py-4">الإجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((customer) => {
                  const stats = getCustomerStatistics(customer.id);

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
            {/* Modal Header */}
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
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave}>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <FormField label="اسم العميل" required icon={<FiUser />}>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="أدخل اسم العميل"
                    className="form-input"
                  />
                </FormField>

                <FormField label="رقم الهاتف" icon={<FiPhone />}>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="رقم الهاتف"
                    className="form-input"
                  />
                </FormField>

                <FormField label="العنوان" icon={<FiMapPin />}>
                  <input
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="عنوان العميل"
                    className="form-input"
                  />
                </FormField>

                <FormField label="الرصيد الافتتاحي" icon={<FiDollarSign />}>
                  <input
                    type="number"
                    step="0.01"
                    value={form.balance}
                    onChange={(e) =>
                      setForm({ ...form, balance: e.target.value })
                    }
                    className="form-input"
                  />
                </FormField>

                <FormField label="كود الحساب المحاسبي" icon={<FiFileText />}>
                  <input
                    value={form.accountCode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        accountCode: e.target.value,
                      })
                    }
                    className="form-input"
                  />
                </FormField>

                <FormField label="اسم الحساب المحاسبي" icon={<FiFileText />}>
                  <input
                    value={form.accountName}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        accountName: e.target.value,
                      })
                    }
                    className="form-input"
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="ملاحظات" icon={<FiFileText />}>
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      placeholder="ملاحظات إضافية عن العميل..."
                      className="form-input resize-none"
                    />
                  </FormField>
                </div>
              </div>

              {/* Modal Footer */}
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
      `}</style>
    </div>
  );
}

/* Statistics Card */

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
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

/* Form Field */

function FormField({
  label,
  children,
  icon,
  required,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
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
