// filepath: src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Switch, StatusBar, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BlockedAppItem from '../components/BlockedAppItem';
import EmptyState from '../components/EmptyState';
import { getBlockedApps, addBlockedApp, removeBlockedApp, isBlockingEnabled, setBlockingEnabled, getBlockSchedule, setBlockSchedule, getBlockedWebsites, removeBlockedWebsite } from '../services/blockerService';
import InstalledAppsModal from './InstalledAppsModal';
import ScheduleScreen from './ScheduleScreen';
import { BlockedApp, InstalledApp } from '../types/apps';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {addBlockedWebsite} from '../services/blockerService'
export default function HomeScreen() {
  const [blockedApps, setBlockedApps] = useState<BlockedApp[]>([]);
  const [showInstalledModal, setShowInstalledModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedule, setSchedule] = useState<{ start: number; end: number } | null>(null);
  const [blockedWebsites, setBlockedWebsites] = useState<string[]>([]);
  const [showAddWebsiteModal, setShowAddWebsiteModal] = useState(false);
  const [newWebsite, setNewWebsite] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    loadBlockedApps();
    checkBlockingStatus();
    loadSchedule();
    loadBlockedWebsites();
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

  const loadSchedule = async () => {
    const sched = await getBlockSchedule();
    setSchedule(sched);
  };

  const loadBlockedWebsites = async () => {
    const sites = await getBlockedWebsites();
    setBlockedWebsites(sites);
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

  const handleSaveSchedule = async (start: number, end: number) => {
    await setBlockSchedule(start, end);
    setSchedule({ start, end });
    Alert.alert('Success', 'Blocking schedule updated!');
  };

  const handleAddWebsite = async () => {
    if (newWebsite.trim().length > 0) {
      await addBlockedWebsite(newWebsite.trim());
      setNewWebsite('');
      setShowAddWebsiteModal(false);
      loadBlockedWebsites();
    }
  };

  function formatSchedule(sched: { start: number; end: number } | null) {
    if (!sched || sched.start === -1 || sched.end === -1) return 'Always';
    function minToDate(m: number) {
      const d = new Date();
      d.setHours(Math.floor(m / 60), m % 60, 0, 0);
      return d;
    }
    function formatTime(date: Date) {
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    return `${formatTime(minToDate(sched.start))} - ${formatTime(minToDate(sched.end))}`;
  }

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

      {/* Schedule Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        <View style={styles.row}>
          <Text style={styles.sectionValue}>{formatSchedule(schedule)}</Text>
          <TouchableOpacity style={styles.sectionAction} onPress={() => setShowScheduleModal(true)}>
            <Text style={styles.sectionActionText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Blocked Apps Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blocked Apps</Text>
        <FlatList
          data={blockedApps}
          renderItem={({ item }) => (
            <BlockedAppItem item={item as BlockedApp} onRemove={handleRemoveBlockedApp} />
          )}
          keyExtractor={item => item.packageName}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
        />
        <TouchableOpacity
          style={[styles.addAppButton, { backgroundColor: '#2563EB' }]}
          onPress={() => setShowInstalledModal(true)}
        >
          <Text style={styles.addAppButtonText}>+ Add App</Text>
        </TouchableOpacity>
      </View>

      {/* Blocked Websites Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blocked Websites</Text>
        <FlatList
          data={blockedWebsites}
          renderItem={({ item }) => (
            <View style={styles.websiteCard}>
              <Text style={styles.websiteName}>{item}</Text>
              <TouchableOpacity onPress={async () => {
                await removeBlockedWebsite(item);
                loadBlockedWebsites();
              }}>
                <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={item => item}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
        />
        <TouchableOpacity
          style={[styles.addWebsiteButton, { backgroundColor: '#F59E42' }]}
          onPress={() => setShowAddWebsiteModal(true)}
        >
          <Text style={styles.addWebsiteButtonText}>+ Add Website</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.fabRow}>
        <TouchableOpacity style={[styles.fab, { backgroundColor: '#2563EB' }]} onPress={() => setShowInstalledModal(true)}>
          <Text style={styles.fabIcon}>+</Text>
          <Text style={styles.fabLabel}>Add App</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, { backgroundColor: '#16A34A' }]} onPress={() => navigation.navigate('UsageLimit')}>
          <Text style={styles.fabIcon}>⏱️</Text>
          <Text style={styles.fabLabel}>Usage Limit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, { backgroundColor: '#F59E42' }]} onPress={() => navigation.navigate('WebsiteBlocker')}>
          <Text style={styles.fabIcon}>🌐</Text>
          <Text style={styles.fabLabel}>Websites</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <InstalledAppsModal
        visible={showInstalledModal}
        onClose={() => setShowInstalledModal(false)}
        onAppSelect={async (app: InstalledApp) => {
          await addBlockedApp(app.packageName);
          loadBlockedApps();
          setShowInstalledModal(false);
        }}
      />
      <ScheduleScreen
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={handleSaveSchedule}
        initialStart={schedule?.start ?? 0}
        initialEnd={schedule?.end ?? 480}
      />
      <Modal visible={showAddWebsiteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Add Website to Block</Text>
            <TextInput
              value={newWebsite}
              onChangeText={setNewWebsite}
              placeholder="Enter website (e.g. youtube.com)"
              style={styles.websiteInput}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity
                style={{ marginRight: 16 }}
                onPress={() => {
                  setShowAddWebsiteModal(false);
                  setNewWebsite('');
                }}
              >
                <Text style={{ color: 'red', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddWebsite}
              >
                <Text style={{ color: '#2563EB', fontWeight: 'bold' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  section: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 6 },
  sectionValue: { fontSize: 16, color: '#475569', flex: 1 },
  sectionAction: { marginLeft: 12, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#E0E7EF', borderRadius: 8 },
  sectionActionText: { color: '#2563EB', fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center' },
  list: { maxHeight: 220 },
  fabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  fab: {
    flex: 1,
    marginHorizontal: 8,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    height: 56,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  fabIcon: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  fabLabel: { fontSize: 12, color: '#FFF', fontWeight: 'bold', marginTop: 2 },
  websiteCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  websiteName: { fontSize: 16, color: '#1E293B', fontWeight: '500' },
  addWebsiteButton: {
    marginTop: 8,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addWebsiteButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'stretch',
  },
  websiteInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
  },
  addAppButton: {
    marginTop: 8,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAppButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});