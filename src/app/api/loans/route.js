import { db } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const status = searchParams.get("status"); // Filter: active/history/pending atau nilai status spesifik

    if (!user_id) {
      return NextResponse.json(
        { success: false, message: "user_id wajib dikirim" },
        { status: 400 }
      );
    }

    // ✅ VALIDASI: Pastikan user_id numeric
    if (isNaN(user_id)) {
      return NextResponse.json(
        { success: false, message: "user_id harus berupa angka" },
        { status: 400 }
      );
    }

    let query = `
      SELECT 
        l.id, 
        l.book_id, 
        b.title, 
        b.author, 
        b.cover_image,
        l.loan_date, 
        l.due_date,
        l.return_date,
        l.status,
        l.admin_notes,
        l.approved_at,
        c.name as category_name
      FROM loans l
      JOIN books b ON l.book_id = b.id
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE l.user_id = ?
    `;

    const params = [user_id];

    // Filter berdasarkan status
    let statusValues = [];
    if (status) {
      if (status === 'active') {
        statusValues = ['approved', 'borrowed'];
      } else if (status === 'history') {
        statusValues = ['returned'];
      } else if (status === 'pending') {
        statusValues = ['pending'];
      } else {
        // Jika status lain, kita anggap sebagai satu nilai status
        statusValues = [status];
      }
    } else {
      // Jika tidak ada status, kita ambil semua status
      statusValues = ['pending', 'approved', 'borrowed', 'returned'];
    }

    // Tambahkan filter status yang aman
    query += ` AND l.status IN (${statusValues.map(() => '?').join(',')})`;
    params.push(...statusValues);

    query += ` ORDER BY l.loan_date DESC`;

    const [rows] = await db.execute(query, params);
    
    return NextResponse.json({
      success: true,
      data: rows,
      total: rows.length
    });
    
  } catch (error) {
    console.error("Error GET loans:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Gagal mengambil data peminjaman",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
// =============================
// POST - Ajukan peminjaman buku (status: pending)
// =============================
export async function POST(req) {
  try {
    const { user_id, book_id, days_duration = 7 } = await req.json();

    // ✅ VALIDASI LENGKAP
    if (!user_id || !book_id) {
      return NextResponse.json(
        { success: false, message: "user_id dan book_id wajib diisi" },
        { status: 400 }
      );
    }

    if (isNaN(user_id) || isNaN(book_id)) {
      return NextResponse.json(
        { success: false, message: "user_id dan book_id harus berupa angka" },
        { status: 400 }
      );
    }

    // 1. Cek apakah user exists
    const [userCheck] = await db.execute(
      "SELECT id FROM users WHERE id = ?",
      [user_id]
    );

    if (userCheck.length === 0) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // 2. Cek apakah buku exists dan approved
    const [book] = await db.execute(
      `SELECT id, title, stock, status FROM books WHERE id = ?`,
      [book_id]
    );

    if (book.length === 0) {
      return NextResponse.json(
        { success: false, message: "Buku tidak ditemukan" },
        { status: 404 }
      );
    }

    if (book[0].status !== 'approved') {
      return NextResponse.json(
        { success: false, message: "Buku belum disetujui untuk dipinjam" },
        { status: 400 }
      );
    }

    if (book[0].stock <= 0) {
      return NextResponse.json(
        { success: false, message: "Stok buku habis" },
        { status: 400 }
      );
    }

    // 3. Cek apakah user sudah meminjam buku ini yang masih aktif
    const [existing] = await db.execute(
      `SELECT id FROM loans 
       WHERE user_id = ? AND book_id = ? AND status IN ('pending', 'approved', 'borrowed')`,
      [user_id, book_id]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: "Anda sudah mengajukan/meminjam buku ini" },
        { status: 400 }
      );
    }

    // 4. Hitung due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(days_duration));

    // 5. Tambahkan peminjaman baru dengan status pending
    const [result] = await db.execute(
      `INSERT INTO loans (user_id, book_id, loan_date, due_date, status)
       VALUES (?, ?, NOW(), ?, 'pending')`,
      [user_id, book_id, dueDate]
    );

    // 6. Kurangi stok buku (optional - tergantung kebijakan)
     await db.execute(
       "UPDATE books SET stock = stock - 1 WHERE id = ?",
       [book_id]
    );

    // 7. Tambahkan history jika tabel exists
    try {
      await db.execute(
        `INSERT INTO history (user_id, book_id, action, date_borrowed)
         VALUES (?, ?, 'pinjam', NOW())`,
        [user_id, book_id]
      );
    } catch (historyError) {
      console.warn("Tabel history tidak tersedia:", historyError.message);
    }

    // 8. Log admin action jika tabel exists
    try {
      await db.execute(
        `INSERT INTO admin_logs (admin_id, action)
         VALUES (?, ?)`,
        [user_id, `User mengajukan pinjaman buku: ${book[0].title}`]
      );
    } catch (logError) {
      console.warn("Tabel admin_logs tidak tersedia:", logError.message);
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Berhasil mengajukan pinjaman buku. Menunggu persetujuan admin.", 
        data: {
          id: result.insertId,
          due_date: dueDate 
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error POST loans:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Gagal mengajukan peminjaman",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// =============================
// PUT - Update status peminjaman
// =============================
export async function PUT(req) {
  try {
    const { loan_id, action, admin_id, reason } = await req.json();

    // ✅ VALIDASI
    if (!loan_id || !action) {
      return NextResponse.json(
        { success: false, message: "loan_id dan action wajib diisi" },
        { status: 400 }
      );
    }

    if (isNaN(loan_id)) {
      return NextResponse.json(
        { success: false, message: "loan_id harus berupa angka" },
        { status: 400 }
      );
    }

    let message = "";
    let success = true;

    switch (action) {
      case 'return':
        const [loanInfo] = await db.execute(
          `SELECT book_id FROM loans WHERE id = ? AND status = 'borrowed'`,
          [loan_id]
        );

        if (loanInfo.length === 0) {
          return NextResponse.json(
            { success: false, message: "Pinjaman tidak ditemukan atau bukan status borrowed" },
            { status: 400 }
          );
        }

        await db.execute(
          `UPDATE loans 
           SET status = 'returned', return_date = NOW()
           WHERE id = ?`,
          [loan_id]
        );

        await db.execute(
          `UPDATE books SET stock = stock + 1 WHERE id = ?`,
          [loanInfo[0].book_id]
        );

        message = "Buku berhasil dikembalikan";
        break;

      case 'approve':
        if (!admin_id) {
          return NextResponse.json(
            { success: false, message: "admin_id wajib diisi untuk persetujuan" },
            { status: 400 }
          );
        }

        const [pendingLoan] = await db.execute(
          `SELECT book_id FROM loans WHERE id = ? AND status = 'pending'`,
          [loan_id]
        );

        if (pendingLoan.length === 0) {
          return NextResponse.json(
            { success: false, message: "Pinjaman tidak ditemukan atau sudah diproses" },
            { status: 400 }
          );
        }

        await db.execute(
          `UPDATE books SET stock = stock - 1 WHERE id = ? AND stock > 0`,
          [pendingLoan[0].book_id]
        );

        await db.execute(
          `UPDATE loans 
           SET status = 'approved', approved_by = ?, approved_at = NOW()
           WHERE id = ?`,
          [admin_id, loan_id]
        );

        message = "Pinjaman berhasil disetujui";
        break;

      case 'reject':
        if (!admin_id) {
          return NextResponse.json(
            { success: false, message: "admin_id wajib diisi untuk penolakan" },
            { status: 400 }
          );
        }

        const [rejectResult] = await db.execute(
          `UPDATE loans 
           SET status = 'rejected', approved_by = ?, approved_at = NOW(), admin_notes = ?
           WHERE id = ? AND status = 'pending'`,
          [admin_id, reason || 'Ditolak oleh admin', loan_id]
        );

        if (rejectResult.affectedRows === 0) {
          return NextResponse.json(
            { success: false, message: "Pinjaman tidak ditemukan atau sudah diproses" },
            { status: 400 }
          );
        }

        message = "Pinjaman berhasil ditolak";
        break;

      case 'start_borrow':
        const [borrowResult] = await db.execute(
          `UPDATE loans 
           SET status = 'borrowed'
           WHERE id = ? AND status = 'approved'`,
          [loan_id]
        );

        if (borrowResult.affectedRows === 0) {
          return NextResponse.json(
            { success: false, message: "Pinjaman tidak ditemukan atau status tidak sesuai" },
            { status: 400 }
          );
        }

        message = "Peminjaman berhasil dimulai";
        break;

      default:
        return NextResponse.json(
          { success: false, message: "Action tidak valid" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error("Error PUT loans:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Gagal memproses peminjaman",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// =============================
// DELETE - Batalkan pinjaman
// =============================
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const loan_id = searchParams.get("loan_id");
    const user_id = searchParams.get("user_id");

    if (!loan_id || !user_id) {
      return NextResponse.json(
        { success: false, message: "loan_id dan user_id wajib diisi" },
        { status: 400 }
      );
    }

    if (isNaN(loan_id) || isNaN(user_id)) {
      return NextResponse.json(
        { success: false, message: "loan_id dan user_id harus berupa angka" },
        { status: 400 }
      );
    }

    const [result] = await db.execute(
      `DELETE FROM loans 
       WHERE id = ? AND user_id = ? AND status = 'pending'`,
      [loan_id, user_id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "Pinjaman tidak ditemukan atau tidak dapat dibatalkan" },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Pinjaman berhasil dibatalkan" 
    });
  } catch (error) {
    console.error("Error DELETE loans:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Gagal membatalkan peminjaman",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}