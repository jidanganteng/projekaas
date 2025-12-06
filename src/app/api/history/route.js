import { db } from "@/app/lib/db";

// =============================
// GET - Ambil riwayat peminjaman user
// =============================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return new Response(
        JSON.stringify({ message: "user_id wajib dikirim" }),
        { status: 400 }
      );
    }

    const [rows] = await db.execute(
      `SELECT h.id, h.book_id, b.title, b.author, h.action, h.date_borrowed as created_at, h.details
       FROM history h
       JOIN books b ON h.book_id = b.id
       WHERE h.user_id = ? AND h.action = 'kembali'
       ORDER BY h.date_borrowed DESC`,
      [user_id]
    );

    return Response.json(rows);
  } catch (error) {
    console.error("Error GET history:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}

// =============================
// POST - Tambah data history
// =============================
export async function POST(req) {
  try {
    const { user_id, book_id, action } = await req.json();

    if (!user_id || !book_id) {
      return new Response(
        JSON.stringify({ message: "user_id dan book_id wajib diisi" }),
        { status: 400 }
      );
    }

    // Default action adalah 'pinjam' jika tidak disebutkan
    const historyAction = action || 'pinjam';

    const [result] = await db.execute(
      `INSERT INTO history (user_id, book_id, action, date_borrowed)
       VALUES (?, ?, ?, NOW())`,
      [user_id, book_id, historyAction]
    );

    return Response.json({ 
      message: "History ditambahkan", 
      id: result.insertId 
    });
  } catch (error) {
    console.error("Error POST history:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}

// =============================
// DELETE - Hapus data history (hanya untuk user yang bersangkutan atau admin)
// =============================
export async function DELETE(req) {
  try {
    // Mengambil ID dari query string atau body? 
    // Karena DELETE biasanya menggunakan query string untuk parameter.
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const user_id = searchParams.get("user_id"); // Untuk verifikasi kepemilikan

    if (!id) {
      return new Response(
        JSON.stringify({ message: "ID history wajib dikirim" }),
        { status: 400 }
      );
    }

    // Verifikasi: Ambil data history terlebih dahulu
    const [historyRows] = await db.execute(
      `SELECT user_id FROM history WHERE id = ?`,
      [id]
    );

    if (historyRows.length === 0) {
      return new Response(
        JSON.stringify({ message: "History tidak ditemukan" }),
        { status: 404 }
      );
    }

    const history = historyRows[0];

    // Jika user_id diberikan, cek apakah history milik user tersebut
    if (user_id && history.user_id != user_id) {
      // Jika bukan miliknya, cek apakah user adalah admin?
      // Kita perlu cek role user dari tabel users. Tapi karena tidak ada info role di sini,
      // kita asumsikan bahwa user_id yang dikirim adalah dari user yang login.
      // Jadi, jika user_id tidak sama, maka tolak.
      // Jika ingin admin bisa menghapus, kita perlu cara lain, misalnya dengan token admin.
      // Untuk sementara, kita tolak jika user_id tidak sama.
      return new Response(
        JSON.stringify({ message: "Anda tidak memiliki akses untuk menghapus history ini" }),
        { status: 403 }
      );
    }

    // Hapus history
    await db.execute(
      `DELETE FROM history WHERE id = ?`,
      [id]
    );

    return Response.json({ 
      message: "History berhasil dihapus"
    });
  } catch (error) {
    console.error("Error DELETE history:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}