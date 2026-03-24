import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { memoryService } from '../services/memoryService';
import { Memory } from '../types';

type AskMemoryLensScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AskMemoryLens'
>;

type Props = {
  navigation: AskMemoryLensScreenNavigationProp;
};

type Message = {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  relevantMemories?: Memory[];
  confidence?: number;
  reasoningSummary?: string;
};

export default function AskMemoryLensScreen({ navigation }: Props) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const suggestedQuestions = useMemo(
    () => [
      'Where are my keys?',
      'Where did I park my car?',
      'What medicine did I save this week?',
      'When did I last see my passport?',
      'Find my charger memory near bed.',
    ],
    [],
  );

  const handleAsk = async () => {
    const normalized = question.trim();
    if (!normalized) {
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: normalized,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const result = await memoryService.askMemoryLens(normalized);
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: result.answer,
        timestamp: new Date(),
        relevantMemories: result.relevantMemories,
        confidence: result.confidence,
        reasoningSummary: result.reasoningSummary,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to get answer:', error);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: 'I hit a local processing issue. Please ask again in a different way.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleMemoryPress = (memory: Memory) => {
    navigation.navigate('MemoryDetail', { memoryId: memory.id });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.type === 'user' ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.type === 'user' ? styles.userMessageText : styles.aiMessageText,
        ]}
      >
        {item.content}
      </Text>

      {item.type === 'ai' && typeof item.confidence === 'number' && (
        <View style={styles.metadataCard}>
          <Text style={styles.metadataTitle}>
            Confidence: {Math.round(item.confidence * 100)}%
          </Text>
          {item.reasoningSummary ? (
            <Text style={styles.metadataSubtitle}>{item.reasoningSummary}</Text>
          ) : null}
        </View>
      )}

      {item.relevantMemories && item.relevantMemories.length > 0 && (
        <View style={styles.memoriesContainer}>
          <Text style={styles.memoriesTitle}>Matched memories:</Text>
          {item.relevantMemories.slice(0, 3).map(memory => (
            <TouchableOpacity key={memory.id} onPress={() => handleMemoryPress(memory)}>
              <View style={styles.memoryPreview}>
                <Text style={styles.memoryPreviewTitle} numberOfLines={1}>
                  {memory.title}
                </Text>
                <Text style={styles.memoryPreviewSummary} numberOfLines={2}>
                  {memory.aiSummary}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Ask MemoryLens</Text>
          <Text style={styles.subtitle}>Search your private memories using natural language</Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          onContentSizeChange={scrollToBottom}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.messagesContainer,
            messages.length === 0 ? styles.messagesContainerEmpty : null,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>How can I help you remember?</Text>
              <Text style={styles.emptySubtitle}>Try one of these prompts:</Text>
              <View style={styles.suggestions}>
                {suggestedQuestions.map(questionOption => (
                  <TouchableOpacity
                    key={questionOption}
                    style={styles.suggestionChip}
                    onPress={() => setQuestion(questionOption)}
                  >
                    <Text style={styles.suggestionText}>{questionOption}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Analyzing local memories...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about your memories..."
            value={question}
            onChangeText={setQuestion}
            onSubmitEditing={handleAsk}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!question.trim() || loading) && styles.disabledButton]}
            onPress={handleAsk}
            disabled={!question.trim() || loading}
          >
            <Text style={styles.sendButtonText}>Ask</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 28,
  },
  messagesContainerEmpty: {
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '96%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    padding: 12,
    borderRadius: 16,
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    backgroundColor: '#007AFF',
    color: '#fff',
  },
  aiMessageText: {
    backgroundColor: '#fff',
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metadataCard: {
    marginTop: 6,
    backgroundColor: '#eef5ff',
    borderRadius: 10,
    padding: 10,
  },
  metadataTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#174ea6',
  },
  metadataSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#1f2937',
    lineHeight: 17,
  },
  memoriesContainer: {
    marginTop: 8,
  },
  memoriesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 8,
  },
  memoryPreview: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  memoryPreviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  memoryPreviewSummary: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  suggestionChip: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  suggestionText: {
    fontSize: 14,
    color: '#007AFF',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 15,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

