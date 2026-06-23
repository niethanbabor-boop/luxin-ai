# Luxin AI Assistant

An offline AI chat assistant that runs GGUF models on your device using llama.cpp. Chat with AI locally without an internet connection.

## Features

- Load any `.gguf` model file (Llama 3, Mistral, Phi, Gemma, Qwen, etc.)
- 100% offline — no internet required after model download
- ChatGPT-style interface with conversation history
- Streaming responses
- Light & dark mode support

## Build APK via EAS (Expo)

```bash
# Install EAS CLI
npm install -g eas-cli

# Set your Expo token
export EXPO_TOKEN=your_token_here

# Build APK
npx eas build -p android --profile preview --non-interactive
```

Get your Expo token from: https://expo.dev/settings/access-tokens

## Run locally

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or run on web.

## Tech Stack

- Expo 54 (React Native)
- llama.rn (llama.cpp bindings)
- React Native Gesture Handler + Reanimated
- React Native Keyboard Controller
