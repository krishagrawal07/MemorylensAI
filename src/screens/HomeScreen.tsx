import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  TextInput,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import Icon from '../components/AppIcon';
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
  subtitle: string;
  icon: string;
  iconColor: string;
  iconBackground: string;
  borderColor: string;
  onPress: () => void;
};

const CATEGORIES = ['All', 'Objects', 'Places', 'Notes', 'Documents', 'Medicine', 'Parking', 'Tasks'];

const ActionSeparator = () => <View style={styles.actionSeparator} />;

export default function HomeScreen({ navigation }: Props) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dailySummary, setDailySummary] = useState('');
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(18)).current;
  const actionAnimations = useRef(
    Array.from({ length: 4 }, () => new Animated.Value(0)),
  ).current;

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

  useEffect(() => {
    if (loading) {
      return;
    }

    headerOpacity.setValue(0);
    headerTranslateY.setValue(18);
    actionAnimations.forEach(value => value.setValue(0));

    const headerAnimation = Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const actionsAnimation = Animated.stagger(
      110,
      actionAnimations.map(value =>
        Animated.spring(value, {
          toValue: 1,
          speed: 16,
          bounciness: 8,
          useNativeDriver: true,
        }),
      ),
    );

    Animated.sequence([headerAnimation, actionsAnimation]).start();
  }, [loading, actionAnimations, headerOpacity, headerTranslateY]);

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
        subtitle: 'Save text notes instantly',
        icon: 'note-add',
        iconColor: '#2563eb',
        iconBackground: '#dbeafe',
        borderColor: '#bfdbfe',
        onPress: () => navigation.navigate('CaptureMemory'),
      },
      {
        id: 'voice',
        title: 'Voice Note',
        subtitle: 'Record and transcribe audio',
        icon: 'keyboard-voice',
        iconColor: '#059669',
        iconBackground: '#d1fae5',
        borderColor: '#a7f3d0',
        onPress: () => navigation.navigate('VoiceNote'),
      },
      {
        id: 'snap',
        title: 'Snap Object',
        subtitle: 'Use camera for smart recall',
        icon: 'photo-camera',
        iconColor: '#ea580c',
        iconBackground: '#ffedd5',
        borderColor: '#fdba74',
        onPress: () => navigation.navigate('CameraMemory'),
      },
      {
        id: 'ask',
        title: 'Ask MemoryLens',
        subtitle: 'Query memories with AI',
        icon: 'question-answer',
        iconColor: '#0f766e',
        iconBackground: '#ccfbf1',
        borderColor: '#99f6e4',
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
      <FlatList
        data={memories}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MemoryCard memory={item} onPress={() => handleMemoryPress(item)} />}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Animated.View
            style={[
              styles.headerAnimatedContainer,
              {
                opacity: headerOpacity,
                transform: [{ translateY: headerTranslateY }],
              },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={styles.logoBadge}>
                  <Icon name="auto-awesome" size={20} color="#0b63cc" />
                </View>
                <View style={styles.titleContainer}>
                  <View style={styles.titleInline}>
                    <Text style={styles.title}>MemoryLens</Text>
                    <View style={styles.titlePill}>
                      <Text style={styles.titlePillText}>AI</Text>
                    </View>
                  </View>
                </View>
              </View>
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

            <View style={styles.quickActionsSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <Text style={styles.sectionHint}>Swipe to view all</Text>
              </View>
              <FlatList
                horizontal
                data={quickActions}
                keyExtractor={item => item.id}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                directionalLockEnabled
                contentContainerStyle={styles.quickActionsList}
                ItemSeparatorComponent={ActionSeparator}
                renderItem={({ item, index }) => {
                  const cardAnimation = actionAnimations[index];
                  return (
                    <Animated.View
                      style={[
                        styles.actionCardAnimated,
                        {
                          opacity: cardAnimation,
                          transform: [
                            {
                              translateY: cardAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [18, 0],
                              }),
                            },
                            {
                              scale: cardAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.96, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={[styles.actionButton, { borderColor: item.borderColor }]}
                        onPress={item.onPress}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.actionIconContainer, { backgroundColor: item.iconBackground }]}>
                          <Icon name={item.icon} size={22} color={item.iconColor} />
                        </View>
                        <Text style={styles.actionText}>{item.title}</Text>
                        <Text style={styles.actionSubtext}>{item.subtitle}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                }}
              />
            </View>

            <View style={styles.categoriesContainer}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <FlatList
                horizontal
                data={CATEGORIES}
                keyExtractor={item => item}
                contentContainerStyle={styles.categoriesList}
                nestedScrollEnabled
                directionalLockEnabled
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

            <Text style={styles.memoriesTitle}>
              {selectedCategory === 'All' ? 'Recent Memories' : `${selectedCategory} Memories`}
            </Text>
          </Animated.View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No memories in this category yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerAnimatedContainer: {
    paddingTop: 2,
  },
  listContent: {
    paddingBottom: 24,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e8f1ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  titleInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  titlePill: {
    marginLeft: 8,
    backgroundColor: '#0b63cc',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  titlePillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 6,
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
  quickActionsSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  sectionHint: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  quickActionsList: {
    paddingHorizontal: 24,
  },
  actionSeparator: {
    width: 12,
  },
  actionCardAnimated: {
    width: 170,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  actionSubtext: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 17,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  categoriesList: {
    paddingRight: 24,
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
  memoriesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
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

