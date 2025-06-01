import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'

interface RegisterScreenProps {
  navigation: any
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleGoogleRegister = async () => {
    try {
      setIsLoading(true)
      
      // 実際の実装では、expo-auth-sessionを使用してGoogleログインを実装
      // ここではダミーデータでテスト
      const mockGoogleUser = {
        provider: 'google' as const,
        providerId: `google_${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        name: '新規ユーザー',
        avatar: 'https://via.placeholder.com/150',
      }

      const response = await authAPI.login(mockGoogleUser)
      
      if (response.success) {
        await login(response.token, response.user)
      } else {
        Alert.alert('エラー', '会員登録に失敗しました')
      }
    } catch (error) {
      console.error('Google register error:', error)
      Alert.alert('エラー', '会員登録に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAppleRegister = async () => {
    try {
      setIsLoading(true)
      
      // 実際の実装では、expo-auth-sessionを使用してAppleログインを実装
      // ここではダミーデータでテスト
      const mockAppleUser = {
        provider: 'apple' as const,
        providerId: `apple_${Date.now()}`,
        email: `test${Date.now()}@icloud.com`,
        name: '新規Appleユーザー',
      }

      const response = await authAPI.login(mockAppleUser)
      
      if (response.success) {
        await login(response.token, response.user)
      } else {
        Alert.alert('エラー', '会員登録に失敗しました')
      }
    } catch (error) {
      console.error('Apple register error:', error)
      Alert.alert('エラー', '会員登録に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnonymousLogin = async () => {
    try {
      setIsLoading(true)
      
      const response = await authAPI.anonymousLogin()
      
      if (response.success) {
        await login(response.token, response.user)
      } else {
        Alert.alert('エラー', '匿名ログインに失敗しました')
      }
    } catch (error) {
      console.error('Anonymous login error:', error)
      Alert.alert('エラー', '匿名ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LinearGradient
      colors={['#000000', '#1a1a1a']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Rectropic</Text>
        <Text style={styles.subtitle}>
          アカウントを作成して{'\n'}
          友達とコンテンツを共有しよう
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={handleGoogleRegister}
            disabled={isLoading}
          >
            <Ionicons name="logo-google" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Googleで会員登録</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.appleButton]}
            onPress={handleAppleRegister}
            disabled={isLoading}
          >
            <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Appleで会員登録</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.anonymousButton]}
            onPress={handleAnonymousLogin}
            disabled={isLoading}
          >
            <Ionicons name="person-outline" size={24} color="#666666" />
            <Text style={[styles.buttonText, styles.anonymousButtonText]}>匿名でテスト</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loginSection}>
          <Text style={styles.loginText}>既にアカウントをお持ちですか？</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>ログイン</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.termsText}>
          会員登録することで、利用規約とプライバシーポリシーに同意したものとみなされます
        </Text>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 60,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
  },
  anonymousButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  anonymousButtonText: {
    color: '#666666',
  },
  loginSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  loginText: {
    color: '#CCCCCC',
    fontSize: 14,
    marginRight: 8,
  },
  loginLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 16,
  },
})

export default RegisterScreen 