// Placeholder for RunAnywhere SDK text model integration.
// Replace rule-based helpers with on-device model calls when SDK is wired.

import { MemoryCategory } from '../types';

const STOPWORDS = new Set([
  'i',
  'me',
  'my',
  'the',
  'a',
  'an',
  'and',
  'or',
  'to',
  'of',
  'in',
  'on',
  'near',
  'at',
  'for',
  'is',
  'are',
  'was',
  'were',
  'be',
  'it',
  'this',
  'that',
  'with',
  'from',
  'after',
  'before',
  'by',
  'as',
  'you',
  'your',
  'we',
  'our',
]);

export class TextAIService {
  private initialized = false;

  async initialize(): Promise<void> {
    // TODO: initialize RunAnywhere text model
    this.initialized = true;
    console.log('Text AI model initialized');
  }

  private assertReady(): void {
    if (!this.initialized) {
      throw new Error('Text AI runtime not ready. Call initialize() first.');
    }
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1 && !STOPWORDS.has(token));
  }

  private unique(values: string[]): string[] {
    return Array.from(new Set(values));
  }

  async summarizeText(text: string): Promise<string> {
    this.assertReady();
    const cleaned = text.trim().replace(/\s+/g, ' ');
    if (!cleaned) {
      return 'No details captured for this memory.';
    }

    if (cleaned.length <= 120) {
      return cleaned;
    }

    const sentence = cleaned.split(/[.!?]/)[0]?.trim();
    if (sentence && sentence.length > 30) {
      return sentence;
    }

    return `${cleaned.slice(0, 117)}...`;
  }

  async generateTags(text: string): Promise<string[]> {
    this.assertReady();
    const tokens = this.tokenize(text);
    const tags = tokens.slice(0, 6);
    return this.unique(tags.length > 0 ? tags : ['memory', 'note']);
  }

  async categorizeContent(text: string): Promise<MemoryCategory> {
    this.assertReady();
    const lower = text.toLowerCase();

    if (/medicine|tablet|pill|dose|syrup|after dinner|before meal/.test(lower)) {
      return 'Medicine';
    }

    if (/park|parking|garage|basement|pillar|slot|b2|gate/.test(lower)) {
      return 'Parking';
    }

    if (/passport|id|document|license|certificate|paper|file|invoice/.test(lower)) {
      return 'Documents';
    }

    if (/class|lecture|note|meeting|todo|task|reminder/.test(lower)) {
      return 'Tasks';
    }

    if (/room|kitchen|desk|drawer|shelf|table|gate|office|place|location/.test(lower)) {
      return 'Places';
    }

    if (/keys|wallet|charger|notebook|glasses|bag|bottle|object/.test(lower)) {
      return 'Objects';
    }

    return 'Notes';
  }

  async answerQuestion(question: string, contextMemories: string[]): Promise<string> {
    this.assertReady();
    const merged = contextMemories.join(' ').trim();

    if (!merged) {
      return 'I could not find a matching memory yet. Try capturing a new note or photo.';
    }

    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('where')) {
      return `Likely location: ${merged}`;
    }

    if (lowerQuestion.includes('when')) {
      return `Most relevant memory says: ${merged}`;
    }

    return `Based on saved memories: ${merged}`;
  }
}

export const textAIService = new TextAIService();
