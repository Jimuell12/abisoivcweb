import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "./header";
import Sidebar from "./sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Abiso IVC",
  description: "Abiso IVC",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-screen w-full overflow-hidden bg-gradient-radial from-blue-100 to-white backdrop-blur-3xl text-[#121212]">
        <div className="grid lg:grid-cols-8 h-screen">
          <main className="lg:col-span-2">
            <Sidebar />
          </main>
          <aside className="lg:col-span-6">
            {children}
          </aside>
        </div>
      </body>
    </html>
  );
}
