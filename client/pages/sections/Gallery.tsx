import { useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppDataContext";

export default function GallerySection() {
  const { images, addImages, clearImages, linkImagesToRecipesByFilename } = useAppData();
  const [status, setStatus] = useState<string | null>(null);

  const onFiles = async (files: File[]) => {
    setStatus("Processing images...");
    const added = await addImages(files);
    setStatus(`Added ${added} image(s).`);
    // attempt auto-link
    linkImagesToRecipesByFilename();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Dropzone accept="image/*" multiple onFiles={onFiles}>
          <div className="flex flex-col items-center justify-center gap-2 text-sm">
            <div className="text-foreground font-medium">Drag & drop images</div>
            <div className="text-muted-foreground">or click to select</div>
          </div>
        </Dropzone>

        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Images in gallery</div>
          <div className="mt-1 text-2xl font-semibold">{images.length}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => linkImagesToRecipesByFilename()}>
              Link to recipes by filename
            </Button>
            <Button variant="destructive" onClick={() => clearImages()}>Clear images</Button>
          </div>
        </div>
      </div>

      {status && <div className="rounded-md border p-3 text-sm">{status}</div>}

      {images.length > 0 ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {images.map((img) => (
            <div key={img.id} className="rounded-md border overflow-hidden">
              <img src={img.dataUrl} alt={img.name} className="h-32 w-full object-cover" />
              <div className="px-2 py-1 text-[11px] truncate" title={img.name}>{img.name}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          No images yet. Drop some to populate the gallery.
        </div>
      )}
    </div>
  );
}
