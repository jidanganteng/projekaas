"use client";
import { useEffect, useState } from "react";
import BookCard from "@/app/components/bookCard";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const [books, setBooks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Cek apakah user sudah login
    const userData = localStorage.getItem("user");
    const adminData = localStorage.getItem("admin");
    
    if (!userData && !adminData) {
      router.push("/");
      return;
    }
    
    // Set user data
    if (userData) setUser(JSON.parse(userData));
    if (adminData) setUser(JSON.parse(adminData));
    
    // Fetch books
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch("/api/books?status=approved");
      const data = await res.json();
      setBooks(data.data || data);
      setFiltered(data.data || data);
    } catch (error) {
      console.error("Error fetching books:", error);
      alert("Gagal memuat data buku. Silakan coba lagi nanti.");
    }
  };

  // 🔍 FILTER BUKU
  const handleSearch = (value) => {
    setSearch(value);
    if (!value) {
      setFiltered(books);
      return;
    }
    
    const result = books.filter((b) =>
      b.title.toLowerCase().includes(value.toLowerCase()) ||
      b.author.toLowerCase().includes(value.toLowerCase())
    );
    setFiltered(result);
  };

  // 📚 PINJAM BUKU
  const handlePinjam = async (book) => {
    if (!user) return router.push("/auth/login");
    
    if (!confirm(`Apakah Anda yakin ingin meminjam buku "${book.title}"?`)) return;
    
    setLoading(true);
    
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: user.id, 
          book_id: book.id,
          days_duration: 7 // Default 7 hari
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Gagal meminjam buku");
      }
      
      alert(`✅ Berhasil meminjam buku: ${book.title}\n\nStatus: ${data.message}`);
      fetchBooks(); // Refresh data buku
    } catch (error) {
      console.error("Error pinjam:", error);
      alert(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ❤️ TAMBAH FAVORIT
  const handleFavorit = async (book) => {
    if (!user) return router.push("/auth/login");
    
    setLoading(true);
    
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, book_id: book.id })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Jika buku sudah ada di favorit
        if (res.status === 409) {
          alert(`❗ Buku "${book.title}" sudah ada di favorit Anda`);
          return;
        }
        throw new Error(data.message || "Gagal menambahkan ke favorit");
      }
      
      alert(`❤️ Berhasil menambahkan "${book.title}" ke favorit Anda!`);
    } catch (error) {
      console.error("Error favorit:", error);
      alert(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: "all", name: "Semua Buku", icon: "📚" },
    { id: "popular", name: "Populer", icon: "🔥" },
    { id: "new", name: "Terbaru", icon: "✨" },
    { id: "science", name: "Sains", icon: "🔬" },
    { id: "fiction", name: "Fiksi", icon: "📖" },
    { id: "history", name: "Sejarah", icon: "🏛️" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navbar />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
            <div className="text-6xl mb-4 animate-spin">📚</div>
            <p className="text-xl font-semibold text-gray-700">Memproses permintaan...</p>
          </div>
        </div>
      )}

      {/* Hero Section dengan Search Bar */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center space-y-6">
            <h1 className="text-3xl md:text-5xl font-bold animate-fade-in">
              Halo, {user?.name || "Pembaca"}! 👋
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto animate-fade-in animation-delay-200">
              Temukan buku favorit Anda dan jelajahi koleksi terbaru dari perpustakaan digital kami
            </p>
            
            {/* Enhanced Search Bar */}
            <div className="max-w-3xl mx-auto mt-8 animate-fade-in animation-delay-300">
              <div className="relative group">
                <div className="absolute inset-0 bg-white rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden">
                  <span className="pl-6 text-gray-400 text-2xl">🔍</span>
                  <input
                    type="text"
                    placeholder="Cari buku, penulis, atau kategori..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full p-4 pl-4 text-gray-800 text-lg outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {search && (
                    <button
                      onClick={() => handleSearch("")}
                      className="pr-6 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-16 md:h-20">
            <path
              fill="#f8fafc"
              d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            ></path>
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Category Filter */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-wrap gap-3 md:gap-4 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 md:px-6 md:py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${
                  activeCategory === cat.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:shadow-sm"
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                <span className="hidden md:inline">{cat.name}</span>
                <span className="md:hidden">{cat.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-lg">
            <div className="text-3xl md:text-4xl mb-2">📖</div>
            <div className="text-2xl md:text-3xl font-bold">{books.length}</div>
            <div className="text-blue-100 text-sm md:text-base">Total Buku</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-lg">
            <div className="text-3xl md:text-4xl mb-2">⏳</div>
            <div className="text-2xl md:text-3xl font-bold">12</div>
            <div className="text-purple-100 text-sm md:text-base">Pinjaman Aktif</div>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-red-500 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-lg">
            <div className="text-3xl md:text-4xl mb-2">❤️</div>
            <div className="text-2xl md:text-3xl font-bold">45</div>
            <div className="text-pink-100 text-sm md:text-base">Favorit</div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-lg">
            <div className="text-3xl md:text-4xl mb-2">⭐</div>
            <div className="text-2xl md:text-3xl font-bold">4.8</div>
            <div className="text-amber-100 text-sm md:text-base">Rating Rata-rata</div>
          </div>
        </div>

        {/* Books Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Koleksi Buku Kami
            </h2>
            <Link 
              href="/books" 
              className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
            >
              Lihat Semua →
            </Link>
          </div>
          <div className="h-1 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
        </div>

        {/* Books Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100"
              >
                <BookCard book={book} />
                <div className="p-3 md:p-4 space-y-3">
                  <button
                    onClick={() => handlePinjam(book)}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 md:py-3 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md disabled:opacity-50"
                  >
                    📚 Pinjam Buku
                  </button>
                  <button
                    onClick={() => handleFavorit(book)}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-400 to-red-500 text-white py-2.5 md:py-3 rounded-lg font-medium hover:from-pink-500 hover:to-red-600 transition-all duration-300 shadow-md disabled:opacity-50"
                  >
                    ❤️ Favorit
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-md">
            <div className="text-6xl mb-4 text-gray-300">📭</div>
            <p className="text-xl text-gray-600 font-medium">
              {search ? "Tidak ada buku yang sesuai dengan pencarian Anda" : "Tidak ada buku tersedia saat ini"}
            </p>
            {search && (
              <button 
                onClick={() => handleSearch("")}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 md:mt-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden">
          <div className="relative p-6 md:p-12 text-white">
            <div className="absolute top-0 right-0 text-8xl opacity-10">📚</div>
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Tentang Perpustakaan Kami</h3>
              <p className="text-base md:text-lg text-blue-100 leading-relaxed max-w-3xl">
                Perpustakaan digital modern yang menyediakan akses mudah ke ribuan koleksi buku berkualitas tinggi. 
                Nikmati pengalaman membaca yang nyaman dengan fitur peminjaman instan, koleksi terorganisir, 
                dan rekomendasi buku sesuai minat Anda.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 md:gap-4">
                {['✓ Peminjaman Mudah', '✓ Akses 24/7', '✓ Koleksi Lengkap', '✓ Gratis Selamanya'].map((feature, i) => (
                  <div 
                    key={i} 
                    className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm md:text-base"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}