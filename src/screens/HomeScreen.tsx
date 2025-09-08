// filepath: src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Switch, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BlockedAppItem from '../components/BlockedAppItem';
import EmptyState from '../components/EmptyState';
import {
  getBlockedApps,
  addBlockedApp,
  removeBlockedApp,
  isBlockingEnabled,
  setBlockingEnabled
} from '../services/blockerService';
import InstalledAppsModal from './InstalledAppsModal';
import { BlockedApp, InstalledApp } from '../types/apps';

export default function HomeScreen() {
  const [blockedApps, setBlockedApps] = useState<BlockedApp[]>([]);
  const [showInstalledModal, setShowInstalledModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(true);

  useEffect(() => {
    loadBlockedApps();
    checkBlockingStatus();
  }, []);

  const loadBlockedApps = async () => {
    const apps = await getBlockedApps();
    setBlockedApps(apps);
  };

  const checkBlockingStatus = async () => {
    try {
      const enabled = await isBlockingEnabled();
      setIsBlocking(enabled);
    } catch (error) {
      setIsBlocking(true); // fallback
    }
  };

  const toggleBlocking = async (value: boolean) => {
    try {
      await setBlockingEnabled(value);
      setIsBlocking(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle blocking');
    }
  };

  const handleRemoveBlockedApp = async (packageName: string) => {
    await removeBlockedApp(packageName);
    loadBlockedApps();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.header}>
        <Text style={styles.title}>App Blocker</Text>
        <View style={styles.toggleSection}>
          <Text style={styles.toggleLabel}>{isBlocking ? 'Blocking Enabled' : 'Blocking Disabled'}</Text>
          <Switch
            value={isBlocking}
            onValueChange={toggleBlocking}
            trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
            thumbColor={isBlocking ? '#2563EB' : '#64748B'}
          />
        </View>
      </View>
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>{blockedApps.length} apps blocked</Text>
      </View>
      <FlatList
        data={blockedApps}
        renderItem={({ item }) => <BlockedAppItem item={item as BlockedApp} onRemove={handleRemoveBlockedApp} />}
        keyExtractor={item => item.packageName}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setShowInstalledModal(true)}>
        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 24 }}>+</Text>
      </TouchableOpacity>
      <InstalledAppsModal
        visible={showInstalledModal}
        onClose={() => setShowInstalledModal(false)}
        onAppSelect={async (app: InstalledApp) => {
          await addBlockedApp(app.packageName);
          loadBlockedApps();
          setShowInstalledModal(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 28, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  toggleSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontSize: 16, fontWeight: '600', color: '#475569' },
  statsContainer: { padding: 16, alignItems: 'center' },
  statsText: { fontSize: 16, color: '#64748B', fontWeight: '500' },
  list: { flex: 1, paddingHorizontal: 16 },
  appCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  installedAppCard: { backgroundColor: '#F0F9FF', borderRadius: 12, padding: 16, marginBottom: 12 },
  appInfo: { flex: 1 },
  appName: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  packageName: { fontSize: 14, color: '#64748B', marginBottom: 4 },
  dateAdded: { fontSize: 12, color: '#94A3B8' },
  deleteButton: { padding: 8 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#64748B', marginTop: 16 },
  emptyDescription: { fontSize: 16, color: '#94A3B8', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2563EB', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
});