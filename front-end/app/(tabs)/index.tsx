import { Link, router } from 'expo-router'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

const App = () => {
  return (
    <View>
      <Text>App</Text>
      <Link href="/users/1">Go to user 1</Link>
      
      {/* Submit button -> redirect to other page*/}
      {/* <Pressable onPress={() => router.push('/users/2')}> */}
      <Pressable onPress = {() =>
          router.push({
            pathname: '/users/[id]',
            params: { id: '2' } 
          })
        }>
        <Text>Go to user 2</Text>
      </Pressable>
    </View>
  )
}

export default App

const styles = StyleSheet.create({})