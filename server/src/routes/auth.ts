import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { db, users } from '../db'
import { eq } from 'drizzle-orm'

const authRoutes = new Hono()

// JWT秘密鍵（本番環境では環境変数から取得）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// ログインスキーマ
const loginSchema = z.object({
  provider: z.enum(['google', 'apple', 'anonymous']),
  providerId: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().optional(),
})

// ログイン/会員登録エンドポイント
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { provider, providerId, email, name, avatar } = c.req.valid('json')

    // 既存ユーザーを検索
    let user = await db.query.users.findFirst({
      where: eq(users.providerId, providerId)
    })

    if (!user) {
      // 新規ユーザー作成
      const [newUser] = await db.insert(users).values({
        email,
        name,
        avatar,
        provider,
        providerId,
      }).returning()
      user = newUser
    } else {
      // 既存ユーザーの情報を更新
      const [updatedUser] = await db.update(users)
        .set({
          email,
          name,
          avatar,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning()
      user = updatedUser
    }

    // JWTトークン生成
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isPremium: user.isPremium,
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'ログインに失敗しました' }, 500)
  }
})

// 匿名ログインエンドポイント
authRoutes.post('/anonymous', async (c) => {
  try {
    const anonymousId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 匿名ユーザー作成
    const [user] = await db.insert(users).values({
      email: `${anonymousId}@anonymous.local`,
      name: 'ゲストユーザー',
      provider: 'anonymous',
      providerId: anonymousId,
      isPremium: false,
    }).returning()

    // JWTトークン生成
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' } // 匿名ユーザーは7日間のみ有効
    )

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isPremium: user.isPremium,
      },
      token,
    })
  } catch (error) {
    console.error('Anonymous login error:', error)
    return c.json({ error: '匿名ログインに失敗しました' }, 500)
  }
})

// トークン検証エンドポイント
authRoutes.post('/verify', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: '認証トークンが必要です' }, 401)
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId)
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
        isPremium: user.isPremium,
      },
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return c.json({ error: '無効なトークンです' }, 401)
  }
})

// ログアウトエンドポイント（クライアント側でトークンを削除）
authRoutes.post('/logout', (c) => {
  return c.json({ success: true, message: 'ログアウトしました' })
})

export { authRoutes } 