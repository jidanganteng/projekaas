"use client";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  
  const getTitle = () => {
    switch(pathname) {
      case '/admin/dashboard': return 'Dashboard Admin';
      case '/admin/books': return 'Manajemen Koleksi Buku';
      case '/admin/approvals': return 'Persetujuan Buku Baru';
      case '/admin/loans': return 'Manajemen Peminjaman';
      case '/admin/users': return 'Manajemen Pengguna';
      default: return 'Admin Panel';
    }
  };
  
  const getSubtitle = () => {
    switch(pathname) {
      case '/admin/dashboard': return 'Overview sistem perpustakaan digital';
      case '/admin/books': return 'Kelola koleksi buku perpustakaan';
      case '/admin/approvals': return 'Setujui atau tolak buku yang diajukan user';
      case '/admin/loans': return 'Kelola semua peminjaman buku';
      case '/admin/users': return 'Kelola data pengguna perpustakaan';
      default: return '';
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="px-8 py-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {getTitle()}
          </h2>
          <p className="text-gray-500 text-sm">
            {getSubtitle()}
          </p>
        </div>
      </div>
    </header>
  );
}