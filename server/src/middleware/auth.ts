import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'
import { db, users } from '../db'
import { eq } from 'drizzle-orm'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthContext {
  user: {
    id: string
    email: string
    name: string
    avatar?: string
    isPremium: boolean
  }
}

export const authMiddleware = async (c: Context, next: Next) => {
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

    // コンテキストにユーザー情報を追加
    c.set('user', {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      isPremium: user.isPremium,
    })

    await next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return c.json({ error: '認証に失敗しました' }, 401)
  }
} 