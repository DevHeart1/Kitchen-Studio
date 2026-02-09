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
    const model = "models/gemini-2.0-flash-exp"; // Using a known public model for live preview

    const config = {
        responseModalities: [Modality.AUDIO],
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW, // Conserve bandwidth
        speechConfig: {
            voiceConfig: {
                prebuiltVoiceConfig: {
                    voiceName: "Aoede",
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
                        // Forward message from Gemini to Client
                        if (clientSocket.readyState === WebSocket.OPEN) {
                            // We filter down to critical parts to save potential overhead, or just forward all
                            // For audio, we specifically look for serverContent.modelTurn.parts[0].inlineData
                            clientSocket.send(JSON.stringify(msg));
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

            // Send initial context if needed (e.g. recipe info passed in query params?)
            // For now, we wait for client to send first "context" message

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
            } else if (data.type === "user_audio_chunk") {
                // Send audio chunk (base64) to Gemini
                // Gemini Live API expects mimeType + data
                await geminiSession.sendClientContent({
                    turns: [{ parts: [{ inlineData: { mimeType: "audio/pcm;rate=16000", data: data.content } }] }]
                });
                // Or using the simpler method if SDK supports streaming directly?
                // The SDK usually handles this via `sendClientContent`
            } else if (data.type === "text_input") {
                await geminiSession.sendClientContent({
                    turns: [{ role: "user", parts: [{ text: data.content }] }]
                });
            }

        } catch (e) {
            console.error("Error processing client message:", e);
        }
    };

    clientSocket.onclose = () => {
        console.log("Client disconnected");
        if (geminiSession) {
            geminiSession.close();
        }
    };

    return response;
});
