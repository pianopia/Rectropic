import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { VideoView, useVideoPlayer } from 'expo-video'
import { PanGestureHandler, State } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated'
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'

import { Content, contentAPI, listAPI } from '../services/api'
import { RootStackParamList, TabParamList } from '../navigation/AppNavigator'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

type SwipeScreenRouteProp = RouteProp<TabParamList, 'Swipe'>
type SwipeScreenNavigationProp = StackNavigationProp<RootStackParamList> & BottomTabNavigationProp<TabParamList>

const SwipeScreen = () => {
  const [contents, setContents] = useState<Content[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [listTitle, setListTitle] = useState('')

  const navigation = useNavigation<SwipeScreenNavigationProp>()
  const route = useRoute<SwipeScreenRouteProp>()
  const { listId } = route.params || {}

  // アニメーション用の値
  const translateY = useSharedValue(0)
  const opacity = useSharedValue(1)

  // 現在の動画プレイヤーのみ管理
  const currentPlayer = useVideoPlayer('', (player) => {
    player.loop = true
  })

  // リストのコンテンツを取得
  const fetchListContents = async () => {
    if (!listId) {
      // listIdがない場合はダミーデータを表示
      setContents(getDummyContents())
      setListTitle('サンプルリスト')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await listAPI.getList(listId)
      
      if (response.success && response.list) {
        const listContents = response.list.contents || []
        // リストが空の場合はダミーデータを追加
        if (listContents.length === 0) {
          setContents(getDummyContents())
        } else {
          setContents(listContents)
        }
        setListTitle(response.list.title)
      } else {
        Alert.alert('エラー', 'リストの取得に失敗しました')
        // エラーの場合もダミーデータを表示
        setContents(getDummyContents())
        setListTitle('サンプルリスト')
      }
    } catch (error) {
      console.error('Fetch list contents error:', error)
      Alert.alert('エラー', 'リストの取得に失敗しました')
      // エラーの場合もダミーデータを表示
      setContents(getDummyContents())
      setListTitle('サンプルリスト')
    } finally {
      setIsLoading(false)
    }
  }

  // ダミーデータ生成関数
  const getDummyContents = (): Content[] => [
    {
      id: '1',
      listId: 'sample',
      addedBy: 'user1',
      type: 'video',
      title: 'Big Buck Bunny',
      description: 'オープンソースの3Dアニメーション映画',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUrl: 'https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=Big+Buck+Bunny',
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
    },
    {
      id: '2',
      listId: 'sample',
      addedBy: 'user2',
      type: 'video',
      title: 'Elephant Dream',
      description: 'クリエイティブなオープンソース映画',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnailUrl: 'https://via.placeholder.com/300x400/4ECDC4/FFFFFF?text=Elephant+Dream',
      order: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
    },
    {
      id: '3',
      listId: 'sample',
      addedBy: 'user3',
      type: 'video',
      title: 'For Bigger Blazes',
      description: 'ダイナミックなアクション映像',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://via.placeholder.com/300x400/FFE66D/000000?text=For+Bigger+Blazes',
      order: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
    },
    {
      id: '4',
      listId: 'sample',
      addedBy: 'user4',
      type: 'video',
      title: 'For Bigger Escape',
      description: '壮大な冒険の物語',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnailUrl: 'https://via.placeholder.com/300x400/A8E6CF/000000?text=For+Bigger+Escape',
      order: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
    },
    {
      id: '5',
      listId: 'sample',
      addedBy: 'user5',
      type: 'video',
      title: 'For Bigger Fun',
      description: '楽しさ満載のエンターテイメント',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumbnailUrl: 'https://via.placeholder.com/300x400/FFB6C1/000000?text=For+Bigger+Fun',
      order: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
    },
    {
      id: '6',
      listId: 'sample',
      addedBy: 'user6',
      type: 'video',
      title: 'For Bigger Joyrides',
      description: 'スリル満点のドライブ映像',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      thumbnailUrl: 'https://via.placeholder.com/300x400/FF9999/000000?text=For+Bigger+Joyrides',
      order: 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
    },
    {
      id: '7',
      listId: 'sample',
      addedBy: 'user7',
      type: 'video',
      title: 'For Bigger Meltdowns',
      description: 'インパクトのある映像体験',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      thumbnailUrl: 'https://via.placeholder.com/300x400/99CCFF/000000?text=For+Bigger+Meltdowns',
      order: 7,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
    },
    {
      id: '8',
      listId: 'sample',
      addedBy: 'user8',
      type: 'video',
      title: 'Sintel',
      description: 'ファンタジーアニメーション',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      thumbnailUrl: 'https://via.placeholder.com/300x400/DDA0DD/000000?text=Sintel',
      order: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
    },
    {
      id: '9',
      listId: 'sample',
      addedBy: 'user9',
      type: 'video',
      title: 'Tears of Steel',
      description: 'SF映画の傑作',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      thumbnailUrl: 'https://via.placeholder.com/300x400/CCCCCC/000000?text=Tears+of+Steel',
      order: 9,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
    },
    {
      id: '10',
      listId: 'sample',
      addedBy: 'user10',
      type: 'image',
      title: '美しい風景',
      description: '自然の美しさを感じる風景写真',
      url: 'https://picsum.photos/400/600?random=1',
      thumbnailUrl: 'https://picsum.photos/400/600?random=1',
      order: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
    },
    {
      id: '11',
      listId: 'sample',
      addedBy: 'user11',
      type: 'image',
      title: '都市の夜景',
      description: 'きらめく都市の夜の美しさ',
      url: 'https://picsum.photos/400/600?random=2',
      thumbnailUrl: 'https://picsum.photos/400/600?random=2',
      order: 11,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
    },
    {
      id: '12',
      listId: 'sample',
      addedBy: 'user12',
      type: 'image',
      title: '海辺のリゾート',
      description: 'リラックスできる海辺の風景',
      url: 'https://picsum.photos/400/600?random=3',
      thumbnailUrl: 'https://picsum.photos/400/600?random=3',
      order: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
    },
  ]

  // 画面がフォーカスされたときにデータを再取得
  useFocusEffect(
    React.useCallback(() => {
      fetchListContents()
    }, [listId])
  )

  // 現在のコンテンツが変更されたときに動画を更新（軽量化）
  useEffect(() => {
    const currentContent = contents[currentIndex]
    if (currentContent?.type === 'video') {
      // 動画の場合のみプレイヤーを更新して再生
      currentPlayer.replace(currentContent.url)
      currentPlayer.play()
    } else {
      // 画像の場合は動画を一時停止して音声を止める
      currentPlayer.pause()
    }
  }, [currentIndex, contents, currentPlayer])

  const handleLike = async () => {
    if (contents[currentIndex]) {
      try {
        await contentAPI.addReaction(contents[currentIndex].id, 'like')
        Alert.alert('いいね！', 'リアクションを追加しました')
      } catch (error) {
        console.error('Like error:', error)
      }
    }
  }

  const handleAddContent = () => {
    if (!listId) {
      Alert.alert('エラー', 'リストが選択されていません。ホーム画面からリストを選択してください。')
      return
    }
    navigation.navigate('AddContent', { listId })
  }

  const handleNext = () => {
    // インフィニットループ: 最後のコンテンツの場合は最初に戻る
    const nextIndex = currentIndex >= contents.length - 1 ? 0 : currentIndex + 1
    setCurrentIndex(nextIndex)
    // アニメーション値をリセット（フリック固まり防止）
    translateY.value = 0
    opacity.value = 1
  }

  const handlePrevious = () => {
    // インフィニットループ: 最初のコンテンツの場合は最後に移動
    const prevIndex = currentIndex <= 0 ? contents.length - 1 : currentIndex - 1
    setCurrentIndex(prevIndex)
    // アニメーション値をリセット（フリック固まり防止）
    translateY.value = 0
    opacity.value = 1
  }

  // ジェスチャーハンドラー（高速化・固まり防止）
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: { startY: number }) => {
      context.startY = translateY.value
    },
    onActive: (event, context: { startY: number }) => {
      // フリック操作を常にスムーズに（読み込み状態に関係なく）
      translateY.value = context.startY + event.translationY
      
      // 軽量な透明度調整
      const progress = Math.abs(event.translationY) / screenHeight
      opacity.value = interpolate(
        progress,
        [0, 0.3],
        [1, 0.8],
        Extrapolate.CLAMP
      )
    },
    onEnd: (event) => {
      // より敏感なスワイプ検出でレスポンシブに
      const shouldSwipe = Math.abs(event.translationY) > screenHeight * 0.15 || Math.abs(event.velocityY) > 800

      if (shouldSwipe) {
        if (event.translationY > 0) {
          // 下にスワイプ - 前のコンテンツ
          translateY.value = withSpring(screenHeight, { damping: 15, stiffness: 400 }, () => {
            runOnJS(handlePrevious)()
          })
        } else {
          // 上にスワイプ - 次のコンテンツ
          translateY.value = withSpring(-screenHeight, { damping: 15, stiffness: 400 }, () => {
            runOnJS(handleNext)()
          })
        }
      } else {
        // 元の位置に戻す（高速アニメーション）
        translateY.value = withSpring(0, { damping: 15, stiffness: 400 })
        opacity.value = withSpring(1, { damping: 15, stiffness: 400 })
      }
    },
  })

  // アニメーションスタイル
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    }
  })

  const renderContent = (content: Content) => {
    if (content.type === 'video') {
      return (
        <VideoView
          style={styles.media}
          player={currentPlayer}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          nativeControls={false}
        />
      )
    } else {
      return (
        <Image
          source={{ uri: content.url }}
          style={styles.media}
          resizeMode="cover"
          // 軽量な画像ロード設定
          fadeDuration={200}
        />
      )
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    )
  }

  if (!listId) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Ionicons name="list-outline" size={64} color="#666" />
          <Text style={styles.emptyTitle}>リストが選択されていません</Text>
          <Text style={styles.emptySubtitle}>
            ホーム画面からリストを選択してください
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // コンテンツが常に表示されるように（ダミーデータがあるため）
  const currentContent = contents[currentIndex]

  if (!currentContent) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Ionicons name="play-circle-outline" size={64} color="#666" />
          <Text style={styles.emptyTitle}>コンテンツがありません</Text>
          <Text style={styles.emptySubtitle}>
            リストにコンテンツを追加してください
          </Text>
          <TouchableOpacity style={styles.addContentButton} onPress={handleAddContent}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addContentButtonText}>コンテンツを追加</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.container}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.contentContainer, animatedStyle]}>
          {renderContent(currentContent)}
          
          {/* オーバーレイ */}
          <View style={styles.overlay}>
            {/* 上部のナビゲーション */}
            <SafeAreaView style={styles.topSection}>
              <View style={styles.topControls}>
                <TouchableOpacity onPress={handlePrevious}>
                  <Ionicons 
                    name="chevron-up" 
                    size={32} 
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </SafeAreaView>

            {/* 下部の情報とコントロール */}
            <View style={styles.bottomSection}>
              <View style={styles.contentInfo}>
                <Text style={styles.contentTitle}>{currentContent.title}</Text>
                {currentContent.description && (
                  <Text style={styles.contentDescription}>
                    {currentContent.description}
                  </Text>
                )}
                {/* コンテンツタイプ表示 */}
                <View style={styles.contentTypeIndicator}>
                  <Ionicons 
                    name={currentContent.type === 'video' ? 'play-circle' : 'image'} 
                    size={16} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.contentTypeText}>
                    {currentContent.type === 'video' ? '動画' : '画像'}
                  </Text>
                </View>
              </View>

              <View style={styles.controls}>
                <TouchableOpacity style={styles.controlButton} onPress={handleLike}>
                  <Ionicons name="heart-outline" size={32} color="#FFFFFF" />
                  <Text style={styles.controlText}>いいね</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.controlButton} onPress={handleAddContent}>
                  <Ionicons name="add-circle-outline" size={32} color="#FFFFFF" />
                  <Text style={styles.controlText}>追加</Text>
                </TouchableOpacity>
                
                {/* 動画の場合は再生/一時停止ボタンを追加 */}
                {currentContent.type === 'video' && (
                  <TouchableOpacity 
                    style={styles.controlButton} 
                    onPress={() => {
                      if (currentPlayer.playing) {
                        currentPlayer.pause()
                      } else {
                        currentPlayer.play()
                      }
                    }}
                  >
                    <Ionicons 
                      name={currentPlayer.playing ? "pause" : "play"} 
                      size={32} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.controlText}>
                      {currentPlayer.playing ? "一時停止" : "再生"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.bottomControls}>
                <TouchableOpacity onPress={handleNext}>
                  <Ionicons 
                    name="chevron-down" 
                    size={32} 
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>

      {/* インジケーター */}
      <View style={styles.indicator}>
        <Text style={styles.indicatorText}>
          {currentIndex + 1} / {contents.length}
        </Text>
      </View>

      {/* スワイプヒント */}
      <View style={styles.swipeHint}>
        <Text style={styles.swipeHintText}>上下にスワイプして切り替え</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  media: {
    width: screenWidth,
    height: screenHeight,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
  },
  topControls: {
    paddingVertical: 20,
  },
  bottomSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'flex-end',
  },
  contentInfo: {
    flex: 1,
    marginRight: 20,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  contentDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 8,
  },
  contentTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  contentTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  controls: {
    alignItems: 'center',
  },
  controlButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    transform: [{ translateX: -16 }],
  },
  indicator: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  indicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  swipeHint: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  swipeHintText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  addContentButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addContentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
})

export default SwipeScreen 