export interface WavConversionOptions {
    numChannels: number;
    sampleRate: number;
    bitsPerSample: number;
}

/**
 * Converts a base64 string of Raw PCM audio to a WAV file data URI.
 * @param pcmBase64 Base64 encoded PCM audio data
 * @param sampleRate Default 24000 for Gemini Flash Exp (or 16000)
 */
export function pcmToWav(pcmBase64: string, sampleRate = 24000): string {
    // 1. Decode base64 to Uint8Array
    const binaryString = atob(pcmBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    // 2. Create WAV Header
    const header = createWavHeader(bytes.length, {
        numChannels: 1,
        sampleRate,
        bitsPerSample: 16
    });

    // 3. Concatenate Header + Data
    const wavBytes = new Uint8Array(header.length + bytes.length);
    wavBytes.set(header, 0);
    wavBytes.set(bytes, header.length);

    // 4. Convert back to base64
    return uint8ToBase64(wavBytes);
}

function createWavHeader(dataLength: number, options: WavConversionOptions): Uint8Array {
    const { numChannels, sampleRate, bitsPerSample } = options;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;

    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true); // little-endian
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function uint8ToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
