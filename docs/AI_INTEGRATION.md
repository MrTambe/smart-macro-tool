# AI Integration Architecture

## Overview

This AI integration follows the architecture patterns used by leading AI applications like Cursor, ChatGPT, Claude, and Gemini. The system provides:

- **Multi-Provider Support**: OpenAI, Anthropic Claude, Google Gemini
- **Streaming Responses**: Real-time token-by-token delivery using SSE
- **Context Management**: Conversation history, caching, and session management
- **Tool Calling**: MCP-inspired function calling system
- **Unified Interface**: Single API for all AI operations

## Architecture

### Core Components

```
src/core/ai/
├── index.js              # Main exports
├── ai-service.js         # Main service integrating all components
├── provider-base.js      # Abstract base class for providers
├── providers/
│   ├── openai-provider.js      # OpenAI GPT-4, GPT-3.5
│   ├── anthropic-provider.js    # Claude 3 (Haiku, Sonnet, Opus)
│   └── gemini-provider.js       # Gemini 1.5
├── context-manager.js    # Conversation history & context
├── tool-manager.js       # Function/tool calling system
├── ai-settings.js        # Provider configuration
└── demo.js               # Usage examples
```

### Design Patterns

#### 1. Provider Abstraction Layer

All AI providers implement a common interface:

```javascript
class AIProvider {
  async chat(messages, options)      // Send messages and get response
  async streamChat(messages, cb, opt) // Streaming response
  async complete(prompt, options)    // Simple completion
  getProviderName()                   // Provider identifier
}
```

This allows switching between providers without changing application code.

#### 2. Streaming with SSE

All providers support Server-Sent Events for real-time responses:

```javascript
const emitter = await ai.streamChat(messages);
emitter.on('data', (chunk) => {
  process.stdout.write(chunk.delta);
});
```

#### 3. Context Management

Conversation history is managed automatically:

```javascript
await ai.startSession();
await ai.chat('My name is John');
const response = await ai.chat('What is my name?'); // Remembers context
```

#### 4. Tool Calling

Custom tools can be registered and called by the AI:

```javascript
ai.registerTool('search', {
  description: 'Search for information',
  execute: async (args) => { /* ... */ }
});
```

## Supported Providers

### OpenAI (ChatGPT)

- **Models**: GPT-4o, GPT-4, GPT-3.5-Turbo
- **Streaming**: SSE
- **Embeddings**: Yes
- **API**: `https://api.openai.com/v1/chat/completions`

### Anthropic (Claude)

- **Models**: Claude Opus 4, Sonnet 4, Haiku 3
- **Streaming**: Named SSE events
- **Embeddings**: No
- **API**: `https://api.anthropic.com/v1/messages`

### Google (Gemini)

- **Models**: Gemini 1.5 Pro, Gemini 1.5 Flash
- **Streaming**: SSE
- **Embeddings**: Yes
- **API**: `https://generativelanguage.googleapis.com/v1/models/...:generateContent`

## Usage Examples

### Basic Chat

```javascript
const AIService = require('./core/ai/ai-service');

const ai = new AIService({
  providers: {
    openai: { apiKey: 'your-key', model: 'gpt-4' }
  }
});

await ai.startSession();
const response = await ai.chat('Hello!');
console.log(response.content);
```

### Streaming Response

```javascript
const emitter = await ai.streamChat('Write a story', { stream: true });

emitter.on('data', (chunk) => {
  process.stdout.write(chunk.delta);
});

emitter.on('complete', () => {
  console.log('\nDone!');
});
```

### Multiple Providers

```javascript
const ai = new AIService({
  providers: {
    openai: { apiKey: '...', model: 'gpt-4' },
    anthropic: { apiKey: '...', model: 'claude-sonnet-4' }
  }
});

ai.switchProvider('anthropic');
const response = await ai.chat('Hello from Claude');
```

### Text Enhancement

```javascript
const AIEnrichment = require('./core/ai-enrichment');

const enrichment = new AIEnrichment();
await enrichment.initialize({ openaiApiKey: '...' });

const result = await enrichment.enhanceText(
  'The quick brown fox jumps over the lazy dog.',
  'professional'
);

console.log(result.enhanced);
```

### Custom Tools

```javascript
ai.registerTool('get_weather', {
  description: 'Get weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: { type: 'string' }
    },
    required: ['location']
  },
  execute: async (args) => {
    return { temp: 72, location: args.location };
  }
});

const response = await ai.chat('What is the weather in NYC?', { useTools: true });
```

## Configuration

### Environment Variables

```bash
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
GEMINI_API_KEY=your-key
```

### Programmatic Configuration

```javascript
const ai = new AIService({
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4096,
      streamingEnabled: true
    }
  },
  systemPrompt: 'You are a helpful assistant.',
  maxContextTokens: 128000
});
```

## Frontend Integration

The frontend service (`frontend/src/services/ai-service.js`) provides a React-compatible interface:

```javascript
import aiService from './services/ai-service';

await aiService.initialize({
  openaiApiKey: '...',
  defaultProvider: 'openai'
});

const result = await aiService.enhanceText(text, 'professional');
```

## Migration from Old System

The old `ai-enrichment.js` has been updated to use the new architecture:

```javascript
// Old (still works with simulation)
const AIEnrichment = require('./core/ai-enrichment');
const enrichment = new AIEnrichment();
const result = await enhancement.enhanceText(text, 'rewrite');

// New (with real API)
await enrichment.initialize({ openaiApiKey: '...' });
const result = await enhancement.enhanceText(text, 'rewrite');
```

## API Reference

### AIService Methods

| Method | Description |
|--------|-------------|
| `startSession()` | Initialize a new conversation session |
| `chat(message, options)` | Send a message and get response |
| `streamChat(message, onChunk, options)` | Stream response in real-time |
| `enhanceText(text, type, options)` | Enhance text using AI |
| `switchProvider(name)` | Switch between providers |
| `registerTool(name, tool)` | Register a custom tool |
| `setSystemPrompt(prompt)` | Set the system prompt |
| `getStats()` | Get usage statistics |
| `clearSession()` | Clear current session |

### ContextManager Methods

| Method | Description |
|--------|-------------|
| `addMessage(role, content)` | Add a message to history |
| `getMessages(options)` | Retrieve conversation messages |
| `addContext(key, content)` | Add context for retrieval |
| `searchKnowledgeBase(query)` | Search through context |
| `exportContext()` | Export conversation data |

## Best Practices

1. **API Keys**: Store in environment variables, never commit to version control
2. **Streaming**: Use streaming for better UX on long responses
3. **Context**: Trim history to stay within token limits
4. **Error Handling**: Always handle provider-specific errors
5. **Rate Limits**: Implement retry logic for rate limit errors

## Security Considerations

- Never expose API keys in frontend code (use IPC in Electron)
- Validate all tool inputs before execution
- Implement rate limiting to prevent abuse
- Audit tool execution for sensitive operations

## Performance Optimization

- Enable streaming for immediate feedback
- Use prompt caching where available
- Implement response caching for repeated queries
- Batch tool calls when possible
