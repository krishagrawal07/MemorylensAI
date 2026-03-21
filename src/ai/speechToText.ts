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
    // TODO: real-time STT stream from RunAnywhere
    setTimeout(() => {
      onResult('I kept my charger near the bed on the right side.');
    }, 1200);
  }

  async stopListening(): Promise<void> {
    // TODO: stop real-time STT stream
  }
}

export const speechToTextService = new SpeechToTextService();
