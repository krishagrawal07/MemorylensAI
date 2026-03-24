import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from '../components/AppIcon';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { memoryService } from '../services/memoryService';
import { Memory } from '../types';

type MemoryDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MemoryDetail'
>;

type MemoryDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'MemoryDetail'
>;

type Props = {
  navigation: MemoryDetailScreenNavigationProp;
  route: MemoryDetailScreenRouteProp;
};

const EDITABLE_CATEGORIES = [
  'Objects',
  'Places',
  'Notes',
  'Documents',
  'Medicine',
  'Parking',
  'Tasks',
  'Other',
];

export default function MemoryDetailScreen({ navigation, route }: Props) {
  const { memoryId } = route.params;
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Notes');
  const [editSummary, setEditSummary] = useState('');
  const [editRawText, setEditRawText] = useState('');
  const [editVoiceTranscript, setEditVoiceTranscript] = useState('');
  const [editTagsText, setEditTagsText] = useState('');
  const [editLocation, setEditLocation] = useState('');

  const loadMemory = useCallback(async () => {
    try {
      const memoryData = await memoryService.getMemoryById(memoryId);
      setMemory(memoryData);
    } catch (error) {
      console.error('Failed to load memory:', error);
      Alert.alert('Error', 'Failed to load memory details.');
    } finally {
      setLoading(false);
    }
  }, [memoryId]);

  useEffect(() => {
    loadMemory();
  }, [loadMemory]);

  const populateEditFields = useCallback((memoryData: Memory) => {
    setEditTitle(memoryData.title);
    setEditCategory(memoryData.category || 'Notes');
    setEditSummary(memoryData.aiSummary);
    setEditRawText(memoryData.rawText ?? '');
    setEditVoiceTranscript(memoryData.voiceTranscript ?? '');
    setEditTagsText((memoryData.aiTags ?? []).join(', '));
    setEditLocation(memoryData.locationText ?? '');
  }, []);

  const parseTags = (tagsText: string) => {
    const uniqueTags = Array.from(
      new Set(
        tagsText
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean),
      ),
    );
    return uniqueTags.length > 0 ? uniqueTags : ['memory'];
  };

  const handleStartEdit = () => {
    if (!memory) {
      return;
    }
    populateEditFields(memory);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (memory) {
      populateEditFields(memory);
    }
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!memory || savingEdits) {
      return;
    }

    const normalizedTitle = editTitle.trim();
    const normalizedSummary = editSummary.trim();

    if (!normalizedTitle) {
      Alert.alert('Missing title', 'Please add a title before saving.');
      return;
    }

    if (!normalizedSummary) {
      Alert.alert('Missing summary', 'Please add a summary before saving.');
      return;
    }

    const updates: Partial<Memory> = {
      title: normalizedTitle,
      category: editCategory,
      aiSummary: normalizedSummary,
      rawText: editRawText.trim() || undefined,
      voiceTranscript: editVoiceTranscript.trim() || undefined,
      aiTags: parseTags(editTagsText),
      locationText: editLocation.trim() || undefined,
    };

    try {
      setSavingEdits(true);
      await memoryService.updateMemory(memory.id, updates);
      setMemory({
        ...memory,
        ...updates,
      });
      setIsEditing(false);
      Alert.alert('Saved', 'Your memory changes were saved.');
    } catch (error) {
      console.error('Failed to save memory edits:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSavingEdits(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!memory) {
      return;
    }

    try {
      await memoryService.updateMemory(memory.id, {
        isFavorite: !memory.isFavorite,
      });
      setMemory({ ...memory, isFavorite: !memory.isFavorite });
    } catch (error) {
      console.error('Failed to update favorite:', error);
    }
  };

  const handleTogglePinned = async () => {
    if (!memory) {
      return;
    }

    try {
      await memoryService.updateMemory(memory.id, {
        isPinned: !memory.isPinned,
      });
      setMemory({ ...memory, isPinned: !memory.isPinned });
    } catch (error) {
      console.error('Failed to update pinned:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Memory', 'Are you sure you want to delete this memory?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await memoryService.deleteMemory(memoryId);
            navigation.goBack();
          } catch (error) {
            console.error('Failed to delete memory:', error);
            Alert.alert('Error', 'Failed to delete memory.');
          }
        },
      },
    ]);
  };

  const formatDate = (input: Date | string | number | undefined) => {
    const date = input instanceof Date ? input : new Date(input ?? Date.now());
    if (Number.isNaN(date.getTime())) {
      return 'Unknown date';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Objects: '#ff9800',
      Places: '#2196f3',
      Notes: '#4caf50',
      Documents: '#9c27b0',
      Medicine: '#f44336',
      Parking: '#607d8b',
      Tasks: '#ff5722',
      Other: '#795548',
    };
    return colors[category] || '#607d8b';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading memory...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!memory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Memory not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.categoryContainer}>
            <View
              style={[
                styles.categoryDot,
                { backgroundColor: getCategoryColor(memory.category) },
              ]}
            />
            <Text style={styles.category}>{memory.category}</Text>
          </View>

          <View style={styles.actions}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelAction]}
                  onPress={handleCancelEdit}
                  disabled={savingEdits}
                >
                  <Icon name="close" size={18} color="#92400e" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveAction]}
                  onPress={handleSaveEdit}
                  disabled={savingEdits}
                >
                  {savingEdits ? (
                    <ActivityIndicator size="small" color="#065f46" />
                  ) : (
                    <Icon name="check" size={18} color="#065f46" />
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, memory.isFavorite && styles.activeAction]}
                  onPress={handleToggleFavorite}
                >
                  <Icon name="star" size={16} color="#f59e0b" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, memory.isPinned && styles.activeAction]}
                  onPress={handleTogglePinned}
                >
                  <Icon name="push-pin" size={16} color="#2563eb" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.editAction]}
                  onPress={handleStartEdit}
                >
                  <Icon name="edit" size={16} color="#0f766e" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteAction]}
                  onPress={handleDelete}
                >
                  <Icon name="delete" size={16} color="#b91c1c" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {isEditing ? (
          <>
            <View style={styles.editBanner}>
              <Text style={styles.editBannerTitle}>Edit Memory</Text>
              <Text style={styles.editBannerText}>Update details and tap check to save.</Text>
            </View>

            <View style={styles.editSection}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                style={styles.input}
                placeholder="Memory title"
              />
            </View>

            <View style={styles.editSection}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.editCategoriesWrap}>
                {EDITABLE_CATEGORIES.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.editCategoryChip,
                      editCategory === category && styles.editCategoryChipActive,
                    ]}
                    onPress={() => setEditCategory(category)}
                  >
                    <Text
                      style={[
                        styles.editCategoryText,
                        editCategory === category && styles.editCategoryTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.editSection}>
              <Text style={styles.inputLabel}>AI Summary</Text>
              <TextInput
                value={editSummary}
                onChangeText={setEditSummary}
                style={[styles.input, styles.multilineInput]}
                placeholder="Memory summary"
                multiline
                textAlignVertical="top"
              />
            </View>

            {(memory.rawText !== undefined ||
              memory.memoryType === 'text' ||
              memory.memoryType === 'image' ||
              memory.memoryType === 'multimodal') && (
              <View style={styles.editSection}>
                <Text style={styles.inputLabel}>Original Text</Text>
                <TextInput
                  value={editRawText}
                  onChangeText={setEditRawText}
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Original text notes"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}

            {(memory.voiceTranscript !== undefined ||
              memory.memoryType === 'voice' ||
              memory.memoryType === 'multimodal') && (
              <View style={styles.editSection}>
                <Text style={styles.inputLabel}>Voice Transcript</Text>
                <TextInput
                  value={editVoiceTranscript}
                  onChangeText={setEditVoiceTranscript}
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Voice transcript"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}

            <View style={styles.editSection}>
              <Text style={styles.inputLabel}>Tags</Text>
              <TextInput
                value={editTagsText}
                onChangeText={setEditTagsText}
                style={styles.input}
                placeholder="tag1, tag2, tag3"
              />
            </View>

            <View style={styles.editSection}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                value={editLocation}
                onChangeText={setEditLocation}
                style={styles.input}
                placeholder="Optional location"
              />
            </View>

            {memory.imageUri && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Image</Text>
                <Image source={{ uri: memory.imageUri }} style={styles.image} />
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={styles.title}>{memory.title}</Text>
            <Text style={styles.date}>{formatDate(memory.timestamp)}</Text>

            {memory.imageUri && (
              <Image source={{ uri: memory.imageUri }} style={styles.image} />
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI Summary</Text>
              <Text style={styles.summary}>{memory.aiSummary}</Text>
            </View>

            {memory.rawText && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Original Text</Text>
                <Text style={styles.content}>{memory.rawText}</Text>
              </View>
            )}

            {memory.voiceTranscript && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Voice Transcript</Text>
                <Text style={styles.content}>{memory.voiceTranscript}</Text>
              </View>
            )}

            {memory.objectLabels && memory.objectLabels.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Object Labels</Text>
                <View style={styles.tagsContainer}>
                  {memory.objectLabels.map((label, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {memory.sceneLabels && memory.sceneLabels.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Scene Labels</Text>
                <View style={styles.tagsContainer}>
                  {memory.sceneLabels.map((label, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {memory.aiTags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            {memory.locationText && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location</Text>
                <Text style={styles.content}>{memory.locationText}</Text>
              </View>
            )}

            {typeof memory.confidenceScore === 'number' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Confidence Score</Text>
                <Text style={styles.content}>{Math.round(memory.confidenceScore * 100)}%</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  category: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  activeAction: {
    backgroundColor: '#fff3cd',
  },
  editAction: {
    backgroundColor: '#d1fae5',
  },
  cancelAction: {
    backgroundColor: '#fef3c7',
  },
  saveAction: {
    backgroundColor: '#d1fae5',
  },
  deleteAction: {
    backgroundColor: '#f8d7da',
  },
  editBanner: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#e8f1ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  editBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d4ed8',
    marginBottom: 2,
  },
  editBannerText: {
    fontSize: 13,
    color: '#1e40af',
  },
  editSection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editCategoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  editCategoryChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  editCategoryChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  editCategoryText: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  editCategoryTextActive: {
    color: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  date: {
    fontSize: 14,
    color: '#999',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  summary: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  content: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});

