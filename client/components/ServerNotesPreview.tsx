import type { ColorScheme, LayoutPreset } from "@shared/server-notes";

export type ServerNotesPreviewProps = {
  layout: LayoutPreset;
  color: ColorScheme;
  pageFormat: "standard" | "index-card";
  variant?: "full" | "mini" | "icon";
};

const baseCardClass =
  "relative rounded-lg border shadow-sm overflow-hidden bg-white dark:bg-slate-900";

const swatch = (background: string) => ({ background });

const headingRule = (color: string) => ({ background: color });

export default function ServerNotesPreview({
  layout,
  color,
  pageFormat,
  variant = "full",
}: ServerNotesPreviewProps) {
  if (variant === "icon") {
    return (
      <div
        className="relative h-14 w-24 rounded-lg border bg-white dark:bg-slate-950"
        style={{ borderColor: color.primary }}
      >
        <div
          className="absolute inset-1 rounded-md"
          style={{
            border: `1px solid ${color.secondary}`,
            background: color.background,
          }}
        />
        <div
          className={`absolute ${layout.standardLayout.headerStyle === "centered" ? "left-1/2 -translate-x-1/2" : "left-2"} top-2 h-1 w-14 rounded-full`}
          style={headingRule(color.primary)}
        />
        <div className="absolute left-2 right-2 bottom-2 top-6 grid grid-cols-3 gap-1">
          {layout.standardLayout.includeImages && (
            <div
              className="rounded-sm border"
              style={{
                borderColor: color.secondary,
                background: color.background,
              }}
            />
          )}
          <div
            className={
              layout.standardLayout.includeImages ? "col-span-2" : "col-span-3"
            }
          >
            <div
              className="mb-1 h-1.5 w-3/4 rounded-full"
              style={headingRule(color.accent)}
            />
            <div className="space-y-1">
              <div
                className="h-1 w-full rounded-full"
                style={headingRule(color.secondary)}
              />
              <div
                className="h-1 w-5/6 rounded-full"
                style={headingRule(color.secondary)}
              />
              <div
                className="h-1 w-2/3 rounded-full"
                style={headingRule(color.secondary)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageFormat === "index-card") {
    const headerMinimal = layout.indexCardLayout.headerStyle === "minimal";
    const fontSize =
      layout.indexCardLayout.fontSize === "small"
        ? "text-[10px]"
        : "text-[12px]";
    return (
      <div
        className={
          variant === "mini" ? "scale-90 origin-top-left" : "space-y-3"
        }
      >
        {[0, 1].map((idx) => (
          <div
            key={idx}
            className={`${baseCardClass} mx-auto h-48 w-[320px] border-[1.5px]`}
            style={{
              borderColor: color.secondary,
              background: color.background,
            }}
          >
            {headerMinimal ? (
              <div className="px-3 pt-3">
                <div
                  className="text-[10px] uppercase tracking-wide"
                  style={{ color: color.secondary }}
                >
                  Signature Card
                </div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: color.primary }}
                >
                  Pan-Roasted Salmon
                </div>
                <div
                  className="mt-2 h-[2px] w-full"
                  style={headingRule(color.accent)}
                />
              </div>
            ) : (
              <div
                className="border-b px-3 py-2 text-center text-white"
                style={{ background: color.primary, borderColor: color.accent }}
              >
                <div className="text-[10px] uppercase opacity-80">
                  Signature Card
                </div>
                <div className="text-sm font-semibold">Pan-Roasted Salmon</div>
              </div>
            )}
            <div
              className={`p-3 leading-tight ${fontSize}`}
              style={{ color: color.text }}
            >
              {layout.indexCardLayout.includeImages && (
                <div className="float-right ml-3">
                  <div
                    className="h-16 w-20 rounded border"
                    style={{ borderColor: color.secondary, background: "#fff" }}
                  />
                </div>
              )}
              {layout.indexCardLayout.contentPriority !== "instructions" && (
                <div className="space-y-1">
                  <div
                    className="font-semibold"
                    style={{ color: color.primary }}
                  >
                    Ingredients
                  </div>
                  <ul className="ml-4 list-disc space-y-0.5">
                    <li>6 oz salmon</li>
                    <li>Lemon butter</li>
                    <li>Sea salt</li>
                  </ul>
                </div>
              )}
              {layout.indexCardLayout.contentPriority !== "ingredients" && (
                <div className="mt-2 space-y-1">
                  <div
                    className="font-semibold"
                    style={{ color: color.primary }}
                  >
                    Steps
                  </div>
                  <ol className="ml-4 list-decimal space-y-0.5">
                    <li>Season and sear</li>
                    <li>Finish with butter</li>
                    <li>Plate elegantly</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const containerClass = variant === "mini" ? "scale-90 origin-top-left" : "";

  return (
    <div className={containerClass}>
      <div
        className={`${baseCardClass} h-[340px] w-[520px]`}
        style={{ background: color.background, borderColor: color.primary }}
      >
        <div
          className="absolute inset-2 rounded-md"
          style={{ border: `1px solid ${color.secondary}` }}
        />
        <div className="absolute left-4 -top-2 z-10">
          <div
            className="rounded border px-2 py-0.5 text-[10px]"
            style={{
              background: color.background,
              borderColor: color.primary,
              color: color.primary,
            }}
          >
            {layout.name}
          </div>
        </div>
        <header
          className={`border-b px-6 py-4 ${layout.standardLayout.headerStyle === "centered" ? "text-center" : ""}`}
          style={{
            borderColor: color.primary,
            fontFamily: layout.standardLayout.fontFamily,
          }}
        >
          <div
            className="absolute right-6 top-4 h-10 w-10 rounded-sm border"
            style={{ borderColor: color.secondary, background: "#fff" }}
          />
          <div
            className="text-[11px] uppercase tracking-wider"
            style={{ color: color.secondary }}
          >
            The Garden Bistro
          </div>
          <div className="text-xl font-bold" style={{ color: color.primary }}>
            Roasted Chicken with Herbs
          </div>
        </header>
        <main
          className="grid h-full grid-cols-12 gap-4 p-6"
          style={{ fontFamily: layout.standardLayout.fontFamily }}
        >
          {layout.standardLayout.includeImages && (
            <div className="col-span-4 hidden md:block">
              <div
                className="h-24 w-full rounded border"
                style={{ borderColor: color.secondary, background: "#fff" }}
              />
            </div>
          )}
          <div
            className={
              layout.standardLayout.includeImages ? "col-span-8" : "col-span-12"
            }
          >
            <div
              className="rounded-md border bg-white/70 p-3 text-xs dark:bg-slate-900/40"
              style={{ borderColor: color.accent }}
            >
              <div
                className="text-[11px] font-semibold"
                style={{ color: color.primary }}
              >
                Selling Notes
              </div>
              <p className="mt-1 text-xs" style={{ color: color.secondary }}>
                Classic, comforting, and aromatic—perfectly golden and juicy.
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-[11px]">
              <div>
                <div className="font-semibold" style={{ color: color.primary }}>
                  Ingredients
                </div>
                <ul className="ml-4 list-disc space-y-0.5">
                  <li>Whole chicken</li>
                  <li>Fresh thyme</li>
                  <li>Garlic & lemon</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold" style={{ color: color.primary }}>
                  Preparation
                </div>
                <ol className="ml-4 list-decimal space-y-0.5">
                  <li>Season generously</li>
                  <li>Roast until crisp</li>
                  <li>Rest and carve</li>
                </ol>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-[10px]">
              <div
                className="rounded-md border bg-white/70 p-2 dark:bg-slate-900/40"
                style={{ borderColor: color.accent }}
              >
                <div className="font-semibold" style={{ color: color.primary }}>
                  Beverage Suggestions
                </div>
                <ul className="ml-4 list-disc space-y-0.5">
                  <li>Chardonnay</li>
                  <li>Pinot Noir</li>
                </ul>
              </div>
              <div
                className="rounded-md border bg-white/70 p-2 text-right dark:bg-slate-900/40"
                style={{ borderColor: color.accent, color: color.secondary }}
              >
                Dist Date: 06/01/2025
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
