import { Inter } from "next/font/google"
import { Toaster } from "react-hot-toast"
import { Providers } from "@/components/Providers"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata = {
  title: "Aha Kanban",
  description: "Internal Kanban Board",
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={inter.variable}>
        <Toaster position="bottom-right" toastOptions={{
          style: {
            borderRadius: '16px',
            background: '#333',
            color: '#fff',
            fontWeight: '600',
            fontSize: '14px',
          },
        }} />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
