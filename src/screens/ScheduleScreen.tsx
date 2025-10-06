import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (start: number, end: number) => void; // minutes since midnight
  initialStart?: number;
  initialEnd?: number;
}

function minutesToDate(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  return date;
}

function dateToMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function formatTime(date: Date) {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

export default function ScheduleScreen({
  visible,
  onClose,
  onSave,
  initialStart = 0,
  initialEnd = 480,
}: Props) {
  const [startTime, setStartTime] = useState(minutesToDate(initialStart));
  const [endTime, setEndTime] = useState(minutesToDate(initialEnd));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Set Blocking Schedule</Text>
          <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.timeButton}>
            <Text style={styles.timeLabel}>Start Time</Text>
            <Text style={styles.timeValue}>{formatTime(startTime)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.timeButton}>
            <Text style={styles.timeLabel}>End Time</Text>
            <Text style={styles.timeValue}>{formatTime(endTime)}</Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(_, date) => {
                setShowStartPicker(false);
                if (date) setStartTime(date);
              }}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(_, date) => {
                setShowEndPicker(false);
                if (date) setEndTime(date);
              }}
            />
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={{ color: 'red', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onSave(dateToMinutes(startTime), dateToMinutes(endTime));
                onClose();
              }}
              style={styles.saveButton}
            >
              <Text style={{ color: '#2563EB', fontWeight: 'bold' }}>Save</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.alwaysButton}
            onPress={() => {
              onSave(-1, -1);
              onClose();
            }}
          >
            <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 16 }}>Always Block</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  timeButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  timeLabel: { fontSize: 16, color: '#475569' },
  timeValue: { fontSize: 18, fontWeight: 'bold', color: '#2563EB' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  cancelButton: { padding: 12 },
  saveButton: { padding: 12 },
  alwaysButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
  },
});