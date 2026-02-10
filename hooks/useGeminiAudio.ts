import { useEffect, useRef, useState, useCallback } from 'react';
import { Audio } from 'expo-av';
import { pcmToWav } from '@/utils/audio';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const FUNCTION_URL = SUPABASE_URL.replace("http", "ws") + "/functions/v1/cooking-assistant";

export function useGeminiAudio() {
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [queue, setQueue] = useState<string[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false); // UI state indicating AI is talking

    // Initialize Audio Session
    useEffect(() => {
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        }).catch(console.error);
    }, []);

    // WebSocket Connection
    useEffect(() => {
        if (!SUPABASE_URL) return;

        const connect = () => {
            console.log("[GeminiAudio] Connecting to:", FUNCTION_URL);
            const socket = new WebSocket(FUNCTION_URL);
            ws.current = socket;

            socket.onopen = () => {
                console.log("[GeminiAudio] Connected");
                setIsConnected(true);
            };

            socket.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);

                    if (msg.type === "audio" && msg.data) {
                        // Receive PCM base64 -> Convert to WAV -> Add to Queue
                        const wavBase64 = pcmToWav(msg.data); // Assuming 24kHz default from Edge Function
                        const uri = `data:audio/wav;base64,${wavBase64}`;

                        setQueue(prev => [...prev, uri]);
                        setIsSpeaking(true);
                    } else if (msg.type === "turn_complete") {
                        // Optional: Handle logical end of turn
                    }
                } catch (e) {
                    console.error("[GeminiAudio] Error parsing message:", e);
                }
            };

            socket.onclose = (e) => {
                console.log("[GeminiAudio] Disconnected", e.reason);
                setIsConnected(false);
                // Reconnect logic could go here
            };

            socket.onerror = (e) => {
                console.error("[GeminiAudio] Error:", e);
            };
        };

        connect();

        return () => {
            ws.current?.close();
        };
    }, []);

    // Audio Playback Queue Processor
    useEffect(() => {
        let soundObject: Audio.Sound | null = null;

        const playNext = async () => {
            if (isPlaying || queue.length === 0) {
                if (queue.length === 0 && !isPlaying) setIsSpeaking(false);
                return;
            }

            setIsPlaying(true);
            const uri = queue[0];

            try {
                const { sound } = await Audio.Sound.createAsync(
                    { uri },
                    { shouldPlay: true }
                );
                soundObject = sound;

                sound.setOnPlaybackStatusUpdate(async (status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        await sound.unloadAsync();
                        setQueue(prev => prev.slice(1)); // Remove played item
                        setIsPlaying(false); // Trigger next play
                    }
                });
            } catch (error) {
                console.error("[GeminiAudio] Playback failed:", error);
                setQueue(prev => prev.slice(1)); // Skip broken item
                setIsPlaying(false);
            }
        };

        playNext();

        return () => {
            if (soundObject) {
                soundObject.unloadAsync();
            }
        };
    }, [queue, isPlaying]);

    const speak = useCallback((text: string) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: "text_input", content: text }));
        } else {
            console.warn("[GeminiAudio] Socket not open, cannot speak.");
        }
    }, []);

    const stop = useCallback(() => {
        setQueue([]);
        setIsSpeaking(false);
        // TODO: Send interrupt message to backend?
    }, []);

    return { speak, stop, isConnected, isSpeaking };
}
