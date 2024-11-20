import { Link, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const UserPage = () => {
  // Search params in expo router
  // const { id } = useLocalSearchParams();
  const {id} = useLocalSearchParams<{id: string}>();  // Typescript
  return (
    <View>
      <Text>UserPage - {id}</Text>
      <Link href="../">Go back to home page</Link>
      
    </View>
  )
}

export default UserPage

const styles = StyleSheet.create({})