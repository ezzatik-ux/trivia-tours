"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ImageIcon, Loader2 } from "lucide-react";
import {
  ProductImageManager,
  type ProductImage,
} from "@/components/ui/product-image-manager";
import { savePackageImages } from "./actions";

type Props = {
  packageId: string;
  initialImages: ProductImage[];
};

export function PackageImagesSection({ packageId, initialImages }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [images, setImages] = useState<ProductImage[]>(
    initialImages.map((img) => ({
      url: img.url,
      isCover: img.isCover,
      sortOrder: img.sortOrder ?? 0,
    }))
  );

  function handleImagesChange(next: ProductImage[]) {
    setImages(next);
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await savePackageImages(packageId, images);
      if (result.success) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error || "Failed to save images");
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-trivia-600" />
        <div>
          <h3 className="text-base font-semibold text-slate-900">Gallery</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Upload images via Cloudinary. First image is cover by default.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      <ProductImageManager
        images={images}
        onChange={handleImagesChange}
        disabled={isPending}
      />

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        {saved && !isPending && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <Check className="w-4 h-4" />
            Images saved
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save images
        </button>
      </div>
    </div>
  );
}
