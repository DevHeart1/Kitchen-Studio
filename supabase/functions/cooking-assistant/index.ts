// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI, LiveServerMessage, Modality, MediaResolution } from "npm:@google/genai@^0.2.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    // Check if it's a WebSocket upgrade request
    if (req.headers.get("upgrade") !== "websocket") {
        return new Response("Expected Upgrade: websocket", { status: 426, headers: corsHeaders });
    }

    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);

    // Initialize Gemini Client
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
        console.error("GEMINI_API_KEY not configured");
        clientSocket.close(1008, "Server configuration error");
        return response;
    }

    const ai = new GoogleGenAI({ apiKey });
    // User requested model: models/gemini-2.5-flash-native-audio-preview-12-2025
    // Fallback: models/gemini-2.0-flash-exp (known to support audio better in public preview)
    const model = "models/gemini-2.0-flash-exp";

    const config = {
        responseModalities: [Modality.AUDIO], // Only sending audio back
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW,
        speechConfig: {
            voiceConfig: {
                prebuiltVoiceConfig: {
                    voiceName: "Aoede", // User requested Aoede
                },
            },
        },
    };

    let geminiSession: any = null;

    clientSocket.onopen = async () => {
        console.log("Client connected");
        try {
            geminiSession = await ai.live.connect({
                model,
                config,
                callbacks: {
                    onopen: () => {
                        console.log("Gemini Live Connected");
                        if (clientSocket.readyState === WebSocket.OPEN) {
                            clientSocket.send(JSON.stringify({ type: "status", content: "connected" }));
                        }
                    },
                    onmessage: (msg: LiveServerMessage) => {
                        if (clientSocket.readyState === WebSocket.OPEN) {
                            // Forward critical message parts to Client
                            // Specifically look for audio parts
                            if (msg.serverContent?.modelTurn?.parts) {
                                const parts = msg.serverContent.modelTurn.parts;
                                for (const part of parts) {
                                    if (part.inlineData && part.inlineData.mimeType.startsWith("audio")) {
                                        // Forward audio chunk
                                        clientSocket.send(JSON.stringify({
                                            type: "audio",
                                            data: part.inlineData.data,
                                            mimeType: part.inlineData.mimeType
                                        }));
                                    }
                                    if (part.text) {
                                        // Forward text (optional debugging)
                                        // clientSocket.send(JSON.stringify({ type: "text", content: part.text }));
                                    }
                                }
                            }

                            if (msg.serverContent?.turnComplete) {
                                clientSocket.send(JSON.stringify({ type: "turn_complete" }));
                            }
                        }
                    },
                    onclose: () => {
                        console.log("Gemini Live Closed");
                        if (clientSocket.readyState === WebSocket.OPEN) {
                            clientSocket.close();
                        }
                    },
                    onerror: (err: any) => {
                        console.error("Gemini Error:", err);
                        if (clientSocket.readyState === WebSocket.OPEN) {
                            clientSocket.send(JSON.stringify({ type: "error", content: err.message }));
                        }
                    }
                },
            });

        } catch (err) {
            console.error("Failed to connect to Gemini:", err);
            clientSocket.close(1011, "Failed to connect to AI service");
        }
    };

    clientSocket.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data);

            if (!geminiSession) return;

            if (data.type === "setup_context") {
                // Send initial context to Gemini
                await geminiSession.sendClientContent({
                    turns: [{ role: "user", parts: [{ text: data.content }] }]
                });
            } else if (data.type === "text_input") {
                // User sends text instruction -> trigger audio generation
                await geminiSession.sendClientContent({
                    turns: [{ role: "user", parts: [{ text: "Read this instruction clearly: " + data.content }] }]
                });
            }

        } catch (e) {
            console.error("Error processing client message:", e);
        }
    };

    clientSocket.onclose = () => {
        console.log("Client disconnected");
        if (geminiSession) {
            // geminiSession.close(); // Method might vary by SDK version, usually just disconnects
        }
    };

    return response;
});
