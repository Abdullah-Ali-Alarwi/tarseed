"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiPlus,
  FiTrash2,
  FiPrinter,
  FiSave,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { toast } from "sonner";
import { useERPStore } from "@/Store/erpStore";

type PaymentMethod = "cash" | "bank" | "credit";

type SaleLine = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
};

export default function NewSalePage() {
  const store = useERPStore();

  const products = store.products || [];
  const customers = store.customers || [];
  const sales = store.sales || [];
  const addSale = store.addSale;

  /*
   * نستخدم any هنا فقط لأن بعض نسخ erpStore الحالية
   * قد لا تحتوي على accounts بعد.
   */
  const accounts = (store as any).accounts || [];

  /* =========================================================
     رقم الفاتورة التالي
  ========================================================= */

  const nextInvoiceNumber = useMemo(() => {
    let maxNumber = 1000;

    sales.forEach((sale: any) => {
      const invoiceNumber = String(sale.invoiceNumber || "");

      const match = invoiceNumber.match(/^INV-(\d+)$/);

      if (match) {
        const number = Number(match[1]);

        if (Number.isFinite(number) && number > maxNumber) {
          maxNumber = number;
        }
      }
    });

    return `INV-${maxNumber + 1}`;
  }, [sales]);

  /* =========================================================
     الحالات
  ========================================================= */

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const [customerId, setCustomerId] = useState("");

  const [accountCode, setAccountCode] = useState("");

  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<SaleLine[]>([]);

  const [selectedProductId, setSelectedProductId] = useState("");

  const [quantity, setQuantity] = useState(1);

  const [price, setPrice] = useState(0);

  const [discount, setDiscount] = useState(0);

  const [hasTax, setHasTax] = useState(false);

  const [taxRate, setTaxRate] = useState(15);

  const [error, setError] = useState("");

  const [saved, setSaved] = useState(false);

  const [savedInvoice, setSavedInvoice] = useState("");

  /* =========================================================
     الصندوق
  ========================================================= */

  const cashCustomer = useMemo(() => {
    return (
      customers.find((customer: any) => customer.id === "CASH-CUSTOMER") ||
      customers.find((customer: any) => customer.accountCode === "1002") ||
      customers.find(
        (customer: any) => String(customer.name).trim() === "الصندوق",
      )
    );
  }, [customers]);

  const cashAccount = useMemo(() => {
    return accounts.find((account: any) => String(account.code) === "1002");
  }, [accounts]);

  /* =========================================================
     العملاء العاديون
  ========================================================= */

  const normalCustomers = useMemo(() => {
    return customers.filter((customer: any) => {
      const isCash =
        customer.id === "CASH-CUSTOMER" ||
        customer.accountCode === "1002" ||
        String(customer.name).trim() === "الصندوق";

      return !isCash;
    });
  }, [customers]);

  /* =========================================================
     الحسابات البنكية
  ========================================================= */

  const bankAccounts = useMemo(() => {
    return accounts.filter((account: any) => {
      const code = String(account.code || "");

      return code === "1003" || code.startsWith("1003.");
    });
  }, [accounts]);

  /* =========================================================
     العميل المحدد
  ========================================================= */

  const selectedCustomer = useMemo(() => {
    return customers.find((customer: any) => customer.id === customerId);
  }, [customers, customerId]);

  /* =========================================================
     الحساب المحدد
  ========================================================= */

  const selectedAccount = useMemo(() => {
    return accounts.find(
      (account: any) => String(account.code) === String(accountCode),
    );
  }, [accounts, accountCode]);

  /* =========================================================
     الإجماليات
  ========================================================= */

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
      0,
    );
  }, [items]);

  const totalDiscount = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  }, [items]);

  const taxableAmount = Math.max(0, subtotal - totalDiscount);

  const tax = hasTax ? (taxableAmount * Number(taxRate || 0)) / 100 : 0;

  const total = taxableAmount + tax;

  /* =========================================================
     تنسيق المبلغ
  ========================================================= */

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("ar-SA").format(Number(value || 0));
  };

  /* =========================================================
     تغيير طريقة الدفع
  ========================================================= */

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setError("");

    if (method === "cash") {
      if (cashCustomer) {
        setCustomerId(cashCustomer.id);

        setAccountCode(cashCustomer.accountCode || "1002");
      } else {
        setCustomerId("");
        setAccountCode("1002");
      }

      toast.info("تم اختيار الدفع النقدي", {
        description: "سيتم تسجيل العملية على الصندوق 1002",
      });

      return;
    }

    if (method === "bank") {
      setCustomerId("");

      if (bankAccounts.length > 0) {
        setAccountCode(String(bankAccounts[0].code));
      } else {
        setAccountCode("1003");
      }

      toast.info("تم اختيار التحويل البنكي", {
        description: "اختر الحساب البنكي المطلوب",
      });

      return;
    }

    if (method === "credit") {
      setCustomerId("");
      setAccountCode("");

      toast.info("تم اختيار البيع الآجل", {
        description: "يجب اختيار العميل والحساب المرتبط به",
      });
    }
  };

  /* =========================================================
     اختيار العميل
  ========================================================= */

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    setError("");

    const customer = customers.find((item: any) => item.id === id);

    if (!customer) {
      setAccountCode("");
      return;
    }

    if (customer.accountCode) {
      setAccountCode(String(customer.accountCode));

      toast.success("تم اختيار العميل", {
        description: `${customer.name} — الحساب ${customer.accountCode}`,
      });
    } else {
      setAccountCode("");

      toast.warning("العميل غير مرتبط بحساب", {
        description: "يرجى ربط العميل بحساب محاسبي",
      });
    }
  };

  /* =========================================================
     اختيار الصنف
  ========================================================= */

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setPrice(0);
  };

  /* =========================================================
     إضافة صنف
  ========================================================= */

  const handleAddItem = () => {
    setError("");

    if (!selectedProductId) {
      const message = "يرجى اختيار الصنف";

      setError(message);
      toast.error(message);

      return;
    }

    if (quantity <= 0) {
      const message = "الكمية يجب أن تكون أكبر من صفر";

      setError(message);
      toast.error(message);

      return;
    }

    if (price < 0) {
      const message = "سعر الصنف غير صحيح";

      setError(message);
      toast.error(message);

      return;
    }

    const product = products.find((item: any) => item.id === selectedProductId);

    if (!product) {
      const message = "الصنف غير موجود";

      setError(message);
      toast.error(message);

      return;
    }

    const lineDiscount = Math.max(0, Number(discount || 0));

    const lineTotal = Math.max(
      0,
      Number(quantity) * Number(price) - lineDiscount,
    );

    const newItem: SaleLine = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,

      productId: product.id,

      productName: product.name,

      quantity: Number(quantity),

      price: Number(price),

      discount: lineDiscount,

      tax: 0,

      total: lineTotal,
    };

    setItems((current) => [...current, newItem]);

    toast.success("تمت إضافة الصنف", {
      description: `${product.name} × ${quantity}`,
    });

    setSelectedProductId("");
    setQuantity(1);
    setPrice(0);
    setDiscount(0);
  };

  /* =========================================================
     حذف صنف
  ========================================================= */

  const handleDeleteItem = (id: string) => {
    const item = items.find((item) => item.id === id);

    setItems((current) => current.filter((item) => item.id !== id));

    toast.success("تم حذف الصنف", {
      description: item?.productName || "",
    });
  };

  /* =========================================================
     حفظ الفاتورة
  ========================================================= */

  const handleSave = () => {
    setError("");

    if (!date) {
      const message = "يرجى تحديد تاريخ الفاتورة";

      setError(message);
      toast.error(message);

      return;
    }

    if (items.length === 0) {
      const message = "يرجى إضافة صنف واحد على الأقل";

      setError(message);
      toast.error(message);

      return;
    }

    /* =====================================================
       البيع النقدي
    ===================================================== */

    if (paymentMethod === "cash") {
      const cashId = cashCustomer?.id || "CASH-CUSTOMER";

      const cashName = cashCustomer?.name || "الصندوق";

      const cashCode = cashCustomer?.accountCode || "1002";

      const cashNameAccount =
        cashCustomer?.accountName || cashAccount?.name || "الصندوق";

      addSale({
        invoiceNumber: nextInvoiceNumber,

        date,

        customerId: cashId,

        customerName: cashName,

        accountCode: cashCode,

        accountName: cashNameAccount,

        paymentMethod: "cash",

        items: items.map((item) => ({
          productId: item.productId,

          productName: item.productName,

          quantity: item.quantity,

          price: item.price,

          discount: item.discount,

          tax: item.tax,

          total: item.total,
        })),

        subtotal,

        discount: totalDiscount,

        tax,

        total,

        notes: notes.trim() || undefined,
      });

      setSavedInvoice(nextInvoiceNumber);

      setSaved(true);

      toast.success("تم حفظ الفاتورة بنجاح", {
        description: `${nextInvoiceNumber} — الصندوق 1002`,
      });

      return;
    }

    /* =====================================================
       البيع الآجل
    ===================================================== */

    if (paymentMethod === "credit") {
      if (!selectedCustomer) {
        const message = "يرجى اختيار العميل";

        setError(message);
        toast.error(message);

        return;
      }

      if (!selectedCustomer.accountCode) {
        const message = "العميل غير مرتبط بحساب محاسبي";

        setError(message);

        toast.error("الحساب المحاسبي غير موجود", {
          description: message,
        });

        return;
      }

      addSale({
        invoiceNumber: nextInvoiceNumber,

        date,

        customerId: selectedCustomer.id,

        customerName: selectedCustomer.name,

        accountCode: selectedCustomer.accountCode,

        accountName: selectedCustomer.accountName || selectedCustomer.name,

        paymentMethod: "credit",

        items: items.map((item) => ({
          productId: item.productId,

          productName: item.productName,

          quantity: item.quantity,

          price: item.price,

          discount: item.discount,

          tax: item.tax,

          total: item.total,
        })),

        subtotal,

        discount: totalDiscount,

        tax,

        total,

        notes: notes.trim() || undefined,
      });

      setSavedInvoice(nextInvoiceNumber);

      setSaved(true);

      toast.success("تم حفظ الفاتورة بنجاح", {
        description: `${nextInvoiceNumber} — ${selectedCustomer.name}`,
      });

      return;
    }

    /* =====================================================
       البيع البنكي
    ===================================================== */

    if (paymentMethod === "bank") {
      if (!accountCode) {
        const message = "يرجى اختيار الحساب البنكي";

        setError(message);
        toast.error(message);

        return;
      }

      const bankAccount =
        selectedAccount ||
        bankAccounts.find(
          (account: any) => String(account.code) === String(accountCode),
        );

      const bankName = bankAccount?.name || "البنك";

      addSale({
        invoiceNumber: nextInvoiceNumber,

        date,

        customerId: "",

        customerName: "بيع بنكي",

        accountCode: String(bankAccount?.code || accountCode),

        accountName: bankName,

        paymentMethod: "bank",

        items: items.map((item) => ({
          productId: item.productId,

          productName: item.productName,

          quantity: item.quantity,

          price: item.price,

          discount: item.discount,

          tax: item.tax,

          total: item.total,
        })),

        subtotal,

        discount: totalDiscount,

        tax,

        total,

        notes: notes.trim() || undefined,
      });

      setSavedInvoice(nextInvoiceNumber);

      setSaved(true);

      toast.success("تم حفظ الفاتورة بنجاح", {
        description: `${nextInvoiceNumber} — ${accountCode} - ${bankName}`,
      });
    }
  };

  /* =========================================================
     الطباعة
  ========================================================= */

  const handlePrint = () => {
    toast.info("جاري فتح نافذة الطباعة...");

    window.print();
  };

  /* =========================================================
     شاشة الفاتورة بعد الحفظ
  ========================================================= */

  if (saved) {
    return (
      <>
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden !important;
            }

            #sale-print,
            #sale-print * {
              visibility: visible !important;
            }

            #sale-print {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }

            @page {
              size: A4;
              margin: 10mm;
            }
          }
        `}</style>

        <main dir="rtl" className="min-h-screen bg-gray-100 p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  تم حفظ الفاتورة
                </h1>

                <p className="mt-1 text-gray-700">
                  رقم الفاتورة: <strong>{savedInvoice}</strong>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 font-bold text-white hover:bg-black"
                >
                  <FiPrinter />
                  طباعة الفاتورة
                </button>

                <Link
                  href="/sales"
                  className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-bold text-gray-800 hover:bg-gray-50"
                >
                  العودة للمبيعات
                </Link>
              </div>
            </div>

            <div id="sale-print" className="bg-white p-8 shadow-sm">
              {/* رأس الفاتورة */}

              <div className="border-b-2 border-gray-800 pb-5">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      شركة الجابري
                    </h2>

                    <p className="mt-1 text-sm text-gray-700">
                      للعسل والزيوت الطبيعة وخدمات العمرة
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      البيضاء - اليمن
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      هاتف: 734 434 443
                    </p>
                  </div>

                  <div className="text-left">
                    <h1 className="text-3xl font-bold text-gray-900">
                      فاتورة مبيعات
                    </h1>

                    <p className="mt-2 text-sm text-gray-800">
                      رقم الفاتورة: <strong>{savedInvoice}</strong>
                    </p>

                    <p className="mt-1 text-sm text-gray-800">
                      التاريخ: {date}
                    </p>
                  </div>
                </div>
              </div>

              {/* بيانات العميل */}

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-gray-300 p-4">
                  <p className="text-sm text-gray-600">العميل</p>

                  <p className="mt-1 font-bold text-gray-900">
                    {paymentMethod === "cash"
                      ? "الصندوق"
                      : paymentMethod === "credit"
                        ? selectedCustomer?.name || "—"
                        : "بيع بنكي"}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-300 p-4">
                  <p className="text-sm text-gray-600">طريقة الدفع</p>

                  <p className="mt-1 font-bold text-gray-900">
                    {paymentMethod === "cash"
                      ? "نقدي"
                      : paymentMethod === "bank"
                        ? "تحويل بنكي"
                        : "آجل"}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-300 p-4">
                  <p className="text-sm text-gray-600">الحساب</p>

                  <p className="mt-1 font-bold text-gray-900">
                    {paymentMethod === "cash"
                      ? "1002 - الصندوق"
                      : paymentMethod === "bank"
                        ? `${accountCode} - ${selectedAccount?.name || "البنك"}`
                        : selectedCustomer?.accountCode
                          ? `${selectedCustomer.accountCode} - ${
                              selectedCustomer.accountName ||
                              selectedCustomer.name
                            }`
                          : "—"}
                  </p>
                </div>
              </div>

              {/* جدول الأصناف */}

              <div className="mt-8 overflow-hidden rounded-lg border border-gray-300">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-900">
                      <th className="border border-gray-300 p-3 text-right">
                        #
                      </th>

                      <th className="border border-gray-300 p-3 text-right">
                        الصنف
                      </th>

                      <th className="border border-gray-300 p-3 text-center">
                        الكمية
                      </th>

                      <th className="border border-gray-300 p-3 text-center">
                        سعر الوحدة
                      </th>

                      <th className="border border-gray-300 p-3 text-center">
                        الخصم
                      </th>

                      <th className="border border-gray-300 p-3 text-center">
                        الإجمالي
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} className="text-gray-900">
                        <td className="border border-gray-300 p-3">
                          {index + 1}
                        </td>

                        <td className="border border-gray-300 p-3">
                          {item.productName}
                        </td>

                        <td className="border border-gray-300 p-3 text-center">
                          {item.quantity}
                        </td>

                        <td className="border border-gray-300 p-3 text-center">
                          {formatMoney(item.price)}
                        </td>

                        <td className="border border-gray-300 p-3 text-center">
                          {formatMoney(item.discount)}
                        </td>

                        <td className="border border-gray-300 p-3 text-center font-bold">
                          {formatMoney(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* الإجماليات */}

              <div className="mt-6 flex justify-end">
                <div className="w-full max-w-sm space-y-3 text-gray-900">
                  <div className="flex justify-between">
                    <span>الإجمالي قبل الخصم</span>

                    <strong>{formatMoney(subtotal)}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>الخصم</span>

                    <strong>{formatMoney(totalDiscount)}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>الضريبة</span>

                    <strong>{formatMoney(tax)}</strong>
                  </div>

                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span>الإجمالي</span>

                      <span>{formatMoney(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* الملاحظات */}

              {notes.trim() && (
                <div className="mt-8 border-t border-gray-300 pt-5">
                  <p className="font-bold text-gray-900">ملاحظات</p>

                  <p className="mt-2 text-sm text-gray-700">{notes}</p>
                </div>
              )}

              {/* التذييل */}

              <div className="mt-12 border-t border-gray-300 pt-5 text-center text-sm text-gray-600">
                الجابري للعسل والزيوت الطبيعة وخدمات العمرة
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  /* =========================================================
     الصفحة الرئيسية
  ========================================================= */

  return (
    <main dir="rtl" className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* العنوان */}

        <div className="mb-6">
          <Link
            href="/sales"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-950"
          >
            <FiArrowRight />
            المبيعات
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            إنشاء فاتورة مبيعات
          </h1>

          <p className="mt-1 text-sm text-gray-700">
            إنشاء وحفظ فاتورة مبيعات جديدة
          </p>
        </div>

        {/* الخطأ */}

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 p-4 font-medium text-red-800">
            <FiAlertCircle />

            <span>{error}</span>
          </div>
        )}

        {/* بيانات الفاتورة */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-gray-900">
            بيانات الفاتورة
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                رقم الفاتورة
              </label>

              <input
                type="text"
                value={nextInvoiceNumber}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 font-bold text-gray-900 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                التاريخ
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                طريقة الدفع
              </label>

              <select
                value={paymentMethod}
                onChange={(e) =>
                  handlePaymentMethodChange(e.target.value as PaymentMethod)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              >
                <option value="cash">نقدي</option>

                <option value="bank">تحويل بنكي</option>

                <option value="credit">آجل</option>
              </select>
            </div>
          </div>
        </section>

        {/* الحساب */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-gray-900">الحساب</h2>

          {/* نقدي */}

          {paymentMethod === "cash" && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    طريقة الدفع: نقدي
                  </p>

                  <p className="mt-1 text-lg font-bold text-green-950">
                    الصندوق
                  </p>

                  <p className="mt-1 text-sm font-medium text-green-800">
                    الحساب: 1002 - الصندوق
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <FiCheckCircle size={24} />
                </div>
              </div>

              {!cashCustomer && (
                <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm font-medium text-yellow-900">
                  لم يتم العثور على الصندوق كعميل. سيتم استخدام الصندوق
                  الافتراضي المرتبط بالحساب 1002.
                </div>
              )}
            </div>
          )}

          {/* آجل */}

          {paymentMethod === "credit" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  العميل
                </label>

                <select
                  value={customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                >
                  <option value="">اختر العميل</option>

                  {normalCustomers.map((customer: any) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  الحساب المحاسبي
                </label>

                <div className="min-h-[50px] rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 font-medium text-gray-900">
                  {selectedCustomer?.accountCode
                    ? `${selectedCustomer.accountCode} - ${
                        selectedCustomer.accountName || selectedCustomer.name
                      }`
                    : "سيظهر الحساب بعد اختيار العميل"}
                </div>
              </div>
            </div>
          )}

          {/* بنك */}

          {paymentMethod === "bank" && (
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                الحساب البنكي
              </label>

              <select
                value={accountCode}
                onChange={(e) => setAccountCode(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              >
                <option value="">اختر الحساب البنكي</option>

                {bankAccounts.map((account: any) => (
                  <option
                    key={String(account.code)}
                    value={String(account.code)}
                  >
                    {account.code} - {account.name}
                  </option>
                ))}

                {bankAccounts.length === 0 && (
                  <option value="1003">1003 - البنك</option>
                )}
              </select>
            </div>
          )}
        </section>

        {/* الأصناف */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">الأصناف</h2>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {items.length} صنف
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {/* الصنف */}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-gray-800">
                الصنف
              </label>

              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              >
                <option value="">اختر الصنف</option>

                {products.map((product: any) => (
                  <option key={product.id} value={product.id}>
                    {product.code ? `${product.code} - ` : ""}
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* الكمية */}

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                الكمية
              </label>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            {/* السعر */}

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                سعر الوحدة
              </label>

              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            {/* الخصم */}

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                الخصم
              </label>

              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="mt-5 flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 font-bold text-white hover:bg-black"
          >
            <FiPlus />
            إضافة الصنف
          </button>

          {/* جدول الأصناف */}

          {items.length > 0 && (
            <div className="mt-6 overflow-x-auto rounded-xl border border-gray-300">
              <table className="w-full min-w-[800px] border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-900">
                    <th className="border-b border-gray-300 p-3 text-right">
                      #
                    </th>

                    <th className="border-b border-gray-300 p-3 text-right">
                      الصنف
                    </th>

                    <th className="border-b border-gray-300 p-3 text-center">
                      الكمية
                    </th>

                    <th className="border-b border-gray-300 p-3 text-center">
                      السعر
                    </th>

                    <th className="border-b border-gray-300 p-3 text-center">
                      الخصم
                    </th>

                    <th className="border-b border-gray-300 p-3 text-center">
                      الإجمالي
                    </th>

                    <th className="border-b border-gray-300 p-3 text-center">
                      الإجراء
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={item.id}
                      className="text-gray-900 hover:bg-gray-50"
                    >
                      <td className="border-b border-gray-200 p-3">
                        {index + 1}
                      </td>

                      <td className="border-b border-gray-200 p-3 font-medium">
                        {item.productName}
                      </td>

                      <td className="border-b border-gray-200 p-3 text-center">
                        {item.quantity}
                      </td>

                      <td className="border-b border-gray-200 p-3 text-center">
                        {formatMoney(item.price)}
                      </td>

                      <td className="border-b border-gray-200 p-3 text-center">
                        {formatMoney(item.discount)}
                      </td>

                      <td className="border-b border-gray-200 p-3 text-center font-bold">
                        {formatMoney(item.total)}
                      </td>

                      <td className="border-b border-gray-200 p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="inline-flex rounded-lg p-2 text-red-600 hover:bg-red-50"
                          title="حذف الصنف"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* الضريبة والملاحظات */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-gray-900">
            الضريبة والملاحظات
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <input
                id="hasTax"
                type="checkbox"
                checked={hasTax}
                onChange={(e) => setHasTax(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300"
              />

              <label htmlFor="hasTax" className="font-bold text-gray-800">
                إضافة ضريبة
              </label>
            </div>

            {hasTax && (
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  نسبة الضريبة %
                </label>

                <input
                  type="number"
                  min="0"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-gray-800">
                ملاحظات
              </label>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="أدخل أي ملاحظات..."
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 outline-none placeholder:text-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
            </div>
          </div>
        </section>

        {/* الملخص والحفظ */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="w-full max-w-md space-y-4 text-gray-900">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">
                  الإجمالي قبل الخصم
                </span>

                <strong>{formatMoney(subtotal)}</strong>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-gray-700">الخصم</span>

                <strong>{formatMoney(totalDiscount)}</strong>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-gray-700">
                  الضريبة {hasTax ? `(${taxRate}%)` : ""}
                </span>

                <strong>{formatMoney(tax)}</strong>
              </div>

              <div className="border-t border-gray-300 pt-4">
                <div className="flex justify-between text-2xl font-bold text-gray-900">
                  <span>الإجمالي</span>

                  <span>{formatMoney(total)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
              >
                <FiSave />
                حفظ الفاتورة
              </button>

              <Link
                href="/sales"
                className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-bold text-gray-800 hover:bg-gray-50"
              >
                إلغاء
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
