import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'

const SettingsScreen = () => {
  const { user, logout } = useAuth()

  const handleProfileEdit = () => {
    Alert.alert('準備中', 'プロフィール編集機能は準備中です')
  }

  const handleNotificationSettings = () => {
    Alert.alert('準備中', '通知設定機能は準備中です')
  }

  const handlePrivacySettings = () => {
    Alert.alert('準備中', 'プライバシー設定機能は準備中です')
  }

  const handleAbout = () => {
    Alert.alert(
      'Rectropicについて',
      'バージョン: 1.0.0\n\nTikTokのような縦型コンテンツを友達と共有できるアプリです。',
      [{ text: 'OK' }]
    )
  }

  const handleTerms = () => {
    Alert.alert('準備中', '利用規約の表示機能は準備中です')
  }

  const handlePrivacyPolicy = () => {
    Alert.alert('準備中', 'プライバシーポリシーの表示機能は準備中です')
  }

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: logout,
        },
      ]
    )
  }

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    showChevron: boolean = true
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingItemLeft}>
        <Ionicons name={icon as any} size={24} color="#666" />
        <View style={styles.settingItemText}>
          <Text style={styles.settingItemTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.settingItemSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={20} color="#666" />
      )}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ユーザー情報セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>
          {renderSettingItem(
            'person-outline',
            'プロフィール編集',
            user?.name || 'ユーザー名',
            handleProfileEdit
          )}
          {user?.isPremium ? (
            renderSettingItem(
              'star',
              'プレミアムプラン',
              '有効',
              undefined,
              false
            )
          ) : (
            renderSettingItem(
              'star-outline',
              'プレミアムプランにアップグレード',
              '無制限のリストとコンテンツ',
              () => Alert.alert('準備中', 'アップグレード機能は準備中です')
            )
          )}
        </View>

        {/* アプリ設定セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アプリ設定</Text>
          {renderSettingItem(
            'notifications-outline',
            '通知設定',
            'プッシュ通知の管理',
            handleNotificationSettings
          )}
          {renderSettingItem(
            'shield-outline',
            'プライバシー設定',
            'データの共有設定',
            handlePrivacySettings
          )}
        </View>

        {/* サポートセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>サポート</Text>
          {renderSettingItem(
            'help-circle-outline',
            'ヘルプ・FAQ',
            'よくある質問',
            () => Alert.alert('準備中', 'ヘルプ機能は準備中です')
          )}
          {renderSettingItem(
            'mail-outline',
            'お問い合わせ',
            'サポートチームに連絡',
            () => Alert.alert('準備中', 'お問い合わせ機能は準備中です')
          )}
        </View>

        {/* 法的情報セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>法的情報</Text>
          {renderSettingItem(
            'document-text-outline',
            '利用規約',
            undefined,
            handleTerms
          )}
          {renderSettingItem(
            'lock-closed-outline',
            'プライバシーポリシー',
            undefined,
            handlePrivacyPolicy
          )}
          {renderSettingItem(
            'information-circle-outline',
            'アプリについて',
            undefined,
            handleAbout
          )}
        </View>

        {/* ログアウトセクション */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    marginLeft: 12,
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 2,
  },
  settingItemSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
})

export default SettingsScreen 