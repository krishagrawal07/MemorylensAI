import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from '../components/AppIcon';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { memoryService } from '../services/memoryService';

type CaptureMemoryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CaptureMemory'
>;

type Props = {
  navigation: CaptureMemoryScreenNavigationProp;
};

type CaptureOption = {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
};

export default function CaptureMemoryScreen({ navigation }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveTextMemory = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some text for your memory.');
      return;
    }

    setLoading(true);
    try {
      await memoryService.createTextMemory(text.trim());
      Alert.alert('Success', 'Memory saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to save memory:', error);
      Alert.alert('Error', 'Failed to save memory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const captureOptions: CaptureOption[] = useMemo(
    () => [
      {
        id: 'text',
        title: 'Text Note',
        description: 'Type your memory',
        icon: 'edit-note',
        onPress: () => undefined,
      },
      {
        id: 'voice',
        title: 'Voice Note',
        description: 'Tap to capture voice',
        icon: 'keyboard-voice',
        onPress: () => navigation.navigate('VoiceNote'),
      },
      {
        id: 'photo',
        title: 'Photo Memory',
        description: 'Capture image',
        icon: 'photo-camera',
        onPress: () => navigation.navigate('CameraMemory'),
      },
      {
        id: 'multimodal',
        title: 'Multimodal',
        description: 'Image + voice + text',
        icon: 'auto-awesome',
        onPress: () => navigation.navigate('CameraMemory'),
      },
    ],
    [navigation],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Capture Memory</Text>
        <Text style={styles.subtitle}>Choose how to save your memory</Text>
      </View>

      <View style={styles.optionsContainer}>
        {captureOptions.map(option => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              option.id === 'text' ? styles.selectedOption : null,
            ]}
            onPress={option.onPress}
            activeOpacity={0.85}
          >
            <Icon name={option.icon} size={30} color="#007AFF" />
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Text Memory</Text>
        <TextInput
          style={styles.textInput}
          placeholder="What do you want to remember? e.g. I kept my keys on the study table."
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.saveButton, (!text.trim() || loading) && styles.disabledButton]}
          onPress={handleSaveTextMemory}
          disabled={!text.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Memory</Text>
          )}
        </TouchableOpacity>
      </View>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedOption: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  inputContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  inputLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

