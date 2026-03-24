import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '../components/AppIcon';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { check, openSettings, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { RootStackParamList } from '../navigation/AppNavigator';
import { speechToTextService } from '../ai/speechToText';
import { memoryService } from '../services/memoryService';

type VoiceNoteScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'VoiceNote'
>;

type Props = {
  navigation: VoiceNoteScreenNavigationProp;
};

const DEMO_PROMPTS = [
  'I kept my wallet in the top shelf near the mirror.',
  'Car parked at gate 3, basement B2 beside pillar 18.',
  'Medicine strip is in kitchen drawer, take after dinner.',
];

type MicPermissionStatus = 'granted' | 'blocked' | 'denied' | 'unavailable' | 'error';

export default function VoiceNoteScreen({ navigation }: Props) {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serviceReady, setServiceReady] = useState(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFallbackTimer = () => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  useEffect(() => {
    let mounted = true;
    const ensureSpeechService = async () => {
      try {
        await speechToTextService.initialize();
        if (mounted) {
          setServiceReady(true);
        }
      } catch (error) {
        console.error('Speech service init failed:', error);
      }
    };
    ensureSpeechService();

    return () => {
      mounted = false;
      clearFallbackTimer();
      speechToTextService.stopListening().catch(error => {
        console.error('Failed to stop listening on unmount:', error);
      });
    };
  }, []);

  const applyDemoFallbackTranscript = () => {
    const fallback = DEMO_PROMPTS[Math.floor(Math.random() * DEMO_PROMPTS.length)];
    setTranscript(fallback);
  };

  const ensureMicPermission = async () => {
    const permission =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.RECORD_AUDIO
        : PERMISSIONS.IOS.MICROPHONE;

    try {
      const current = await check(permission);
      if (current === RESULTS.GRANTED || current === RESULTS.LIMITED) {
        return 'granted';
      }
      if (current === RESULTS.BLOCKED) {
        return 'blocked';
      }
      if (current === RESULTS.UNAVAILABLE) {
        return 'unavailable';
      }

      const requested = await request(permission);
      if (requested === RESULTS.GRANTED || requested === RESULTS.LIMITED) {
        return 'granted';
      }
      if (requested === RESULTS.BLOCKED) {
        return 'blocked';
      }
      if (requested === RESULTS.UNAVAILABLE) {
        return 'unavailable';
      }
      return 'denied';
    } catch (error) {
      console.error('Microphone permission check failed:', error);
      return 'error';
    }
  };

  const ensureSpeechServiceReady = async () => {
    if (serviceReady) {
      return true;
    }

    try {
      await speechToTextService.initialize();
      setServiceReady(true);
      return true;
    } catch (error) {
      console.error('Speech service init retry failed:', error);
      return false;
    }
  };

  const handleOpenSettings = async () => {
    try {
      await openSettings();
    } catch (error) {
      console.error('Failed to open settings from voice note:', error);
      Alert.alert('Open Settings Failed', 'Please open app settings manually to enable microphone access.');
    }
  };

  const handleStartListening = async () => {
    if (listening) {
      return;
    }

    console.log('Voice mic tapped');

    const micStatus: MicPermissionStatus = await ensureMicPermission();
    if (micStatus !== 'granted') {
      applyDemoFallbackTranscript();

      if (micStatus === 'blocked') {
        Alert.alert(
          'Microphone blocked',
          'Enable microphone permission in settings to capture live voice input. A demo transcript was added for now.',
          [
            { text: 'Not Now' },
            { text: 'Open Settings', onPress: handleOpenSettings },
          ],
        );
      } else {
        Alert.alert(
          'Microphone unavailable',
          'Microphone permission is not available, so a demo transcript was used.',
        );
      }
      return;
    }

    const speechReady = await ensureSpeechServiceReady();
    if (!speechReady) {
      applyDemoFallbackTranscript();
      Alert.alert(
        'Speech model unavailable',
        'Using a demo transcript because voice model initialization did not complete.',
      );
      return;
    }

    setListening(true);
    let captureResolved = false;
    clearFallbackTimer();

    const finalizeCapture = (result?: string) => {
      if (captureResolved) {
        return;
      }

      captureResolved = true;
      clearFallbackTimer();
      const normalized = (result ?? '').trim();

      if (normalized.length > 0) {
        setTranscript(normalized);
      } else {
        applyDemoFallbackTranscript();
      }

      setListening(false);
      speechToTextService.stopListening().catch(error => {
        console.error('Failed to stop listening after capture:', error);
      });
    };

    await speechToTextService.stopListening().catch(() => undefined);

    fallbackTimerRef.current = setTimeout(() => {
      if (captureResolved) {
        return;
      }
      finalizeCapture();
      Alert.alert('Using demo transcript', 'Voice fallback applied so you can continue the demo.');
    }, 2600);

    try {
      await speechToTextService.startListening(result => {
        finalizeCapture(result);
      });
    } catch (error) {
      console.error('Voice listen failed:', error);
      finalizeCapture();
      Alert.alert(
        'Voice capture fallback',
        'Could not capture live voice input on this device, so a demo transcript was used.',
      );
    }
  };

  const handleSave = async () => {
    const text = transcript.trim();
    if (!text) {
      Alert.alert('No transcript yet', 'Capture voice or type transcript first.');
      return;
    }

    setSaving(true);
    try {
      await memoryService.createVoiceMemoryFromTranscript(text);
      Alert.alert('Voice memory saved', 'Your voice note is now searchable locally.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Voice save failed:', error);
      Alert.alert('Save failed', 'Could not save voice memory.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="always">
          <View style={styles.header}>
            <Text style={styles.title}>Voice Note</Text>
            <Text style={styles.subtitle}>Capture a memory by voice and save it offline.</Text>
          </View>

          <View style={styles.recordCard}>
            <TouchableOpacity
              style={[styles.captureButton, listening && styles.captureButtonDisabled]}
              onPress={handleStartListening}
              disabled={listening}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              activeOpacity={0.85}
              accessible
              accessibilityRole="button"
              accessibilityLabel={listening ? 'Listening for voice input' : 'Capture voice'}
              accessibilityHint="Starts voice capture and fills the transcript"
              testID="voice-capture-button"
            >
              <View style={styles.micButton}>
                {listening ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Icon name="keyboard-voice" size={30} color="#ffffff" />
                )}
              </View>
              <Text style={styles.recordText}>
                {listening ? 'Listening for voice input...' : 'Tap to capture voice'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fallbackButton} onPress={applyDemoFallbackTranscript}>
              <Text style={styles.fallbackText}>Use Demo Transcript</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Transcript</Text>
            <TextInput
              style={styles.input}
              placeholder="Voice transcript appears here. You can edit it before saving."
              multiline
              value={transcript}
              onChangeText={setTranscript}
            />
          </View>

          <View style={styles.promptRow}>
            {DEMO_PROMPTS.map(prompt => (
              <TouchableOpacity key={prompt} style={styles.promptChip} onPress={() => setTranscript(prompt)}>
                <Text style={styles.promptText} numberOfLines={2}>
                  {prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, (!transcript.trim() || saving) && styles.disabled]}
            onPress={handleSave}
            disabled={!transcript.trim() || saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Voice Memory</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  recordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  captureButton: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  captureButtonDisabled: {
    opacity: 0.9,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordText: {
    marginTop: 10,
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '600',
  },
  fallbackButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#e9f3ff',
  },
  fallbackText: {
    color: '#0b5ecb',
    fontWeight: '700',
    fontSize: 12,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    minHeight: 120,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 12,
    textAlignVertical: 'top',
    color: '#1f2937',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  promptRow: {
    marginBottom: 16,
  },
  promptChip: {
    backgroundColor: '#e0efff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  promptText: {
    color: '#0b5ecb',
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  disabled: {
    backgroundColor: '#9ca3af',
  },
});

