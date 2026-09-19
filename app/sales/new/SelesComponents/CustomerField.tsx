"use client";

import { useCustomersStore } from "@/Store/customersStore";

export default function CustomerField() {
  const customers = useCustomersStore((state) => state.customers);

  return (
    <div className="flex-1">
      <label className="mb-2 block text-sm font-medium">اسم العميل</label>

      <input className="w-full rounded-lg border border-gray-300 bg-white p-2.5 outline-none focus:border-blue-500"></input>
    </div>
  );
}
