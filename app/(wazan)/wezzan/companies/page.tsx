"use client";

import { FiPlus, FiSearch, FiEdit, FiTrash2 } from "react-icons/fi";

const companies = [
  {
    id: 1,
    name: "Aljabri Company",
    email: "info@aljabri.com",
    status: "Active",
  },
  {
    id: 2,
    name: "Future Company",
    email: "info@future.com",
    status: "Active",
  },
  {
    id: 3,
    name: "Modern Company",
    email: "info@modern.com",
    status: "Inactive",
  },
];

export default function Companies() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 lg:p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>

          <p className="text-slate-500 mt-2">
            Manage your registered companies.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg">
          <FiPlus />
          Add Company
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="relative max-w-sm mb-6">
          <FiSearch className="absolute left-3 top-3.5 text-slate-400" />

          <input
            type="text"
            placeholder="Search companies..."
            className="w-full border border-slate-200 rounded-lg py-3 pl-10 pr-4 outline-none focus:border-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4">Company Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {companies.map((company) => (
                <tr
                  key={company.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="p-4 font-semibold text-slate-800">
                    {company.name}
                  </td>

                  <td className="p-4 text-slate-500">{company.email}</td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        company.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {company.status}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex gap-3">
                      <button className="text-blue-600">
                        <FiEdit size={18} />
                      </button>

                      <button className="text-red-500">
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
