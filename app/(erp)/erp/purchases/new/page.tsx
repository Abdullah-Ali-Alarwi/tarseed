"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiPlus,
  FiTrash2,
  FiSave,
  FiRefreshCw,
  FiPackage,
  FiFileText,
  FiAlertCircle,
} from "react-icons/fi";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

/* =====================================================
   Types
===================================================== */

type AnyRecord = Record<string, any>;

type PaymentMethod = "cash" | "bank" | "credit";

interface Supplier {
  id: string;
  companyId: string;
  name: string;
  phone?: string;
  accountId?: string;
  accountCode?: string;
  accountName?: string;
  balance?: number;
  status?: string;
  isActive?: boolean;
}

interface Product {
  id: string;
  companyId: string;
  name: string;
  sku?: string;
  code?: string;
  barcode?: string;
  unitId?: string;
  unitName?: string;
  purchasePrice?: number;
  currentStock?: number;
  isActive?: boolean;
  status?: string;
}

interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  isActive?: boolean;
  status?: string;
}

interface Unit {
  id: string;
  companyId: string;
  name: string;
  symbol?: string;
}

interface Account {
  id: string;
  companyId: string;
  code: string;
  name: string;
  isGroup?: boolean;
  isActive?: boolean;
  status?: string;
  type?: string;
  nature?: string;
}

interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  warehouseId: string;
  warehouseName: string;
  unit: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

/* =====================================================
   Helpers
===================================================== */

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const createId = () => crypto.randomUUID();

const normalize = (value: any) => String(value ?? "");

