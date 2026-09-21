"use client";

import { useMemo, useState } from "react";
import {
  FiTruck,
  FiPercent,
  FiPlus,
  FiTrash2,
  FiSave,
  FiPrinter,
  FiCheckCircle,
  FiCreditCard,
} from "react-icons/fi";
import { toast } from "sonner";

import { useERPStore } from "@/Store/erpStore";

import type { PaymentMethod, TaxMode, PurchaseFormItem } from "./types";

export default function NewPurchasePage() {
  /* =========================================================
     Zustand - ERP Store
  ========================================================= */

  const products = useERPStore((state) => state.products);
  const suppliers = useERPStore((state) => state.suppliers);
  const purchases = useERPStore((state) => state.purchases);
  const accounts = useERPStore((state) => state.accounts);
  const bankAccounts = useERPStore((state) => state.bankAccounts);
  const addPurchase = useERPStore((state) => state.addPurchase);

  /* =========================================================
     الحالات
  ========================================================= */

  const [date, setDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [supplierId, setSupplierId] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const [bankId, setBankId] = useState("");

  const [taxMode, setTaxMode] = useState<TaxMode>("none");

  const [taxRate, setTaxRate] = useState(15);

  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<PurchaseFormItem[]>([
    {
      id: Date.now(),
      productId: "",
      quantity: 1,
      price: 0,
      discount: 0,
    },
  ]);

  const [isSaved, setIsSaved] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  const [savedInvoiceNumber, setSavedInvoiceNumber] = useState("");

  const [savedPurchaseData, setSavedPurchaseData] = useState<{
    invoiceNumber: string;
    date: string;
    supplierName: string;
    supplierPhone: string;
    supplierAddress: string;
    paymentName: string;
    accountCode: string;
    accountName: string;
    items: PurchaseFormItem[];
    subtotal: number;
    totalDiscount: number;
    tax: number;
    taxMode: TaxMode;
    taxRate: number;
    grandTotal: number;
    notes: string;
  } | null>(null);

  /* =========================================================
     رقم الفاتورة
  ========================================================= */

  const invoiceNumber = useMemo(() => {
    const numbers = purchases
      .map((purchase) => {
        const match = purchase.invoiceNumber?.match(/(\d+)$/);

        return match ? Number(match[1]) : 0;
      })
      .filter((number) => number > 0);

    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1001;

    return `PUR-${nextNumber}`;
  }, [purchases]);

  /* =========================================================
     المورد المحدد
  ========================================================= */

  const selectedSupplier = useMemo(() => {
    return suppliers.find((supplier) => supplier.id === supplierId);
  }, [suppliers, supplierId]);

  /* =========================================================
     البنك المحدد
  ========================================================= */

  const selectedBank = useMemo(() => {
    return bankAccounts.find((bank) => bank.id === bankId);
  }, [bankAccounts, bankId]);

  /* =========================================================
     حساب الصندوق
  ========================================================= */

  const cashAccount = useMemo(() => {
    return accounts.find((account) => account.code === "1101");
  }, [accounts]);

  /* =========================================================
     حساب المورد
  ========================================================= */

  const getSupplierAccount = () => {
    if (!selectedSupplier) {
      return {
        accountCode: "",
        accountName: "",
      };
    }

    /*
      الحساب المرتبط بالمورد مباشرة
    */

    if (selectedSupplier.accountCode && selectedSupplier.accountName) {
      return {
        accountCode: selectedSupplier.accountCode,
        accountName: selectedSupplier.accountName,
      };
    }

    /*
      البحث تحت حساب الموردين 2101
    */

    const supplierName = String(selectedSupplier.name ?? "")
      .trim()
      .toLowerCase();

    const supplierAccount = accounts.find((account) => {
      const parentCode = String(account.parentCode ?? "");

      const accountName = String(account.name ?? "")
        .trim()
        .toLowerCase();

      const accountType = String(account.type ?? "").toLowerCase();

      const level = Number(account.level ?? 2);

      return (
        parentCode === "2101" &&
        level > 1 &&
        accountType === "liability" &&
        accountName === supplierName
      );
    });

    if (supplierAccount) {
      return {
        accountCode: String(supplierAccount.code ?? ""),
        accountName: String(supplierAccount.name ?? ""),
      };
    }

    /*
      احتياط أخير بالاسم
    */

    const fallbackAccount = accounts.find((account) => {
      const accountName = String(account.name ?? "")
        .trim()
        .toLowerCase();

      return accountName === supplierName;
    });

    if (fallbackAccount) {
      return {
        accountCode: String(fallbackAccount.code ?? ""),
        accountName: String(fallbackAccount.name ?? ""),
      };
    }

    return {
      accountCode: "",
      accountName: "",
    };
  };

  /* =========================================================
     حساب الدفع المستخدم في الفاتورة
  ========================================================= */

  const getPaymentAccount = () => {
    /*
      شراء نقدي
      مدين: المخزون
      دائن: الصندوق 1101
    */

    if (paymentMethod === "cash") {
      return {
        accountCode: String(cashAccount?.code ?? "1101"),
        accountName: cashAccount?.name ?? "الصندوق",
      };
    }

    /*
      شراء بنكي
      مدين: المخزون
      دائن: البنك المختار
    */

    if (paymentMethod === "bank") {
      return {
        accountCode: selectedBank?.accountCode ?? selectedBank?.code ?? "",

        accountName: selectedBank?.accountName ?? selectedBank?.name ?? "",
      };
    }

    /*
      شراء آجل
      مدين: المخزون
      دائن: المورد
    */

    if (paymentMethod === "credit") {
      return getSupplierAccount();
    }

    return {
      accountCode: "",
      accountName: "",
    };
  };

  /* =========================================================
     المنتج
  ========================================================= */

  const getProduct = (productId: string) => {
    return products.find((product) => product.id === productId);
  };

  /* =========================================================
     إجمالي الصنف
  ========================================================= */

  const getItemTotal = (item: PurchaseFormItem) => {
    const quantity = Number(item.quantity) || 0;

    const price = Number(item.price) || 0;

    const discount = Number(item.discount) || 0;

    return Math.max(0, quantity * price - discount);
  };

  /* =========================================================
     الإجماليات
  ========================================================= */

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
      0,
    );
  }, [items]);

  const totalDiscount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.discount) || 0), 0);
  }, [items]);

  const afterDiscount = Math.max(0, subtotal - totalDiscount);

  const tax = useMemo(() => {
    if (taxMode !== "tax") {
      return 0;
    }

    return afterDiscount * ((Number(taxRate) || 0) / 100);
  }, [taxMode, taxRate, afterDiscount]);

  const grandTotal = afterDiscount + tax;

  /* =========================================================
     تنسيق الأموال
  ========================================================= */

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("ar-SA").format(Number(value) || 0);
  };

  /* =========================================================
     الضريبة
  ========================================================= */

  const handleTaxModeChange = (value: TaxMode) => {
    setTaxMode(value);
    setIsSaved(false);
  };

  const handleTaxRateChange = (value: string) => {
    const rate = Math.min(100, Math.max(0, Number(value) || 0));

    setTaxRate(rate);
    setIsSaved(false);
  };

  /* =========================================================
     تغيير طريقة الدفع
  ========================================================= */

  const handlePaymentMethodChange = (value: PaymentMethod) => {
    setPaymentMethod(value);

    if (value !== "bank") {
      setBankId("");
    }

    setIsSaved(false);
  };

  /* =========================================================
     الأصناف
  ========================================================= */

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        id: Date.now() + current.length,
        productId: "",
        quantity: 1,
        price: 0,
        discount: 0,
      },
    ]);

    setIsSaved(false);
  };

  const removeItem = (id: number) => {
    setItems((current) => {
      if (current.length <= 1) {
        return [
          {
            id: Date.now(),
            productId: "",
            quantity: 1,
            price: 0,
            discount: 0,
          },
        ];
      }

      return current.filter((item) => item.id !== id);
    });

    setIsSaved(false);
  };

  const updateItem = (
    id: number,
    field: keyof PurchaseFormItem,
    value: string | number,
  ) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (field === "productId") {
          return {
            ...item,
            productId: String(value),
          };
        }

        if (field === "quantity") {
          return {
            ...item,
            quantity: Math.max(0, Number(value) || 0),
          };
        }

        if (field === "price") {
          return {
            ...item,
            price: Math.max(0, Number(value) || 0),
          };
        }

        if (field === "discount") {
          return {
            ...item,
            discount: Math.max(0, Number(value) || 0),
          };
        }

        return item;
      }),
    );

    setIsSaved(false);
  };

  /* =========================================================
     التحقق
  ========================================================= */

  const validateInvoice = () => {
    if (!supplierId) {
      toast.error("يرجى اختيار المورد");
      return false;
    }

    if (items.length === 0) {
      toast.error("يرجى إضافة صنف واحد على الأقل");
      return false;
    }

    /*
      التحقق من البنك
    */

    if (paymentMethod === "bank") {
      if (!bankId) {
        toast.error("يرجى اختيار الحساب البنكي");
        return false;
      }

      const bankAccount = getPaymentAccount();

      if (!bankAccount.accountCode || !bankAccount.accountName) {
        toast.error("الحساب البنكي المحدد غير مرتبط بحساب محاسبي");
        return false;
      }
    }

    /*
      التحقق من حساب المورد
      في حالة الآجل
    */

    if (paymentMethod === "credit") {
      const supplierAccount = getSupplierAccount();

      if (!supplierAccount.accountCode || !supplierAccount.accountName) {
        toast.error(
          "هذا المورد غير مرتبط بحساب محاسبي. يرجى ربط حساب المورد أولاً.",
        );
        return false;
      }
    }

    /*
      التحقق من الأصناف
    */

    for (const item of items) {
      if (!item.productId) {
        toast.error("يرجى اختيار المنتج لكل صنف");
        return false;
      }

      if (Number(item.quantity) <= 0) {
        toast.error("يجب أن تكون الكمية أكبر من صفر");
        return false;
      }

      const itemSubtotal =
        (Number(item.quantity) || 0) * (Number(item.price) || 0);

      if (Number(item.discount) > itemSubtotal) {
        toast.error("الخصم لا يمكن أن يكون أكبر من قيمة الصنف");
        return false;
      }
    }

    if (grandTotal <= 0) {
      toast.error("إجمالي الفاتورة يجب أن يكون أكبر من صفر");
      return false;
    }

    return true;
  };

  /* =========================================================
     طريقة الدفع
  ========================================================= */

  const getPaymentMethodName = (method: PaymentMethod) => {
    switch (method) {
      case "cash":
        return "نقدًا";

      case "bank":
        return "حوالة بنكية";

      case "credit":
        return "آجل";

      default:
        return "";
    }
  };

  /* =========================================================
     التاريخ
  ========================================================= */

  const formatDateForPrint = (value: string) => {
    const parts = value.split("-");

    if (parts.length !== 3) {
      return value;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  /* =========================================================
     الحفظ
  ========================================================= */

  const handleSave = () => {
    if (!validateInvoice()) {
      return;
    }

    const paymentAccount = getPaymentAccount();

    const purchaseItems = items.map((item) => {
      const product = getProduct(item.productId);

      return {
        id: item.id,

        productId: item.productId,

        productCode: product?.code ?? "",

        productName: product?.name ?? "",

        name: product?.name ?? "",

        quantity: Number(item.quantity) || 0,

        price: Number(item.price) || 0,

        discount: Number(item.discount) || 0,

        total: getItemTotal(item),
      };
    });

    const supplierName = selectedSupplier?.name ?? "";

    const supplierPhone = selectedSupplier?.phone ?? "";

    const supplierAddress = selectedSupplier?.address ?? "";

    const paymentName = getPaymentMethodName(paymentMethod);

    const currentInvoiceNumber = invoiceNumber;

    /*
      AddPurchaseInput الحالي لا يستقبل:
      id
      itemCount

      الـ Store يقوم بإنشائهما داخليًا.
    */

    addPurchase({
      invoiceNumber: currentInvoiceNumber,

      date,

      supplier: supplierName,

      supplierId,

      /*
        الحساب المقابل للمخزون:

        cash   -> الصندوق 1101
        bank   -> البنك المختار
        credit -> حساب المورد
      */

      accountCode: paymentAccount.accountCode,

      accountName: paymentAccount.accountName,

      items: purchaseItems,

      subtotal,

      discount: totalDiscount,

      tax,

      taxRate: taxMode === "tax" ? taxRate : 0,

      total: grandTotal,

      paymentMethod,

      paymentMethodName: paymentName,

      /*
        القيم الداخلية في Store:

        paid      -> مدفوعة
        pending   -> آجلة
        cancelled -> ملغاة
      */

      status: paymentMethod === "credit" ? "pending" : "paid",

      notes,
    });

    /*
      المخزون لا يتم تعديله مباشرة هنا.

      getInventory() في ERP Store
      يحسب المشتريات - المبيعات.
    */

    setSavedPurchaseData({
      invoiceNumber: currentInvoiceNumber,

      date,

      supplierName,

      supplierPhone,

      supplierAddress,

      paymentName,

      accountCode: paymentAccount.accountCode,

      accountName: paymentAccount.accountName,

      items: items.map((item) => ({
        ...item,
      })),

      subtotal,

      totalDiscount,

      tax,

      taxMode,

      taxRate,

      grandTotal,

      notes,
    });

    setSavedInvoiceNumber(currentInvoiceNumber);

    setIsSaved(true);

    setShowSuccess(true);

    toast.success(`تم حفظ الفاتورة ${currentInvoiceNumber} بنجاح`);

    setTimeout(() => {
      setShowSuccess(false);
    }, 3500);
  };

  /* =========================================================
     الطباعة
  ========================================================= */

  const handlePrint = () => {
    if (!isSaved || !savedPurchaseData) {
      toast.error("يرجى حفظ الفاتورة أولًا قبل طباعتها");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      toast.error("تعذر فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.");
      return;
    }

    const savedData = savedPurchaseData;

    const itemsHtml = savedData.items
      .map((item, index) => {
        const product = getProduct(item.productId);

        const quantity = Number(item.quantity) || 0;

        const price = Number(item.price) || 0;

        const discount = Number(item.discount) || 0;

        const total = Math.max(0, quantity * price - discount);

        return `
            <tr>
              <td>${index + 1}</td>
              <td>${product?.code ?? ""}</td>
              <td>${product?.name ?? ""}</td>
              <td>${quantity}</td>
              <td>${formatMoney(price)}</td>
              <td>${formatMoney(discount)}</td>
              <td>${formatMoney(total)}</td>
            </tr>
          `;
      })
      .join("");

    const taxRow =
      savedData.taxMode === "tax"
        ? `
          <div class="total-row">
            <span>
              الضريبة (${savedData.taxRate}%)
            </span>

            <strong>
              ${formatMoney(savedData.tax)}
              ريال
            </strong>
          </div>
        `
        : "";

    printWindow.document.write(`
      <!DOCTYPE html>

      <html lang="ar" dir="rtl">

      <head>

        <meta charset="UTF-8" />

        <title>
          فاتورة مشتريات
          ${savedData.invoiceNumber}
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;

            font-family:
              Arial,
              Tahoma,
              sans-serif;

            color: #111827;
            direction: rtl;
          }

          .page {
            width: 210mm;
            min-height: 297mm;

            margin: 0 auto;

            padding: 12mm;
          }

          .company {
            text-align: center;

            border-bottom:
              2px solid #111827;

            padding-bottom: 8px;
          }

          .company-name {
            font-size: 22px;
            font-weight: bold;
          }

          .company-activity {
            font-size: 13px;
            margin-top: 3px;
          }

          .company-info {
            font-size: 11px;
            margin-top: 3px;
          }

          .invoice-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 12px 0;
          }

          .invoice-info {
            display: grid;

            grid-template-columns:
              1fr 1fr;

            gap: 7px;
          }

          .info-box {
            border:
              1px solid #d1d5db;

            padding: 6px;

            border-radius: 4px;
          }

          .info-label {
            font-size: 9px;
            color: #6b7280;
          }

          .info-value {
            font-size: 11px;
            font-weight: bold;
            margin-top: 2px;
          }

          table {
            width: 100%;

            border-collapse: collapse;

            margin-top: 12px;
          }

          th,
          td {
            border:
              1px solid #d1d5db;

            padding: 5px;

            text-align: center;

            font-size: 10px;
          }

          th {
            background: #f3f4f6;
          }

          .totals {
            width: 300px;

            margin-right: auto;

            margin-top: 12px;
          }

          .total-row {
            display: flex;

            justify-content:
              space-between;

            border-bottom:
              1px solid #e5e7eb;

            padding: 5px 0;

            font-size: 10px;
          }

          .grand-total {
            border-top:
              2px solid #111827;

            font-size: 13px;
            font-weight: bold;

            padding-top: 7px;
          }

          .account-box {
            margin-top: 12px;

            border:
              1px solid #d1d5db;

            padding: 8px;

            font-size: 10px;
          }

          .notes {
            margin-top: 15px;

            border:
              1px solid #d1d5db;

            padding: 8px;
          }

          .notes-title {
            font-size: 10px;
            font-weight: bold;
          }

          .notes-text {
            font-size: 9px;
            margin-top: 4px;
          }

          .footer {
            margin-top: 25px;

            border-top:
              1px solid #d1d5db;

            padding-top: 7px;

            text-align: center;

            font-size: 9px;

            color: #6b7280;
          }

          @media print {

            @page {
              size: A4;
              margin: 0;
            }

            .page {
              width: 210mm;
              min-height: 297mm;
              padding: 12mm;
            }

          }

        </style>

      </head>

      <body>

        <div class="page">

          <div class="company">

            <div class="company-name">
              شركة الجابري
            </div>

            <div class="company-activity">
              للعسل والزيوت الطبيعة وخدمات العمرة
            </div>

            <div class="company-info">
              البيضاء - اليمن
              &nbsp; | &nbsp;
              الهاتف: 734 434 443
            </div>

          </div>

          <div class="invoice-title">
            فاتورة مشتريات
          </div>

          <div class="invoice-info">

            <div class="info-box">

              <div class="info-label">
                رقم الفاتورة
              </div>

              <div class="info-value">
                ${savedData.invoiceNumber}
              </div>

            </div>

            <div class="info-box">

              <div class="info-label">
                التاريخ
              </div>

              <div class="info-value">
                ${formatDateForPrint(savedData.date)}
              </div>

            </div>

            <div class="info-box">

              <div class="info-label">
                المورد
              </div>

              <div class="info-value">
                ${savedData.supplierName}
              </div>

            </div>

            <div class="info-box">

              <div class="info-label">
                طريقة الدفع
              </div>

              <div class="info-value">
                ${savedData.paymentName}
              </div>

            </div>

          </div>

          <div class="account-box">

            <strong>
              الحساب المقابل:
            </strong>

            &nbsp;

            ${savedData.accountCode || "-"}
            -
            ${savedData.accountName || "-"}

          </div>

          <table>

            <thead>

              <tr>

                <th>#</th>

                <th>الكود</th>

                <th>الصنف</th>

                <th>الكمية</th>

                <th>السعر</th>

                <th>الخصم</th>

                <th>الإجمالي</th>

              </tr>

            </thead>

            <tbody>

              ${itemsHtml}

            </tbody>

          </table>

          <div class="totals">

            <div class="total-row">

              <span>
                الإجمالي قبل الخصم
              </span>

              <strong>
                ${formatMoney(savedData.subtotal)}
                ريال
              </strong>

            </div>

            <div class="total-row">

              <span>
                الخصم
              </span>

              <strong>
                ${formatMoney(savedData.totalDiscount)}
                ريال
              </strong>

            </div>

            ${taxRow}

            <div
              class="total-row grand-total"
            >

              <span>
                الإجمالي النهائي
              </span>

              <strong>
                ${formatMoney(savedData.grandTotal)}
                ريال
              </strong>

            </div>

          </div>

          ${
            savedData.notes
              ? `
                <div class="notes">

                  <div class="notes-title">
                    ملاحظات
                  </div>

                  <div class="notes-text">
                    ${savedData.notes}
                  </div>

                </div>
              `
              : ""
          }

          <div class="footer">

            الجابري للعسل والزيوت الطبيعة وخدمات العمرة

          </div>

        </div>

      </body>

      </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();

      printWindow.print();

      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  };

  /* =========================================================
     JSX
  ========================================================= */

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-2 text-[11px] sm:p-3">
      <div className="mx-auto max-w-[1450px]">
        {/* ===================================================
            رأس الصفحة
        =================================================== */}

        <div className="mb-2 flex flex-col gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-sm font-bold text-gray-800">فاتورة مشتريات</h1>

            <p className="mt-0.5 text-[9px] text-gray-400">
              إنشاء فاتورة شراء جديدة
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="rounded-md bg-gray-50 px-2.5 py-1.5 text-[10px]">
              <span className="text-gray-400">رقم الفاتورة:</span>

              <span className="mr-1.5 font-bold text-gray-800">
                {invoiceNumber}
              </span>
            </div>

            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setIsSaved(false);
              }}
              className="h-8 rounded-md border border-gray-300 px-2 text-[10px] outline-none focus:border-[#0E1F33]"
            />

            <button
              type="button"
              onClick={handleSave}
              className="flex h-8 items-center gap-1.5 rounded-md bg-[#0E1F33] px-3 text-[10px] font-semibold text-white hover:opacity-90"
            >
              <FiSave size={13} />
              حفظ
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={!isSaved}
              className="flex h-8 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiPrinter size={13} />
              طباعة
            </button>
          </div>
        </div>

        {/* ===================================================
            نجاح
        =================================================== */}

        {showSuccess && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[10px] text-green-700">
            <FiCheckCircle size={15} />

            <span>تم حفظ الفاتورة بنجاح — {savedInvoiceNumber}</span>
          </div>
        )}

        {/* ===================================================
            جسم الفاتورة
        =================================================== */}

        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          {/* =================================================
              بيانات الشركة
          ================================================= */}

          <div className="border-b px-3 py-2 text-center">
            <h2 className="text-base font-bold text-gray-800">شركة الجابري</h2>

            <p className="mt-0.5 text-[10px] text-gray-500">
              للعسل والزيوت الطبيعة وخدمات العمرة
            </p>

            <p className="mt-0.5 text-[9px] text-gray-400">
              البيضاء - اليمن
              <span className="mx-1.5">|</span>
              هاتف: 734 434 443
            </p>
          </div>

          {/* =================================================
              المورد + الدفع
          ================================================= */}

          <section className="border-b px-3 py-2">
            <div className="mb-2 flex items-center gap-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <FiTruck size={13} />
              </div>

              <h3 className="text-[11px] font-bold text-gray-800">
                بيانات المورد
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {/* المورد */}

              <div>
                <label className="mb-1 block text-[9px] font-semibold text-gray-600">
                  المورد
                </label>

                <select
                  value={supplierId}
                  onChange={(event) => {
                    setSupplierId(event.target.value);

                    setIsSaved(false);
                  }}
                  className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-[10px] outline-none focus:border-[#0E1F33]"
                >
                  <option value="">اختر المورد</option>

                  {suppliers
                    .filter((supplier) => supplier.isActive !== false)
                    .map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                </select>

                {selectedSupplier?.phone && (
                  <p className="mt-0.5 text-[8px] text-gray-400">
                    الهاتف: {selectedSupplier.phone}
                  </p>
                )}
              </div>

              {/* الدفع */}

              <div>
                <label className="mb-1 block text-[9px] font-semibold text-gray-600">
                  طريقة الدفع
                </label>

                <select
                  value={paymentMethod}
                  onChange={(event) =>
                    handlePaymentMethodChange(
                      event.target.value as PaymentMethod,
                    )
                  }
                  className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-[10px] outline-none focus:border-[#0E1F33]"
                >
                  <option value="cash">نقدي</option>

                  <option value="credit">آجل</option>

                  <option value="bank">تحويل بنكي</option>
                </select>
              </div>

              {/* الحساب */}

              <div>
                <label className="mb-1 block text-[9px] font-semibold text-gray-600">
                  الحساب المقابل
                </label>

                <div className="flex min-h-8 items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-2">
                  <span className="text-[9px] font-semibold text-gray-600">
                    {paymentMethod === "cash"
                      ? "الصندوق"
                      : paymentMethod === "bank"
                        ? "البنك"
                        : "المورد"}
                  </span>

                  <span className="text-[8px] font-bold text-gray-700">
                    {getPaymentAccount().accountCode || "غير مرتبط"}
                  </span>
                </div>
              </div>
            </div>

            {/* حساب البنك */}

            {paymentMethod === "bank" && (
              <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-2 py-2">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <FiCreditCard size={13} className="text-blue-600" />

                  <span className="text-[9px] font-bold text-blue-700">
                    حساب البنك
                  </span>
                </div>

                <select
                  value={bankId}
                  onChange={(event) => {
                    setBankId(event.target.value);

                    setIsSaved(false);
                  }}
                  className="h-8 w-full rounded-md border border-blue-200 bg-white px-2 text-[10px] outline-none focus:border-blue-500"
                >
                  <option value="">اختر الحساب البنكي</option>

                  {bankAccounts
                    .filter((bank) => bank.isActive !== false)
                    .map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.code ? `${bank.code} - ` : ""}
                        {bank.name}
                      </option>
                    ))}
                </select>

                {selectedBank && (
                  <div className="mt-1 flex flex-wrap gap-x-4 text-[8px] text-blue-700">
                    <span>
                      الكود:{" "}
                      <strong>
                        {selectedBank.accountCode || selectedBank.code || "-"}
                      </strong>
                    </span>

                    <span>
                      الحساب:{" "}
                      <strong>
                        {selectedBank.accountName || selectedBank.name || "-"}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* حساب المورد */}

            {paymentMethod === "credit" && selectedSupplier && (
              <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px]">
                  <span className="font-semibold text-amber-700">
                    الحساب المحاسبي:
                  </span>

                  <span>
                    الكود:
                    <strong className="mr-1 text-amber-900">
                      {getSupplierAccount().accountCode || "غير مرتبط"}
                    </strong>
                  </span>

                  <span>
                    الاسم:
                    <strong className="mr-1 text-amber-900">
                      {getSupplierAccount().accountName || "غير مرتبط"}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* =================================================
              الضريبة
          ================================================= */}

          <section className="border-b px-3 py-2">
            <div className="mb-2 flex items-center gap-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                <FiPercent size={13} />
              </div>

              <h3 className="text-[11px] font-bold text-gray-800">
                ضريبة القيمة المضافة
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-[9px] font-semibold text-gray-600">
                  الضريبة
                </label>

                <select
                  value={taxMode}
                  onChange={(event) =>
                    handleTaxModeChange(event.target.value as TaxMode)
                  }
                  className="h-8 w-full rounded-md border border-gray-300 px-2 text-[10px] outline-none focus:border-amber-500"
                >
                  <option value="none">بدون ضريبة</option>

                  <option value="tax">مع ضريبة</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[9px] font-semibold text-gray-600">
                  نسبة الضريبة %
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  disabled={taxMode === "none"}
                  onChange={(event) => handleTaxRateChange(event.target.value)}
                  className="h-8 w-full rounded-md border border-gray-300 px-2 text-[10px] outline-none focus:border-amber-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-[9px] font-semibold text-gray-600">
                  قيمة الضريبة
                </label>

                <div
                  className={`flex h-8 items-center rounded-md border px-2 text-[10px] font-bold ${
                    taxMode === "tax"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-gray-200 bg-gray-50 text-gray-400"
                  }`}
                >
                  {formatMoney(tax)} ريال
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              الأصناف
          ================================================= */}

          <section className="border-b">
            <div className="flex items-center justify-between border-b bg-gray-50 px-3 py-2">
              <div>
                <h3 className="text-[11px] font-bold text-gray-800">
                  أصناف الفاتورة
                </h3>

                <p className="text-[8px] text-gray-400">
                  المنتجات والكميات والأسعار
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="flex h-7 items-center gap-1 rounded-md bg-[#0E1F33] px-2.5 text-[9px] font-semibold text-white hover:opacity-90"
              >
                <FiPlus size={12} />
                إضافة صنف
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse">
                <thead>
                  <tr className="border-b bg-white text-[9px] text-gray-500">
                    <th className="w-8 px-2 py-1.5 text-center">#</th>

                    <th className="px-2 py-1.5 text-right">الصنف</th>

                    <th className="w-20 px-2 py-1.5 text-center">الكود</th>

                    <th className="w-24 px-2 py-1.5 text-center">الكمية</th>

                    <th className="w-28 px-2 py-1.5 text-center">سعر الوحدة</th>

                    <th className="w-24 px-2 py-1.5 text-center">الخصم</th>

                    <th className="w-28 px-2 py-1.5 text-center">الإجمالي</th>

                    <th className="w-10 px-2 py-1.5 text-center">حذف</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => {
                    const product = getProduct(item.productId);

                    return (
                      <tr
                        key={item.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-2 py-1.5 text-center text-[9px] text-gray-400">
                          {index + 1}
                        </td>

                        <td className="px-2 py-1.5">
                          <select
                            value={item.productId}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "productId",
                                event.target.value,
                              )
                            }
                            className="h-7 w-full rounded-md border border-gray-300 px-1.5 text-[9px] outline-none focus:border-[#0E1F33]"
                          >
                            <option value="">اختر الصنف</option>

                            {products
                              .filter((product) => product.isActive !== false)
                              .map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                          </select>

                          {product?.unit && (
                            <span className="mt-0.5 block text-[7px] text-gray-400">
                              الوحدة: {product.unit}
                            </span>
                          )}
                        </td>

                        <td className="px-2 py-1.5 text-center">
                          <div className="rounded-md bg-gray-50 px-1 py-1.5 text-[9px] font-semibold text-gray-500">
                            {product?.code || "---"}
                          </div>
                        </td>

                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "quantity",
                                event.target.value,
                              )
                            }
                            className="h-7 w-full rounded-md border border-gray-300 px-1 text-center text-[9px] outline-none focus:border-[#0E1F33]"
                          />
                        </td>

                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(event) =>
                              updateItem(item.id, "price", event.target.value)
                            }
                            className="h-7 w-full rounded-md border border-gray-300 px-1 text-center text-[9px] outline-none focus:border-[#0E1F33]"
                          />
                        </td>

                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discount}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "discount",
                                event.target.value,
                              )
                            }
                            className="h-7 w-full rounded-md border border-gray-300 px-1 text-center text-[9px] outline-none focus:border-[#0E1F33]"
                          />
                        </td>

                        <td className="px-2 py-1.5 text-center">
                          <div className="rounded-md bg-gray-50 px-1 py-1.5 text-[9px] font-bold text-gray-700">
                            {formatMoney(getItemTotal(item))}
                          </div>
                        </td>

                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                            title="حذف"
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

            <div className="border-t bg-gray-50 px-3 py-1.5">
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-[9px] font-semibold text-[#0E1F33]"
              >
                <FiPlus size={11} />
                إضافة صنف آخر
              </button>
            </div>
          </section>

          {/* =================================================
              الإجماليات
          ================================================= */}

          <section className="border-b bg-gray-50 px-3 py-2">
            <div className="mr-auto w-full max-w-sm space-y-1">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-gray-500">الإجمالي قبل الخصم</span>

                <span className="font-semibold">
                  {formatMoney(subtotal)} ريال
                </span>
              </div>

              <div className="flex items-center justify-between text-[9px]">
                <span className="text-gray-500">الخصم</span>

                <span className="font-semibold text-red-500">
                  - {formatMoney(totalDiscount)} ريال
                </span>
              </div>

              <div className="flex items-center justify-between border-t pt-1 text-[9px]">
                <span className="text-gray-500">قبل الضريبة</span>

                <span className="font-semibold">
                  {formatMoney(afterDiscount)} ريال
                </span>
              </div>

              <div className="flex items-center justify-between text-[9px]">
                <span className="text-gray-500">
                  الضريبة
                  {taxMode === "tax" && ` (${taxRate}%)`}
                </span>

                <span className="font-semibold text-amber-600">
                  {taxMode === "tax"
                    ? `${formatMoney(tax)} ريال`
                    : "بدون ضريبة"}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between rounded-md bg-[#0E1F33] px-3 py-2 text-white">
                <span className="text-[10px] font-bold">الإجمالي النهائي</span>

                <span className="text-sm font-bold">
                  {formatMoney(grandTotal)} ريال
                </span>
              </div>
            </div>
          </section>

          {/* =================================================
              الملاحظات
          ================================================= */}

          <section className="border-b px-3 py-2">
            <label className="mb-1 block text-[9px] font-semibold text-gray-600">
              ملاحظات
            </label>

            <textarea
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);

                setIsSaved(false);
              }}
              rows={2}
              placeholder="أدخل ملاحظات الفاتورة..."
              className="w-full resize-none rounded-md border border-gray-300 px-2 py-1.5 text-[9px] outline-none focus:border-[#0E1F33]"
            />
          </section>

          {/* =================================================
              الأزرار
          ================================================= */}

          <div className="flex flex-col gap-1.5 bg-gray-50 px-3 py-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-[#0E1F33] px-4 text-[10px] font-semibold text-white hover:opacity-90"
            >
              <FiSave size={13} />
              حفظ الفاتورة
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={!isSaved}
              className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiPrinter size={13} />
              طباعة الفاتورة
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
