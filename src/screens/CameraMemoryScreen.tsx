import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '../components/AppIcon';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { RootStackParamList } from '../navigation/AppNavigator';
import { memoryService } from '../services/memoryService';

type CameraMemoryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CameraMemory'
>;

type Props = {
  navigation: CameraMemoryScreenNavigationProp;
};

type CaptureMode = 'photo' | 'multimodal';

export default function CameraMemoryScreen({ navigation }: Props) {
  const [mode, setMode] = useState<CaptureMode>('photo');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [contextText, setContextText] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [saving, setSaving] = useState(false);

  const pickFromCamera = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
    });

    if (result.didCancel) {
      return;
    }

    const uri = result.assets?.[0]?.uri;
    if (!uri) {
      Alert.alert('Capture failed', 'Could not read captured image.');
      return;
    }
    setImageUri(uri);
  };

  const pickFromGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
      includeBase64: false,
    });

    if (result.didCancel) {
      return;
    }

    const uri = result.assets?.[0]?.uri;
    if (!uri) {
      Alert.alert('Selection failed', 'Could not load selected image.');
      return;
    }
    setImageUri(uri);
  };

  const handleSave = async () => {
    if (!imageUri) {
      Alert.alert('Image required', 'Capture or choose an image first.');
      return;
    }

    if (mode === 'multimodal' && !voiceTranscript.trim() && !contextText.trim()) {
      Alert.alert('More context needed', 'Add voice transcript or text context for multimodal memory.');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'photo') {
        await memoryService.createImageMemory(imageUri, contextText.trim());
      } else {
        await memoryService.createMultimodalMemoryFromInputs(
          imageUri,
          voiceTranscript.trim(),
          contextText.trim(),
        );
      }

      Alert.alert('Memory saved', 'Photo memory has been processed and indexed locally.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed saving camera memory:', error);
      Alert.alert('Save failed', 'Could not save this memory.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Camera Memory</Text>
        <Text style={styles.subtitle}>Capture object/location memories and save offline.</Text>
      </View>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'photo' && styles.modeButtonActive]}
          onPress={() => setMode('photo')}
        >
          <Text style={[styles.modeText, mode === 'photo' && styles.modeTextActive]}>Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'multimodal' && styles.modeButtonActive]}
          onPress={() => setMode('multimodal')}
        >
          <Text style={[styles.modeText, mode === 'multimodal' && styles.modeTextActive]}>
            Multimodal
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.captureRow}>
        <TouchableOpacity style={styles.captureButton} onPress={pickFromCamera}>
          <Icon name="photo-camera" size={20} color="#ffffff" />
          <Text style={styles.captureText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureButtonSecondary} onPress={pickFromGallery}>
          <Icon name="photo-library" size={20} color="#007AFF" />
          <Text style={styles.captureTextSecondary}>Gallery</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewCard}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.previewEmpty}>
            <Icon name="image" size={36} color="#9ca3af" />
            <Text style={styles.previewEmptyText}>No image selected yet</Text>
          </View>
        )}
      </View>

      <Text style={styles.label}>Text context (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Example: kept before leaving for Delhi trip."
        value={contextText}
        onChangeText={setContextText}
      />

      {mode === 'multimodal' && (
        <>
          <Text style={styles.label}>Voice transcript</Text>
          <TextInput
            style={[styles.input, styles.multiLine]}
            placeholder="Example: I kept my passport in the second drawer."
            multiline
            value={voiceTranscript}
            onChangeText={setVoiceTranscript}
          />
        </>
      )}

      <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveText}>Save Memory</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 14,
  },
  modeRow: {
    flexDirection: 'row',
    marginBottom: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#ffffff',
  },
  modeText: {
    color: '#374151',
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#007AFF',
  },
  captureRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  captureButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  captureText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  captureTextSecondary: {
    color: '#007AFF',
    fontWeight: '700',
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    minHeight: 180,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
  },
  previewEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  previewEmptyText: {
    marginTop: 8,
    color: '#6b7280',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  multiLine: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 'auto',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
});

