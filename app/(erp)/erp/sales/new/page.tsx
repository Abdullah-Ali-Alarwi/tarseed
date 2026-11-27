"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Customer = {
  id: string;
  name: string;
  phone?: string;
  accountId?: string;
  accountCode?: string;
  accountName?: string;
  status?: string;
  isActive?: boolean;
};

type Product = {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  unitName?: string;
  warehouseId?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  currentStock?: number;
  trackInventory?: boolean | null;
  status?: string;
};

type Warehouse = {
  id: string;
  name: string;
  status?: string;
  isDefault?: boolean;
};

type Account = {
  id: string;
  code: string;
  name: string;
  type?: string;
  nature?: string;
  parentId?: string;
  isGroup?: boolean;
  isActive?: boolean;
  status?: string;
  extra?: Record<string, unknown> | null;
};

type SaleItem = {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  unitName: string;
  quantity: number;
  price: number;
  cost: number;
  discount: number;
  total: number;
  costTotal: number;
  warehouseId: string;
  warehouseName: string;
};

type AuthUser = {
  id?: string;
  userId?: string;
  username?: string;
  name?: string;
  fullName?: string;
  role?: string;
  jobTitle?: string;
  type?: string;
  companyId?: string;
};

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const numberValue = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const isActiveRecord = (record: { status?: string; isActive?: boolean }) => {
  if (record.isActive === false) return false;
  if (record.status && record.status !== "active") return false;
  return true;
};

