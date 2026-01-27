import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Link2 } from "lucide-react-native";
import Colors from "@/constants/colors";

interface LinkInputProps {
  onConvert?: (url: string) => void;
}

export default function LinkInput({ onConvert }: LinkInputProps) {
  const [url, setUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleConvert = () => {
    if (url.trim()) {
      onConvert?.(url);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
        <View style={styles.iconContainer}>
          <Link2 size={20} color={Colors.textMuted} />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Paste TikTok, IG, or YT link..."
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
        AI-powered AR analysis takes about 10 seconds.
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
