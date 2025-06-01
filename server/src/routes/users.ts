import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db, users } from '../db'
import { eq } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'

const userRoutes = new Hono()

// 認証が必要なルートにミドルウェアを適用
userRoutes.use('*', authMiddleware)

// プロフィール更新スキーマ
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
})

// プロフィール取得
userRoutes.get('/profile', async (c) => {
  try {
    const user = c.get('user') as any

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isPremium: user.isPremium,
      },
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return c.json({ error: 'プロフィールの取得に失敗しました' }, 500)
  }
})

// プロフィール更新
userRoutes.put('/profile', zValidator('json', updateProfileSchema), async (c) => {
  try {
    const user = c.get('user') as any
    const updates = c.req.valid('json')

    const [updatedUser] = await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning()

    return c.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        isPremium: updatedUser.isPremium,
      },
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return c.json({ error: 'プロフィールの更新に失敗しました' }, 500)
  }
})

// プレミアムプランにアップグレード
userRoutes.post('/upgrade', async (c) => {
  try {
    const user = c.get('user') as any

    if (user.isPremium) {
      return c.json({ error: '既にプレミアムプランです' }, 400)
    }

    const [updatedUser] = await db.update(users)
      .set({
        isPremium: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning()

    return c.json({
      success: true,
      message: 'プレミアムプランにアップグレードしました',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        isPremium: updatedUser.isPremium,
      },
    })
  } catch (error) {
    console.error('Upgrade error:', error)
    return c.json({ error: 'アップグレードに失敗しました' }, 500)
  }
})

// ユーザー検索（メンバー招待用）
userRoutes.get('/search', async (c) => {
  try {
    const email = c.req.query('email')

    if (!email) {
      return c.json({ error: 'メールアドレスが必要です' }, 400)
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      return c.json({ error: 'ユーザーが見つかりません' }, 404)
    }

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error('Search user error:', error)
    return c.json({ error: 'ユーザーの検索に失敗しました' }, 500)
  }
})

export { userRoutes } 