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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

export default function VoiceNoteScreen({ navigation }: Props) {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serviceReady, setServiceReady] = useState(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  const applyDemoFallbackTranscript = () => {
    const fallback = DEMO_PROMPTS[Math.floor(Math.random() * DEMO_PROMPTS.length)];
    setTranscript(prev => (prev.trim() ? prev : fallback));
  };

  const handleStartListening = async () => {
    if (listening) {
      return;
    }

    if (!serviceReady) {
      Alert.alert('Speech model not ready', 'Initializing voice model. Please try again in a moment.');
      return;
    }

    setListening(true);
    let hasResult = false;

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
    }

    fallbackTimerRef.current = setTimeout(() => {
      if (hasResult) {
        return;
      }
      applyDemoFallbackTranscript();
      setListening(false);
      Alert.alert('Using demo transcript', 'Voice fallback applied so you can continue the demo.');
    }, 2200);

    try {
      await speechToTextService.startListening(result => {
        hasResult = true;
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
        }
        setTranscript(result.trim());
        setListening(false);
      });
    } catch (error) {
      console.error('Voice listen failed:', error);
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
      setListening(false);
      applyDemoFallbackTranscript();
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
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Voice Note</Text>
            <Text style={styles.subtitle}>Capture a memory by voice and save it offline.</Text>
          </View>

          <View style={styles.recordCard}>
            <TouchableOpacity style={styles.micButton} onPress={handleStartListening}>
              {listening ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Icon name="keyboard-voice" size={30} color="#ffffff" />
              )}
            </TouchableOpacity>
            <Text style={styles.recordText}>
              {listening ? 'Listening for voice input...' : 'Tap to capture voice'}
            </Text>
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
