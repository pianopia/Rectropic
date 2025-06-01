import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

// APIベースURL（開発環境用）
const API_BASE_URL = 'https://rectropic-server-470879387266.asia-east1.run.app/api'

// Axiosインスタンスを作成
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// リクエストインターセプター（認証トークンを自動で追加）
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// レスポンスインターセプター（エラーハンドリング）
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 認証エラーの場合、トークンを削除
      await SecureStore.deleteItemAsync('authToken')
    }
    return Promise.reject(error)
  }
)

// 型定義
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  isPremium: boolean
}

export interface List {
  id: string
  title: string
  description?: string
  ownerId: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  owner?: User
  role?: string
  latestContent?: Content
}

export interface Content {
  id: string
  listId: string
  addedBy: string
  type: 'image' | 'video' | 'url'
  title?: string
  description?: string
  url: string
  thumbnailUrl?: string
  metadata?: any
  order: number
  createdAt: string
  updatedAt: string
  addedByUser?: User
  reactions?: Reaction[]
}

export interface Reaction {
  id: string
  contentId: string
  userId: string
  type: 'like' | 'love' | 'dislike'
  createdAt: string
  user?: User
}

// API関数
export const authAPI = {
  login: async (data: {
    provider: 'google' | 'apple' | 'anonymous'
    providerId: string
    email: string
    name: string
    avatar?: string
  }) => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  anonymousLogin: async () => {
    const response = await api.post('/auth/anonymous')
    return response.data
  },

  verify: async () => {
    const response = await api.post('/auth/verify')
    return response.data
  },

  logout: async () => {
    const response = await api.post('/auth/logout')
    await SecureStore.deleteItemAsync('authToken')
    return response.data
  },
}

export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/users/profile')
    return response.data
  },

  updateProfile: async (data: { name?: string; avatar?: string }) => {
    const response = await api.put('/users/profile', data)
    return response.data
  },

  upgrade: async () => {
    const response = await api.post('/users/upgrade')
    return response.data
  },

  search: async (email: string) => {
    const response = await api.get(`/users/search?email=${encodeURIComponent(email)}`)
    return response.data
  },
}

export const listAPI = {
  getLists: async () => {
    const response = await api.get('/lists')
    return response.data
  },

  getList: async (id: string) => {
    const response = await api.get(`/lists/${id}`)
    return response.data
  },

  createList: async (data: { title: string; description?: string; isPublic?: boolean }) => {
    const response = await api.post('/lists', data)
    return response.data
  },

  updateList: async (id: string, data: { title?: string; description?: string; isPublic?: boolean }) => {
    const response = await api.put(`/lists/${id}`, data)
    return response.data
  },

  deleteList: async (id: string) => {
    const response = await api.delete(`/lists/${id}`)
    return response.data
  },

  inviteMember: async (id: string, email: string) => {
    const response = await api.post(`/lists/${id}/invite`, { email })
    return response.data
  },

  removeMember: async (id: string, userId: string) => {
    const response = await api.delete(`/lists/${id}/members/${userId}`)
    return response.data
  },
}

export const contentAPI = {
  addContent: async (data: {
    listId: string
    type: 'image' | 'video' | 'url'
    title?: string
    description?: string
    url: string
    thumbnailUrl?: string
    metadata?: any
  }) => {
    const response = await api.post('/content', data)
    return response.data
  },

  deleteContent: async (id: string) => {
    const response = await api.delete(`/content/${id}`)
    return response.data
  },

  addReaction: async (id: string, type: 'like' | 'love' | 'dislike' = 'like') => {
    const response = await api.post(`/content/${id}/reaction`, { type })
    return response.data
  },

  removeReaction: async (id: string) => {
    const response = await api.delete(`/content/${id}/reaction`)
    return response.data
  },
}

export default api 