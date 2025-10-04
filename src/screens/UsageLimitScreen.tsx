// filepath: src/screens/UsageLimitScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { getAppUsageMinutes } from '../services/appUsageService';
import { InstalledApp } from '../types/apps';
import { getInstalledApps } from '../services/installedAppsService';
import { getUsageLimit, setUsageLimit, addBlockedApp } from '../services/blockerService';

export default function UsageLimitScreen() {
  const [apps, setApps] = useState<(InstalledApp & { usage?: number; limit?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedApp, setSelectedApp] = useState<InstalledApp | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [limitInput, setLimitInput] = useState('');

  const loadApps = async () => {
    try {
      const installed = await getInstalledApps();
      const withUsage: (InstalledApp & { usage?: number; limit?: number })[] = [];

      for (const app of installed) {
        const minutes = await getAppUsageMinutes(app.packageName);
        const limit = await getUsageLimit(app.packageName);
        withUsage.push({ ...app, usage: minutes, limit });
      }

      withUsage.sort((a, b) => (b.usage || 0) - (a.usage || 0));
      setApps(withUsage);
    } catch (err) {
      console.error('Failed to load apps:', err);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  let isMounted = true;

  const refreshApps = async () => {
    try {
      const installed = await getInstalledApps();
      const withUsage: (InstalledApp & { usage?: number; limit?: number })[] = [];

      for (const app of installed) {
        const minutes = await getAppUsageMinutes(app.packageName);
        const limit = await getUsageLimit(app.packageName);
        withUsage.push({ ...app, usage: minutes, limit });
      }

      withUsage.sort((a, b) => (b.usage || 0) - (a.usage || 0));
      if (isMounted) setApps(withUsage);
    } catch (err) {
      console.error("Failed to refresh apps:", err);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  // initial load
  refreshApps();

  // refresh every 30s
  const interval = setInterval(refreshApps, 30000);

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}, []);



  const openLimitModal = (app: InstalledApp) => {
    setSelectedApp(app);
    setLimitInput('');
    setModalVisible(true);
  };

const saveLimit = async () => {
  if (!selectedApp) return;

  const minutes = parseInt(limitInput, 10) || 0;
  await setUsageLimit(selectedApp.packageName, minutes);

  setModalVisible(false);
  setSelectedApp(null);
  setLimitInput('');

  // refresh list to show updated limit
  await loadApps(); // or call refreshApps() if you make it global
};

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={apps}
        keyExtractor={(item) => item.packageName}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.pkg}>{item.packageName}</Text>
              <Text style={styles.usage}>
                Used today: {item.usage ? `${item.usage} min` : '0 min'}
              </Text>
              <Text style={styles.limit}>
                Limit: {item.limit && item.limit > 0 ? `${item.limit} min` : 'None'}
              </Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={() => openLimitModal(item)}>
              <Text style={styles.buttonText}>Set Limit</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Modal for setting limit */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
              Set Usage Limit
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter limit in minutes"
              keyboardType="numeric"
              value={limitInput}
              onChangeText={setLimitInput}
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveLimit}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ marginTop: 12, color: '#2563EB' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    marginBottom: 12,
  },
  name: { fontSize: 16, fontWeight: 'bold' },
  pkg: { fontSize: 12, color: '#475569' },
  usage: { marginTop: 4, fontSize: 14, color: '#1E3A8A' },
  limit: { marginTop: 2, fontSize: 13, color: '#334155' },
  button: { backgroundColor: '#2563EB', padding: 8, borderRadius: 8 },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    width: '100%',
    padding: 8,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveText: { color: '#FFF', fontWeight: 'bold' },
});
