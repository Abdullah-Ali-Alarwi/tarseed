"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiShoppingCart,
  FiUser,
  FiPackage,
  FiPlus,
  FiTrash2,
  FiSave,
  FiCheckCircle,
  FiRefreshCw,
  FiAlertCircle,
  FiDollarSign,
  FiSearch,
  FiFileText,
} from "react-icons/fi";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { IoCaretForwardCircleSharp } from "react-icons/io5";

type Customer = {
  id: string;
  name: string;
  balance: number | null;
};

type Warehouse = {
  id: string;
  name: string;
  isDefault?: boolean;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  unitName: string | null;
  purchasePrice: number | null;
  sellingPrice: number | null;
  currentStock: number | null;
  trackInventory: boolean | null;
  status: string | null;
};

type Stock = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  averageCost: number;
  unitCost: number;
};

type Account = {
  id: string;
  code: string;
  name: string;
};

type SaleItem = {
  productId: string;
  productName: string;
  productCode: string;
  unitName: string;
  quantity: number;
  price: number;
  purchasePrice: number;
  discount: number;
  total: number;
  available: number;
  trackInventory: boolean;
};

type AuthUser = {
  id?: string;
  companyId?: string;
  username?: string;
  fullName?: string;
  type?: string;
  role?: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const today = () => new Date().toISOString().slice(0, 10);

export default function NewSalesPage() {
  const [companyId, setCompanyId] = useState("");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [date, setDate] = useState(today());

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);

  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<SaleItem[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);

  const [companyError, setCompanyError] = useState("");

  /* تحميل بيانات المستخدم */

  useEffect(() => {
    try {
      const saved = localStorage.getItem("authUser");

      if (!saved) {
        setCompanyError("لم يتم العثور على بيانات المستخدم.");
        setLoading(false);
        return;
      }

      const user: AuthUser = JSON.parse(saved);

      if (user.type === "platform") {
        setCompanyError("لا يمكن لحساب المنصة إنشاء فاتورة مبيعات.");
        setLoading(false);
        return;
      }

      if (!user.companyId) {
        setCompanyError("لم يتم تحديد الشركة المرتبطة بالمستخدم.");
        setLoading(false);
        return;
      }

      setAuthUser(user);
      setCompanyId(user.companyId);
    } catch {
      setCompanyError("تعذر قراءة بيانات المستخدم.");
      setLoading(false);
    }
  }, []);

  /* تحميل البيانات الأساسية */

  const loadData = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);

    try {
      const [
        customersResult,
        warehousesResult,
        productsResult,
        accountsResult,
      ] = await Promise.all([
        supabase
          .from("customers")
          .select("id,name,balance")
          .eq("companyId", companyId)
          .eq("isActive", true)
          .order("name"),

        supabase
          .from("warehouses")
          .select("id,name,isDefault")
          .eq("companyId", companyId)
          .eq("status", "active")
          .order("name"),

        supabase
          .from("products")
          .select(
            "id,name,sku,unitName,purchasePrice,sellingPrice,currentStock,trackInventory,status",
          )
          .eq("companyId", companyId)
          .eq("status", "active")
          .order("name"),

        supabase
          .from("accounts")
          .select("id,code,name")
          .eq("companyId", companyId)
          .in("code", ["1101", "1102"])
          .eq("isActive", true)
          .order("code"),
      ]);

      if (customersResult.error) throw customersResult.error;
      if (warehousesResult.error) throw warehousesResult.error;
      if (productsResult.error) throw productsResult.error;
      if (accountsResult.error) throw accountsResult.error;

      const loadedWarehouses = (warehousesResult.data || []) as Warehouse[];

      setCustomers((customersResult.data || []) as Customer[]);
      setWarehouses(loadedWarehouses);
      setProducts((productsResult.data || []) as Product[]);
      setAccounts((accountsResult.data || []) as Account[]);

      if (loadedWarehouses.length) {
        setWarehouseId((previous) => {
          if (previous && loadedWarehouses.some((w) => w.id === previous)) {
            return previous;
          }

          return (
            loadedWarehouses.find((w) => w.isDefault)?.id ||
            loadedWarehouses[0].id
          );
        });
      }
    } catch (error: any) {
      console.error("Load sales data:", error);
      toast.error(error?.message || "تعذر تحميل بيانات البيع.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) loadData();
  }, [companyId, loadData]);

  /* تحميل رصيد المستودع */

  const loadWarehouseStock = useCallback(async () => {
    if (!companyId || !warehouseId) return;

    setLoadingStock(true);

    try {
      const { data, error } = await supabase
        .from("warehouseStocks")
        .select("id,productId,warehouseId,quantity,averageCost,unitCost")
        .eq("companyId", companyId)
        .eq("warehouseId", warehouseId);

      if (error) throw error;

      setStocks((data || []) as Stock[]);
    } catch (error: any) {
      console.error("Load warehouse stock:", error);
      toast.error("تعذر تحميل كميات المستودع.");
    } finally {
      setLoadingStock(false);
    }
  }, [companyId, warehouseId]);

  useEffect(() => {
    if (companyId && warehouseId) loadWarehouseStock();
  }, [companyId, warehouseId, loadWarehouseStock]);

  /* الكمية المتاحة */

  const getAvailableStock = (product: Product) => {
    if (product.trackInventory === false) return 999999;

    const stock = stocks.find((item) => item.productId === product.id);

    return Number(stock?.quantity || 0);
  };

  const getStockCost = (product: Product) => {
    const stock = stocks.find((item) => item.productId === product.id);

    return Number(
      stock?.averageCost ?? stock?.unitCost ?? product.purchasePrice ?? 0,
    );
  };

  /* الأصناف المعروضة */

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const alreadyAdded = items.some((item) => item.productId === product.id);

      if (alreadyAdded) return false;

      if (!term) return true;

      return (
        product.name.toLowerCase().includes(term) ||
        (product.sku || "").toLowerCase().includes(term)
      );
    });
  }, [products, search, items]);

  /* إضافة صنف */

  const addProduct = (product: Product) => {
    if (!warehouseId) {
      toast.error("اختر المستودع أولاً.");
      return;
    }

    const available = getAvailableStock(product);

    if (product.trackInventory !== false && available <= 0) {
      toast.error("هذا الصنف غير متوفر في المستودع المحدد.");
      return;
    }

    const purchasePrice = getStockCost(product);

    const newItem: SaleItem = {
      productId: product.id,
      productName: product.name,
      productCode: product.sku || "",
      unitName: product.unitName || "وحدة",
      quantity: 1,
      price: Number(product.sellingPrice || 0),
      purchasePrice,
      discount: 0,
      total: Number(product.sellingPrice || 0),
      available,
      trackInventory: product.trackInventory !== false,
    };

    setItems((previous) => [...previous, newItem]);
    setSearch("");
  };

  /* تعديل صنف */

  const updateItem = (
    productId: string,
    field: "quantity" | "price" | "discount",
    value: number,
  ) => {
    setItems((previous) =>
      previous.map((item) => {
        if (item.productId !== productId) return item;

        const updated = {
          ...item,
          [field]: Math.max(0, value),
        };

        updated.total = Math.max(
          0,
          updated.quantity * updated.price - updated.discount,
        );

        return updated;
      }),
    );
  };

  const removeItem = (productId: string) => {
    setItems((previous) =>
      previous.filter((item) => item.productId !== productId),
    );
  };

  /* الحسابات */

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [items],
  );

  const itemsDiscount = useMemo(
    () => items.reduce((sum, item) => sum + item.discount, 0),
    [items],
  );

  const totalDiscount = Math.min(
    subtotal,
    itemsDiscount + Math.max(0, discount),
  );

  const taxableAmount = Math.max(0, subtotal - totalDiscount);

  const tax = taxableAmount * (Math.max(0, taxRate) / 100);

  const grandTotal = taxableAmount + tax;

  const totalCost = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0),
    [items],
  );

  const profit = taxableAmount - totalCost;

  const remainingAmount = Math.max(0, grandTotal - Math.max(0, paidAmount));

  /* التحقق من الفاتورة */

  const validateInvoice = () => {
    if (!customerId) {
      toast.error("يرجى اختيار العميل.");
      return false;
    }

    if (!warehouseId) {
      toast.error("يرجى اختيار المستودع.");
      return false;
    }

    if (!items.length) {
      toast.error("أضف صنفًا واحدًا على الأقل.");
      return false;
    }

    for (const item of items) {
      if (item.quantity <= 0) {
        toast.error(`كمية ${item.productName} غير صحيحة.`);
        return false;
      }

      if (item.price < 0) {
        toast.error(`سعر ${item.productName} غير صحيح.`);
        return false;
      }

      if (item.trackInventory && item.quantity > item.available) {
        toast.error(
          `الكمية المطلوبة من ${item.productName} أكبر من المتوفر (${money(item.available)}).`,
        );
        return false;
      }
    }

    if (paymentMethod !== "credit" && !paymentAccountId) {
      toast.error("اختر حساب الصندوق أو البنك.");
      return false;
    }

    if (paidAmount < 0 || paidAmount > grandTotal) {
      toast.error("المبلغ المدفوع غير صحيح.");
      return false;
    }

    return true;
  };

  /* حفظ الفاتورة */

  const saveInvoice = async (mode: "draft" | "save" | "post") => {
    if (saving) return;

    if (!validateInvoice()) return;

    if (
      mode === "post" &&
      !window.confirm(
        "هل تريد حفظ الفاتورة وترحيلها؟ سيتم تحديث المخزون وإنشاء القيد المحاسبي.",
      )
    ) {
      return;
    }

    setSaving(true);

    try {
      const selectedCustomer = customers.find(
        (customer) => customer.id === customerId,
      );

      const selectedWarehouse = warehouses.find(
        (warehouse) => warehouse.id === warehouseId,
      );

      const selectedAccount = accounts.find(
        (account) => account.id === paymentAccountId,
      );

      const invoiceId = crypto.randomUUID();

      const invoiceNumber = `SAL-${Date.now()}`;

      const status =
        mode === "draft"
          ? "draft"
          : paymentMethod === "credit" || remainingAmount > 0
            ? "pending"
            : "paid";

      const invoiceItems = items.map((item) => ({
        id: crypto.randomUUID(),
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        unitName: item.unitName,
        quantity: item.quantity,
        price: item.price,
        purchasePrice: item.purchasePrice,
        cost: item.purchasePrice,
        discount: item.discount,
        total: item.total,
        warehouseId,
        warehouseName: selectedWarehouse?.name || "",
      }));

      const invoice = {
        id: invoiceId,
        companyId,
        invoiceNumber,
        customerId,
        customerName: selectedCustomer?.name || "",
        warehouseId,
        warehouseName: selectedWarehouse?.name || "",
        date,
        items: invoiceItems,
        subtotal,
        total: grandTotal,
        totalAmount: grandTotal,
        grandTotal,
        totalCost,
        profit,
        paidAmount: mode === "draft" ? 0 : paidAmount,
        remainingAmount: mode === "draft" ? grandTotal : remainingAmount,
        paymentMethod,
        paymentAccountId: paymentMethod === "credit" ? null : paymentAccountId,
        paymentAccountCode:
          paymentMethod === "credit" ? null : selectedAccount?.code || null,
        paymentAccountName:
          paymentMethod === "credit" ? null : selectedAccount?.name || null,
        status,
        notes,
        createdBy: authUser?.fullName || authUser?.username || "",
        createdById: authUser?.id || null,
        createdByName: authUser?.fullName || authUser?.username || "",
        createdByUsername: authUser?.username || "",
        createdByRole: authUser?.role || "",
        extra: {
          source: "sales_new_page",
          postingStatus: "not_posted",
        },
      };

      const { error } = await supabase.from("sales").insert(invoice);

      if (error) throw error;

      if (mode === "post") {
        /*
          يجب إنشاء دالة post_sales_invoice في Supabase أولاً.
          الدالة مسؤولة عن:
          1. التحقق من المستخدم والشركة.
          2. قفل الفاتورة ومنع الترحيل المكرر.
          3. التحقق من الكمية المتاحة داخل المعاملة.
          4. خصم الكميات من warehouseStocks.
          5. تسجيل inventoryMovements.
          6. إنشاء قيد المبيعات وتكلفة البضاعة.
          7. تحديث sales.journalId و sales.extra.
          8. تنفيذ جميع الخطوات ذرياً داخل معاملة واحدة.
        */

        const { data, error: postingError } = await supabase.rpc(
          "post_sales_invoice",
          {
            p_sale_id: invoiceId,
          },
        );

        if (postingError) {
          throw new Error(
            `تم حفظ الفاتورة، لكن تعذر ترحيلها: ${postingError.message}`,
          );
        }

        if (data && typeof data === "object" && data.success === false) {
          throw new Error(data.message || "تعذر ترحيل فاتورة المبيعات.");
        }

        toast.success("تم حفظ الفاتورة وترحيلها بنجاح.");
      } else if (mode === "draft") {
        toast.success("تم حفظ فاتورة المبيعات كمسودة.");
      } else {
        toast.success("تم حفظ فاتورة المبيعات بنجاح.");
      }

      window.location.href = "/erp/sales/invoices";
    } catch (error: any) {
      console.error("Save sales invoice error:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        error,
      });

      toast.error(error?.message || "حدث خطأ أثناء حفظ فاتورة المبيعات.");
    } finally {
      setSaving(false);
    }
  };

  /* خطأ المستخدم */

  if (companyError) {
    return (
      <div dir="rtl" className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {companyError}
        </div>
      </div>
    );
  }

  /* التحميل */

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="text-center text-slate-500">
          <FiRefreshCw className="mx-auto mb-3 animate-spin text-3xl" />
          جاري تحميل بيانات المبيعات...
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen space-y-6 bg-slate-50/70 p-4 md:p-6">
      {/* رأس الصفحة */}

      <div className="rounded-2xl bg-gradient-to-l from-emerald-950 via-emerald-800 to-teal-700 p-5 text-white shadow-lg md:p-7">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-emerald-200">
              <FiShoppingCart size={22} />
              <span className="text-sm font-semibold">نظام المبيعات</span>
            </div>

            <h1 className="text-2xl font-bold md:text-3xl">
              إنشاء فاتورة مبيعات
            </h1>

            <p className="mt-2 text-sm text-emerald-100">
              تسجيل عملية البيع ومتابعة الكميات والأرباح والمدفوعات.
            </p>
          </div>

          <Link
            href="/erp/sales/invoices"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/20"
          >
            <FiArrowRight />
            العودة إلى الفواتير
          </Link>
        </div>
      </div>

      {/* معلومات الفاتورة */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-emerald-700">
            <FiUser size={19} />
            <h2 className="font-bold">العميل</h2>
          </div>

          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">اختر العميل</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>

          {customerId && (
            <p className="mt-3 text-xs text-slate-500">
              رصيد العميل:{" "}
              <strong className="text-slate-700">
                {money(
                  customers.find((c) => c.id === customerId)?.balance || 0,
                )}{" "}
                ر.ي
              </strong>
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-emerald-700">
            <IoCaretForwardCircleSharp size={19} />
            <h2 className="font-bold">مستودع الصرف</h2>
          </div>

          <select
            value={warehouseId}
            onChange={(e) => {
              setWarehouseId(e.target.value);
              setItems([]);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">اختر المستودع</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
                {warehouse.isDefault ? " (افتراضي)" : ""}
              </option>
            ))}
          </select>

          {loadingStock && (
            <p className="mt-2 text-xs text-emerald-600">
              جاري تحديث أرصدة المستودع...
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-emerald-700">
            <FiFileText size={19} />
            <h2 className="font-bold">بيانات الفاتورة</h2>
          </div>

          <label className="mb-2 block text-xs text-slate-500">
            تاريخ البيع
          </label>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* اختيار الأصناف */}

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-emerald-100 bg-emerald-50/70 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-emerald-950">
              <FiPackage className="text-emerald-700" />
              أصناف فاتورة البيع
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              اختر الصنف لمشاهدة سعر الشراء والكمية المتوفرة.
            </p>
          </div>

          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
            {items.length} صنف
          </span>
        </div>

        <div className="p-5">
          <div className="relative mb-4">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن صنف بالاسم أو الرمز..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-4 text-sm outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          {search && (
            <div className="mb-5 max-h-64 overflow-y-auto rounded-xl border border-slate-200">
              {filteredProducts.map((product) => {
                const available = getAvailableStock(product);
                const cost = getStockCost(product);

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="flex w-full flex-col justify-between gap-3 border-b border-slate-100 p-4 text-right transition last:border-0 hover:bg-emerald-50 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{product.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {product.sku || "بدون رمز"} ·{" "}
                        {product.unitName || "وحدة"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-600">
                        شراء: {money(cost)}
                      </span>

                      <span className="rounded-lg bg-emerald-100 px-3 py-2 font-bold text-emerald-800">
                        بيع: {money(product.sellingPrice || 0)}
                      </span>

                      <span
                        className={`rounded-lg px-3 py-2 font-bold ${
                          available > 0
                            ? "bg-blue-50 text-blue-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        المتوفر:{" "}
                        {product.trackInventory === false
                          ? "غير محدود"
                          : money(available)}
                      </span>

                      <span className="flex items-center gap-1 text-emerald-700">
                        <FiPlus />
                        إضافة
                      </span>
                    </div>
                  </button>
                );
              })}

              {filteredProducts.length === 0 && (
                <p className="p-5 text-center text-sm text-slate-400">
                  لا توجد أصناف مطابقة أو أن الأصناف أضيفت بالفعل.
                </p>
              )}
            </div>
          )}

          {/* جدول الأصناف */}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[1000px] text-right">
              <thead className="bg-slate-100 text-xs text-slate-600">
                <tr>
                  <th className="p-3">الصنف</th>
                  <th className="p-3">المتوفر</th>
                  <th className="p-3">سعر الشراء</th>
                  <th className="p-3">سعر البيع</th>
                  <th className="p-3">الكمية</th>
                  <th className="p-3">الخصم</th>
                  <th className="p-3">الإجمالي</th>
                  <th className="p-3">حذف</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const exceeds =
                    item.trackInventory && item.quantity > item.available;

                  return (
                    <tr key={item.productId} className="hover:bg-slate-50">
                      <td className="p-3">
                        <p className="font-bold text-slate-800">
                          {item.productName}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.productCode || "-"} · {item.unitName}
                        </p>
                      </td>

                      <td className="p-3">
                        <span
                          className={`rounded-lg px-3 py-2 text-xs font-bold ${
                            exceeds
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {item.trackInventory
                            ? money(item.available)
                            : "غير محدود"}
                        </span>
                      </td>

                      <td className="p-3 text-sm text-slate-600">
                        {money(item.purchasePrice)}
                      </td>

                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) =>
                            updateItem(
                              item.productId,
                              "price",
                              Number(e.target.value),
                            )
                          }
                          className="w-28 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm font-bold text-emerald-800 outline-none focus:border-emerald-500"
                        />
                      </td>

                      <td className="p-3">
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              item.productId,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          className={`w-24 rounded-lg border p-2 text-sm outline-none ${
                            exceeds
                              ? "border-red-400 bg-red-50"
                              : "border-slate-200 bg-white"
                          }`}
                        />

                        {exceeds && (
                          <p className="mt-1 text-xs text-red-600">
                            الكمية أكبر من المتوفر
                          </p>
                        )}
                      </td>

                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          value={item.discount}
                          onChange={(e) =>
                            updateItem(
                              item.productId,
                              "discount",
                              Number(e.target.value),
                            )
                          }
                          className="w-24 rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-emerald-500"
                        />
                      </td>

                      <td className="p-3 font-bold text-slate-800">
                        {money(item.total)}
                      </td>

                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                          title="حذف الصنف"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-12 text-center text-sm text-slate-400"
                    >
                      <FiPackage className="mx-auto mb-3 text-3xl" />
                      ابحث عن صنف لإضافته إلى فاتورة البيع.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* بيانات الدفع والملخص */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-slate-800">
              <FiDollarSign className="text-emerald-700" />
              تفاصيل الدفع
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              حدد طريقة الدفع والمبلغ المستلم.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">
                طريقة الدفع
              </label>

              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setPaymentAccountId("");
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="cash">نقداً</option>
                <option value="bank">تحويل بنكي</option>
                <option value="credit">آجل</option>
              </select>
            </div>

            {paymentMethod !== "credit" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  حساب التحصيل
                </label>

                <select
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="">اختر الحساب</option>
                  {accounts
                    .filter((account) =>
                      paymentMethod === "cash"
                        ? account.code === "1101"
                        : account.code === "1102",
                    )
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">
                المبلغ المدفوع
              </label>

              <input
                type="number"
                min="0"
                max={grandTotal}
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                disabled={paymentMethod === "credit"}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">
                نسبة الضريبة %
              </label>

              <input
                type="number"
                min="0"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">
                خصم الفاتورة
              </label>

              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              ملاحظات
            </label>

            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف ملاحظات الفاتورة إن وجدت..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        </section>

        {/* الملخص المالي */}

        <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-5 font-bold text-emerald-950">ملخص فاتورة البيع</h2>

          <div className="space-y-4">
            <SummaryRow label="إجمالي الأصناف" value={subtotal} />

            <SummaryRow label="خصم الأصناف" value={itemsDiscount} />

            <div>
              <SummaryRow label="خصم الفاتورة" value={discount} />
            </div>

            <SummaryRow label="الضريبة" value={tax} />

            <div className="border-t border-dashed border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">
                  الإجمالي النهائي
                </span>

                <span className="text-2xl font-extrabold text-emerald-700">
                  {money(grandTotal)} ر.ي
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <SummaryRow label="تكلفة البضاعة" value={totalCost} />

              <SummaryRow label="الربح المتوقع" value={profit} />

              <SummaryRow label="المبلغ المدفوع" value={paidAmount} />

              <div className="mt-3 border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">
                    المتبقي
                  </span>

                  <span className="font-bold text-amber-700">
                    {money(remainingAmount)} ر.ي
                  </span>
                </div>
              </div>
            </div>

            {items.some(
              (item) => item.trackInventory && item.quantity > item.available,
            ) && (
              <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-6 text-red-700">
                <FiAlertCircle className="mt-1 shrink-0" />
                توجد أصناف بكميات أكبر من المتاح. يرجى تعديل الكميات.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* أزرار الحفظ */}

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
        <div className="text-xs text-slate-500">
          <span className="font-bold text-slate-700">{items.length}</span> أصناف
          · الإجمالي{" "}
          <strong className="text-emerald-700">{money(grandTotal)} ر.ي</strong>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => saveInvoice("draft")}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiFileText />
            حفظ كمسودة
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => saveInvoice("save")}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <FiSave />
            حفظ
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => saveInvoice("post")}
            className="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-800 disabled:opacity-50"
          >
            {saving ? (
              <FiRefreshCw className="animate-spin" />
            ) : (
              <FiCheckCircle />
            )}
            {saving ? "جارٍ الحفظ..." : "حفظ وترحيل"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-700">{money(value)} ر.ي</span>
    </div>
  );
}
