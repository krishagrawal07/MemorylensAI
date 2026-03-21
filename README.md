# MemoryLens AI 🧠

**Your Personal Offline Memory Assistant**

MemoryLens AI is a revolutionary mobile app that helps users remember where they put things, what they saw, and what they need to do - all while keeping everything completely private and running entirely on-device.

## 🎯 Problem Statement

In our busy lives, we constantly forget:
- Where we parked our car
- Where we kept our keys, wallet, or passport
- What medicines we need to take
- Important notes and reminders
- Locations of important documents

Current solutions either store data in the cloud (privacy concerns) or lack intelligent AI-powered search and organization.

## 💡 Solution

MemoryLens AI combines **text, voice, and vision AI** running entirely **on-device** using the RunAnywhere SDK. Users can capture memories through multiple modalities and ask natural language questions to retrieve them instantly.

### Key Features
- **100% Private & Offline**: All AI processing happens on your device
- **Multimodal Input**: Text notes, voice recordings, photo capture
- **Intelligent Search**: Ask questions like "Where are my keys?" or "What medicine do I need?"
- **Smart Organization**: AI-generated tags, categories, and summaries
- **No Cloud Dependency**: Works offline everywhere

## 🚀 Why This Matters

### Privacy First
- Zero data leaves your device
- No cloud accounts required
- Complete control over your memories

### Practical Use Cases
- **Daily Life**: Find keys, wallet, charger, glasses
- **Travel**: Remember parking spots, hotel details
- **Health**: Track medicine schedules and locations
- **Work**: Organize notes, documents, meeting details
- **Elderly Care**: Easy memory assistance for seniors

### Technical Innovation
- On-device AI inference for real-time responses
- Multimodal fusion of text, voice, and vision data
- Efficient local storage and retrieval
- Hackathon-ready demo with sample data

## 🛠️ Technology Stack

- **Framework**: React Native (TypeScript)
- **Navigation**: React Navigation
- **Database**: SQLite (react-native-sqlite-storage)
- **AI Engine**: RunAnywhere SDK (on-device inference)
- **Camera**: React Native Image Picker
- **Audio**: React Native Audio Recorder Player
- **Permissions**: React Native Permissions
- **State Management**: React Context + Hooks

## 📱 App Architecture

```
src/
├── components/          # Reusable UI components
├── screens/            # App screens
├── navigation/         # Navigation setup
├── services/           # Business logic services
├── ai/                 # AI model integrations
├── db/                 # Database layer
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Core Services

#### Memory Service
- Handles memory CRUD operations
- Coordinates multimodal data fusion
- Manages search and retrieval

#### AI Services
- **Text AI**: Summarization, tagging, categorization, Q&A
- **Speech-to-Text**: Voice note transcription
- **Vision AI**: Image analysis, object/scene detection

#### Database Service
- Local SQLite storage
- Memory data persistence
- Efficient querying and indexing

## 🎨 User Experience

### Main Screens
1. **Onboarding**: Privacy-focused introduction
2. **Permissions**: Camera, microphone, storage access
3. **Home Dashboard**: Quick actions, recent memories, categories
4. **Capture Memory**: Text/voice/photo input options
5. **Ask MemoryLens**: Natural language Q&A interface
6. **Search Results**: Filtered memory display
7. **Memory Detail**: Full memory view with actions
8. **Settings**: Privacy info, data management

### Key Interactions
- **Quick Capture**: One-tap memory creation
- **Smart Search**: Voice or text queries
- **Category Browsing**: Organized memory access
- **Memory Actions**: Favorite, pin, delete

## 🔧 Setup Instructions

### Prerequisites
- Node.js 22.11.0+
- React Native development environment
- Android Studio (for Android) or Xcode (for iOS)
- RunAnywhere SDK (placeholder integration)

### Installation

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd MemoryLensAI
   npm install
   ```

2. **Install iOS Dependencies** (iOS only)
   ```bash
   cd ios && bundle install && bundle exec pod install
   ```

