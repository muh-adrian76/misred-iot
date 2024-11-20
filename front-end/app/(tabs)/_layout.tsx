import { Tabs } from 'expo-router'
import React from 'react'
import { StyleSheet } from 'react-native'

const TabsLayout = () => {
  return (
    <Tabs>
        <Tabs.Screen name="index" options={{
            headerTitle: 'Home Page',
            title: 'Dashboard',
        }}/>
        <Tabs.Screen name="users/[id]" options={{
            headerTitle: 'User Page',
            title: 'Settings',
        }}/>
    </Tabs>
  )
}

export default TabsLayout

const styles = StyleSheet.create({})