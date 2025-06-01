import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db, lists, listMembers, users, contents } from '../db'
import { eq, and, desc, count } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'

const listRoutes = new Hono()

// 認証が必要なルートにミドルウェアを適用
listRoutes.use('*', authMiddleware)

// リスト作成スキーマ
const createListSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
})

// リスト更新スキーマ
const updateListSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
})

// メンバー招待スキーマ
const inviteMemberSchema = z.object({
  email: z.string().email(),
})

// リスト作成
listRoutes.post('/', zValidator('json', createListSchema), async (c) => {
  try {
    const user = c.get('user')
    const { title, description, isPublic } = c.req.valid('json')

    // 無料プランの制限チェック
    if (!user.isPremium) {
      const userListsCount = await db.select({ count: count() })
        .from(lists)
        .where(eq(lists.ownerId, user.id))
      
      if (userListsCount[0].count >= 10) {
        return c.json({ error: '無料プランでは10個までのリストしか作成できません' }, 403)
      }
    }

    const [newList] = await db.insert(lists).values({
      title,
      description,
      isPublic,
      ownerId: user.id,
    }).returning()

    // オーナーをメンバーとして追加
    await db.insert(listMembers).values({
      listId: newList.id,
      userId: user.id,
      role: 'owner',
    })

    return c.json({
      success: true,
      list: newList,
    })
  } catch (error) {
    console.error('Create list error:', error)
    return c.json({ error: 'リストの作成に失敗しました' }, 500)
  }
})

// ユーザーのリスト一覧取得
listRoutes.get('/', async (c) => {
  try {
    const user = c.get('user')

    const userLists = await db.query.listMembers.findMany({
      where: eq(listMembers.userId, user.id),
      with: {
        list: {
          with: {
            owner: true,
            contents: {
              orderBy: [desc(contents.createdAt)],
              limit: 1, // 最新のコンテンツ1つだけ取得（サムネイル用）
            },
          },
        },
      },
      orderBy: [desc(listMembers.joinedAt)],
    })

    const formattedLists = userLists.map(membership => ({
      ...membership.list,
      role: membership.role,
      latestContent: membership.list.contents[0] || null,
    }))

    return c.json({
      success: true,
      lists: formattedLists,
    })
  } catch (error) {
    console.error('Get lists error:', error)
    return c.json({ error: 'リストの取得に失敗しました' }, 500)
  }
})

// 特定のリスト取得
listRoutes.get('/:id', async (c) => {
  try {
    const user = c.get('user')
    const listId = c.req.param('id')

    // ユーザーがこのリストのメンバーかチェック
    const membership = await db.query.listMembers.findFirst({
      where: and(
        eq(listMembers.listId, listId),
        eq(listMembers.userId, user.id)
      ),
    })

    if (!membership) {
      return c.json({ error: 'このリストにアクセスする権限がありません' }, 403)
    }

    const list = await db.query.lists.findFirst({
      where: eq(lists.id, listId),
      with: {
        owner: true,
        members: {
          with: {
            user: true,
          },
        },
        contents: {
          with: {
            addedByUser: true,
            reactions: {
              with: {
                user: true,
              },
            },
          },
          orderBy: [contents.order, desc(contents.createdAt)],
        },
      },
    })

    if (!list) {
      return c.json({ error: 'リストが見つかりません' }, 404)
    }

    return c.json({
      success: true,
      list: {
        ...list,
        userRole: membership.role,
      },
    })
  } catch (error) {
    console.error('Get list error:', error)
    return c.json({ error: 'リストの取得に失敗しました' }, 500)
  }
})

// リスト更新
listRoutes.put('/:id', zValidator('json', updateListSchema), async (c) => {
  try {
    const user = c.get('user')
    const listId = c.req.param('id')
    const updates = c.req.valid('json')

    // オーナーかチェック
    const list = await db.query.lists.findFirst({
      where: eq(lists.id, listId),
    })

    if (!list || list.ownerId !== user.id) {
      return c.json({ error: 'このリストを編集する権限がありません' }, 403)
    }

    const [updatedList] = await db.update(lists)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(lists.id, listId))
      .returning()

    return c.json({
      success: true,
      list: updatedList,
    })
  } catch (error) {
    console.error('Update list error:', error)
    return c.json({ error: 'リストの更新に失敗しました' }, 500)
  }
})

// リスト削除
listRoutes.delete('/:id', async (c) => {
  try {
    const user = c.get('user')
    const listId = c.req.param('id')

    // オーナーかチェック
    const list = await db.query.lists.findFirst({
      where: eq(lists.id, listId),
    })

    if (!list || list.ownerId !== user.id) {
      return c.json({ error: 'このリストを削除する権限がありません' }, 403)
    }

    await db.delete(lists).where(eq(lists.id, listId))

    return c.json({
      success: true,
      message: 'リストを削除しました',
    })
  } catch (error) {
    console.error('Delete list error:', error)
    return c.json({ error: 'リストの削除に失敗しました' }, 500)
  }
})

// メンバー招待
listRoutes.post('/:id/invite', zValidator('json', inviteMemberSchema), async (c) => {
  try {
    const user = c.get('user')
    const listId = c.req.param('id')
    const { email } = c.req.valid('json')

    // オーナーかチェック
    const list = await db.query.lists.findFirst({
      where: eq(lists.id, listId),
    })

    if (!list || list.ownerId !== user.id) {
      return c.json({ error: 'メンバーを招待する権限がありません' }, 403)
    }

    // 招待するユーザーを検索
    const inviteUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!inviteUser) {
      return c.json({ error: 'ユーザーが見つかりません' }, 404)
    }

    // 既にメンバーかチェック
    const existingMember = await db.query.listMembers.findFirst({
      where: and(
        eq(listMembers.listId, listId),
        eq(listMembers.userId, inviteUser.id)
      ),
    })

    if (existingMember) {
      return c.json({ error: '既にメンバーです' }, 400)
    }

    // メンバーとして追加
    await db.insert(listMembers).values({
      listId,
      userId: inviteUser.id,
      role: 'member',
    })

    return c.json({
      success: true,
      message: 'メンバーを招待しました',
    })
  } catch (error) {
    console.error('Invite member error:', error)
    return c.json({ error: 'メンバーの招待に失敗しました' }, 500)
  }
})

// メンバー削除
listRoutes.delete('/:id/members/:userId', async (c) => {
  try {
    const user = c.get('user')
    const listId = c.req.param('id')
    const targetUserId = c.req.param('userId')

    // オーナーかチェック
    const list = await db.query.lists.findFirst({
      where: eq(lists.id, listId),
    })

    if (!list || list.ownerId !== user.id) {
      return c.json({ error: 'メンバーを削除する権限がありません' }, 403)
    }

    // オーナー自身は削除できない
    if (targetUserId === user.id) {
      return c.json({ error: 'オーナーは削除できません' }, 400)
    }

    await db.delete(listMembers)
      .where(and(
        eq(listMembers.listId, listId),
        eq(listMembers.userId, targetUserId)
      ))

    return c.json({
      success: true,
      message: 'メンバーを削除しました',
    })
  } catch (error) {
    console.error('Remove member error:', error)
    return c.json({ error: 'メンバーの削除に失敗しました' }, 500)
  }
})

export { listRoutes } 