export default function NewSalePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [companyId, setCompanyId] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState(today());

  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "bank" | "credit"
  >("cash");

  const [paymentAccountId, setPaymentAccountId] = useState("");

  const [items, setItems] = useState<SaleItem[]>([]);

  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // =====================================================
  // تحميل بيانات المستخدم والبيانات الأساسية
  // =====================================================

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError("");

        const storedUser = localStorage.getItem("authUser");

        if (!storedUser) {
          router.replace("/login");
          return;
        }

        const user: AuthUser = JSON.parse(storedUser);

        if (!user.companyId) {
          setError("لم يتم العثور على الشركة المرتبطة بالمستخدم.");
          return;
        }

        if (user.type === "platform") {
          setError("لا يمكن لمستخدم المنصة إنشاء فاتورة مبيعات.");
          return;
        }

        setAuthUser(user);
        setCompanyId(user.companyId);

        const [
          customersResult,
          productsResult,
          warehousesResult,
          accountsResult,
          salesResult,
        ] = await Promise.all([
          supabase
            .from("customers")
            .select("*")
            .eq("companyId", user.companyId),

          supabase.from("products").select("*").eq("companyId", user.companyId),

          supabase
            .from("warehouses")
            .select("*")
            .eq("companyId", user.companyId),

          supabase.from("accounts").select("*").eq("companyId", user.companyId),

          supabase
            .from("sales")
            .select("invoiceNumber")
            .eq("companyId", user.companyId),
        ]);

        if (customersResult.error) {
          throw customersResult.error;
        }

        if (productsResult.error) {
          throw productsResult.error;
        }

        if (warehousesResult.error) {
          throw warehousesResult.error;
        }

        if (accountsResult.error) {
          throw accountsResult.error;
        }

        if (salesResult.error) {
          throw salesResult.error;
        }

        const activeCustomers = (
          (customersResult.data || []) as Customer[]
        ).filter(isActiveRecord);

        const activeProducts = (
          (productsResult.data || []) as Product[]
        ).filter(isActiveRecord);

        const activeWarehouses = (
          (warehousesResult.data || []) as Warehouse[]
        ).filter(isActiveRecord);

        const activeAccounts = (
          (accountsResult.data || []) as Account[]
        ).filter((account) => {
          if (!isActiveRecord(account)) return false;
          if (account.isGroup === true) return false;

          if (account.extra?.allowPosting === false) {
            return false;
          }

          return true;
        });

        setCustomers(activeCustomers);
        setProducts(activeProducts);
        setWarehouses(activeWarehouses);
        setAccounts(activeAccounts);

        // اختيار المستودع الافتراضي
        const defaultWarehouse =
          activeWarehouses.find((warehouse) => warehouse.isDefault) ||
          activeWarehouses[0];

        if (defaultWarehouse) {
          setWarehouseId(defaultWarehouse.id);
        }

        // إنشاء رقم الفاتورة التالي
        const existingNumbers = (salesResult.data || []).map((sale) => {
          const match = String(sale.invoiceNumber || "").match(/^SAL-(\d+)$/);

          return match ? Number(match[1]) : 0;
        });

        const nextNumber = Math.max(0, ...existingNumbers) + 1;

        setInvoiceNumber(`SAL-${String(nextNumber).padStart(5, "0")}`);
      } catch (err: unknown) {
        console.error("Error loading sales data:", err);

        setError(
          err instanceof Error ? err.message : "حدث خطأ أثناء تحميل البيانات.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [router]);

  // =====================================================
  // الحسابات المتاحة حسب طريقة الدفع
  // =====================================================

  const availableAccounts = useMemo(() => {
    if (paymentMethod === "cash") {
      return accounts.filter((account) => account.code === "1101");
    }

    if (paymentMethod === "bank") {
      return accounts.filter((account) => account.code.startsWith("1102"));
    }

    if (paymentMethod === "credit") {
      const selectedCustomer = customers.find(
        (customer) => customer.id === customerId,
      );

      if (!selectedCustomer) return [];

      return accounts.filter((account) => {
        const matchesId =
          selectedCustomer.accountId &&
          account.id === selectedCustomer.accountId;

        const matchesCode =
          selectedCustomer.accountCode &&
          account.code === selectedCustomer.accountCode;

        return Boolean(matchesId || matchesCode);
      });
    }

    return [];
  }, [accounts, paymentMethod, customers, customerId]);

  useEffect(() => {
    if (paymentMethod === "credit" && !customerId) {
      setPaymentAccountId("");
      return;
    }

    const defaultAccount = availableAccounts[0];

    if (
      !paymentAccountId ||
      !availableAccounts.some((account) => account.id === paymentAccountId)
    ) {
      setPaymentAccountId(defaultAccount?.id || "");
    }
  }, [paymentMethod, customerId, availableAccounts, paymentAccountId]);

  // =====================================================
  // إجماليات الفاتورة
  // =====================================================

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [items],
  );

  const itemsDiscount = useMemo(
    () => items.reduce((sum, item) => sum + item.discount, 0),
    [items],
  );

  const totalBeforeInvoiceDiscount = Math.max(0, subtotal - itemsDiscount);

  const safeInvoiceDiscount = Math.min(
    Math.max(0, invoiceDiscount),
    totalBeforeInvoiceDiscount,
  );

  const taxableAmount = Math.max(
    0,
    totalBeforeInvoiceDiscount - safeInvoiceDiscount,
  );

  const taxAmount = (taxableAmount * Math.max(0, taxRate)) / 100;

  const total = taxableAmount + taxAmount;

  const totalCost = items.reduce((sum, item) => sum + item.costTotal, 0);

  const estimatedProfit = total - totalCost;

  // =====================================================
  // إضافة منتج للفاتورة
  // =====================================================

  const addProduct = () => {
    setError("");
    setSuccess("");

    if (!selectedProductId) {
      setError("يرجى اختيار المنتج.");
      return;
    }

    if (!warehouseId) {
      setError("يرجى اختيار المستودع.");
      return;
    }

    if (selectedQuantity <= 0) {
      setError("يجب أن تكون الكمية أكبر من صفر.");
      return;
    }

    const product = products.find((item) => item.id === selectedProductId);

    if (!product) {
      setError("المنتج المحدد غير موجود.");
      return;
    }

    if (product.trackInventory !== false) {
      const availableStock = numberValue(product.currentStock);

      const alreadyAdded = items
        .filter(
          (item) =>
            item.productId === product.id && item.warehouseId === warehouseId,
        )
        .reduce((sum, item) => sum + item.quantity, 0);

      if (alreadyAdded + selectedQuantity > availableStock) {
        setError(
          `الكمية المطلوبة تتجاوز الرصيد المتاح للمنتج ${product.name}. الرصيد الحالي: ${availableStock}`,
        );
        return;
      }
    }

    const existingIndex = items.findIndex(
      (item) =>
        item.productId === product.id && item.warehouseId === warehouseId,
    );

    if (existingIndex !== -1) {
      const updatedItems = [...items];
      const existingItem = updatedItems[existingIndex];

      const newQuantity = existingItem.quantity + selectedQuantity;

      if (
        product.trackInventory !== false &&
        newQuantity > numberValue(product.currentStock)
      ) {
        setError("الكمية الإجمالية تتجاوز المخزون المتاح.");
        return;
      }

      existingItem.quantity = newQuantity;
      existingItem.total =
        newQuantity * existingItem.price - existingItem.discount;

      existingItem.costTotal = newQuantity * existingItem.cost;

      setItems(updatedItems);
    } else {
      const warehouse = warehouses.find((item) => item.id === warehouseId);

      const price = numberValue(product.sellingPrice);
      const cost = numberValue(product.purchasePrice);

      const newItem: SaleItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        productCode: product.sku || product.barcode || "",
        unitName: product.unitName || "",
        quantity: selectedQuantity,
        price,
        cost,
        discount: 0,
        total: selectedQuantity * price,
        costTotal: selectedQuantity * cost,
        warehouseId,
        warehouseName: warehouse?.name || "",
      };

      setItems((previous) => [...previous, newItem]);
    }

    setSelectedProductId("");
    setSelectedQuantity(1);
  };

  // =====================================================
  // تعديل كمية أو سعر أو خصم المنتج
  // =====================================================

  const updateItem = (
    itemId: string,
    field: "quantity" | "price" | "discount",
    value: number,
  ) => {
    setItems((previous) =>
      previous.map((item) => {
        if (item.id !== itemId) return item;

        const updated = {
          ...item,
          [field]: Math.max(0, value),
        };

        const product = products.find(
          (product) => product.id === item.productId,
        );

        if (field === "quantity" && product?.trackInventory !== false) {
          const otherQuantity = previous
            .filter(
              (other) =>
                other.productId === item.productId &&
                other.warehouseId === item.warehouseId &&
                other.id !== itemId,
            )
            .reduce((sum, other) => sum + other.quantity, 0);

          const maxQuantity =
            numberValue(product?.currentStock) - otherQuantity;

          updated.quantity = Math.min(
            updated.quantity,
            Math.max(0, maxQuantity),
          );
        }

        const lineSubtotal = updated.quantity * updated.price;

        updated.discount = Math.min(updated.discount, lineSubtotal);

        updated.total = Math.max(0, lineSubtotal - updated.discount);

        updated.costTotal = updated.quantity * updated.cost;

        return updated;
      }),
    );
  };

  const removeItem = (itemId: string) => {
    setItems((previous) => previous.filter((item) => item.id !== itemId));
  };

  // =====================================================
  // حفظ الفاتورة
  // =====================================================

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!companyId || !authUser) {
      setError("بيانات المستخدم أو الشركة غير مكتملة.");
      return;
    }

    if (!date) {
      setError("يرجى تحديد تاريخ الفاتورة.");
      return;
    }

    if (!warehouseId) {
      setError("يرجى اختيار المستودع.");
      return;
    }

    if (items.length === 0) {
      setError("يرجى إضافة منتج واحد على الأقل.");
      return;
    }

    if (total <= 0) {
      setError("إجمالي الفاتورة يجب أن يكون أكبر من صفر.");
      return;
    }

    if (paymentMethod === "credit" && !customerId) {
      setError("يجب اختيار عميل عند البيع الآجل.");
      return;
    }

    if (!paymentAccountId) {
      setError(
        paymentMethod === "credit"
          ? "لا يوجد حساب ذمم مرتبط بهذا العميل. تحقق من حساب العميل في شجرة الحسابات."
          : "لا يوجد حساب مناسب لطريقة الدفع المحددة.",
      );
      return;
    }

    const selectedAccount = accounts.find(
      (account) => account.id === paymentAccountId,
    );

    if (!selectedAccount) {
      setError("الحساب المحدد غير موجود.");
      return;
    }

    const selectedCustomer = customers.find(
      (customer) => customer.id === customerId,
    );

    const selectedWarehouse = warehouses.find(
      (warehouse) => warehouse.id === warehouseId,
    );

    try {
      setSaving(true);

      // منع تكرار رقم الفاتورة قدر الإمكان
      const { data: existingInvoice, error: checkError } = await supabase
        .from("sales")
        .select("id")
        .eq("companyId", companyId)
        .eq("invoiceNumber", invoiceNumber)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingInvoice) {
        setError(
          "رقم الفاتورة مستخدم بالفعل. أعد تحميل الصفحة للحصول على رقم جديد.",
        );
        return;
      }

      const now = new Date().toISOString();

      const userName =
        authUser.fullName || authUser.name || authUser.username || "مستخدم";

      const userId = authUser.id || authUser.userId || null;

      const saleItems = items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        unitName: item.unitName,
        quantity: item.quantity,
        price: item.price,
        unitPrice: item.price,
        cost: item.cost,
        discount: item.discount,
        total: item.total,
        costTotal: item.costTotal,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouseName,
      }));

      /*
        نحفظ الفاتورة كمسودة:
        - لا يتم خصم المخزون.
        - لا يتم إنشاء قيد محاسبي.
        - لا يتم تسجيل مبلغ مدفوع فعليًا.
        - لا يتم إنشاء سند قبض.
      */

      const payload = {
        id: crypto.randomUUID(),
        companyId,

        invoiceNumber,

        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || "عميل نقدي",

        warehouseId: selectedWarehouse?.id || null,
        warehouseName: selectedWarehouse?.name || "",

        date,

        items: saleItems,

        subtotal,
        total,
        totalAmount: total,
        grandTotal: total,

        totalCost,
        profit: estimatedProfit,

        paidAmount: 0,
        remainingAmount: total,

        paymentMethod,

        paymentAccountId: selectedAccount.id,
        paymentAccountCode: selectedAccount.code,
        paymentAccountName: selectedAccount.name,

        status: "draft",

        notes: notes.trim(),

        journalId: null,

        createdBy: userName,
        createdById: userId,
        createdByName: userName,
        createdByUsername: authUser.username || "",
        createdByRole: authUser.role || authUser.jobTitle || "",

        updatedBy: userName,
        updatedById: userId,

        createdAt: now,
        updatedAt: now,

        extra: {
          invoiceDiscount: safeInvoiceDiscount,
          itemsDiscount,
          taxRate,
          taxAmount,
          taxableAmount,
          paymentMethod,
          status: "draft",
        },
      };

      const { error: insertError } = await supabase
        .from("sales")
        .insert(payload);

      if (insertError) throw insertError;

      setSuccess("تم حفظ فاتورة المبيعات كمسودة بنجاح.");

      setTimeout(() => {
        router.push("/erp/sales");
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      console.error("Error creating sale:", err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حفظ فاتورة المبيعات.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // واجهة التحميل
  // =====================================================

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500">جاري تحميل بيانات المبيعات...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // الواجهة الرئيسية
  // =====================================================

  return (
    <div dir="rtl" className="space-y-6 pb-10">
      {/* العنوان */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            إنشاء فاتورة مبيعات
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            تسجيل فاتورة مبيعات جديدة
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/erp/sales")}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
        >
          العودة إلى المبيعات
        </button>
      </div>

      {/* رسائل الخطأ والنجاح */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* بيانات الفاتورة */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-gray-800">
            بيانات الفاتورة
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                رقم الفاتورة
              </label>

              <input
                value={invoiceNumber}
                readOnly
                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                تاريخ الفاتورة
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                العميل
              </label>

              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">عميل نقدي</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                    {customer.phone ? ` - ${customer.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                المستودع
              </label>

              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">اختر المستودع</option>

                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* إضافة المنتجات */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-gray-800">
            إضافة المنتجات
          </h2>

          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                المنتج
              </label>

              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">اختر المنتج</option>

                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {product.sku ? ` (${product.sku})` : ""}
                    {" - "}
                    سعر البيع: {formatMoney(numberValue(product.sellingPrice))}
                    {product.trackInventory !== false
                      ? ` - المخزون: ${numberValue(product.currentStock)}`
                      : " - غير مخزني"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                الكمية
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={selectedQuantity}
                onChange={(e) =>
                  setSelectedQuantity(numberValue(e.target.value))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={addProduct}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            + إضافة المنتج
          </button>

          {/* جدول المنتجات */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[850px] text-right text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-600">
                  <th className="px-3 py-3">المنتج</th>
                  <th className="px-3 py-3">الوحدة</th>
                  <th className="px-3 py-3">الكمية</th>
                  <th className="px-3 py-3">السعر</th>
                  <th className="px-3 py-3">الخصم</th>
                  <th className="px-3 py-3">الإجمالي</th>
                  <th className="px-3 py-3">حذف</th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-10 text-center text-gray-400"
                    >
                      لم تتم إضافة أي منتجات حتى الآن.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-800">
                          {item.productName}
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                          {item.productCode || "بدون كود"}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-gray-600">
                        {item.unitName || "-"}
                      </td>

                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "quantity",
                              numberValue(e.target.value),
                            )
                          }
                          className="w-24 rounded-md border border-gray-300 px-2 py-1.5"
                        />
                      </td>

                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "price",
                              numberValue(e.target.value),
                            )
                          }
                          className="w-28 rounded-md border border-gray-300 px-2 py-1.5"
                        />
                      </td>

                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "discount",
                              numberValue(e.target.value),
                            )
                          }
                          className="w-24 rounded-md border border-gray-300 px-2 py-1.5"
                        />
                      </td>

                      <td className="px-3 py-3 font-semibold text-gray-800">
                        {formatMoney(item.total)}
                      </td>

                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="rounded-md px-3 py-1.5 text-red-600 transition hover:bg-red-50"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* الحسابات والملاحظات */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-gray-800">
              بيانات الدفع
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  طريقة الدفع
                </label>

                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value as "cash" | "bank" | "credit",
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="cash">نقدًا</option>
                  <option value="bank">تحويل بنكي</option>
                  <option value="credit">آجل</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  الحساب المرتبط
                </label>

                <select
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
                  disabled={paymentMethod === "credit" && !customerId}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">اختر الحساب</option>

                  {availableAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>

                {availableAccounts.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    لا يوجد حساب مناسب. تحقق من إعدادات شجرة الحسابات وربط حساب
                    العميل.
                  </p>
                )}
              </div>

              {paymentMethod === "credit" && (
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  هذه فاتورة آجلة. يجب اختيار عميل مرتبط بحساب ذمم فرعي في شجرة
                  الحسابات.
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  ملاحظات
                </label>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="أدخل ملاحظات الفاتورة..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </section>

          {/* ملخص الفاتورة */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-gray-800">
              ملخص الفاتورة
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">إجمالي المنتجات</span>

                <span className="font-semibold text-gray-800">
                  {formatMoney(subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">خصومات المنتجات</span>

                <span className="font-semibold text-red-600">
                  - {formatMoney(itemsDiscount)}
                </span>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  خصم إضافي على الفاتورة
                </label>

                <input
                  type="number"
                  min="0"
                  max={totalBeforeInvoiceDiscount}
                  step="0.01"
                  value={invoiceDiscount}
                  onChange={(e) =>
                    setInvoiceDiscount(numberValue(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">إجمالي الخصم</span>

                <span className="font-semibold text-red-600">
                  - {formatMoney(itemsDiscount + safeInvoiceDiscount)}
                </span>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  نسبة الضريبة %
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(numberValue(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">قيمة الضريبة</span>

                <span className="font-semibold text-gray-800">
                  {formatMoney(taxAmount)}
                </span>
              </div>

              <hr />

              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800">
                  الإجمالي النهائي
                </span>

                <span className="text-2xl font-bold text-blue-700">
                  {formatMoney(total)}
                </span>
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    تكلفة المنتجات التقديرية
                  </span>

                  <span className="font-medium text-gray-800">
                    {formatMoney(totalCost)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500">الربح التقديري</span>

                  <span
                    className={`font-bold ${
                      estimatedProfit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatMoney(estimatedProfit)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-800">
                سيتم حفظ الفاتورة كمسودة. لن يتم تسجيل المبلغ كمدفوع فعليًا أو
                ترحيل قيد محاسبي أو خصم المخزون عند الحفظ.
              </div>
            </div>
          </section>
        </div>

        {/* أزرار الحفظ */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/erp/sales")}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            إلغاء
          </button>

          <button
            type="submit"
            disabled={saving || items.length === 0}
            className="rounded-lg bg-blue-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "جاري الحفظ..." : "حفظ الفاتورة كمسودة"}
          </button>
        </div>
      </form>
    </div>
  );
}
