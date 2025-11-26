import { db } from "@/app/lib/db.js";


// =============================
// GET - Ambil daftar favorit user
// =============================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const book_id = searchParams.get("book_id");

    if (!user_id) {
      return new Response(
        JSON.stringify({ message: "user_id wajib dikirim" }),
        { status: 400 }
      );
    }

    // Jika ada book_id, cek apakah buku sudah difavoritkan
    if (book_id) {
      try {
        const [isFavorited] = await db.execute(
          `SELECT f.id, f.created_at
           FROM favorites f
           WHERE f.user_id = ? AND f.book_id = ?`,
          [user_id, book_id]
        );

        return Response.json({
          is_favorited: isFavorited.length > 0,
          favorite_data: isFavorited.length > 0 ? isFavorited[0] : null
        });
      } catch (error) {
        console.error("Error checking favorite status:", error);
        return new Response(
          JSON.stringify({ message: "Error checking favorite status" }),
          { status: 500 }
        );
      }
    }

    // Ambil semua favorit user dengan informasi lengkap
    try {
      const [rows] = await db.execute(
        `SELECT 
          f.id, 
          f.book_id, 
          b.title, 
          b.author, 
          b.year, 
          b.cover_image,
          b.description,
          c.name as category_name,
          b.stock as book_stock,
          f.created_at
         FROM favorites f
         JOIN books b ON f.book_id = b.id
         LEFT JOIN categories c ON b.category_id = c.id
         WHERE f.user_id = ?
         ORDER BY f.created_at DESC`,
        [user_id]
      );

      return Response.json(rows);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      
      // Fallback: coba query sederhana tanpa join yang kompleks
      try {
        const [simpleRows] = await db.execute(
          `SELECT f.id, f.book_id, b.title, b.author, b.cover_image
           FROM favorites f
           JOIN books b ON f.book_id = b.id
           WHERE f.user_id = ?
           ORDER BY f.created_at DESC`,
          [user_id]
        );
        
        return Response.json(simpleRows);
      } catch (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        return new Response(
          JSON.stringify({ message: "Failed to fetch favorites" }),
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error("Error in GET favorites:", error);
    return new Response(
      JSON.stringify({ 
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      { status: 500 }
    );
  }
}

// =============================
// POST - Tambah buku ke favorit
// =============================
export async function POST(req) {
  try {
    const body = await req.json();
    
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ message: "Invalid request body" }),
        { status: 400 }
      );
    }

    const { user_id, book_id } = body;

    if (!user_id || !book_id) {
      return new Response(
        JSON.stringify({ message: "user_id dan book_id wajib diisi" }),
        { status: 400 }
      );
    }

    // Validasi tipe data
    if (isNaN(parseInt(user_id)) || isNaN(parseInt(book_id))) {
      return new Response(
        JSON.stringify({ message: "user_id dan book_id harus berupa angka" }),
        { status: 400 }
      );
    }

    // Cek apakah user exists
    try {
      const [userExists] = await db.execute(
        `SELECT id FROM users WHERE id = ?`,
        [user_id]
      );

      if (userExists.length === 0) {
        return new Response(
          JSON.stringify({ message: "❌ User tidak ditemukan" }),
          { status: 404 }
        );
      }
    } catch (error) {
      console.error("Error checking user:", error);
      return new Response(
        JSON.stringify({ message: "Error validating user" }),
        { status: 500 }
      );
    }

    // Cek apakah buku exists
    try {
      const [bookExists] = await db.execute(
        `SELECT id, title FROM books WHERE id = ?`,
        [book_id]
      );

      if (bookExists.length === 0) {
        return new Response(
          JSON.stringify({ message: "❌ Buku tidak ditemukan" }),
          { status: 404 }
        );
      }

      // Cek apakah buku sudah ada di favorit
      const [existing] = await db.execute(
        `SELECT id FROM favorites 
         WHERE user_id = ? AND book_id = ?`,
        [user_id, book_id]
      );

      if (existing.length > 0) {
        return new Response(
          JSON.stringify({ message: "⚠️ Buku sudah ada di favorit Anda" }),
          { status: 400 }
        );
      }

      // Tambahkan ke favorit
      const [result] = await db.execute(
        `INSERT INTO favorites (user_id, book_id, created_at)
         VALUES (?, ?, NOW())`,
        [user_id, book_id]
      );

      // Tambahkan ke history jika tabel history ada
      try {
        await db.execute(
          `INSERT INTO history (user_id, book_id, action, date_borrowed)
           VALUES (?, ?, 'favorit', NOW())`,
          [user_id, book_id]
        );
      } catch (historyError) {
        console.warn("Could not add to history:", historyError);
        // Continue even if history fails
      }

      return new Response(
        JSON.stringify({ 
          message: "✅ Berhasil menambahkan ke favorit", 
          id: result.insertId,
          book_title: bookExists[0].title
        }),
        { status: 201 }
      );

    } catch (error) {
      console.error("Error in favorite creation:", error);
      
      // Check if it's a duplicate entry error
      if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate')) {
        return new Response(
          JSON.stringify({ message: "⚠️ Buku sudah ada di favorit Anda" }),
          { status: 400 }
        );
      }
      
      return new Response(
        JSON.stringify({ message: "Error creating favorite" }),
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error in POST favorites:", error);
    return new Response(
      JSON.stringify({ 
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      { status: 500 }
    );
  }
}

// =============================
// DELETE - Hapus dari favorit
// =============================
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const favorite_id = searchParams.get("id");
    const user_id = searchParams.get("user_id");
    const book_id = searchParams.get("book_id");

    // Validasi parameter
    if (!favorite_id && (!user_id || !book_id)) {
      return new Response(
        JSON.stringify({ 
          message: "❌ Parameter tidak valid. Gunakan id ATAU user_id dan book_id" 
        }),
        { status: 400 }
      );
    }

    // Method 1: Hapus berdasarkan favorite_id
    if (favorite_id) {
      if (isNaN(parseInt(favorite_id))) {
        return new Response(
          JSON.stringify({ message: "❌ favorite_id harus berupa angka" }),
          { status: 400 }
        );
      }

      try {
        const [result] = await db.execute(
          `DELETE FROM favorites WHERE id = ?`,
          [favorite_id]
        );

        if (result.affectedRows === 0) {
          return new Response(
            JSON.stringify({ message: "❌ Favorit tidak ditemukan" }),
            { status: 404 }
          );
        }

        return Response.json({ message: "✅ Berhasil menghapus dari favorit" });
      } catch (error) {
        console.error("Error deleting by favorite_id:", error);
        return new Response(
          JSON.stringify({ message: "Error deleting favorite" }),
          { status: 500 }
        );
      }
    }

    // Method 2: Hapus berdasarkan user_id dan book_id
    if (user_id && book_id) {
      if (isNaN(parseInt(user_id)) || isNaN(parseInt(book_id))) {
        return new Response(
          JSON.stringify({ message: "❌ user_id dan book_id harus berupa angka" }),
          { status: 400 }
        );
      }

      try {
        const [result] = await db.execute(
          `DELETE FROM favorites WHERE user_id = ? AND book_id = ?`,
          [user_id, book_id]
        );

        if (result.affectedRows === 0) {
          return new Response(
            JSON.stringify({ message: "❌ Favorit tidak ditemukan" }),
            { status: 404 }
          );
        }

        return Response.json({ message: "✅ Berhasil menghapus dari favorit" });
      } catch (error) {
        console.error("Error deleting by user_id and book_id:", error);
        return new Response(
          JSON.stringify({ message: "Error deleting favorite" }),
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error("Error in DELETE favorites:", error);
    return new Response(
      JSON.stringify({ 
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      { status: 500 }
    );
  }
}

// =============================
// Simple PATCH untuk toggle favorit
// =============================
export async function PATCH(req) {
  try {
    const { user_id, book_id, action } = await req.json();

    if (!user_id || !book_id || !action) {
      return new Response(
        JSON.stringify({ message: "user_id, book_id, dan action wajib diisi" }),
        { status: 400 }
      );
    }

    if (action === 'toggle') {
      // Cek apakah sudah difavoritkan
      const [existing] = await db.execute(
        `SELECT id FROM favorites WHERE user_id = ? AND book_id = ?`,
        [user_id, book_id]
      );

      if (existing.length > 0) {
        // Hapus dari favorit
        await db.execute(
          `DELETE FROM favorites WHERE user_id = ? AND book_id = ?`,
          [user_id, book_id]
        );
        return Response.json({ 
          message: "✅ Berhasil menghapus dari favorit",
          is_favorited: false
        });
      } else {
        // Tambah ke favorit
        // Cek dulu apakah buku exists
        const [bookExists] = await db.execute(
          `SELECT id FROM books WHERE id = ?`,
          [book_id]
        );

        if (bookExists.length === 0) {
          return new Response(
            JSON.stringify({ message: "❌ Buku tidak ditemukan" }),
            { status: 404 }
          );
        }

        await db.execute(
          `INSERT INTO favorites (user_id, book_id, created_at) VALUES (?, ?, NOW())`,
          [user_id, book_id]
        );

        return Response.json({ 
          message: "✅ Berhasil menambahkan ke favorit",
          is_favorited: true
        });
      }
    } else {
      return new Response(
        JSON.stringify({ message: "❌ Action tidak valid. Gunakan 'toggle'" }),
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error in PATCH favorites:", error);
    return new Response(
      JSON.stringify({ 
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      { status: 500 }
    );
  }
}