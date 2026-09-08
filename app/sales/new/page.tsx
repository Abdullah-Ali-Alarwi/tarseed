"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiPlus,
  FiTrash2,
  FiFileText,
  FiUser,
  FiCalendar,
  FiCreditCard,
  FiCheckCircle,
  FiPrinter,
  FiBookOpen,
} from "react-icons/fi";
import { useERPStore } from "@/Store/erpStore";

type PaymentMethod = "cash" | "bank" | "credit";

type SaleFormItem = {
  id: number;
  productId: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
};

export default function NewSalesPage() {
  // ======================================================
  // Zustand
  // ======================================================

  const products = useERPStore((state) => state.products);
  const customers = useERPStore((state) => state.customers);
  const sales = useERPStore((state) => state.sales);
  const accounts = useERPStore((state) => state.accounts);
  const addSale = useERPStore((state) => state.addSale);

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

  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [customerId, setCustomerId] = useState("");

  const [accountCode, setAccountCode] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit");

  const [notes, setNotes] = useState("");

  // ======================================================
  // الأصناف
  // ======================================================

  const [items, setItems] = useState<SaleFormItem[]>([
    {
      id: Date.now(),
      productId: "",
      quantity: 1,
      price: 0,
      discount: 0,
      tax: 0,
    },
  ]);

  // ======================================================
  // حالة الحفظ
  // ======================================================

  const [isSaved, setIsSaved] = useState(false);

  // ======================================================
  // رقم الفاتورة
  // ======================================================

  const invoiceNumber = useMemo(() => {
    const numbers = sales
      .map((sale) => {
        const match = String(sale.invoiceNumber).match(/(\d+)$/);

        return match ? Number(match[1]) : 0;
      })
      .filter((number) => number > 0);

    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1001;

    return `INV-${nextNumber}`;
  }, [sales]);

  // ======================================================
  // العميل المختار
  // ======================================================

  const selectedCustomer = useMemo(() => {
    return customers.find((customer) => customer.id === customerId);
  }, [customers, customerId]);

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
  // اسم العميل
  // ======================================================

  const getCustomerName = () => {
    return selectedCustomer?.name || "-";
  };

  // ======================================================
  // اسم طريقة الدفع
  // ======================================================

  const getPaymentMethodName = (method: PaymentMethod = paymentMethod) => {
    if (method === "cash") {
      return "نقدي";
    }

    if (method === "bank") {
      return "تحويل بنكي";
    }

    return "آجل";
  };

  // ======================================================
  // إجمالي الصنف بعد الخصم
  // ======================================================

  const getItemTotal = (item: SaleFormItem) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const discount = Number(item.discount) || 0;

    const itemSubtotal = quantity * price;

    return Math.max(itemSubtotal - discount, 0);
  };

  // ======================================================
  // المجموع بعد الخصم وقبل الضريبة
  // ======================================================

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => total + getItemTotal(item), 0);
  }, [items]);

  // ======================================================
  // إجمالي الخصم
  // ======================================================

  const totalDiscount = useMemo(() => {
    return items.reduce((total, item) => total + Number(item.discount || 0), 0);
  }, [items]);

  // ======================================================
  // إجمالي الضريبة
  // ======================================================

  const totalTax = useMemo(() => {
    return items.reduce((total, item) => {
      const itemTotal = getItemTotal(item);

      const taxRate = Number(item.tax || 0);

      return total + (itemTotal * taxRate) / 100;
    }, 0);
  }, [items]);

  // ======================================================
  // الإجمالي قبل الخصم
  // ======================================================

  const grossTotal = useMemo(() => {
    return items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;

      return total + quantity * price;
    }, 0);
  }, [items]);

  // ======================================================
  // الإجمالي النهائي
  // ======================================================

  const grandTotal = subtotal + totalTax;

  // ======================================================
  // تنسيق المبالغ
  // ======================================================

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 2,
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
  // إضافة صنف
  // ======================================================

  const addItem = () => {
    setItems((currentItems) => [
      ...currentItems,
      {
        id: Date.now() + Math.floor(Math.random() * 10000),
        productId: "",
        quantity: 1,
        price: 0,
        discount: 0,
        tax: 0,
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

    setItems((currentItems) => currentItems.filter((item) => item.id !== id));

    setIsSaved(false);
  };

  // ======================================================
  // تعديل صنف
  // ======================================================

  const updateItem = (id: number, field: keyof SaleFormItem, value: string) => {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (field === "productId") {
          return {
            ...item,
            productId: value,
            price: item.price,
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
    if (!customerId) {
      alert("يرجى اختيار العميل.");
      return false;
    }

    if (!accountCode) {
      alert("يرجى اختيار الحساب المحاسبي للفواتير.");
      return false;
    }

    const account = accounts.find((item) => item.code === accountCode);

    if (!account) {
      alert("الحساب المحاسبي المحدد غير موجود.");
      return false;
    }

    if (account.level === 0) {
      alert(
        "لا يمكن استخدام حساب رئيسي في فاتورة المبيعات. يجب اختيار حساب فرعي.",
      );
      return false;
    }

    const validItems = items.filter(
      (item) => item.productId && item.quantity > 0 && item.price > 0,
    );

    if (validItems.length === 0) {
      alert("يرجى إضافة صنف واحد على الأقل مع الكمية والسعر.");
      return false;
    }

    return true;
  };

  // ======================================================
  // حفظ الفاتورة
  // ======================================================

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateInvoice()) {
      return;
    }

    const customer = customers.find((item) => item.id === customerId);

    if (!customer) {
      alert("العميل غير موجود.");
      return;
    }

    const account = accounts.find((item) => item.code === accountCode);

    if (!account) {
      alert("الحساب المحاسبي غير موجود.");
      return;
    }

    if (account.level === 0) {
      alert("يجب استخدام حساب فرعي فقط.");
      return;
    }

    const validItems = items.filter(
      (item) => item.productId && item.quantity > 0 && item.price > 0,
    );

    const saleItems = validItems.map((item) => {
      const product = getProduct(item.productId);

      return {
        productId: item.productId,
        productName: product?.name || "صنف",
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        tax: item.tax,
        total: getItemTotal(item),
      };
    });

    addSale({
      invoiceNumber,
      date: invoiceDate,
      customerId: customer.id,
      customerName: customer.name,
      accountCode: account.code,
      accountName: account.name,
      paymentMethod,
      items: saleItems,
      subtotal,
      discount: totalDiscount,
      tax: totalTax,
      total: grandTotal,
      notes: notes.trim(),
    });

    setIsSaved(true);

    alert(
      `تم حفظ فاتورة المبيعات بنجاح\nالحساب: ${account.code} - ${account.name}`,
    );
  };

  // ======================================================
  // الطباعة
  // ======================================================

  const handlePrint = () => {
    if (!isSaved) {
      alert("يجب حفظ الفاتورة أولاً قبل طباعتها.");
      return;
    }

    window.print();
  };

  return (
    <>
      <main
        dir="rtl"
        className="min-h-screen bg-gray-100 p-4 md:p-6 print:hidden"
      >
        {/* ==================================================
            Header
        ================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <Link href="/" className="hover:text-green-600 transition">
                الرئيسية
              </Link>

              <FiArrowRight size={14} />

              <Link href="/sales" className="hover:text-green-600 transition">
                المبيعات
              </Link>

              <FiArrowRight size={14} />

              <span className="text-gray-800 font-medium">فاتورة جديدة</span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                فاتورة مبيعات جديدة
              </h1>

              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  isSaved
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-yellow-50 border border-yellow-200 text-yellow-700"
                }`}
              >
                {isSaved ? "محفوظة" : "غير محفوظة"}
              </span>
            </div>

            <p className="text-sm text-gray-500 mt-2">
              إنشاء فاتورة مبيعات جديدة وإضافة الأصناف وربطها بالحساب المحاسبي
            </p>
          </div>

          <Link
            href="/sales"
            className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-lg text-sm font-semibold transition"
          >
            <FiArrowRight size={18} />
            العودة للمبيعات
          </Link>
        </div>

        {/* ==================================================
            Form
        ================================================== */}

        <form onSubmit={handleSubmit}>
          {/* ==================================================
              بيانات الفاتورة
          ================================================== */}

          <section className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
            <div className="p-5 md:p-6 border-b-2 border-gray-200">
              <div className="flex items-center gap-2">
                <FiFileText size={20} className="text-green-600" />

                <div>
                  <h2 className="font-bold text-gray-900">بيانات الفاتورة</h2>

                  <p className="text-sm text-gray-500 mt-1">
                    المعلومات الأساسية لفاتورة المبيعات
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                {/* رقم الفاتورة */}

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    رقم الفاتورة
                  </label>

                  <div className="relative">
                    <FiFileText
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <input
                      type="text"
                      value={invoiceNumber}
                      readOnly
                      className="w-full h-12 bg-gray-100 border-2 border-gray-300 rounded-lg pr-10 pl-4 text-sm text-gray-700 font-bold outline-none"
                    />
                  </div>
                </div>

                {/* التاريخ */}

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    تاريخ الفاتورة
                  </label>

                  <div className="relative">
                    <FiCalendar
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(event) => {
                        setInvoiceDate(event.target.value);
                        setIsSaved(false);
                      }}
                      required
                      className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg pr-10 pl-4 text-sm text-gray-900 font-medium outline-none hover:border-gray-400 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 transition"
                    />
                  </div>
                </div>

                {/* العميل */}

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    العميل
                  </label>

                  <div className="relative">
                    <FiUser
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <select
                      value={customerId}
                      onChange={(event) => {
                        setCustomerId(event.target.value);
                        setIsSaved(false);
                      }}
                      required
                      className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg pr-10 pl-3 text-sm text-gray-900 font-medium outline-none hover:border-gray-400 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 transition"
                    >
                      <option value="">اختر العميل</option>

                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {customers.length === 0 && (
                    <p className="text-[10px] text-red-500 mt-1">
                      لا يوجد عملاء. أضف عميلًا أولًا.
                    </p>
                  )}
                </div>

                {/* الحساب المحاسبي */}

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    الحساب المحاسبي
                  </label>

                  <div className="relative">
                    <FiBookOpen
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <select
                      value={accountCode}
                      onChange={(event) => {
                        setAccountCode(event.target.value);
                        setIsSaved(false);
                      }}
                      required
                      className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg pr-10 pl-3 text-sm text-gray-900 font-medium outline-none hover:border-gray-400 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 transition"
                    >
                      <option value="">اختر الحساب الفرعي</option>

                      {subAccounts.map((account) => (
                        <option key={account.id} value={account.code}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {subAccounts.length === 0 ? (
                    <p className="text-[10px] text-red-500 mt-1 leading-5">
                      لا توجد حسابات فرعية. أضف حسابًا رئيسيًا ثم حسابًا فرعيًا
                      من دليل الحسابات.
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-1">
                      تظهر الحسابات الفرعية فقط.
                    </p>
                  )}
                </div>

                {/* طريقة الدفع */}

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    طريقة الدفع
                  </label>

                  <div className="relative">
                    <FiCreditCard
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <select
                      value={paymentMethod}
                      onChange={(event) => {
                        setPaymentMethod(event.target.value as PaymentMethod);
                        setIsSaved(false);
                      }}
                      className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg pr-10 pl-3 text-sm text-gray-900 font-medium outline-none hover:border-gray-400 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 transition"
                    >
                      <option value="cash">نقدي</option>
                      <option value="bank">تحويل بنكي</option>
                      <option value="credit">آجل</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* الحساب المختار */}

              {selectedAccount && (
                <div className="mt-5 p-4 rounded-xl bg-green-50 border-2 border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white text-green-600 flex items-center justify-center border border-green-200">
                      <FiBookOpen size={18} />
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        الحساب المحاسبي المختار
                      </p>

                      <p className="text-sm font-bold text-green-700 mt-1">
                        {selectedAccount.code} - {selectedAccount.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ==================================================
              الأصناف
          ================================================== */}

          <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 md:p-6 border-b-2 border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  أصناف الفاتورة
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  أضف المنتجات والكميات والأسعار
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg text-sm font-semibold transition"
              >
                <FiPlus size={18} />
                إضافة صنف
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-4 py-4 text-right text-sm font-bold text-gray-800">
                      #
                    </th>

                    <th className="px-4 py-4 text-right text-sm font-bold text-gray-800">
                      المنتج
                    </th>

                    <th className="px-4 py-4 text-right text-sm font-bold text-gray-800">
                      الكمية
                    </th>

                    <th className="px-4 py-4 text-right text-sm font-bold text-gray-800">
                      السعر
                    </th>

                    <th className="px-4 py-4 text-right text-sm font-bold text-gray-800">
                      الخصم
                    </th>

                    <th className="px-4 py-4 text-right text-sm font-bold text-gray-800">
                      الضريبة %
                    </th>

                    <th className="px-4 py-4 text-right text-sm font-bold text-gray-800">
                      الإجمالي
                    </th>

                    <th className="px-4 py-4 text-center text-sm font-bold text-gray-800">
                      حذف
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4">
                        <span className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={item.productId}
                          onChange={(event) =>
                            updateItem(item.id, "productId", event.target.value)
                          }
                          required
                          className="w-full h-11 bg-gray-50 border-2 border-gray-300 rounded-lg px-3 text-sm text-gray-900 font-medium outline-none hover:border-gray-400 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 transition"
                        >
                          <option value="">اختر المنتج</option>

                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.code} - {product.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(item.id, "quantity", event.target.value)
                          }
                          className="w-full h-11 bg-white border-2 border-gray-400 rounded-lg px-3 text-sm text-gray-900 font-bold outline-none hover:border-gray-500 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(event) =>
                            updateItem(item.id, "price", event.target.value)
                          }
                          className="w-full h-11 bg-white border-2 border-gray-400 rounded-lg px-3 text-sm text-gray-900 font-bold outline-none hover:border-gray-500 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discount}
                          onChange={(event) =>
                            updateItem(item.id, "discount", event.target.value)
                          }
                          className="w-full h-11 bg-gray-50 border-2 border-gray-300 rounded-lg px-3 text-sm text-gray-900 outline-none hover:border-gray-400 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 transition"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.tax}
                          onChange={(event) =>
                            updateItem(item.id, "tax", event.target.value)
                          }
                          className="w-full h-11 bg-gray-50 border-2 border-gray-300 rounded-lg px-3 text-sm text-gray-900 outline-none hover:border-gray-400 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 transition"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <div className="bg-gray-100 border-2 border-gray-300 rounded-lg px-3 py-2.5 font-bold text-gray-900">
                          {formatMoney(getItemTotal(item))}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title="حذف الصنف"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ==================================================
              الملاحظات والملخص
          ================================================== */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-5 md:p-6">
              <h2 className="font-bold text-gray-900 mb-4">ملاحظات</h2>

              <textarea
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  setIsSaved(false);
                }}
                rows={7}
                placeholder="أضف أي ملاحظات خاصة بالفاتورة..."
                className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none resize-none hover:border-gray-400 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 transition"
              />
            </section>

            <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 md:p-6">
              <h2 className="font-bold text-gray-900 mb-5">ملخص الفاتورة</h2>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">المجموع</span>

                <span className="font-semibold text-gray-900">
                  {formatMoney(grossTotal)} ريال
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">الخصم</span>

                <span className="font-semibold text-red-600">
                  - {formatMoney(totalDiscount)} ريال
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">بعد الخصم</span>

                <span className="font-semibold text-gray-900">
                  {formatMoney(subtotal)} ريال
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">الضريبة</span>

                <span className="font-semibold text-gray-900">
                  {formatMoney(totalTax)} ريال
                </span>
              </div>

              <div className="mt-5 p-4 rounded-xl bg-green-50 border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    الإجمالي النهائي
                  </span>

                  <span className="text-xl font-bold text-green-700">
                    {formatMoney(grandTotal)}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-1 text-left">ريال</p>
              </div>
            </section>
          </div>

          {/* ==================================================
              Buttons
          ================================================== */}

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
            <Link
              href="/sales"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold text-sm transition"
            >
              إلغاء
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition"
            >
              <FiCheckCircle size={18} />

              {isSaved ? "تم حفظ الفاتورة" : "حفظ الفاتورة"}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={!isSaved}
              className={`inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg font-semibold text-sm transition ${
                isSaved
                  ? "bg-gray-800 hover:bg-gray-900 text-white cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <FiPrinter size={18} />

              {isSaved ? "طباعة الفاتورة" : "الطباعة بعد الحفظ"}
            </button>
          </div>
        </form>
      </main>

      {/* ======================================================
          الفاتورة الرسمية للطباعة
      ====================================================== */}

      <div dir="rtl" className="official-invoice hidden print:block">
        <div className="official-letterhead">
          <div className="company-logo">الجابري</div>

          <div className="company-details">
            <h1>شركة الجابري</h1>

            <p>للعسل والزيوت الطبيعة وخدمات العمرة</p>

            <div className="company-contact">
              <span>
                هاتف: <bdi dir="ltr">734 434 443</bdi>
              </span>

              <span>العنوان: البيضاء - اليمن</span>
            </div>
          </div>

          <div className="company-meta">
            <p>فاتورة مبيعات</p>

            <strong>{invoiceNumber}</strong>

            <p>التاريخ</p>

            <strong>{formatDateForPrint(invoiceDate)}</strong>
          </div>
        </div>

        <div className="official-invoice-title">
          <div className="title-line"></div>

          <div className="title-box">
            <h2>فاتورة مبيعات</h2>

            <span>SALES INVOICE</span>
          </div>

          <div className="title-line"></div>
        </div>

        <table className="invoice-info-table">
          <tbody>
            <tr>
              <td className="label">رقم الفاتورة</td>

              <td className="value">{invoiceNumber}</td>

              <td className="label">تاريخ الفاتورة</td>

              <td className="value">{formatDateForPrint(invoiceDate)}</td>
            </tr>

            <tr>
              <td className="label">اسم العميل</td>

              <td className="value">{getCustomerName()}</td>

              <td className="label">طريقة الدفع</td>

              <td className="value">{getPaymentMethodName()}</td>
            </tr>

            <tr>
              <td className="label">الحساب المحاسبي</td>

              <td className="value" colSpan={3}>
                {selectedAccount
                  ? `${selectedAccount.code} - ${selectedAccount.name}`
                  : "غير محدد"}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="official-items-table">
          <thead>
            <tr>
              <th className="number">#</th>

              <th>البيان / الصنف</th>

              <th>الوحدة</th>

              <th>الكمية</th>

              <th>سعر الوحدة</th>

              <th>الخصم</th>

              <th>الضريبة</th>

              <th>الإجمالي</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => {
              const product = getProduct(item.productId);

              const itemTotal = getItemTotal(item);

              const taxAmount = (itemTotal * Number(item.tax || 0)) / 100;

              return (
                <tr key={item.id}>
                  <td className="number">{index + 1}</td>

                  <td className="item-name">{product?.name || "-"}</td>

                  <td>{product?.unit || "-"}</td>

                  <td>{item.quantity}</td>

                  <td>{formatMoney(item.price)}</td>

                  <td>{formatMoney(item.discount)}</td>

                  <td>{formatMoney(taxAmount)}</td>

                  <td className="item-total">{formatMoney(itemTotal)}</td>
                </tr>
              );
            })}

            {items.length < 6 &&
              Array.from({
                length: 6 - items.length,
              }).map((_, index) => (
                <tr key={`empty-${index}`} className="empty-row">
                  <td>{items.length + index + 1}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="official-bottom">
          <div className="official-notes">
            <div className="section-heading">ملاحظات</div>

            <div className="notes-content">{notes || "لا توجد ملاحظات"}</div>

            <div className="amount-words">
              <strong>المبلغ:</strong>

              <span>{formatMoney(grandTotal)} ريال</span>
            </div>
          </div>

          <div className="official-totals">
            <div>
              <span>الإجمالي قبل الخصم</span>

              <strong>{formatMoney(grossTotal)}</strong>
            </div>

            <div>
              <span>الخصم</span>

              <strong>{formatMoney(totalDiscount)}</strong>
            </div>

            <div>
              <span>الإجمالي بعد الخصم</span>

              <strong>{formatMoney(subtotal)}</strong>
            </div>

            <div>
              <span>الضريبة</span>

              <strong>{formatMoney(totalTax)}</strong>
            </div>

            <div className="final-total">
              <span>الإجمالي النهائي</span>

              <strong>{formatMoney(grandTotal)} ريال</strong>
            </div>
          </div>
        </div>

        <div className="official-signatures">
          <div className="signature">
            <strong>توقيع المستلم</strong>

            <div className="signature-space"></div>

            <span>الاسم:</span>
          </div>

          <div className="stamp">ختم المنشأة</div>

          <div className="signature">
            <strong>توقيع المسؤول</strong>

            <div className="signature-space"></div>

            <span>الاسم:</span>
          </div>
        </div>

        <div className="official-footer">
          <span>شركة الجابري للعسل والزيوت الطبيعة وخدمات العمرة</span>

          <span>شكرًا لتعاملكم معنا</span>

          <span>ERP System</span>
        </div>
      </div>

      {/* ======================================================
          Print CSS
      ====================================================== */}

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .official-invoice {
            width: 100%;
            min-height: 100vh;
            background: white;
            color: #111827;
            font-family: Arial, Tahoma, sans-serif;
            font-size: 12px;
          }

          .official-letterhead {
            display: grid;
            grid-template-columns: 90px 1fr 170px;
            gap: 15px;
            align-items: center;
            padding-bottom: 15px;
            border-bottom: 2px solid #166534;
          }

          .company-logo {
            width: 75px;
            height: 75px;
            border: 2px solid #166534;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 800;
            color: #166534;
          }

          .company-details h1 {
            margin: 0;
            font-size: 22px;
            color: #166534;
            font-weight: 800;
          }

          .company-details p {
            margin: 5px 0;
            color: #4b5563;
            font-size: 13px;
          }

          .company-contact {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            color: #6b7280;
            font-size: 11px;
          }

          .company-meta {
            text-align: left;
          }

          .company-meta p {
            margin: 2px 0;
            color: #6b7280;
          }

          .company-meta strong {
            display: block;
            margin-bottom: 7px;
            color: #111827;
          }

          .official-invoice-title {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 18px 0;
          }

          .title-line {
            flex: 1;
            height: 1px;
            background: #d1d5db;
          }

          .title-box {
            min-width: 190px;
            text-align: center;
            border: 1px solid #166534;
            padding: 7px 20px;
            border-radius: 5px;
          }

          .title-box h2 {
            margin: 0;
            font-size: 18px;
            color: #166534;
          }

          .title-box span {
            display: block;
            margin-top: 2px;
            color: #6b7280;
            font-size: 9px;
            letter-spacing: 1px;
          }

          .invoice-info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }

          .invoice-info-table td {
            border: 1px solid #d1d5db;
            padding: 8px 10px;
          }

          .invoice-info-table .label {
            background: #f0fdf4;
            color: #166534;
            font-weight: 700;
            width: 15%;
          }

          .invoice-info-table .value {
            width: 35%;
            font-weight: 700;
          }

          .official-items-table {
            width: 100%;
            border-collapse: collapse;
          }

          .official-items-table th {
            background: #166534;
            color: white;
            border: 1px solid #166534;
            padding: 8px 5px;
            font-size: 10px;
          }

          .official-items-table td {
            border: 1px solid #d1d5db;
            padding: 7px 5px;
            text-align: center;
            height: 28px;
            font-size: 10px;
          }

          .official-items-table .item-name {
            text-align: right;
            font-weight: 600;
          }

          .official-items-table .number {
            width: 35px;
          }

          .official-items-table .item-total {
            font-weight: 800;
          }

          .official-items-table .empty-row td {
            height: 30px;
          }

          .official-bottom {
            display: grid;
            grid-template-columns: 1fr 310px;
            gap: 25px;
            margin-top: 18px;
          }

          .section-heading {
            font-weight: 800;
            color: #166534;
            margin-bottom: 7px;
          }

          .notes-content {
            min-height: 55px;
            border: 1px solid #d1d5db;
            padding: 8px;
            line-height: 1.7;
          }

          .amount-words {
            display: flex;
            gap: 7px;
            margin-top: 10px;
            padding: 8px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
          }

          .official-totals {
            border: 1px solid #d1d5db;
          }

          .official-totals > div {
            display: flex;
            justify-content: space-between;
            padding: 8px 10px;
            border-bottom: 1px solid #e5e7eb;
          }

          .official-totals > div:last-child {
            border-bottom: none;
          }

          .official-totals .final-total {
            background: #f0fdf4;
            color: #166534;
            font-size: 14px;
            font-weight: 800;
          }

          .official-signatures {
            display: grid;
            grid-template-columns: 1fr 130px 1fr;
            align-items: end;
            gap: 30px;
            margin-top: 35px;
          }

          .signature {
            text-align: center;
          }

          .signature strong {
            display: block;
            color: #374151;
          }

          .signature-space {
            height: 45px;
            border-bottom: 1px solid #9ca3af;
            margin-bottom: 5px;
          }

          .signature span {
            font-size: 10px;
            color: #6b7280;
          }

          .stamp {
            width: 110px;
            height: 80px;
            border: 2px dashed #9ca3af;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            font-size: 11px;
            text-align: center;
          }

          .official-footer {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            margin-top: 20px;
            padding-top: 8px;
            border-top: 1px solid #d1d5db;
            color: #6b7280;
            font-size: 9px;
          }
        }
      `}</style>
    </>
  );
}
