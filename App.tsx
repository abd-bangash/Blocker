/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Switch,
  StatusBar,
  Modal,
  SectionList,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeModules } from 'react-native';

const { InstalledApps, Blocker } = NativeModules;

interface BlockedApp {
  packageName: string;
  name: string;
  dateAdded?: string;
}

interface InstalledApp {
  packageName: string;
  name: string;
}

export default function App() {
  const [blockedApps, setBlockedApps] = useState<BlockedApp[]>([]);
  const [showInstalledModal, setShowInstalledModal] = useState(false);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [isBlocking, setIsBlocking] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [isLoadingInstalled, setIsLoadingInstalled] = useState(false);

  useEffect(() => {
    loadBlockedApps();
  }, []);

  const loadBlockedApps = async () => {
    try {
      // If you have a BlockerService, use it. Otherwise, use Blocker directly.
      if (Blocker.getBlockedApps) {
        const apps = await Blocker.getBlockedApps();
        setBlockedApps(apps);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load blocked apps');
    }
  };

  const removeBlockedApp = async (packageName: string) => {
    Alert.alert('Remove App', 'Remove this app from blocked list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await Blocker.removeBlockedApp(packageName);
            loadBlockedApps();
          } catch (error) {
            Alert.alert('Error', 'Failed to remove app');
          }
        },
      },
    ]);
  };

  const fetchInstalledApps = async () => {
    setShowInstalledModal(true); // Show modal immediately
    setIsLoadingInstalled(true);
    try {
      const apps = await InstalledApps.getInstalledApps();
      console.log(apps)
      setInstalledApps(apps);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch installed apps');
    } finally {
      setIsLoadingInstalled(false);
    }
  };

  const addBlockedApp = async (app: InstalledApp) => {
    try {
      console.log("=============>",Blocker)
      await Blocker.addBlockedApp(app.packageName);
      loadBlockedApps();
      Alert.alert('Success', `${app.name} blocked`);
    } catch (error) {
      Alert.alert('Error', 'Failed to block app');
    }
  };

  const renderBlockedApp = ({ item }: { item: BlockedApp }) => (
    <View style={styles.appCard}>
      <View style={styles.appInfo}>
        <Text style={styles.appName}>{item.name || item.packageName}</Text>
        <Text style={styles.packageName}>{item.packageName}</Text>
        {item.dateAdded && <Text style={styles.dateAdded}>Added: {item.dateAdded}</Text>}
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => removeBlockedApp(item.packageName)}>
        <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const renderInstalledApp = ({ item }: { item: InstalledApp }) => (
    <TouchableOpacity
      style={styles.installedAppCard}
      onPress={() => {
        addBlockedApp(item);
        setShowInstalledModal(false);
      }}
    >
      <Text style={styles.appName}>{item.name}</Text>
      <Text style={styles.packageName}>{item.packageName}</Text>
    </TouchableOpacity>
  );

  function getGroupedApps(apps: InstalledApp[]) {
    const filtered = apps
      .filter(app =>
        app.name.toLowerCase().includes(searchText.toLowerCase()) ||
        app.packageName.toLowerCase().includes(searchText.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    const grouped: { [key: string]: InstalledApp[] } = {};
    filtered.forEach(app => {
      const letter = app.name[0].toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(app);
    });
    return grouped;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>App Blocker</Text>
        <View style={styles.toggleSection}>
          <Text style={styles.toggleLabel}>{isBlocking ? 'Blocking Enabled' : 'Blocking Disabled'}</Text>
          <Switch
            value={isBlocking}
            onValueChange={setIsBlocking}
            trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
            thumbColor={isBlocking ? '#2563EB' : '#64748B'}
          />
        </View>
      </View>

      {/* Blocked apps count */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>{blockedApps.length} apps blocked</Text>
      </View>

      {/* Blocked Apps List */}
      <FlatList
        data={blockedApps}
        renderItem={renderBlockedApp}
        keyExtractor={(item) => item.packageName}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Blocked Apps</Text>
            <Text style={styles.emptyDescription}>Add apps to block them from being accessed</Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={fetchInstalledApps}>
        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 24 }}>+</Text>
      </TouchableOpacity>

      {/* Installed Apps Modal */}
      <Modal visible={showInstalledModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
          {isLoadingInstalled ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={{ marginTop: 12 }}>Loading apps...</Text>
            </View>
          ) : (
            <>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 8,
                  padding: 8,
                  marginBottom: 12,
                }}
                placeholder="Search apps..."
                value={searchText}
                onChangeText={setSearchText}
              />
              <SectionList
                sections={Object.entries(getGroupedApps(installedApps)).map(([title, data]) => ({ title, data }))}
                keyExtractor={item => item.packageName}
                renderItem={renderInstalledApp}
                renderSectionHeader={({ section: { title } }) => (
                  <Text style={{ fontWeight: 'bold', fontSize: 18, marginVertical: 4 }}>{title}</Text>
                )}
              />
              <TouchableOpacity onPress={() => setShowInstalledModal(false)} style={{ marginTop: 20, alignItems: 'center' }}>
                <Text style={{ color: 'red', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </SafeAreaView>
      </Modal>
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
