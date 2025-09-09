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
  setBlockingEnabled,
  getBlockSchedule,
  setBlockSchedule
} from '../services/blockerService';
import InstalledAppsModal from './InstalledAppsModal';
import ScheduleScreen from './ScheduleScreen';
import { BlockedApp, InstalledApp } from '../types/apps';

export default function HomeScreen() {
  const [blockedApps, setBlockedApps] = useState<BlockedApp[]>([]);
  const [showInstalledModal, setShowInstalledModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedule, setSchedule] = useState<{ start: number; end: number } | null>(null);

  useEffect(() => {
    loadBlockedApps();
    checkBlockingStatus();
    loadSchedule();
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
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>{blockedApps.length} apps blocked</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Text style={{ color: '#475569', fontWeight: 'bold' }}>
            Schedule: {formatSchedule(schedule)}
          </Text>
          {/* <TouchableOpacity
            style={{
              marginLeft: 8,
              backgroundColor: '#2563EB',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}
            onPress={async () => {
              await setBlockSchedule(-1, -1);
              setSchedule({ start: -1, end: -1 });
              Alert.alert('Schedule', 'Blocking is now always enabled!');
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>Always</Text>
          </TouchableOpacity> */}
          {/* <TouchableOpacity style={styles.scheduleIcon} onPress={() => setShowScheduleModal(true)}>
            <Text style={{ fontSize: 22, color: '#2563EB', marginLeft: 8 }}>⏰</Text>
          </TouchableOpacity> */}
        </View>
      </View>
      <FlatList
        data={blockedApps}
        renderItem={({ item }) => <BlockedAppItem item={item as BlockedApp} onRemove={handleRemoveBlockedApp} />}
        keyExtractor={item => item.packageName}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
      />
      <TouchableOpacity
        style={styles.scheduleFab}
        onPress={() => setShowScheduleModal(true)}
      >
        {/* Alarm icon (Unicode or use react-native-vector-icons for better look) */}
        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 24 }}>⏰</Text>
      </TouchableOpacity>
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
      <ScheduleScreen
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={handleSaveSchedule}
        initialStart={schedule?.start ?? 0}
        initialEnd={schedule?.end ?? 480}
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
  scheduleIcon: { marginLeft: 8, padding: 4 },
  list: { flex: 1, paddingHorizontal: 16 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2563EB', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  scheduleFab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    height: 56,
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});