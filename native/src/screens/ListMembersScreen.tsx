import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, RouteProp } from '@react-navigation/native'

import { listAPI, userAPI, User } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

type RouteParams = {
  ListMembers: {
    listId: string
  }
}

interface ListMember {
  id: string
  user: User
  role: string
  joinedAt: string
}

interface ListData {
  id: string
  title: string
  ownerId: string
  members: ListMember[]
  userRole: string
}

const ListMembersScreen = () => {
  const [listData, setListData] = useState<ListData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  const route = useRoute<RouteProp<RouteParams, 'ListMembers'>>()
  const { listId } = route.params
  const { user: currentUser } = useAuth()

  const fetchListData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await listAPI.getList(listId)
      if (response.success) {
        setListData(response.list)
      } else {
        Alert.alert('エラー', 'リスト情報の取得に失敗しました')
      }
    } catch (error) {
      console.error('Fetch list data error:', error)
      Alert.alert('エラー', 'リスト情報の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [listId])

  useEffect(() => {
    fetchListData()
  }, [fetchListData])

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('エラー', 'メールアドレスを入力してください')
      return
    }

    try {
      setIsInviting(true)
      const response = await listAPI.inviteMember(listId, inviteEmail.trim())
      
      if (response.success) {
        Alert.alert('成功', 'メンバーを招待しました')
        setInviteEmail('')
        setIsInviteModalVisible(false)
        fetchListData() // リストを再取得
      } else {
        Alert.alert('エラー', response.error || 'メンバーの招待に失敗しました')
      }
    } catch (error) {
      console.error('Invite member error:', error)
      Alert.alert('エラー', 'メンバーの招待に失敗しました')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = (member: ListMember) => {
    if (member.role === 'owner') {
      Alert.alert('エラー', 'オーナーは削除できません')
      return
    }

    Alert.alert(
      'メンバー削除',
      `${member.user.name}をリストから削除しますか？`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await listAPI.removeMember(listId, member.user.id)
              if (response.success) {
                Alert.alert('成功', 'メンバーを削除しました')
                fetchListData() // リストを再取得
              } else {
                Alert.alert('エラー', 'メンバーの削除に失敗しました')
              }
            } catch (error) {
              console.error('Remove member error:', error)
              Alert.alert('エラー', 'メンバーの削除に失敗しました')
            }
          },
        },
      ]
    )
  }

  const renderMemberItem = ({ item }: { item: ListMember }) => (
    <View style={styles.memberItem}>
      <View style={styles.memberInfo}>
        {item.user.avatar ? (
          <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#666" />
          </View>
        )}
        
        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>{item.user.name}</Text>
          <Text style={styles.memberEmail}>{item.user.email}</Text>
        </View>
      </View>

      <View style={styles.memberActions}>
        <View style={styles.roleContainer}>
          <Text style={[
            styles.roleText,
            item.role === 'owner' ? styles.ownerRole : styles.memberRole
          ]}>
            {item.role === 'owner' ? 'オーナー' : 'メンバー'}
          </Text>
        </View>
        
        {listData?.userRole === 'owner' && item.role !== 'owner' && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMember(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  const renderInviteModal = () => (
    <Modal
      visible={isInviteModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsInviteModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>メンバーを招待</Text>
            <TouchableOpacity
              onPress={() => setIsInviteModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>メールアドレス</Text>
            <TextInput
              style={styles.textInput}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsInviteModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.inviteButton, isInviting && styles.inviteButtonDisabled]}
              onPress={handleInviteMember}
              disabled={isInviting}
            >
              {isInviting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.inviteButtonText}>招待</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!listData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>リスト情報を取得できませんでした</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{listData.title}</Text>
        <Text style={styles.headerSubtitle}>
          {listData.members.length}人のメンバー
        </Text>
      </View>

      <FlatList
        data={listData.members}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.id}
        style={styles.membersList}
        showsVerticalScrollIndicator={false}
      />

      {listData.userRole === 'owner' && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsInviteModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>メンバーを招待</Text>
        </TouchableOpacity>
      )}

      {renderInviteModal()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666666',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleContainer: {
    marginRight: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  ownerRole: {
    backgroundColor: '#FFD700',
    color: '#000000',
  },
  memberRole: {
    backgroundColor: '#E5E5E5',
    color: '#666666',
  },
  removeButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  inviteButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  inviteButtonDisabled: {
    opacity: 0.6,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})

export default ListMembersScreen 