"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');

  // Hanya jalankan di client side
  useEffect(() => {
    setIsClient(true);
    
    // Ambil data user dari localStorage
    const userData = localStorage.getItem("user") || localStorage.getItem("admin");
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        setUserRole(parsedData.role || (parsedData.is_admin ? 'admin' : 'user'));
        setUserName(parsedData.name || 'User');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Menu untuk user biasa
  const userMenu = [
    { name: "Dashboard", path: "/user/dashboard" },
    { name: "Home", path: "/homepage" },
    { name: "History", path: "/history" },
    { name: "Wishlist", path: "/wishlist" },
    { name: "Profil", path: "/profil" },
  ];

  // Menu untuk admin
  const adminMenu = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Kelola Buku", path: "/admin/books" },
    { name: "Persetujuan", path: "/admin/approvals" },
    { name: "Pinjaman", path: "/admin/loans" },
    { name: "Profil", path: "/profil" },
  ];

  // Menu default (belum login)
  const defaultMenu = [
    { name: "Home", path: "/" },
    { name: "Login", path: "/auth/login" },
    { name: "Register", path: "/auth/register" },
  ];

  // Tentukan menu berdasarkan role
  const getMenuItems = () => {
    if (!isClient) return defaultMenu; // Default saat loading
    
    if (userRole === "admin") return adminMenu;
    if (userRole === "user") return userMenu;
    return defaultMenu;
  };

  const menuItems = getMenuItems();

  // Fungsi untuk menentukan apakah menu aktif
  const isActive = (path) => {
    if (!isClient) return false;
    return pathname === path;
  };

  // Fungsi logout
  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    localStorage.removeItem("admin_token");
    setUserRole(null);
    setUserName('');
    setOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex justify-between items-center shadow-xl sticky top-0 z-50">
      <Link
        href="/"
        className="text-3xl font-extrabold tracking-wide flex items-center transition-all duration-300 hover:text-yellow-300"
        onClick={() => setOpen(false)}
      >
        <span className="mr-2">📚</span>
        Perpustakaan
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center space-x-8 font-medium">
        {menuItems.map((menu) => (
          <Link
            key={menu.name}
            href={menu.path}
            className={`relative px-2 py-1 transition-all duration-300 hover:text-yellow-300 hover:scale-105 ${
              isActive(menu.path) 
                ? 'text-yellow-300 font-bold' 
                : 'text-white'
            }`}
            onClick={() => setOpen(false)}
          >
            {menu.name}
            {isActive(menu.path) && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-300 rounded-full animate-expand"></span>
            )}
          </Link>
        ))}
        
        {/* User Profile - Desktop */}
        {isClient && userRole && (
          <div className="relative group">
            <div className="flex items-center cursor-pointer space-x-2 hover:text-yellow-300 transition-colors">
              <div className="w-8 h-8 rounded-full bg-yellow-300 flex items-center justify-center text-purple-800 font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:block">{userName}</span>
            </div>
            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
              <Link 
                href="/profil" 
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors"
                onClick={() => setOpen(false)}
              >
                👤 Profil Saya
              </Link>
              <Link 
                href={userRole === 'admin' ? "/admin/dashboard" : "/user/dashboard"} 
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors"
                onClick={() => setOpen(false)}
              >
                📊 Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors"
              >
                🚪 Keluar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-purple-500/30 transition-colors"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Tutup menu" : "Buka menu"}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* Mobile Menu */}
      {open && isClient && (
        <div 
          className="fixed inset-0 top-16 bg-gradient-to-r from-purple-600 to-indigo-600 flex flex-col p-6 space-y-6 font-semibold shadow-lg z-40"
          role="navigation"
        >
          {menuItems.map((menu) => (
            <Link
              key={menu.name}
              href={menu.path}
              className={`text-xl py-2 border-b border-purple-400/50 transition-colors ${
                isActive(menu.path) 
                  ? 'text-yellow-300 font-bold translate-x-2' 
                  : 'text-white hover:text-yellow-300'
              }`}
              onClick={() => setOpen(false)}
            >
              {menu.name}
            </Link>
          ))}
          
          {/* User Menu - Mobile */}
          {userRole && (
            <div className="mt-4 pt-4 border-t border-purple-400/30 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-yellow-300 flex items-center justify-center text-purple-800 font-bold text-lg">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white">{userName}</p>
                  <p className="text-sm text-purple-200 capitalize">{userRole}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-white hover:text-yellow-300 transition-colors text-lg"
              >
                <span>🚪</span>
                <span>Keluar</span>
              </button>
            </div>
          )}
          
          {/* Menu default untuk mobile jika belum login */}
          {!userRole && (
            <div className="mt-4 pt-4 border-t border-purple-400/30 space-y-3">
              <Link 
                href="/auth/login" 
                className="block text-xl py-2 text-center bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                onClick={() => setOpen(false)}
              >
                Masuk
              </Link>
              <Link 
                href="/auth/register" 
                className="block text-xl py-2 text-center bg-yellow-300 text-purple-800 rounded-lg font-bold hover:bg-yellow-400 transition-colors"
                onClick={() => setOpen(false)}
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}