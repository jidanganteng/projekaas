import { db } from "@/app/lib/db";

// =============================
// GET - Hanya untuk halaman PINJAMAN (active & history)
// =============================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const status = searchParams.get("status"); // Filter: active/history

    if (!user_id) {
      return new Response(
        JSON.stringify({ message: "user_id wajib dikirim" }),
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

    // Filter khusus untuk halaman Pinjaman
    let statusValues = ['approved', 'borrowed', 'returned']; // Default: semua pinjaman valid
    if (status) {
      if (status === 'active') {
        statusValues = ['approved', 'borrowed']; // Sedang dipinjam
      } else if (status === 'history') {
        statusValues = ['returned']; // Sudah dikembalikan
      }
    }

    // Tambahkan filter status yang aman
    query += ` AND l.status IN (${statusValues.map(() => '?').join(',')})`;
    params.push(...statusValues);

    query += ` ORDER BY l.loan_date DESC`;

    const [rows] = await db.execute(query, params);
    return Response.json(rows);
  } catch (error) {
    console.error("Error GET loans (pinjaman):", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}

// =============================
// POST - Ajukan peminjaman buku (status: pending)
// =============================
export async function POST(req) {
  // ... kode POST tetap sama seperti sebelumnya ...
  try {
    const { user_id, book_id, days_duration = 7 } = await req.json();

    if (!user_id || !book_id) {
      return new Response(
        JSON.stringify({ message: "user_id dan book_id wajib diisi" }),
        { status: 400 }
      );
    }

    // Cek apakah user sudah meminjam buku ini yang masih aktif
    const [existing] = await db.execute(
      `SELECT id FROM loans 
       WHERE user_id = ? AND book_id = ? AND status IN ('pending', 'approved', 'borrowed')`,
      [user_id, book_id]
    );

    if (existing.length > 0) {
      return new Response(
        JSON.stringify({ message: "⚠️ Anda sudah mengajukan/meminjam buku ini" }),
        { status: 400 }
      );
    }

    // Cek stock buku
    const [book] = await db.execute(
      `SELECT stock, title FROM books WHERE id = ?`,
      [book_id]
    );

    if (book.length === 0) {
      return new Response(
        JSON.stringify({ message: "❌ Buku tidak ditemukan" }),
        { status: 404 }
      );
    }

    if (book[0].stock <= 0) {
      return new Response(
        JSON.stringify({ message: "❌ Stok buku habis" }),
        { status: 400 }
      );
    }

    // Hitung due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(days_duration));

    // Tambahkan peminjaman baru dengan status pending
    const [result] = await db.execute(
      `INSERT INTO loans (user_id, book_id, loan_date, due_date, status)
       VALUES (?, ?, NOW(), ?, 'pending')`,
      [user_id, book_id, dueDate]
    );

    // Tambahkan history
    await db.execute(
      `INSERT INTO history (user_id, book_id, action, date_borrowed)
       VALUES (?, ?, 'pinjam', NOW())`,
      [user_id, book_id]
    );

    // Log admin action
    await db.execute(
      `INSERT INTO admin_logs (admin_id, action)
       VALUES (?, ?)`,
      [user_id, `User mengajukan pinjaman buku: ${book[0].title}`]
    );

    return new Response(
      JSON.stringify({ 
        message: "✅ Berhasil mengajukan pinjaman buku. Menunggu persetujuan admin.", 
        id: result.insertId,
        due_date: dueDate 
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error POST loans:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}

// =============================
// PUT - Update status peminjaman (untuk pengembalian & persetujuan)
// =============================
export async function PUT(req) {
  // ... kode PUT tetap sama seperti sebelumnya ...
  try {
    const { loan_id, action, admin_id, reason } = await req.json();

    if (!loan_id || !action) {
      return new Response(
        JSON.stringify({ message: "loan_id dan action wajib diisi" }),
        { status: 400 }
      );
    }

    let message = "";

    switch (action) {
      case 'return':
        const [loanInfo] = await db.execute(
          `SELECT book_id FROM loans WHERE id = ? AND status = 'borrowed'`,
          [loan_id]
        );

        if (loanInfo.length === 0) {
          return new Response(
            JSON.stringify({ message: "❌ Pinjaman tidak ditemukan atau bukan status borrowed" }),
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

        await db.execute(
          `INSERT INTO history (user_id, book_id, action, date_borrowed)
           SELECT user_id, book_id, 'kembali', NOW() FROM loans WHERE id = ?`,
          [loan_id]
        );

        message = "✅ Buku berhasil dikembalikan";
        break;

      case 'approve':
        if (!admin_id) {
          return new Response(
            JSON.stringify({ message: "admin_id wajib diisi untuk persetujuan" }),
            { status: 400 }
          );
        }

        const [pendingLoan] = await db.execute(
          `SELECT book_id FROM loans WHERE id = ? AND status = 'pending'`,
          [loan_id]
        );

        if (pendingLoan.length === 0) {
          return new Response(
            JSON.stringify({ message: "❌ Pinjaman tidak ditemukan atau sudah diproses" }),
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

        await db.execute(
          `INSERT INTO admin_logs (admin_id, action)
           VALUES (?, ?)`,
          [admin_id, `Menyetujui pinjaman ID: ${loan_id}`]
        );

        message = "✅ Pinjaman berhasil disetujui";
        break;

      case 'reject':
        if (!admin_id) {
          return new Response(
            JSON.stringify({ message: "admin_id wajib diisi untuk penolakan" }),
            { status: 400 }
          );
        }

        await db.execute(
          `UPDATE loans 
           SET status = 'rejected', approved_by = ?, approved_at = NOW(), admin_notes = ?
           WHERE id = ? AND status = 'pending'`,
          [admin_id, reason || 'Ditolak oleh admin', loan_id]
        );

        await db.execute(
          `INSERT INTO admin_logs (admin_id, action)
           VALUES (?, ?)`,
          [admin_id, `Menolak pinjaman ID: ${loan_id} - Alasan: ${reason || 'Tidak disebutkan'}`]
        );

        message = "✅ Pinjaman berhasil ditolak";
        break;

      case 'start_borrow':
        await db.execute(
          `UPDATE loans 
           SET status = 'borrowed'
           WHERE id = ? AND status = 'approved'`,
          [loan_id]
        );

        message = "✅ Peminjaman berhasil dimulai";
        break;

      default:
        return new Response(
          JSON.stringify({ message: "❌ Action tidak valid" }),
          { status: 400 }
        );
    }

    return Response.json({ message });
  } catch (error) {
    console.error("Error PUT loans:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}

// =============================
// DELETE - Batalkan pinjaman (hanya untuk status pending)
// =============================
export async function DELETE(req) {
  // ... kode DELETE tetap sama seperti sebelumnya ...
  try {
    const { searchParams } = new URL(req.url);
    const loan_id = searchParams.get("loan_id");
    const user_id = searchParams.get("user_id");

    if (!loan_id || !user_id) {
      return new Response(
        JSON.stringify({ message: "loan_id dan user_id wajib diisi" }),
        { status: 400 }
      );
    }

    const [result] = await db.execute(
      `DELETE FROM loans 
       WHERE id = ? AND user_id = ? AND status = 'pending'`,
      [loan_id, user_id]
    );

    if (result.affectedRows === 0) {
      return new Response(
        JSON.stringify({ message: "❌ Pinjaman tidak ditemukan atau tidak dapat dibatalkan" }),
        { status: 400 }
      );
    }

    return Response.json({ message: "✅ Pinjaman berhasil dibatalkan" });
  } catch (error) {
    console.error("Error DELETE loans:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}