export type MemoryType = 'text' | 'voice' | 'image' | 'multimodal';

export interface Memory {
  id: string;
  title: string;
  rawText?: string;
  voiceTranscript?: string;
  imageUri?: string;
  aiSummary: string;
  aiTags: string[];
  category: string;
  timestamp: Date;
  memoryType?: MemoryType;
  locationText?: string;
  objectLabels?: string[];
  sceneLabels?: string[];
  confidenceScore?: number;
  bundleId?: string;
  duplicateOfId?: string;
  isFavorite: boolean;
  isPinned: boolean;
}

export type MemoryCategory =
  | 'Objects'
  | 'Places'
  | 'Notes'
  | 'Documents'
  | 'Medicine'
  | 'Parking'
  | 'Tasks'
  | 'Other';

export interface SearchResult {
  memory: Memory;
  relevanceScore: number;
  matchedFields: string[];
}

export interface AIModelResponse {
  summary: string;
  tags: string[];
  category: MemoryCategory;
  objectLabels?: string[];
  sceneLabels?: string[];
}

export interface AskMemoryLensResult {
  answer: string;
  relevantMemories: Memory[];
  confidence: number;
  reasoningSummary: string;
}

export interface StorageStats {
  totalMemories: number;
  estimatedBytes: number;
}
