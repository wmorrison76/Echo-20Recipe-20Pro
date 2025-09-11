import React, { useEffect, useRef, useState } from "react";

export default function ImageEditorModal({ isOpen, image, onClose, onApply, isDarkMode }: { isOpen: boolean; image: string | null; onClose: () => void; onApply: (dataUrl: string) => void; isDarkMode?: boolean; }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  useEffect(() => {
    if (!isOpen || !image) return;
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => setImg(el);
    el.src = image;
  }, [isOpen, image]);

  useEffect(() => {
    const c = canvasRef.current; if (!c || !img) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const w = Math.min(880, img.naturalWidth || img.width);
    const h = Math.min(500, img.naturalHeight || img.height);
    c.width = w; c.height = h;
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(img, 0, 0, w, h);
  }, [img, brightness, contrast, saturation]);

  if (!isOpen) return null;

  const save = () => {
    const c = canvasRef.current; if (!c) return;
    onApply(c.toDataURL('image/png'));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className={`${isDarkMode ? 'bg-black/90 border border-cyan-400/50 text-cyan-300' : 'bg-white text-black'} rounded-xl p-4 md:p-6 w-[95vw] max-w-5xl max-h-[95vh] overflow-auto shadow-2xl`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Image Editor</h3>
          <button onClick={onClose} className="text-sm px-2 py-1 rounded border hover:bg-black/10">✕</button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <canvas ref={canvasRef} className="w-full max-w-full bg-[#0b1220] rounded" />
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Brightness ({brightness}%)</label>
              <input type="range" min={0} max={200} value={brightness} onChange={(e)=>setBrightness(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Contrast ({contrast}%)</label>
              <input type="range" min={0} max={200} value={contrast} onChange={(e)=>setContrast(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Saturation ({saturation}%)</label>
              <input type="range" min={0} max={200} value={saturation} onChange={(e)=>setSaturation(Number(e.target.value))} className="w-full" />
            </div>
            <div className="pt-2 flex gap-3">
              <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save & Close</button>
              <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
