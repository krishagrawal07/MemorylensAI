import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from './AppIcon';
import { Memory } from '../types';

type Props = {
  memory: Memory;
  onPress: () => void;
};

export default function MemoryCard({ memory, onPress }: Props) {
  const formatDate = (input: Date | string | number | undefined) => {
    const date = input instanceof Date ? input : new Date(input ?? Date.now());
    if (Number.isNaN(date.getTime())) {
      return 'Unknown date';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
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

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
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
        <Text style={styles.date}>{formatDate(memory.timestamp)}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {memory.title}
      </Text>

      <Text style={styles.summary} numberOfLines={3}>
        {memory.aiSummary}
      </Text>

      {memory.imageUri && (
        <Image source={{ uri: memory.imageUri }} style={styles.image} />
      )}

      <View style={styles.tagsContainer}>
        {memory.aiTags.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        {memory.aiTags.length > 3 && (
          <Text style={styles.moreTags}>+{memory.aiTags.length - 3} more</Text>
        )}
      </View>

      <View style={styles.footer}>
        {memory.isFavorite && (
          <View style={styles.metaBadge}>
            <Icon name="star" size={13} color="#ff9800" />
            <Text style={styles.favorite}>Favorite</Text>
          </View>
        )}
        {memory.isPinned && (
          <View style={styles.metaBadge}>
            <Icon name="push-pin" size={13} color="#2196f3" />
            <Text style={styles.pinned}>Pinned</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  category: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  summary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  moreTags: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  favorite: {
    fontSize: 12,
    color: '#ff9800',
  },
  pinned: {
    fontSize: 12,
    color: '#2196f3',
  },
});

