import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Permission,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from 'react-native-permissions';
import { RootStackParamList } from '../navigation/AppNavigator';

type PermissionsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Permissions'
>;

type Props = {
  navigation: PermissionsScreenNavigationProp;
};

function getRequiredPermissions(): Permission[] {
  if (Platform.OS === 'ios') {
    return [
      PERMISSIONS.IOS.CAMERA,
      PERMISSIONS.IOS.MICROPHONE,
      PERMISSIONS.IOS.PHOTO_LIBRARY,
    ];
  }

  const androidPermissions: Permission[] = [
    PERMISSIONS.ANDROID.CAMERA,
    PERMISSIONS.ANDROID.RECORD_AUDIO,
  ];

  if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
    androidPermissions.push(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
  } else {
    androidPermissions.push(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
  }

  return androidPermissions;
}

function isGranted(status: string): boolean {
  return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
}

export default function PermissionsScreen({ navigation }: Props) {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const requiredPermissions = useMemo(() => getRequiredPermissions(), []);

  const handleContinue = () => {
    navigation.replace('MainTabs');
  };

  const handleOpenSettings = async () => {
    try {
      await openSettings();
    } catch (error) {
      console.error('Failed to open settings:', error);
      Alert.alert('Unable to open settings', 'Please open app settings manually.');
    }
  };

  const requestPermissions = async () => {
    if (requesting) {
      return;
    }

    setRequesting(true);
    try {
      const statuses = await Promise.all(
        requiredPermissions.map(permission => request(permission)),
      );
      const allGranted = statuses.every(isGranted);

      if (allGranted) {
        setPermissionsGranted(true);
        Alert.alert('Permissions Granted', 'All set. MemoryLens is ready to capture memories.', [
          { text: 'Continue', onPress: handleContinue },
        ]);
        return;
      }

      const hasBlocked = statuses.includes(RESULTS.BLOCKED);
      const hasUnavailable = statuses.includes(RESULTS.UNAVAILABLE);

      const message = hasBlocked
        ? 'Some permissions are blocked. You can enable them from settings, or continue with limited features.'
        : hasUnavailable
          ? 'Some permissions are unavailable on this device. You can continue and use available features.'
          : 'Some permissions were denied. You can retry now or continue with limited features.';

      Alert.alert('Limited Access Mode', message, [
        { text: 'Continue Anyway', onPress: handleContinue },
        ...(hasBlocked ? [{ text: 'Open Settings', onPress: handleOpenSettings }] : []),
        { text: 'Retry', onPress: requestPermissions },
      ]);
    } catch (error) {
      console.error('Permission request failed:', error);
      Alert.alert(
        'Permission Check Failed',
        'Could not complete permission request. You can continue and grant later from settings.',
        [{ text: 'Continue Anyway', onPress: handleContinue }],
      );
    } finally {
      setRequesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Permissions Needed</Text>
        <Text style={styles.subtitle}>
          MemoryLens AI needs camera, microphone, and local media access to capture private
          on-device memories.
        </Text>

        <View style={styles.permissionsList}>
          <View style={styles.permissionItem}>
            <Icon name="camera-alt" size={24} color="#007AFF" style={styles.permissionIcon} />
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>Camera</Text>
              <Text style={styles.permissionDescription}>
                Capture objects, parking, medicines, and documents
              </Text>
            </View>
          </View>

          <View style={styles.permissionItem}>
            <Icon name="mic" size={24} color="#007AFF" style={styles.permissionIcon} />
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>Microphone</Text>
              <Text style={styles.permissionDescription}>
                Record voice memories and natural language search
              </Text>
            </View>
          </View>

          <View style={styles.permissionItem}>
            <Icon name="folder" size={24} color="#007AFF" style={styles.permissionIcon} />
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>Photos / Files</Text>
              <Text style={styles.permissionDescription}>
                Store and retrieve memory snapshots offline
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.privacyRow}>
          <Icon name="lock" size={18} color="#007AFF" />
          <Text style={styles.privacyNote}>
            Your data stays private and on-device. No cloud upload.
          </Text>
        </View>

        {permissionsGranted ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>Permissions Granted</Text>
            <TouchableOpacity style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TouchableOpacity style={styles.button} onPress={requestPermissions} disabled={requesting}>
              {requesting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Grant Permissions</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleContinue}>
              <Text style={styles.secondaryButtonText}>Continue with Limited Access</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionsList: {
    marginBottom: 32,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  permissionIcon: {
    marginRight: 16,
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  privacyNote: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    marginTop: 12,
    borderColor: '#007AFF',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    color: '#28a745',
    fontWeight: 'bold',
    marginBottom: 16,
  },
});
