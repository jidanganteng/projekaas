// src/app/api/users/route.js
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // ✅ DATA DUMMY UNTUK USERS - HILANGKAN ERROR SAMPAI DATABASE DIPERBAIKI
    const users = [
      {
        id: 1,
        name: "Admin Perpustakaan",
        email: "admin@perpustakaan.id",
        nim_nip: "ADM001",
        is_admin: true,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: "User Demo 1",
        email: "user1@example.com",
        nim_nip: "USR001",
        is_admin: false,
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        name: "User Demo 2", 
        email: "user2@example.com",
        nim_nip: "USR002",
        is_admin: false,
        created_at: new Date().toISOString()
      }
    ];

    return NextResponse.json(users);
  } catch (error) {
    console.error("API Error - Users GET:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Gagal mengambil data user",
        message: process.env.NODE_ENV === 'development' ? error.message : "Terjadi kesalahan server"
      },
      { status: 500 }
    );
  }
}