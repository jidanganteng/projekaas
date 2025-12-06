import { NextResponse } from 'next/server';

const getBooks = () => global.books || [];

export async function POST(request) {
  try {
    console.log('📝 Approve book API called');
    const books = getBooks();
    
    const { bookId } = await request.json();

    if (!bookId) {
      return NextResponse.json(
        { success: false, error: 'Book ID is required' },
        { status: 400 }
      );
    }

    const bookIndex = books.findIndex(book => book.id === parseInt(bookId));
    
    if (bookIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    books[bookIndex] = {
      ...books[bookIndex],
      status: 'approved',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    global.books = books; // Persist changes

    console.log('✅ Book approved:', books[bookIndex]);

    return NextResponse.json({
      success: true,
      message: 'Book approved successfully',
      data: books[bookIndex]
    });

  } catch (error) {
    console.error('❌ Approve book error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to approve book' },
      { status: 500 }
    );
  }
}