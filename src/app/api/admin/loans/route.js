import { db } from "@/app/lib/db";

// =============================
// GET - Dashboard Admin (semua pinjaman)
// =============================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // Filter: active/pending/history/all

    let query = `
      SELECT 
        l.id, 
        l.user_id,
        u.name as user_name,
        u.email as user_email,
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
      JOIN users u ON l.user_id = u.id
      JOIN books b ON l.book_id = b.id
      LEFT JOIN categories c ON b.category_id = c.id
    `;

    let params = [];
    let whereClause = [];

    // Filter berdasarkan status
    if (status) {
      if (status === 'active') {
        whereClause.push(`l.status IN ('approved', 'borrowed')`);
      } else if (status === 'pending') {
        whereClause.push(`l.status = 'pending'`);
      } else if (status === 'history') {
        whereClause.push(`l.status IN ('returned', 'rejected')`);
      } else if (status !== 'all') {
        whereClause.push(`l.status = ?`);
        params.push(status);
      }
    }

    if (whereClause.length > 0) {
      query += ` WHERE ${whereClause.join(' AND ')}`;
    }

    query += ` ORDER BY l.loan_date DESC`;

    const [rows] = await db.execute(query, params);
    return Response.json(rows);
  } catch (error) {
    console.error("Error GET admin loans:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}