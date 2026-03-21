import AsyncStorage from '@react-native-async-storage/async-storage';
import { Memory, StorageStats } from '../types';

const MEMORIES_KEY = 'memorylens_memories';

type RankedMemory = {
  memory: Memory;
  score: number;
};

class DatabaseService {
  async init(): Promise<void> {
    console.log('Database initialized (AsyncStorage)');
  }

  async saveMemory(memory: Omit<Memory, 'id'>): Promise<string> {
    const id = Date.now().toString();
    const memoryWithId: Memory = {
      ...memory,
      id,
      timestamp: this.parseTimestamp(memory.timestamp),
    };

    try {
      const existingMemories = await this.getAllMemories();
      existingMemories.push(memoryWithId);
      await this.persistMemories(existingMemories);
      return id;
    } catch (error) {
      console.error('Failed to save memory:', error);
      throw error;
    }
  }

  async getMemories(limit = 50, offset = 0): Promise<Memory[]> {
    try {
      const memories = await this.getAllMemories();
      return memories
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(offset, offset + limit);
    } catch (error) {
      console.error('Failed to get memories:', error);
      return [];
    }
  }

  async searchMemories(query: string): Promise<Memory[]> {
    try {
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) {
        return [];
      }

      const queryTokens = this.tokenize(normalizedQuery);
      const memories = await this.getAllMemories();

      const ranked: RankedMemory[] = memories
        .map(memory => ({
          memory,
          score: this.computeSearchScore(memory, normalizedQuery, queryTokens),
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          return new Date(b.memory.timestamp).getTime() - new Date(a.memory.timestamp).getTime();
        });

      if (ranked.length > 0) {
        return ranked.map(item => item.memory);
      }

      return memories
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
    } catch (error) {
      console.error('Failed to search memories:', error);
      return [];
    }
  }

  async getMemoryById(id: string): Promise<Memory | null> {
    try {
      const memories = await this.getAllMemories();
      return memories.find(memory => memory.id === id) || null;
    } catch (error) {
      console.error('Failed to get memory by id:', error);
      return null;
    }
  }

  async updateMemory(id: string, updates: Partial<Memory>): Promise<void> {
    try {
      const memories = await this.getAllMemories();
      const index = memories.findIndex(memory => memory.id === id);

      if (index === -1) {
        return;
      }

      memories[index] = {
        ...memories[index],
        ...updates,
        timestamp: this.parseTimestamp(updates.timestamp ?? memories[index].timestamp),
      };
      await this.persistMemories(memories);
    } catch (error) {
      console.error('Failed to update memory:', error);
      throw error;
    }
  }

  async deleteMemory(id: string): Promise<void> {
    try {
      const memories = await this.getAllMemories();
      const filteredMemories = memories.filter(memory => memory.id !== id);
      await this.persistMemories(filteredMemories);
    } catch (error) {
      console.error('Failed to delete memory:', error);
      throw error;
    }
  }

  async clearAllMemories(): Promise<void> {
    await AsyncStorage.removeItem(MEMORIES_KEY);
  }

  async exportMemories(): Promise<string> {
    const memories = await this.getAllMemories();
    return JSON.stringify(
      memories.map(memory => ({
        ...memory,
        timestamp: this.parseTimestamp(memory.timestamp).toISOString(),
      })),
      null,
      2,
    );
  }

  async getStorageStats(): Promise<StorageStats> {
    const memories = await this.getAllMemories();
    const serialized = JSON.stringify(
      memories.map(memory => ({
        ...memory,
        timestamp: this.parseTimestamp(memory.timestamp).toISOString(),
      })),
    );

    return {
      totalMemories: memories.length,
      estimatedBytes: serialized.length,
    };
  }

  private tokenize(value: string): string[] {
    return value
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  private computeSearchScore(memory: Memory, query: string, queryTokens: string[]): number {
    const candidate = {
      title: memory.title.toLowerCase(),
      rawText: (memory.rawText ?? '').toLowerCase(),
      transcript: (memory.voiceTranscript ?? '').toLowerCase(),
      summary: memory.aiSummary.toLowerCase(),
      category: memory.category.toLowerCase(),
      location: (memory.locationText ?? '').toLowerCase(),
      tags: memory.aiTags.map(tag => tag.toLowerCase()),
      objectLabels: (memory.objectLabels ?? []).map(label => label.toLowerCase()),
      sceneLabels: (memory.sceneLabels ?? []).map(label => label.toLowerCase()),
    };

    let score = 0;
    const combinedText = [
      candidate.title,
      candidate.rawText,
      candidate.transcript,
      candidate.summary,
      candidate.category,
      candidate.location,
      ...candidate.tags,
      ...candidate.objectLabels,
      ...candidate.sceneLabels,
    ].join(' ');

    if (candidate.title.includes(query)) score += 9;
    if (candidate.rawText.includes(query)) score += 7;
    if (candidate.transcript.includes(query)) score += 7;
    if (candidate.summary.includes(query)) score += 5;
    if (candidate.category.includes(query)) score += 4;
    if (candidate.location.includes(query)) score += 4;
    if (candidate.tags.some(tag => tag.includes(query))) score += 6;
    if (candidate.objectLabels.some(label => label.includes(query))) score += 6;
    if (candidate.sceneLabels.some(label => label.includes(query))) score += 3;

    for (const token of queryTokens) {
      if (combinedText.includes(token)) {
        score += 1;
      }
    }

    const recencyBonus = Math.max(
      0,
      3 - Math.floor((Date.now() - new Date(memory.timestamp).getTime()) / (1000 * 60 * 60 * 24 * 7)),
    );

    return score + recencyBonus;
  }

  private async getAllMemories(): Promise<Memory[]> {
    try {
      const memoriesJson = await AsyncStorage.getItem(MEMORIES_KEY);
      if (!memoriesJson) {
        return [];
      }

      const parsed = JSON.parse(memoriesJson);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map(memory => ({
        ...memory,
        timestamp: this.parseTimestamp(memory.timestamp),
      })) as Memory[];
    } catch (error) {
      console.error('Failed to get all memories:', error);
      return [];
    }
  }

  private parseTimestamp(value: unknown): Date {
    const date = value instanceof Date ? value : new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  private async persistMemories(memories: Memory[]): Promise<void> {
    const serializable = memories.map(memory => ({
      ...memory,
      timestamp: this.parseTimestamp(memory.timestamp).toISOString(),
    }));

    await AsyncStorage.setItem(MEMORIES_KEY, JSON.stringify(serializable));
  }

  async close(): Promise<void> {
    // AsyncStorage doesn't need closing
  }
}

export const databaseService = new DatabaseService();
