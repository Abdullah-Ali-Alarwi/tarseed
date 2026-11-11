"use client";

import { FiBriefcase, FiUsers, FiTrendingUp, FiActivity } from "react-icons/fi";

const stats = [
  {
    title: "Total Companies",
    value: "24",
    change: "+12%",
    icon: FiBriefcase,
  },
  {
    title: "Total Users",
    value: "156",
    change: "+8%",
    icon: FiUsers,
  },
  {
    title: "Active Companies",
    value: "18",
    change: "+5%",
    icon: FiTrendingUp,
  },
  {
    title: "System Activities",
    value: "1,250",
    change: "+15%",
    icon: FiActivity,
  },
];

export default function Wezzan() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

        <p className="text-slate-500 mt-2">
          Welcome to WEZZAN Management System.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="bg-white p-6 rounded-xl border border-slate-200"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-500">{item.title}</p>

                  <h2 className="text-3xl font-bold text-slate-900 mt-3">
                    {item.value}
                  </h2>

                  <p className="text-sm text-green-600 mt-3">
                    {item.change} from last month
                  </p>
                </div>

                <div className="bg-blue-50 text-blue-600 p-4 rounded-xl">
                  <Icon size={25} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl border border-slate-200 mt-8 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-5">
          Recent Activities
        </h2>

        <div className="space-y-5">
          {[
            "New company registered",
            "New user added",
            "Company information updated",
            "System settings changed",
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center gap-3 border-b border-slate-100 pb-4 last:border-0"
            >
              <div className="w-2 h-2 rounded-full bg-blue-600" />

              <p className="text-sm text-slate-700">{activity}</p>

              <span className="text-xs text-slate-400 ml-auto">Recently</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
