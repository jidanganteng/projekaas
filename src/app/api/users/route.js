export async function GET(request) {
  try {
    // Ambil data users dari database
    const users = await db.query('SELECT * FROM users ORDER BY created_at DESC');

    return Response.json(users, { status: 200 });
  } catch (error) {
    console.error('API Users Error:', error);
    return Response.json(
      { message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}