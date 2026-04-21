import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export async function POST(request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Chỉ hỗ trợ file ảnh (JPEG, PNG, GIF, WebP, SVG)' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File quá lớn (tối đa 5MB)' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const ext = path.extname(file.name) || '.png'
    const uniqueName = `${crypto.randomUUID()}${ext}`

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    // Write file
    const filePath = path.join(uploadsDir, uniqueName)
    await writeFile(filePath, buffer)

    return NextResponse.json({ url: `/uploads/${uniqueName}` })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Lỗi khi upload file' }, { status: 500 })
  }
}
