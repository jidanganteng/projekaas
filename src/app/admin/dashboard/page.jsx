"use client";
import { useState, useEffect } from "react";
import Header from "../../components/header.jsx";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    pendingBooks: 0,
    activeLoans: 0,
    totalUsers: 0
  });
  const [recentLoans, setRecentLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch books
      const booksRes = await fetch('/api/books?limit=100');
      const booksData = await booksRes.json();
      
      // Fetch pending books
      const pendingRes = await fetch('/api/books?status=pending&limit=100');
      const pendingData = await pendingRes.json();
      
      // Fetch loans
      const loansRes = await fetch('/api/admin/loans');
      const loansData = await loansRes.json();
      
      // Fetch users
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      
      setStats({
        totalBooks: booksData.data?.length || 0,
        pendingBooks: pendingData.data?.length || 0,
        activeLoans: loansData.filter(loan => loan.status === 'borrowed').length || 0,
        totalUsers: usersData.length || 0
      });
      
      setRecentLoans(loansData.slice(0, 5));
      setUsers(usersData);
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <>
      <Header 
        title="Dashboard Admin" 
        subtitle="Overview sistem perpustakaan digital"
      />
      
      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl">📚</div>
              <div className="bg-white/20 rounded-full px-3 py-1 text-xs">Total</div>
            </div>
            <h3 className="text-3xl font-bold">{stats.totalBooks}</h3>
            <p className="text-blue-100">Total Buku</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl">⏳</div>
              <div className="bg-white/20 rounded-full px-3 py-1 text-xs">Pending</div>
            </div>
            <h3 className="text-3xl font-bold">{stats.pendingBooks}</h3>
            <p className="text-amber-100">Buku Menunggu</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl">📖</div>
              <div className="bg-white/20 rounded-full px-3 py-1 text-xs">Aktif</div>
            </div>
            <h3 className="text-3xl font-bold">{stats.activeLoans}</h3>
            <p className="text-green-100">Peminjaman Aktif</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl">👥</div>
              <div className="bg-white/20 rounded-full px-3 py-1 text-xs">User</div>
            </div>
            <h3 className="text-3xl font-bold">{stats.totalUsers}</h3>
            <p className="text-purple-100">Total Pengguna</p>
          </div>
        </div>
        
        {/* Charts & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">📈 Aktivitas Terbaru</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin text-4xl mb-4">⏳</div>
                  <p>Memuat aktivitas...</p>
                </div>
              ) : recentLoans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada aktivitas terbaru
                </div>
              ) : (
                recentLoans.map((loan) => (
                  <div key={loan.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                    <div className={`text-2xl ${
                      loan.status === 'borrowed' ? 'text-green-500' : 
                      loan.status === 'returned' ? 'text-gray-500' : 'text-amber-500'
                    }`}>
                      {loan.status === 'borrowed' ? '📖' : 
                       loan.status === 'returned' ? '✅' : '⏳'}
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
                ))
              )}
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
    </>
  );
}