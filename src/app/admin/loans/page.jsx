"use client";
import { useState, useEffect } from "react";

export default function AdminLoansPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [loanSearch, setLoanSearch] = useState("");
  const [loanStatusFilter, setLoanStatusFilter] = useState("all");
  const [loanSortBy, setLoanSortBy] = useState("loan_date");

  useEffect(() => {
    fetchLoans();
  }, []);

  // ✅ Fetch REAL data from API
  const fetchLoans = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Fetching loans from /api/admin/loans...');
      
      const response = await fetch('/api/admin/loans', {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', errorText);
        throw new Error(`HTTP ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error('❌ Not JSON response:', text.substring(0, 500));
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      console.log('✅ Data received:', data);
      
      if (data.success === false) {
        console.error('❌ API error:', data);
        alert('Error: ' + (data.message || 'Gagal mengambil data'));
        setLoans([]);
      } else {
        const loansArray = Array.isArray(data) ? data : (data.data || []);
        console.log('✅ Loans loaded:', loansArray.length, 'items');
        setLoans(loansArray);
      }
      
    } catch (error) {
      console.error('❌ Fetch error:', error);
      alert('Gagal memuat data: ' + error.message);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Get status label
  const getStatusLabel = (status) => {
    const statusMap = {
      pending: "Menunggu",
      approved: "Disetujui",
      borrowed: "Dipinjam",
      returned: "Dikembalikan",
      rejected: "Ditolak",
      cancelled: "Dibatalkan"
    };
    return statusMap[status] || status;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-blue-600 bg-blue-100';
      case 'borrowed': return 'text-green-600 bg-green-100';
      case 'returned': return 'text-gray-600 bg-gray-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Filter loans
  const filteredLoans = loans
    .filter((loan) => {
      const searchLower = loanSearch.toLowerCase();
      const matchesSearch = 
        loan.title?.toLowerCase().includes(searchLower) ||
        loan.author?.toLowerCase().includes(searchLower) ||
        loan.user_name?.toLowerCase().includes(searchLower) ||
        loan.user_email?.toLowerCase().includes(searchLower) ||
        loan.id?.toString().includes(loanSearch);

      const matchesStatus = 
        loanStatusFilter === "all" || 
        loan.status === loanStatusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (loanSortBy === "loan_date") {
        return new Date(b.loan_date) - new Date(a.loan_date);
      }
      if (loanSortBy === "due_date") {
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (loanSortBy === "user_name") {
        return (a.user_name || '').localeCompare(b.user_name || '');
      }
      if (loanSortBy === "title") {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

  // ✅ Handle loan actions with REAL API calls
  const handleLoanAction = async (loanId, action, loanTitle) => {
  try {
    let confirmMessage = '';
    let needReason = false;
    
    // Tentukan pesan konfirmasi
    switch (action) {
      case 'approve':
        confirmMessage = `Setujui peminjaman "${loanTitle}"?`;
        break;
      case 'reject':
        confirmMessage = `Tolak peminjaman "${loanTitle}"?`;
        needReason = true;
        break;
      case 'start_borrow':
        confirmMessage = `Tandai buku "${loanTitle}" sebagai sedang dipinjam?`;
        break;
      case 'return':
        confirmMessage = `Tandai buku "${loanTitle}" sebagai dikembalikan?`;
        break;
      default:
        alert('Aksi tidak dikenali');
        return;
    }
    
    // Konfirmasi aksi
    if (!window.confirm(confirmMessage)) return;
    
    // Minta alasan jika reject
    let reason = null;
    if (needReason) {
      reason = prompt('Masukkan alasan penolakan:');
      if (!reason || reason.trim() === '') {
        alert('Alasan penolakan harus diisi');
        return;
      }
    }
    
    setActionLoading(loanId);
    
    // ✅ KOREKSI: Gunakan PUT, bukan PATCH
    // ✅ KOREKSI: Field harus sesuai dengan backend (loan_id, action, admin_id)
    const response = await fetch('/api/admin/loans', {
      method: 'PUT', // ✅ INI YANG HARUS DIPERBAIKI
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        loan_id: loanId, // ✅ Nama field harus "loan_id" bukan "id"
        action: action,  // ✅ Nama field harus "action" bukan "status"
        admin_id: 1, // TODO: Ambil dari session
        reason: reason, // Untuk action reject
        admin_notes: `Diproses oleh admin pada ${new Date().toLocaleString('id-ID')}`
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Gagal melakukan aksi ${action}`);
    }
    
    // Tampilkan pesan sukses
    alert(`✅ ${data.message || `Berhasil ${action} peminjaman`}`);
    
    // Refresh data
    if (typeof fetchLoans === 'function') {
      await fetchLoans();
    }
    
  } catch (error) {
    console.error('Error in handleLoanAction:', error);
    alert(`❌ Error: ${error.message}`);
    
    // Tampilkan error lebih detail untuk debugging
    if (error.message.includes('405')) {
      alert('⚠️ Error 405: Method tidak diizinkan. Pastikan menggunakan PUT, bukan PATCH.');
    }
  } finally {
    setActionLoading(null);
  }
};

  // Check if loan is overdue
  const isOverdue = (dueDate, status) => {
    if (status === 'returned' || status === 'rejected') return false;
    return new Date(dueDate) < new Date();
  };

  // Stats
  const stats = {
    total: loans.length,
    pending: loans.filter(l => l.status === 'pending').length,
    approved: loans.filter(l => l.status === 'approved').length,
    borrowed: loans.filter(l => l.status === 'borrowed').length,
    returned: loans.filter(l => l.status === 'returned').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Kelola Peminjaman</h1>
            <p className="text-blue-100 mt-2">Manage semua peminjaman buku dari user</p>
          </div>
          <button
            onClick={fetchLoans}
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            Refresh
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 shadow">
            <div className="text-2xl mb-1">⏳</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-600">Menunggu</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 shadow">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
            <div className="text-xs text-gray-600">Disetujui</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 shadow">
            <div className="text-2xl mb-1">📖</div>
            <div className="text-2xl font-bold text-green-600">{stats.borrowed}</div>
            <div className="text-xs text-gray-600">Dipinjam</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 shadow">
            <div className="text-2xl mb-1">✔️</div>
            <div className="text-2xl font-bold text-gray-600">{stats.returned}</div>
            <div className="text-xs text-gray-600">Selesai</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="🔍 Cari buku, user, atau ID..."
                value={loanSearch}
                onChange={(e) => setLoanSearch(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <select
                value={loanStatusFilter}
                onChange={(e) => setLoanStatusFilter(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              >
                <option value="all">Semua Status</option>
                <option value="pending">⏳ Menunggu</option>
                <option value="approved">✅ Disetujui</option>
                <option value="borrowed">📖 Dipinjam</option>
                <option value="returned">✔️ Dikembalikan</option>
                <option value="rejected">❌ Ditolak</option>
              </select>
              <select
                value={loanSortBy}
                onChange={(e) => setLoanSortBy(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              >
                <option value="loan_date">📅 Tanggal Pinjam</option>
                <option value="due_date">⏰ Jatuh Tempo</option>
                <option value="user_name">👤 Nama User</option>
                <option value="title">📚 Judul Buku</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loans Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    USER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    BUKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TANGGAL PINJAM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    JATUH TEMPO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin text-4xl mb-3">⏳</div>
                        <p className="text-gray-600">Memuat data peminjaman...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-5xl mb-3">📭</div>
                        <p className="text-gray-600 font-medium">
                          {loanSearch || loanStatusFilter !== 'all' 
                            ? 'Tidak ada hasil yang cocok'
                            : 'Belum ada data peminjaman'}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          {loanSearch || loanStatusFilter !== 'all' 
                            ? 'Coba ubah filter atau kata kunci pencarian'
                            : 'Peminjaman dari user akan muncul di sini'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => (
                    <tr 
                      key={loan.id} 
                      className={`hover:bg-gray-50 transition ${
                        isOverdue(loan.due_date, loan.status) ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{loan.user_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{loan.user_email || 'N/A'}</div>
                          {loan.nim_nip && (
                            <div className="text-xs text-gray-400">NIM: {loan.nim_nip}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{loan.title || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{loan.author || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(loan.loan_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${
                          isOverdue(loan.due_date, loan.status) 
                            ? 'text-red-600 font-bold' 
                            : 'text-gray-900'
                        }`}>
                          {formatDate(loan.due_date)}
                          {isOverdue(loan.due_date, loan.status) && (
                            <span className="block text-xs">⚠️ Terlambat</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                          {getStatusLabel(loan.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {actionLoading === loan.id ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="animate-spin">⏳</span>
                            Loading...
                          </div>
                        ) : loan.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleLoanAction(loan.id, 'approve', loan.title)}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-xs font-medium"
                            >
                              ✅ Setujui
                            </button>
                            <button
                              onClick={() => handleLoanAction(loan.id, 'reject', loan.title)}
                              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-xs font-medium"
                            >
                              ❌ Tolak
                            </button>
                          </div>
                        ) : loan.status === 'approved' ? (
                          <button
                            onClick={() => handleLoanAction(loan.id, 'start_borrow', loan.title)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                          >
                            📖 Mulai Pinjam
                          </button>
                        ) : loan.status === 'borrowed' ? (
                          <button
                            onClick={() => handleLoanAction(loan.id, 'return', loan.title)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-medium"
                          >
                            ✔️ Kembalikan
                          </button>
                        ) : (
                          <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm inline-block">
                            Selesai
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {!loading && filteredLoans.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Menampilkan <span className="font-medium">{filteredLoans.length}</span> dari{" "}
                <span className="font-medium">{loans.length}</span> peminjaman
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-blue-500 text-2xl mr-3">💡</div>
            <div>
              <p className="font-medium text-blue-800 mb-2">Cara menggunakan:</p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Gunakan kotak pencarian untuk mencari peminjaman tertentu</li>
                <li>• Filter berdasarkan status untuk melihat kategori peminjaman</li>
                <li>• Setujui/Tolak peminjaman yang berstatus "Menunggu"</li>
                <li>• Klik "Mulai Pinjam" untuk mengubah status dari "Disetujui" → "Dipinjam"</li>
                <li>• Klik "Kembalikan" saat buku sudah dikembalikan oleh user</li>
                <li>• Baris berwarna merah menandakan peminjaman sudah terlambat</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}