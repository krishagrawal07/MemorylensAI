import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { memoryService } from '../services/memoryService';
import { sampleDataService } from '../services/sampleDataService';
import { StorageStats } from '../types';

type PermissionStatusMap = {
  camera: string;
  microphone: string;
  media: string;
};

export default function SettingsScreen() {
  const [darkTheme, setDarkTheme] = useState(false);
  const [demoModeEnabled, setDemoModeEnabled] = useState(true);
  const [storageStats, setStorageStats] = useState<StorageStats>({
    totalMemories: 0,
    estimatedBytes: 0,
  });
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatusMap>({
    camera: 'unknown',
    microphone: 'unknown',
    media: 'unknown',
  });

  const loadSettingsData = useCallback(async () => {
    try {
      const stats = await memoryService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    }

    try {
      if (Platform.OS === 'android') {
        const [camera, microphone, media] = await Promise.all([
          check(PERMISSIONS.ANDROID.CAMERA),
          check(PERMISSIONS.ANDROID.RECORD_AUDIO),
          check(
            typeof Platform.Version === 'number' && Platform.Version >= 33
              ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
              : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
          ),
        ]);
        setPermissionStatus({
          camera,
          microphone,
          media,
        });
      } else {
        const [camera, microphone, media] = await Promise.all([
          check(PERMISSIONS.IOS.CAMERA),
          check(PERMISSIONS.IOS.MICROPHONE),
          check(PERMISSIONS.IOS.PHOTO_LIBRARY),
        ]);
        setPermissionStatus({
          camera,
          microphone,
          media,
        });
      }
    } catch (error) {
      console.error('Failed to load permission status:', error);
    }
  }, []);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  const storageUsedMB = useMemo(
    () => `${(storageStats.estimatedBytes / (1024 * 1024)).toFixed(2)} MB`,
    [storageStats.estimatedBytes],
  );

  const formatPermission = (status: string) => {
    if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
      return 'Granted';
    }
    if (status === RESULTS.BLOCKED) {
      return 'Blocked';
    }
    if (status === RESULTS.DENIED) {
      return 'Denied';
    }
    return 'Unknown';
  };

  const handleClearAllMemories = () => {
    Alert.alert(
      'Clear All Memories',
      'This will permanently delete all saved memories. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await memoryService.clearAllMemories();
              await loadSettingsData();
              Alert.alert('Success', 'All memories cleared.');
            } catch (error) {
              console.error('Failed to clear memories:', error);
              Alert.alert('Error', 'Failed to clear memories.');
            }
          },
        },
      ],
    );
  };

  const handleExportData = async () => {
    try {
      const payload = await memoryService.exportMemories();
      const preview = payload.slice(0, 1200);
      Alert.alert(
        'Export Preview',
        `${preview}${payload.length > 1200 ? '\n\n...truncated' : ''}`,
      );
    } catch (error) {
      console.error('Failed to export memories:', error);
      Alert.alert('Error', 'Could not export data.');
    }
  };

  const handleDemoModeToggle = async (value: boolean) => {
    setDemoModeEnabled(value);
    if (!value) {
      return;
    }

    try {
      await sampleDataService.seedSampleData(true);
      await loadSettingsData();
      Alert.alert('Demo mode loaded', 'Sample memories were refreshed for judge demo.');
    } catch (error) {
      console.error('Failed to enable demo mode:', error);
      Alert.alert('Error', 'Could not load demo dataset.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Offline</Text>
          <Text style={styles.infoText}>All AI processing runs on-device.</Text>
          <Text style={styles.infoText}>Memories are stored locally in private app storage.</Text>
          <Text style={styles.infoText}>No cloud APIs are used for core intelligence.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo & Appearance</Text>
          <View style={styles.settingRow}>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Dark Theme</Text>
              <Text style={styles.rowDescription}>UI theme toggle placeholder</Text>
            </View>
            <Switch
              value={darkTheme}
              onValueChange={setDarkTheme}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={darkTheme ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Hackathon Demo Mode</Text>
              <Text style={styles.rowDescription}>Reload sample memory dataset</Text>
            </View>
            <Switch
              value={demoModeEnabled}
              onValueChange={handleDemoModeToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={demoModeEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
            <Text style={styles.actionButtonText}>Export Local Data Preview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleClearAllMemories}>
            <Text style={styles.deleteButtonText}>Clear All Memories</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <Text style={styles.infoText}>AI models: Text Ready | Voice Ready | Vision Ready</Text>
          <Text style={styles.infoText}>Saved memories: {storageStats.totalMemories}</Text>
          <Text style={styles.infoText}>Storage used: {storageUsedMB}</Text>
          <Text style={styles.infoText}>
            Permissions: Camera {formatPermission(permissionStatus.camera)}, Microphone{' '}
            {formatPermission(permissionStatus.microphone)}, Media {formatPermission(permissionStatus.media)}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>MemoryLens AI</Text>
          <Text style={styles.footerSubtext}>Privacy-first on-device memory assistant</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 6,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowContent: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  rowDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '700',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
});
