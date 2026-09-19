"use client";

import { useState } from "react";
import CustomerField from "./CustomerField";
import PaymentMethodField from "./PaymentMethodField";
import PaymentAccountField from "./PaymentAccountField";

export type PaymentMethod = "cash" | "bank" | "credit";

export default function Buyers() {
  const [wayOfPayment, setWayOfPayment] = useState<PaymentMethod>("cash");

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-bold">فاتورة المبيعات</h1>

      <div className="flex items-end gap-4">
        {/* اسم العميل */}
        <CustomerField />

        {/* طريقة الدفع */}
        <PaymentMethodField value={wayOfPayment} onChange={setWayOfPayment} />

        {/* الحساب حسب طريقة الدفع */}
        <PaymentAccountField wayOfPayment={wayOfPayment} />
      </div>
    </div>
  );
}
