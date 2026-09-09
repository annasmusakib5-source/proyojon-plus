"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/axios";
import {
  Camera,
  Home,
  ChevronRight,
  Loader2,
  ImageIcon,
} from "lucide-react";

interface GalleryImage {
  id: number;
  title: string;
  image_url: string;
  category: string | null;
  sort_order: number;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await api.get("/notices/gallery");
        setImages(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch gallery:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-5 w-5" />
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          <h1 className="text-lg font-bold bg-gradient-to-r from-gold-400 to-amber-500 bg-clip-text text-transparent">
            Photo Gallery
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 text-xs font-semibold tracking-wider uppercase">
            <Camera className="h-3.5 w-3.5" />
            Corporate Gallery
          </div>
          <h2 className="text-3xl font-bold text-foreground">Our Journey in Pictures</h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            Explore our corporate events, office locations, team activities, and award ceremonies.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <ImageIcon className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <h2 className="text-xl font-semibold text-muted-foreground">Gallery Coming Soon</h2>
            <p className="text-sm text-muted-foreground/70">
              Our corporate photo gallery will be available here shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((image) => (
              <button
                key={image.id}
                onClick={() => setSelectedImage(image)}
                className="group rounded-2xl overflow-hidden bg-card border border-border/40 hover:border-gold-500/30 transition-all hover:shadow-xl hover:shadow-gold-500/5"
              >
                <div className="relative aspect-[4/3] bg-secondary/60">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {image.category && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-slate-950/70 text-white text-[10px] font-medium backdrop-blur-sm">
                      {image.category}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-foreground truncate">{image.title}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Lightbox Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="max-w-4xl w-full rounded-2xl overflow-hidden bg-card border border-border/40 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.image_url}
                alt={selectedImage.title}
                className="w-full max-h-[70vh] object-contain bg-secondary/40"
              />
              <div className="p-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{selectedImage.title}</p>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="px-4 py-1.5 rounded-lg bg-secondary/60 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
