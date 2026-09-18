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
  FiTruck,
  FiPercent,
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

type SupplierWithAccount = {
  accountCode?: string;
  accountName?: string;
};

type TaxMode = "none" | "tax";

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
  // بيانات الفاتورة
  // ======================================================

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [supplierId, setSupplierId] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const [notes, setNotes] = useState("");

  // ======================================================
  // الضريبة
  // ======================================================

  /*
   * none = بدون ضريبة
   * tax  = مع ضريبة
   */
  const [taxMode, setTaxMode] = useState<TaxMode>("none");

  /*
   * نسبة الضريبة
   *
   * القيمة الافتراضية 15%
   */
  const [taxRate, setTaxRate] = useState(15);

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
  // رقم فاتورة المشتريات
  // ======================================================

  const invoiceNumber = useMemo(() => {
    const numbers = purchases
      .map((purchase) => {
        const match = String(purchase.invoiceNumber).match(/(\d+)$/);

        return match ? Number(match[1]) : 0;
      })
      .filter((number) => number > 0);

    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1001;

    return `PUR-${nextNumber}`;
  }, [purchases]);

  // ======================================================
  // المورد المختار
  // ======================================================

  const selectedSupplier = useMemo(() => {
    return suppliers.find((supplier) => supplier.id === supplierId);
  }, [suppliers, supplierId]);

  // ======================================================
  // حساب المورد
  // ======================================================

  const getSupplierAccount = (supplierIdValue: string) => {
    const supplier = suppliers.find((item) => item.id === supplierIdValue);

    if (!supplier) {
      return null;
    }

    const supplierWithAccount = supplier as typeof supplier &
      SupplierWithAccount;

    // ------------------------------------------------------
    // الحساب المرتبط مباشرة بالمورد
    // ------------------------------------------------------

    if (supplierWithAccount.accountCode) {
      const account = accounts.find(
        (item) =>
          item.code === supplierWithAccount.accountCode &&
          item.parent === "2001" &&
          item.level > 1 &&
          item.type === "liability",
      );

      if (account) {
        return account;
      }
    }

    // ------------------------------------------------------
    // البحث باسم المورد
    // ------------------------------------------------------

    const accountByName = accounts.find(
      (item) =>
        item.parent === "2001" &&
        item.level > 1 &&
        item.type === "liability" &&
        item.name.trim() === supplier.name.trim(),
    );

    return accountByName || null;
  };

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
  // الإجمالي قبل الضريبة
  // ======================================================

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => total + getItemTotal(item), 0);
  }, [items]);

  // ======================================================
  // إجمالي الخصم
  // ======================================================

  const totalDiscount = useMemo(() => {
    return items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;

      const price = Number(item.price) || 0;

      const discount = Number(item.discount) || 0;

      const itemSubtotal = quantity * price;

      const discountAmount = itemSubtotal * (discount / 100);

      return total + discountAmount;
    }, 0);
  }, [items]);

  // ======================================================
  // قيمة الضريبة
  // ======================================================

  const tax = useMemo(() => {
    /*
     * إذا اختار المستخدم بدون ضريبة
     * فالضريبة = صفر.
     */

    if (taxMode === "none") {
      return 0;
    }

    const rate = Number(taxRate) || 0;

    return subtotal * (rate / 100);
  }, [subtotal, taxMode, taxRate]);

  // ======================================================
  // الإجمالي النهائي
  // ======================================================

  const grandTotal = useMemo(() => {
    return subtotal + tax;
  }, [subtotal, tax]);

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
  // تنسيق التاريخ للطباعة
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
  // اسم طريقة الدفع
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
  // تغيير الضريبة
  // ======================================================

  const handleTaxModeChange = (mode: TaxMode) => {
    setTaxMode(mode);

    /*
     * إذا اختار بدون ضريبة
     * لا نحتاج تصفير النسبة.
     *
     * نحتفظ بها في حالة إعادة
     * اختيار "مع ضريبة".
     */

    setIsSaved(false);
  };

  // ======================================================
  // تغيير نسبة الضريبة
  // ======================================================

  const handleTaxRateChange = (value: string) => {
    const numericValue = Number(value);

    setTaxRate(
      Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0,
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

    const supplier = suppliers.find((item) => item.id === supplierId);

    if (!supplier) {
      alert("المورد غير موجود.");
      return false;
    }

    // ----------------------------------------------------
    // الحساب المحاسبي
    // ----------------------------------------------------

    const supplierAccount = getSupplierAccount(supplierId);

    if (!supplierAccount) {
      alert(
        "هذا المورد غير مرتبط بحساب محاسبي صحيح تحت مجموعة الموردين. يرجى ربط المورد بحسابه أولًا.",
      );

      return false;
    }

    // ----------------------------------------------------
    // التحقق من الضريبة
    // ----------------------------------------------------

    if (taxMode === "tax") {
      if (!Number.isFinite(Number(taxRate)) || Number(taxRate) < 0) {
        alert("يرجى إدخال نسبة ضريبة صحيحة.");

        return false;
      }
    }

    // ----------------------------------------------------
    // الأصناف
    // ----------------------------------------------------

    const validItems = items.filter(
      (item) => item.productId && item.quantity > 0 && item.price > 0,
    );

    if (validItems.length === 0) {
      alert("يرجى إضافة صنف واحد على الأقل مع الكمية وسعر الشراء.");

      return false;
    }

    // ----------------------------------------------------
    // المنتجات
    // ----------------------------------------------------

    const invalidProduct = validItems.find(
      (item) => !products.some((product) => product.id === item.productId),
    );

    if (invalidProduct) {
      alert("يوجد صنف غير موجود في قائمة المنتجات.");

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

    const supplierAccount = getSupplierAccount(supplierId);

    if (!supplierAccount) {
      alert("تعذر العثور على الحساب المحاسبي المرتبط بالمورد.");

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

        /*
         * ضريبة الصنف هنا هي نسبة الضريبة
         * وليس قيمة الضريبة.
         *
         * بما أن الضريبة تحسب على مستوى
         * الفاتورة، نحفظ النسبة المستخدمة.
         */
        tax: taxMode === "tax" ? taxRate : 0,

        total: getItemTotal(item),
      };
    });

    // ==================================================
    // إضافة الفاتورة إلى Zustand
    // ==================================================

    addPurchase({
      invoiceNumber,

      date,

      supplierId: supplier.id,

      supplierName: supplier.name,

      accountCode: supplierAccount.code,

      accountName: supplierAccount.name,

      paymentMethod,

      items: purchaseItems,

      subtotal,

      discount: totalDiscount,

      /*
       * قيمة الضريبة الفعلية
       */
      tax,

      /*
       * نسبة الضريبة
       */
      taxRate: taxMode === "tax" ? taxRate : 0,

      total: grandTotal,

      notes: notes.trim(),
    });

    // ==================================================
    // حالة الحفظ
    // ==================================================

    setSavedInvoiceNumber(invoiceNumber);

    setIsSaved(true);

    setShowSuccess(true);

    alert("تم حفظ فاتورة المشتريات بنجاح.");

    window.setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  // ======================================================
  // الطباعة
  // ======================================================

  const handlePrint = () => {
    if (!isSaved) {
      alert("يجب حفظ الفاتورة أولًا قبل الطباعة.");

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
              <td>
                ${index + 1}
              </td>

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

    const taxHTML =
      taxMode === "tax"
        ? `
          <div class="total-row">
            <span class="total-label">
              ضريبة القيمة المضافة (${taxRate}%)
            </span>

            <span class="total-value">
              ${formatMoney(tax)} ريال
            </span>
          </div>
        `
        : `
          <div class="total-row">
            <span class="total-label">
              الضريبة
            </span>

            <span class="total-value">
              بدون ضريبة
            </span>
          </div>
        `;

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

              color: #111827;

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

              border-bottom:
                2px solid
                #2563eb;
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

              border:
                1px solid
                #bfdbfe;

              padding:
                8px 18px;

              border-radius: 6px;

              font-size: 18px;
              font-weight: 800;

              margin-bottom: 14px;
            }

            .invoice-info {
              border-collapse: collapse;
            }

            .invoice-info td {
              padding:
                4px 0
                4px 12px;
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

              grid-template-columns:
                1.5fr
                1fr
                1fr;

              border:
                1px solid
                #d1d5db;

              border-radius: 6px;

              overflow: hidden;
            }

            .supplier-cell {
              padding: 12px;

              border-left:
                1px solid
                #d1d5db;
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

            .items-table {
              width: 100%;

              border-collapse: collapse;

              margin-top: 10px;
            }

            .items-table th {
              background: #eff6ff;

              color: #1e3a8a;

              border:
                1px solid
                #bfdbfe;

              padding:
                10px 7px;

              font-size: 12px;

              font-weight: 800;
            }

            .items-table td {
              border:
                1px solid
                #d1d5db;

              padding:
                10px 7px;

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

              border:
                1px solid
                #d1d5db;

              border-radius: 6px;

              overflow: hidden;
            }

            .total-row {
              display: flex;

              justify-content:
                space-between;

              padding:
                10px 14px;

              border-bottom:
                1px solid
                #e5e7eb;
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

            .grand-total
            .total-label,
            .grand-total
            .total-value {
              color: #1d4ed8;
            }

            .notes {
              margin-top: 20px;

              border-top:
                1px solid
                #d1d5db;

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

              border-top:
                1px solid
                #d1d5db;

              text-align: center;

              color: #6b7280;

              font-size: 11px;
            }

            @media print {

              body {
                -webkit-print-color-adjust:
                  exact;

                print-color-adjust:
                  exact;
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
                  للعسل والزيوت الطبيعة وخدمات العمرة
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

                  <tr>

                    <td class="label">
                      الضريبة:
                    </td>

                    <td class="value">
                      ${taxMode === "tax" ? `${taxRate}%` : "بدون ضريبة"}
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

                ${taxHTML}

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

              شركة الجابري للعسل والزيوت الطبيعة وخدمات العمرة

              <br />

              نشكركم على التعامل معنا

            </div>

          </div>

          <script>

            window.onload = function () {

              setTimeout(
                function () {
                  window.print();
                },
                400
              );

            };

            window.onafterprint = function () {
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

  // ======================================================
  // الواجهة
  // ======================================================

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto mb-6">
        {/* ==================================================
            Header
        ================================================== */}

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
              disabled={isSaved}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium transition ${
                isSaved
                  ? "bg-green-100 text-green-700 cursor-default"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isSaved ? <FiCheckCircle size={19} /> : <FiSave size={19} />}

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
                للعسل والزيوت الطبيعة وخدمات العمرة
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
                    onChange={(event) => {
                      setDate(event.target.value);

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
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FiTruck size={20} />
            </div>

            <div>
              <h3 className="font-bold text-gray-800">بيانات المورد</h3>

              <p className="text-xs text-gray-400 mt-1">
                اختر المورد فقط، وسيتم التعامل مع حسابه داخليًا.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* المورد */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                المورد
              </label>

              <select
                value={supplierId}
                onChange={(event) => {
                  setSupplierId(event.target.value);

                  setIsSaved(false);
                }}
                className="w-full h-12 px-4 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">اختر المورد</option>

                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
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

            {/* طريقة الدفع */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                طريقة الدفع
              </label>

              <select
                value={paymentMethod}
                onChange={(event) => {
                  setPaymentMethod(event.target.value as PaymentMethod);

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
            Tax
        ================================================== */}

        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiPercent size={20} />
            </div>

            <div>
              <h3 className="font-bold text-gray-800">ضريبة القيمة المضافة</h3>

              <p className="text-xs text-gray-400 mt-1">
                يمكنك إصدار الفاتورة بالضريبة أو بدون ضريبة وتحديد النسبة.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* نوع الضريبة */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                الضريبة
              </label>

              <select
                value={taxMode}
                onChange={(event) =>
                  handleTaxModeChange(event.target.value as TaxMode)
                }
                className="w-full h-12 px-4 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              >
                <option value="none">بدون ضريبة</option>

                <option value="tax">مع ضريبة</option>
              </select>
            </div>

            {/* نسبة الضريبة */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                نسبة الضريبة %
              </label>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  disabled={taxMode === "none"}
                  onChange={(event) => handleTaxRateChange(event.target.value)}
                  className={`w-full h-12 px-4 pl-12 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none transition ${
                    taxMode === "none"
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  }`}
                />

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                  %
                </span>
              </div>
            </div>

            {/* قيمة الضريبة */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                قيمة الضريبة
              </label>

              <div
                className={`w-full h-12 px-4 rounded-lg border flex items-center font-bold ${
                  taxMode === "tax"
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                }`}
              >
                {formatMoney(tax)} ريال
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
                      <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">
                        {index + 1}
                      </td>

                      <td className="border border-gray-300 px-4 py-3">
                        <select
                          value={item.productId}
                          onChange={(event) =>
                            updateItem(item.id, "productId", event.target.value)
                          }
                          className="w-full h-11 px-3 bg-white text-gray-900 border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">اختر الصنف</option>

                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.code}
                              {" - "}
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <span className="text-sm text-gray-600">
                          {product?.unit || "-"}
                        </span>
                      </td>

                      <td className="border border-gray-300 px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(item.id, "quantity", event.target.value)
                          }
                          className="w-24 h-11 px-3 bg-white text-gray-900 border border-gray-300 rounded-md outline-none text-center focus:border-blue-500"
                        />
                      </td>

                      <td className="border border-gray-300 px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(event) =>
                            updateItem(item.id, "price", event.target.value)
                          }
                          className="w-32 h-11 px-3 bg-white text-gray-900 border border-gray-300 rounded-md outline-none text-center focus:border-blue-500"
                        />
                      </td>

                      <td className="border border-gray-300 px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.discount}
                          onChange={(event) =>
                            updateItem(item.id, "discount", event.target.value)
                          }
                          className="w-24 h-11 px-3 bg-white text-gray-900 border border-gray-300 rounded-md outline-none text-center focus:border-blue-500"
                        />
                      </td>

                      <td className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900 whitespace-nowrap">
                        {formatMoney(getItemTotal(item))}
                        {" ريال"}
                      </td>

                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                          title="حذف الصنف"
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
                  {formatMoney(subtotal + totalDiscount)}
                  {" ريال"}
                </span>
              </div>

              <div className="flex justify-between px-5 py-4 border-b border-gray-200">
                <span className="text-gray-500">الخصم</span>

                <span className="font-semibold text-red-600">
                  - {formatMoney(totalDiscount)}
                  {" ريال"}
                </span>
              </div>

              <div className="flex justify-between px-5 py-4 border-b border-gray-200">
                <span className="text-gray-500">الإجمالي قبل الضريبة</span>

                <span className="font-semibold text-gray-900">
                  {formatMoney(subtotal)}
                  {" ريال"}
                </span>
              </div>

              <div className="flex justify-between px-5 py-4 border-b border-gray-200">
                <span className="text-gray-500">
                  {taxMode === "tax"
                    ? `ضريبة القيمة المضافة (${taxRate}%)`
                    : "الضريبة"}
                </span>

                <span
                  className={`font-semibold ${
                    taxMode === "tax" ? "text-amber-600" : "text-gray-400"
                  }`}
                >
                  {taxMode === "tax" ? formatMoney(tax) : "بدون ضريبة"}

                  {taxMode === "tax" && " ريال"}
                </span>
              </div>

              <div className="flex justify-between items-center px-5 py-5 bg-blue-50">
                <span className="font-bold text-gray-800">
                  الإجمالي النهائي
                </span>

                <span className="text-xl font-bold text-blue-600">
                  {formatMoney(grandTotal)}
                  {" ريال"}
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
            onChange={(event) => {
              setNotes(event.target.value);

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
