import { useState, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';
import {
    useSpeechRecognitionEvent,
    ExpoSpeechRecognitionModule,
    useSpeechRecognition
} from '@jamsch/expo-speech-recognition';

interface UseVoiceControlProps {
    onCommand?: (transcript: string) => void;
    onStateChange?: (isListening: boolean) => void;
}

export const useVoiceControl = ({ onCommand, onStateChange }: UseVoiceControlProps = {}) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState("");

    const {
        recognizing,
        transcript: liveTranscript,
    } = useSpeechRecognition({
        onResult: (event) => {
            if (event.isFinal) {
                setTranscript(event.results[0]?.transcript || "");
                if (onCommand) {
                    onCommand(event.results[0]?.transcript || "");
                }
            }
        },
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

            setIsListening(true);
            if (onStateChange) onStateChange(true);
        } catch (e) {
            console.error("Failed to start listening:", e);
        }
    }, [onStateChange]);

    const stopListening = useCallback(() => {
        try {
            ExpoSpeechRecognitionModule.stop();
            setIsListening(false);
            if (onStateChange) onStateChange(false);
        } catch (e) {
            console.error("Failed to stop listening:", e);
        }
    }, [onStateChange]);

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
                        if (isListening) startListening();
                    }, 500);
                }
                if (onDone) onDone();
            },
            onError: () => {
                setIsSpeaking(false);
                if (wasListening) {
                    if (isListening) startListening();
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
        transcript: liveTranscript || transcript,
        startListening,
        stopListening,
        speak,
        stopSpeaking
    };
};
