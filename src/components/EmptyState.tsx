import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Blocked Apps</Text>
      <Text style={styles.emptyDescription}>Add apps to block them from being accessed</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#64748B', marginTop: 16 },
  emptyDescription: { fontSize: 16, color: '#94A3B8', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
});
