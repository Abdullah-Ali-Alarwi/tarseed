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
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

/* =========================================================
   الأنواع
========================================================= */

type PaymentMethod = "cash" | "bank" | "credit";

type InvoiceItem = {
  id: number;

  /* مهم جدًا للمخزون */
  productId: string;

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
     ERP Store
  ======================================================= */

  const products = useERPStore((state) => state.products);

  const customers = useERPStore((state) => state.customers);

  const bankAccounts = useERPStore((state) => state.bankAccounts);

  const addSale = useERPStore((state) => state.addSale);

  /*
   * هذه الدالة تحسب المخزون الحقيقي من المشتريات - المبيعات
   */
  const getProductStock = useERPStore((state) => state.getProductStock);

  /* =======================================================
     بيانات العميل والدفع
  ======================================================= */

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

  /*
   * الآن نخزن ID المنتج وليس الاسم فقط
   */
  const [selectedItem, setSelectedItem] = useState("");

  const [quantity, setQuantity] = useState("");

  const [price, setPrice] = useState("");

  const [discount, setDiscount] = useState("");

  /* =======================================================
     المنتج المحدد
  ======================================================= */

  const selectedProduct = useMemo(() => {
    if (!selectedItem) return undefined;

    return products.find((product) => product.id === selectedItem);
  }, [selectedItem, products]);

  /* =======================================================
     المخزون الحالي للمنتج المحدد
  ======================================================= */

  const selectedProductStock = useMemo(() => {
    if (!selectedProduct) return 0;

    return getProductStock(selectedProduct.id);
  }, [selectedProduct, getProductStock]);

  /* =======================================================
     الكمية الموجودة مسبقًا في الفاتورة
  ======================================================= */

  const selectedProductInvoiceQuantity = useMemo(() => {
    if (!selectedProduct) return 0;

    return invoiceItems
      .filter((item) => item.productId === selectedProduct.id)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [selectedProduct, invoiceItems]);

  /* =======================================================
     الكمية المتبقية بعد الأصناف الموجودة في الفاتورة
  ======================================================= */

  const selectedProductRemainingStock = useMemo(() => {
    if (!selectedProduct) return 0;

    return Math.max(selectedProductStock - selectedProductInvoiceQuantity, 0);
  }, [selectedProduct, selectedProductStock, selectedProductInvoiceQuantity]);

  /* =======================================================
     الكمية المطلوبة حاليًا
  ======================================================= */

  const currentRequestedQuantity = Number(quantity || 0);

  /* =======================================================
     الكمية المتبقية بعد الإضافة الحالية
  ======================================================= */

  const remainingAfterCurrentQuantity = useMemo(() => {
    if (!selectedProduct) return 0;

    return Math.max(
      selectedProductRemainingStock - currentRequestedQuantity,
      0,
    );
  }, [
    selectedProduct,
    selectedProductRemainingStock,
    currentRequestedQuantity,
  ]);

  /* =======================================================
     حالة المخزون
  ======================================================= */

  const stockStatus = useMemo(() => {
    if (!selectedProduct) {
      return {
        type: "none" as const,
        text: "اختر الصنف",
      };
    }

    if (selectedProductStock <= 0) {
      return {
        type: "empty" as const,
        text: "المخزون نافذ",
      };
    }

    if (selectedProductRemainingStock <= 0) {
      return {
        type: "empty" as const,
        text: "تم استنفاد الكمية في الفاتورة",
      };
    }

    if (
      currentRequestedQuantity > 0 &&
      currentRequestedQuantity > selectedProductRemainingStock
    ) {
      return {
        type: "error" as const,
        text: "الكمية المطلوبة أكبر من المتاح",
      };
    }

    return {
      type: "available" as const,
      text: "متوفر",
    };
  }, [
    selectedProduct,
    selectedProductStock,
    selectedProductRemainingStock,
    currentRequestedQuantity,
  ]);

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
     عميل الحساب الآجل
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
        code: "1101",
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
        code: selectedBankAccount.accountCode || selectedBankAccount.code || "",

        name: selectedBankAccount.accountName || selectedBankAccount.name || "",
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
    /* -------------------------------------------------------
       التحقق من اختيار الصنف
    ------------------------------------------------------- */

    if (!selectedProduct) {
      toast.error("يرجى اختيار الصنف");

      return;
    }

    /* -------------------------------------------------------
       التحقق من نفاد المخزون
    ------------------------------------------------------- */

    if (selectedProductStock <= 0) {
      toast.error(`المخزون نافذ للصنف "${selectedProduct.name}"`);

      return;
    }

    /* -------------------------------------------------------
       التحقق من استنفاد المنتج داخل الفاتورة
    ------------------------------------------------------- */

    if (selectedProductRemainingStock <= 0) {
      toast.error(
        `تم استنفاد الكمية المتاحة للصنف "${selectedProduct.name}" داخل الفاتورة`,
      );

      return;
    }

    /* -------------------------------------------------------
       التحقق من الكمية
    ------------------------------------------------------- */

    if (Number(quantity) <= 0) {
      toast.error("يرجى إدخال كمية صحيحة");

      return;
    }

    /* -------------------------------------------------------
       التحقق من الكمية مقابل المخزون
    ------------------------------------------------------- */

    if (Number(quantity) > selectedProductRemainingStock) {
      toast.error(`المخزون غير كافٍ للصنف "${selectedProduct.name}"`, {
        description: `المتاح: ${selectedProductRemainingStock.toLocaleString()} | المطلوب: ${Number(
          quantity,
        ).toLocaleString()}`,
      });

      return;
    }

    /* -------------------------------------------------------
       التحقق من السعر
    ------------------------------------------------------- */

    if (Number(price) <= 0) {
      toast.error("يرجى إدخال سعر صحيح");

      return;
    }

    /* -------------------------------------------------------
       التحقق من الخصم
    ------------------------------------------------------- */

    if (Number(discount || 0) > currentSubtotal) {
      toast.error("الخصم لا يمكن أن يكون أكبر من إجمالي الصنف");

      return;
    }

    /* -------------------------------------------------------
       إنشاء الصنف
    ------------------------------------------------------- */

    const newItem: InvoiceItem = {
      id: Date.now(),

      /*
       * مهم جدًا:
       * نحفظ productId حتى يعرف المخزون أي منتج تم بيعه
       */
      productId: selectedProduct.id,

      item: selectedProduct.name,

      quantity: Number(quantity),

      price: Number(price),

      discount: Number(discount || 0),

      total: currentItemTotal,
    };

    /* -------------------------------------------------------
       إضافة الصنف
    ------------------------------------------------------- */

    setInvoiceItems((prev) => [...prev, newItem]);

    toast.success(`تمت إضافة "${selectedProduct.name}" إلى الفاتورة`, {
      description: `الكمية: ${Number(
        quantity,
      ).toLocaleString()} | المتبقي بعد الإضافة: ${Math.max(
        selectedProductRemainingStock - Number(quantity),
        0,
      ).toLocaleString()}`,
    });

    /* -------------------------------------------------------
       تفريغ حقول الصنف
    ------------------------------------------------------- */

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
     الحصول على المنتج الخاص بصنف الفاتورة
  ======================================================= */

  const getInvoiceItemProduct = (item: InvoiceItem) => {
    return products.find((product) => product.id === item.productId);
  };

  /* =======================================================
     حساب المخزون المتبقي لكل صنف في الفاتورة
  ======================================================= */

  const getInvoiceItemRemainingStock = (item: InvoiceItem) => {
    const product = getInvoiceItemProduct(item);

    if (!product) return 0;

    const totalInInvoice = invoiceItems
      .filter((invoiceItem) => invoiceItem.productId === item.productId)
      .reduce((sum, invoiceItem) => sum + Number(invoiceItem.quantity || 0), 0);

    return Math.max(getProductStock(product.id) - totalInInvoice, 0);
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
     التحقق النهائي من مخزون جميع الأصناف
  ======================================================= */

  const validateInvoiceStock = () => {
    /*
     * تجميع الكميات حسب productId
     */
    const requestedByProduct = new Map<string, number>();

    for (const item of invoiceItems) {
      const current = requestedByProduct.get(item.productId) || 0;

      requestedByProduct.set(
        item.productId,
        current + Number(item.quantity || 0),
      );
    }

    /* -------------------------------------------------------
       التحقق من كل منتج
    ------------------------------------------------------- */

    for (const [productId, requestedQuantity] of requestedByProduct.entries()) {
      const product = products.find((item) => item.id === productId);

      if (!product) {
        return {
          valid: false,
          message: "يوجد صنف في الفاتورة غير مرتبط بمنتج في المخزون",
        };
      }

      const availableStock = getProductStock(product.id);

      if (availableStock <= 0) {
        return {
          valid: false,
          message: `المخزون نافذ للصنف "${product.name}"`,
        };
      }

      if (requestedQuantity > availableStock) {
        return {
          valid: false,
          message: `المخزون غير كافٍ للصنف "${product.name}"`,
          description: `المتاح: ${availableStock.toLocaleString()} | المطلوب: ${requestedQuantity.toLocaleString()}`,
        };
      }
    }

    return {
      valid: true,
    };
  };

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
       التحقق النهائي من المخزون
    ------------------------------------------------------- */

    const stockValidation = validateInvoiceStock();

    if (!stockValidation.valid) {
      toast.error(stockValidation.message || "تعذر التحقق من المخزون", {
        description: stockValidation.description,
      });

      return;
    }

    /* -------------------------------------------------------
       محاولة حفظ البيع
       addSale أيضًا يجب أن يحتوي على حماية المخزون
    ------------------------------------------------------- */

    try {
      // إجمالي الأصناف قبل الخصم
      const subtotal = invoiceItems.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0,
      );

      // إجمالي الخصومات
      const totalDiscount = invoiceItems.reduce(
        (sum, item) => sum + item.discount,
        0,
      );

      // الإجمالي النهائي
      const total = invoiceItems.reduce((sum, item) => sum + item.total, 0);

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

        /*
         * الإجماليات المطلوبة في AddSaleInput
         */
        subtotal,

        discount: totalDiscount,

        totalQuantity: invoiceItems.reduce(
          (sum, item) => sum + item.quantity,
          0,
        ),

        total,

        /*
         * مهم جدًا:
         * نرسل productId مع كل صنف
         */
        items: invoiceItems.map((item) => ({
          id: item.id,

          productId: item.productId,

          productCode: products.find((product) => product.id === item.productId)
            ?.code,

          item: item.item,

          quantity: item.quantity,

          price: item.price,

          discount: item.discount,

          total: item.total,
        })),

        // Store يستخدم:
        // paid | pending | cancelled
        status: paymentMethod === "credit" ? "pending" : "paid",
      });

      /* -----------------------------------------------------
     إشعار الحفظ
  ----------------------------------------------------- */

      toast.success(`تم حفظ الفاتورة ${sale.invoiceNumber} بنجاح`);

      /* -----------------------------------------------------
     سؤال الطباعة
  ----------------------------------------------------- */

      askForPrint(sale.id);

      /* -----------------------------------------------------
     تفريغ الصفحة بعد الحفظ
  ----------------------------------------------------- */

      setInvoiceItems([]);

      setCustomerName("");

      setCreditCustomerId("");

      setBankAccountId("");

      setPaymentMethod("cash");

      setSelectedItem("");

      setQuantity("");

      setPrice("");

      setDiscount("");
    } catch (error) {
      console.error("Error while saving sale:", error);

      toast.error(
        error instanceof Error ? error.message : "حدث خطأ أثناء حفظ الفاتورة",
      );
    }
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
              {/* اسم العميل */}

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

              {/* طريقة الدفع */}

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

              {/* الحساب */}

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
                    value="1101 - الصندوق"
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
                      .map((account) => {
                        const accountCode =
                          account.accountCode || account.code || "";

                        const accountName =
                          account.accountName || account.name || "";

                        return (
                          <option key={account.id} value={account.id}>
                            {accountCode} - {accountName}
                          </option>
                        );
                      })}
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

            {/* معلومات الحساب الحالي */}

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
                    onChange={(e) => {
                      setSelectedItem(e.target.value);

                      /*
                       * عند تغيير الصنف
                       * نفرغ الكمية والسعر
                       */
                      setQuantity("");

                      setDiscount("");
                    }}
                    className="h-8 w-full rounded-md border border-gray-300 bg-white pr-7 pl-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                  >
                    <option value="">اختر الصنف</option>

                    {products
                      .filter((product) => product.isActive !== false)
                      .map((product) => {
                        const stock = getProductStock(product.id);

                        return (
                          <option key={product.id} value={product.id}>
                            {product.name} - المتاح: {stock.toLocaleString()}
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>

              {/* =================================================
                  حالة المخزون
              ================================================= */}

              {selectedProduct && (
                <div className="min-w-[190px]">
                  <label className="mb-1 block text-[10px] font-semibold text-gray-600">
                    حالة المخزون
                  </label>

                  <div
                    className={`flex h-8 items-center justify-between rounded-md border px-2 ${
                      stockStatus.type === "empty"
                        ? "border-red-200 bg-red-50"
                        : stockStatus.type === "error"
                          ? "border-orange-200 bg-orange-50"
                          : "border-green-200 bg-green-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {stockStatus.type === "empty" ? (
                        <FiAlertCircle size={13} className="text-red-600" />
                      ) : stockStatus.type === "error" ? (
                        <FiAlertCircle size={13} className="text-orange-600" />
                      ) : (
                        <FiCheckCircle size={13} className="text-green-600" />
                      )}

                      <span
                        className={`text-[10px] font-bold ${
                          stockStatus.type === "empty"
                            ? "text-red-600"
                            : stockStatus.type === "error"
                              ? "text-orange-600"
                              : "text-green-600"
                        }`}
                      >
                        {stockStatus.text}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold ${
                        stockStatus.type === "empty"
                          ? "text-red-600"
                          : stockStatus.type === "error"
                            ? "text-orange-600"
                            : "text-green-600"
                      }`}
                    >
                      المتاح: {selectedProductRemainingStock.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

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

            {/* =================================================
                معلومات المخزون
            ================================================= */}

            {selectedProduct && (
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="rounded-md bg-gray-50 px-3 py-1.5">
                  <span className="text-[9px] text-gray-400">
                    المخزون الحالي
                  </span>

                  <span className="mr-2 text-[10px] font-bold text-gray-700">
                    {selectedProductStock.toLocaleString()}
                  </span>
                </div>

                <div className="rounded-md bg-yellow-50 px-3 py-1.5">
                  <span className="text-[9px] text-gray-400">
                    داخل الفاتورة
                  </span>

                  <span className="mr-2 text-[10px] font-bold text-yellow-700">
                    {selectedProductInvoiceQuantity.toLocaleString()}
                  </span>
                </div>

                <div className="rounded-md bg-green-50 px-3 py-1.5">
                  <span className="text-[9px] text-gray-400">المتبقي</span>

                  <span className="mr-2 text-[10px] font-bold text-green-700">
                    {selectedProductRemainingStock.toLocaleString()}
                  </span>
                </div>

                {currentRequestedQuantity > 0 && (
                  <div
                    className={`rounded-md px-3 py-1.5 ${
                      currentRequestedQuantity > selectedProductRemainingStock
                        ? "bg-red-50"
                        : "bg-blue-50"
                    }`}
                  >
                    <span className="text-[9px] text-gray-400">
                      المتبقي بعد الإضافة
                    </span>

                    <span
                      className={`mr-2 text-[10px] font-bold ${
                        currentRequestedQuantity > selectedProductRemainingStock
                          ? "text-red-700"
                          : "text-blue-700"
                      }`}
                    >
                      {remainingAfterCurrentQuantity.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* زر الإضافة */}

            <div className="mt-3 flex justify-start">
              <button
                type="button"
                onClick={handleAddItem}
                disabled={
                  !!selectedProduct &&
                  (selectedProductStock <= 0 ||
                    selectedProductRemainingStock <= 0 ||
                    currentRequestedQuantity > selectedProductRemainingStock)
                }
                className="inline-flex h-8 items-center justify-center gap-1 rounded-md bg-blue-600 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
              >
                <FiPlus size={13} />
                إضافة المنتج
              </button>
            </div>
          </div>

          {/* =================================================
              ملخص الصنف الحالي
          ================================================= */}

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
              <table className="w-full min-w-[850px] text-right text-[11px]">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="w-10 px-2 py-2 font-semibold">#</th>

                    <th className="px-2 py-2 font-semibold">الصنف</th>

                    <th className="w-20 px-2 py-2 font-semibold">الكمية</th>

                    <th className="w-24 px-2 py-2 font-semibold">المتاح</th>

                    <th className="w-24 px-2 py-2 font-semibold">المتبقي</th>

                    <th className="w-28 px-2 py-2 font-semibold">سعر الوحدة</th>

                    <th className="w-24 px-2 py-2 font-semibold">الخصم</th>

                    <th className="w-28 px-2 py-2 font-semibold">الإجمالي</th>

                    <th className="w-16 px-2 py-2 font-semibold">إجراء</th>
                  </tr>
                </thead>

                <tbody>
                  {invoiceItems.map((item, index) => {
                    const product = getInvoiceItemProduct(item);

                    const availableStock = product
                      ? getProductStock(product.id)
                      : 0;

                    const remainingStock = getInvoiceItemRemainingStock(item);

                    return (
                      <tr
                        key={item.id}
                        className="border-t border-gray-100 transition hover:bg-gray-50"
                      >
                        <td className="px-2 py-1.5 text-gray-400">
                          {index + 1}
                        </td>

                        <td className="px-2 py-1.5">
                          <div className="font-semibold text-gray-800">
                            {item.item}
                          </div>

                          {product && (
                            <div className="text-[9px] text-gray-400">
                              كود: {product.code}
                            </div>
                          )}
                        </td>

                        <td className="px-2 py-1.5 font-bold text-gray-700">
                          {item.quantity.toLocaleString()}
                        </td>

                        <td className="px-2 py-1.5">
                          <span
                            className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                              availableStock <= 0
                                ? "bg-red-50 text-red-600"
                                : "bg-green-50 text-green-600"
                            }`}
                          >
                            {availableStock.toLocaleString()}
                          </span>
                        </td>

                        <td className="px-2 py-1.5">
                          <span
                            className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                              remainingStock <= 0
                                ? "bg-red-50 text-red-600"
                                : "bg-blue-50 text-blue-600"
                            }`}
                          >
                            {remainingStock.toLocaleString()}
                          </span>
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
                    );
                  })}
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
