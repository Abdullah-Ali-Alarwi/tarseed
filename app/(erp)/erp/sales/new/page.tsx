"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  FiArrowRight,
  FiPlus,
  FiTrash2,
  FiSave,
  FiRefreshCw,
  FiShoppingBag,
  FiPackage,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiFileText,
  FiAlertCircle,
  FiSearch,
  FiCreditCard,
  FiCheckCircle,
} from "react-icons/fi";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
});

// الحسابات الافتراضية
const DEFAULT_CASH_ACCOUNT_CODE = "1101";
const DEFAULT_CUSTOMER_ACCOUNT_CODE = "1201";
const DEFAULT_BANK_ACCOUNT_CODE = "1102";
const DEFAULT_INVENTORY_ACCOUNT_CODE = "1104";
const DEFAULT_COGS_ACCOUNT_CODE = "5101";

type PaymentMethod = "cash" | "credit" | "bank";

type Actor = {
  id: string;
  name: string;
  username: string;
  role: string;
  companyId: string;
};

type Customer = {
  id: string;
  companyId: string;
  name: string;
  phone?: string;
  balance?: number;
  accountCode?: string;
  accountId?: string;
  isActive?: boolean;
  status?: string;
};

type Product = {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  category?: string;
  type?: string;
  unit?: string;
  salePrice?: number;
  sellingPrice?: number;
  price?: number;
  isActive?: boolean;
  status?: string;
};

type Warehouse = {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  isActive?: boolean;
};

type Account = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type?: string;
  accountType?: string;
  allowPosting?: boolean;
  isActive?: boolean;
  isGroup?: boolean;
};

type WarehouseStock = {
  id: string;
  companyId: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  averageCost?: number;
  unitCost?: number;
  costPrice?: number;
};

type SaleItem = {
  productId: string;
  productName: string;
  productCode?: string;
  quantity: number;
  price: number;
  cost: number;
  stockId: string;
  availableQuantity: number;
  total: number;
  costTotal: number;
};

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getProductPrice = (product: Product) =>
  Number(product.salePrice ?? product.sellingPrice ?? product.price ?? 0);

const getProductCost = (stock: WarehouseStock) => {
  const cost = Number(
    stock.averageCost ?? stock.unitCost ?? stock.costPrice ?? 0,
  );

  return cost > 0 ? cost : 0;
};

const getSalesAccountCode = (product: Product) => {
  const category = String(product.category || product.type || "").toLowerCase();

  if (category.includes("oil") || category.includes("زيت")) {
    return "4102";
  }

  if (category.includes("umrah") || category.includes("عمرة")) {
    return "4103";
  }

  return "4101";
};

const getUsername = () => {
  if (typeof document === "undefined") return "";

  return (
    document.cookie
      .split("; ")
      .find((item) => item.startsWith("username="))
      ?.split("=")
      .slice(1)
      .join("=") || ""
  );
};

