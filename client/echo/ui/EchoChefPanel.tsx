import React, { useState } from "react";
import type { ChefBrainSuggestion } from "../brain/echoChefBrain";

interface EchoChefPanelProps {
  apiEndpoint?: string;
}

export const EchoChefPanel: React.FC<EchoChefPanelProps> = ({
  apiEndpoint = "/api/echo-chef",
}) => {
  const [prompt, setPrompt] = useState("");
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ChefBrainSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (tag: string) => {
    setDietaryTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPrompt: prompt,
          dietaryTags,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with ${res.status}`);
      }

      const data = (await res.json()) as ChefBrainSuggestion[];
      setSuggestions(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-4 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">EchoChef · R&D Brain</h2>
          <p className="text-xs text-white/60">
            Ask Echo for menu ideas, variations, and new concepts based on your
            recipe Codex.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">
            What are you trying to create?
          </label>
          <textarea
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
            rows={3}
            placeholder="e.g. Brunch buffet main, gluten-free, can hold well on a chafing dish..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div>
          <span className="block text-xs uppercase tracking-wide text-white/60 mb-1">
            Dietary filters
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              "gluten_free",
              "vegetarian",
              "vegan",
              "dairy_free",
              "nut_free",
            ].map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-1 rounded-full border ${
                  dietaryTags.includes(tag)
                    ? "bg-cyan-500/80 border-cyan-300 text-black"
                    : "bg-white/5 border-white/20 text-white/80"
                }`}
              >
                {tag.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="px-4 py-1.5 rounded-full text-xs font-medium bg-cyan-400 hover:bg-cyan-300 text-black disabled:bg-white/10 disabled:text-white/40 transition"
          >
            {isLoading ? "Thinking like a Chef..." : "Ask Echo"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-3 text-xs text-red-300 bg-red-900/30 border border-red-500/40 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-4 space-y-3">
          {suggestions.map((s, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wide text-white/50">
                  {s.type === "existing_recipe"
                    ? "Existing Recipe"
                    : s.type === "variation"
                    ? "Echo Variation"
                    : "New Concept"}
                </span>
              </div>
              <h3 className="text-sm font-semibold mb-1">{s.title}</h3>
              <p className="text-white/80 mb-1">{s.description}</p>

              {s.recommendedChanges && s.recommendedChanges.length > 0 && (
                <ul className="list-disc pl-4 text-white/70">
                  {s.recommendedChanges.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              )}

              {s.serviceNotes && (
                <p className="mt-1 text-[11px] text-white/60">
                  <span className="font-semibold">Service Notes: </span>
                  {s.serviceNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
