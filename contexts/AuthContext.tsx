import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Session, User } from "@supabase/supabase-js";
import createContextHook from "@nkzw/create-context-hook";
import { supabase } from "@/lib/supabase";

// For development/demo mode when Supabase is not configured
const DEMO_USER_ID = "demo-user-00000000-0000-0000-0000-000000000000";

export const [AuthProvider, useAuth] = createContextHook(() => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDemoMode, setIsDemoMode] = useState(false);

    useEffect(() => {
        // Check if Supabase is properly configured
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl.includes("your-project")) {
            console.log("[Auth] Running in demo mode - Supabase not configured");
            setIsDemoMode(true);
            setIsLoading(false);
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = useCallback(
        async (email: string, password: string, name?: string) => {
            if (isDemoMode) {
                console.log("[Auth] Demo mode - sign up simulated");
                return { error: null };
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name: name || email.split("@")[0] },
                },
            });

            if (error) {
                console.error("[Auth] Sign up error:", error.message);
            }

            return { data, error };
        },
        [isDemoMode]
    );

    const signIn = useCallback(
        async (email: string, password: string) => {
            if (isDemoMode) {
                console.log("[Auth] Demo mode - sign in simulated");
                return { error: null };
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error("[Auth] Sign in error:", error.message);
            }

            return { data, error };
        },
        [isDemoMode]
    );

    const signOut = useCallback(async () => {
        if (isDemoMode) {
            console.log("[Auth] Demo mode - sign out simulated");
            return { error: null };
        }

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("[Auth] Sign out error:", error.message);
        }

        return { error };
    }, [isDemoMode]);

    // Get the current user ID (for database queries)
    const getUserId = useCallback((): string => {
        if (isDemoMode) {
            return DEMO_USER_ID;
        }
        return user?.id ?? DEMO_USER_ID;
    }, [isDemoMode, user]);

    const isAuthenticated = useMemo(() => {
        return isDemoMode || !!user;
    }, [isDemoMode, user]);

    return useMemo(
        () => ({
            session,
            user,
            isLoading,
            isDemoMode,
            isAuthenticated,
            signUp,
            signIn,
            signOut,
            getUserId,
        }),
        [
            session,
            user,
            isLoading,
            isDemoMode,
            isAuthenticated,
            signUp,
            signIn,
            signOut,
            getUserId,
        ]
    );
});
