import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import { contentAPI } from '../services/api'

type RootStackParamList = {
  AddContent: { listId: string }
}

type AddContentScreenRouteProp = RouteProp<RootStackParamList, 'AddContent'>
type AddContentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddContent'>

const AddContentScreen = () => {
  const [contentType, setContentType] = useState<'image' | 'video' | 'url'>('image')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const navigation = useNavigation<AddContentScreenNavigationProp>()
  const route = useRoute<AddContentScreenRouteProp>()
  const { listId } = route.params

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (permissionResult.granted === false) {
        Alert.alert('権限が必要です', 'フォトライブラリへのアクセス権限が必要です')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: contentType === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: contentType === 'image' ? [9, 16] : undefined,
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedMedia(result.assets[0].uri)
        setUrl(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Image picker error:', error)
      Alert.alert('エラー', 'メディアの選択に失敗しました')
    }
  }

  const handleCameraPicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync()
      
      if (permissionResult.granted === false) {
        Alert.alert('権限が必要です', 'カメラへのアクセス権限が必要です')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: contentType === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: contentType === 'image' ? [9, 16] : undefined,
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedMedia(result.assets[0].uri)
        setUrl(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Camera picker error:', error)
      Alert.alert('エラー', 'カメラの起動に失敗しました')
    }
  }

  const showMediaPicker = () => {
    Alert.alert(
      'メディアを選択',
      'どこからメディアを選択しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'フォトライブラリ', onPress: handleImagePicker },
        { text: 'カメラ', onPress: handleCameraPicker },
      ]
    )
  }

  const validateUrl = (url: string) => {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
    const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    const tiktokPattern = /^(https?:\/\/)?(www\.)?tiktok\.com\/.+/
    
    return urlPattern.test(url) || youtubePattern.test(url) || tiktokPattern.test(url)
  }

  const extractThumbnailFromUrl = (url: string) => {
    // YouTube URLからサムネイルを抽出
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`
    }
    
    // TikTok URLの場合はデフォルトサムネイル
    if (url.includes('tiktok.com')) {
      return 'https://via.placeholder.com/300x400/FF0050/FFFFFF?text=TikTok'
    }
    
    return undefined
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください')
      return
    }

    if (!url.trim()) {
      Alert.alert('エラー', contentType === 'url' ? 'URLを入力してください' : 'メディアを選択してください')
      return
    }

    if (contentType === 'url' && !validateUrl(url)) {
      Alert.alert('エラー', '有効なURLを入力してください')
      return
    }

    try {
      setIsLoading(true)

      const thumbnailUrl = contentType === 'url' ? extractThumbnailFromUrl(url) : selectedMedia || undefined

      const response = await contentAPI.addContent({
        listId,
        type: contentType,
        title: title.trim(),
        description: description.trim() || undefined,
        url: url.trim(),
        thumbnailUrl,
      })

      if (response.success) {
        Alert.alert('成功', 'コンテンツを追加しました', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ])
      } else {
        Alert.alert('エラー', response.error || 'コンテンツの追加に失敗しました')
      }
    } catch (error) {
      console.error('Add content error:', error)
      Alert.alert('エラー', 'コンテンツの追加に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const renderContentTypeSelector = () => (
    <View style={styles.typeSelector}>
      <Text style={styles.sectionTitle}>コンテンツタイプ</Text>
      <View style={styles.typeButtons}>
        <TouchableOpacity
          style={[styles.typeButton, contentType === 'image' && styles.typeButtonActive]}
          onPress={() => {
            setContentType('image')
            setSelectedMedia(null)
            setUrl('')
          }}
        >
          <Ionicons 
            name="image" 
            size={24} 
            color={contentType === 'image' ? '#FFFFFF' : '#007AFF'} 
          />
          <Text style={[styles.typeButtonText, contentType === 'image' && styles.typeButtonTextActive]}>
            画像
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, contentType === 'video' && styles.typeButtonActive]}
          onPress={() => {
            setContentType('video')
            setSelectedMedia(null)
            setUrl('')
          }}
        >
          <Ionicons 
            name="videocam" 
            size={24} 
            color={contentType === 'video' ? '#FFFFFF' : '#007AFF'} 
          />
          <Text style={[styles.typeButtonText, contentType === 'video' && styles.typeButtonTextActive]}>
            動画
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, contentType === 'url' && styles.typeButtonActive]}
          onPress={() => {
            setContentType('url')
            setSelectedMedia(null)
            setUrl('')
          }}
        >
          <Ionicons 
            name="link" 
            size={24} 
            color={contentType === 'url' ? '#FFFFFF' : '#007AFF'} 
          />
          <Text style={[styles.typeButtonText, contentType === 'url' && styles.typeButtonTextActive]}>
            URL
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderMediaSelector = () => {
    if (contentType === 'url') {
      return (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>URL *</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://www.youtube.com/watch?v=... または https://www.tiktok.com/..."
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            YouTube、TikTok、またはその他のWebサイトのURLを入力してください
          </Text>
        </View>
      )
    }

    return (
      <View style={styles.mediaSelector}>
        <Text style={styles.label}>{contentType === 'image' ? '画像' : '動画'} *</Text>
        
        {selectedMedia ? (
          <View style={styles.selectedMediaContainer}>
            <Image source={{ uri: selectedMedia }} style={styles.selectedMedia} />
            <TouchableOpacity
              style={styles.changeMediaButton}
              onPress={showMediaPicker}
            >
              <Text style={styles.changeMediaButtonText}>変更</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.mediaPickerButton} onPress={showMediaPicker}>
            <Ionicons 
              name={contentType === 'image' ? 'image-outline' : 'videocam-outline'} 
              size={48} 
              color="#666" 
            />
            <Text style={styles.mediaPickerText}>
              {contentType === 'image' ? '画像を選択' : '動画を選択'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {renderContentTypeSelector()}
            
            {renderMediaSelector()}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>タイトル *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="コンテンツのタイトルを入力"
                maxLength={200}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>説明</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="コンテンツの説明を入力（任意）"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add" size={24} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>コンテンツを追加</Text>
              </>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  typeSelector: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  mediaSelector: {
    marginBottom: 24,
  },
  mediaPickerButton: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    gap: 12,
  },
  mediaPickerText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  selectedMediaContainer: {
    position: 'relative',
  },
  selectedMedia: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  changeMediaButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  changeMediaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
})

export default AddContentScreen 