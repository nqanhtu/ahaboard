import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata = {
  title: "Aha Kanban",
  description: "Internal Kanban Board",
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={inter.variable}>{children}</body>
    </html>
  )
}
