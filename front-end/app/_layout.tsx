import { Stack } from 'expo-router'
import React from 'react'
import { StyleSheet } from 'react-native'

const RootLayout = () => {
  return (
    <Stack>
        {/* input page route */}
        <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
    </Stack>
  )
}

export default RootLayout

const styles = StyleSheet.create({})