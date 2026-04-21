'use server'

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"

export async function register(formData) {
  const username = formData.get("username")
  const name = formData.get("name")
  const password = formData.get("password")

  if (!username || !name || !password) {
    return { error: "Vui lòng nhập đầy đủ thông tin" }
  }

  const existingUser = await prisma.user.findUnique({
    where: { username }
  })

  if (existingUser) {
    return { error: "Tên đăng nhập đã tồn tại" }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      username,
      name,
      password: hashedPassword
    }
  })

  return { success: "Đăng ký thành công! Vui lòng đăng nhập." }
}

export async function authenticate(prevState, formData) {
  try {
    const data = Object.fromEntries(formData.entries());
    const result = await signIn("credentials", {
      ...data,
      redirect: false
    });
    
    // Nếu signIn(redirect: false) thành công, nó sẽ trả về url để redirect
    // hoặc có thể nó không throw error.
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Sai tên đăng nhập hoặc mật khẩu." }
        default:
          return { error: "Đã có lỗi xảy ra." }
      }
    }
    // throw redirect error nếu NextAuth vẫn throw
    throw error
  }
}

export async function handleSignOut() {
  await signOut()
}
