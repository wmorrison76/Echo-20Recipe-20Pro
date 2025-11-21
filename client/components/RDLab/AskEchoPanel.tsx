import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Send, Loader2, BookOpen, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  searchProcedures,
  getProceduresByCategory,
} from "@/lib/echo-procedures-service";
import { useMasterDictionary } from "@/hooks/use-master-dictionary";
import type { ProcedureSearchResult } from "@/lib/echo-procedures-service";

interface Message {
  role: "user" | "echo";
  content: string;
  procedures?: ProcedureSearchResult[];
  isDictionaryResult?: boolean;
}

export default function AskEchoPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "echo",
      content:
        "Hello! I'm Echo, your culinary knowledge assistant. Ask me about cooking techniques, meat fabrication, pastry methods, or any culinary procedure. What would you like to learn?",
    },
  ]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAsk = async () => {
    if (!query.trim()) return;

    const userMessage = query.trim();
    setQuery("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      // Search for relevant procedures
      const results = await searchProcedures(userMessage, 3);

      if (results.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "echo",
            content: `I couldn't find specific procedures matching "${userMessage}". This could be because:
1. The knowledge hasn't been imported yet from a textbook
2. The procedure is stored under different terminology
3. Try asking with similar terms (e.g., "butchering", "breaking down", "fabrication")

Would you like me to show you available categories instead?`,
            procedures: [],
          },
        ]);
      } else {
        // Build response from procedures
        let response = `I found ${results.length} relevant procedure(s) for "${userMessage}":\n\n`;

        results.forEach((result, index) => {
          response += `**${index + 1}. ${result.procedure.title}** (${result.procedure.category})`;
          if (result.procedure.time_estimate) {
            response += ` - ${result.procedure.time_estimate}`;
          }
          if (result.procedure.difficulty) {
            response += ` - ${result.procedure.difficulty} level`;
          }
          response += `\n\n`;

          // Add steps
          response += `Steps:\n`;
          result.procedure.steps.forEach((step) => {
            response += `${step.number}. ${step.instruction}\n`;
            if (step.tips) {
              response += `   💡 Tip: ${step.tips}\n`;
            }
          });

          // Add tools if available
          if (result.procedure.tools && result.procedure.tools.length > 0) {
            response += `\nTools needed: ${result.procedure.tools.join(", ")}\n`;
          }

          // Add materials if available
          if (
            result.procedure.materials &&
            result.procedure.materials.length > 0
          ) {
            response += `Materials: ${result.procedure.materials.join(", ")}\n`;
          }

          response += "\n---\n\n";
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "echo",
            content: response,
            procedures: results,
          },
        ]);
      }
    } catch (error) {
      console.error("Error searching procedures:", error);
      toast.error("Failed to search culinary knowledge");
      setMessages((prev) => [
        ...prev,
        {
          role: "echo",
          content:
            "I encountered an error while searching for procedures. Please try again with a different question.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <div>
            <CardTitle>Ask Echo</CardTitle>
            <CardDescription>
              Culinary knowledge assistant powered by your textbooks
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col p-4">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-lg px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap break-words">
                  {msg.content.split("\n").map((line, i) => {
                    // Bold text between **
                    if (line.includes("**")) {
                      return (
                        <div key={i}>
                          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => (
                            <span
                              key={j}
                              className={
                                part.startsWith("**") ? "font-bold" : ""
                              }
                            >
                              {part.replace(/\*\*/g, "")}
                            </span>
                          ))}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={i}
                        className={line.startsWith("💡") ? "mt-1 italic" : ""}
                      >
                        {line}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-4 py-2 border border-slate-200 dark:border-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t pt-4 space-y-2">
          {messages.filter((m) => m.role === "echo").length === 1 && (
            <div className="text-xs text-slate-600 dark:text-slate-400 flex gap-1">
              <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>
                Import textbooks first in the RECIPES tab to populate knowledge
              </span>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="How do I break down a lamb rack? Ask me anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="text-sm"
            />
            <Button
              onClick={handleAsk}
              disabled={loading || !query.trim()}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
