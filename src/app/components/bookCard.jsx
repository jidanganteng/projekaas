"use client";

export default function BookCard({ book }) {
  return (
    <div className="bg-white text-black rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-105 hover:-translate-y-1 hover:shadow-purple-400/50">
      <img
        src={book.cover_image || "/download.jpg"}
        alt={book.title}
        className="h-60 w-full object-cover transition-transform duration-500 hover:scale-110"
      />
      <div className="p-4 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-xl mb-1 text-gray-800">{book.title}</h3>
          <p className="text-gray-600 italic">{book.author}</p>
          <p className="text-gray-500 mt-2">{book.description?.slice(0, 80)}...</p>
        </div>
      </div>
    </div>
  );
}
