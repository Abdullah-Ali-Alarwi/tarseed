"use client";

import { useState } from "react";
import { FiUser, FiMail, FiSave } from "react-icons/fi";

export default function Profile() {
  const [profile, setProfile] = useState({
    name: "WEZZAN Admin",
    username: "admin",
    email: "admin@wezzan.com",
    role: "Administrator",
  });

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>

        <p className="text-slate-500 mt-2">Manage your personal information.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <FiUser size={35} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>

            <p className="text-slate-500 text-sm">{profile.role}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>

            <input
              name="name"
              value={profile.name}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Username
            </label>

            <input
              name="username"
              value={profile.username}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>

            <div className="relative">
              <FiMail className="absolute left-3 top-3.5 text-slate-400" />

              <input
                name="email"
                type="email"
                value={profile.email}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Role
            </label>

            <input
              value={profile.role}
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-lg p-3 text-slate-500"
            />
          </div>

          <button
            onClick={() => alert("Profile updated successfully")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            <FiSave />
            Save Profile
          </button>
        </div>
      </div>
    </main>
  );
}
