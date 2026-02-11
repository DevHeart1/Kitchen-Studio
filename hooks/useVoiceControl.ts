import { useState, useCallback } from 'react';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

interface UseVoiceControlProps {
    onCommand?: (transcript: string) => void;
    onStateChange?: (isListening: boolean) => void;
}

export const useVoiceControl = ({ onCommand, onStateChange }: UseVoiceControlProps = {}) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState("");

    const startListening = useCallback(async () => {
        if (Platform.OS === 'web') {
            console.warn("Voice recognition not supported on web");
            return;
        }
        
        try {
            const ExpoSpeechRecognition = await import('expo-speech-recognition');
            const result = await ExpoSpeechRecognition.ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!result.granted) {
                console.warn("Microphone permission denied");
                return;
            }

            ExpoSpeechRecognition.ExpoSpeechRecognitionModule.start({
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

    const stopListening = useCallback(async () => {
        if (Platform.OS === 'web') return;
        
        try {
            const ExpoSpeechRecognition = await import('expo-speech-recognition');
            ExpoSpeechRecognition.ExpoSpeechRecognitionModule.stop();
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

        Speech.speak(text, {
            language: 'en-US',
            rate: 0.9,
            pitch: 1.0,
            onDone: () => {
                setIsSpeaking(false);
                if (onDone) onDone();
            },
            onError: () => {
                setIsSpeaking(false);
            }
        });
    }, [isSpeaking]);

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
