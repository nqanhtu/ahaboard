import AuthForm from "@/components/AuthForm"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: 'Đăng ký - Aha Kanban',
}

export default async function RegisterPage() {
  const session = await auth()
  if (session) {
    redirect('/')
  }
  
  return <AuthForm type="register" />
}
