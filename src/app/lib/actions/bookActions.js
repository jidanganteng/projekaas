// src/lib/actions/bookActions.js

export async function returnBook(bookId) {
  // Simulasi API call atau aksi lainnya
  try {
    const response = await fetch(`/api/books/${bookId}/return`, {
      method: 'POST',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error returning book:', error);
    throw error;
  }
}

// Ekspor fungsi lainnya jika ada