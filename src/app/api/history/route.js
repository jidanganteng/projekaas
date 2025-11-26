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
      `SELECT h.id, h.book_id, b.title, b.author, h.action, h.date_borrowed as created_at
       FROM history h
       JOIN books b ON h.book_id = b.id
       WHERE h.user_id = ?
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