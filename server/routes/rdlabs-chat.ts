import { Router, Request, Response } from "express";

const router = Router();

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  track?: "fine-dining" | "manufacturing";
  labMode?: "culinary" | "pastry";
}

interface ChatResponse {
  success: boolean;
  message: string;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

const SYSTEM_PROMPT = `You are ECHO Ai, an advanced culinary research assistant with deep expertise in R&D. You're part of the chef's research team, helping with:

- Experiment design and methodology
- Ingredient chemistry and interactions
- Technique optimization and innovation
- Production scaling and manufacturing
- Cost analysis and ingredient sourcing
- Food safety and allergen management
- Flavor profiling and sensory science

Your role is to have free-form dialogue with the chef about their research projects. Be conversational, insightful, and practical. Ask clarifying questions when needed. Provide actionable recommendations grounded in culinary science.

Be encouraging and collaborative - you're a partner in their R&D journey, not just a source of information.`;

async function callOpenAI(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("OPENAI_API_KEY not found. Environment variables:", {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasElevenLabs: !!process.env.ELEVENLABS_API_KEY,
    });
    throw new Error(
      "OpenAI API key not configured. Set OPENAI_API_KEY environment variable.",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.95,
      }),
      signal: controller.signal as any,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data: any = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error("No response from OpenAI");
    }

    return assistantMessage;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("OpenAI request timed out. Please try again.");
    }
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}

/**
 * POST /api/rdlabs/chat
 * Send a message to ECHO Ai for R&D dialogue
 */
router.post("/api/rdlabs/chat", async (req: Request, res: Response) => {
  try {
    const { messages, track, labMode } = req.body as ChatRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Messages array is required and must not be empty",
      });
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({
          success: false,
          message: "Each message must have 'role' and 'content' fields",
        });
      }
    }

    const response = await callOpenAI(messages);

    res.json({
      success: true,
      message: response,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    } as ChatResponse);
  } catch (error) {
    console.error("Chat endpoint error:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to process chat message",
    });
  }
});

/**
 * POST /api/rdlabs/chat/stream
 * Stream a message from ECHO Ai (useful for long responses)
 */
router.post("/api/rdlabs/chat/stream", async (req: Request, res: Response) => {
  try {
    const { messages } = req.body as ChatRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Messages array is required",
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "OpenAI not configured",
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 0.95,
            stream: true,
          }),
        },
      );

      if (!response.ok) {
        res.write(`data: ${JSON.stringify({ error: "API error" })}\n\n`);
        res.end();
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        res.write(`data: ${JSON.stringify({ error: "No response" })}\n\n`);
        res.end();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              res.write("data: [DONE]\n\n");
            } else {
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || "";
                if (content) {
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
              } catch (e) {
                // Ignore parsing errors for individual chunks
              }
            }
          }
        }
      }

      res.end();
    } catch (error) {
      console.error("Stream error:", error);
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error("Chat stream endpoint error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to stream chat",
    });
  }
});

/**
 * GET /api/rdlabs/chat/health
 * Health check for chat service
 */
router.get("/api/rdlabs/chat/health", (_req: Request, res: Response) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  res.json({
    success: true,
    service: "rdlabs-chat",
    openai_configured: hasApiKey,
  });
});

export const rdLabsChatRouter = router;
export default router;
