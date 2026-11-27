"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiFileText,
  FiSearch,
  FiPackage,
  FiTrash2,
  FiSave,
  FiAlertCircle,
} from "react-icons/fi";

import { supabase } from "@/lib/supabase";

type PurchaseItem = {
  id?: string;
  name?: string;
  productName?: string;
  unit?: string;
  price?: number;
  total?: number;
  discount?: number;
  quantity?: number;
  productId?: string;
  productCode?: string;
  warehouseId?: string;
  warehouseName?: string;
};

type Purchase = {
  id: string;
  invoiceNumber: string;
  date: string;
  supplier: string;
  supplierId: string;
  companyId: string;
  subtotal: number;
  discount: number;
  tax: number;
  taxRate: number;
  total: number;
  paymentMethod: string;
  paymentMethodName: string;
  status: string;
  items: PurchaseItem[];
};

type ReturnItem = PurchaseItem & {
  purchaseItemId: string;
  originalQuantity: number;
  previouslyReturnedQuantity: number;
  remainingQuantity: number;
  returnQuantity: number;
};

type PreviousReturn = {
  purchaseId: string;
  status: string;
  items: Array<{
    purchaseItemId?: string;
    productId?: string;
    warehouseId?: string;
    quantity?: number;
  }>;
};

const numberValue = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("ar-YE", {
    maximumFractionDigits: 2,
  }).format(value);

const formatCurrency = (value: number) => `${formatNumber(value)} ر.ي`;

