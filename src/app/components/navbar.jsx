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

  // Fungsi logout
  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    localStorage.removeItem("admin_token");
    setUserRole(null);
    setUserName('');
    setOpen(false);
    window.location.href = "/";
  };

  // Jika sedang di halaman landing page "/", tampilkan navbar sederhana
  if (pathname === "/") {
    return (
      <nav className="bg-gradient-to-r from-gray-900 to-black text-white p-4 shadow-xl sticky top-0 z-50 border-b border-purple-700">
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold tracking-wide flex items-center transition-all duration-300 hover:scale-105"
          >
            <div className="mr-3 p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
              <span className="text-white">📚</span>
            </div>
            <span className="bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
              Digital Library
            </span>
          </Link>

          {/* Desktop Menu - Hanya Login & Register */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/auth/login" 
              className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 border border-gray-700 hover:border-purple-500"
            >
              Masuk
            </Link>
            <Link 
              href="/auth/register" 
              className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/30"
            >
              Daftar
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>

          {/* Mobile Menu Overlay */}
          {open && (
            <div className="fixed inset-0 top-16 bg-gray-900/95 backdrop-blur-sm flex flex-col items-center justify-center space-y-6 font-semibold shadow-lg z-40 md:hidden">
              <Link
                href="/auth/login"
                className="text-xl w-48 text-center py-3 border-2 border-purple-500 text-purple-300 rounded-lg hover:bg-purple-500/10 transition-all duration-300"
                onClick={() => setOpen(false)}
              >
                Masuk
              </Link>
              <Link
                href="/auth/register"
                className="text-xl w-48 text-center py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold hover:opacity-90 transition-all duration-300"
                onClick={() => setOpen(false)}
              >
                Daftar
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Menu untuk user biasa
  const userMenu = [
    { name: "Dashboard", path: "/user/dashboard" },
    { name: "Home", path: "/homepage" },
    { name: "History", path: "/history" },
    { name: "Wishlist", path: "/wishlist" },
    { name: "Profil", path: "/profil" },
  ];

  // Menu untuk admin
  const adminFullMenu = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Kelola Buku", path: "/admin/books" },
    { name: "Persetujuan", path: "/admin/approvals" },
    { name: "Pinjaman", path: "/admin/loans" },
    { name: "Profil", path: "/profil" },
  ];

  // Tentukan menu berdasarkan role
  const getMenuItems = () => {
    if (!isClient) return [];
    if (userRole === "admin") return adminFullMenu;
    if (userRole === "user") return userMenu;
    return [];
  };

  const menuItems = getMenuItems();

  // Fungsi untuk menentukan apakah menu aktif
  const isActive = (path) => {
    if (!isClient) return false;
    return pathname === path;
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-black text-white p-4 shadow-xl sticky top-0 z-50 border-b border-purple-700">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold tracking-wide flex items-center transition-all duration-300 hover:scale-105"
          onClick={() => setOpen(false)}
        >
          <div className="mr-3 p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
            <span className="text-white">📚</span>
          </div>
          <span className="bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            Digital Library
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6 font-medium">
          {menuItems.map((menu) => (
            <Link
              key={menu.name}
              href={menu.path}
              className={`relative px-3 py-2 transition-all duration-300 ${
                isActive(menu.path) 
                  ? 'text-purple-300 font-bold' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              } rounded-lg`}
              onClick={() => setOpen(false)}
            >
              {menu.name}
              {isActive(menu.path) && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></span>
              )}
            </Link>
          ))}
          
          {/* User Profile - Desktop */}
          {isClient && userRole && (
            <div className="relative group">
              <div className="flex items-center cursor-pointer space-x-2 px-3 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden lg:block">{userName}</span>
                <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 backdrop-blur-sm border border-gray-700">
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-sm font-semibold text-white">{userName}</p>
                  <p className="text-xs text-gray-400 capitalize">{userRole}</p>
                </div>
                <Link 
                  href="/profil" 
                  className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <span className="mr-2">👤</span>
                  Profil Saya
                </Link>
                <Link 
                  href={userRole === 'admin' ? "/admin/dashboard" : "/user/dashboard"} 
                  className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <span className="mr-2">📊</span>
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-red-900/30 hover:text-red-300 transition-colors border-t border-gray-700"
                >
                  <span className="mr-2">🚪</span>
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>

        {/* Mobile Menu Overlay */}
        {open && isClient && (
          <div className="fixed inset-0 top-16 bg-gray-900/95 backdrop-blur-sm flex flex-col p-6 space-y-6 font-semibold shadow-lg z-40 md:hidden">
            {/* Menu Items */}
            {menuItems.map((menu) => (
              <Link
                key={menu.name}
                href={menu.path}
                className={`text-xl py-3 px-4 rounded-lg transition-all duration-300 ${
                  isActive(menu.path) 
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border-l-4 border-purple-500' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
                onClick={() => setOpen(false)}
              >
                {menu.name}
              </Link>
            ))}
            
            {/* User Info & Logout - Mobile */}
            {userRole && (
              <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                <div className="flex items-center space-x-3 px-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-white">{userName}</p>
                    <p className="text-sm text-gray-400 capitalize">{userRole}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center space-x-2 text-red-300 hover:text-red-200 transition-colors text-lg py-3 px-4 bg-red-900/20 rounded-lg hover:bg-red-900/30"
                >
                  <span>🚪</span>
                  <span>Keluar</span>
                </button>
              </div>
            )}
            
            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}