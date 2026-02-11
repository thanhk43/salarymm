import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

import { prisma } from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const employee = await prisma.employee.findUnique({ where: { id } })
    if (!employee) {
      return NextResponse.json({ error: 'Không tìm thấy nhân viên' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Vui lòng chọn file' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Chỉ chấp nhận file JPG, PNG hoặc WebP' }, { status: 400 })
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File không được vượt quá 2MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${id}.${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    const filePath = path.join(uploadDir, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const avatarUrl = `/uploads/avatars/${filename}`

    await prisma.employee.update({
      where: { id },
      data: { avatar: avatarUrl },
    })

    return NextResponse.json({ avatar: avatarUrl })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json({ error: 'Không thể tải ảnh lên' }, { status: 500 })
  }
}
