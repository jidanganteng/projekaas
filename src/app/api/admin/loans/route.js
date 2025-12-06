// src/app/api/admin/loans/route.js
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function GET() {
  try {
    // ✅ QUERY UNTUK ADMIN - AMBIL SEMUA DATA LOAN DENGAN INFORMASI LENGKAP
    const query = `
      SELECT 
        l.id,
        l.user_id,
        u.name as user_name,
        u.email as user_email,
        l.book_id,
        b.title,
        b.author,
        l.loan_date,
        l.due_date,
        l.return_date,
        l.status,
        l.admin_notes,
        l.approved_at,
        l.approved_by
      FROM loans l
      JOIN users u ON l.user_id = u.id
      JOIN books b ON l.book_id = b.id
      ORDER BY l.loan_date DESC
    `;

    const [rows] = await db.execute(query);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error GET admin loans:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data peminjaman" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { loan_id, action, admin_id, reason, admin_notes } = await request.json();

    // ✅ VALIDASI
    if (!loan_id || !action || !admin_id) {
      return NextResponse.json(
        { error: "loan_id, action, dan admin_id wajib diisi" },
        { status: 400 }
      );
    }

    let message = "";
    let updateQuery = "";
    let queryParams = [];

    switch (action) {
      case "approve":
        // Cek apakah loan exists dan status pending
        const [pendingLoan] = await db.execute(
          "SELECT id FROM loans WHERE id = ? AND status = 'pending'",
          [loan_id]
        );

        if (pendingLoan.length === 0) {
          return NextResponse.json(
            { error: "Pinjaman tidak ditemukan atau sudah diproses" },
            { status: 400 }
          );
        }

        // Update status dan set approved_by
        updateQuery = `
          UPDATE loans 
          SET status = 'approved', approved_by = ?, approved_at = NOW() 
          WHERE id = ?
        `;
        queryParams = [admin_id, loan_id];
        message = "✅ Pinjaman berhasil disetujui";
        break;

      case "reject":
        updateQuery = `
          UPDATE loans 
          SET status = 'rejected', approved_by = ?, approved_at = NOW(), admin_notes = ?
          WHERE id = ? AND status = 'pending'
        `;
        queryParams = [admin_id, reason || 'Ditolak oleh admin', loan_id];
        message = "✅ Pinjaman berhasil ditolak";
        break;

      case "start_borrow":
        updateQuery = `
          UPDATE loans 
          SET status = 'borrowed' 
          WHERE id = ? AND status = 'approved'
        `;
        queryParams = [loan_id];
        message = "✅ Peminjaman berhasil dimulai";
        break;

      case "return":
        // Update loan status dan update book stock
        updateQuery = `
          UPDATE loans 
          SET status = 'returned', return_date = NOW() 
          WHERE id = ? AND status = 'borrowed'
        `;
        queryParams = [loan_id];
        
        // Tambah stock buku
        await db.execute(
          "UPDATE books b JOIN loans l ON b.id = l.book_id SET b.stock = b.stock + 1 WHERE l.id = ?",
          [loan_id]
        );
        
        message = "✅ Buku berhasil dikembalikan";
        break;

      default:
        return NextResponse.json(
          { error: "Aksi tidak valid" },
          { status: 400 }
        );
    }

    const [result] = await db.execute(updateQuery, queryParams);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Gagal memproses peminjaman. Status tidak sesuai." },
        { status: 400 }
      );
    }

    // Log admin action
    await db.execute(
      "INSERT INTO admin_logs (admin_id, action) VALUES (?, ?)",
      [admin_id, `Melakukan aksi ${action} pada pinjaman ID: ${loan_id}`]
    );

    return NextResponse.json({
      success: true,
      message: message,
      data: {
        loan_id: parseInt(loan_id),
        action: action,
        processed_by: admin_id
      }
    });

  } catch (error) {
    console.error("Error PUT admin loans:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server: " + error.message },
      { status: 500 }
    );
  }
}