3. **RunAnywhere SDK Integration**
   - Download RunAnywhere SDK
   - Add SDK files to project
   - Update AI service placeholders with actual SDK calls
   - Configure model initialization

4. **Start Metro Server**
   ```bash
   npm start
   ```

5. **Run on Device/Emulator**
   ```bash
   # Android
   npm run android

   # iOS
   npm run ios
   ```

### Build Configuration

#### Android
- Minimum SDK: API 21 (Android 5.0)
- Target SDK: API 34 (Android 14)
- Permissions: CAMERA, RECORD_AUDIO, WRITE_EXTERNAL_STORAGE

#### iOS
- Minimum iOS: 11.0
- Permissions: NSCameraUsageDescription, NSMicrophoneUsageDescription, NSPhotoLibraryUsageDescription

## 🎪 Hackathon Demo Script

### Quick Demo Flow

1. **Launch App**
   - Show onboarding and permissions flow
   - Highlight "100% Private & Offline" messaging

2. **Sample Data Demo**
   - App pre-loads demo memories
   - Show categories: Objects, Parking, Medicine, Documents

3. **Q&A Demo**
   - Ask "Where are my keys?"
     - Returns: "I kept my keys on the study table near the window"
   - Ask "Where did I park?"
     - Returns: "Car parked in basement B2 near pillar 18"
   - Ask "What medicine did I save?"
     - Returns: "Take medicine after dinner, keep in fridge"

4. **Capture Demo**
   - Show text memory creation
   - Demonstrate AI summary and tagging
   - Show search working immediately

5. **Settings Demo**
   - Show privacy explanations
   - Highlight offline-first design
   - Display AI model status

### Demo Highlights
- **Instant Responses**: No loading delays for AI
- **Privacy Focus**: Emphasize "no cloud" messaging
- **Multimodal Ready**: Show placeholders for voice/vision
- **Production Quality**: Polished UI, error handling

## 🔮 Future Enhancements

### Phase 2 Features
- Real-time voice commands
- OCR for document scanning
- Memory relationship graphs
- Reminder integrations
- Cross-device sync (optional, local network only)

### Advanced AI
- Custom model fine-tuning
- Memory embeddings for semantic search
- Voice output responses
- Multi-language support

### Platform Extensions
- Wear OS integration
- iOS widgets
- Android shortcuts
- Web companion app

## 📊 Technical Implementation Notes

### RunAnywhere SDK Integration Points

```typescript
// Text AI Service
await runAnywhere.textModel.initialize();
const summary = await runAnywhere.textModel.summarize(text);
const tags = await runAnywhere.textModel.extractTags(text);

// Speech-to-Text Service
await runAnywhere.sttModel.initialize();
const transcript = await runAnywhere.sttModel.transcribe(audioUri);

// Vision AI Service
await runAnywhere.visionModel.initialize();
const analysis = await runAnywhere.visionModel.analyze(imageUri);
```

### Database Schema
```sql
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  rawText TEXT,
  voiceTranscript TEXT,
  imageUri TEXT,
  aiSummary TEXT NOT NULL,
  aiTags TEXT NOT NULL, -- JSON array
  category TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  -- ... additional fields
);
```

### Memory Data Flow
1. User captures memory (text/voice/image)
2. AI services process content
3. Multimodal data fusion
4. Store in local database
5. Generate embeddings for search
6. Enable natural language queries

## 🤝 Contributing

This is a hackathon project designed for rapid development and demonstration. Key areas for contribution:

- RunAnywhere SDK integration
- Additional AI model implementations
- UI/UX improvements
- Performance optimizations
- Cross-platform testing

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- RunAnywhere SDK for on-device AI capabilities
- React Native community for the amazing framework
- Hackathon organizers for the opportunity

---

**Built with ❤️ for privacy-conscious users everywhere**

#MemoryLensAI #PrivacyFirst #OnDeviceAI #Hackathon2026
