"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Button, Image, Spinner } from "@heroui/react";
import { useUploadThing } from "@/lib/uploadclient";
import { toast } from "sonner";

interface ProductImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ProductImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
}: ProductImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { startUpload } = useUploadThing("productImageUploader");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const totalImages = images.length + newFiles.length;

    if (totalImages > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    setIsUploading(true);
    try {
      const uploadedFiles = await startUpload(newFiles);
      if (uploadedFiles) {
        const newImageUrls = uploadedFiles.map((file) => file.url);
        onImagesChange([...images, ...newImageUrls]);
        toast.success(`${uploadedFiles.length} image(s) uploaded successfully`);
      }
    } catch (error) {
      // Upload error
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const newImages = [...images];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= images.length) return;

    [newImages[index], newImages[newIndex]] = [
      newImages[newIndex],
      newImages[index],
    ];
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-default-200 rounded-lg p-8 text-center hover:border-default-400 transition-colors">
        <input
          type="file"
          id="product-images"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || images.length >= maxImages}
        />
        <label
          htmlFor="product-images"
          className={`block cursor-pointer ${
            isUploading || images.length >= maxImages
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Spinner size="lg" className="mb-3" />
              <p className="text-sm text-default-600">Uploading images...</p>
            </div>
          ) : (
            <>
              <Icon
                icon="solar:gallery-add-linear"
                className="w-12 h-12 mx-auto text-default-400 mb-3"
              />
              <p className="text-sm text-default-600 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-default-400">
                PNG, JPG, GIF up to 8MB each ({images.length}/{maxImages}{" "}
                images)
              </p>
            </>
          )}
        </label>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <Image
                src={image}
                alt={`Product image ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                  Main
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  color="danger"
                  onPress={() => removeImage(index)}
                  title="Remove image"
                >
                  <Icon icon="solar:trash-bin-trash-linear" width={16} />
                </Button>
                {index > 0 && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() => moveImage(index, "up")}
                    title="Move left"
                  >
                    <Icon icon="solar:arrow-left-linear" width={16} />
                  </Button>
                )}
                {index < images.length - 1 && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() => moveImage(index, "down")}
                    title="Move right"
                  >
                    <Icon icon="solar:arrow-right-linear" width={16} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
