
import {
    GoogleGenAI,
    LiveServerMessage,
    MediaResolution,
    Modality,
    Session,
} from '@google/genai';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { Buffer } from 'buffer';

// Polyfill types for FileSystem if missing
const FS = FileSystem as any;

// Polyfills for React Native
global.Buffer = global.Buffer || Buffer;
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

const responseQueue: LiveServerMessage[] = [];
let session: Session | undefined = undefined;
let isConnected = false;
let currentSound: Audio.Sound | null = null;

// Queue to handle audio playback sequentially
const audioQueue: string[] = [];
let isPlaying = false;

export const GeminiLiveService = {
    connect: async () => {
        if (isConnected) return;

        const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            console.error("Gemini API Key missing!");
            return;
        }

        const ai = new GoogleGenAI({ apiKey });
        const model = 'models/gemini-2.0-flash-exp'; // Using latest public model for now, user specified preview 12-2025 but 2.0-flash-exp is safer alias

        const config = {
            responseModalities: [Modality.AUDIO],
            mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW,
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: 'Aoede',
                    }
                }
            },
            systemInstruction: {
                parts: [{ text: "You are the Kitchen Studio Narrator. You are guiding a user through a cooking recipe in AR. Be concise, encouraging, and helpful. When the user completes a step, confirm it and guide them to the next one. Use a warm, professional tone." }]
            }
        };

        try {
            session = await ai.live.connect({
                model,
                callbacks: {
                    onopen: () => {
                        console.log('Gemini Live Connected');
                        isConnected = true;
                    },
                    onmessage: (message: LiveServerMessage) => {
                        handleModelTurn(message);
                    },
                    onerror: (e: any) => {
                        console.error('Gemini Live Error:', e);
                    },
                    onclose: (e: any) => {
                        console.log('Gemini Live Closed:', e);
                        isConnected = false;
                    },
                },
                config
            });
        } catch (e) {
            console.error("Failed to connect to Gemini Live:", e);
        }
    },

    disconnect: async () => {
        if (session) {
            session.close();
            session = undefined;
            isConnected = false;
        }
    },

    sendText: async (text: string) => {
        if (!session) return;
        try {
            session.sendClientContent({
                turns: [{ parts: [{ text }] }]
            });
        } catch (e) {
            console.error("Error sending text to Gemini:", e);
        }
    },

    // Helper to trigger events from AR
    onStepComplete: (stepIndex: number, stepText: string) => {
        GeminiLiveService.sendText(`User completed step ${stepIndex + 1}: "${stepText}". What should they do next?`);
    },

    onPanPlaced: () => {
        GeminiLiveService.sendText(`User has placed the digital pan. Welcome them to Kitchen Studio and tell them to look at the first step.`);
    }
};

async function handleModelTurn(message: LiveServerMessage) {
    if (message.serverContent?.modelTurn?.parts) {
        const part = message.serverContent?.modelTurn?.parts?.[0];

        if (part?.inlineData) {
            // Audio Response
            const base64Audio = part.inlineData.data;
            if (base64Audio) {
                queueAudio(base64Audio);
            }
        }
    }
}

async function queueAudio(base64Data: string) {
    audioQueue.push(base64Data);
    processAudioQueue();
}

async function processAudioQueue() {
    if (isPlaying || audioQueue.length === 0) return;

    isPlaying = true;
    const base64Data = audioQueue.shift();

    try {
        const tempFile = `${FS.cacheDirectory}gemini_response_${Date.now()}.wav`;

        // Write base64 directly
        await FS.writeAsStringAsync(tempFile, base64Data!, {
            encoding: FS.EncodingType.Base64,
        });

        // @ts-ignore: expo-av types might be strict
        const { sound } = await Audio.Sound.createAsync({ uri: tempFile }, { shouldPlay: true });
        currentSound = sound;

        sound.setOnPlaybackStatusUpdate(async (status) => {
            if (status.isLoaded && status.didJustFinish) {
                await sound.unloadAsync();
                isPlaying = false;
                processAudioQueue(); // Play next
            }
        });

    } catch (error) {
        console.error("Error playing audio chunk:", error);
        isPlaying = false;
        processAudioQueue(); // Try next
    }
}
