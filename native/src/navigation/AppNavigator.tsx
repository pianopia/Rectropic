import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import { useAuth } from '../contexts/AuthContext'
import LoadingScreen from '../screens/LoadingScreen'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import HomeScreen from '../screens/HomeScreen'
import SwipeScreen from '../screens/SwipeScreen'
import CreateListScreen from '../screens/CreateListScreen'
import ListMembersScreen from '../screens/ListMembersScreen'
import ProfileScreen from '../screens/ProfileScreen'
import SettingsScreen from '../screens/SettingsScreen'
import AddContentScreen from '../screens/AddContentScreen'

export type RootStackParamList = {
  Login: undefined
  Register: undefined
  Main: undefined
  CreateList: undefined
  ListMembers: { listId: string }
  AddContent: { listId: string }
  Settings: undefined
}

export type TabParamList = {
  Home: undefined
  Swipe: { listId: string }
  Profile: undefined
}

const Stack = createStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'Swipe') {
            iconName = focused ? 'play-circle' : 'play-circle-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          } else {
            iconName = 'help-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarLabel: 'リスト' }}
      />
      <Tab.Screen 
        name="Swipe" 
        component={SwipeScreen} 
        options={{ tabBarLabel: 'スワイプ' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'プロフィール' }}
      />
    </Tab.Navigator>
  )
}

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen 
              name="CreateList" 
              component={CreateListScreen}
              options={{ 
                headerShown: true,
                title: 'リスト作成',
                presentation: 'modal'
              }}
            />
            <Stack.Screen 
              name="ListMembers" 
              component={ListMembersScreen}
              options={{ 
                headerShown: true,
                title: 'メンバー管理'
              }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ 
                headerShown: true,
                title: '設定'
              }}
            />
            <Stack.Screen 
              name="AddContent" 
              component={AddContentScreen}
              options={{ 
                headerShown: true,
                title: 'コンテンツ追加',
                presentation: 'modal'
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator 