"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [adminName, setAdminName] = useState('Super Admin');
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingLoans, setPendingLoans] = useState(0);

  const navItems = [
    { 
      path: '/admin/dashboard', 
      label: 'Dashboard', 
      icon: '📊',
      exact: true
    },
    { 
      path: '/admin/books', 
      label: 'Kelola Buku', 
      icon: '📖'
    },
    { 
      path: '/admin/approvals', 
      label: 'Persetujuan Buku', 
      icon: '⏳',
      badge: pendingCount
    },
    { 
      path: '/admin/loans', 
      label: 'Manajemen Pinjaman', 
      icon: '📝',
      badge: pendingLoans
    },
    { 
      path: '/admin/users', 
      label: 'Kelola User', 
      icon: '👥'
    }
  ];

  const fetchPendingCounts = async () => {
    try {
      // Fetch pending books count
      const booksRes = await fetch('/api/books?status=pending&limit=1');
      const booksData = await booksRes.json();
      setPendingCount(booksData.data?.length || 0);
      
      // Fetch pending loans count (sesuaikan dengan endpoint Anda)
      const loansRes = await fetch('/api/admin/loans?status=pending&limit=1');
      const loansData = await loansRes.json();
      setPendingLoans(loansData.length || 0);
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  useEffect(() => {
    fetchPendingCounts();
    const interval = setInterval(fetchPendingCounts, 30000); // Refresh setiap 30 detik
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-900 to-purple-900 text-white shadow-2xl flex flex-col h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="text-4xl">📚</div>
          <div>
            <h1 className="text-xl font-bold">Perpustakaan</h1>
            <p className="text-xs text-blue-200">Admin Panel</p>
          </div>
        </div>
        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.path
              : pathname.startsWith(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${
                  isActive ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-6 border-t border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <div className="text-sm">
              <p className="font-semibold">{adminName}</p>
              <p className="text-xs text-blue-200">admin@perpustakaan.id</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition flex items-center justify-center space-x-2"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}