"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [heroImage, setHeroImage] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [siteLogo, setSiteLogo] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/settings");
      if (res.data?.success) {
        const fetchedSettings = res.data.data;
        setSettings(fetchedSettings);
        
        // Map to state
        fetchedSettings.forEach((s: any) => {
          if (s.key === "hero_image") setHeroImage(s.value);
          if (s.key === "hero_title") setHeroTitle(s.value);
          if (s.key === "hero_subtitle") setHeroSubtitle(s.value);
          if (s.key === "site_logo") setSiteLogo(s.value);
        });
      }
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = [
        { key: "hero_image", value: heroImage || "/hero-3d.jpg" },
        { key: "hero_title", value: heroTitle },
        { key: "hero_subtitle", value: heroSubtitle },
        { key: "site_logo", value: siteLogo || "/logo.jpg" }
      ];

      const res = await api.put("/admin/settings", { settings: payload });
      if (res.data?.success) {
        toast.success("Settings saved successfully!");
      }
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">Site Settings</h1>
      <p className="text-sm text-muted-foreground">Manage dynamic content and images for the main website.</p>

      <Card className="bg-card/70 border-border/60">
        <CardHeader>
          <CardTitle className="text-gold-400 flex items-center gap-2">
            <ImageIcon className="h-5 w-5" /> Homepage Hero Section
          </CardTitle>
          <CardDescription>Update the images and texts on the homepage hero section.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Hero Image URL</Label>
            <Input 
              value={heroImage} 
              onChange={(e) => setHeroImage(e.target.value)} 
              placeholder="/hero-3d.jpg or https://example.com/image.jpg"
              className="bg-secondary/40 border-border/60 font-mono text-sm"
            />
            <p className="text-[10px] text-muted-foreground">Enter a direct URL or local path for the 3D illustration.</p>
          </div>

          <div className="space-y-2">
            <Label>Hero Title (Optional override)</Label>
            <Input 
              value={heroTitle} 
              onChange={(e) => setHeroTitle(e.target.value)} 
              placeholder="Leave blank for default"
              className="bg-secondary/40 border-border/60 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Hero Subtitle (Optional override)</Label>
            <Input 
              value={heroSubtitle} 
              onChange={(e) => setHeroSubtitle(e.target.value)} 
              placeholder="Leave blank for default"
              className="bg-secondary/40 border-border/60 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Site Logo URL</Label>
            <Input 
              value={siteLogo} 
              onChange={(e) => setSiteLogo(e.target.value)} 
              placeholder="/logo.jpg or https://example.com/logo.png"
              className="bg-secondary/40 border-border/60 font-mono text-sm"
            />
            <p className="text-[10px] text-muted-foreground">URL for the website logo. Upload a transparent PNG for best results.</p>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold mt-4"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
