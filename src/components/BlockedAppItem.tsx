import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlockedApp } from '../types/apps';

interface Props {
  item: BlockedApp;
  onRemove: (packageName: string) => void;
}

export default function BlockedAppItem({ item, onRemove }: Props) {
  return (
    <View style={styles.appCard}>
      <View style={styles.appInfo}>
        <Text style={styles.appName}>{item.name || item.packageName}</Text>
        <Text style={styles.packageName}>{item.packageName}</Text>
        {item.dateAdded && <Text style={styles.dateAdded}>Added: {item.dateAdded}</Text>}
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => onRemove(item.packageName)}>
        <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Remove</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  appCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  appInfo: { flex: 1 },
  appName: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  packageName: { fontSize: 14, color: '#64748B', marginBottom: 4 },
  dateAdded: { fontSize: 12, color: '#94A3B8' },
  deleteButton: { padding: 8 },
});
