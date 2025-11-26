import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file) {
      return Response.json({ error: "No file" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = Date.now() + "-" + file.name;

    const filePath = path.join(process.cwd(), "public/uploads", fileName);

    await writeFile(filePath, buffer);

    return Response.json({
      url: "/uploads/" + fileName,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
const [coverImage, setCoverImage] = useState("");

const handleUpload = async (e) => {
  const file = e.target.files[0];

  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  setCoverImage(data.url);
};
const handleSubmit = async (e) => {
  e.preventDefault();

  const res = await fetch("/api/books", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      author,
      description,
      year,
      cover_image: coverImage // <-- URL dari upload
    })
  });

  const data = await res.json();
  alert("Buku berhasil ditambah!");
};

