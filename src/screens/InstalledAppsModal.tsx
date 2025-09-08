// filepath: src/screens/InstalledAppsModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal, SafeAreaView, TextInput, SectionList, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import InstalledAppItem from '../components/InstalledAppItem';
import { getInstalledApps } from '../services/installedAppsService';
import { InstalledApp } from '../types/apps';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAppSelect: (app: InstalledApp) => void;
}

export default function InstalledAppsModal({ visible, onClose, onAppSelect }: Props) {
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      getInstalledApps()
        .then(apps => setInstalledApps(apps))
        .finally(() => setIsLoading(false));
    }
  }, [visible]);

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
    return Object.entries(grouped).map(([title, data]) => ({ title, data }));
  }

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={{ flex: 1, padding: 16 }}>
        {isLoading ? (
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
              sections={getGroupedApps(installedApps)}
              keyExtractor={item => item.packageName}
              renderItem={({ item }) => (
                <InstalledAppItem item={item} onSelect={onAppSelect} />
              )}
              renderSectionHeader={({ section: { title } }) => (
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginVertical: 4 }}>{title}</Text>
              )}
            />
            <TouchableOpacity onPress={onClose} style={{ marginTop: 20, alignItems: 'center' }}>
              <Text style={{ color: 'red', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}