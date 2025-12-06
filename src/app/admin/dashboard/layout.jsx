"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/sideBar.jsx";

export default function AdminLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const admin = localStorage.getItem("admin");
    if (!admin) {
      router.push("/admin/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}