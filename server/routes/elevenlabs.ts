import { Router, Request, Response } from "express";

const router = Router();

interface TextToSpeechRequest {
  text: string;
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  speakerBoost?: boolean;
}

/**
 * POST /api/elevenlabs/text-to-speech
 * Convert text to speech using ElevenLabs
 */
router.post(
  "/api/elevenlabs/text-to-speech",
  async (req: Request, res: Response) => {
    try {
      const {
        text,
        voiceId = "21m00Tcm4TlvDq8ikWAM",
        stability = 0.5,
        similarityBoost = 0.75,
        speakerBoost = true,
      } = req.body as TextToSpeechRequest;

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Text is required and must be a non-empty string",
        });
      }

      if (!voiceId || typeof voiceId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Voice ID is required",
        });
      }

      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: "ElevenLabs API key not configured",
        });
      }

      // Truncate text to 5000 characters to avoid API limits
      const truncatedText = text.slice(0, 5000);

      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=0`,
          {
            method: "POST",
            headers: {
              "xi-api-key": apiKey,
              "Content-Type": "application/json",
              Accept: "audio/mpeg",
            },
            body: JSON.stringify({
              text: truncatedText,
              model_id: "eleven_monolingual_v1",
              voice_settings: {
                stability,
                similarity_boost: similarityBoost,
                use_speaker_boost: speakerBoost,
              },
            }),
          },
        );

        if (!response.ok) {
          const error = await response.text();
          console.error("ElevenLabs API error:", error);
          return res.status(response.status).json({
            success: false,
            error: `ElevenLabs API error: ${response.status}`,
          });
        }

        const audioBuffer = await response.arrayBuffer();

        // Set appropriate headers for audio response
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
        res.setHeader("Content-Length", audioBuffer.byteLength);

        res.send(Buffer.from(audioBuffer));
      } catch (error) {
        console.error("ElevenLabs request error:", error);
        res.status(500).json({
          success: false,
          error: "Failed to generate speech",
        });
      }
    } catch (error) {
      console.error("TTS endpoint error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * GET /api/elevenlabs/voices
 * Get available voices
 */
router.get("/api/elevenlabs/voices", async (_req: Request, res: Response) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "ElevenLabs API key not configured",
      });
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: "Failed to fetch voices",
      });
    }

    const data = await response.json();
    res.json({
      success: true,
      voices: data.voices || [],
    });
  } catch (error) {
    console.error("Voices endpoint error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch voices",
    });
  }
});

/**
 * GET /api/elevenlabs/health
 * Health check for ElevenLabs service
 */
router.get("/api/elevenlabs/health", (_req: Request, res: Response) => {
  const hasApiKey = !!process.env.ELEVENLABS_API_KEY;
  res.json({
    success: true,
    service: "elevenlabs",
    configured: hasApiKey,
  });
});

export const elevenLabsRouter = router;
export default router;
