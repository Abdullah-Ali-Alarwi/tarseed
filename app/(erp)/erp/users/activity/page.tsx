"use client";

import { useState } from "react";

import {
  FiActivity,
  FiSearch,
  FiUser,
  FiFileText,
  FiPackage,
  FiLogIn,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiDownload,
  FiFilter,
  FiEye,
} from "react-icons/fi";

const activities = [
  {
    id: 1,
    user: "أحمد علي",
    email: "ahmed@example.com",
    action: "إنشاء فاتورة مبيعات",
    module: "المبيعات",
    description: "إنشاء فاتورة مبيعات رقم INV-1025",
    date: "2026-11-02",
    time: "10:30 AM",
    location: "فرع البيضاء",
    type: "create",
  },
  {
    id: 2,
    user: "محمد أحمد",
    email: "mohammed@example.com",
    action: "تعديل منتج",
    module: "المنتجات",
    description: "تعديل سعر منتج العسل الطبيعي",
    date: "2026-11-02",
    time: "09:45 AM",
    location: "فرع صنعاء",
    type: "update",
  },
  {
    id: 3,
    user: "خالد محمد",
    email: "khaled@example.com",
    action: "تسجيل الدخول",
    module: "النظام",
    description: "تسجيل الدخول إلى النظام بنجاح",
    date: "2026-11-02",
    time: "09:15 AM",
    location: "فرع البيضاء",
    type: "login",
  },
  {
    id: 4,
    user: "علي حسن",
    email: "ali@example.com",
    action: "حذف منتج",
    module: "المنتجات",
    description: "حذف منتج من قائمة المنتجات",
    date: "2026-11-01",
    time: "04:20 PM",
    location: "فرع صنعاء",
    type: "delete",
  },
  {
    id: 5,
    user: "أحمد علي",
    email: "ahmed@example.com",
    action: "إضافة مخزون",
    module: "المخزون",
    description: "إضافة كمية 50 وحدة إلى المخزون",
    date: "2026-11-01",
    time: "02:10 PM",
    location: "فرع البيضاء",
    type: "create",
  },
  {
    id: 6,
    user: "محمد أحمد",
    email: "mohammed@example.com",
    action: "تعديل مستخدم",
    module: "المستخدمون",
    description: "تغيير دور المستخدم إلى مدير فرع",
    date: "2026-11-01",
    time: "11:30 AM",
    location: "الإدارة الرئيسية",
    type: "update",
  },
];

const actionStyles: Record<string, string> = {
  create: "bg-green-50 text-green-700",
  update: "bg-blue-50 text-blue-700",
  delete: "bg-red-50 text-red-700",
  login: "bg-purple-50 text-purple-700",
};

const actionIcons: Record<string, React.ReactNode> = {
  create: <FiPlus />,
  update: <FiEdit2 />,
  delete: <FiTrash2 />,
  login: <FiLogIn />,
};

