import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Link2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import ConvertLoadingOverlay from "@/components/ConvertLoadingOverlay";

interface LinkInputProps {
  onConvert?: (url: string) => void;
  placeholder?: string;
  hint?: string;
}

export default function LinkInput({ onConvert, placeholder, hint }: LinkInputProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ... (handleConvert logic remains similar but remove auto-navigation if we want parent to handle it, 
  // or keep it if parent doesn't return anything. 
  // Wait, the parent `index.tsx` Navigates. `LinkInput` seems to have its own loading overlay and nav logic?
  // Let's defer navigation to parent if provided, or keep `onConvert` as just the trigger.
  // The current `LinkInput` navigates to `/recipe` in `handleLoadingComplete`.
  // If `index.tsx` also navigates, we have a double nav.
  // I should remove the internal navigation in `LinkInput` if `onConvert` handles it, OR update `LinkInput` to simply call `onConvert` and let parent handle flow.
  // Given `index.tsx` logic: `router.push({ pathname: "/recipe", ... })`, the internal `LinkInput` navigation is redundant or conflicting.
  // I will make `LinkInput` purely a UI component that calls `onConvert` and clears input.

  const handleConvert = () => {
    if (url.trim()) {
      // setIsLoading(true); // Don't use internal loading state if parent handles it
      onConvert?.(url);
      setUrl(""); // Clear input
    }
  };

  return (
    <View style={styles.container}>
      {/* Removed internal ConvertLoadingOverlay as the parent (or recipe screen) handles loading state now */}
      <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
        <View style={styles.iconContainer}>
          <Link2 size={20} color={Colors.textMuted} />
        </View>
        <TextInput
          style={styles.input}
          placeholder={placeholder || "Paste TikTok, IG, or YT link..."}
          placeholderTextColor={Colors.textMuted}
          value={url}
          onChangeText={setUrl}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <TouchableOpacity
          style={styles.convertButton}
          onPress={handleConvert}
          activeOpacity={0.8}
        >
          <Text style={styles.convertText}>Convert</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>
        {hint || "AI-powered AR analysis takes about 10 seconds."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    overflow: "hidden",
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  iconContainer: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: 15,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  convertButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 4,
    marginVertical: 4,
  },
  convertText: {
    color: Colors.backgroundDark,
    fontSize: 15,
    fontWeight: "700" as const,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});
