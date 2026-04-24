'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function updateProfile(data) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const { name, image } = data

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(image !== undefined && { image })
      }
    })

    revalidatePath('/')
    return { success: true, user }
  } catch (error) {
    console.error("Lỗi cập nhật hồ sơ:", error)
    return { error: "Không thể cập nhật hồ sơ" }
  }
}
