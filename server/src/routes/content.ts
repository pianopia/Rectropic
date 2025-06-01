import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db, contents, reactions, listMembers, lists } from '../db'
import { eq, and, desc, count } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'

const contentRoutes = new Hono()

// 認証が必要なルートにミドルウェアを適用
contentRoutes.use('*', authMiddleware)

// コンテンツ追加スキーマ
const addContentSchema = z.object({
  listId: z.string().uuid(),
  type: z.enum(['image', 'video', 'url']),
  title: z.string().max(200).optional(),
  description: z.string().optional(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
})

// リアクションスキーマ
const reactionSchema = z.object({
  type: z.enum(['like', 'love', 'dislike']).default('like'),
})

// コンテンツ追加
contentRoutes.post('/', zValidator('json', addContentSchema), async (c) => {
  try {
    const user = c.get('user') as any
    const { listId, type, title, description, url, thumbnailUrl, metadata } = c.req.valid('json')

    // ユーザーがこのリストのメンバーかチェック
    const membership = await db.query.listMembers.findFirst({
      where: and(
        eq(listMembers.listId, listId),
        eq(listMembers.userId, user.id)
      ),
    })

    if (!membership) {
      return c.json({ error: 'このリストにコンテンツを追加する権限がありません' }, 403)
    }

    // 無料プランの制限チェック
    if (!user.isPremium) {
      const listContentsCount = await db.select({ count: count() })
        .from(contents)
        .where(eq(contents.listId, listId))
      
      if (listContentsCount[0].count >= 10) {
        return c.json({ error: '無料プランでは1つのリストに10個までのコンテンツしか追加できません' }, 403)
      }
    }

    // 次の順序番号を取得
    const lastContent = await db.query.contents.findFirst({
      where: eq(contents.listId, listId),
      orderBy: [desc(contents.order)],
    })

    const nextOrder = (lastContent?.order || 0) + 1

    const [newContent] = await db.insert(contents).values({
      listId,
      addedBy: user.id,
      type,
      title,
      description,
      url,
      thumbnailUrl,
      metadata,
      order: nextOrder,
    }).returning()

    return c.json({
      success: true,
      content: newContent,
    })
  } catch (error) {
    console.error('Add content error:', error)
    return c.json({ error: 'コンテンツの追加に失敗しました' }, 500)
  }
})

// コンテンツ削除
contentRoutes.delete('/:id', async (c) => {
  try {
    const user = c.get('user') as any
    const contentId = c.req.param('id')

    const content = await db.query.contents.findFirst({
      where: eq(contents.id, contentId),
      with: {
        list: true,
      },
    })

    if (!content) {
      return c.json({ error: 'コンテンツが見つかりません' }, 404)
    }

    // コンテンツを追加したユーザーまたはリストのオーナーのみ削除可能
    if (content.addedBy !== user.id && content.list.ownerId !== user.id) {
      return c.json({ error: 'このコンテンツを削除する権限がありません' }, 403)
    }

    await db.delete(contents).where(eq(contents.id, contentId))

    return c.json({
      success: true,
      message: 'コンテンツを削除しました',
    })
  } catch (error) {
    console.error('Delete content error:', error)
    return c.json({ error: 'コンテンツの削除に失敗しました' }, 500)
  }
})

// リアクション追加/更新
contentRoutes.post('/:id/reaction', zValidator('json', reactionSchema), async (c) => {
  try {
    const user = c.get('user') as any
    const contentId = c.req.param('id')
    const { type } = c.req.valid('json')

    // コンテンツが存在するかチェック
    const content = await db.query.contents.findFirst({
      where: eq(contents.id, contentId),
    })

    if (!content) {
      return c.json({ error: 'コンテンツが見つかりません' }, 404)
    }

    // ユーザーがこのリストのメンバーかチェック
    const membership = await db.query.listMembers.findFirst({
      where: and(
        eq(listMembers.listId, content.listId),
        eq(listMembers.userId, user.id)
      ),
    })

    if (!membership) {
      return c.json({ error: 'このコンテンツにリアクションする権限がありません' }, 403)
    }

    // 既存のリアクションをチェック
    const existingReaction = await db.query.reactions.findFirst({
      where: and(
        eq(reactions.contentId, contentId),
        eq(reactions.userId, user.id)
      ),
    })

    if (existingReaction) {
      // 既存のリアクションを更新
      const [updatedReaction] = await db.update(reactions)
        .set({ type })
        .where(eq(reactions.id, existingReaction.id))
        .returning()

      return c.json({
        success: true,
        reaction: updatedReaction,
      })
    } else {
      // 新しいリアクションを追加
      const [newReaction] = await db.insert(reactions).values({
        contentId,
        userId: user.id,
        type,
      }).returning()

      return c.json({
        success: true,
        reaction: newReaction,
      })
    }
  } catch (error) {
    console.error('Add reaction error:', error)
    return c.json({ error: 'リアクションの追加に失敗しました' }, 500)
  }
})

// リアクション削除
contentRoutes.delete('/:id/reaction', async (c) => {
  try {
    const user = c.get('user') as any
    const contentId = c.req.param('id')

    await db.delete(reactions)
      .where(and(
        eq(reactions.contentId, contentId),
        eq(reactions.userId, user.id)
      ))

    return c.json({
      success: true,
      message: 'リアクションを削除しました',
    })
  } catch (error) {
    console.error('Delete reaction error:', error)
    return c.json({ error: 'リアクションの削除に失敗しました' }, 500)
  }
})

export { contentRoutes } 