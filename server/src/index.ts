import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/auth'
import { listRoutes } from './routes/lists'
import { userRoutes } from './routes/users'
import { contentRoutes } from './routes/content'

const app = new Hono()

// ミドルウェア
app.use('*', cors({
  origin: ['http://localhost:3000', 'exp://192.168.1.100:19000'], // Expo開発サーバー用
  credentials: true,
}))
app.use('*', logger())

// ヘルスチェック
app.get('/', (c) => {
  return c.json({ message: 'Rectropic API Server is running!' })
})

// ルート設定
app.route('/api/auth', authRoutes)
app.route('/api/lists', listRoutes)
app.route('/api/users', userRoutes)
app.route('/api/content', contentRoutes)

// エラーハンドリング
app.onError((err, c) => {
  console.error('Server Error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

// 404ハンドリング
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

const port = process.env.PORT || 3001
console.log(`Server is running on port ${port}`)

export default {
  port,
  fetch: app.fetch,
} 