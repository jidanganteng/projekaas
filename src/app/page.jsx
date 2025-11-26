"use client";
import Link from "next/link";
import Navbar from "./components/navbar";
import Footer from "./components/footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="bg-gradient-to-r from-purple-500 to-indigo-600 min-h-screen flex flex-col">
        {/* Hero Section */}
        <section className="flex flex-col justify-center items-center text-center p-16 md:p-24">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            Selamat Datang di Perpustakaan Online
          </h1>
          <p className="text-lg md:text-xl text-white mb-10 max-w-3xl animate-fade-in animation-delay-200">
            Temukan buku favoritmu, pinjam dengan mudah, dan nikmati berbagai fitur perpustakaan digital.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 animate-fade-in animation-delay-300">
            <Link
              href="/auth/login"
              className="px-8 py-4 bg-white text-purple-700 font-bold rounded-xl shadow-lg hover:scale-105 transition-all duration-300 transform"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-purple-700 transition-all duration-300 transform"
            >
              Register
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white text-gray-800 py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-purple-800">
              Fitur Unggulan Kami
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
              <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100">
                <div className="text-5xl mb-6 text-blue-600">📚</div>
                <h3 className="text-2xl font-bold mb-4">Pinjam Buku</h3>
                <p className="text-gray-600 leading-relaxed">Pinjam buku favoritmu dengan mudah dan cepat secara online tanpa perlu datang ke perpustakaan.</p>
              </div>
              <div className="p-8 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-pink-100">
                <div className="text-5xl mb-6 text-pink-600">❤️</div>
                <h3 className="text-2xl font-bold mb-4">Favorit</h3>
                <p className="text-gray-600 leading-relaxed">Tambahkan buku yang kamu suka ke daftar favorit untuk akses cepat kapan saja.</p>
              </div>
              <div className="p-8 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100">
                <div className="text-5xl mb-6 text-purple-600">📊</div>
                <h3 className="text-2xl font-bold mb-4">Dashboard</h3>
                <p className="text-gray-600 leading-relaxed">Kelola buku dan pinjaman dengan dashboard mudah digunakan yang tersedia untuk user dan admin.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="flex flex-col justify-center items-center text-center p-16 md:p-24 bg-purple-700 text-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 animate-fade-in">
              Mulai Petualangan Membacamu Sekarang!
            </h2>
            <p className="text-lg md:text-xl mb-10 animate-fade-in animation-delay-200">
              Daftar sekarang dan nikmati pengalaman membaca digital yang praktis dan menyenangkan dengan ribuan koleksi buku.
            </p>
            <Link
              href="/auth/register"
              className="px-10 py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 font-bold text-lg rounded-xl shadow-lg hover:scale-105 transition-all duration-300 transform animate-bounce-slow"
            >
              Register Sekarang
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}