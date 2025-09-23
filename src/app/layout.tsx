import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Premier League Stats",
  description: "A website to display Premier League data from 1888/1889 to 2023/2024.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <div className="fixed top-0 left-0 w-full h-full bg-no-repeat bg-cover bg-center" style={{ backgroundImage: `url(/soccer-field-stadium-svgrepo-com.svg)`, zIndex: -1, opacity: 0.15 }}></div>
        <div className="relative flex flex-col min-h-screen z-10">
          <Navbar />
          <main className="flex-grow w-full max-w-7xl mx-auto p-4">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}