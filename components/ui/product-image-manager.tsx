"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Star, X, Upload, ImageIcon } from "lucide-react";

export type ProductImage = {
  url: string;
  isCover: boolean;
  sortOrder: number;
};

type Props = {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  disabled?: boolean;
};

export function ProductImageManager({ images, onChange, disabled }: Props) {
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

  function handleUpload(result: any) {
    if (result.event !== "success") return;
    const url = result.info?.secure_url;
    if (!url) return;

    const newImage: ProductImage = {
      url,
      isCover: images.length === 0, // First image becomes cover
      sortOrder: images.length,
    };
    onChange([...images, newImage]);
  }

  function handleRemove(idx: number) {
    const removed = images[idx];
    const next = images.filter((_, i) => i !== idx);
    // If we removed the cover, make the first remaining image the cover
    if (removed.isCover && next.length > 0) {
      next[0].isCover = true;
    }
    onChange(next);
  }

  function handleSetCover(idx: number) {
    onChange(
      images.map((img, i) => ({ ...img, isCover: i === idx }))
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Product Images
      </label>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 group"
            >
              <img
                src={img.url}
                alt={`Product ${idx + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Cover badge */}
              {img.isCover && (
                <div className="absolute top-2 left-2 bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-current" />
                  Cover
                </div>
              )}

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.isCover && (
                  <button
                    type="button"
                    onClick={() => handleSetCover(idx)}
                    disabled={disabled}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-medium rounded-lg disabled:opacity-50"
                    title="Set as cover"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  disabled={disabled}
                  className="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg disabled:opacity-50"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <CldUploadWidget
        uploadPreset={preset}
        options={{
          sources: ["local", "url", "camera"],
          multiple: true,
          maxFiles: 10,
          clientAllowedFormats: ["jpg", "png", "webp"],
          maxFileSize: 5000000, // 5MB
        }}
        onSuccess={handleUpload}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open()}
            disabled={disabled}
            className="w-full p-6 border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50"
          >
            {images.length === 0 ? (
              <>
                <ImageIcon className="w-8 h-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">Upload product images</p>
                <p className="text-xs text-slate-500">JPG, PNG, or WebP · Max 5MB each</p>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-slate-500" />
                <p className="text-sm font-medium text-slate-700">Add more images</p>
              </>
            )}
          </button>
        )}
      </CldUploadWidget>

      {images.length > 0 && (
        <p className="text-xs text-slate-500 mt-2">
          {images.length} image{images.length !== 1 ? "s" : ""} • Hover an image to set as cover or remove
        </p>
      )}
    </div>
  );
}
