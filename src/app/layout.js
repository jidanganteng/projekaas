import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";

// Load fonts terlebih dahulu
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata hanya sekali
export const metadata = {
  title: "My App",
  description: "Example",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
