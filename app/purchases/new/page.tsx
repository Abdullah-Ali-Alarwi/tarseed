"use client";

import { useMemo, useState } from "react";
import { useSuppliersStore } from "@/Store/suppliersStore";
import { useProductsStore } from "@/Store/productsStore";
import { usePurchasesStore } from "@/Store/purchasesStore";
import { useCustomersStore } from "@/Store/customersStore";

import PurchaseHeader from "./PurchasesComponents/PurchaseHeader";
import PurchaseSupplier from "./PurchasesComponents/PurchaseSupplier";
import PurchaseTax from "./PurchasesComponents/PurchaseTax";
import PurchaseItems from "./PurchasesComponents/PurchaseItems";
import PurchaseTotals from "./PurchasesComponents/PurchaseTotals";

import type { PaymentMethod, TaxMode, PurchaseFormItem } from "./types";

/* =========================================================
   الصفحة الرئيسية
========================================================= */

export default function NewPurchasePage() {
  /* =========================================================
     Zustand
  ========================================================= */

  const products = useProductsStore((state) => state.products);
  const suppliers = useSuppliersStore((state) => state.suppliers);
  const purchases = usePurchasesStore((state) => state.purchases);
  const accounts = useCustomersStore((state) => state.customers);
  const addPurchase = usePurchasesStore((state) => state.addPurchase);

  /* =========================================================
     الحالات
  ========================================================= */

  const [date, setDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [supplierId, setSupplierId] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

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
      إذا كان المورد مرتبطًا بحساب مباشرة
    */

    if (selectedSupplier.accountCode && selectedSupplier.accountName) {
      return {
        accountCode: selectedSupplier.accountCode,
        accountName: selectedSupplier.accountName,
      };
    }

    /*
      البحث عن حساب المورد تحت حساب الموردين 2001
    */

    const supplierName = String(selectedSupplier.name ?? "")
      .trim()
      .toLowerCase();
    const supplierAccount = accounts.find((account: any) => {
      const parentCode = String(account.parentCode ?? "");

      const accountName = String(account.name ?? "")
        .trim()
        .toLowerCase();

      const accountType = String(account.type ?? "").toLowerCase();

      const level = Number(account.level ?? 2);

      return (
        parentCode === "2001" &&
        level > 1 &&
        accountType === "liability" &&
        accountName === supplierName
      );
    });

    if (supplierAccount) {
      return {
        accountCode: String(supplierAccount.accountCode ?? ""),
        accountName: String(supplierAccount.name ?? ""),
      };
    }

    /*
      بحث احتياطي باسم المورد
    */

    const fallbackAccount = accounts.find((account: any) => {
      const accountName = String(account.name ?? "")
        .trim()
        .toLowerCase();

      return accountName === supplierName;
    });

    if (fallbackAccount) {
      return {
        accountCode: String(fallbackAccount.accountCode ?? ""),
        accountName: String(fallbackAccount.name ?? ""),
      };
    }

    return {
      accountCode: "",
      accountName: "",
    };
  };

  /* =========================================================
     الحصول على المنتج
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

    const subtotal = quantity * price;

    return Math.max(0, subtotal - discount);
  };

  /* =========================================================
     إجمالي الفاتورة قبل الخصم
  ========================================================= */

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;

      const price = Number(item.price) || 0;

      return sum + quantity * price;
    }, 0);
  }, [items]);

  /* =========================================================
     إجمالي الخصم
  ========================================================= */

  const totalDiscount = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + (Number(item.discount) || 0);
    }, 0);
  }, [items]);

  /* =========================================================
     بعد الخصم
  ========================================================= */

  const afterDiscount = Math.max(0, subtotal - totalDiscount);

  /* =========================================================
     الضريبة
  ========================================================= */

  const tax = useMemo(() => {
    if (taxMode !== "tax") {
      return 0;
    }

    const rate = Number(taxRate) || 0;

    return afterDiscount * (rate / 100);
  }, [taxMode, taxRate, afterDiscount]);

  /* =========================================================
     الإجمالي النهائي
  ========================================================= */

  const grandTotal = afterDiscount + tax;

  /* =========================================================
     تنسيق الأموال
  ========================================================= */

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("ar-SA").format(Number(value) || 0);
  };

  /* =========================================================
     تغيير نوع الضريبة
  ========================================================= */

  const handleTaxModeChange = (value: TaxMode) => {
    setTaxMode(value);
    setIsSaved(false);
  };

  /* =========================================================
     تغيير نسبة الضريبة
  ========================================================= */

  const handleTaxRateChange = (value: number) => {
    const rate = Math.max(0, Number(value) || 0);

    setTaxRate(rate);
    setIsSaved(false);
  };

  /* =========================================================
     إضافة صنف
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

  /* =========================================================
     حذف صنف
  ========================================================= */

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

  /* =========================================================
     تعديل الصنف
  ========================================================= */

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
     التحقق من الفاتورة
  ========================================================= */

  const validateInvoice = () => {
    if (!supplierId) {
      alert("يرجى اختيار المورد");
      return false;
    }

    if (items.length === 0) {
      alert("يرجى إضافة صنف واحد على الأقل");
      return false;
    }

    for (const item of items) {
      if (!item.productId) {
        alert("يرجى اختيار المنتج لكل صنف");
        return false;
      }

      if (Number(item.quantity) <= 0) {
        alert("يجب أن تكون الكمية أكبر من صفر");
        return false;
      }

      if (Number(item.price) < 0) {
        alert("السعر لا يمكن أن يكون سالبًا");
        return false;
      }

      if (Number(item.discount) < 0) {
        alert("الخصم لا يمكن أن يكون سالبًا");
        return false;
      }
    }

    if (grandTotal <= 0) {
      alert("إجمالي الفاتورة يجب أن يكون أكبر من صفر");
      return false;
    }

    return true;
  };

  /* =========================================================
     اسم طريقة الدفع
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
     تنسيق التاريخ
  ========================================================= */

  const formatDateForPrint = (value: string) => {
    if (!value) {
      return "";
    }

    const parts = value.split("-");

    if (parts.length !== 3) {
      return value;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  /* =========================================================
     حفظ الفاتورة
  ========================================================= */

  const handleSave = () => {
    if (!validateInvoice()) {
      return;
    }

    const supplierAccount = getSupplierAccount();

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

    addPurchase({
      id: `purchase-${Date.now()}`,

      invoiceNumber,

      date,

      supplier: selectedSupplier?.name ?? "",

      supplierId,

      accountCode: supplierAccount.accountCode,

      accountName: supplierAccount.accountName,

      itemCount: purchaseItems.length,

      items: purchaseItems,

      subtotal,

      discount: totalDiscount,

      tax,

      taxRate: taxMode === "tax" ? taxRate : 0,

      total: grandTotal,

      paymentMethod,

      paymentMethodName: getPaymentMethodName(paymentMethod),

      status: paymentMethod === "credit" ? "آجلة" : "مدفوعة",

      notes,
    } as any);

    setIsSaved(true);

    setShowSuccess(true);

    setSavedInvoiceNumber(invoiceNumber);

    setTimeout(() => {
      setShowSuccess(false);
    }, 4000);
  };

  /* =========================================================
     الطباعة
  ========================================================= */

  const handlePrint = () => {
    if (!isSaved) {
      alert("يرجى حفظ الفاتورة أولًا قبل طباعتها");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      alert("تعذر فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.");
      return;
    }

    const supplierName = selectedSupplier?.name ?? "";

    const supplierPhone = selectedSupplier?.phone ?? "";

    const supplierAddress = selectedSupplier?.address ?? "";

    const paymentName = getPaymentMethodName(paymentMethod);

    const itemsHtml = items
      .map((item, index) => {
        const product = getProduct(item.productId);

        const quantity = Number(item.quantity) || 0;

        const price = Number(item.price) || 0;

        const discount = Number(item.discount) || 0;

        const total = getItemTotal(item);

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
      taxMode === "tax"
        ? `
          <div class="total-row">
            <span>
              الضريبة (${taxRate}%)
            </span>

            <strong>
              ${formatMoney(tax)} ريال
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
          فاتورة مشتريات ${invoiceNumber}
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            background: white;
            color: #111827;
            font-family:
              Arial,
              Tahoma,
              sans-serif;
            direction: rtl;
          }

          .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 12mm;
            background: white;
          }

          .company {
            text-align: center;
            border-bottom: 2px solid #111827;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }

          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }

          .company-activity {
            font-size: 14px;
            margin-bottom: 4px;
          }

          .company-info {
            font-size: 12px;
            color: #374151;
          }

          .invoice-title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin: 15px 0;
          }

          .invoice-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
          }

          .info-box {
            border: 1px solid #d1d5db;
            padding: 8px;
            border-radius: 5px;
          }

          .info-label {
            color: #6b7280;
            font-size: 11px;
            margin-bottom: 3px;
          }

          .info-value {
            font-size: 13px;
            font-weight: bold;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          th,
          td {
            border: 1px solid #d1d5db;
            padding: 7px 5px;
            text-align: center;
            font-size: 11px;
          }

          th {
            background: #f3f4f6;
            font-weight: bold;
          }

          .totals {
            width: 320px;
            margin-top: 15px;
            margin-right: auto;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #e5e7eb;
            padding: 7px 0;
            font-size: 12px;
          }

          .grand-total {
            border-top: 2px solid #111827;
            font-size: 15px;
            font-weight: bold;
            padding-top: 10px;
          }

          .notes {
            margin-top: 25px;
            border: 1px solid #d1d5db;
            padding: 10px;
            min-height: 60px;
          }

          .notes-title {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 5px;
          }

          .notes-text {
            font-size: 11px;
            white-space: pre-wrap;
          }

          .footer {
            margin-top: 35px;
            padding-top: 10px;
            border-top: 1px solid #d1d5db;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
          }

          @media print {

            @page {
              size: A4;
              margin: 0;
            }

            body {
              background: white;
            }

            .page {
              width: 210mm;
              min-height: 297mm;
              margin: 0;
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
              &nbsp;&nbsp; | &nbsp;&nbsp;
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
                ${invoiceNumber}
              </div>
            </div>

            <div class="info-box">
              <div class="info-label">
                التاريخ
              </div>

              <div class="info-value">
                ${formatDateForPrint(date)}
              </div>
            </div>

            <div class="info-box">
              <div class="info-label">
                المورد
              </div>

              <div class="info-value">
                ${supplierName}
              </div>
            </div>

            <div class="info-box">
              <div class="info-label">
                طريقة الدفع
              </div>

              <div class="info-value">
                ${paymentName}
              </div>
            </div>

            ${
              supplierPhone
                ? `
                  <div class="info-box">
                    <div class="info-label">
                      الهاتف
                    </div>

                    <div class="info-value">
                      ${supplierPhone}
                    </div>
                  </div>
                `
                : ""
            }

            ${
              supplierAddress
                ? `
                  <div class="info-box">
                    <div class="info-label">
                      العنوان
                    </div>

                    <div class="info-value">
                      ${supplierAddress}
                    </div>
                  </div>
                `
                : ""
            }

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
                ${formatMoney(subtotal)}
                ريال
              </strong>

            </div>

            <div class="total-row">

              <span>
                الخصم
              </span>

              <strong>
                ${formatMoney(totalDiscount)}
                ريال
              </strong>

            </div>

            ${taxRow}

            <div class="total-row grand-total">

              <span>
                الإجمالي النهائي
              </span>

              <strong>
                ${formatMoney(grandTotal)}
                ريال
              </strong>

            </div>

          </div>

          ${
            notes
              ? `
                <div class="notes">

                  <div class="notes-title">
                    ملاحظات
                  </div>

                  <div class="notes-text">
                    ${notes}
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
    <main className="min-h-screen bg-gray-50 p-3 sm:p-4" dir="rtl">
      {/* =====================================================
          رأس الصفحة
      ===================================================== */}

      <PurchaseHeader
        invoiceNumber={invoiceNumber}
        date={date}
        isSaved={isSaved}
        showSuccess={showSuccess}
        savedInvoiceNumber={savedInvoiceNumber}
        onDateChange={(value) => {
          setDate(value);
          setIsSaved(false);
        }}
        onSave={handleSave}
        onPrint={handlePrint}
      />

      {/* =====================================================
          جسم الفاتورة
      ===================================================== */}

      <div className="mx-auto max-w-7xl overflow-hidden rounded-xl border bg-white shadow-sm">
        {/* ===================================================
            بيانات الشركة
        =================================================== */}

        <div className="border-b p-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">شركة الجابري</h1>

            <p className="mt-1 text-sm text-gray-600">
              للعسل والزيوت الطبيعة وخدمات العمرة
            </p>

            <p className="mt-1 text-xs text-gray-500">
              البيضاء - اليمن
              <span className="mx-2">|</span>
              هاتف: 734 434 443
            </p>
          </div>
        </div>

        {/* ===================================================
            المورد وطريقة الدفع
        =================================================== */}

        <PurchaseSupplier
          suppliers={suppliers}
          supplierId={supplierId}
          paymentMethod={paymentMethod}
          selectedSupplier={selectedSupplier}
          onSupplierChange={(value) => {
            setSupplierId(value);
            setIsSaved(false);
          }}
          onPaymentMethodChange={(value) => {
            setPaymentMethod(value);
            setIsSaved(false);
          }}
        />

        {/* ===================================================
            الضريبة
        =================================================== */}

        <PurchaseTax
          taxMode={taxMode}
          taxRate={taxRate}
          tax={tax}
          onTaxModeChange={handleTaxModeChange}
          onTaxRateChange={(value) => handleTaxRateChange(Number(value))}
          formatMoney={formatMoney}
        />

        {/* ===================================================
            الأصناف
        =================================================== */}

        <PurchaseItems
          items={items}
          products={products}
          getItemTotal={getItemTotal}
          getProduct={getProduct}
          formatMoney={formatMoney}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onUpdateItem={updateItem}
        />

        {/* ===================================================
            الإجماليات
        =================================================== */}

        <PurchaseTotals
          subtotal={subtotal}
          totalDiscount={totalDiscount}
          tax={tax}
          grandTotal={grandTotal}
          taxMode={taxMode}
          taxRate={taxRate}
          formatMoney={formatMoney}
        />

        {/* ===================================================
            الملاحظات
        =================================================== */}
      </div>
    </main>
  );
}
