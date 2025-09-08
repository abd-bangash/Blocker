import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { InstalledApp } from '../types/apps';

interface Props {
  item: InstalledApp;
  onSelect: (app: InstalledApp) => void;
}

export default function InstalledAppItem({ item, onSelect }: Props) {
  return (
    <TouchableOpacity style={styles.installedAppCard} onPress={() => onSelect(item)}>
      <Text style={styles.appName}>{item.name}</Text>
      <Text style={styles.packageName}>{item.packageName}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  installedAppCard: { backgroundColor: '#F0F9FF', borderRadius: 12, padding: 16, marginBottom: 12 },
  appName: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  packageName: { fontSize: 14, color: '#64748B' },
});
