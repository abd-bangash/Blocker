// filepath: src/screens/InstalledAppsModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal, SafeAreaView, TextInput, SectionList, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { getInstalledApps } from '../services/installedAppsService';
import { InstalledApp } from '../types/apps';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAppsSelect: (apps: InstalledApp[]) => void; // <-- changed for multi-select
}

export default function InstalledAppsModal({ visible, onClose, onAppsSelect }: Props) {
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<{ [pkg: string]: InstalledApp }>({});

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setSelected({});
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

  const toggleSelect = (app: InstalledApp) => {
    setSelected(prev => {
      const copy = { ...prev };
      if (copy[app.packageName]) {
        delete copy[app.packageName];
      } else {
        copy[app.packageName] = app;
      }
      return copy;
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <SafeAreaView style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 16,
          width: '90%',
          maxHeight: '80%',
        }}>
          {isLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={{ marginTop: 12 }}>Loading apps...</Text>
            </View>
          ) : (
            <>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Select Apps to Block</Text>
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
                style={{ marginBottom: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{
                      backgroundColor: selected[item.packageName] ? '#DBEAFE' : '#F0F9FF',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onPress={() => toggleSelect(item)}
                  >
                    <View>
                      <Text style={{ fontWeight: 'bold', color: '#1E293B' }}>{item.name}</Text>
                      <Text style={{ color: '#64748B', fontSize: 12 }}>{item.packageName}</Text>
                    </View>
                    {selected[item.packageName] && (
                      <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 18 }}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
                renderSectionHeader={({ section: { title } }) => (
                  <Text style={{ fontWeight: 'bold', fontSize: 16, marginVertical: 2 }}>{title}</Text>
                )}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                <TouchableOpacity onPress={onClose} style={{ marginRight: 16 }}>
                  <Text style={{ color: 'red', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    onAppsSelect(Object.values(selected));
                  }}
                  disabled={Object.keys(selected).length === 0}
                >
                  <Text style={{
                    color: Object.keys(selected).length === 0 ? '#A0AEC0' : '#2563EB',
                    fontWeight: 'bold',
                    fontSize: 16
                  }}>Done</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}