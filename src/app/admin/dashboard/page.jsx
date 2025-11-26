"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [books, setBooks] = useState([]);
  const [pendingBooks, setPendingBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ 
    id: null, 
    title: "", 
    author: "", 
    year: "", 
    image: null, 
    existingImage: null,
    category_id: "",
    stock: 1
  });
  const [loanForm, setLoanForm] = useState({
    loan_id: null,
    action: "",
    reason: "",
    admin_notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [loanSearch, setLoanSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [loanSortBy, setLoanSortBy] = useState("loan_date");
  const [page, setPage] = useState(1);
  const [loanPage, setLoanPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [loanStatusFilter, setLoanStatusFilter] = useState("all");
  const pageSize = 8;
  
  // ✅ PERBAIKAN UTAMA: FETCH BUKU DENGAN PARAMETER STATUS
  const fetchBooksByStatus = async (status = 'approved') => {
    try {
      const booksUrl = new URL('/api/books', window.location.origin);
      booksUrl.searchParams.append('status', status);
      booksUrl.searchParams.append('page', '1');
      booksUrl.searchParams.append('limit', '50'); // Ambil lebih banyak untuk admin

      const res = await fetch(booksUrl.toString());
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ 
          message: `Status ${res.status}: ${res.statusText}` 
        }));
        throw new Error(`Gagal mengambil data buku (${status}): ${errorData.message || 'Unknown error'}`);
      }

      const data = await res.json();
      return data.data || []; // ✅ Ambil data dari response API
    } catch (err) {
      console.error(`fetchBooksByStatus (${status}) error:`, err);
      alert(`❌ Gagal memuat buku ${status}: ${err.message}`);
      return [];
    }
  };

  // ✅ FETCH BUKU YANG MENUNGGU PERSETUJUAN SECARA KHUSUS
  const fetchPendingBooks = async () => {
    try {
      setLoading(true);
      const pendingData = await fetchBooksByStatus('pending');
      setPendingBooks(pendingData);
    } catch (err) {
      console.error("fetchPendingBooks error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH SEMUA BUKU (UNTUK HALAMAN KOLEKSI)
  const fetchAllBooks = async (retryCount = 0) => {
    try {
      setLoading(true);
      
      const res = await fetch('/api/books', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        // Retry sekali jika server error
        if (res.status >= 500 && retryCount < 1) {
          console.log('🔄 Retrying fetch books...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
          return fetchAllBooks(retryCount + 1);
        }
        
        throw new Error(`Gagal mengambil data buku (${res.status})`);
      }

      const data = await res.json();
      const allBooksData = Array.isArray(data) ? data : (data.data || data.books || []);
      
      if (!Array.isArray(allBooksData)) {
        throw new Error('Format data buku tidak valid');
      }
      
      // Filter & sort
      const filteredBooks = allBooksData
        .filter(book => book && ['approved', 'rejected'].includes(book.status))
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      
      setBooks(filteredBooks);
      
      // Sukses notification (optional)
      console.log(`✅ Berhasil memuat ${filteredBooks.length} buku`);
      
    } catch (err) {
      console.error("fetchAllBooks error:", err);
      
      // User-friendly error message
      const errorMessage = err.message.includes('fetch')
        ? 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
        : err.message;
      
      alert(`❌ ${errorMessage}`);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH LOANS DENGAN PENANGANAN ERROR YANG LEBIH BAIK
  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/loans");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ 
          message: `Status ${res.status}: ${res.statusText}` 
        }));
        throw new Error(`Gagal mengambil data peminjaman: ${errorData.message || 'Unknown error'}`);
      }
      const data = await res.json();
      setLoans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchLoans error:", err);
      alert("❌ Gagal memuat data peminjaman: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH USERS
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ 
          message: `Status ${res.status}: ${res.statusText}` 
        }));
        throw new Error(`Gagal mengambil data user: ${errorData.message || 'Unknown error'}`);
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchUsers error:", err);
      alert("❌ Gagal memuat data user: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNGSI PERSETUJUAN BUKU DIPERBAIKI
  const handleApproveBook = async (id) => {
    try {
      if (!confirm("✅ Yakin ingin menyetujui buku ini? Buku akan tersedia untuk dipinjam.")) return;
      
      const admin = JSON.parse(localStorage.getItem("admin"));
      if (!admin) throw new Error("Admin tidak terautentikasi");
      
      const res = await fetch("/api/books", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('admin_token') || ''}`
        },
        body: JSON.stringify({ 
          id, 
          status: "approved", 
          admin_id: admin.id 
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal menyetujui buku");
      }
      
      const data = await res.json();
      alert(data.message || "✅ Buku berhasil disetujui!");
      fetchPendingBooks(); // Refresh data pending books
    } catch (err) {
      console.error("handleApproveBook error:", err);
      alert("❌ " + (err.message || "Terjadi kesalahan saat menyetujui buku"));
    }
  };

  // ✅ FUNGSI PENOLAKAN BUKU DIPERBAIKI
  const handleRejectBook = async (id) => {
    try {
      const reason = prompt("📝 Masukkan alasan penolakan buku:");
      if (!reason || reason.trim() === "") {
        alert("❌ Alasan penolakan tidak boleh kosong");
        return;
      }
      
      const admin = JSON.parse(localStorage.getItem("admin"));
      if (!admin) throw new Error("Admin tidak terautentikasi");
      
      const res = await fetch("/api/books", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('admin_token') || ''}`
        },
        body: JSON.stringify({ 
          id, 
          status: "rejected", 
          admin_id: admin.id,
          reason: reason.trim()
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal menolak buku");
      }
      
      const data = await res.json();
      alert(data.message || "✅ Buku berhasil ditolak!");
      fetchPendingBooks(); // Refresh data pending books
    } catch (err) {
      console.error("handleRejectBook error:", err);
      alert("❌ " + (err.message || "Terjadi kesalahan saat menolak buku"));
    }
  };

  // ===== Submit Book (Create / Update) =====
  const handleSubmitBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("author", form.author);
      fd.append("year", form.year);
      fd.append("stock", form.stock);
      if (form.category_id) fd.append("category_id", form.category_id);
      if (form.image instanceof File) fd.append("image", form.image);
      if (form.id) fd.append("id", form.id);
      
      const admin = JSON.parse(localStorage.getItem("admin"));
      if (!admin) throw new Error("Admin tidak terautentikasi");
      fd.append("admin_id", admin.id);
      
      const method = form.id ? "PUT" : "POST";
      const res = await fetch("/api/books", { method, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error submit");
      alert(form.id ? "✅ Buku berhasil diupdate!" : "✅ Buku berhasil ditambahkan!");
      resetForm();
      setShowModal(false);
      fetchAllBooks();
    } catch (err) {
      console.error(err);
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== Submit Loan Action =====
  const handleSubmitLoanAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { loan_id, action, reason, admin_notes } = loanForm;
      const admin = JSON.parse(localStorage.getItem("admin"));
      if (!admin) throw new Error("Admin tidak terautentikasi");
      
      const payload = { 
        loan_id, 
        action, 
        admin_id: admin.id 
      };
      
      if (reason) payload.reason = reason;
      if (admin_notes) payload.admin_notes = admin_notes;
      
      const res = await fetch("/api/loans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error processing loan");
      alert(data.message || "✅ Aksi berhasil diproses!");
      resetLoanForm();
      setShowLoanModal(false);
      fetchLoans();
    } catch (err) {
      console.error(err);
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== Edit Book =====
  const handleEditBook = (book) => {
    setForm({
      id: book.id,
      title: book.title,
      author: book.author,
      year: book.year,
      stock: book.stock || 1,
      category_id: book.category_id || "",
      image: null,
      existingImage: book.cover_image || book.image || null,
    });
    setShowModal(true);
  };

  // ===== Delete Book =====
  const handleDeleteBook = async (id) => {
    if (!confirm("⚠️ Yakin ingin menghapus buku ini? Data tidak bisa dikembalikan!")) return;
    try {
      const admin = JSON.parse(localStorage.getItem("admin"));
      if (!admin) throw new Error("Admin tidak terautentikasi");
      
      const res = await fetch("/api/books", {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('admin_token') || ''}`
        },
        body: JSON.stringify({ 
          id,
          admin_id: admin.id
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal menghapus buku");
      }
      
      alert("✅ Buku berhasil dihapus!");
      fetchAllBooks();
    } catch (err) {
      console.error(err);
      alert("❌ " + err.message);
    }
  };

  // ===== Loan Action Handlers =====
  const handleApproveLoan = (loan) => {
    setLoanForm({
      loan_id: loan.id,
      action: "approve",
      reason: "",
      admin_notes: ""
    });
    setShowLoanModal(true);
  };

  const handleRejectLoan = (loan) => {
    setLoanForm({
      loan_id: loan.id,
      action: "reject",
      reason: "",
      admin_notes: ""
    });
    setShowLoanModal(true);
  };

  const handleStartBorrow = (loan) => {
    if (!confirm("⚠️ Yakin ingin memulai peminjaman? Buku akan berstatus 'Dipinjam'")) return;
    setLoanForm({
      loan_id: loan.id,
      action: "start_borrow",
      reason: "",
      admin_notes: ""
    });
    setShowLoanModal(true);
  };

  const handleReturnBook = (loan) => {
    if (!confirm("⚠️ Yakin ingin mengkonfirmasi pengembalian? Stok buku akan bertambah")) return;
    setLoanForm({
      loan_id: loan.id,
      action: "return",
      reason: "",
      admin_notes: ""
    });
    setShowLoanModal(true);
  };

  const resetForm = () => {
    setForm({ 
      id: null, 
      title: "", 
      author: "", 
      year: "", 
      image: null, 
      existingImage: null,
      category_id: "",
      stock: 1
    });
  };

  const resetLoanForm = () => {
    setLoanForm({
      loan_id: null,
      action: "",
      reason: "",
      admin_notes: ""
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // ===== EFFECT UNTUK MEMUAT DATA SESUAI SECTION =====
  useEffect(() => {
    const admin = localStorage.getItem("admin");
    if (!admin) {
      router.push("/admin/dashboard");
      return;
    }

    const loadData = async () => {
      try {
        switch(activeSection) {
          case 'approvals':
            await fetchPendingBooks();
            break;
          case 'books':
            await fetchAllBooks();
            break;
          case 'loans':
            await fetchLoans();
            break;
          case 'users':
            await fetchUsers();
            break;
          default:
            await Promise.allSettled([
              fetchAllBooks(),
              fetchLoans(),
              fetchUsers(),
              fetchPendingBooks()
            ]);
        }
      } catch (error) {
        console.error('Data loading error:', error);
      }
    };

    loadData();
  }, [activeSection, router]);

  // ✅ KALKULASI STATISTIK DIPERBAIKI
  const totalBooks = books.length;
  const pendingCount = pendingBooks.length;
  const approvedCount = books.filter(book => book.status === "approved").length;
  const rejectedCount = books.filter(book => book.status === "rejected").length;
  
  const pendingLoans = loans.filter(loan => loan.status === "pending").length;
  const activeLoans = loans.filter(loan => loan.status === "borrowed").length;
  const returnedLoans = loans.filter(loan => loan.status === "returned").length;
  const rejectedLoans = loans.filter(loan => loan.status === "rejected").length;

  // ===== FUNGSI HELPER =====
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

  const getDueDateColor = (dueDate) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'text-red-500 font-bold';
    if (diffDays < 3) return 'text-amber-600 font-semibold';
    return 'text-gray-600';
  };

  // ===== RENDER UI =====
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-900 to-purple-900 text-white shadow-2xl">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="text-4xl">📚</div>
            <div>
              <h1 className="text-xl font-bold">Perpustakaan</h1>
              <p className="text-xs text-blue-200">Admin Panel</p>
            </div>
          </div>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveSection("dashboard")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                activeSection === "dashboard" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <span className="text-xl">📊</span>
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveSection("books")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                activeSection === "books" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <span className="text-xl">📖</span>
              <span>Kelola Buku</span>
            </button>
            <button
              onClick={() => setActiveSection("approvals")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                activeSection === "approvals" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <span className="text-xl">⏳</span>
              <span>Persetujuan Buku ({pendingCount})</span>
            </button>
            <button
              onClick={() => setActiveSection("loans")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                activeSection === "loans" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <span className="text-xl">📝</span>
              <span>Manajemen Pinjaman ({pendingLoans})</span>
            </button>
            <button
              onClick={() => setActiveSection("users")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                activeSection === "users" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <span className="text-xl">👥</span>
              <span>Kelola User</span>
            </button>
          </nav>
          <div className="mt-8 pt-8 border-t border-white/20">
            <div className="flex items-center space-x-3 px-4">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
              <div className="text-sm">
                <p className="font-semibold">{JSON.parse(localStorage.getItem("admin") || '{}').name || 'Super Admin'}</p>
                <p className="text-xs text-blue-200">admin@perpustakaan.id</p>
              </div>
              {/* ✅ TOMBOL LOGOUT DIHAPUS DARI SINI */}
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-md sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {activeSection === "dashboard" && "Dashboard Admin"}
                {activeSection === "books" && "Manajemen Koleksi Buku"}
                {activeSection === "approvals" && "Persetujuan Buku Baru"}
                {activeSection === "loans" && "Manajemen Peminjaman"}
                {activeSection === "users" && "Manajemen Pengguna"}
              </h2>
              <p className="text-gray-500 text-sm">
                {activeSection === "dashboard" && "Overview sistem perpustakaan digital"}
                {activeSection === "books" && "Kelola koleksi buku perpustakaan"}
                {activeSection === "approvals" && "Setujui atau tolak buku yang diajukan user"}
                {activeSection === "loans" && "Kelola semua peminjaman buku"}
                {activeSection === "users" && "Kelola data pengguna perpustakaan"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition">
                <span className="text-2xl">🔔</span>
                {(pendingCount > 0 || pendingLoans > 0) && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
              <div className="text-right">
                <p className="font-semibold text-gray-800">{JSON.parse(localStorage.getItem("admin") || '{}').name || 'Super Admin'}</p>
                <p className="text-xs text-gray-500">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </header>
        
        <div className="p-8">
          {/* Dashboard Section */}
          {activeSection === "dashboard" && (
            <div>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-5xl">📚</div>
                    <div className="bg-white/20 rounded-full px-3 py-1 text-xs">Total</div>
                  </div>
                  <h3 className="text-3xl font-bold">{totalBooks}</h3>
                  <p className="text-blue-100">Total Buku</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-5xl">⏳</div>
                    <div className="bg-white/20 rounded-full px-3 py-1 text-xs">Pending</div>
                  </div>
                  <h3 className="text-3xl font-bold">{pendingCount}</h3>
                  <p className="text-amber-100">Buku Menunggu</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-5xl">📖</div>
                    <div className="bg-white/20 rounded-full px-3 py-1 text-xs">Aktif</div>
                  </div>
                  <h3 className="text-3xl font-bold">{activeLoans}</h3>
                  <p className="text-green-100">Peminjaman Aktif</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-5xl">👥</div>
                    <div className="bg-white/20 rounded-full px-3 py-1 text-xs">User</div>
                  </div>
                  <h3 className="text-3xl font-bold">{users.length}</h3>
                  <p className="text-purple-100">Total Pengguna</p>
                </div>
              </div>
              
              {/* Charts & Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">📈 Aktivitas Terbaru</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {loans.slice(0, 5).map((loan) => (
                      <div key={loan.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                        <div className={`text-2xl ${loan.status === 'borrowed' ? 'text-green-500' : loan.status === 'returned' ? 'text-gray-500' : 'text-amber-500'}`}>
                          {loan.status === 'borrowed' ? '📖' : loan.status === 'returned' ? '✅' : '⏳'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {loan.user_name} meminjam <span className="text-blue-600">{loan.title}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(loan.loan_date).toLocaleDateString('id-ID')} • {getStatusLabel(loan.status)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">📊 Statistik Peminjaman</h3>
                  <div className="h-64 flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                    <div className="text-center">
                      <div className="text-7xl mb-4 font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                        📊
                      </div>
                      <p className="text-gray-600">Grafik akan ditampilkan di versi berikutnya</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Books Section */}
          {activeSection === "books" && (
            <div>
              {/* Search & Actions Bar */}
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="🔍 Cari judul atau penulis..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition"
                    />
                    <span className="absolute left-4 top-3.5 text-gray-400 text-xl">🔍</span>
                  </div>
                  <select
                    value={approvalFilter}
                    onChange={(e) => setApprovalFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition"
                  >
                    <option value="all">Semua Status</option>
                    <option value="approved">Disetujui</option>
                    <option value="pending">Menunggu</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition"
                  >
                    <option value="title">Urutkan: Judul</option>
                    <option value="author">Urutkan: Penulis</option>
                    <option value="year">Urutkan: Tahun</option>
                    <option value="stock">Urutkan: Stok</option>
                  </select>
                  <button
                    onClick={openAddModal}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition whitespace-nowrap"
                  >
                    ➕ Tambah Buku
                  </button>
                </div>
              </div>
              
              {/* Books Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                {books
                  .filter((b) => 
                    (b.title.toLowerCase().includes(search.toLowerCase()) || 
                    b.author.toLowerCase().includes(search.toLowerCase())) &&
                    (approvalFilter === "all" || b.status === approvalFilter)
                  )
                  .sort((a, b) => {
                    if (sortBy === "year") return b.year - a.year;
                    if (sortBy === "stock") return b.stock - a.stock;
                    return String(a[sortBy]).localeCompare(String(b[sortBy]));
                  })
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((book) => (
                    <div key={book.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
                      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100">
                        {book.cover_image || book.image ? (
                          <img
                            src={`/uploads/${book.cover_image || book.image}`}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl">
                            📚
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs">
                          Stok: {book.stock || 0}
                        </div>
                        <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-semibold ${
                          book.status === "approved" ? "bg-green-500 text-white" :
                          book.status === "rejected" ? "bg-red-500 text-white" :
                          "bg-yellow-500 text-white"
                        }`}>
                          {book.status === "approved" ? "✅ Disetujui" : 
                           book.status === "rejected" ? "❌ Ditolak" : "⏳ Menunggu"}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg text-gray-800 mb-1 truncate">{book.title}</h3>
                        <p className="text-gray-600 text-sm mb-1">✍️ {book.author}</p>
                        <p className="text-gray-500 text-xs mb-4">📅 {book.year || "N/A"}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditBook(book)}
                            className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book.id)}
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              
              {/* Empty State */}
              {books
                .filter((b) => 
                  (b.title.toLowerCase().includes(search.toLowerCase()) || 
                  b.author.toLowerCase().includes(search.toLowerCase())) &&
                  (approvalFilter === "all" || b.status === approvalFilter)
                ).length === 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                  <div className="text-8xl mb-4">📭</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Tidak ada buku</h3>
                  <p className="text-gray-500">Coba ubah filter pencarian Anda</p>
                </div>
              )}
              
              {/* Pagination */}
              {books
                .filter((b) => 
                  (b.title.toLowerCase().includes(search.toLowerCase()) || 
                  b.author.toLowerCase().includes(search.toLowerCase())) &&
                  (approvalFilter === "all" || b.status === approvalFilter)
                ).length > 0 && (
                <div className="flex justify-center items-center space-x-4">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-6 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  <span className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold">
                    {page} / {Math.ceil(books.length / pageSize)}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(Math.ceil(books.length / pageSize), page + 1))}
                    disabled={page === Math.ceil(books.length / pageSize)}
                    className="px-6 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Approvals Section */}
          {activeSection === "approvals" && (
            <div>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-5xl animate-pulse">⏳</div>
                    <div className="bg-white/20 rounded-full px-3 py-1 text-xs">Menunggu</div>
                  </div>
                  <h3 className="text-3xl font-bold">{pendingCount}</h3>
                  <p className="text-yellow-100">Buku Menunggu</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-5xl">✅</div>
                    <div className="bg-white/20 rounded-full px-3 py-1 text-xs">Disetujui</div>
                  </div>
                  <h3 className="text-3xl font-bold">{approvedCount}</h3>
                  <p className="text-blue-100">Buku Disetujui</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-5xl">❌</div>
                    <div className="bg-white/20 rounded-full px-3 py-1 text-xs">Ditolak</div>
                  </div>
                  <h3 className="text-3xl font-bold">{rejectedCount}</h3>
                  <p className="text-red-100">Buku Ditolak</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-5xl">📚</div>
                    <div className="bg-white/20 rounded-full px-3 py-1 text-xs">Total</div>
                  </div>
                  <h3 className="text-3xl font-bold">{totalBooks}</h3>
                  <p className="text-purple-100">Total Buku</p>
                </div>
              </div>
              
              {/* HALAMAN PERSETUJUAN */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <span className="text-yellow-500 mr-2">⏳</span>
                    Buku Yang Menunggu Persetujuan
                  </h2>
                  <button
                    onClick={fetchPendingBooks}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      loading ? 'bg-gray-300 text-gray-500' : 'bg-blue-500 text-white hover:bg-blue-600'
                    } transition`}
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">⟳</span>
                        Memuat...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">🔄</span>
                        Refresh Data
                      </>
                    )}
                  </button>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Berikut adalah daftar buku yang diajukan oleh user dan menunggu persetujuan Anda. 
                  Silakan tinjau setiap buku dan berikan keputusan untuk menyetujui atau menolak.
                </p>
                
                {/* DAFTAR BUKU MENUNGGU PERSETUJUAN */}
                <div className="space-y-6">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin text-6xl mb-4">⏳</div>
                      <p className="text-xl font-semibold text-gray-700">Memuat data buku yang menunggu persetujuan...</p>
                    </div>
                  ) : pendingCount === 0 ? (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-12 text-center">
                      <div className="text-8xl mb-4 text-green-500">✅</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Tidak ada buku yang menunggu persetujuan</h3>
                      <p className="text-gray-600 mb-6">
                        Semua buku telah diproses atau belum ada pengajuan baru dari user.
                      </p>
                      <button
                        onClick={() => setActiveSection("books")}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                      >
                        Lihat Semua Buku
                      </button>
                    </div>
                  ) : (
                    pendingBooks.map((book) => (
                      <div 
                        key={book.id} 
                        className="border-l-4 border-yellow-400 bg-gradient-to-r from-yellow-50 to-white rounded-xl p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-start space-x-4">
                            <div className="w-20 h-28 flex-shrink-0 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-lg overflow-hidden border-2 border-dashed border-yellow-300 flex items-center justify-center">
                              {book.cover_image || book.image ? (
                                <img
                                  src={`/uploads/${book.cover_image || book.image}`}
                                  alt={book.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-4xl text-yellow-500">📚</span>
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-xl text-gray-800">{book.title}</h3>
                              <p className="text-lg text-gray-600 mt-1">✍️ <span className="font-medium">{book.author}</span></p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                  📅 {book.year || 'Tahun tidak diketahui'}
                                </span>
                                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                  👤 Diajukan oleh: {book.user_name || 'User Anonim'}
                                </span>
                                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                                  📅 {new Date(book.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric', 
                                    month: 'long', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 justify-end">
                            <button
                              onClick={() => handleApproveBook(book.id)}
                              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition transform hover:scale-105 flex items-center"
                            >
                              ✅ Setujui
                            </button>
                            <button
                              onClick={() => handleRejectBook(book.id)}
                              className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg font-semibold hover:shadow-lg transition transform hover:scale-105 flex items-center"
                            >
                              ❌ Tolak
                            </button>
                          </div>
                        </div>
                        {book.description && (
                          <div className="mt-4 pt-4 border-t border-yellow-100">
                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                              <span className="text-yellow-500 mr-2">📝</span>
                              Deskripsi Buku
                            </h4>
                            <p className="text-gray-600 leading-relaxed">{book.description}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Loans Management Section */}
          {activeSection === "loans" && (
            <div>
              {/* Search & Filter Bar */}
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="🔍 Cari buku, user, atau ID..."
                      value={loanSearch}
                      onChange={(e) => setLoanSearch(e.target.value)}
                      className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition"
                    />
                    <span className="absolute left-4 top-3.5 text-gray-400 text-xl">🔍</span>
                  </div>
                  <select
                    value={loanStatusFilter}
                    onChange={(e) => setLoanStatusFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition"
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Menunggu Persetujuan</option>
                    <option value="approved">Disetujui (Belum Diambil)</option>
                    <option value="borrowed">Sedang Dipinjam</option>
                    <option value="returned">Sudah Dikembalikan</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                  <select
                    value={loanSortBy}
                    onChange={(e) => setLoanSortBy(e.target.value)}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition"
                  >
                    <option value="loan_date">Urutkan: Tanggal Pinjam</option>
                    <option value="due_date">Urutkan: Jatuh Tempo</option>
                    <option value="user_name">Urutkan: Nama User</option>
                    <option value="title">Urutkan: Judul Buku</option>
                  </select>
                </div>
              </div>
              
              {/* Loans Table */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buku</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jatuh Tempo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loans
                        .filter((l) => {
                          const matchesSearch = 
                            l.title.toLowerCase().includes(loanSearch.toLowerCase()) ||
                            l.user_name.toLowerCase().includes(loanSearch.toLowerCase()) ||
                            l.id.toString().includes(loanSearch);
                          const matchesStatus = 
                            loanStatusFilter === "all" || 
                            l.status === loanStatusFilter;
                          return matchesSearch && matchesStatus;
                        })
                        .sort((a, b) => {
                          if (loanSortBy === "due_date") {
                            return new Date(a.due_date) - new Date(b.due_date);
                          }
                          if (loanSortBy === "loan_date") {
                            return new Date(b.loan_date) - new Date(a.loan_date);
                          }
                          return String(a[loanSortBy]).localeCompare(String(b[loanSortBy]));
                        })
                        .slice((loanPage - 1) * pageSize, loanPage * pageSize)
                        .map((loan) => (
                          <tr key={loan.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{loan.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{loan.user_name}</div>
                              <div className="text-sm text-gray-500">{loan.user_email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{loan.title}</div>
                              <div className="text-sm text-gray-500">{loan.author}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(loan.loan_date).toLocaleDateString('id-ID')}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDueDateColor(loan.due_date)}`}>
                              {new Date(loan.due_date).toLocaleDateString('id-ID')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                                {getStatusLabel(loan.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                {loan.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveLoan(loan)}
                                      className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-xs"
                                    >
                                      ✅ Setujui
                                    </button>
                                    <button
                                      onClick={() => handleRejectLoan(loan)}
                                      className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-xs"
                                    >
                                      ❌ Tolak
                                    </button>
                                  </>
                                )}
                                {loan.status === 'approved' && (
                                  <button
                                    onClick={() => handleStartBorrow(loan)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-xs"
                                  >
                                    📖 Mulai Pinjam
                                  </button>
                                )}
                                {loan.status === 'borrowed' && (
                                  <button
                                    onClick={() => handleReturnBook(loan)}
                                    className="px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-xs"
                                  >
                                    ↩️ Kembalikan
                                  </button>
                                )}
                                {(loan.status === 'returned' || loan.status === 'rejected') && (
                                  <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs">
                                    Selesai
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {/* Empty State */}
                {loans
                  .filter((l) => {
                    const matchesSearch = 
                      l.title.toLowerCase().includes(loanSearch.toLowerCase()) ||
                      l.user_name.toLowerCase().includes(loanSearch.toLowerCase()) ||
                      l.id.toString().includes(loanSearch);
                    const matchesStatus = 
                      loanStatusFilter === "all" || 
                      l.status === loanStatusFilter;
                    return matchesSearch && matchesStatus;
                  }).length === 0 && (
                  <div className="p-12 text-center">
                    <div className="text-8xl mb-4">📭</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Tidak ada data peminjaman</h3>
                    <p className="text-gray-500">Coba ubah filter pencarian Anda</p>
                  </div>
                )}
                {/* Pagination */}
                {loans
                  .filter((l) => {
                    const matchesSearch = 
                      l.title.toLowerCase().includes(loanSearch.toLowerCase()) ||
                      l.user_name.toLowerCase().includes(loanSearch.toLowerCase()) ||
                      l.id.toString().includes(loanSearch);
                    const matchesStatus = 
                      loanStatusFilter === "all" || 
                      l.status === loanStatusFilter;
                    return matchesSearch && matchesStatus;
                  }).length > 0 && (
                  <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                      Menampilkan <span className="font-medium">{(loanPage - 1) * pageSize + 1}</span> sampai{" "}
                      <span className="font-medium">{Math.min(loanPage * pageSize, loans.length)}</span> dari{" "}
                      <span className="font-medium">{loans.length}</span> hasil
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setLoanPage(Math.max(1, loanPage - 1))}
                        disabled={loanPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sebelumnya
                      </button>
                      <span className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-blue-50">
                        Halaman {loanPage} dari {Math.ceil(loans.length / pageSize)}
                      </span>
                      <button
                        onClick={() => setLoanPage(Math.min(Math.ceil(loans.length / pageSize), loanPage + 1))}
                        disabled={loanPage === Math.ceil(loans.length / pageSize)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Users Section */}
          {activeSection === "users" && (
            <div>
              {/* Search Bar */}
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="🔍 Cari nama atau email user..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition"
                    />
                    <span className="absolute left-4 top-3.5 text-gray-400 text-xl">🔍</span>
                  </div>
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition whitespace-nowrap">
                    ➕ Tambah User
                  </button>
                </div>
              </div>
              
              {/* Users Table */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terdaftar</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users
                        .filter((u) => 
                          u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase())
                        )
                        .map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{user.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">ID: {user.nim_nip || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.is_admin ? 'Admin' : 'User'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.created_at).toLocaleDateString('id-ID')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                <button className="text-blue-600 hover:text-blue-900">✏️ Edit</button>
                                <button className="text-red-600 hover:text-red-900">🗑️ Hapus</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {/* Empty State */}
                {users
                  .filter((u) => 
                    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                    u.email.toLowerCase().includes(userSearch.toLowerCase())
                  ).length === 0 && (
                  <div className="p-12 text-center">
                    <div className="text-8xl mb-4">📭</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Tidak ada user</h3>
                    <p className="text-gray-500">Coba ubah filter pencarian Anda</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Book Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">{form.id ? "✏️ Edit Buku" : "➕ Tambah Buku"}</h2>
            </div>
            <form onSubmit={handleSubmitBook} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📖 Judul Buku</label>
                <input
                  type="text"
                  placeholder="Masukkan judul buku"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">✍️ Penulis</label>
                <input
                  type="text"
                  placeholder="Masukkan nama penulis"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Tahun Terbit</label>
                <input
                  type="number"
                  placeholder="2024"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📦 Stok Buku</label>
                <input
                  type="number"
                  min="1"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">🖼️ Cover Buku (opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                />
                {form.existingImage && !form.image && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Cover saat ini:</p>
                    <img
                      src={`/uploads/${form.existingImage}`}
                      alt="current"
                      className="w-32 h-40 object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}
                {form.image instanceof File && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-600">📎 File terpilih: {form.image.name}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? "⏳ Loading..." : form.id ? "✅ Update" : "➕ Tambah"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowModal(false);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  ❌ Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Loan Action Modal */}
      {showLoanModal && loanForm.loan_id && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className={`bg-gradient-to-r ${
              loanForm.action === 'approve' ? 'from-green-600 to-green-700' :
              loanForm.action === 'reject' ? 'from-red-600 to-red-700' :
              loanForm.action === 'start_borrow' ? 'from-blue-600 to-blue-700' :
              'from-amber-600 to-amber-700'
            } text-white p-6 rounded-t-2xl`}>
              <h2 className="text-2xl font-bold flex items-center">
                {loanForm.action === 'approve' && '✅ Setujui Peminjaman'}
                {loanForm.action === 'reject' && '❌ Tolak Peminjaman'}
                {loanForm.action === 'start_borrow' && '📖 Mulai Peminjaman'}
                {loanForm.action === 'return' && '↩️ Konfirmasi Pengembalian'}
              </h2>
            </div>
            <form onSubmit={handleSubmitLoanAction} className="p-6 space-y-4">
              {loanForm.action === 'reject' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📝 Alasan Penolakan</label>
                  <textarea
                    value={loanForm.reason}
                    onChange={(e) => setLoanForm({ ...loanForm, reason: e.target.value })}
                    placeholder="Masukkan alasan penolakan..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 outline-none transition"
                    rows="3"
                    required
                  />
                </div>
              )}
              {(['approve', 'reject'].includes(loanForm.action)) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">✏️ Catatan Admin</label>
                  <textarea
                    value={loanForm.admin_notes}
                    onChange={(e) => setLoanForm({ ...loanForm, admin_notes: e.target.value })}
                    placeholder="Tambahkan catatan untuk user..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                    rows="2"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 rounded-xl font-semibold hover:shadow-lg transition ${
                    loanForm.action === 'approve' ? 'bg-green-600 text-white hover:bg-green-700' :
                    loanForm.action === 'reject' ? 'bg-red-600 text-white hover:bg-red-700' :
                    loanForm.action === 'start_borrow' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                    'bg-amber-600 text-white hover:bg-amber-700'
                  } disabled:opacity-50`}
                >
                  {loading ? "⏳ Memproses..." : 
                    loanForm.action === 'approve' ? "✅ Setujui" :
                    loanForm.action === 'reject' ? "❌ Tolak" :
                    loanForm.action === 'start_borrow' ? "📖 Mulai Pinjam" :
                    "↩️ Konfirmasi Pengembalian"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetLoanForm();
                    setShowLoanModal(false);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  ❌ Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}