import { NextResponse } from 'next/server';

const getBooks = () => global.books || [];

export async function PUT(request, { params }) {
  try {
    const books = getBooks();
    const id = parseInt(params.id);
    const formData = await request.formData();
    
    const title = formData.get('title');
    const author = formData.get('author');
    const year = formData.get('year');
    const stock = formData.get('stock');

    const bookIndex = books.findIndex(book => book.id === id);
    if (bookIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    books[bookIndex] = {
      ...books[bookIndex],
      title: title || books[bookIndex].title,
      author: author || books[bookIndex].author,
      year: year || books[bookIndex].year,
      stock: stock ? parseInt(stock) : books[bookIndex].stock,
      updated_at: new Date().toISOString()
    };
    
    global.books = books; // Persist changes

    return NextResponse.json({
      success: true,
      message: 'Book updated successfully',
      data: books[bookIndex]
    });

  } catch (error) {
    console.error('❌ Update book error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update book' },
      { status: 500 }
    );
  }
}