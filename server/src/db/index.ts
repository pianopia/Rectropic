import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

// 環境変数からTursoの設定を取得
const url = process.env.TURSO_DATABASE_URL || 'file:local.db'
const authToken = process.env.TURSO_AUTH_TOKEN

// Turso/libSQL接続
const client = createClient({
  url,
  authToken,
})

// Drizzle ORMインスタンス
export const db = drizzle(client, { schema })

export * from './schema' 