import { NextResponse } from "next/server";

export async function GET() {
	// Minimal stub: return an empty array or sample books.
	// Replace with real DB access (e.g., import from `src/app/lib/db.js`) later.
	const books = [
		{
			id: 1,
			title: "Contoh Buku",
			author: "Penulis Contoh",
			cover_image: "/buku1.jpg",
			description: "Deskripsi singkat contoh buku untuk demonstrasi."
		}
	];

	return NextResponse.json(books);
}