const money = (value: number | string | undefined) =>
  new Intl.NumberFormat("ar-SA-u-nu-latn", {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const activeRecord = (item: AnyRecord) =>
  item.isActive !== false &&
  item.status !== "inactive" &&
  item.status !== "disabled";

/* =====================================================
   Initial Item
===================================================== */

const createEmptyItem = (): PurchaseItem => ({
  id: createId(),
  productId: "",
  productName: "",
  productCode: "",
  warehouseId: "",
  warehouseName: "",
  unit: "",
  quantity: 1,
  price: 0,
  discount: 0,
  total: 0,
});

/* =====================================================
   Component
===================================================== */

export default function NewPurchasePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [currentUser, setCurrentUser] = useState<AnyRecord | null>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  /* بيانات الفاتورة */

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState(today());

  const [supplierId, setSupplierId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const [paymentAccountId, setPaymentAccountId] = useState("");

  const [taxRate, setTaxRate] = useState(0);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<PurchaseItem[]>([createEmptyItem()]);

  /* =====================================================
     المستخدم الحالي
  ===================================================== */

  const actorName =
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.username ||
    "غير معروف";

  const actorData = useMemo(
    () => ({
      createdBy: actorName,
      createdById: normalize(currentUser?.id),
      createdByUsername: normalize(currentUser?.username),
      createdByRole: normalize(currentUser?.role || currentUser?.roleName),
      createdByType: normalize(currentUser?.type),
    }),
    [currentUser, actorName],
  );

  /* =====================================================
     البيانات المختارة
  ===================================================== */

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => normalize(supplier.id) === supplierId),
    [suppliers, supplierId],
  );

  const paymentAccounts = useMemo(
    () =>
      accounts.filter((account) => {
        const code = normalize(account.code);

        return (
          account.isGroup !== true &&
          account.isActive !== false &&
          account.status !== "inactive" &&
          (code === "1101" || code.startsWith("1102"))
        );
      }),
    [accounts],
  );

  const selectedPaymentAccount = useMemo(
    () =>
      paymentAccounts.find(
        (account) => normalize(account.id) === paymentAccountId,
      ),
    [paymentAccounts, paymentAccountId],
  );

  /* =====================================================
     الحسابات
  ===================================================== */

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            Number(item.quantity || 0) * Number(item.price || 0) -
              Number(item.discount || 0),
          ),
        0,
      ),
    [items],
  );

  const taxAmount = useMemo(
    () => (subtotal * Number(taxRate || 0)) / 100,
    [subtotal, taxRate],
  );

  const total = useMemo(
    () => Math.max(0, subtotal - Number(invoiceDiscount || 0) + taxAmount),
    [subtotal, invoiceDiscount, taxAmount],
  );

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items],
  );

  /* =====================================================
     تحميل بيانات Supabase
  ===================================================== */

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const storedUser = localStorage.getItem("authUser");

      if (!storedUser) {
        toast.error("يرجى تسجيل الدخول أولاً");
        router.push("/login");
        return;
      }

      const authUser = JSON.parse(storedUser);

      if (authUser.type === "platform") {
        toast.error("لا يمكن لمستخدم المنصة إنشاء فاتورة شراء");
        router.push("/wezzan/dashboard");
        return;
      }

      if (!authUser.companyId) {
        toast.error("المستخدم غير مرتبط بشركة");
        return;
      }

      const currentCompanyId = normalize(authUser.companyId);

      setCompanyId(currentCompanyId);
      setCurrentUser(authUser);

      const [
        companyResult,
        suppliersResult,
        productsResult,
        warehousesResult,
        unitsResult,
        accountsResult,
        purchasesResult,
      ] = await Promise.all([
        supabase
          .from("companies")
          .select("*")
          .eq("id", currentCompanyId)
          .maybeSingle(),

        supabase
          .from("suppliers")
          .select("*")
          .eq("companyId", currentCompanyId),

        supabase.from("products").select("*").eq("companyId", currentCompanyId),

        supabase
          .from("warehouses")
          .select("*")
          .eq("companyId", currentCompanyId),

        supabase.from("units").select("*").eq("companyId", currentCompanyId),

        supabase.from("accounts").select("*").eq("companyId", currentCompanyId),

        supabase
          .from("purchases")
          .select("invoiceNumber")
          .eq("companyId", currentCompanyId),
      ]);

      const results = [
        suppliersResult,
        productsResult,
        warehousesResult,
        unitsResult,
        accountsResult,
        purchasesResult,
      ];

      const failedResult = results.find((result) => result.error);

      if (failedResult?.error) {
        throw failedResult.error;
      }

      if (companyResult.error) {
        throw companyResult.error;
      }

      const company = companyResult.data;

      setCompanyName(
        company?.name || company?.companyName || authUser.companyName || "",
      );

      const loadedSuppliers = (suppliersResult.data || []) as Supplier[];
      const loadedProducts = (productsResult.data || []) as Product[];
      const loadedWarehouses = (warehousesResult.data || []) as Warehouse[];
      const loadedUnits = (unitsResult.data || []) as Unit[];
      const loadedAccounts = (accountsResult.data || []) as Account[];

      setSuppliers(loadedSuppliers.filter(activeRecord));
      setProducts(loadedProducts.filter(activeRecord));
      setWarehouses(loadedWarehouses.filter(activeRecord));
      setUnits(loadedUnits);
      setAccounts(loadedAccounts.filter(activeRecord));

      /* رقم الفاتورة التالي */

      const existingNumbers = (purchasesResult.data || []).map(
        (purchase: AnyRecord) => {
          const match = String(purchase.invoiceNumber || "").match(
            /^PUR-(\d+)$/,
          );

          return match ? Number(match[1]) : 0;
        },
      );

      const nextNumber = Math.max(0, ...existingNumbers) + 1;

      setInvoiceNumber(`PUR-${String(nextNumber).padStart(4, "0")}`);

      /* اختيار المستودع الافتراضي */

      if (loadedWarehouses.length === 1) {
        const defaultWarehouse = loadedWarehouses[0];

        setItems((previous) =>
          previous.map((item) => ({
            ...item,
            warehouseId: normalize(defaultWarehouse.id),
            warehouseName: defaultWarehouse.name,
          })),
        );
      }

      /* اختيار حساب الصندوق الافتراضي */

      const cashAccount = loadedAccounts.find(
        (account) =>
          normalize(account.code) === "1101" &&
          account.isGroup !== true &&
          activeRecord(account),
      );

      if (cashAccount) {
        setPaymentAccountId(normalize(cashAccount.id));
      }
    } catch (error: any) {
      console.error("Load purchase data:", error);

      toast.error(error?.message || "تعذر تحميل بيانات فاتورة الشراء");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =====================================================
     إضافة صنف
  ===================================================== */

  const addItem = () => {
    const defaultWarehouse = warehouses.find(
      (warehouse) => normalize(warehouse.id) === (items[0]?.warehouseId || ""),
    );

    setItems((previous) => [
      ...previous,
      {
        ...createEmptyItem(),
        warehouseId: normalize(defaultWarehouse?.id),
        warehouseName: defaultWarehouse?.name || "",
      },
    ]);
  };

  /* =====================================================
     حذف صنف
  ===================================================== */

  const removeItem = (id: string) => {
    if (items.length === 1) {
      toast.error("يجب أن تحتوي الفاتورة على صنف واحد على الأقل");
      return;
    }

    setItems((previous) => previous.filter((item) => item.id !== id));
  };

  /* =====================================================
     تحديث صنف
  ===================================================== */

  const updateItem = (id: string, field: keyof PurchaseItem, value: any) => {
    setItems((previous) =>
      previous.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        if (field === "productId") {
          const product = products.find(
            (product) => normalize(product.id) === normalize(value),
          );

          const unit = units.find(
            (unit) => normalize(unit.id) === normalize(product?.unitId),
          );

          updated.productName = product?.name || "";
          updated.productCode =
            product?.sku || product?.code || product?.barcode || "";

          updated.price = Number(product?.purchasePrice || 0);
          updated.unit = unit
            ? `${unit.name}${unit.symbol ? ` (${unit.symbol})` : ""}`
            : product?.unitName || "";
        }

        if (field === "warehouseId") {
          const warehouse = warehouses.find(
            (warehouse) => normalize(warehouse.id) === normalize(value),
          );

          updated.warehouseName = warehouse?.name || "";
        }

        updated.total = Math.max(
          0,
          Number(updated.quantity || 0) * Number(updated.price || 0) -
            Number(updated.discount || 0),
        );

        return updated;
      }),
    );
  };

  /* =====================================================
     التحقق من الفاتورة
  ===================================================== */

  const validateInvoice = () => {
    if (!companyId || !currentUser) {
      toast.error("تعذر تحديد الشركة أو المستخدم");
      return false;
    }

    if (!invoiceNumber.trim()) {
      toast.error("رقم الفاتورة مطلوب");
      return false;
    }

    if (!date) {
      toast.error("تاريخ الفاتورة مطلوب");
      return false;
    }

    if (!selectedSupplier) {
      toast.error("يرجى اختيار المورد");
      return false;
    }

    if (warehouses.length === 0) {
      toast.error("لا يوجد مستودع مسجل للشركة");
      return false;
    }

    if (
      items.some(
        (item) =>
          !item.productId ||
          !item.warehouseId ||
          Number(item.quantity) <= 0 ||
          Number(item.price) < 0 ||
          Number(item.discount) < 0,
      )
    ) {
      toast.error("يرجى إدخال الأصناف والكميات والأسعار بشكل صحيح");
      return false;
    }

    if (Number(invoiceDiscount) < 0 || Number(taxRate) < 0) {
      toast.error("الخصم والضريبة لا يمكن أن يكونا سالبين");
      return false;
    }

    if (Number(invoiceDiscount) > subtotal) {
      toast.error("خصم الفاتورة لا يمكن أن يتجاوز إجمالي الأصناف");
      return false;
    }

    if (paymentMethod !== "credit" && !selectedPaymentAccount) {
      toast.error("يرجى اختيار حساب الدفع");
      return false;
    }

    if (paymentMethod === "credit" && !selectedSupplier.accountId) {
      toast.error("المورد غير مرتبط بحساب محاسبي");
      return false;
    }

    if (total <= 0) {
      toast.error("إجمالي الفاتورة يجب أن يكون أكبر من صفر");
      return false;
    }

    return true;
  };

  /* =====================================================
     حفظ الفاتورة في Supabase
  ===================================================== */

  const handleSave = async () => {
    if (saving) return;

    if (!validateInvoice()) return;

    try {
      setSaving(true);

      const now = new Date().toISOString();

      /* منع تكرار رقم الفاتورة */

      const { data: duplicate, error: duplicateError } = await supabase
        .from("purchases")
        .select("id")
        .eq("companyId", companyId)
        .eq("invoiceNumber", invoiceNumber.trim())
        .limit(1);

      if (duplicateError) throw duplicateError;

      if (duplicate && duplicate.length > 0) {
        toast.error("رقم الفاتورة مستخدم مسبقاً");
        return;
      }

      /* تجهيز الأصناف */

      const normalizedItems = items.map((item) => {
        const product = products.find(
          (product) => normalize(product.id) === item.productId,
        );

        const warehouse = warehouses.find(
          (warehouse) => normalize(warehouse.id) === item.warehouseId,
        );

        const quantity = Number(item.quantity);
        const price = Number(item.price);
        const discount = Number(item.discount || 0);

        return {
          id: item.id,

          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          name: item.productName,

          quantity,
          price,
          discount,

          total: Math.max(0, quantity * price - discount),

          warehouseId: item.warehouseId,
          warehouseName: warehouse?.name || "",

          unit: item.unit || product?.unitName || "",
        };
      });

      const purchaseSubtotal = normalizedItems.reduce(
        (sum, item) => sum + item.total,
        0,
      );

      const purchaseTax = (purchaseSubtotal * Number(taxRate || 0)) / 100;

      const purchaseTotal = Math.max(
        0,
        purchaseSubtotal - Number(invoiceDiscount || 0) + purchaseTax,
      );

      const purchaseId = createId();

      /* تجهيز سجل المشتريات */

      const purchasePayload = {
        id: purchaseId,
        companyId,

        invoiceNumber: invoiceNumber.trim(),
        date,

        supplier: selectedSupplier!.name,
        supplierId: selectedSupplier!.id,

        accountCode: selectedSupplier!.accountCode || "",
        accountName: selectedSupplier!.accountName || "",

        itemCount: normalizedItems.length,
        totalQuantity,

        items: normalizedItems,

        subtotal: purchaseSubtotal,
        discount: Number(invoiceDiscount || 0),

        tax: purchaseTax,
        taxRate: Number(taxRate || 0),

        total: purchaseTotal,

        paymentMethod,

        paymentMethodName:
          paymentMethod === "cash"
            ? "نقدي"
            : paymentMethod === "bank"
              ? "تحويل بنكي"
              : "آجل",

        paymentAccountId:
          paymentMethod === "credit" ? "" : selectedPaymentAccount!.id,

        status: paymentMethod === "credit" ? "pending" : "paid",

        notes: notes.trim(),

        ...actorData,

        createdAt: now,
        updatedAt: now,
      };

      /* الحفظ */

      const { error: insertError } = await supabase
        .from("purchases")
        .insert(purchasePayload);

      if (insertError) throw insertError;

      toast.success("تم حفظ فاتورة المشتريات بنجاح");

      router.push("/erp/purchases/invoices");
      router.refresh();
    } catch (error: any) {
      console.error("Save purchase error:", error);

      toast.error(error?.message || "حدث خطأ أثناء حفظ فاتورة المشتريات");
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     Loading
  ===================================================== */

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiRefreshCw size={25} className="animate-spin text-[#0E1F33]" />
          <p className="text-xs text-gray-500">
            جاري تحميل بيانات فاتورة الشراء...
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-50 p-3 text-xs text-gray-800 sm:p-5"
    >
      {/* الرأس */}

      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/erp/purchases/invoices")}
              className="rounded-md border border-gray-200 bg-white p-2 hover:bg-gray-100"
            >
              <FiArrowRight size={16} />
            </button>

            <h1 className="text-lg font-bold text-gray-900">
              إضافة فاتورة شراء
            </h1>
          </div>

          <p className="mt-2 text-[10px] text-gray-500">
            {companyName} — تسجيل فاتورة المشتريات
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
          <p className="text-[10px] text-gray-500">رقم الفاتورة</p>

          <p className="font-bold text-[#0E1F33]">{invoiceNumber}</p>
        </div>
      </div>

      {/* بيانات الفاتورة */}

      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
          <FiFileText />
          بيانات الفاتورة
        </h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-gray-600">رقم الفاتورة</label>

            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-[#0E1F33]"
            />
          </div>

          <div>
            <label className="mb-1 block text-gray-600">تاريخ الفاتورة</label>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-[#0E1F33]"
            />
          </div>

          <div>
            <label className="mb-1 block text-gray-600">المورد</label>

            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 outline-none focus:border-[#0E1F33]"
            >
              <option value="">اختر المورد</option>

              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>

            {selectedSupplier && (
              <p className="mt-1 text-[9px] text-gray-400">
                الحساب: {selectedSupplier.accountCode || "غير مرتبط"}
                {" - "}
                {selectedSupplier.accountName || ""}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-gray-600">طريقة الدفع</label>

            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 outline-none focus:border-[#0E1F33]"
            >
              <option value="cash">نقدي</option>
              <option value="bank">تحويل بنكي</option>
              <option value="credit">آجل</option>
            </select>
          </div>

          {paymentMethod !== "credit" && (
            <div>
              <label className="mb-1 block text-gray-600">حساب الدفع</label>

              <select
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 outline-none focus:border-[#0E1F33]"
              >
                <option value="">اختر حساب الدفع</option>

                {paymentAccounts
                  .filter((account) =>
                    paymentMethod === "cash"
                      ? normalize(account.code) === "1101"
                      : normalize(account.code).startsWith("1102"),
                  )
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* أصناف الفاتورة */}

      <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="flex items-center gap-2 font-bold text-gray-900">
            <FiPackage />
            أصناف الفاتورة
          </h2>

          <button
            type="button"
            onClick={addItem}
            className="flex h-8 items-center gap-1 rounded-md bg-[#0E1F33] px-3 text-white hover:bg-[#162d49]"
          >
            <FiPlus />
            إضافة صنف
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-3 text-right">الصنف</th>
                <th className="p-3 text-right">المستودع</th>
                <th className="p-3 text-right">الوحدة</th>
                <th className="p-3 text-right">الكمية</th>
                <th className="p-3 text-right">سعر الشراء</th>
                <th className="p-3 text-right">الخصم</th>
                <th className="p-3 text-right">الإجمالي</th>
                <th className="p-3 text-center">حذف</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="p-2">
                    <select
                      value={item.productId}
                      onChange={(e) =>
                        updateItem(item.id, "productId", e.target.value)
                      }
                      className="h-9 w-full min-w-[180px] rounded-md border border-gray-200 bg-white px-2"
                    >
                      <option value="">اختر الصنف</option>

                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                          {product.sku || product.code
                            ? ` (${product.sku || product.code})`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-2">
                    <select
                      value={item.warehouseId}
                      onChange={(e) =>
                        updateItem(item.id, "warehouseId", e.target.value)
                      }
                      className="h-9 w-full min-w-[130px] rounded-md border border-gray-200 bg-white px-2"
                    >
                      <option value="">اختر المستودع</option>

                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-2 text-gray-500">{item.unit || "—"}</td>

                  <td className="p-2">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", Number(e.target.value))
                      }
                      className="h-9 w-24 rounded-md border border-gray-200 px-2"
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(item.id, "price", Number(e.target.value))
                      }
                      className="h-9 w-28 rounded-md border border-gray-200 px-2"
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.discount}
                      onChange={(e) =>
                        updateItem(item.id, "discount", Number(e.target.value))
                      }
                      className="h-9 w-24 rounded-md border border-gray-200 px-2"
                    />
                  </td>

                  <td className="p-2 font-bold text-gray-900">
                    {money(
                      Math.max(0, item.quantity * item.price - item.discount),
                    )}
                  </td>

                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded-md p-2 text-red-500 hover:bg-red-50"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="border-t border-gray-100 p-4 text-center text-amber-700">
            <FiAlertCircle className="mx-auto mb-2" size={20} />
            لا توجد أصناف مسجلة لهذه الشركة.
          </div>
        )}
      </div>

      {/* الإجماليات والملاحظات */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-bold text-gray-900">ملاحظات الفاتورة</h2>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="أدخل أي ملاحظات..."
            className="w-full resize-none rounded-md border border-gray-200 p-3 outline-none focus:border-[#0E1F33]"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-900">ملخص الفاتورة</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">إجمالي الكميات</span>
              <strong>{money(totalQuantity)}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">الإجمالي قبل الخصم</span>
              <strong>{money(subtotal)}</strong>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500">خصم الفاتورة</span>

              <input
                type="number"
                min="0"
                value={invoiceDiscount}
                onChange={(e) => setInvoiceDiscount(Number(e.target.value))}
                className="h-8 w-28 rounded-md border border-gray-200 px-2 text-left"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500">نسبة الضريبة %</span>

              <input
                type="number"
                min="0"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="h-8 w-28 rounded-md border border-gray-200 px-2 text-left"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">قيمة الضريبة</span>
              <strong>{money(taxAmount)}</strong>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between text-base">
                <span className="font-bold text-gray-900">إجمالي الفاتورة</span>

                <strong className="text-xl text-emerald-700">
                  {money(total)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* بيانات المستخدم */}

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3 text-[11px] text-gray-600">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span>
            منشئ الفاتورة:
            <strong className="mr-1 text-[#0E1F33]">{actorName}</strong>
          </span>

          <span>
            اسم المستخدم:
            <strong className="mr-1 text-[#0E1F33]">
              {currentUser?.username || "—"}
            </strong>
          </span>

          <span>
            الدور:
            <strong className="mr-1 text-[#0E1F33]">
              {currentUser?.role || "—"}
            </strong>
          </span>
        </div>
      </div>

      {/* تنبيه */}

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-6 text-amber-900">
        <strong>تنبيه:</strong>
        <br />
        هذه النسخة تحفظ بيانات الفاتورة وأصنافها في جدول purchases. لا تنفذ حتى
        الآن تحديث المخزون أو إنشاء القيد المحاسبي؛ يجب ربط هذه العمليات بإجراء
        آمن ومتكامل حتى لا تُحفظ الفاتورة دون تحديث بقية الحسابات والمخزون عند
        حدوث خطأ.
      </div>

      {/* الأزرار */}

      <div className="mt-5 flex flex-col-reverse justify-end gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push("/erp/purchases/invoices")}
          className="h-10 rounded-md border border-gray-200 bg-white px-5 font-semibold hover:bg-gray-50"
        >
          إلغاء
        </button>

        <button
          type="button"
          disabled={saving || !currentUser}
          onClick={handleSave}
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#0E1F33] px-6 font-semibold text-white hover:bg-[#162d49] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}

          {saving ? "جارٍ الحفظ..." : "حفظ الفاتورة"}
        </button>
      </div>
    </div>
  );
}
