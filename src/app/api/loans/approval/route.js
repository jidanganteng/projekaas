import { db } from "@/app/lib/db";

// =============================
// GET - Hanya untuk halaman PERSETUJUAN (pengajuan user)
// =============================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const status = searchParams.get("status"); // Filter: pending/approved/rejected

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

    // Filter khusus untuk halaman Persetujuan
    let statusValues = ['pending', 'approved', 'rejected']; // Default: semua pengajuan
    if (status) {
      if (['pending', 'approved', 'rejected'].includes(status)) {
        statusValues = [status];
      }
    }

    // Tambahkan filter status yang aman
    query += ` AND l.status IN (${statusValues.map(() => '?').join(',')})`;
    params.push(...statusValues);

    query += ` ORDER BY l.loan_date DESC`;

    const [rows] = await db.execute(query, params);
    return Response.json(rows);
  } catch (error) {
    console.error("Error GET approval:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}