import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import Icon from '../components/AppIcon';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { memoryService } from '../services/memoryService';
import { Memory } from '../types';
import MemoryCard from '../components/MemoryCard';

type SearchResultsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SearchResults'
>;

type SearchResultsScreenRouteProp = RouteProp<
  RootStackParamList,
  'SearchResults'
>;

type Props = {
  navigation: SearchResultsScreenNavigationProp;
  route: SearchResultsScreenRouteProp;
};

export default function SearchResultsScreen({ navigation, route }: Props) {
  const { query } = route.params;
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const searchMemories = useCallback(async () => {
    setLoading(true);
    try {
      const results = await memoryService.searchMemories(query);
      setMemories(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    searchMemories();
  }, [searchMemories]);

  const handleMemoryPress = (memory: Memory) => {
    navigation.navigate('MemoryDetail', { memoryId: memory.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Results</Text>
        <Text style={styles.query}>"{query}"</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={memories}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <MemoryCard memory={item} onPress={() => handleMemoryPress(item)} />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="search-off" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No memories found</Text>
              <Text style={styles.emptySubtitle}>
                Try different keywords or check your spelling.
              </Text>
            </View>
          }
        />
      )}
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
  query: {
    fontSize: 16,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 4,
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
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