export default function NewPurchaseReturnPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [companyId, setCompanyId] = useState("");
  const [authUser, setAuthUser] = useState<any>(null);

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [previousReturns, setPreviousReturns] = useState<PreviousReturn[]>([]);

  const [search, setSearch] = useState("");
  const [selectedPurchaseId, setSelectedPurchaseId] = useState("");

  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("supplier_credit");
  const [paymentMethodName, setPaymentMethodName] =
    useState("خصم من حساب المورد");

  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

  // ==========================================
  // تحميل بيانات الشركة والفواتير
  // ==========================================

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const storedUser = localStorage.getItem("authUser");

      if (!storedUser) {
        router.replace("/login");
        return;
      }

      const user = JSON.parse(storedUser);

      if (user.type === "platform") {
        setError("لا يمكن لمستخدم المنصة إنشاء مرتجعات مشتريات.");
        return;
      }

      if (!user.companyId) {
        setError("لم يتم العثور على الشركة المرتبطة بالمستخدم.");
        return;
      }

      setAuthUser(user);
      setCompanyId(user.companyId);

      const [purchasesResult, returnsResult] = await Promise.all([
        supabase
          .from("purchases")
          .select("*")
          .eq("companyId", user.companyId)
          .order("date", { ascending: false }),

        supabase
          .from("purchaseReturns")
          .select("purchaseId,items,status")
          .eq("companyId", user.companyId),
      ]);

      if (purchasesResult.error) {
        throw purchasesResult.error;
      }

      if (returnsResult.error) {
        throw returnsResult.error;
      }

      setPurchases((purchasesResult.data || []) as Purchase[]);
      setPreviousReturns((returnsResult.data || []) as PreviousReturn[]);
    } catch (err: any) {
      console.error("Load purchase return data error:", err);
      setError(err.message || "حدث خطأ أثناء تحميل البيانات.");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // الفاتورة المحددة
  // ==========================================

  const selectedPurchase = useMemo(
    () => purchases.find((p) => p.id === selectedPurchaseId),
    [purchases, selectedPurchaseId],
  );

  // ==========================================
  // حساب الكميات المرتجعة سابقاً
  // ==========================================

  function getPreviouslyReturned(purchaseId: string, item: PurchaseItem) {
    let quantity = 0;

    const itemId = String(item.id || "");
    const productId = String(item.productId || "");
    const warehouseId = String(item.warehouseId || "");

    previousReturns
      .filter(
        (returnRecord) =>
          returnRecord.purchaseId === purchaseId &&
          returnRecord.status !== "cancelled",
      )
      .forEach((returnRecord) => {
        (returnRecord.items || []).forEach((returnedItem) => {
          const sameItem =
            itemId &&
            returnedItem.purchaseItemId &&
            itemId === returnedItem.purchaseItemId;

          const sameProduct =
            !returnedItem.purchaseItemId &&
            productId &&
            returnedItem.productId === productId &&
            String(returnedItem.warehouseId || "") === warehouseId;

          if (sameItem || sameProduct) {
            quantity += numberValue(returnedItem.quantity);
          }
        });
      });

    return quantity;
  }

  // ==========================================
  // اختيار فاتورة المشتريات
  // ==========================================

  function handlePurchaseChange(purchaseId: string) {
    setSelectedPurchaseId(purchaseId);
    setError("");

    const purchase = purchases.find((p) => p.id === purchaseId);

    if (!purchase) {
      setReturnItems([]);
      return;
    }

    const items = Array.isArray(purchase.items) ? purchase.items : [];

    const mappedItems: ReturnItem[] = items.map((item, index) => {
      const originalQuantity = numberValue(item.quantity);

      const previouslyReturnedQuantity = getPreviouslyReturned(
        purchase.id,
        item,
      );

      const remainingQuantity = Math.max(
        0,
        originalQuantity - previouslyReturnedQuantity,
      );

      return {
        ...item,
        purchaseItemId: String(item.id || `item-${index}`),
        originalQuantity,
        previouslyReturnedQuantity,
        remainingQuantity,
        returnQuantity: 0,
      };
    });

    setReturnItems(mappedItems);

    // طريقة رد قيمة المرتجع الافتراضية
    setPaymentMethod("supplier_credit");
    setPaymentMethodName("خصم من حساب المورد");
  }

  // ==========================================
  // تعديل كمية الإرجاع
  // ==========================================

  function updateReturnQuantity(index: number, value: string) {
    const quantity = numberValue(value);

    setReturnItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        return {
          ...item,
          returnQuantity: Math.min(
            Math.max(0, quantity),
            item.remainingQuantity,
          ),
        };
      }),
    );
  }

  // ==========================================
  // حساب الإجماليات
  // ==========================================

  const calculations = useMemo(() => {
    if (!selectedPurchase) {
      return {
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        totalQuantity: 0,
        itemCount: 0,
      };
    }

    let subtotal = 0;
    let lineDiscount = 0;
    let totalQuantity = 0;
    let itemCount = 0;

    returnItems.forEach((item) => {
      const quantity = numberValue(item.returnQuantity);

      if (quantity <= 0) return;

      const originalQuantity = numberValue(item.originalQuantity);
      const price = numberValue(item.price);
      const originalDiscount = numberValue(item.discount);

      const itemGross = price * quantity;

      const allocatedLineDiscount =
        originalQuantity > 0
          ? (originalDiscount / originalQuantity) * quantity
          : 0;

      subtotal += itemGross;
      lineDiscount += allocatedLineDiscount;
      totalQuantity += quantity;
      itemCount += 1;
    });

    const purchaseSubtotal = numberValue(selectedPurchase.subtotal);

    const invoiceDiscount = numberValue(selectedPurchase.discount);

    const afterLineDiscount = Math.max(0, subtotal - lineDiscount);

    const allocatedInvoiceDiscount =
      purchaseSubtotal > 0
        ? Math.min(
            afterLineDiscount,
            (invoiceDiscount * afterLineDiscount) / purchaseSubtotal,
          )
        : 0;

    const totalDiscount = lineDiscount + allocatedInvoiceDiscount;

    const taxableAmount = Math.max(0, subtotal - totalDiscount);

    const taxRate = numberValue(selectedPurchase.taxRate);

    const tax = (taxableAmount * taxRate) / 100;

    const total = taxableAmount + tax;

    return {
      subtotal,
      discount: totalDiscount,
      tax,
      total,
      totalQuantity,
      itemCount,
    };
  }, [returnItems, selectedPurchase]);

  // ==========================================
  // الفواتير المتاحة
  // ==========================================

  const availablePurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const invoice = String(purchase.invoiceNumber || "").toLowerCase();
      const supplier = String(purchase.supplier || "").toLowerCase();

      const matchesSearch =
        invoice.includes(search.toLowerCase()) ||
        supplier.includes(search.toLowerCase());

      const hasItems =
        Array.isArray(purchase.items) && purchase.items.length > 0;

      return matchesSearch && hasItems;
    });
  }, [purchases, search]);

  // ==========================================
  // حفظ المرتجع كمسودة
  // ==========================================

  async function handleSave() {
    try {
      setError("");

      if (!companyId || !authUser) {
        setError("بيانات المستخدم أو الشركة غير مكتملة.");
        return;
      }

      if (!selectedPurchase) {
        setError("يرجى اختيار فاتورة المشتريات.");
        return;
      }

      if (!returnDate) {
        setError("يرجى تحديد تاريخ المرتجع.");
        return;
      }

      if (!reason.trim()) {
        setError("يرجى إدخال سبب الإرجاع.");
        return;
      }

      const selectedItems = returnItems.filter(
        (item) => numberValue(item.returnQuantity) > 0,
      );

      if (selectedItems.length === 0) {
        setError("يرجى تحديد كمية صنف واحد على الأقل.");
        return;
      }

      for (const item of selectedItems) {
        if (item.returnQuantity > item.remainingQuantity) {
          setError(
            `الكمية المرتجعة من ${item.productName || item.name} أكبر من الكمية المتبقية.`,
          );
          return;
        }
      }

      if (calculations.total <= 0) {
        setError("قيمة المرتجع يجب أن تكون أكبر من صفر.");
        return;
      }

      setSaving(true);

      // رقم المرتجع
      const { data: existingReturns, error: numberError } = await supabase
        .from("purchaseReturns")
        .select("returnNumber")
        .eq("companyId", companyId);

      if (numberError) throw numberError;

      const numbers = (existingReturns || [])
        .map((item) => {
          const match = String(item.returnNumber || "").match(/RET-(\d+)/);
          return match ? Number(match[1]) : 0;
        })
        .filter((number) => Number.isFinite(number));

      const nextNumber = Math.max(0, ...numbers) + 1;

      const returnNumber = `RET-${String(nextNumber).padStart(4, "0")}`;

      const savedItems = selectedItems.map((item) => {
        const quantity = numberValue(item.returnQuantity);

        const originalQuantity = numberValue(item.originalQuantity);

        const itemDiscount = numberValue(item.discount);

        const allocatedDiscount =
          originalQuantity > 0
            ? (itemDiscount / originalQuantity) * quantity
            : 0;

        return {
          id: crypto.randomUUID(),

          purchaseItemId: item.purchaseItemId,

          name: item.name || item.productName || "",
          productName: item.productName || item.name || "",

          unit: item.unit || "",

          price: numberValue(item.price),

          quantity,

          originalQuantity,

          previouslyReturnedQuantity: item.previouslyReturnedQuantity,

          remainingQuantity: item.remainingQuantity,

          productId: item.productId || "",
          productCode: item.productCode || "",

          warehouseId: item.warehouseId || "",
          warehouseName: item.warehouseName || "",

          discount: allocatedDiscount,

          total: numberValue(item.price) * quantity,
        };
      });

      const payload = {
        id: crypto.randomUUID(),

        companyId,

        returnNumber,

        date: returnDate,

        purchaseId: selectedPurchase.id,
        purchaseInvoiceNumber: selectedPurchase.invoiceNumber,

        supplierId: selectedPurchase.supplierId || "",
        supplier: selectedPurchase.supplier || "",

        items: savedItems,

        itemCount: calculations.itemCount,
        totalQuantity: calculations.totalQuantity,

        subtotal: calculations.subtotal,
        discount: calculations.discount,
        tax: calculations.tax,
        taxRate: numberValue(selectedPurchase.taxRate),
        total: calculations.total,

        paymentMethod,
        paymentMethodName,
        paymentAccountId: "",

        status: "draft",

        reason: reason.trim(),
        notes: notes.trim(),

        createdBy:
          authUser.fullName || authUser.name || authUser.username || "",

        createdById: authUser.id || "",
        createdByUsername: authUser.username || "",
        createdByRole: authUser.role || "",
        createdByType: authUser.type || "",

        updatedBy: "",
        updatedById: "",

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from("purchaseReturns")
        .insert(payload);

      if (insertError) throw insertError;

      router.push("/erp/purchases/returns");
      router.refresh();
    } catch (err: any) {
      console.error("Save purchase return error:", err);

      setError(err.message || "حدث خطأ أثناء حفظ مرتجع المشتريات.");
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // حالات التحميل
  // ==========================================

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500">
            جاري تحميل فواتير المشتريات...
          </p>
        </div>
      </div>
    );
  }

  if (error && !companyId) {
    return (
      <div dir="rtl" className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  // ==========================================
  // واجهة الصفحة
  // ==========================================

  return (
    <div dir="rtl" className="space-y-6 pb-10">
      {/* Header */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <button
              onClick={() => router.push("/erp/purchases/returns")}
              className="hover:text-blue-600"
            >
              مرتجعات المشتريات
            </button>

            <span>/</span>

            <span className="text-gray-800">إنشاء مرتجع جديد</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800">
            إنشاء مرتجع مشتريات
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            إنشاء مرتجع مرتبط بفاتورة مشتريات سابقة.
          </p>
        </div>

        <button
          onClick={() => router.push("/erp/purchases/returns")}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <FiArrowRight />
          العودة للمرتجعات
        </button>
      </div>

      {/* Error */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FiAlertCircle className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Invoice selection */}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <FiFileText size={20} />
          </div>

          <div>
            <h2 className="font-bold text-gray-800">
              فاتورة المشتريات الأصلية
            </h2>

            <p className="text-sm text-gray-500">
              اختر الفاتورة التي تريد إرجاع أصناف منها.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            البحث عن فاتورة
          </label>

          <div className="relative">
            <FiSearch className="absolute right-3 top-3.5 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="رقم الفاتورة أو اسم المورد..."
              className="w-full rounded-lg border border-gray-300 py-3 pr-10 pl-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            اختر فاتورة المشتريات *
          </label>

          <select
            value={selectedPurchaseId}
            onChange={(e) => handlePurchaseChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500"
          >
            <option value="">-- اختر الفاتورة --</option>

            {availablePurchases.map((purchase) => (
              <option key={purchase.id} value={purchase.id}>
                {purchase.invoiceNumber} - {purchase.supplier} -{" "}
                {formatCurrency(numberValue(purchase.total))}
              </option>
            ))}
          </select>

          {availablePurchases.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">
              لا توجد فواتير مطابقة للبحث.
            </p>
          )}
        </div>

        {selectedPurchase && (
          <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-gray-500">رقم الفاتورة</p>
              <p className="mt-1 font-semibold text-gray-800">
                {selectedPurchase.invoiceNumber}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">المورد</p>
              <p className="mt-1 font-semibold text-gray-800">
                {selectedPurchase.supplier || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">تاريخ الفاتورة</p>
              <p className="mt-1 font-semibold text-gray-800">
                {selectedPurchase.date || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">حالة الفاتورة</p>
              <p className="mt-1 font-semibold text-gray-800">
                {selectedPurchase.status || "-"}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Return information */}

      {selectedPurchase && (
        <>
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-5 font-bold text-gray-800">بيانات المرتجع</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  تاريخ المرتجع *
                </label>

                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  سبب الإرجاع *
                </label>

                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500"
                >
                  <option value="">-- اختر السبب --</option>
                  <option value="بضاعة تالفة">بضاعة تالفة</option>
                  <option value="بضاعة غير مطابقة">بضاعة غير مطابقة</option>
                  <option value="زيادة في الكمية">زيادة في الكمية</option>
                  <option value="انتهاء الصلاحية">انتهاء الصلاحية</option>
                  <option value="خطأ في الطلب">خطأ في الطلب</option>
                  <option value="أسباب أخرى">أسباب أخرى</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  ملاحظات
                </label>

                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية..."
                  className="w-full resize-none rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </section>

          {/* Items */}

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 p-5">
              <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
                <FiPackage size={20} />
              </div>

              <div>
                <h2 className="font-bold text-gray-800">أصناف المرتجع</h2>

                <p className="text-sm text-gray-500">
                  حدد الكميات التي تريد إرجاعها.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-right text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3">الصنف</th>
                    <th className="px-4 py-3">المخزن</th>
                    <th className="px-4 py-3">سعر الوحدة</th>
                    <th className="px-4 py-3">الكمية الأصلية</th>
                    <th className="px-4 py-3">مرتجع سابقاً</th>
                    <th className="px-4 py-3">المتاح للإرجاع</th>
                    <th className="px-4 py-3">كمية الإرجاع</th>
                    <th className="px-4 py-3">الإجمالي</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {returnItems.map((item, index) => (
                    <tr key={item.purchaseItemId}>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-800">
                          {item.productName || item.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.productCode || "-"}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {item.warehouseName || "-"}
                      </td>

                      <td className="px-4 py-4">
                        {formatCurrency(numberValue(item.price))}
                      </td>

                      <td className="px-4 py-4">
                        {formatNumber(item.originalQuantity)}
                      </td>

                      <td className="px-4 py-4 text-orange-600">
                        {formatNumber(item.previouslyReturnedQuantity)}
                      </td>

                      <td className="px-4 py-4 font-semibold text-green-700">
                        {formatNumber(item.remainingQuantity)}
                      </td>

                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="0"
                          max={item.remainingQuantity}
                          step="any"
                          value={item.returnQuantity || ""}
                          disabled={item.remainingQuantity <= 0}
                          onChange={(e) =>
                            updateReturnQuantity(index, e.target.value)
                          }
                          placeholder="0"
                          className="w-28 rounded-lg border border-gray-300 p-2 outline-none focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </td>

                      <td className="px-4 py-4 font-semibold text-gray-800">
                        {formatCurrency(
                          numberValue(item.price) *
                            numberValue(item.returnQuantity),
                        )}
                      </td>
                    </tr>
                  ))}

                  {returnItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        لا توجد أصناف في هذه الفاتورة.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Payment method */}

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-gray-800">
              طريقة تسوية المرتجع
            </h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                {
                  value: "supplier_credit",
                  label: "خصم من حساب المورد",
                },
                {
                  value: "cash",
                  label: "استرداد نقدي",
                },
                {
                  value: "bank",
                  label: "استرداد بنكي",
                },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 ${
                    paymentMethod === method.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={() => {
                      setPaymentMethod(method.value);
                      setPaymentMethodName(method.label);
                    }}
                  />

                  <span className="text-sm font-medium text-gray-700">
                    {method.label}
                  </span>
                </label>
              ))}
            </div>

            <p className="mt-3 text-xs text-gray-500">
              اختيار طريقة التسوية هنا يحفظها في المسودة فقط، ولا ينفذ حركة
              نقدية أو قيدًا محاسبيًا.
            </p>
          </section>

          {/* Totals */}

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-gray-800">ملخص المرتجع</h2>

            <div className="ml-auto max-w-md space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">عدد الأصناف</span>
                <span className="font-semibold">
                  {formatNumber(calculations.itemCount)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">إجمالي الكميات</span>
                <span className="font-semibold">
                  {formatNumber(calculations.totalQuantity)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">الإجمالي قبل الخصم</span>
                <span className="font-semibold">
                  {formatCurrency(calculations.subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">الخصم</span>
                <span className="font-semibold text-red-600">
                  - {formatCurrency(calculations.discount)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">الضريبة</span>
                <span className="font-semibold">
                  {formatCurrency(calculations.tax)}
                </span>
              </div>

              <div className="flex justify-between border-t border-gray-200 pt-4">
                <span className="font-bold text-gray-800">
                  صافي قيمة المرتجع
                </span>

                <span className="text-xl font-bold text-blue-700">
                  {formatCurrency(calculations.total)}
                </span>
              </div>
            </div>
          </section>

          {/* Actions */}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              onClick={() => router.push("/erp/purchases/returns")}
              disabled={saving}
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              إلغاء
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiSave />

              {saving ? "جاري الحفظ..." : "حفظ كمسودة"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
