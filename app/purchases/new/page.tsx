"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FiArrowRight,
  FiPlus,
  FiTrash2,
  FiPrinter,
  FiSave,
  FiCheckCircle,
  FiBookOpen,
} from "react-icons/fi";
import { useERPStore } from "@/Store/erpStore";

type PaymentMethod = "cash" | "bank" | "credit";

type PurchaseFormItem = {
  id: number;
  productId: string;
  quantity: number;
  price: number;
  discount: number;
};

export default function NewPurchasePage() {
  // ======================================================
  // Zustand
  // ======================================================

  const products = useERPStore((state) => state.products);

  const suppliers = useERPStore((state) => state.suppliers);

  const purchases = useERPStore((state) => state.purchases);

  const accounts = useERPStore((state) => state.accounts);

  const addPurchase = useERPStore((state) => state.addPurchase);

  // ======================================================
  // الحسابات الفرعية فقط
  // ======================================================

  const subAccounts = useMemo(() => {
    return accounts
      .filter((account) => account.level > 0)
      .sort((a, b) =>
        a.code.localeCompare(b.code, undefined, {
          numeric: true,
        }),
      );
  }, [accounts]);

  // ======================================================
  // بيانات الفاتورة
  // ======================================================

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [supplierId, setSupplierId] = useState("");

  // الحساب المحاسبي
  const [accountCode, setAccountCode] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const [notes, setNotes] = useState("");

  // ======================================================
  // الأصناف
  // ======================================================

  const [items, setItems] = useState<PurchaseFormItem[]>([
    {
      id: Date.now(),
      productId: "",
      quantity: 1,
      price: 0,
      discount: 0,
    },
  ]);

  // ======================================================
  // حالة الحفظ
  // ======================================================

  const [isSaved, setIsSaved] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  const [savedInvoiceNumber, setSavedInvoiceNumber] = useState("");

  // ======================================================
  // رقم فاتورة المشتريات تلقائيًا
  // ======================================================

  const invoiceNumber = useMemo(() => {
    const numbers = purchases
      .map((purchase) => {
        const match = String(purchase.invoiceNumber).match(/(\d+)$/);

        return match ? Number(match[1]) : 0;
      })
      .filter((number) => number > 0);

    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1001;

    return "PUR-" + nextNumber;
  }, [purchases]);

  // ======================================================
  // المورد المختار
  // ======================================================

  const selectedSupplier = useMemo(() => {
    return suppliers.find((supplier) => supplier.id === supplierId);
  }, [suppliers, supplierId]);

  // ======================================================
  // الحساب المختار
  // ======================================================

  const selectedAccount = useMemo(() => {
    return subAccounts.find((account) => account.code === accountCode);
  }, [subAccounts, accountCode]);

  // ======================================================
  // الحصول على المنتج
  // ======================================================

  const getProduct = (productId: string) => {
    return products.find((product) => product.id === productId);
  };

  // ======================================================
  // إجمالي الصنف
  // ======================================================

  const getItemTotal = (item: PurchaseFormItem) => {
    const quantity = Number(item.quantity) || 0;

    const price = Number(item.price) || 0;

    const discount = Number(item.discount) || 0;

    const itemSubtotal = quantity * price;

    const discountAmount = itemSubtotal * (discount / 100);

    return Math.max(itemSubtotal - discountAmount, 0);
  };

  // ======================================================
  // المجموع
  // ======================================================

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => total + getItemTotal(item), 0);
  }, [items]);

  // ======================================================
  // إجمالي الخصم
  // ======================================================

  const totalDiscount = useMemo(() => {
    return items.reduce((total, item) => {
      const itemSubtotal =
        (Number(item.quantity) || 0) * (Number(item.price) || 0);

      const discountAmount =
        itemSubtotal * ((Number(item.discount) || 0) / 100);

      return total + discountAmount;
    }, 0);
  }, [items]);

  // ======================================================
  // الضريبة
  // ======================================================

  const tax = subtotal * 0.15;

  // ======================================================
  // الإجمالي النهائي
  // ======================================================

  const grandTotal = subtotal + tax;

  // ======================================================
  // تنسيق المبالغ
  // ======================================================

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // ======================================================
  // التاريخ للطباعة
  // ======================================================

  const formatDateForPrint = (value: string) => {
    if (!value) {
      return "-";
    }

    const parts = value.split("-");

    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return value;
  };

  // ======================================================
  // طريقة الدفع
  // ======================================================

  const getPaymentMethodName = (method: PaymentMethod) => {
    switch (method) {
      case "cash":
        return "نقدي";

      case "bank":
        return "تحويل بنكي";

      case "credit":
        return "آجل";

      default:
        return "-";
    }
  };

  // ======================================================
  // إضافة صنف
  // ======================================================

  const addItem = () => {
    setItems((current) => [
      ...current,

      {
        id: Date.now() + Math.floor(Math.random() * 10000),

        productId: "",

        quantity: 1,

        // السعر يتم تحديده عند الشراء
        price: 0,

        discount: 0,
      },
    ]);

    setIsSaved(false);
  };

  // ======================================================
  // حذف صنف
  // ======================================================

  const removeItem = (id: number) => {
    if (items.length === 1) {
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));

    setIsSaved(false);
  };

  // ======================================================
  // تعديل الصنف
  // ======================================================

  const updateItem = (
    id: number,
    field: keyof PurchaseFormItem,
    value: string,
  ) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (field === "productId") {
          return {
            ...item,

            productId: value,

            // لا يوجد سعر داخل Product
            // السعر يكتبه المستخدم هنا
            price: 0,
          };
        }

        const numericValue = Number(value);

        return {
          ...item,

          [field]:
            Number.isFinite(numericValue) && numericValue >= 0
              ? numericValue
              : 0,
        };
      }),
    );

    setIsSaved(false);
  };

  // ======================================================
  // التحقق من الفاتورة
  // ======================================================

  const validateInvoice = () => {
    if (!supplierId) {
      alert("يرجى اختيار المورد.");

      return false;
    }

    // الحساب المحاسبي إلزامي
    if (!accountCode) {
      alert("يرجى اختيار الحساب المحاسبي.");

      return false;
    }

    // التأكد من وجود الحساب
    const account = accounts.find((item) => item.code === accountCode);

    if (!account) {
      alert("الحساب المحاسبي غير موجود.");

      return false;
    }

    // السماح بالحسابات الفرعية فقط
    if (account.level === 0) {
      alert(
        "لا يمكن استخدام حساب رئيسي في فاتورة المشتريات. يجب اختيار حساب فرعي.",
      );

      return false;
    }

    const validItems = items.filter(
      (item) => item.productId && item.quantity > 0 && item.price > 0,
    );

    if (validItems.length === 0) {
      alert("يرجى إضافة صنف واحد على الأقل مع الكمية وسعر الشراء.");

      return false;
    }

    return true;
  };

  // ======================================================
  // حفظ الفاتورة
  // ======================================================

  const handleSave = () => {
    if (!validateInvoice()) {
      return;
    }

    const supplier = suppliers.find((item) => item.id === supplierId);

    if (!supplier) {
      alert("المورد غير موجود.");

      return;
    }

    const account = accounts.find((item) => item.code === accountCode);

    if (!account) {
      alert("الحساب المحاسبي غير موجود.");

      return;
    }

    if (account.level === 0) {
      alert("يجب اختيار حساب فرعي فقط.");

      return;
    }

    const validItems = items.filter(
      (item) => item.productId && item.quantity > 0 && item.price > 0,
    );

    const purchaseItems = validItems.map((item) => {
      const product = getProduct(item.productId);

      return {
        productId: item.productId,

        productName: product?.name || "صنف",

        quantity: item.quantity,

        price: item.price,

        discount: item.discount,

        tax: 15,

        total: getItemTotal(item),
      };
    });

    // ==================================================
    // الإضافة إلى Zustand
    // ==================================================

    addPurchase({
      invoiceNumber: invoiceNumber,

      date,

      supplierId: supplier.id,

      supplierName: supplier.name,

      accountCode: account.code,

      accountName: account.name,

      paymentMethod,

      items: purchaseItems,

      subtotal,

      discount: totalDiscount,

      tax,

      total: grandTotal,

      notes: notes.trim(),
    });

    // ==================================================
    // نجاح الحفظ
    // ==================================================

    setSavedInvoiceNumber(invoiceNumber);

    setIsSaved(true);
    setShowSuccess(true);

    alert("تم حفظ فاتورة المشتريات بنجاح.");

    // إخفاء رسالة النجاح
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  // ======================================================
  // الطباعة
  // ======================================================

  const handlePrint = () => {
    if (!isSaved) {
      alert("يجب حفظ الفاتورة أولاً قبل الطباعة.");

      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      alert("تعذر فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.");

      return;
    }

    const validItems = items.filter(
      (item) => item.productId && item.quantity > 0 && item.price > 0,
    );

    const itemsHTML = validItems
      .map((item, index) => {
        const product = getProduct(item.productId);

        return `
              <tr>
                <td>${index + 1}</td>

                <td class="item-name">
                  ${product?.name || "-"}
                </td>

                <td>
                  ${product?.unit || "-"}
                </td>

                <td>
                  ${item.quantity}
                </td>

                <td>
                  ${formatMoney(item.price)}
                </td>

                <td>
                  ${item.discount}%
                </td>

                <td class="bold">
                  ${formatMoney(getItemTotal(item))}
                </td>
              </tr>
            `;
      })
      .join("");

    const printHTML = `
      <!DOCTYPE html>

      <html
        lang="ar"
        dir="rtl"
      >

      <head>
        <meta charset="UTF-8" />

        <title>
          فاتورة مشتريات
          ${savedInvoiceNumber}
        </title>

        <style>

          @page {
            size: A4;
            margin: 12mm;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: white;
          }

          body {
            font-family:
              Arial,
              Tahoma,
              sans-serif;

            color:
              #111827;

            direction: rtl;

            font-size: 13px;
          }

          .invoice {
            width: 100%;
            max-width: 186mm;
            margin: 0 auto;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
          }

          .company-name {
            font-size: 24px;
            font-weight: 800;
            color: #2563eb;
            margin-bottom: 5px;
          }

          .company-subtitle {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 12px;
          }

          .company-info {
            color: #6b7280;
            line-height: 1.8;
          }

          .invoice-side {
            text-align: left;
          }

          .invoice-title {
            display: inline-block;
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
            padding: 8px 18px;
            border-radius: 6px;
            font-size: 18px;
            font-weight: 800;
            margin-bottom: 14px;
          }

          .invoice-info {
            border-collapse: collapse;
          }

          .invoice-info td {
            padding: 4px 0 4px 12px;
          }

          .invoice-info .label {
            color: #6b7280;
          }

          .invoice-info .value {
            font-weight: 700;
          }

          .section {
            margin-top: 20px;
          }

          .section-title {
            font-size: 15px;
            font-weight: 800;
            color: #111827;
            margin-bottom: 10px;
          }

          .supplier-box {
            display: grid;
            grid-template-columns: 1.5fr 1fr 1fr;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            overflow: hidden;
          }

          .supplier-cell {
            padding: 12px;
            border-left: 1px solid #d1d5db;
          }

          .supplier-cell:last-child {
            border-left: none;
          }

          .cell-label {
            color: #6b7280;
            font-size: 11px;
            margin-bottom: 5px;
          }

          .cell-value {
            font-weight: 700;
            color: #111827;
          }

          .account-box {
            margin-top: 10px;
            border: 1px solid #bfdbfe;
            background: #eff6ff;
            padding: 10px 12px;
            border-radius: 6px;
          }

          .account-label {
            color: #6b7280;
            font-size: 11px;
          }

          .account-value {
            color: #1d4ed8;
            font-weight: 800;
            margin-top: 4px;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          .items-table th {
            background: #eff6ff;
            color: #1e3a8a;
            border: 1px solid #bfdbfe;
            padding: 10px 7px;
            font-size: 12px;
            font-weight: 800;
          }

          .items-table td {
            border: 1px solid #d1d5db;
            padding: 10px 7px;
            text-align: center;
            color: #111827;
            font-size: 12px;
          }

          .items-table .item-name {
            text-align: right;
            font-weight: 600;
          }

          .bold {
            font-weight: 800;
          }

          .totals-wrapper {
            display: flex;
            justify-content: flex-start;
            margin-top: 18px;
          }

          .totals {
            width: 330px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            overflow: hidden;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 14px;
            border-bottom: 1px solid #e5e7eb;
          }

          .total-row:last-child {
            border-bottom: none;
          }

          .total-label {
            color: #6b7280;
          }

          .total-value {
            font-weight: 700;
          }

          .grand-total {
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 16px;
            font-weight: 800;
          }

          .grand-total .total-label,
          .grand-total .total-value {
            color: #1d4ed8;
          }

          .notes {
            margin-top: 20px;
            border-top: 1px solid #d1d5db;
            padding-top: 14px;
          }

          .notes-title {
            font-weight: 800;
            margin-bottom: 7px;
          }

          .notes-text {
            color: #4b5563;
            min-height: 35px;
            line-height: 1.7;
          }

          .footer {
            margin-top: 35px;
            padding-top: 12px;
            border-top: 1px solid #d1d5db;
            text-align: center;
            color: #6b7280;
            font-size: 11px;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }

        </style>
      </head>

      <body>

        <div class="invoice">

          <div class="header">

            <div>

              <div class="company-name">
                شركة الجابري
              </div>

              <div class="company-subtitle">
                للعسل والزيوت الطبيعة وخدمات العمره
              </div>

              <div class="company-info">
                البيضاء - اليمن
                <br />
                هاتف: 734 434 443
              </div>

            </div>

            <div class="invoice-side">

              <div class="invoice-title">
                فاتورة مشتريات
              </div>

              <table class="invoice-info">

                <tr>

                  <td class="label">
                    رقم الفاتورة:
                  </td>

                  <td class="value">
                    ${savedInvoiceNumber}
                  </td>

                </tr>

                <tr>

                  <td class="label">
                    التاريخ:
                  </td>

                  <td class="value">
                    ${formatDateForPrint(date)}
                  </td>

                </tr>

              </table>

            </div>

          </div>

          <div class="section">

            <div class="section-title">
              بيانات المورد
            </div>

            <div class="supplier-box">

              <div class="supplier-cell">

                <div class="cell-label">
                  اسم المورد
                </div>

                <div class="cell-value">
                  ${selectedSupplier?.name || "-"}
                </div>

              </div>

              <div class="supplier-cell">

                <div class="cell-label">
                  رقم الهاتف
                </div>

                <div class="cell-value">
                  ${selectedSupplier?.phone || "-"}
                </div>

              </div>

              <div class="supplier-cell">

                <div class="cell-label">
                  طريقة الدفع
                </div>

                <div class="cell-value">
                  ${getPaymentMethodName(paymentMethod)}
                </div>

              </div>

            </div>

            <div class="account-box">

              <div class="account-label">
                الحساب المحاسبي
              </div>

              <div class="account-value">
                ${
                  selectedAccount
                    ? `${selectedAccount.code} - ${selectedAccount.name}`
                    : "-"
                }
              </div>

            </div>

          </div>

          <div class="section">

            <div class="section-title">
              تفاصيل المشتريات
            </div>

            <table class="items-table">

              <thead>

                <tr>

                  <th style="width: 35px;">
                    #
                  </th>

                  <th>
                    الصنف
                  </th>

                  <th style="width: 65px;">
                    الوحدة
                  </th>

                  <th style="width: 65px;">
                    الكمية
                  </th>

                  <th style="width: 90px;">
                    سعر الشراء
                  </th>

                  <th style="width: 70px;">
                    الخصم
                  </th>

                  <th style="width: 105px;">
                    الإجمالي
                  </th>

                </tr>

              </thead>

              <tbody>

                ${itemsHTML}

              </tbody>

            </table>

          </div>

          <div class="totals-wrapper">

            <div class="totals">

              <div class="total-row">

                <span class="total-label">
                  الإجمالي قبل الخصم
                </span>

                <span class="total-value">
                  ${formatMoney(subtotal + totalDiscount)} ريال
                </span>

              </div>

              <div class="total-row">

                <span class="total-label">
                  الخصم
                </span>

                <span class="total-value">
                  ${formatMoney(totalDiscount)} ريال
                </span>

              </div>

              <div class="total-row">

                <span class="total-label">
                  الإجمالي قبل الضريبة
                </span>

                <span class="total-value">
                  ${formatMoney(subtotal)} ريال
                </span>

              </div>

              <div class="total-row">

                <span class="total-label">
                  ضريبة القيمة المضافة (15%)
                </span>

                <span class="total-value">
                  ${formatMoney(tax)} ريال
                </span>

              </div>

              <div class="total-row grand-total">

                <span class="total-label">
                  الإجمالي النهائي
                </span>

                <span class="total-value">
                  ${formatMoney(grandTotal)} ريال
                </span>

              </div>

            </div>

          </div>

          <div class="notes">

            <div class="notes-title">
              ملاحظات
            </div>

            <div class="notes-text">
              ${notes || "لا توجد ملاحظات"}
            </div>

          </div>

          <div class="footer">

            شركة الجابري للعسل والزيوت الطبيعة وخدمات العمره

            <br />

            نشكركم على التعامل معنا

          </div>

        </div>

        <script>

          window.onload =
            function () {

              setTimeout(
                function () {
                  window.print();
                },
                400
              );

            };

          window.onafterprint =
            function () {
              window.close();
            };

        </script>

      </body>

      </html>
    `;

    printWindow.document.open();

    printWindow.document.write(printHTML);

    printWindow.document.close();
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      {/* ==================================================
          Header
      ================================================== */}

      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm">
              <Link
                href="/purchases"
                className="text-gray-400 hover:text-blue-600"
              >
                المشتريات
              </Link>

              <FiArrowRight size={15} className="text-gray-400" />

              <span className="text-gray-600">فاتورة مشتريات جديدة</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-800">
              فاتورة مشتريات جديدة
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              إدخال وحفظ فاتورة مشتريات جديدة
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!isSaved}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium transition ${
                isSaved
                  ? "bg-white border border-blue-200 text-blue-600 hover:bg-blue-50"
                  : "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <FiPrinter size={19} />
              طباعة الفاتورة
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
            >
              <FiSave size={19} />

              {isSaved ? "تم الحفظ" : "حفظ الفاتورة"}
            </button>
          </div>
        </div>

        {/* ==================================================
            Success
        ================================================== */}

        {showSuccess && (
          <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <FiCheckCircle size={20} />

            <div>
              <span>تم حفظ الفاتورة بنجاح.</span>

              <p className="text-xs mt-1">رقم الفاتورة: {savedInvoiceNumber}</p>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================
          Main Card
      ================================================== */}

      <div className="max-w-7xl mx-auto bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* ==================================================
            Company Header
        ================================================== */}

        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-blue-600">شركة الجابري</h2>

              <p className="text-gray-500 mt-1">
                للعسل والزيوت الطبيعة وخدمات العمره
              </p>

              <p className="text-sm text-gray-500 mt-3">البيضاء - اليمن</p>

              <p className="text-sm text-gray-500" dir="rtl">
                هاتف: <bdi dir="ltr">734 434 443</bdi>
              </p>
            </div>

            <div className="md:text-left">
              <span className="inline-flex bg-blue-50 text-blue-700 border border-blue-100 px-5 py-2 rounded-lg font-bold">
                فاتورة مشتريات
              </span>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex gap-4 items-center">
                  <span className="text-gray-500">رقم الفاتورة:</span>

                  <strong className="text-gray-800">
                    {isSaved ? savedInvoiceNumber : invoiceNumber}
                  </strong>
                </div>

                <div className="flex gap-4 items-center">
                  <span className="text-gray-500">التاريخ:</span>

                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);

                      setIsSaved(false);
                    }}
                    className="font-semibold text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            Supplier
        ================================================== */}

        <div className="p-6 border-b border-gray-200">
          <h3 className="font-bold text-gray-800 mb-5">بيانات المورد</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* المورد */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                المورد
              </label>

              <select
                value={supplierId}
                onChange={(e) => {
                  setSupplierId(e.target.value);

                  setIsSaved(false);
                }}
                className="w-full h-12 px-4 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">اختر المورد</option>

                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.id} - {supplier.name}
                  </option>
                ))}
              </select>

              {suppliers.length === 0 && (
                <p className="text-xs text-red-500 mt-2">
                  لا يوجد موردون حاليًا. أضف موردًا أولًا.
                </p>
              )}

              {selectedSupplier?.phone && (
                <p className="text-xs text-gray-400 mt-2">
                  الهاتف: {selectedSupplier.phone}
                </p>
              )}
            </div>

            {/* الحساب المحاسبي */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                الحساب المحاسبي
              </label>

              <div className="relative">
                <FiBookOpen
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <select
                  value={accountCode}
                  onChange={(e) => {
                    setAccountCode(e.target.value);

                    setIsSaved(false);
                  }}
                  className="w-full h-12 pl-3 pr-10 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">اختر الحساب الفرعي</option>

                  {subAccounts.map((account) => (
                    <option key={account.id} value={account.code}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </div>

              {subAccounts.length === 0 && (
                <p className="text-xs text-red-500 mt-2 leading-5">
                  لا توجد حسابات فرعية. أضف حسابًا رئيسيًا ثم أضف حسابًا فرعيًا
                  من دليل الحسابات.
                </p>
              )}

              {selectedAccount && (
                <p className="text-xs text-blue-600 mt-2">
                  الحساب المحدد: {selectedAccount.code} - {selectedAccount.name}
                </p>
              )}
            </div>

            {/* طريقة الدفع */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                طريقة الدفع
              </label>

              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value as PaymentMethod);

                  setIsSaved(false);
                }}
                className="w-full h-12 px-4 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="cash">نقدي</option>

                <option value="credit">آجل</option>

                <option value="bank">تحويل بنكي</option>
              </select>
            </div>

            {/* حالة الفاتورة */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                حالة الفاتورة
              </label>

              <div className="w-full h-12 px-4 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center">
                {paymentMethod === "credit" ? "آجلة" : "مدفوعة"}
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            Items
        ================================================== */}

        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="font-bold text-gray-800">تفاصيل المشتريات</h3>

              <p className="text-xs text-gray-400 mt-1">
                السعر والكمية يتم تحديدهما عند عملية الشراء.
              </p>
            </div>

            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold"
            >
              <FiPlus size={17} />
              إضافة صنف
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-4 text-sm text-gray-700">
                    #
                  </th>

                  <th className="border border-gray-300 px-4 py-4 text-right text-sm text-gray-700 min-w-[280px]">
                    الصنف
                  </th>

                  <th className="border border-gray-300 px-4 py-4 text-sm text-gray-700">
                    الوحدة
                  </th>

                  <th className="border border-gray-300 px-4 py-4 text-sm text-gray-700">
                    الكمية
                  </th>

                  <th className="border border-gray-300 px-4 py-4 text-sm text-gray-700">
                    سعر الشراء
                  </th>

                  <th className="border border-gray-300 px-4 py-4 text-sm text-gray-700">
                    الخصم %
                  </th>

                  <th className="border border-gray-300 px-4 py-4 text-sm text-gray-700">
                    الإجمالي
                  </th>

                  <th className="border border-gray-300 px-4 py-4 text-sm text-gray-700">
                    حذف
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => {
                  const product = getProduct(item.productId);

                  return (
                    <tr key={item.id}>
                      {/* الرقم */}

                      <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">
                        {index + 1}
                      </td>

                      {/* الصنف */}

                      <td className="border border-gray-300 px-4 py-3">
                        <select
                          value={item.productId}
                          onChange={(e) =>
                            updateItem(item.id, "productId", e.target.value)
                          }
                          className="w-full h-11 px-3 bg-white text-gray-900 border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">اختر الصنف</option>

                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.code} - {product.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* الوحدة */}

                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <span className="text-sm text-gray-600">
                          {product?.unit || "-"}
                        </span>
                      </td>

                      {/* الكمية */}

                      <td className="border border-gray-300 px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, "quantity", e.target.value)
                          }
                          className="w-24 h-11 px-3 bg-white text-gray-900 border border-gray-300 rounded-md outline-none text-center focus:border-blue-500"
                        />
                      </td>

                      {/* السعر */}

                      <td className="border border-gray-300 px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) =>
                            updateItem(item.id, "price", e.target.value)
                          }
                          className="w-32 h-11 px-3 bg-white text-gray-900 border border-gray-300 rounded-md outline-none text-center focus:border-blue-500"
                        />
                      </td>

                      {/* الخصم */}

                      <td className="border border-gray-300 px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) =>
                            updateItem(item.id, "discount", e.target.value)
                          }
                          className="w-24 h-11 px-3 bg-white text-gray-900 border border-gray-300 rounded-md outline-none text-center focus:border-blue-500"
                        />
                      </td>

                      {/* الإجمالي */}

                      <td className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900 whitespace-nowrap">
                        {formatMoney(getItemTotal(item))} ريال
                      </td>

                      {/* حذف */}

                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ==================================================
            Totals
        ================================================== */}

        <div className="px-6 pb-6">
          <div className="flex justify-end">
            <div className="w-full md:w-96 border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex justify-between px-5 py-4 border-b border-gray-200">
                <span className="text-gray-500">الإجمالي قبل الخصم</span>

                <span className="font-semibold text-gray-900">
                  {formatMoney(subtotal + totalDiscount)} ريال
                </span>
              </div>

              <div className="flex justify-between px-5 py-4 border-b border-gray-200">
                <span className="text-gray-500">الخصم</span>

                <span className="font-semibold text-red-600">
                  - {formatMoney(totalDiscount)} ريال
                </span>
              </div>

              <div className="flex justify-between px-5 py-4 border-b border-gray-200">
                <span className="text-gray-500">الإجمالي قبل الضريبة</span>

                <span className="font-semibold text-gray-900">
                  {formatMoney(subtotal)} ريال
                </span>
              </div>

              <div className="flex justify-between px-5 py-4 border-b border-gray-200">
                <span className="text-gray-500">
                  ضريبة القيمة المضافة (15%)
                </span>

                <span className="font-semibold text-gray-900">
                  {formatMoney(tax)} ريال
                </span>
              </div>

              <div className="flex justify-between items-center px-5 py-5 bg-blue-50">
                <span className="font-bold text-gray-800">
                  الإجمالي النهائي
                </span>

                <span className="text-xl font-bold text-blue-600">
                  {formatMoney(grandTotal)} ريال
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            Notes
        ================================================== */}

        <div className="p-6 border-t border-gray-200">
          <h3 className="font-bold text-gray-800 mb-3">ملاحظات</h3>

          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);

              setIsSaved(false);
            }}
            placeholder="أدخل ملاحظات الفاتورة..."
            className="w-full h-24 px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none resize-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>
    </main>
  );
}
