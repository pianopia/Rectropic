import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'

import { useAuth } from '../contexts/AuthContext'
import { listAPI, List } from '../services/api'
import { RootStackParamList, TabParamList } from '../navigation/AppNavigator'

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList> & BottomTabNavigationProp<TabParamList>

const HomeScreen = () => {
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const { user } = useAuth()
  const navigation = useNavigation<HomeScreenNavigationProp>()

  const fetchLists = useCallback(async () => {
    try {
      const response = await listAPI.getLists()
      if (response.success) {
        setLists(response.lists)
      }
    } catch (error) {
      console.error('Fetch lists error:', error)
      Alert.alert('エラー', 'リストの取得に失敗しました')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchLists()
  }, [fetchLists])

  const handleCreateList = () => {
    navigation.navigate('CreateList')
  }

  const handleListPress = (listId: string) => {
    // Swipeタブに切り替えてlistIdを渡す
    navigation.navigate('Swipe', { listId })
  }

  const handleListLongPress = (item: List) => {
    if (item.role === 'owner') {
      Alert.alert(
        item.title,
        'リストの操作を選択してください',
        [
          {
            text: 'コンテンツを追加',
            onPress: () => navigation.navigate('AddContent', { listId: item.id }),
          },
          {
            text: 'コンテンツを見る',
            onPress: () => navigation.navigate('Swipe', { listId: item.id }),
          },
          {
            text: 'メンバー管理',
            onPress: () => navigation.navigate('ListMembers', { listId: item.id }),
          },
          {
            text: 'リスト削除',
            style: 'destructive',
            onPress: () => handleDeleteList(item),
          },
          {
            text: 'キャンセル',
            style: 'cancel',
          },
        ]
      )
    } else {
      Alert.alert(
        item.title,
        'リストの操作を選択してください',
        [
          {
            text: 'コンテンツを追加',
            onPress: () => navigation.navigate('AddContent', { listId: item.id }),
          },
          {
            text: 'コンテンツを見る',
            onPress: () => navigation.navigate('Swipe', { listId: item.id }),
          },
          {
            text: 'メンバー一覧',
            onPress: () => navigation.navigate('ListMembers', { listId: item.id }),
          },
          {
            text: 'リストから退出',
            style: 'destructive',
            onPress: () => handleLeaveList(item),
          },
          {
            text: 'キャンセル',
            style: 'cancel',
          },
        ]
      )
    }
  }

  const handleDeleteList = (item: List) => {
    Alert.alert(
      'リスト削除',
      `「${item.title}」を削除しますか？この操作は取り消せません。`,
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
              const response = await listAPI.deleteList(item.id)
              if (response.success) {
                Alert.alert('成功', 'リストを削除しました')
                fetchLists() // リストを再取得
              } else {
                Alert.alert('エラー', 'リストの削除に失敗しました')
              }
            } catch (error) {
              console.error('Delete list error:', error)
              Alert.alert('エラー', 'リストの削除に失敗しました')
            }
          },
        },
      ]
    )
  }

  const handleLeaveList = (item: List) => {
    Alert.alert(
      'リストから退出',
      `「${item.title}」から退出しますか？`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '退出',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user) {
                const response = await listAPI.removeMember(item.id, user.id)
                if (response.success) {
                  Alert.alert('成功', 'リストから退出しました')
                  fetchLists() // リストを再取得
                } else {
                  Alert.alert('エラー', 'リストからの退出に失敗しました')
                }
              }
            } catch (error) {
              console.error('Leave list error:', error)
              Alert.alert('エラー', 'リストからの退出に失敗しました')
            }
          },
        },
      ]
    )
  }

  const renderListItem = ({ item }: { item: List }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleListPress(item.id)}
      onLongPress={() => handleListLongPress(item)}
    >
      <View style={styles.listContent}>
        {item.latestContent?.thumbnailUrl ? (
          <Image
            source={{ uri: item.latestContent.thumbnailUrl }}
            style={styles.thumbnail}
          />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Ionicons name="image-outline" size={32} color="#666" />
          </View>
        )}
        
        <View style={styles.listInfo}>
          <Text style={styles.listTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.listDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.listMeta}>
            <Text style={styles.ownerName}>
              {item.owner?.name || 'Unknown'}
            </Text>
            <Text style={styles.roleText}>
              {item.role === 'owner' ? 'オーナー' : 'メンバー'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.listActions}>
        <TouchableOpacity
          style={styles.membersButton}
          onPress={() => navigation.navigate('ListMembers', { listId: item.id })}
        >
          <Ionicons name="people-outline" size={16} color="#007AFF" />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="list-outline" size={64} color="#666" />
      <Text style={styles.emptyTitle}>リストがありません</Text>
      <Text style={styles.emptySubtitle}>
        新しいリストを作成して、友達とコンテンツを共有しましょう
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateList}>
        <Text style={styles.createButtonText}>リストを作成</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>マイリスト</Text>
        <TouchableOpacity onPress={handleCreateList}>
          <Ionicons name="add" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={lists}
        renderItem={renderListItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        contentContainerStyle={lists.length === 0 ? styles.emptyContainer : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  listContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  placeholderThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  listDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerName: {
    fontSize: 12,
    color: '#888888',
    marginRight: 8,
  },
  roleText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersButton: {
    padding: 8,
  },
})

export default HomeScreen 