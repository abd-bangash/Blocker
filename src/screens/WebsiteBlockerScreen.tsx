// screens/WebsiteBlockerScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity } from 'react-native';
import { getBlockedWebsites, addBlockedWebsite, removeBlockedWebsite } from '../services/blockerService';

export default function WebsiteBlockerScreen() {
  const [blockedSites, setBlockedSites] = useState<string[]>([]);
  const [newSite, setNewSite] = useState('');

  const loadBlockedSites = async () => {
    const sites = await getBlockedWebsites();
    console.log(sites)
    setBlockedSites(sites);
  };

  useEffect(() => {
    loadBlockedSites();
  }, []);

  const handleAddSite = async () => {
    if (newSite.trim().length === 0) return;
    await addBlockedWebsite(newSite.trim());
    console.log("==============>")
    setNewSite('');
    loadBlockedSites();
  };

  const handleRemoveSite = async (site: string) => {
    await removeBlockedWebsite(site);
    loadBlockedSites();
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>Blocked Websites</Text>

      <FlatList
        data={blockedSites}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text>{item}</Text>
            <TouchableOpacity onPress={() => handleRemoveSite(item)}>
              <Text style={{ color: 'red' }}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TextInput
        value={newSite}
        onChangeText={setNewSite}
        placeholder="Enter website to block"
        style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
      />
      <Button title="Add Website" onPress={handleAddSite} />
    </View>
  );
}