export default function ActivityPage() {
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("all");
  const [type, setType] = useState("all");

  const [selectedActivity, setSelectedActivity] = useState<
    (typeof activities)[number] | null
  >(null);

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.user.includes(search) ||
      activity.action.includes(search) ||
      activity.description.includes(search);

    const matchesModule = module === "all" || activity.module === module;

    const matchesType = type === "all" || activity.type === type;

    return matchesSearch && matchesModule && matchesType;
  });

  const counts = {
    total: activities.length,
    create: activities.filter((a) => a.type === "create").length,
    update: activities.filter((a) => a.type === "update").length,
    delete: activities.filter((a) => a.type === "delete").length,
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#F5F7FA] p-5 md:p-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}

        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0E1F33]">سجل النشاطات</h1>

            <p className="mt-2 text-sm text-gray-500">
              متابعة وتسجيل جميع العمليات التي ينفذها المستخدمون
            </p>
          </div>

          <button
            onClick={() => alert("سيتم ربط التصدير بالـ API لاحقاً")}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm text-gray-600 hover:bg-gray-50"
          >
            <FiDownload size={17} />
            تصدير السجل
          </button>
        </div>

        {/* Statistics */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="إجمالي النشاطات"
            value={counts.total}
            icon={<FiActivity />}
          />

          <StatCard
            title="عمليات الإضافة"
            value={counts.create}
            icon={<FiPlus />}
          />

          <StatCard
            title="عمليات التعديل"
            value={counts.update}
            icon={<FiEdit2 />}
          />

          <StatCard
            title="عمليات الحذف"
            value={counts.delete}
            icon={<FiTrash2 />}
          />
        </div>

        {/* Activity Table */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 p-5">
            <div className="mb-5">
              <h2 className="font-bold text-[#0E1F33]">سجل العمليات</h2>

              <p className="mt-1 text-xs text-gray-400">
                تفاصيل نشاطات المستخدمين في النظام
              </p>
            </div>

            {/* Filters */}

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث باسم المستخدم أو العملية..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pr-10 pl-4 text-sm outline-none focus:border-[#0E1F33]"
                />
              </div>

              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none"
              >
                <option value="all">جميع الوحدات</option>
                <option value="المبيعات">المبيعات</option>
                <option value="المنتجات">المنتجات</option>
                <option value="المخزون">المخزون</option>
                <option value="المستخدمون">المستخدمون</option>
                <option value="النظام">النظام</option>
              </select>

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none"
              >
                <option value="all">جميع العمليات</option>
                <option value="create">إضافة</option>
                <option value="update">تعديل</option>
                <option value="delete">حذف</option>
                <option value="login">تسجيل دخول</option>
              </select>
            </div>
          </div>

          {/* Table */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-right">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium">المستخدم</th>
                  <th className="px-6 py-4 font-medium">العملية</th>
                  <th className="px-6 py-4 font-medium">الوحدة</th>
                  <th className="px-6 py-4 font-medium">التاريخ والوقت</th>
                  <th className="px-6 py-4 font-medium">الفرع</th>
                  <th className="px-6 py-4 text-center font-medium">
                    التفاصيل
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    {/* User */}

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9EFF5] text-sm font-bold text-[#0E1F33]">
                          {activity.user.slice(0, 2)}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {activity.user}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {activity.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Action */}

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${actionStyles[activity.type]}`}
                        >
                          {actionIcons[activity.type]}
                        </span>

                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {activity.action}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Module */}

                    <td className="px-6 py-4">
                      <span className="rounded-md bg-gray-100 px-3 py-1.5 text-xs text-gray-600">
                        {activity.module}
                      </span>
                    </td>

                    {/* Date */}

                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{activity.date}</p>

                      <p className="mt-1 text-xs text-gray-400">
                        {activity.time}
                      </p>
                    </td>

                    {/* Location */}

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {activity.location}
                    </td>

                    {/* Details */}

                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedActivity(activity)}
                        className="text-gray-400 hover:text-[#0E1F33]"
                        title="عرض التفاصيل"
                      >
                        <FiEye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredActivities.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-sm text-gray-400"
                    >
                      لا توجد نشاطات مطابقة للبحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 px-6 py-4 text-xs text-gray-400">
            عرض {filteredActivities.length} من أصل {activities.length} عملية
          </div>
        </div>
      </div>

      {/* Activity Details Modal */}

      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-bold text-[#0E1F33]">تفاصيل النشاط</h2>

              <button onClick={() => setSelectedActivity(null)}>
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <Detail label="المستخدم" value={selectedActivity.user} />

              <Detail
                label="البريد الإلكتروني"
                value={selectedActivity.email}
              />

              <Detail label="العملية" value={selectedActivity.action} />

              <Detail label="الوحدة" value={selectedActivity.module} />

              <Detail label="الوصف" value={selectedActivity.description} />

              <Detail label="الفرع" value={selectedActivity.location} />

              <Detail label="التاريخ" value={selectedActivity.date} />

              <Detail label="الوقت" value={selectedActivity.time} />
            </div>

            <button
              onClick={() => setSelectedActivity(null)}
              className="mt-6 w-full rounded-lg bg-[#0E1F33] py-3 text-sm text-white hover:bg-[#193957]"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <h3 className="mt-3 text-2xl font-bold text-[#0E1F33]">{value}</h3>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 pb-3">
      <span className="text-xs text-gray-400">{label}</span>

      <span className="text-sm font-medium text-gray-700">{value}</span>
    </div>
  );
}
