import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function ComingSoonScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <ArrowLeft size={24} color={Colors.white} />
            </TouchableOpacity>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Sparkles size={64} color={Colors.primary} />
                </View>
                <Text style={styles.title}>Coming Soon</Text>
                <Text style={styles.description}>
                    We're mixing up something special! This feature is currently in the Kitchen Studio test kitchen and will be served soon.
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.back()}
                >
                    <Text style={styles.buttonText}>Back to Recipe</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundDark,
    },
    backButton: {
        padding: 16,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        marginTop: -100,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(43, 238, 91, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.white,
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#92c9a0',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    buttonText: {
        color: Colors.backgroundDark,
        fontSize: 16,
        fontWeight: '700',
    },
});
