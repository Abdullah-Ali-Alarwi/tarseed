"use client";

import { useState } from "react";

export default function Settings() {
  const [settings, setSettings] = useState({
    companyName: "WEZZAN",
    email: "admin@wezzan.com",
    language: "English",
    notifications: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

        <p className="text-slate-500 mt-2">Manage your system preferences.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-3xl">
        <h2 className="text-lg font-bold text-slate-800 mb-6">
          General Settings
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Company Name
            </label>

            <input
              name="companyName"
              value={settings.companyName}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Admin Email
            </label>

            <input
              name="email"
              type="email"
              value={settings.email}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Language
            </label>

            <select
              name="language"
              value={settings.language}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500"
            >
              <option>English</option>
              <option>Arabic</option>
            </select>
          </div>

          <div className="flex items-center justify-between border-t pt-5">
            <div>
              <p className="font-medium text-slate-800">Notifications</p>

              <p className="text-sm text-slate-500">
                Receive system notifications.
              </p>
            </div>

            <input
              type="checkbox"
              name="notifications"
              checked={settings.notifications}
              onChange={handleChange}
              className="w-5 h-5 accent-blue-600"
            />
          </div>

          <button
            onClick={() => alert("Settings saved successfully")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </main>
  );
}
