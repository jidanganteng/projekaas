"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Input email, 2: Input OTP, 3: Reset password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Simpan OTP yang dikirim (dalam real app, ini akan dikirim via email)
  const [generatedOtp, setGeneratedOtp] = useState("");

  // ============================================
  // STEP 1: KIRIM OTP KE EMAIL
  // ============================================
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // Validasi email
    if (!email || !email.includes("@")) {
      setError("Email tidak valid");
      setLoading(false);
      return;
    }

    try {
      // Simulasi pengiriman OTP
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(randomOtp);
      
      // Simpan di localStorage untuk simulasi
      localStorage.setItem("resetOtp", randomOtp);
      localStorage.setItem("resetEmail", email);

      // Simulasi delay pengiriman email
      await new Promise(resolve => setTimeout(resolve, 2000));

      setMessage(`Kode OTP telah dikirim ke ${email}`);
      setStep(2);
    } catch (err) {
      setError("Gagal mengirim OTP. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // STEP 2: VERIFIKASI OTP
  // ============================================
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Kode OTP harus 6 digit");
      setLoading(false);
      return;
    }

    try {
      // Verifikasi OTP
      const savedOtp = localStorage.getItem("resetOtp");
      const savedEmail = localStorage.getItem("resetEmail");

      if (otp === savedOtp && email === savedEmail) {
        setMessage("Kode OTP berhasil diverifikasi");
        setStep(3);
      } else {
        setError("Kode OTP tidak valid");
      }
    } catch (err) {
      setError("Gagal memverifikasi OTP");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // STEP 3: RESET PASSWORD
  // ============================================
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validasi password
    if (!newPassword || !confirmPassword) {
      setError("Harap isi semua field");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password minimal 6 karakter");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      setLoading(false);
      return;
    }

    try {
      // Simulasi reset password
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Dapatkan data users dari localStorage
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      
      // Update password user
      const updatedUsers = users.map(user => 
        user.email === email ? { ...user, password: newPassword } : user
      );
      
      localStorage.setItem("users", JSON.stringify(updatedUsers));

      // Hapus data reset
      localStorage.removeItem("resetOtp");
      localStorage.removeItem("resetEmail");

      setMessage("Password berhasil direset! Silakan login dengan password baru.");
      
      // Redirect ke login setelah 3 detik
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);

    } catch (err) {
      setError("Gagal reset password. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RESEND OTP
  // ============================================
  const handleResendOtp = async () => {
    setLoading(true);
    setError("");

    try {
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(randomOtp);
      localStorage.setItem("resetOtp", randomOtp);

      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage("Kode OTP baru telah dikirim!");
    } catch (err) {
      setError("Gagal mengirim ulang OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-4xl shadow-lg">
              📚
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {step === 1 && "Lupa Password"}
            {step === 2 && "Verifikasi OTP"}
            {step === 3 && "Reset Password"}
          </h1>
          <p className="text-gray-600">
            {step === 1 && "Masukkan email Anda untuk mereset password"}
            {step === 2 && "Masukkan kode OTP yang dikirim ke email Anda"}
            {step === 3 && "Buat password baru untuk akun Anda"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= stepNumber
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300 text-gray-500"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`w-16 h-1 ${
                      step > stepNumber ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Alert Messages */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6">
            <div className="flex items-center">
              <span className="text-lg mr-2">✅</span>
              <span>{message}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            <div className="flex items-center">
              <span className="text-lg mr-2">❌</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Demo OTP Info */}
        {step === 2 && generatedOtp && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg mr-2">💡</span>
                <span className="text-sm">
                  <strong>Demo OTP:</strong> {generatedOtp}
                </span>
              </div>
              <button
                onClick={handleResendOtp}
                disabled={loading}
                className="text-blue-600 hover:text-blue-800 text-sm font-semibold disabled:opacity-50"
              >
                Kirim Ulang
              </button>
            </div>
          </div>
        )}

        {/* Forms */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* STEP 1: Input Email */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email Anda"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                  <span className="absolute right-4 top-3 text-gray-400">📧</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                    Mengirim OTP...
                  </div>
                ) : (
                  "Kirim Kode OTP"
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Input OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Kode OTP
                </label>
                <div className="relative">
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Masukkan 6 digit kode OTP"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center text-lg font-mono tracking-widest"
                    maxLength={6}
                    required
                  />
                  <span className="absolute right-4 top-3 text-gray-400">🔐</span>
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Kode OTP telah dikirim ke: <strong>{email}</strong>
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                      Verifikasi...
                    </div>
                  ) : (
                    "Verifikasi OTP"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                    minLength={6}
                  />
                  <span className="absolute right-4 top-3 text-gray-400">🔒</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Konfirmasi password baru"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                    minLength={6}
                  />
                  <span className="absolute right-4 top-3 text-gray-400">🔒</span>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                      Reset Password...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-blue-600 hover:text-blue-800 font-semibold transition"
            >
              ← Kembali ke halaman Login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Butuh bantuan?{" "}
            <a href="mailto:support@perpustakaan.com" className="text-blue-600 hover:text-blue-800">
              Hubungi Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}