import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'
import { authAPI, User } from '../services/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (token: string, userData: User) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // アプリ起動時に認証状態をチェック
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      const token = await SecureStore.getItemAsync('authToken')
      
      if (token) {
        // トークンが存在する場合、サーバーで検証
        const response = await authAPI.verify()
        if (response.success) {
          setUser(response.user)
        } else {
          // 無効なトークンの場合は削除
          await SecureStore.deleteItemAsync('authToken')
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
      // エラーの場合はトークンを削除
      await SecureStore.deleteItemAsync('authToken')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (token: string, userData: User) => {
    try {
      // トークンを安全に保存
      await SecureStore.setItemAsync('authToken', token)
      setUser(userData)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      // サーバーにログアウト通知
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // ローカルの認証情報をクリア
      await SecureStore.deleteItemAsync('authToken')
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const response = await authAPI.verify()
      if (response.success) {
        setUser(response.user)
      }
    } catch (error) {
      console.error('Refresh user error:', error)
      // エラーの場合はログアウト
      await logout()
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 