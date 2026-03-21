import { databaseService } from '../db/database';
import { textAIService } from '../ai/textAI';
import { speechToTextService } from '../ai/speechToText';
import { visionAIService } from '../ai/visionAI';
import {
  AskMemoryLensResult,
  Memory,
  MemoryCategory,
  StorageStats,
} from '../types';

type BundleSummary = {
  id: string;
  title: string;
  count: number;
  memories: Memory[];
};

export class MemoryService {
  private initialized = false;

  private assertReady(): void {
    if (!this.initialized) {
      throw new Error('MemoryService runtime not ready. Call initialize() first.');
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await databaseService.init();
    await textAIService.initialize();
    await speechToTextService.initialize();
    await visionAIService.initialize();
    this.initialized = true;
  }

  private tokenize(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 2),
    );
  }

  private similarity(a: string, b: string): number {
    const setA = this.tokenize(a);
    const setB = this.tokenize(b);

    if (setA.size === 0 || setB.size === 0) {
      return 0;
    }

    let overlap = 0;
    for (const token of setA) {
      if (setB.has(token)) {
        overlap += 1;
      }
    }

    return overlap / new Set([...setA, ...setB]).size;
  }

  private buildBundleId(category: MemoryCategory, tags: string[]): string {
    const anchor = tags[0] ?? 'general';
    return `${category.toLowerCase()}::${anchor.toLowerCase()}`;
  }

  private async detectDuplicate(text: string): Promise<string | undefined> {
    const existing = await this.getMemories(150);
    const normalized = text.trim();

    for (const memory of existing) {
      const candidate = [memory.rawText, memory.voiceTranscript, memory.aiSummary]
        .filter(Boolean)
        .join(' ');

      if (candidate && this.similarity(normalized, candidate) > 0.82) {
        return memory.id;
      }
    }

    return undefined;
  }

  private deriveTitle(content: string, fallback = 'Untitled memory'): string {
    const trimmed = content.trim();
    if (!trimmed) {
      return fallback;
    }
    return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
  }

  async createTextMemory(text: string): Promise<string> {
    this.assertReady();

    const normalized = text.trim();
    const summary = await textAIService.summarizeText(normalized);
    const tags = await textAIService.generateTags(normalized);
    const category = (await textAIService.categorizeContent(normalized)) as MemoryCategory;
    const duplicateOfId = await this.detectDuplicate(normalized);

    const memory: Omit<Memory, 'id'> = {
      title: this.deriveTitle(normalized),
      rawText: normalized,
      aiSummary: summary,
      aiTags: tags,
      category,
      memoryType: 'text',
      timestamp: new Date(),
      bundleId: this.buildBundleId(category, tags),
      duplicateOfId,
      confidenceScore: 0.82,
      isFavorite: false,
      isPinned: false,
    };

    return databaseService.saveMemory(memory);
  }

  async createVoiceMemory(audioUri: string): Promise<string> {
    this.assertReady();
    const transcript = await speechToTextService.transcribeAudio(audioUri);
    return this.createVoiceMemoryFromTranscript(transcript);
  }

  async createVoiceMemoryFromTranscript(transcript: string): Promise<string> {
    this.assertReady();
    const normalized = transcript.trim();
    const summary = await textAIService.summarizeText(normalized);
    const tags = await textAIService.generateTags(normalized);
    const category = (await textAIService.categorizeContent(normalized)) as MemoryCategory;
    const duplicateOfId = await this.detectDuplicate(normalized);

    const memory: Omit<Memory, 'id'> = {
      title: this.deriveTitle(normalized, 'Voice memory'),
      voiceTranscript: normalized,
      aiSummary: summary,
      aiTags: tags,
      category,
      memoryType: 'voice',
      timestamp: new Date(),
      bundleId: this.buildBundleId(category, tags),
      duplicateOfId,
      confidenceScore: 0.75,
      isFavorite: false,
      isPinned: false,
    };

    return databaseService.saveMemory(memory);
  }

  async createImageMemory(imageUri: string, optionalText?: string): Promise<string> {
    this.assertReady();

    const visionResult = await visionAIService.analyzeImage(imageUri);
    const combinedText = `${optionalText?.trim() ?? ''} ${visionResult.description}`.trim();

    const summary = await textAIService.summarizeText(combinedText);
    const tags = await textAIService.generateTags(
      `${combinedText} ${visionResult.objectLabels.join(' ')}`,
    );
    const category = (await textAIService.categorizeContent(combinedText)) as MemoryCategory;
    const duplicateOfId = await this.detectDuplicate(combinedText);

    const memory: Omit<Memory, 'id'> = {
      title: this.deriveTitle(combinedText, 'Image memory'),
      rawText: optionalText?.trim(),
      imageUri,
      aiSummary: summary,
      aiTags: tags,
      category,
      memoryType: 'image',
      objectLabels: visionResult.objectLabels,
      sceneLabels: visionResult.sceneLabels,
      timestamp: new Date(),
      bundleId: this.buildBundleId(category, tags),
      duplicateOfId,
      confidenceScore: 0.78,
      isFavorite: false,
      isPinned: false,
    };

    return databaseService.saveMemory(memory);
  }

  async createMultimodalMemory(
    imageUri: string,
    audioUri: string,
    text?: string,
  ): Promise<string> {
    this.assertReady();
    const transcript = await speechToTextService.transcribeAudio(audioUri);
    return this.createMultimodalMemoryFromInputs(imageUri, transcript, text);
  }

  async createMultimodalMemoryFromInputs(
    imageUri: string,
    transcript: string,
    text?: string,
  ): Promise<string> {
    this.assertReady();

    const visionResult = await visionAIService.analyzeImage(imageUri);
    const combinedText = `${text?.trim() ?? ''} ${transcript.trim()} ${visionResult.description}`.trim();
    const summary = await textAIService.summarizeText(combinedText);
    const tags = await textAIService.generateTags(combinedText);
    const category = (await textAIService.categorizeContent(combinedText)) as MemoryCategory;
    const duplicateOfId = await this.detectDuplicate(combinedText);

    const memory: Omit<Memory, 'id'> = {
      title: this.deriveTitle(combinedText, 'Multimodal memory'),
      rawText: text?.trim(),
      voiceTranscript: transcript.trim(),
      imageUri,
      aiSummary: summary,
      aiTags: tags,
      category,
      memoryType: 'multimodal',
      objectLabels: visionResult.objectLabels,
      sceneLabels: visionResult.sceneLabels,
      timestamp: new Date(),
      bundleId: this.buildBundleId(category, tags),
      duplicateOfId,
      confidenceScore: 0.86,
      isFavorite: false,
      isPinned: false,
    };

    return databaseService.saveMemory(memory);
  }

  async searchMemories(query: string): Promise<Memory[]> {
    this.assertReady();
    return databaseService.searchMemories(query);
  }

  async askMemoryLens(question: string): Promise<AskMemoryLensResult> {
    this.assertReady();
    const relevantMemories = await this.searchMemories(question);
    const topMatches = relevantMemories.slice(0, 4);

    if (topMatches.length === 0) {
      return {
        answer:
          'I could not find a matching memory yet. Capture a note, voice, or image and ask again.',
        relevantMemories: [],
        confidence: 0.2,
        reasoningSummary: 'No matching memory records were found in local storage.',
      };
    }

    const context = topMatches.map(memory => {
      const parts = [
        memory.title,
        memory.aiSummary,
        memory.rawText,
        memory.voiceTranscript,
        memory.locationText,
      ].filter(Boolean);
      return parts.join(' ');
    });

    const answer = await textAIService.answerQuestion(question, context);
    const confidence = Math.min(0.95, 0.45 + topMatches.length * 0.12);
    const reasoningSummary = `Matched ${topMatches.length} memory item(s) based on title, summary, tags, and transcripts.`;

    return {
      answer,
      relevantMemories: topMatches,
      confidence,
      reasoningSummary,
    };
  }

  async getMemories(limit?: number, offset?: number): Promise<Memory[]> {
    this.assertReady();
    return databaseService.getMemories(limit, offset);
  }

  async getMemoryById(id: string): Promise<Memory | null> {
    this.assertReady();
    return databaseService.getMemoryById(id);
  }

  async updateMemory(id: string, updates: Partial<Memory>): Promise<void> {
    this.assertReady();
    await databaseService.updateMemory(id, updates);
  }

  async deleteMemory(id: string): Promise<void> {
    this.assertReady();
    await databaseService.deleteMemory(id);
  }

  async clearAllMemories(): Promise<void> {
    this.assertReady();
    await databaseService.clearAllMemories();
  }

  async exportMemories(): Promise<string> {
    this.assertReady();
    return databaseService.exportMemories();
  }

  async getStorageStats(): Promise<StorageStats> {
    this.assertReady();
    return databaseService.getStorageStats();
  }

  async getMemoriesByCategory(category: string): Promise<Memory[]> {
    this.assertReady();
    const allMemories = await this.getMemories(1000);
    if (category === 'All') {
      return allMemories;
    }
    return allMemories.filter(memory => memory.category === category);
  }

  async getFavoriteMemories(): Promise<Memory[]> {
    this.assertReady();
    const allMemories = await this.getMemories(1000);
    return allMemories.filter(memory => memory.isFavorite);
  }

  async getMemoryBundles(limit = 5): Promise<BundleSummary[]> {
    this.assertReady();
    const allMemories = await this.getMemories(300);
    const grouped = new Map<string, Memory[]>();

    for (const memory of allMemories) {
      const bundleKey = memory.bundleId ?? `${memory.category.toLowerCase()}::general`;
      const bucket = grouped.get(bundleKey) ?? [];
      bucket.push(memory);
      grouped.set(bundleKey, bucket);
    }

    return Array.from(grouped.entries())
      .map(([id, memories]) => ({
        id,
        title: memories[0]?.aiTags[0] ? `${memories[0].aiTags[0]} bundle` : `${memories[0].category} bundle`,
        count: memories.length,
        memories: memories.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async getDailySummary(date: Date = new Date()): Promise<string> {
    this.assertReady();
    const allMemories = await this.getMemories(400);
    const dayKey = date.toDateString();
    const todays = allMemories.filter(
      memory => new Date(memory.timestamp).toDateString() === dayKey,
    );

    if (todays.length === 0) {
      return 'No memories captured today.';
    }

    const categories = todays.reduce<Record<string, number>>((acc, memory) => {
      acc[memory.category] = (acc[memory.category] ?? 0) + 1;
      return acc;
    }, {});

    const categorySummary = Object.entries(categories)
      .map(([category, count]) => `${category} (${count})`)
      .join(', ');

    return `You captured ${todays.length} memories today across ${categorySummary}.`;
  }
}

export const memoryService = new MemoryService();
