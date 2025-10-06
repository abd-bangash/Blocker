import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  app: { packageName: string; name: string };
  limit: number;
  usage: number;
  onSetLimit: (packageName: string, minutes: number) => void;
}

export default function UsageLimitItem({ app, limit, usage, onSetLimit }: Props) {
  const [input, setInput] = useState(limit > 0 ? limit.toString() : '');

  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{app.name}</Text>
        <Text style={styles.pkg}>{app.packageName}</Text>
        <Text style={styles.usage}>Used: {usage} min</Text>
        <Text style={styles.limit}>Limit: {limit > 0 ? `${limit} min` : 'None'}</Text>
      </View>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Set limit"
        value={input}
        onChangeText={setInput}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          const min = parseInt(input) || 0;
          onSetLimit(app.packageName, min);
        }}
      >
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', borderRadius: 12, padding: 12, marginBottom: 10 },
  name: { fontWeight: 'bold', fontSize: 16 },
  pkg: { fontSize: 12, color: '#64748B' },
  usage: { fontSize: 12, color: '#2563EB' },
  limit: { fontSize: 12, color: '#475569' },
  input: { width: 60, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 4, marginHorizontal: 8 },
  button: { backgroundColor: '#2563EB', borderRadius: 8, padding: 8 },
});