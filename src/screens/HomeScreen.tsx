import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';
import { memoryService } from '../services/memoryService';
import { sampleDataService } from '../services/sampleDataService';
import { Memory } from '../types';
import MemoryCard from '../components/MemoryCard';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

type QuickAction = {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
};

const CATEGORIES = ['All', 'Objects', 'Places', 'Notes', 'Documents', 'Medicine', 'Parking', 'Tasks'];

export default function HomeScreen({ navigation }: Props) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dailySummary, setDailySummary] = useState('');

  const loadHomeData = useCallback(async () => {
    try {
      const [records, summary] = await Promise.all([
        memoryService.getMemoriesByCategory(selectedCategory),
        memoryService.getDailySummary(),
      ]);
      setMemories(records.slice(0, 30));
      setDailySummary(summary);
    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  }, [selectedCategory]);

  const initializeApp = useCallback(async () => {
    try {
      await memoryService.initialize();
      await sampleDataService.seedSampleData();
      await loadHomeData();
    } catch (error) {
      console.error('App initialization failed:', error);
      Alert.alert('Error', 'Failed to initialize app.');
    } finally {
      setLoading(false);
    }
  }, [loadHomeData]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadHomeData();
      }
    }, [loading, loadHomeData]),
  );

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (query) {
      navigation.navigate('SearchResults', { query });
    }
  };

  const handleMemoryPress = (memory: Memory) => {
    navigation.navigate('MemoryDetail', { memoryId: memory.id });
  };

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'capture',
        title: 'Capture Memory',
        icon: 'note-add',
        onPress: () => navigation.navigate('CaptureMemory'),
      },
      {
        id: 'voice',
        title: 'Voice Note',
        icon: 'keyboard-voice',
        onPress: () => navigation.navigate('VoiceNote'),
      },
      {
        id: 'snap',
        title: 'Snap Object',
        icon: 'photo-camera',
        onPress: () => navigation.navigate('CameraMemory'),
      },
      {
        id: 'ask',
        title: 'Ask MemoryLens',
        icon: 'question-answer',
        onPress: () => navigation.navigate('AskMemoryLens'),
      },
    ],
    [navigation],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing MemoryLens AI...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MemoryLens AI</Text>
        <Text style={styles.subtitle}>Private, offline, multimodal memory assistant</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search memories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Icon name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Icon name="today" size={18} color="#007AFF" />
        <Text style={styles.summaryText}>{dailySummary}</Text>
      </View>

      <View style={styles.quickActions}>
        {quickActions.map(action => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            onPress={action.onPress}
            activeOpacity={0.85}
          >
            <Icon name={action.icon} size={24} color="#007AFF" />
            <Text style={styles.actionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item && styles.categoryTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View style={styles.memoriesContainer}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === 'All' ? 'Recent Memories' : `${selectedCategory} Memories`}
        </Text>
        <FlatList
          data={memories}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <MemoryCard memory={item} onPress={() => handleMemoryPress(item)} />
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No memories in this category yet.</Text>
            </View>
          }
        />
      </View>
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
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchButton: {
    marginLeft: 8,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#e9f3ff',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    marginLeft: 8,
    color: '#1f2937',
    fontSize: 13,
    flex: 1,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
    marginTop: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  memoriesContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
