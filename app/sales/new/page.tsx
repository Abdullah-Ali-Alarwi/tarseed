"use client";

import { useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import {
  FiShoppingCart,
  FiFileText,
  FiPackage,
  FiPlus,
  FiTrash2,
  FiDollarSign,
} from "react-icons/fi";

import { useProductsStore } from "@/Store/productsStore";
import { useCustomersStore } from "@/Store/customersStore";
import { useBankAccountsStore } from "@/Store/bankAccountsStore";
import { useSalesStore } from "@/Store/salesStore";

/* =========================================================
   الأنواع
========================================================= */

type PaymentMethod = "cash" | "bank" | "credit";

type InvoiceItem = {
  id: number;
  item: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
};

/* =========================================================
   الصفحة
========================================================= */

export default function NewSalesPage() {
  /* =======================================================
     Stores
  ======================================================= */

  const products = useProductsStore((state) => state.products);

  const customers = useCustomersStore((state) => state.customers);

  const bankAccounts = useBankAccountsStore((state) => state.bankAccounts);

  const addSale = useSalesStore((state) => state.addSale);

  /* =======================================================
     بيانات العميل والدفع
  ======================================================= */

  // اسم العميل أصبح إدخالًا نصيًا يدويًا
  const [customerName, setCustomerName] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const [bankAccountId, setBankAccountId] = useState("");

  const [creditCustomerId, setCreditCustomerId] = useState("");

  /* =======================================================
     أصناف الفاتورة
  ======================================================= */

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  /* =======================================================
     إضافة صنف
  ======================================================= */

  const [selectedItem, setSelectedItem] = useState("");

  const [quantity, setQuantity] = useState("");

  const [price, setPrice] = useState("");

  const [discount, setDiscount] = useState("");

  /* =======================================================
     بيانات الصنف الحالي
  ======================================================= */

  const currentSubtotal = Number(quantity || 0) * Number(price || 0);

  const currentDiscount = Number(discount || 0);

  const currentItemTotal = Math.max(currentSubtotal - currentDiscount, 0);

  /* =======================================================
     البحث عن العميل بالاسم
  ======================================================= */

  const selectedCustomer = useMemo(() => {
    const name = customerName.trim();

    if (!name) return undefined;

    return customers.find(
      (customer) => customer.name.trim().toLowerCase() === name.toLowerCase(),
    );
  }, [customerName, customers]);

  /* =======================================================
     عميل حساب الآجل
  ======================================================= */

  const selectedCreditCustomer = useMemo(() => {
    if (!creditCustomerId) return undefined;

    return customers.find((customer) => customer.id === creditCustomerId);
  }, [creditCustomerId, customers]);

  /* =======================================================
     الحساب البنكي
  ======================================================= */

  const selectedBankAccount = useMemo(() => {
    if (!bankAccountId) return undefined;

    return bankAccounts.find((account) => account.id === bankAccountId);
  }, [bankAccountId, bankAccounts]);

  /* =======================================================
     بيانات الحساب حسب طريقة الدفع
  ======================================================= */

  const paymentAccount = useMemo(() => {
    /* -------------------------------------------------------
       نقدًا
    ------------------------------------------------------- */

    if (paymentMethod === "cash") {
      return {
        code: "1002",
        name: "الصندوق",
      };
    }

    /* -------------------------------------------------------
       حوالة بنكية
    ------------------------------------------------------- */

    if (paymentMethod === "bank") {
      if (!selectedBankAccount) {
        return {
          code: "",
          name: "",
        };
      }

      return {
        code: selectedBankAccount.code,
        name: selectedBankAccount.name,
      };
    }

    /* -------------------------------------------------------
       آجل
    ------------------------------------------------------- */

    if (!selectedCreditCustomer) {
      return {
        code: "",
        name: "",
      };
    }

    return {
      code: selectedCreditCustomer.accountCode ?? "",
      name: selectedCreditCustomer.accountName ?? selectedCreditCustomer.name,
    };
  }, [paymentMethod, selectedBankAccount, selectedCreditCustomer]);

  /* =======================================================
     إضافة الصنف إلى الفاتورة
  ======================================================= */

  const handleAddItem = () => {
    if (!selectedItem) {
      toast.error("يرجى اختيار الصنف");
      return;
    }

    if (Number(quantity) <= 0) {
      toast.error("يرجى إدخال كمية صحيحة");
      return;
    }

    if (Number(price) <= 0) {
      toast.error("يرجى إدخال سعر صحيح");
      return;
    }

    if (Number(discount || 0) > currentSubtotal) {
      toast.error("الخصم لا يمكن أن يكون أكبر من إجمالي الصنف");
      return;
    }

    const newItem: InvoiceItem = {
      id: Date.now(),
      item: selectedItem,
      quantity: Number(quantity),
      price: Number(price),
      discount: Number(discount || 0),
      total: currentItemTotal,
    };

    setInvoiceItems((prev) => [...prev, newItem]);

    toast.success(`تمت إضافة "${selectedItem}" إلى الفاتورة`);

    setSelectedItem("");
    setQuantity("");
    setPrice("");
    setDiscount("");
  };

  /* =======================================================
     حذف صنف
  ======================================================= */

  const handleDeleteItem = (id: number) => {
    const deletedItem = invoiceItems.find((item) => item.id === id);

    setInvoiceItems((prev) => prev.filter((item) => item.id !== id));

    if (deletedItem) {
      toast.success(`تم حذف "${deletedItem.item}" من الفاتورة`);
    }
  };

  /* =======================================================
     إجماليات الفاتورة
  ======================================================= */

  const totalQuantity = invoiceItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  const subtotal = invoiceItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
    0,
  );

  const totalDiscount = invoiceItems.reduce(
    (sum, item) => sum + Number(item.discount || 0),
    0,
  );

  const invoiceTotal = invoiceItems.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0,
  );

  /* =======================================================
     العميل النهائي
  ======================================================= */

  const finalCustomer = useMemo(() => {
    if (paymentMethod === "credit") {
      return selectedCreditCustomer;
    }

    return selectedCustomer;
  }, [paymentMethod, selectedCustomer, selectedCreditCustomer]);

  /* =======================================================
     سؤال الطباعة
  ======================================================= */

  const askForPrint = (invoiceId: string) => {
    toast(
      <div dir="rtl" className="w-[320px]">
        <div className="mb-2 text-base font-bold text-gray-800">
          تم حفظ الفاتورة بنجاح
        </div>

        <div className="mb-4 text-sm text-gray-600">
          هل تريد طباعة الفاتورة؟
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              toast.dismiss();

              window.open(`/sales/${invoiceId}/print`, "_blank");
            }}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
          >
            نعم، طباعة
          </button>

          <button
            type="button"
            onClick={() => {
              toast.dismiss();
            }}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
          >
            لا
          </button>
        </div>
      </div>,
      {
        duration: 10000,
        closeButton: true,
      },
    );
  };

  /* =======================================================
     حفظ الفاتورة
  ======================================================= */

  const handleSaveInvoice = () => {
    /* -------------------------------------------------------
       التحقق من الأصناف
    ------------------------------------------------------- */

    if (invoiceItems.length === 0) {
      toast.error("لا يمكن حفظ الفاتورة بدون أصناف");
      return;
    }

    /* -------------------------------------------------------
       التحقق من اسم العميل
    ------------------------------------------------------- */

    if (!customerName.trim()) {
      toast.error("يرجى إدخال اسم العميل");
      return;
    }

    /* -------------------------------------------------------
       التحقق من الدفع البنكي
    ------------------------------------------------------- */

    if (paymentMethod === "bank" && !bankAccountId) {
      toast.error("يرجى اختيار الحساب البنكي");
      return;
    }

    /* -------------------------------------------------------
       التحقق من البيع الآجل
    ------------------------------------------------------- */

    if (paymentMethod === "credit") {
      if (!creditCustomerId) {
        toast.error("يرجى اختيار حساب العميل");
        return;
      }

      if (!selectedCreditCustomer?.accountCode) {
        toast.error("العميل المحدد لا يملك حسابًا محاسبيًا مرتبطًا");
        return;
      }
    }

    /* -------------------------------------------------------
       بيانات البيع
    ------------------------------------------------------- */

    const sale = addSale({
      date: new Date().toISOString().split("T")[0],

      customerId: finalCustomer?.id || undefined,

      customerName:
        paymentMethod === "credit"
          ? selectedCreditCustomer?.name || customerName.trim()
          : customerName.trim(),

      paymentMethod,

      accountCode: paymentAccount.code || undefined,

      accountName: paymentAccount.name || undefined,

      items: invoiceItems.map((item) => ({
        id: item.id,
        item: item.item,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        total: item.total,
      })),

      status: paymentMethod === "credit" ? "pending" : "paid",
    });

    /* -------------------------------------------------------
       إشعار الحفظ
    ------------------------------------------------------- */

    toast.success(`تم حفظ الفاتورة ${sale.invoiceNumber} بنجاح`);

    /* -------------------------------------------------------
       سؤال الطباعة باستخدام ID الحقيقي
    ------------------------------------------------------- */

    askForPrint(sale.id);

    /* -------------------------------------------------------
       تفريغ الصفحة بعد الحفظ
    ------------------------------------------------------- */

    setInvoiceItems([]);

    setCustomerName("");

    setCreditCustomerId("");

    setBankAccountId("");

    setPaymentMethod("cash");
  };

  /* =======================================================
     تفريغ الفاتورة
  ======================================================= */

  const handleClearInvoice = () => {
    if (invoiceItems.length === 0) {
      toast.error("الفاتورة فارغة");
      return;
    }

    setInvoiceItems([]);

    toast.success("تم تفريغ أصناف الفاتورة");
  };

  /* =======================================================
     طريقة الدفع بالعربي
  ======================================================= */

  const paymentMethodLabel =
    paymentMethod === "cash"
      ? "نقدًا"
      : paymentMethod === "bank"
        ? "حوالة بنكية"
        : "آجل";

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-3 text-sm">
      <Toaster position="top-center" richColors closeButton dir="rtl" />

      <div className="mx-auto max-w-[1500px]">
        {/* =================================================
            رأس الصفحة
        ================================================= */}

        <div className="mb-3 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <FiShoppingCart size={17} />
            </div>

            <div>
              <h1 className="text-base font-bold text-gray-800">
                فاتورة مبيعات جديدة
              </h1>

              <p className="text-[10px] text-gray-500">
                إنشاء فاتورة مبيعات وإضافة الأصناف
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-md bg-gray-50 px-3 py-2 sm:flex">
            <FiFileText size={13} className="text-gray-400" />

            <span className="text-[10px] text-gray-500">عدد الأصناف:</span>

            <span className="text-xs font-bold text-gray-800">
              {invoiceItems.length}
            </span>
          </div>
        </div>

        {/* =================================================
            بيانات العميل والدفع
        ================================================= */}

        <section className="mb-3 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-3 py-2">
            <h2 className="text-xs font-bold text-gray-800">
              بيانات فاتورة المبيعات
            </h2>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* -----------------------------------------
                  اسم العميل
              ------------------------------------------ */}

              <div>
                <label
                  htmlFor="customerName"
                  className="mb-1 block text-[10px] font-semibold text-gray-600"
                >
                  اسم العميل
                </label>

                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="اكتب اسم العميل"
                  className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                />
              </div>

              {/* -----------------------------------------
                  طريقة الدفع
              ------------------------------------------ */}

              <div>
                <label className="mb-1 block text-[10px] font-semibold text-gray-600">
                  طريقة الدفع
                </label>

                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    const value = e.target.value as PaymentMethod;

                    setPaymentMethod(value);

                    if (value !== "bank") {
                      setBankAccountId("");
                    }

                    if (value !== "credit") {
                      setCreditCustomerId("");
                    }
                  }}
                  className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                >
                  <option value="credit">آجل</option>

                  <option value="cash">نقدًا</option>

                  <option value="bank">حوالة بنكية</option>
                </select>
              </div>

              {/* -----------------------------------------
                  الحساب
              ------------------------------------------ */}

              <div>
                <label className="mb-1 block text-[10px] font-semibold text-gray-600">
                  {paymentMethod === "cash"
                    ? "الحساب"
                    : paymentMethod === "bank"
                      ? "الحساب البنكي"
                      : "حساب العميل"}
                </label>

                {/* نقدًا */}

                {paymentMethod === "cash" && (
                  <input
                    type="text"
                    value="1002 - الصندوق"
                    readOnly
                    className="h-9 w-full rounded-md border border-gray-300 bg-gray-100 px-2 text-xs text-gray-600"
                  />
                )}

                {/* حوالة بنكية */}

                {paymentMethod === "bank" && (
                  <select
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                    className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                  >
                    <option value="">اختر الحساب البنكي</option>

                    {bankAccounts
                      .filter((account) => account.isActive !== false)
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                  </select>
                )}

                {/* آجل */}

                {paymentMethod === "credit" && (
                  <select
                    value={creditCustomerId}
                    onChange={(e) => setCreditCustomerId(e.target.value)}
                    className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                  >
                    <option value="">اختر حساب العميل</option>

                    {customers
                      .filter((customer) => customer.id !== "CASH-CUSTOMER")
                      .map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.accountCode
                            ? `${customer.accountCode} - ${customer.name}`
                            : customer.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </div>

            {/* ---------------------------------------------
                معلومات الحساب الحالي
            ---------------------------------------------- */}

            <div className="mt-3 flex flex-wrap gap-2">
              <div className="rounded-md bg-gray-50 px-3 py-1.5">
                <span className="text-[9px] text-gray-400">طريقة الدفع</span>

                <span className="mr-2 text-[10px] font-bold text-gray-700">
                  {paymentMethodLabel}
                </span>
              </div>

              <div className="rounded-md bg-blue-50 px-3 py-1.5">
                <span className="text-[9px] text-gray-400">الحساب</span>

                <span className="mr-2 text-[10px] font-bold text-blue-700">
                  {paymentAccount.code
                    ? `${paymentAccount.code} - ${paymentAccount.name}`
                    : "لم يتم اختيار الحساب"}
                </span>
              </div>

              <div className="rounded-md bg-gray-50 px-3 py-1.5">
                <span className="text-[9px] text-gray-400">العميل</span>

                <span className="mr-2 text-[10px] font-bold text-gray-700">
                  {customerName.trim() || "عميل نقدي"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            إضافة صنف
        ================================================= */}

        <section className="mb-3 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <FiPackage size={15} className="text-blue-600" />

            <h2 className="text-xs font-bold text-gray-800">إضافة صنف جديد</h2>
          </div>

          <div className="p-3">
            <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
              {/* الصنف */}

              <div className="w-full sm:w-[210px]">
                <label
                  htmlFor="item"
                  className="mb-1 block text-[10px] font-semibold text-gray-600"
                >
                  الصنف
                </label>

                <div className="relative">
                  <FiPackage
                    size={13}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <select
                    id="item"
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="h-8 w-full rounded-md border border-gray-300 bg-white pr-7 pl-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                  >
                    <option value="">اختر الصنف</option>

                    {products.map((product) => (
                      <option key={product.id} value={product.name}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* الكمية */}

              <div className="w-[90px]">
                <label
                  htmlFor="quantity"
                  className="mb-1 block text-[10px] font-semibold text-gray-600"
                >
                  الكمية
                </label>

                <input
                  id="quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="h-8 w-full rounded-md border border-gray-300 px-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                />
              </div>

              {/* السعر */}

              <div className="w-[115px]">
                <label
                  htmlFor="price"
                  className="mb-1 block text-[10px] font-semibold text-gray-600"
                >
                  سعر الوحدة
                </label>

                <input
                  id="price"
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="h-8 w-full rounded-md border border-gray-300 px-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                />
              </div>

              {/* الخصم */}

              <div className="w-[95px]">
                <label
                  htmlFor="discount"
                  className="mb-1 block text-[10px] font-semibold text-gray-600"
                >
                  الخصم
                </label>

                <input
                  id="discount"
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="h-8 w-full rounded-md border border-gray-300 px-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* زر الإضافة */}

            <div className="mt-3 flex justify-start">
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-md bg-blue-600 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
              >
                <FiPlus size={13} />
                إضافة المنتج
              </button>
            </div>
          </div>

          {/* -----------------------------------------------
              ملخص الصنف الحالي
          ------------------------------------------------ */}

          <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50/70 px-3 py-2">
            <div className="flex min-w-[145px] items-center justify-between gap-3 rounded-md bg-white px-2.5 py-1.5 shadow-sm">
              <span className="text-[10px] text-gray-500">قبل الخصم</span>

              <span className="text-xs font-bold text-gray-700">
                {currentSubtotal.toLocaleString()}
              </span>
            </div>

            <div className="flex min-w-[145px] items-center justify-between gap-3 rounded-md bg-blue-50 px-2.5 py-1.5">
              <span className="text-[10px] text-gray-500">إجمالي الصنف</span>

              <span className="text-xs font-bold text-blue-600">
                {currentItemTotal.toLocaleString()}
              </span>
            </div>

            <div className="flex min-w-[120px] items-center justify-between gap-3 rounded-md bg-red-50 px-2.5 py-1.5">
              <span className="text-[10px] text-gray-500">الخصم</span>

              <span className="text-xs font-bold text-red-600">
                {currentDiscount.toLocaleString()}
              </span>
            </div>

            <span className="self-center text-[9px] text-gray-400">ريال</span>
          </div>
        </section>

        {/* =================================================
            جدول الأصناف
        ================================================= */}

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <div className="flex items-center gap-2">
              <FiShoppingCart size={14} className="text-blue-600" />

              <h2 className="text-xs font-bold text-gray-800">
                أصناف الفاتورة
              </h2>
            </div>

            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
              {invoiceItems.length} صنف
            </span>
          </div>

          {invoiceItems.length === 0 ? (
            <div className="flex min-h-[100px] items-center justify-center text-[11px] text-gray-400">
              لم تتم إضافة أي أصناف بعد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-right text-[11px]">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="w-10 px-2 py-2 font-semibold">#</th>

                    <th className="px-2 py-2 font-semibold">الصنف</th>

                    <th className="w-20 px-2 py-2 font-semibold">الكمية</th>

                    <th className="w-28 px-2 py-2 font-semibold">سعر الوحدة</th>

                    <th className="w-24 px-2 py-2 font-semibold">الخصم</th>

                    <th className="w-28 px-2 py-2 font-semibold">الإجمالي</th>

                    <th className="w-16 px-2 py-2 font-semibold">إجراء</th>
                  </tr>
                </thead>

                <tbody>
                  {invoiceItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-t border-gray-100 transition hover:bg-gray-50"
                    >
                      <td className="px-2 py-1.5 text-gray-400">{index + 1}</td>

                      <td className="px-2 py-1.5 font-semibold text-gray-800">
                        {item.item}
                      </td>

                      <td className="px-2 py-1.5 text-gray-700">
                        {item.quantity.toLocaleString()}
                      </td>

                      <td className="px-2 py-1.5 text-gray-700">
                        {item.price.toLocaleString()}
                      </td>

                      <td className="px-2 py-1.5 text-red-600">
                        {item.discount.toLocaleString()}
                      </td>

                      <td className="px-2 py-1.5 font-bold text-gray-800">
                        {item.total.toLocaleString()}
                      </td>

                      <td className="px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          title="حذف الصنف"
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-red-50 text-red-600 transition hover:bg-red-100"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* =================================================
            ملخص الفاتورة
        ================================================= */}

        <section className="mt-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <FiDollarSign size={14} className="text-blue-600" />

            <h2 className="text-xs font-bold text-gray-800">ملخص الفاتورة</h2>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {/* إجمالي الكمية */}

            <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
              <span className="text-[10px] text-gray-500">إجمالي الكمية</span>

              <span className="text-sm font-bold text-gray-800">
                {totalQuantity.toLocaleString()}
              </span>
            </div>

            {/* إجمالي الخصم */}

            <div className="flex items-center justify-between rounded-md bg-red-50 px-3 py-2">
              <span className="text-[10px] text-gray-500">إجمالي الخصم</span>

              <span className="text-sm font-bold text-red-600">
                {totalDiscount.toLocaleString()}
              </span>
            </div>

            {/* عدد الأصناف */}

            <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
              <span className="text-[10px] text-gray-500">عدد الأصناف</span>

              <span className="text-sm font-bold text-gray-800">
                {invoiceItems.length.toLocaleString()}
              </span>
            </div>

            {/* إجمالي الفاتورة */}

            <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-2">
              <span className="text-[10px] text-gray-500">إجمالي الفاتورة</span>

              <span className="text-sm font-bold text-blue-600">
                {invoiceTotal.toLocaleString()}

                <span className="mr-1 text-[9px] font-normal">ريال</span>
              </span>
            </div>
          </div>
        </section>

        {/* =================================================
            أزرار الحفظ والتفريغ
        ================================================= */}

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClearInvoice}
            className="rounded-md border border-gray-300 bg-white px-5 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            تفريغ الفاتورة
          </button>

          <button
            type="button"
            onClick={handleSaveInvoice}
            className="rounded-md bg-blue-600 px-6 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
          >
            حفظ الفاتورة
          </button>
        </div>
      </div>
    </main>
  );
}
