"use client";
import { useState, useEffect } from "react";
import Header from "../../components/header.jsx";

export default function ApprovalsPage() {
  const [pendingBooks, setPendingBooks] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch pending books
      const pendingRes = await fetch('/api/books?status=pending');
      const pendingData = await pendingRes.json();
      setPendingBooks(pendingData.data || []);
      
      // Fetch all books for stats
      const booksRes = await fetch('/api/books');
      const booksData = await booksRes.json();
      setBooks(booksData.data || []);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("❌ Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBook = async (id) => {
    try {
      if (!confirm("✅ Yakin ingin menyetujui buku ini?")) return;
      
      const admin = JSON.parse(localStorage.getItem("admin"));
      if (!admin) throw new Error("Admin tidak terautentikasi");
      
      const res = await fetch("/api/books", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          status: "approved", 
          admin_id: admin.id 
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Gagal menyetujui buku");
      
      alert("✅ Buku berhasil disetujui!");
      setRefreshKey(prev => prev + 1);
      
    } catch (err) {
      console.error("handleApproveBook error:", err);
      alert("❌ " + err.message);
    }
  };

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          status: "rejected", 
          admin_id: admin.id,
          reason: reason.trim()
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Gagal menolak buku");
      
      alert("✅ Buku berhasil ditolak!");
      setRefreshKey(prev => prev + 1);
      
    } catch (err) {
      console.error("handleRejectBook error:", err);
      alert("❌ " + err.message);
    }
  };

  const pendingCount = pendingBooks.length;
  const approvedCount = books.filter(book => book.status === "approved").length;
  const rejectedCount = books.filter(book => book.status === "rejected").length;
  const totalBooks = books.length;

  return (
    <>
      <Header />
      
      <div className="p-8">
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
              onClick={fetchData}
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
    </>
  );
}