export default function NewSalePage() {
  const router = useRouter();

  const [actor, setActor] = useState<Actor | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [sales, setSales] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today());

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  // الحساب البنكي المختار عند البيع بالحوالة
  const [bankAccountId, setBankAccountId] = useState("");

  const [searchProduct, setSearchProduct] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [items, setItems] = useState<SaleItem[]>([]);
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const cookieUsername = getUsername();

      if (!cookieUsername) {
        router.replace("/login");
        return;
      }

      const username = decodeURIComponent(cookieUsername);

      const userResponse = await api.get("/users", {
        params: { username },
      });

      const user = userResponse.data?.[0];

      if (!user || user.type === "platform" || !user.companyId) {
        router.replace("/login");
        return;
      }

      const currentActor: Actor = {
        id: String(user.id),
        name: user.name || user.fullName || user.username,
        username: user.username,
        role: user.role || user.jobTitle || user.type || "employee",
        companyId: String(user.companyId),
      };

      setActor(currentActor);

      const companyId = currentActor.companyId;

      const [
        customersRes,
        productsRes,
        warehousesRes,
        accountsRes,
        stocksRes,
        salesRes,
      ] = await Promise.all([
        api.get("/customers", { params: { companyId } }),
        api.get("/products", { params: { companyId } }),
        api.get("/warehouses", { params: { companyId } }),
        api.get("/accounts", { params: { companyId } }),
        api.get("/warehouseStocks", { params: { companyId } }),
        api.get("/sales", { params: { companyId } }),
      ]);

      setCustomers(
        customersRes.data.filter(
          (item: Customer) =>
            String(item.companyId) === companyId &&
            item.isActive !== false &&
            item.status !== "inactive",
        ),
      );

      setProducts(
        productsRes.data.filter(
          (item: Product) =>
            String(item.companyId) === companyId &&
            item.isActive !== false &&
            item.status !== "inactive",
        ),
      );

      setWarehouses(
        warehousesRes.data.filter(
          (item: Warehouse) =>
            String(item.companyId) === companyId && item.isActive !== false,
        ),
      );

      const companyAccounts: Account[] = accountsRes.data.filter(
        (item: Account) =>
          String(item.companyId) === companyId && item.isActive !== false,
      );

      setAccounts(companyAccounts);

      setStocks(
        stocksRes.data.filter(
          (item: WarehouseStock) => String(item.companyId) === companyId,
        ),
      );

      setSales(
        salesRes.data.filter(
          (item: any) => String(item.companyId) === companyId,
        ),
      );

      // اختيار الحساب البنكي الافتراضي عند وجوده
      const bankAccount = companyAccounts.find(
        (account) =>
          account.code === DEFAULT_BANK_ACCOUNT_CODE &&
          account.allowPosting !== false &&
          account.isGroup !== true,
      );

      setBankAccountId(bankAccount?.id || "");
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل بيانات المبيعات");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedCustomer = customers.find(
    (customer) => customer.id === customerId,
  );

  const selectedWarehouse = warehouses.find(
    (warehouse) => warehouse.id === warehouseId,
  );

  const selectedProduct = products.find(
    (product) => product.id === selectedProductId,
  );

  const filteredProducts = useMemo(() => {
    const search = searchProduct.trim().toLowerCase();

    if (!search) return products;

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(search) ||
        product.code?.toLowerCase().includes(search),
    );
  }, [products, searchProduct]);

  const getStock = (productId: string, currentWarehouseId: string) =>
    stocks.find(
      (stock) =>
        String(stock.productId) === String(productId) &&
        String(stock.warehouseId) === String(currentWarehouseId),
    );

  const selectedProductStock =
    selectedProduct && warehouseId
      ? getStock(selectedProduct.id, warehouseId)
      : undefined;

  const selectedProductAvailable = Number(selectedProductStock?.quantity || 0);

  const selectedProductCost = selectedProductStock
    ? getProductCost(selectedProductStock)
    : 0;

  const selectedProductPrice = selectedProduct
    ? getProductPrice(selectedProduct)
    : 0;

  const addItem = () => {
    if (!selectedProduct || !warehouseId) {
      toast.error("اختر المستودع والمنتج أولاً");
      return;
    }

    if (quantity <= 0) {
      toast.error("أدخل كمية صحيحة");
      return;
    }

    const stock = getStock(selectedProduct.id, warehouseId);

    if (!stock) {
      toast.error("هذا المنتج غير موجود في المستودع المحدد");
      return;
    }

    const available = Number(stock.quantity || 0);

    const existingItem = items.find(
      (item) => item.productId === selectedProduct.id,
    );

    const alreadyAdded = existingItem?.quantity || 0;

    if (quantity + alreadyAdded > available) {
      toast.error(`الكمية المتاحة هي ${available}`);
      return;
    }

    const cost = getProductCost(stock);

    if (cost <= 0) {
      toast.error("لا توجد تكلفة مخزون موثوقة لهذا المنتج.");
      return;
    }

    const price = getProductPrice(selectedProduct);

    if (price <= 0) {
      toast.error("لم يتم تحديد سعر بيع صحيح لهذا المنتج");
      return;
    }

    if (existingItem) {
      setItems((current) =>
        current.map((item) =>
          item.productId === selectedProduct.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                total: (item.quantity + quantity) * item.price,
                costTotal: (item.quantity + quantity) * item.cost,
              }
            : item,
        ),
      );
    } else {
      setItems((current) => [
        ...current,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productCode: selectedProduct.code,
          quantity,
          price,
          cost,
          stockId: stock.id,
          availableQuantity: available,
          total: quantity * price,
          costTotal: quantity * cost,
        },
      ]);
    }

    setSelectedProductId("");
    setSearchProduct("");
    setQuantity(1);

    toast.success("تمت إضافة المنتج");
  };

  const updateQuantity = (productId: string, value: number) => {
    if (value <= 0) return;

    setItems((current) =>
      current.map((item) => {
        if (item.productId !== productId) return item;

        if (value > item.availableQuantity) {
          toast.error(
            `الكمية المتاحة من ${item.productName} هي ${item.availableQuantity}`,
          );
          return item;
        }

        return {
          ...item,
          quantity: value,
          total: value * item.price,
          costTotal: value * item.cost,
        };
      }),
    );
  };

  const removeItem = (productId: string) => {
    setItems((current) =>
      current.filter((item) => item.productId !== productId),
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  const totalCost = items.reduce((sum, item) => sum + item.costTotal, 0);

  const profit = subtotal - totalCost;

  // البحث عن حساب باستخدام رقمه
  const findAccountByCode = (code: string) =>
    accounts.find(
      (account) =>
        String(account.code) === String(code) &&
        account.allowPosting !== false &&
        account.isGroup !== true,
    );

  // البحث عن حساب باستخدام المعرف
  const findAccountById = (id: string) =>
    accounts.find(
      (account) =>
        String(account.id) === String(id) &&
        account.allowPosting !== false &&
        account.isGroup !== true,
    );

  const getAccountByCode = (code: string) => {
    const account = findAccountByCode(code);

    if (!account) {
      throw new Error(
        `الحساب ${code} غير موجود أو غير قابل للترحيل في دليل الحسابات`,
      );
    }

    return account;
  };

  const getCustomerAccount = () => {
    if (!selectedCustomer) {
      throw new Error("يجب اختيار العميل للبيع الآجل");
    }

    // إذا كان العميل مرتبطاً بحساب محدد نستخدمه
    if (selectedCustomer.accountId) {
      const account = findAccountById(selectedCustomer.accountId);

      if (account) return account;
    }

    if (selectedCustomer.accountCode) {
      const account = getAccountByCode(selectedCustomer.accountCode);

      return account;
    }

    return getAccountByCode(DEFAULT_CUSTOMER_ACCOUNT_CODE);
  };

  const getPaymentAccount = () => {
    if (paymentMethod === "cash") {
      return getAccountByCode(DEFAULT_CASH_ACCOUNT_CODE);
    }

    if (paymentMethod === "credit") {
      return getCustomerAccount();
    }

    if (paymentMethod === "bank") {
      if (!bankAccountId) {
        throw new Error("اختر الحساب البنكي أولاً");
      }

      const account = findAccountById(bankAccountId);

      if (!account) {
        throw new Error("الحساب البنكي المختار غير موجود أو غير قابل للترحيل");
      }

      return account;
    }

    throw new Error("طريقة الدفع غير صحيحة");
  };

  const generateInvoiceNumber = () => {
    let counter = sales.length + 1;

    let invoiceNumber = `SAL-${String(counter).padStart(5, "0")}`;

    while (sales.some((sale) => sale.invoiceNumber === invoiceNumber)) {
      counter++;
      invoiceNumber = `SAL-${String(counter).padStart(5, "0")}`;
    }

    return invoiceNumber;
  };

  const validateBeforeSave = () => {
    if (!actor) {
      toast.error("تعذر تحديد المستخدم الحالي");
      return false;
    }

    if (paymentMethod === "credit" && !selectedCustomer) {
      toast.error("يجب اختيار العميل للبيع الآجل");
      return false;
    }

    if (!selectedWarehouse) {
      toast.error("يرجى اختيار المستودع");
      return false;
    }

    if (!items.length) {
      toast.error("أضف منتجاً واحداً على الأقل");
      return false;
    }

    if (paymentMethod === "bank" && !bankAccountId) {
      toast.error("يرجى اختيار الحساب البنكي");
      return false;
    }

    for (const item of items) {
      const currentStock = stocks.find((stock) => stock.id === item.stockId);

      if (!currentStock) {
        toast.error(`تعذر العثور على مخزون ${item.productName}`);
        return false;
      }

      if (Number(currentStock.quantity) < item.quantity) {
        toast.error(
          `الكمية المتاحة من ${item.productName} تغيرت. حدّث الصفحة.`,
        );
        return false;
      }

      if (getProductCost(currentStock) <= 0) {
        toast.error(`تكلفة ${item.productName} غير متاحة بشكل موثوق`);
        return false;
      }
    }

    if (subtotal <= 0) {
      toast.error("إجمالي الفاتورة غير صحيح");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (saving || !validateBeforeSave() || !actor) {
      return;
    }

    setSaving(true);

    try {
      const companyId = actor.companyId;
      const now = new Date().toISOString();

      const invoiceNumber = generateInvoiceNumber();
      const saleId = makeId();
      const journalId = makeId();

      // تحديد الحساب المدين وفق طريقة الدفع
      const paymentAccount = getPaymentAccount();

      // حساب المخزون وتكلفة المبيعات
      const inventoryAccount = getAccountByCode(DEFAULT_INVENTORY_ACCOUNT_CODE);

      const cogsAccount = getAccountByCode(DEFAULT_COGS_ACCOUNT_CODE);

      // تجميع الإيرادات حسب نوع المنتج
      const groupedSales = new Map<string, number>();

      for (const item of items) {
        const product = products.find(
          (product) => product.id === item.productId,
        );

        if (!product) {
          throw new Error("تعذر العثور على أحد المنتجات");
        }

        const code = getSalesAccountCode(product);

        groupedSales.set(code, (groupedSales.get(code) || 0) + item.total);
      }

      const salesAccounts = Array.from(groupedSales.entries()).map(
        ([code, amount]) => ({
          account: getAccountByCode(code),
          amount,
        }),
      );

      const saleItems = items.map((item) => ({
        id: makeId(),
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        quantity: item.quantity,
        price: item.price,
        unitPrice: item.price,
        cost: item.cost,
        total: item.total,
        costTotal: item.costTotal,
      }));

      const paidAmount = paymentMethod === "credit" ? 0 : subtotal;

      const remainingAmount = paymentMethod === "credit" ? subtotal : 0;

      const sale = {
        id: saleId,
        companyId,
        invoiceNumber,

        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || "عميل نقدي",

        warehouseId: selectedWarehouse.id,
        warehouseName: selectedWarehouse.name,

        date: invoiceDate,
        createdAt: now,

        items: saleItems,

        subtotal,
        total: subtotal,
        totalAmount: subtotal,
        grandTotal: subtotal,

        totalCost,
        profit,

        paidAmount,
        remainingAmount,

        paymentMethod,

        // الحساب الذي استقبل قيمة المبيعات
        paymentAccountId: paymentAccount.id,
        paymentAccountCode: paymentAccount.code,
        paymentAccountName: paymentAccount.name,

        status: "posted",

        notes,

        journalId,

        createdBy: actor.name,
        createdById: actor.id,
        createdByName: actor.name,
        createdByUsername: actor.username,
        createdByRole: actor.role,

        updatedBy: actor.name,
        updatedById: actor.id,
        updatedAt: now,
      };

      const journalLines: any[] = [];

      // الطرف المدين: الصندوق أو العميل أو البنك
      journalLines.push({
        id: makeId(),
        journalId,
        companyId,

        accountId: paymentAccount.id,
        accountCode: paymentAccount.code,
        accountName: paymentAccount.name,

        debit: subtotal,
        credit: 0,

        description: `فاتورة مبيعات ${invoiceNumber}`,

        createdAt: now,
        createdBy: actor.name,
        createdById: actor.id,
        createdByUsername: actor.username,
      });

      // الطرف الدائن: الإيرادات
      for (const entry of salesAccounts) {
        journalLines.push({
          id: makeId(),
          journalId,
          companyId,

          accountId: entry.account.id,
          accountCode: entry.account.code,
          accountName: entry.account.name,

          debit: 0,
          credit: entry.amount,

          description: `إيراد فاتورة ${invoiceNumber}`,

          createdAt: now,
          createdBy: actor.name,
          createdById: actor.id,
          createdByUsername: actor.username,
        });
      }

      // الطرف المدين: تكلفة البضاعة المباعة
      journalLines.push({
        id: makeId(),
        journalId,
        companyId,

        accountId: cogsAccount.id,
        accountCode: cogsAccount.code,
        accountName: cogsAccount.name,

        debit: totalCost,
        credit: 0,

        description: `تكلفة بضاعة فاتورة ${invoiceNumber}`,

        createdAt: now,
        createdBy: actor.name,
        createdById: actor.id,
        createdByUsername: actor.username,
      });

      // الطرف الدائن: المخزون
      journalLines.push({
        id: makeId(),
        journalId,
        companyId,

        accountId: inventoryAccount.id,
        accountCode: inventoryAccount.code,
        accountName: inventoryAccount.name,

        debit: 0,
        credit: totalCost,

        description: `صرف مخزون فاتورة ${invoiceNumber}`,

        createdAt: now,
        createdBy: actor.name,
        createdById: actor.id,
        createdByUsername: actor.username,
      });

      const journal = {
        id: journalId,
        companyId,

        journalNumber: `JV-${Date.now()}`,
        date: invoiceDate,

        description: `فاتورة مبيعات رقم ${invoiceNumber}`,

        reference: invoiceNumber,
        referenceType: "sale",
        referenceId: saleId,

        status: "posted",

        totalDebit: subtotal + totalCost,
        totalCredit: subtotal + totalCost,

        createdAt: now,
        postedAt: now,

        createdBy: actor.name,
        createdById: actor.id,
        createdByName: actor.name,
        createdByUsername: actor.username,
        createdByRole: actor.role,

        postedBy: actor.name,
        postedById: actor.id,
        postedByName: actor.name,

        updatedBy: actor.name,
        updatedById: actor.id,
        updatedByName: actor.name,
        updatedAt: now,
      };

      const totalDebit = journalLines.reduce(
        (sum, line) => sum + Number(line.debit || 0),
        0,
      );

      const totalCredit = journalLines.reduce(
        (sum, line) => sum + Number(line.credit || 0),
        0,
      );

      if (Math.abs(totalDebit - totalCredit) > 0.001) {
        throw new Error("القيد المحاسبي غير متوازن");
      }

      /*
       * التحقق من جميع الحسابات قبل بدء الحفظ.
       */
      const uniqueAccounts = [
        paymentAccount,
        inventoryAccount,
        cogsAccount,
        ...salesAccounts.map((item) => item.account),
      ];

      for (const account of uniqueAccounts) {
        if (
          String(account.companyId) !== companyId ||
          account.isActive === false ||
          account.allowPosting === false ||
          account.isGroup === true
        ) {
          throw new Error(`الحساب ${account.code} غير صالح للترحيل`);
        }
      }

      /*
       * إعادة فحص المخزون قبل الخصم.
       */
      for (const item of items) {
        const response = await api.get(`/warehouseStocks/${item.stockId}`);

        const currentStock = response.data;

        if (String(currentStock.companyId) !== companyId) {
          throw new Error(`مخزون ${item.productName} لا يتبع الشركة الحالية`);
        }

        if (Number(currentStock.quantity) < item.quantity) {
          throw new Error(`الكمية المتوفرة من ${item.productName} غير كافية`);
        }
      }

      /*
       * حفظ الفاتورة.
       */
      await api.post("/sales", sale);

      /*
       * خصم المخزون وتسجيل حركة الصرف.
       */
      for (const item of items) {
        const response = await api.get(`/warehouseStocks/${item.stockId}`);

        const currentStock = response.data;

        const newQuantity = Number(currentStock.quantity || 0) - item.quantity;

        await api.patch(`/warehouseStocks/${currentStock.id}`, {
          quantity: newQuantity,
          updatedAt: now,
          updatedBy: actor.name,
          updatedById: actor.id,
          updatedByName: actor.name,
          updatedByUsername: actor.username,
        });

        await api.post("/inventoryMovements", {
          id: makeId(),
          companyId,

          productId: item.productId,
          productName: item.productName,

          warehouseId,
          warehouseName: selectedWarehouse.name,

          movementType: "sale",
          type: "out",

          quantity: item.quantity,
          unitCost: item.cost,
          totalCost: item.costTotal,

          referenceType: "sale",
          referenceId: saleId,
          referenceNumber: invoiceNumber,

          date: invoiceDate,

          createdAt: now,
          createdBy: actor.name,
          createdById: actor.id,
          createdByName: actor.name,
          createdByUsername: actor.username,
          createdByRole: actor.role,
        });
      }

      /*
       * ترحيل القيد المحاسبي.
       */
      await api.post("/journals", journal);

      for (const line of journalLines) {
        await api.post("/journalLines", line);
      }

      /*
       * تحديث رصيد العميل في حالة البيع الآجل فقط.
       */
      if (paymentMethod === "credit" && selectedCustomer) {
        const customerResponse = await api.get(
          `/customers/${selectedCustomer.id}`,
        );

        const currentCustomer = customerResponse.data;

        if (String(currentCustomer.companyId) !== companyId) {
          throw new Error("العميل لا يتبع الشركة الحالية");
        }

        await api.patch(`/customers/${selectedCustomer.id}`, {
          balance: Number(currentCustomer.balance || 0) + subtotal,

          updatedAt: now,
          updatedBy: actor.name,
          updatedById: actor.id,
          updatedByName: actor.name,
          updatedByUsername: actor.username,
        });
      }

      toast.success("تم إنشاء فاتورة المبيعات وترحيلها بنجاح");

      router.push(`/erp/sales/${saleId}`);
    } catch (error: any) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "حدث خطأ أثناء حفظ فاتورة المبيعات",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <FiRefreshCw className="animate-spin text-xl" />
          جاري تحميل البيانات...
        </div>
      </div>
    );
  }

  const bankAccounts = accounts.filter((account) => {
    const type = String(
      account.type || account.accountType || "",
    ).toLowerCase();

    return (
      account.allowPosting !== false &&
      account.isGroup !== true &&
      (type.includes("bank") ||
        type.includes("asset") ||
        type.includes("أصول") ||
        type.includes("بنك") ||
        type.includes("cash"))
    );
  });

  const cashAccount = findAccountByCode(DEFAULT_CASH_ACCOUNT_CODE);

  return (
    <div dir="rtl" className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            type="button"
            onClick={() => router.push("/erp/sales")}
            className="mb-3 flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
          >
            <FiArrowRight />
            العودة إلى المبيعات
          </button>

          <h1 className="text-2xl font-bold text-slate-800">
            إنشاء فاتورة مبيعات
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            تسجيل عملية بيع جديدة وربطها بالمخزون والحسابات.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50"
          title="تحديث البيانات"
        >
          <FiRefreshCw />
        </button>
      </div>

      {/* Invoice Information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
          <FiFileText className="text-blue-600" />
          <h2 className="font-bold text-slate-800">بيانات الفاتورة</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              العميل
              {paymentMethod === "credit" && (
                <span className="mr-1 text-red-500">*</span>
              )}
            </label>

            <div className="relative">
              <FiUser className="absolute right-3 top-3.5 text-slate-400" />

              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-10 pl-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  {paymentMethod === "credit"
                    ? "اختر العميل"
                    : "اختياري - عميل نقدي"}
                </option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                    {customer.phone ? ` - ${customer.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              المستودع
            </label>

            <div className="relative">
              <FiPackage className="absolute right-3 top-3.5 text-slate-400" />

              <select
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  setItems([]);
                  setSelectedProductId("");
                }}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-10 pl-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">اختر المستودع</option>

                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              تاريخ الفاتورة
            </label>

            <div className="relative">
              <FiCalendar className="absolute right-3 top-3.5 text-slate-400" />

              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-10 pl-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {selectedCustomer && (
          <div className="mt-5 rounded-xl bg-blue-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-blue-600">العميل المحدد</p>

                <p className="mt-1 font-bold text-slate-800">
                  {selectedCustomer.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedCustomer.phone || "لا يوجد رقم هاتف"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">الرصيد الحالي</p>

                <p className="mt-1 font-bold text-slate-800">
                  {formatMoney(Number(selectedCustomer.balance || 0))}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Payment Method */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
          <FiCreditCard className="text-blue-600" />
          <h2 className="font-bold text-slate-800">
            طريقة الدفع والحساب المالي
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <PaymentCard
            title="نقداً"
            description="التحصيل إلى الصندوق الافتراضي"
            selected={paymentMethod === "cash"}
            icon={<FiDollarSign />}
            onClick={() => setPaymentMethod("cash")}
          />

          <PaymentCard
            title="آجل"
            description="إضافة المبلغ إلى حساب العميل"
            selected={paymentMethod === "credit"}
            icon={<FiUser />}
            onClick={() => setPaymentMethod("credit")}
          />

          <PaymentCard
            title="حوالة بنكية"
            description="التحصيل إلى حساب بنكي تختاره"
            selected={paymentMethod === "bank"}
            icon={<FiCreditCard />}
            onClick={() => setPaymentMethod("bank")}
          />
        </div>

        {paymentMethod === "cash" && (
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <FiCheckCircle className="text-xl text-emerald-600" />

              <div>
                <p className="text-sm font-bold text-emerald-800">
                  حساب الصندوق الافتراضي
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  {cashAccount
                    ? `${cashAccount.code} - ${cashAccount.name}`
                    : "الحساب 1101 غير موجود أو غير قابل للترحيل"}
                </p>
              </div>
            </div>
          </div>
        )}

        {paymentMethod === "credit" && (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">البيع الآجل</p>

            <p className="mt-1 text-sm text-amber-700">
              سيتم تسجيل قيمة الفاتورة مدينة على حساب العميل. يجب اختيار العميل
              قبل الحفظ.
            </p>
          </div>
        )}

        {paymentMethod === "bank" && (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              اختر الحساب البنكي
            </label>

            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">اختر الحساب البنكي</option>

              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} - {account.name}
                </option>
              ))}
            </select>

            {bankAccounts.length === 0 && (
              <p className="mt-2 text-xs text-red-600">
                لا توجد حسابات بنكية قابلة للترحيل في دليل الحسابات.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Add Product */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
          <FiPlus className="text-blue-600" />
          <h2 className="font-bold text-slate-800">إضافة المنتجات</h2>
        </div>

        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              المنتج
            </label>

            <div className="relative mb-2">
              <FiSearch className="absolute right-3 top-3.5 text-slate-400" />

              <input
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                placeholder="ابحث عن اسم المنتج أو رمزه..."
                className="w-full rounded-xl border border-slate-200 py-3 pr-10 pl-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={!warehouseId}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
            >
              <option value="">اختر المنتج</option>

              {filteredProducts.map((product) => {
                const stock = getStock(product.id, warehouseId);

                return (
                  <option key={product.id} value={product.id}>
                    {product.name} — المتاح: {stock?.quantity ?? 0}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              الكمية
            </label>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              سعر الوحدة
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
              {formatMoney(selectedProductPrice)}
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={addItem}
              disabled={!warehouseId || !selectedProductId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 p-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiPlus />
              إضافة
            </button>
          </div>
        </div>

        {selectedProduct && warehouseId && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs text-blue-600">المنتج المحدد</p>

              <p className="mt-2 font-bold text-slate-800">
                {selectedProduct.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {selectedProduct.code || "بدون رمز"}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs text-emerald-600">الكمية المتوفرة</p>

              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {formatMoney(selectedProductAvailable)}
                <span className="mr-2 text-sm font-normal">
                  {selectedProduct.unit || "وحدة"}
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs text-amber-600">تكلفة الوحدة</p>

              <p className="mt-2 text-xl font-bold text-amber-700">
                {formatMoney(selectedProductCost)}
              </p>
            </div>
          </div>
        )}

        {!warehouseId && (
          <p className="mt-3 text-xs text-amber-600">
            <FiAlertCircle className="ml-1 inline" />
            اختر المستودع أولاً لعرض الكميات المتاحة.
          </p>
        )}
      </section>

      {/* Items Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="font-bold text-slate-800">أصناف الفاتورة</h2>

          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            {items.length} أصناف
          </span>
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <FiShoppingBag className="mx-auto mb-3 text-4xl text-slate-300" />

            <p className="font-semibold text-slate-600">لم تتم إضافة منتجات</p>

            <p className="mt-2 text-sm text-slate-400">
              اختر المنتجات من الأعلى لإضافتها إلى الفاتورة.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-right">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-4">المنتج</th>
                  <th className="px-5 py-4">الكمية</th>
                  <th className="px-5 py-4">سعر الوحدة</th>
                  <th className="px-5 py-4">التكلفة</th>
                  <th className="px-5 py-4">الإجمالي</th>
                  <th className="px-5 py-4">حذف</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {item.productName}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {item.productCode || item.productId}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <input
                        type="number"
                        min="1"
                        max={item.availableQuantity}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.productId, Number(e.target.value))
                        }
                        className="w-20 rounded-lg border border-slate-200 p-2 text-center text-sm"
                      />

                      <p className="mt-1 text-xs text-emerald-600">
                        المتوفر: {item.availableQuantity}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatMoney(item.price)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatMoney(item.cost)}
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-slate-800">
                      {formatMoney(item.total)}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
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

      {/* Notes and Summary */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 font-bold text-slate-800">ملاحظات الفاتورة</h2>

          <textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أدخل أي ملاحظات إضافية..."
            className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 font-bold text-slate-800">ملخص الفاتورة</h2>

          <div className="space-y-4">
            <SummaryRow label="عدد الأصناف" value={String(items.length)} />

            <SummaryRow
              label="إجمالي الكميات"
              value={String(
                items.reduce((sum, item) => sum + item.quantity, 0),
              )}
            />

            <SummaryRow label="إجمالي البيع" value={formatMoney(subtotal)} />

            <SummaryRow label="تكلفة البضاعة" value={formatMoney(totalCost)} />

            <SummaryRow
              label="الربح الإجمالي التقديري"
              value={formatMoney(profit)}
              green
            />

            <div className="rounded-xl bg-slate-900 p-5 text-white">
              <p className="text-sm text-slate-300">إجمالي الفاتورة</p>

              <p className="mt-2 text-3xl font-bold">{formatMoney(subtotal)}</p>

              <div className="mt-4 border-t border-slate-700 pt-3">
                <p className="text-xs text-slate-300">
                  الحساب المستخدم للتحصيل
                </p>

                <p className="mt-1 font-semibold">
                  {paymentMethod === "cash"
                    ? cashAccount?.name || "الصندوق"
                    : paymentMethod === "credit"
                      ? selectedCustomer?.name || "حساب العميل"
                      : findAccountById(bankAccountId)?.name || "الحساب البنكي"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Save */}
      <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push("/erp/sales")}
          disabled={saving}
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          إلغاء
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !items.length}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <FiRefreshCw className="animate-spin" />
              جاري حفظ الفاتورة...
            </>
          ) : (
            <>
              <FiSave />
              حفظ وترحيل الفاتورة
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function PaymentCard({
  title,
  description,
  selected,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-right transition ${
        selected
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
          : "border-slate-200 hover:bg-slate-50"
      }`}
    >
      <div
        className={`mb-3 inline-flex rounded-lg p-3 ${
          selected ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        {icon}
      </div>

      <p className="font-bold text-slate-800">{title}</p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </button>
  );
}

function SummaryRow({
  label,
  value,
  green,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>

      <span
        className={`font-semibold ${
          green ? "text-emerald-700" : "text-slate-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
