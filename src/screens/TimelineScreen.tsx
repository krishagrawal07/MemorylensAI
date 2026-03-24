import React, { useCallback, useMemo, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  SectionList,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import { memoryService } from '../services/memoryService';
import { Memory } from '../types';

type TimelineNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Timeline'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = {
  navigation: TimelineNavigationProp;
};

type TimelineSection = {
  title: string;
  data: Memory[];
};

function toDayHeading(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TimelineScreen({ navigation }: Props) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTimeline = useCallback(async () => {
    try {
      setLoading(true);
      const records = await memoryService.getMemories(200);
      setMemories(records);
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTimeline();
    }, [loadTimeline]),
  );

  const sections = useMemo(() => {
    const grouped = memories.reduce<Record<string, Memory[]>>((acc, memory) => {
      const key = toDayHeading(new Date(memory.timestamp));
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(memory);
      return acc;
    }, {});

    return Object.entries(grouped).map(([title, data]) => ({
      title,
      data,
    }));
  }, [memories]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Loading timeline...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Memory Timeline</Text>
        <Text style={styles.subtitle}>Browse memories by day</Text>
      </View>

      <SectionList
        sections={sections as TimelineSection[]}
        keyExtractor={item => item.id}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.content}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => navigation.navigate('MemoryDetail', { memoryId: item.id })}
          >
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.itemSummary} numberOfLines={2}>
              {item.aiSummary}
            </Text>
            <Text style={styles.itemMeta}>
              {item.category} -{' '}
              {new Date(item.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.centerState}>
            <Text style={styles.stateTitle}>No memories in timeline yet</Text>
            <Text style={styles.stateSubtitle}>
              Capture your first memory to populate this view.
            </Text>
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
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  itemSummary: {
    marginTop: 4,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  itemMeta: {
    marginTop: 10,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  stateSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

