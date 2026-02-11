import { useEffect, useState, useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { Session, User } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { supabase } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

export const [AuthProvider, useAuth] = createContextHook(() => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConfigured, setIsConfigured] = useState(true);
    const [hasEnteredApp, setHasEnteredApp] = useState<boolean | null>(null);

    useEffect(() => {
        const loadHasEnteredApp = async () => {
            try {
                const stored = await AsyncStorage.getItem('has_entered_app');
                setHasEnteredApp(stored === 'true');
            } catch {
                setHasEnteredApp(false);
            }
        };
        loadHasEnteredApp();

        // Check if Supabase is properly configured
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl.includes("your-project")) {
            console.log("[Auth] Supabase not configured");
            setIsConfigured(false);
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

    const markAsEntered = useCallback(async () => {
        try {
            await AsyncStorage.setItem('has_entered_app', 'true');
            setHasEnteredApp(true);
            console.log("[Auth] User has entered the app");
        } catch (e) {
            console.error("[Auth] Error marking as entered:", e);
        }
    }, []);

    const signUp = useCallback(
        async (email: string, password: string, name?: string, cookingInterests?: string[]) => {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name || email.split("@")[0],
                        cooking_interests: cookingInterests || [],
                    },
                },
            });

            if (error) {
                console.error("[Auth] Sign up error:", error.message);
                return { data, error };
            }

            const needsEmailConfirmation = data?.user && !data?.session;

            if (needsEmailConfirmation) {
                console.log("[Auth] Email confirmation required, marking as entered for onboarding");
                await markAsEntered();
            }

            return {
                data,
                error,
                needsEmailConfirmation
            };
        },
        [markAsEntered]
    );

    const signIn = useCallback(
        async (email: string, password: string) => {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error("[Auth] Sign in error:", error.message);

                const isEmailNotConfirmed = error.message.includes("Email not confirmed");

                if (isEmailNotConfirmed) {
                    console.log("[Auth] Email not confirmed - attempting OTP verification flow");
                    const { error: otpError } = await supabase.auth.signInWithOtp({
                        email,
                        options: {
                            shouldCreateUser: false,
                        },
                    });

                    if (!otpError) {
                        return {
                            data,
                            error: { ...error, message: "We sent a magic link to your email. Please check your inbox to sign in." },
                            needsEmailConfirmation: true,
                        };
                    }

                    return {
                        data,
                        error: { ...error, message: "Your email hasn't been confirmed yet. Please check your inbox for a confirmation or magic link email." },
                        needsEmailConfirmation: true
                    };
                }

                let userFriendlyMessage = error.message;
                if (error.message === "Invalid login credentials") {
                    userFriendlyMessage = "Invalid email or password. Please check your credentials or create an account if you haven't signed up yet.";
                }

                return {
                    data,
                    error: { ...error, message: userFriendlyMessage },
                    needsEmailConfirmation: false
                };
            }

            return { data, error, needsEmailConfirmation: false };
        },
        [markAsEntered]
    );

    const resendConfirmationEmail = useCallback(
        async (email: string) => {
            const { error } = await supabase.auth.resend({
                type: "signup",
                email,
            });

            if (error) {
                console.error("[Auth] Resend confirmation error:", error.message);
            }

            return { error };
        },
        []
    );

    const resetPassword = useCallback(
        async (email: string) => {
            const { error } = await supabase.auth.resetPasswordForEmail(email);

            if (error) {
                console.error("[Auth] Reset password error:", error.message);
            }

            return { error };
        },
        []
    );

    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("[Auth] Sign out error:", error.message);
        }

        return { error };
    }, []);

    const signInWithGoogle = useCallback(async () => {
        try {
            const redirectUrl = Linking.createURL("auth/callback");

            console.log("[Auth] Google OAuth redirect URL:", redirectUrl);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: Platform.OS !== "web",
                },
            });

            if (error) {
                console.error("[Auth] Google sign in error:", error.message);
                return { error };
            }

            if (Platform.OS !== "web" && data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUrl
                );

                if (result.type === "success" && result.url) {
                    const params = new URL(result.url).searchParams;
                    const accessToken = params.get("access_token");
                    const refreshToken = params.get("refresh_token");

                    if (accessToken && refreshToken) {
                        await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });
                    }
                }
            }

            return { data, error: null };
        } catch (error: any) {
            console.error("[Auth] Google sign in exception:", error);
            return { error: { message: error.message || "Google sign in failed" } };
        }
    }, [markAsEntered]);

    const signInWithApple = useCallback(async () => {
        try {
            const redirectUrl = Linking.createURL("auth/callback");

            console.log("[Auth] Apple OAuth redirect URL:", redirectUrl);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "apple",
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: Platform.OS !== "web",
                },
            });

            if (error) {
                console.error("[Auth] Apple sign in error:", error.message);
                return { error };
            }

            if (Platform.OS !== "web" && data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUrl
                );

                if (result.type === "success" && result.url) {
                    const params = new URL(result.url).searchParams;
                    const accessToken = params.get("access_token");
                    const refreshToken = params.get("refresh_token");

                    if (accessToken && refreshToken) {
                        await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });
                    }
                }
            }

            return { data, error: null };
        } catch (error: any) {
            console.error("[Auth] Apple sign in exception:", error);
            return { error: { message: error.message || "Apple sign in failed" } };
        }
    }, [markAsEntered]);

    // Get the current user ID (for database queries)
    const getUserId = useCallback((): string | null => {
        return user?.id || null;
    }, [user]);

    const isAuthenticated = useMemo(() => {
        return !!user;
    }, [user]);

    return useMemo(
        () => ({
            session,
            user,
            isLoading: isLoading || hasEnteredApp === null,
            isConfigured,
            isAuthenticated,
            signUp,
            signIn,
            signOut,
            signInWithGoogle,
            signInWithApple,
            resendConfirmationEmail,
            resetPassword,
            getUserId,
            markAsEntered,
        }),
        [
            session,
            user,
            isLoading,
            hasEnteredApp,
            isConfigured,
            isAuthenticated,
            signUp,
            signIn,
            signOut,
            signInWithGoogle,
            signInWithApple,
            resendConfirmationEmail,
            resetPassword,
            getUserId,
            markAsEntered,
        ]
    );
});
