import { memoryService } from './memoryService';

const SAMPLE_MEMORIES = [
  'I kept my keys on the study table near the window.',
  'Car parked in basement B2 near pillar 18.',
  'Take medicine after dinner. Bottle kept in fridge door.',
  'Passport stored in the second drawer before Delhi trip.',
  'Charger is near the bed on the right side.',
  'Blue notebook kept in the blue bag in hallway cabinet.',
  'Class notes folder is in laptop sleeve pocket.',
  'Grocery list note saved in kitchen board tray.',
];

export class SampleDataService {
  async seedSampleData(force = false): Promise<void> {
    const existing = await memoryService.getMemories(1);
    if (!force && existing.length > 0) {
      return;
    }

    if (force) {
      await memoryService.clearAllMemories();
    }

    for (const text of SAMPLE_MEMORIES) {
      await memoryService.createTextMemory(text);
    }
    console.log('Sample data seeded');
  }
}

export const sampleDataService = new SampleDataService();
