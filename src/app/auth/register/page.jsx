"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || "Terjadi kesalahan");
        setLoading(false);
        return;
      }

      // Simpan user langsung setelah register
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect otomatis sesuai role
      if (data.user.role === "admin") router.push("/admin/dashboard");
      else router.push("/user/dashboard");
    } catch (err) {
      setMsg("Terjadi kesalahan server");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 flex items-center justify-center p-4">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white rounded-2xl shadow-2xl mb-4">
            <div className="text-6xl">📚</div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Perpustakaan Digital</h1>
          <p className="text-green-100 text-lg">Buat akun baru Anda</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Register</h2>
          <p className="text-gray-500 text-center mb-8">Daftar untuk memulai</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                👤 Nama Lengkap
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none transition text-gray-800"
                  required
                />
                <span className="absolute left-4 top-3.5 text-gray-400 text-xl">👤</span>
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📧 Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none transition text-gray-800"
                  required
                />
                <span className="absolute left-4 top-3.5 text-gray-400 text-xl">📧</span>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔒 Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pl-12 pr-12 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none transition text-gray-800"
                  required
                  minLength={6}
                />
                <span className="absolute left-4 top-3.5 text-gray-400 text-xl">🔒</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">* Minimal 6 karakter</p>
            </div>

            {/* Terms & Conditions */}
            <label className="flex items-start space-x-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 text-green-600 rounded mt-1" required />
              <span className="text-sm text-gray-600">
                Saya setuju dengan{" "}
                <Link href="#" className="text-green-600 hover:underline font-semibold">
                  Syarat & Ketentuan
                </Link>{" "}
                dan{" "}
                <Link href="#" className="text-green-600 hover:underline font-semibold">
                  Kebijakan Privasi
                </Link>
              </span>
            </label>

            {/* Error Message */}
            {msg && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center space-x-3">
                <span className="text-2xl">⚠️</span>
                <p className="text-red-600 font-semibold">{msg}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all transform ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-blue-600 hover:shadow-2xl hover:scale-105"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <span className="animate-spin">⏳</span>
                  <span>Loading...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>✨</span>
                  <span>Daftar Sekarang</span>
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">atau</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Sudah punya akun?{" "}
              <Link
                href="/auth/login"
                className="text-green-600 hover:text-green-700 font-bold hover:underline"
              >
                Login di sini →
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white text-sm mt-8 opacity-80">
          © 2025 Perpustakaan Digital. All rights reserved.
        </p>
      </div>
    </div>
  );
}