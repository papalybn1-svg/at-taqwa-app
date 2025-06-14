import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ParametresScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paramètres</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F5F7' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#174C3C' },
}); 