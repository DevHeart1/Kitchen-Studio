import { useState, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';
import {
    useSpeechRecognitionEvent,
    ExpoSpeechRecognitionModule,
} from 'expo-speech-recognition';

interface UseVoiceControlProps {
    onCommand?: (transcript: string) => void;
    onStateChange?: (isListening: boolean) => void;
}

export const useVoiceControl = ({ onCommand, onStateChange }: UseVoiceControlProps = {}) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState("");

    useSpeechRecognitionEvent("start", () => {
        setIsListening(true);
        if (onStateChange) onStateChange(true);
    });

    useSpeechRecognitionEvent("end", () => {
        setIsListening(false);
        if (onStateChange) onStateChange(false);
    });

    useSpeechRecognitionEvent("result", (event) => {
        const currentTranscript = event.results[0]?.transcript || "";
        setTranscript(currentTranscript);

        if (event.isFinal && onCommand) {
            onCommand(currentTranscript);
        }
    });

    const startListening = useCallback(async () => {
        try {
            const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!result.granted) {
                console.warn("Microphone permission denied");
                return;
            }

            ExpoSpeechRecognitionModule.start({
                lang: "en-US",
                interimResults: true,
                maxAlternatives: 1,
                continuous: true,
            });
            // State update handled by event listener
        } catch (e) {
            console.error("Failed to start listening:", e);
        }
    }, []);

    const stopListening = useCallback(() => {
        try {
            ExpoSpeechRecognitionModule.stop();
            // State update handled by event listener
        } catch (e) {
            console.error("Failed to stop listening:", e);
        }
    }, []);

    const speak = useCallback((text: string, onDone?: () => void) => {
        if (isSpeaking) {
            Speech.stop();
        }

        setIsSpeaking(true);
        // Pause listening while speaking to avoid hearing itself
        const wasListening = isListening;
        if (wasListening) {
            ExpoSpeechRecognitionModule.stop();
        }

        Speech.speak(text, {
            language: 'en-US',
            rate: 0.9,
            pitch: 1.0,
            onDone: () => {
                setIsSpeaking(false);
                if (wasListening) {
                    // Resume listening after a short delay
                    setTimeout(() => {
                        // Check if we should still resume (user didn't manually stop)
                        // This logic is tricky without a ref, but good enough for now
                        startListening();
                    }, 500);
                }
                if (onDone) onDone();
            },
            onError: () => {
                setIsSpeaking(false);
                if (wasListening) {
                    startListening();
                }
            }
        });
    }, [isListening, isSpeaking, startListening]);

    const stopSpeaking = useCallback(() => {
        Speech.stop();
        setIsSpeaking(false);
    }, []);

    return {
        isListening,
        isSpeaking,
        transcript,
        startListening,
        stopListening,
        speak,
        stopSpeaking
    };
};
