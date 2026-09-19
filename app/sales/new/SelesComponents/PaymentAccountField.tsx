"use client";

import { useBankAccountsStore } from "@/Store/bankAccountsStore";
import { useCustomersStore } from "@/Store/customersStore";
import type { PaymentMethod } from "./Buyers";

interface PaymentAccountFieldProps {
  wayOfPayment: PaymentMethod;
}

export default function PaymentAccountField({
  wayOfPayment,
}: PaymentAccountFieldProps) {
  const customers = useCustomersStore((state) => state.customers);

  const bankAccounts = useBankAccountsStore((state) => state.bankAccounts);

  /* ===================================
     نقدًا
  =================================== */

  if (wayOfPayment === "cash") {
    return (
      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium">الحساب</label>

        <input
          type="text"
          value="1002 - الصندوق"
          readOnly
          className="w-full rounded-lg border border-gray-300 bg-gray-100 p-2.5"
        />
      </div>
    );
  }

  /* ===================================
     حوالة بنكية
  =================================== */

  if (wayOfPayment === "bank") {
    return (
      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium">الحساب البنكي</label>

        <select className="w-full rounded-lg border border-gray-300 bg-white p-2.5 outline-none focus:border-blue-500">
          <option value="">اختر الحساب البنكي</option>

          {bankAccounts
            .filter((account) => account.isActive !== false)
            .map((account) => (
              <option key={account.id} value={account.id}>
                {account.code} - {account.name}
              </option>
            ))}
        </select>
      </div>
    );
  }

  /* ===================================
     آجل
  =================================== */

  return (
    <div className="flex-1">
      <label className="mb-2 block text-sm font-medium">حساب العميل</label>

      <select className="w-full rounded-lg border border-gray-300 bg-white p-2.5 outline-none focus:border-blue-500">
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
    </div>
  );
}
