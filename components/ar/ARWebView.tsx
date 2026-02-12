import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export type HandGesture = 'open_hand' | 'closed_fist' | 'pinch' | 'thumbs_up' | 'none';

interface ARWebViewProps {
    onGestureDetected: (gesture: HandGesture) => void;
}

/**
 * A hidden WebView that acts as the "Vision Brain".
 * It loads a local HTML string capable of running MediaPipe Tasks Vision.
 * 
 * Note: In a real Expo Go setup with heavy constraints, 
 * this simulates the detection logic or runs a lightweight JS model.
 * Full MediaPipe WASM might be heavy for the bridge throughput, 
 * but this architecture validates the "Web-based ML in Native" approach.
 */
export function ARWebView({ onGestureDetected }: ARWebViewProps) {
    const webviewRef = useRef<WebView>(null);

    const htmlContent = `
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js" crossorigin="anonymous"></script>
        <style>body { background: transparent; }</style>
      </head>
      <body>
        <div id="status">Initializing Vision...</div>
        <script>
          // Mocking the detection loop for V1 stability in Expo Go
          // In production, this would accept frame data via window.ReactNativeWebView.postMessage
          // and run the GestureRecognizer.
          
          let lastGesture = 'none';
          
          function sendGesture(gesture) {
            if (gesture !== lastGesture) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'gesture', payload: gesture }));
              lastGesture = gesture;
            }
          }

          // Simulate gesture detection events for prototype
          // Replaces complex Camera frame -> Base64 -> Bridge loop which lags in Dev
          setTimeout(() => sendGesture('open_hand'), 5000); // Test "Pause"
          setTimeout(() => sendGesture('none'), 8000);
          
          // Listen for triggers from Native
          document.addEventListener('message', (event) => {
             const data = JSON.parse(event.data);
             if (data.command === 'ANALYZE_FRAME') {
                // Here we would run the actual recognition on data.payload (base64)
                // For V1, we return a mock success
             }
          });
        </script>
      </body>
    </html>
  `;

    const onMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'gesture') {
                onGestureDetected(data.payload);
            }
        } catch (e) {
            console.error("ARWebView Message Error:", e);
        }
    };

    return (
        <View style={styles.hiddenContainer}>
            <WebView
                ref={webviewRef}
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                onMessage={onMessage}
                javaScriptEnabled={true}
                style={{ width: 0, height: 0, opacity: 0 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    hiddenContainer: {
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
    },
});
