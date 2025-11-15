export interface SpeechOptions {
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  speakerBoost?: boolean;
}

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice
const DEFAULT_STABILITY = 0.5;
const DEFAULT_SIMILARITY_BOOST = 0.75;

class AudioCache {
  private cache = new Map<string, string>();
  private maxSize = 50;

  set(key: string, dataUrl: string) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, dataUrl);
  }

  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }
}

const audioCache = new AudioCache();

export async function textToSpeech(
  text: string,
  options: SpeechOptions = {},
): Promise<Blob> {
  // Validate input
  if (!text || typeof text !== "string") {
    const errorMsg = `Invalid text input: expected string, got ${typeof text}`;
    console.error("TTS validation error:", {
      textType: typeof text,
      textValue: text,
    });
    throw new Error(errorMsg);
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    throw new Error("Text cannot be empty");
  }

  const voiceId = options.voiceId || DEFAULT_VOICE_ID;
  const cacheKey = `${voiceId}:${trimmedText}`;

  // Check cache first
  const cachedDataUrl = audioCache.get(cacheKey);
  if (cachedDataUrl) {
    const binaryString = atob(cachedDataUrl.split(",")[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: "audio/mpeg" });
  }

  try {
    const requestBody = {
      text: trimmedText,
      voiceId,
      stability: options.stability ?? DEFAULT_STABILITY,
      similarityBoost: options.similarityBoost ?? DEFAULT_SIMILARITY_BOOST,
      speakerBoost: options.speakerBoost ?? true,
    };

    const response = await fetch(`/api/elevenlabs/text-to-speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `ElevenLabs API error: ${response.status} - ${errorText || response.statusText}`,
      );
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("audio")) {
      const text = await response.text();
      throw new Error(
        `Invalid response type: expected audio, got ${contentType}. Response: ${text}`,
      );
    }

    const blob = await response.blob();

    // Cache the result
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    await new Promise((resolve) => {
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        audioCache.set(cacheKey, dataUrl);
        resolve(null);
      };
    });

    return blob;
  } catch (error) {
    console.error("Text-to-speech error:", error);
    throw error;
  }
}

export function playAudio(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to play audio"));
      };

      audio.play().catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

export function stopAudio() {
  const audios = document.querySelectorAll("audio");
  audios.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
}

export function clearAudioCache() {
  audioCache.clear();
}

export async function speakText(
  text: string,
  options: SpeechOptions = {},
): Promise<void> {
  try {
    // Validate input early
    if (!text || typeof text !== "string") {
      const errorMsg = `Invalid text parameter: expected string, got ${typeof text}. Value: ${String(text)}`;
      console.error("speakText validation error:", {
        textType: typeof text,
        textValue: text,
        errorMsg,
      });
      throw new Error(errorMsg);
    }

    const blob = await textToSpeech(text, options);
    await playAudio(blob);
  } catch (error) {
    console.error("Error speaking text:", error);
    // Log detailed error info for debugging
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });

      // Provide helpful context
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        console.error(
          "⚠️ ElevenLabs API authentication failed. Check your API key.",
        );
      } else if (error.message.includes("not configured")) {
        console.error("⚠️ ElevenLabs API key not set in server environment.");
      } else if (
        error.message.includes("Invalid text") ||
        error.message.includes("cannot be empty")
      ) {
        console.error(
          "⚠️ Invalid text input provided to text-to-speech service.",
        );
      }
    }
    throw error;
  }
}

export async function checkServiceHealth(): Promise<{
  success: boolean;
  configured: boolean;
  message?: string;
}> {
  try {
    const response = await fetch("/api/elevenlabs/health");
    const data = await response.json();
    console.log("TTS Health check:", data);
    return {
      success: data.success,
      configured: data.configured,
      message: data.message,
    };
  } catch (error) {
    console.error("Health check failed:", error);
    return {
      success: false,
      configured: false,
      message: "Unable to check TTS service",
    };
  }
}
