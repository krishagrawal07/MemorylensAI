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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
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

export default function MemoryDetailScreen({ navigation, route }: Props) {
  const { memoryId } = route.params;
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);

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
              style={[styles.actionButton, styles.deleteAction]}
              onPress={handleDelete}
            >
              <Icon name="delete" size={16} color="#b91c1c" />
            </TouchableOpacity>
          </View>
        </View>

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
  deleteAction: {
    backgroundColor: '#f8d7da',
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
