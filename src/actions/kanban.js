'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function getBoards() {
  const session = await auth()
  if (!session) return []
  return prisma.board.findMany()
}

export async function getBoardData(boardId) {
  const session = await auth()
  if (!session) return null

  // For MVP, if no boardId is provided, get the first board
  let board = await prisma.board.findFirst({
    where: boardId ? { id: boardId } : undefined,
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: {
          cards: {
            orderBy: { order: 'asc' },
            include: {
              assignee: {
                select: { id: true, name: true, username: true }
              }
            }
          }
        }
      }
    }
  })

  // Fallback to first board if not found
  if (!board && boardId) {
    board = await prisma.board.findFirst({
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              orderBy: { order: 'asc' },
              include: {
                assignee: {
                  select: { id: true, name: true, username: true }
                }
              }
            }
          }
        }
      }
    })
  }

  return board
}

export async function createCard(data) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const { title, description, columnId } = data
  
  if (!title || !columnId) {
    return { error: "Thiếu thông tin" }
  }

  // Get current max order
  const maxOrderCard = await prisma.card.findFirst({
    where: { columnId },
    orderBy: { order: 'desc' }
  })

  const newOrder = maxOrderCard ? maxOrderCard.order + 1 : 0

  // Get board info to generate displayId
  const column = await prisma.column.findUnique({ where: { id: columnId }, select: { boardId: true } })
  const board = await prisma.board.update({
    where: { id: column.boardId },
    data: { cardCounter: { increment: 1 } }
  })
  const displayId = `${board.prefix}-${board.cardCounter}`

  const card = await prisma.card.create({
    data: {
      title,
      description,
      displayId,
      order: newOrder,
      columnId,
      assigneeId: session.user.id
    },
    include: {
      assignee: {
        select: { id: true, name: true, username: true }
      }
    }
  })

  await logActivity(`đã tạo thẻ`, `${displayId} ${title}`, session.user.id)

  return { success: true, card }
}

export async function updateCardOrder(cardsData) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  try {
    // using a transaction to update all affected cards
    await prisma.$transaction(
      cardsData.map((card) => 
        prisma.card.update({
          where: { id: card.id },
          data: {
            order: card.order,
            columnId: card.columnId
          }
        })
      )
    )
    
    // Only log if it's a drag to another column or specific reorder
    if (cardsData.length > 0) {
      await logActivity(`đã di chuyển/sắp xếp thẻ`, cardsData[0].title || "nhiều thẻ", session.user.id)
    }

    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Lỗi cập nhật thứ tự" }
  }
}

export async function updateCardDetails(cardId, data) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const { title, description, assigneeId } = data
  if (!title) {
    return { error: "Tiêu đề không được để trống" }
  }

  try {
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        title,
        description,
        ...(assigneeId !== undefined && { assigneeId })
      },
      include: {
        assignee: {
          select: { id: true, name: true, username: true }
        }
      }
    })
    
    await logActivity(`đã cập nhật thẻ`, title, session.user.id)
    
    return { success: true, card: updatedCard }
  } catch (error) {
    console.error(error)
    return { error: "Lỗi cập nhật thẻ" }
  }
}

export async function getUsers() {
  const session = await auth()
  if (!session) return []

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true
    },
    orderBy: {
      name: 'asc'
    }
  })
  
  return users
}

export async function deleteCard(cardId) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  try {
    const card = await prisma.card.findUnique({ where: { id: cardId } })
    if (card) {
      await prisma.card.delete({
        where: { id: cardId }
      })
      await logActivity(`đã xóa thẻ`, card.title, session.user.id)
    }
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Lỗi khi xóa thẻ" }
  }
}

async function logActivity(action, entityTitle, userId) {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        entityTitle,
        userId
      }
    })
  } catch (error) {
    console.error("Lỗi ghi log:", error)
  }
}

export async function getHistory() {
  const session = await auth()
  if (!session) return []

  const logs = await prisma.activityLog.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 50,
    include: {
      user: {
        select: { id: true, name: true, username: true }
      }
    }
  })
  
  return logs
}

export async function createBoard(data) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const { title, prefix } = data
  if (!title) {
    return { error: "Tiêu đề bảng không được để trống" }
  }

  const pfx = prefix || title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || "B"

  try {
    const board = await prisma.board.create({
      data: {
        title,
        prefix: pfx,
        cardCounter: 0,
      }
    })

    const columns = [
      { title: "Chưa làm", order: 0 },
      { title: "Cần làm", order: 1 },
      { title: "Đang làm", order: 2 },
      { title: "Hoàn thành", order: 3 },
    ]

    await prisma.$transaction(
      columns.map(col => 
        prisma.column.create({
          data: {
            title: col.title,
            order: col.order,
            boardId: board.id
          }
        })
      )
    )

    await logActivity(`đã tạo bảng`, title, session.user.id)

    return { success: true, board }
  } catch (error) {
    console.error(error)
    return { error: "Lỗi khi tạo bảng" }
  }
}
