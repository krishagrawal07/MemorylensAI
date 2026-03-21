// Placeholder for RunAnywhere SDK vision model integration.
// Heuristic labels keep demo useful until on-device model inference is connected.

export class VisionAIService {
  private initialized = false;

  async initialize(): Promise<void> {
    // TODO: initialize RunAnywhere vision model
    this.initialized = true;
    console.log('Vision AI model initialized');
  }

  private assertReady(): void {
    if (!this.initialized) {
      throw new Error('Vision AI runtime not ready. Call initialize() first.');
    }
  }

  private inferLabelsFromUri(imageUri: string): {
    objectLabels: string[];
    sceneLabels: string[];
    description: string;
  } {
    const normalized = imageUri.toLowerCase();
    const objectLabels: string[] = [];
    const sceneLabels: string[] = [];

    const match = (pattern: RegExp, object: string, scene?: string) => {
      if (!pattern.test(normalized)) {
        return;
      }
      objectLabels.push(object);
      if (scene) {
        sceneLabels.push(scene);
      }
    };

    match(/key|wallet|charger|notebook|glasses/, 'daily-item', 'indoor');
    match(/passport|id|doc|invoice|paper/, 'document', 'indoor');
    match(/medicine|tablet|pill|syrup/, 'medicine', 'indoor');
    match(/car|parking|garage|basement|b2/, 'vehicle', 'parking-area');
    match(/bag|suitcase|travel/, 'bag', 'indoor');
    match(/desk|drawer|table|shelf/, 'furniture', 'indoor');

    if (objectLabels.length === 0) {
      objectLabels.push('object');
    }
    if (sceneLabels.length === 0) {
      sceneLabels.push('indoor');
    }

    const description = `Photo memory detected: ${objectLabels.join(', ')} in ${sceneLabels.join(', ')}.`;
    return { description, objectLabels, sceneLabels };
  }

  async analyzeImage(imageUri: string): Promise<{
    description: string;
    objectLabels: string[];
    sceneLabels: string[];
  }> {
    this.assertReady();
    // TODO: RunAnywhere SDK image analysis call
    return this.inferLabelsFromUri(imageUri);
  }

  async extractTextFromImage(_imageUri: string): Promise<string> {
    this.assertReady();
    // TODO: OCR call when available in SDK
    return '';
  }
}

export const visionAIService = new VisionAIService();
