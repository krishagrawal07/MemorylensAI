// Placeholder for RunAnywhere SDK speech-to-text integration.
// Supports demo-friendly mock URIs so we can save realistic transcripts offline.

function decodeMockUri(audioUri: string): string | null {
  const marker = 'mock://transcript?text=';
  if (!audioUri.startsWith(marker)) {
    return null;
  }

  const encoded = audioUri.slice(marker.length);
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

export class SpeechToTextService {
  private initialized = false;

  async initialize(): Promise<void> {
    // TODO: initialize RunAnywhere STT model
    this.initialized = true;
    console.log('Speech-to-text model initialized');
  }

  private assertReady(): void {
    if (!this.initialized) {
      throw new Error('Speech-to-text runtime not ready. Call initialize() first.');
    }
  }

  async transcribeAudio(audioUri: string): Promise<string> {
    this.assertReady();

    const decoded = decodeMockUri(audioUri);
    if (decoded && decoded.trim().length > 0) {
      return decoded.trim();
    }

    // TODO: RunAnywhere SDK transcription call
    return 'Captured voice memory from on-device speech-to-text.';
  }

  async startListening(onResult: (text: string) => void): Promise<void> {
    this.assertReady();
    // Simulate immediate voice capture for demo
    const demoTranscripts = [
      'I kept my wallet in the top shelf near the mirror.',
      'Car parked at gate 3, basement B2 beside pillar 18.',
      'Medicine strip is in kitchen drawer, take after dinner.',
      'Keys are hanging on the hook by the front door.',
      'Phone charger is plugged in near the bed on the left side.',
    ];
    const result = demoTranscripts[Math.floor(Math.random() * demoTranscripts.length)];
    onResult(result);
  }

  async stopListening(): Promise<void> {
    // TODO: stop real-time STT stream
  }
}

export const speechToTextService = new SpeechToTextService();
