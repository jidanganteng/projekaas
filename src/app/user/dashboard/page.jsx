"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function UserDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loans, setLoans] = useState([]); // Pinjaman aktif (approved/borrowed)
  const [approvals, setApprovals] = useState([]); // Pengajuan persetujuan (pending/approved/rejected)
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookStatusFilter, setBookStatusFilter] = useState("all");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // ============================================
  // LOAD DATA USER & HANDLE QUERY PARAMS
  // ============================================
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) return router.push("/auth/login");
    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
    loadAllData(parsedUser.id);
  }, [searchParams, router]);

  // ============================================
  // LOAD SEMUA DATA USER
  // ============================================
  // LOAD SEMUA DATA USER
  // ============================================
  const loadAllData = async (user_id) => {
    if (!user_id) {
      console.error("User ID tidak valid");
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch Books - handle berbagai kemungkinan response API
      const fetchBooks = async () => {
        try {
          const res = await fetch('/api/books?status=approved&page=1&limit=10', {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!res.ok) {
            console.warn('Books API error:', res.status);
            return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
          }
          
          const data = await res.json();
          // Handle berbagai format response
          if (Array.isArray(data)) {
            return { data: data, pagination: { page: 1, limit: 10, total: data.length, totalPages: 1 } };
          }
          return data;
        } catch (err) {
          console.warn('Books fetch error:', err.message);
          return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
        }
      };

      // Fetch Favorites
      const fetchFavorites = async () => {
        try {
          const res = await fetch(`/api/favorites?user_id=${user_id}`, {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!res.ok) {
            console.warn('Favorites API error:', res.status);
            return [];
          }
          
          const data = await res.json();
          return Array.isArray(data) ? data : (data.data || []);
        } catch (err) {
          console.warn('Favorites fetch error:', err.message);
          return [];
        }
      };

      // Fetch Loans
      const fetchLoans = async () => {
        try {
          const res = await fetch(`/api/loans?user_id=${user_id}`, {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!res.ok) {
            console.warn('Loans API error:', res.status);
            return [];
          }
          
          const data = await res.json();
          const loans = Array.isArray(data) ? data : (data.data || []);
          return loans.filter(loan => loan.status !== 'rejected');
        } catch (err) {
          console.warn('Loans fetch error:', err.message);
          return [];
        }
      };

      // Fetch Approvals
      const fetchApprovals = async () => {
        try {
          const res = await fetch(`/api/loans/approval?user_id=${user_id}`, {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!res.ok) {
            console.warn('Approvals API error:', res.status);
            return [];
          }
          
          const data = await res.json();
          return Array.isArray(data) ? data : (data.data || []);
        } catch (err) {
          console.warn('Approvals fetch error:', err.message);
          return [];
        }
      };

      // Fetch History
      const fetchHistory = async () => {
        try {
          const res = await fetch(`/api/history?user_id=${user_id}`, {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!res.ok) {
            console.warn('History API error:', res.status);
            return [];
          }
          
          const data = await res.json();
          return Array.isArray(data) ? data : (data.data || []);
        } catch (err) {
          console.warn('History fetch error:', err.message);
          return [];
        }
      };

      // Jalankan semua fetch secara paralel
      const [booksResponse, favoritesData, loansData, approvalsData, historyData] = await Promise.all([
        fetchBooks(),
        fetchFavorites(),
        fetchLoans(),
        fetchApprovals(),
        fetchHistory()
      ]);
      
      // Set state dengan data yang sudah diproses
      setBooks(booksResponse?.data || []);
      setPagination(booksResponse?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
      setFavorites(favoritesData);
      setLoans(loansData);
      setApprovals(approvalsData);
      setHistory(historyData);
      
    } catch (err) {
      console.error("Error in loadAllData:", err);
      // Tidak menampilkan alert agar user tetap bisa melihat dashboard
      // meskipun beberapa data gagal dimuat
    } finally {
      setLoading(false);
    }
  };
  // ============================================
  // AJUKAN PEMINJAMAN
  // ============================================
  const handlePinjam = async (bookId) => {
    if (!user) {
      alert("Silakan login terlebih dahulu");
      return router.push("/auth/login");
    }
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, book_id: bookId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Gagal mengajukan peminjaman');
      }
      const data = await res.json();
      alert(data.message || "✅ Pengajuan berhasil! Menunggu persetujuan admin.");
      loadAllData(user.id);
    } catch (err) {
      console.error("Error borrowing book:", err);
      alert("❌ " + (err.message || "Terjadi kesalahan saat mengajukan peminjaman"));
    }
  };

  // ============================================
  // FAVORIT
  // ============================================
  const handleFavorite = async (bookId) => {
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: user.id, 
          book_id: bookId 
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Gagal menambahkan favorit');
      }
      alert("✅ Ditambahkan ke favorit!");
      loadAllData(user.id);
    } catch (err) {
      console.error("Error favorite:", err);
      alert("❌ " + (err.message || "Terjadi kesalahan saat mengelola favorit"));
    }
  };

  // ============================================
  // LOGOUT
  // ============================================
  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  // ============================================
  // FILTER BOOKS
  // ============================================
  const filteredBooks = books.filter((book) => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      bookStatusFilter === "all" || 
      book.status === bookStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // ============================================
  // STATISTIK PERSETUJUAN
  // ============================================
  const pendingApprovals = approvals.filter(approval => approval.status === 'pending').length;
  const approvedApprovals = approvals.filter(approval => approval.status === 'approved').length;
  const rejectedApprovals = approvals.filter(approval => approval.status === 'rejected').length;
  const activeLoans = loans.filter(loan => loan.status === 'borrowed').length;
  const returnedLoans = loans.filter(loan => loan.status === 'returned').length;

  // ============================================
  // LOADING PAGE
  // ============================================
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📚</div>
          <p className="text-2xl font-semibold text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Helper function to map status to Indonesian label
  const getStatusLabel = (status) => {
    const statusMap = {
      pending: "Menunggu",
      approved: "Disetujui",
      borrowed: "Dipinjam",
      returned: "Dikembalikan",
      rejected: "Ditolak"
    };
    return statusMap[status] || status;
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'borrowed': return 'bg-green-100 text-green-700';
      case 'returned': return 'bg-gray-100 text-gray-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'approved': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Fungsi untuk membuka modal pengembalian
  const openReturnModal = (loan) => {
    setSelectedLoan(loan);
    setShowReturnModal(true);
  };

  // Fungsi untuk menutup modal pengembalian
  const closeReturnModal = () => {
    setShowReturnModal(false);
    setSelectedLoan(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">📚</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Perpustakaan Digital
                </h1>
                <p className="text-sm text-gray-500">User Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Navigation Tabs */}
      <div className="bg-white border-b sticky top-[72px] z-40">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-6 py-4 font-semibold transition relative whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="mr-2">🏠</span>Dashboard
            </button>
            <button
              onClick={() => setActiveTab("books")}
              className={`px-6 py-4 font-semibold transition relative whitespace-nowrap ${
                activeTab === "books"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="mr-2">📚</span>Semua Buku
            </button>
            <button
              onClick={() => setActiveTab("approval")}
              className={`px-6 py-4 font-semibold transition relative whitespace-nowrap ${
                activeTab === "approval"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="mr-2">⏳</span>Persetujuan
              {pendingApprovals > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {pendingApprovals}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`px-6 py-4 font-semibold transition relative whitespace-nowrap ${
                activeTab === "favorites"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="mr-2">❤️</span>Favorit
              {favorites.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-pink-500 text-white text-xs rounded-full">
                  {favorites.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("loans")}
              className={`px-6 py-4 font-semibold transition relative whitespace-nowrap ${
                activeTab === "loans"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="mr-2">📖</span>Pinjaman
              {activeLoans > 0 && (
                <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                  {activeLoans}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-4 font-semibold transition relative whitespace-nowrap ${
                activeTab === "history"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="mr-2">↩️</span>Pengembalian
              {returnedLoans > 0 && (
                <span className="ml-2 px-2 py-1 bg-amber-500 text-white text-xs rounded-full">
                  {returnedLoans}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Selamat Datang, {user.name}! 👋</h2>
                  <p className="text-blue-100 text-lg">
                    Kelola pinjaman buku dan pantau status persetujuan Anda
                  </p>
                </div>
                <div className="text-8xl opacity-20">📚</div>
              </div>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-5xl">📖</div>
                  <div className="bg-blue-100 rounded-full p-2">
                    <span className="text-blue-600 font-bold">{activeLoans}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Buku Dipinjam</h3>
                <p className="text-gray-500 text-sm">Sedang dalam peminjaman</p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-5xl">⏳</div>
                  <div className="bg-yellow-100 rounded-full p-2">
                    <span className="text-yellow-600 font-bold">{pendingApprovals}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Menunggu Persetujuan</h3>
                <p className="text-gray-500 text-sm">Pengajuan pinjaman belum disetujui</p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-5xl">✅</div>
                  <div className="bg-green-100 rounded-full p-2">
                    <span className="text-green-600 font-bold">{approvedApprovals}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Disetujui</h3>
                <p className="text-gray-500 text-sm">Pengajuan pinjaman disetujui</p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-5xl">↩️</div>
                  <div className="bg-amber-100 rounded-full p-2">
                    <span className="text-amber-600 font-bold">{returnedLoans}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Telah Dikembalikan</h3>
                <p className="text-gray-500 text-sm">Buku yang sudah dikembalikan</p>
              </div>
            </div>
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">📊 Aktivitas Terbaru</h3>
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500">Belum ada aktivitas</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.slice(0, 5).map((h) => (
                    <div key={h.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                      <div className="text-3xl">
                        {h.action === "pinjam" ? "📖" : h.action === "kembali" ? "↩️" : "❤️"}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{h.title}</p>
                        <p className="text-sm text-gray-600">{h.author}</p>
                        <p className="text-xs text-gray-500 mt-1 capitalize">
                          {h.action} • {new Date(h.date_borrowed || h.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Books Tab */}
        {activeTab === "books" && (
          <div className="space-y-6">
            {/* Search Bar & Filters */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 Cari buku berdasarkan judul atau penulis..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 pl-14 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition text-lg"
                  />
                  <span className="absolute left-5 top-4 text-gray-400 text-2xl">🔍</span>
                </div>
                <select
                  value={bookStatusFilter}
                  onChange={(e) => setBookStatusFilter(e.target.value)}
                  className="px-6 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition text-lg"
                >
                  <option value="all">Semua Status</option>
                  <option value="approved">Disetujui</option>
                  <option value="pending">Menunggu</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
            </div>
            {/* Books Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="bg-white shadow-lg rounded-2xl overflow-hidden transform hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative h-64 bg-gradient-to-br from-blue-100 to-purple-100">
                    {book.cover_image ? (
                      <img
                        src={book.cover_image}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        📚
                      </div>
                    )}
                    {book.status !== 'approved' && (
                      <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                        book.status === 'pending' ? 'bg-yellow-500 text-white' :
                        book.status === 'rejected' ? 'bg-red-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {book.status === 'pending' ? '⏳ Menunggu' : 
                         book.status === 'rejected' ? '❌ Ditolak' : 'Tidak Tersedia'}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-lg text-gray-800 mb-1 truncate">
                      {book.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-1">✍️ {book.author}</p>
                    <p className="text-xs text-gray-500 mb-4">📅 {book.year || "N/A"}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFavorite(book.id)}
                        className={`flex-1 py-2 rounded-lg font-semibold hover:shadow-lg transition ${
                          favorites.some(fav => fav.book_id === book.id)
                            ? "bg-pink-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {favorites.some(fav => fav.book_id === book.id) ? "❤️ Favorit" : "🤍 Tambah Favorit"}
                      </button>
                      <button
                        onClick={() => handlePinjam(book.id)}
                        disabled={book.status !== "approved"}
                        className={`flex-1 py-2 rounded-lg font-semibold hover:shadow-lg transition ${
                          book.status === "approved" 
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {book.status === "approved" ? "📚 Ajukan Pinjam" : "❌ Tidak Tersedia"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredBooks.length === 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="text-8xl mb-4">📭</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Buku tidak ditemukan</h3>
                <p className="text-gray-500">Coba kata kunci pencarian yang berbeda atau ubah filter status</p>
              </div>
            )}
          </div>
        )}
        {/* Approval Tab - Halaman Persetujuan */}
        {activeTab === "approval" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-yellow-50 p-6 rounded-2xl shadow-lg border-l-4 border-yellow-500">
                <h3 className="text-lg font-semibold text-gray-600">Menunggu Persetujuan</h3>
                <p className="text-3xl font-bold text-gray-800">{pendingApprovals}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-2xl shadow-lg border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-gray-600">Disetujui</h3>
                <p className="text-3xl font-bold text-gray-800">{approvedApprovals}</p>
              </div>
              <div className="bg-red-50 p-6 rounded-2xl shadow-lg border-l-4 border-red-500">
                <h3 className="text-lg font-semibold text-gray-600">Ditolak</h3>
                <p className="text-3xl font-bold text-gray-800">{rejectedApprovals}</p>
              </div>
            </div>
            {/* Daftar Pengajuan Menunggu */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">⏳ Pengajuan Menunggu Persetujuan</h3>
              <div className="space-y-4">
                {approvals
                  .filter(approval => approval.status === 'pending')
                  .map(approval => (
                    <div key={approval.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-yellow-200 rounded-xl bg-yellow-50">
                      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        {approval.cover_image ? (
                          <img 
                            src={approval.cover_image} 
                            alt={approval.title}
                            className="w-20 h-20 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-yellow-200 rounded-xl flex items-center justify-center text-3xl">
                            📚
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-lg text-gray-800">{approval.title}</h4>
                          <p className="text-gray-600">✍️ {approval.author}</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Diajukan pada: {new Date(approval.loan_date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        ⏳ Menunggu Persetujuan
                      </span>
                    </div>
                  ))}
                {pendingApprovals === 0 && (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-gray-500">Tidak ada pengajuan yang menunggu persetujuan</p>
                  </div>
                )}
              </div>
            </div>
            {/* Daftar Pengajuan Disetujui */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">✅ Pengajuan Disetujui</h3>
              <div className="space-y-4">
                {approvals
                  .filter(approval => approval.status === 'approved')
                  .map(approval => (
                    <div key={approval.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-green-200 rounded-xl bg-green-50">
                      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        {approval.cover_image ? (
                          <img 
                            src={approval.cover_image} 
                            alt={approval.title}
                            className="w-20 h-20 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-green-200 rounded-xl flex items-center justify-center text-3xl">
                            📚
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-lg text-gray-800">{approval.title}</h4>
                          <p className="text-gray-600">✍️ {approval.author}</p>
                          <p className="text-xs text-green-700 mt-1">
                            Disetujui pada: {new Date(approval.approved_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        ✅ Disetujui
                      </span>
                    </div>
                  ))}
                {approvedApprovals === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Belum ada pengajuan yang disetujui</p>
                  </div>
                )}
              </div>
            </div>
            {/* Daftar Pengajuan Ditolak */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">❌ Pengajuan Ditolak</h3>
              <div className="space-y-4">
                {approvals
                  .filter(approval => approval.status === 'rejected')
                  .map(approval => (
                    <div key={approval.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-red-200 rounded-xl bg-red-50">
                      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        {approval.cover_image ? (
                          <img 
                            src={approval.cover_image} 
                            alt={approval.title}
                            className="w-20 h-20 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-red-200 rounded-xl flex items-center justify-center text-3xl">
                            📚
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-lg text-gray-800">{approval.title}</h4>
                          <p className="text-gray-600">✍️ {approval.author}</p>
                          <p className="text-xs text-red-700 mt-1">
                            Diajukan pada: {new Date(approval.loan_date).toLocaleDateString('id-ID')}
                          </p>
                          {approval.admin_notes && (
                            <p className="text-xs text-red-600 italic mt-1">
                              Alasan: {approval.admin_notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        ❌ Ditolak
                      </span>
                    </div>
                  ))}
                {rejectedApprovals === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Belum ada pengajuan yang ditolak</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Loans Tab - Halaman Pinjaman Aktif */}
        {activeTab === "loans" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">📖 Buku yang Sedang Dipinjam</h3>
              <p className="text-gray-500">Daftar buku yang belum dikembalikan</p>
            </div>
            {loans.filter(loan => loan.status === 'borrowed').length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="text-8xl mb-4">📚</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Tidak ada buku yang sedang dipinjam</h3>
                <p className="text-gray-500 mb-6">
                  Silakan ajukan peminjaman di halaman Semua Buku
                </p>
                <button
                  onClick={() => setActiveTab("books")}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
                >
                  Jelajahi Buku
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {loans
                  .filter(loan => loan.status === 'borrowed')
                  .map((loan) => (
                    <div
                      key={loan.id}
                      className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-4xl">📖</div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loan.status)}`}
                        >
                          {getStatusLabel(loan.status)}
                        </span>
                      </div>
                      <h4 className="font-bold text-lg text-gray-800 mb-1">{loan.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">✍️ {loan.author}</p>
                      <div className="pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          📅 Dipinjam: {new Date(loan.loan_date).toLocaleDateString('id-ID')}
                        </p>
                        {loan.due_date && (
                          <p className={`text-xs font-medium mt-1 ${
                            new Date() > new Date(loan.due_date) ? 'text-red-500' : 'text-green-600'
                          }`}>
                            ⏳ Jatuh Tempo: {new Date(loan.due_date).toLocaleDateString('id-ID')}
                          </p>
                        )}
                        <button
                          onClick={() => openReturnModal(loan)}
                          className="mt-4 w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-md transition flex items-center justify-center"
                        >
                          <span className="mr-2">↩️</span>Kembalikan Buku
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
        {/* History Tab - Halaman Pengembalian */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">↩️ Riwayat Pengembalian</h3>
              <p className="text-gray-500">Daftar buku yang sudah dikembalikan</p>
            </div>
            {returnedLoans === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="text-8xl mb-4">📋</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Belum ada buku yang dikembalikan</h3>
                <p className="text-gray-500">Riwayat pengembalian akan muncul setelah Anda mengembalikan buku</p>
              </div>
            ) : (
              <div className="space-y-4">
                {loans
                  .filter(loan => loan.status === 'returned')
                  .map((loan) => (
                    <div
                      key={loan.id}
                      className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="text-4xl">✅</div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-800">{loan.title}</h4>
                          <p className="text-sm text-gray-600">✍️ {loan.author}</p>
                          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm">
                            <div className="space-y-1">
                              <p className="text-gray-500">
                                📅 Dipinjam: {new Date(loan.loan_date).toLocaleDateString('id-ID')}
                              </p>
                              <p className="text-gray-500">
                                🔙 Dikembalikan: {new Date(loan.return_date).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                            <span className="mt-2 sm:mt-0 px-3 py-1 rounded-full font-semibold bg-gray-100 text-gray-700">
                              Sudah Dikembalikan
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
        {/* Favorites Tab */}
        {activeTab === "favorites" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">❤️ Buku Favorit Saya</h3>
              <p className="text-gray-500">Koleksi buku yang Anda sukai</p>
            </div>
            {favorites.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="text-8xl mb-4">💔</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Belum ada buku favorit</h3>
                <p className="text-gray-500 mb-6">
                  Mulai tambahkan buku ke favorit dengan klik tombol 🤍
                </p>
                <button
                  onClick={() => setActiveTab("books")}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                >
                  Jelajahi Buku
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {favorites.map((item) => (
                  <div
                    key={item.id || item.book_id}
                    className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-5xl mb-3">❤️</div>
                        <h4 className="font-bold text-lg text-gray-800 mb-1">{item.title || item.book_title}</h4>
                        <p className="text-sm text-gray-600">✍️ {item.author || item.book_author}</p>
                      </div>
                      <button
                        onClick={() => handleFavorite(item.book_id || item.id)}
                        className="text-2xl text-pink-500 hover:text-pink-700 transition"
                      >
                        ❤️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      {/* Return Confirmation Modal */}
      {showReturnModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
            <div className="text-6xl mb-4 text-center">↩️</div>
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-4">
              Konfirmasi Pengembalian
            </h3>
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="font-semibold text-lg text-gray-800">{selectedLoan.title}</p>
              <p className="text-gray-600">Penulis: {selectedLoan.author}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">Dipinjam:</span>
                <span className="font-medium">
                  {new Date(selectedLoan.loan_date).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-500">Jatuh Tempo:</span>
                <span className={`font-medium ${
                  new Date() > new Date(selectedLoan.due_date) ? 'text-red-500' : 'text-green-600'
                }`}>
                  {new Date(selectedLoan.due_date).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
            <p className="text-center text-gray-600 mb-6">
              Apakah Anda yakin ingin mengembalikan buku ini?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={closeReturnModal}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  handleReturn(selectedLoan.id);
                  closeReturnModal();
                }}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-md transition"
              >
                Konfirmasi Pengembalian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}