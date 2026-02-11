import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UsageData = {
    date: string; // YYYY-MM-DD
    counts: Record<string, number>;
};

interface UsageContextType {
    getUsage: (feature: string) => number;
    incrementUsage: (feature: string) => Promise<void>;
    checkLimit: (feature: string, limit: number) => boolean; // Returns true if limit reached
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export const UsageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [usageData, setUsageData] = useState<UsageData>({ date: "", counts: {} });

    useEffect(() => {
        loadUsage();
    }, []);

    const getTodayString = () => {
        const now = new Date();
        return now.toISOString().split("T")[0];
    };

    const loadUsage = async () => {
        try {
            const stored = await AsyncStorage.getItem("usage_stats");
            const today = getTodayString();
            if (stored) {
                const parsed: UsageData = JSON.parse(stored);
                if (parsed.date === today) {
                    setUsageData(parsed);
                } else {
                    // New day, reset counts
                    const newData = { date: today, counts: {} };
                    await AsyncStorage.setItem("usage_stats", JSON.stringify(newData));
                    setUsageData(newData);
                }
            } else {
                const newData = { date: today, counts: {} };
                await AsyncStorage.setItem("usage_stats", JSON.stringify(newData));
                setUsageData(newData);
            }
        } catch (e) {
            console.error("Failed to load usage data", e);
        }
    };

    const getUsage = (feature: string) => {
        return usageData.counts[feature] || 0;
    };

    const incrementUsage = async (feature: string) => {
        const today = getTodayString();
        // Check if date changed during the session
        if (usageData.date !== today) {
            const newData = { date: today, counts: { [feature]: 1 } };
            setUsageData(newData);
            await AsyncStorage.setItem("usage_stats", JSON.stringify(newData));
        } else {
            const currentCount = usageData.counts[feature] || 0;
            const newCounts = { ...usageData.counts, [feature]: currentCount + 1 };
            const newData = { ...usageData, counts: newCounts };
            setUsageData(newData);
            await AsyncStorage.setItem("usage_stats", JSON.stringify(newData));
        }
    };

    const checkLimit = (feature: string, limit: number) => {
        const count = getUsage(feature);
        return count >= limit;
    };

    return (
        <UsageContext.Provider value={{ getUsage, incrementUsage, checkLimit }}>
            {children}
        </UsageContext.Provider>
    );
};

export const useUsage = () => {
    const context = useContext(UsageContext);
    if (!context) {
        throw new Error("useUsage must be used within a UsageProvider");
    }
    return context;
};
