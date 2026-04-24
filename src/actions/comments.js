'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function addComment(cardId, content) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        cardId,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        }
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'added a comment to',
        entityTitle: (await prisma.card.findUnique({ where: { id: cardId } }))?.title || 'a card',
        userId: session.user.id
      }
    })

    return { success: true, comment }
  } catch (error) {
    console.error('Add comment error:', error)
    return { error: 'Failed to add comment' }
  }
}

export async function deleteComment(commentId) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) return { error: 'Comment not found' }
    if (comment.userId !== session.user.id) return { error: 'Forbidden' }

    await prisma.comment.delete({
      where: { id: commentId }
    })

    return { success: true }
  } catch (error) {
    console.error('Delete comment error:', error)
    return { error: 'Failed to delete comment' }
  }
}

export async function getComments(cardId) {
  try {
    const comments = await prisma.comment.findMany({
      where: { cardId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return { success: true, comments }
  } catch (error) {
    console.error('Get comments error:', error)
    return { error: 'Failed to fetch comments' }
  }
}
