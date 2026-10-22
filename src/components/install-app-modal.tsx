"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Smartphone,
  Monitor,
  Laptop,
  CheckCircle2,
  WifiOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isInstallable, setIsInstallable] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState<"desktop" | "android">("desktop");

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        toast.success("PestPilot installed successfully!");
        setDeferredPrompt(null);
        setIsInstallable(false);
        onClose();
      }
    } else {
      toast.info("Follow the instructions below to install on your Mac or PC.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Download PestPilot Offline App"
      description="Install standalone software for Mac, Windows PC, and Android Mobile (Capacitor)"
      className="max-w-lg"
    >
      <div className="space-y-4">
        {/* Platform Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/60 border border-border">
          <button
            type="button"
            onClick={() => setSelectedTab("desktop")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              selectedTab === "desktop"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Monitor className="w-4 h-4 text-emerald-500" />
            <span>Mac &amp; Windows PC</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab("android")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              selectedTab === "android"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="w-4 h-4 text-amber-500" />
            <span>Android APK (Capacitor)</span>
          </button>
        </div>

        {/* Tab 1: Desktop Software (Mac & Windows) */}
        {selectedTab === "desktop" && (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-primary" /> Standalone Desktop App
                </span>
                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                  Dexie.js Offline Active
                </Badge>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Runs as an independent desktop window with dock/taskbar icons, offline database sync, and zero browser tab clutter.
              </p>
            </div>

            {isInstallable && (
              <Button onClick={handleInstallPwa} className="w-full font-bold">
                <Download className="w-4 h-4 mr-2" /> 1-Click Install Desktop App
              </Button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl border border-border bg-card space-y-1.5">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <span>🍎 Apple macOS (Mac)</span>
                </div>
                <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal pl-4">
                  <li>In Safari: click <strong>File &rarr; Add to Dock</strong>.</li>
                  <li>In Chrome: click <strong>Install PestPilot</strong> icon in the address bar.</li>
                  <li>Opens directly from your macOS Applications &amp; Dock.</li>
                </ol>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card space-y-1.5">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <span>🪟 Windows 10 / 11 (PC)</span>
                </div>
                <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal pl-4">
                  <li>In Edge/Chrome: click <strong>Install icon</strong> in address bar.</li>
                  <li>Adds shortcut to your Windows Desktop and Start Menu.</li>
                  <li>Works completely offline without internet.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Android APK (Capacitor) */}
        {selectedTab === "android" && (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-amber-600" /> Native Android APK (Capacitor)
                </span>
                <Badge variant="outline" className="text-[10px] text-amber-700 dark:text-amber-300 border-amber-500/30">
                  Ready in Repository
                </Badge>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                PestPilot has pre-configured <code>capacitor.config.json</code>. You can generate a native <code>.apk</code> for technician phones with GPS, camera, and offline sync.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border bg-card space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Terminal className="w-4 h-4 text-primary" />
                <span>Commands to Build APK in 3 Minutes:</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black text-emerald-400 font-mono text-[11px] space-y-1 select-all overflow-x-auto">
                <div>pnpm add @capacitor/core @capacitor/cli @capacitor/android</div>
                <div>npx cap add android</div>
                <div>npx cap open android</div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                In Android Studio, click <strong>Build &gt; Build APK(s)</strong> to export the release <code>.apk</code> file for your field team.
              </p>
            </div>
          </div>
        )}

        {/* Features Checklist */}
        <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Offline IndexedDB Cache
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Auto-Syncs on Reconnect
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 100% Free / No Extra Cost
          </span>
        </div>
      </div>
    </Modal>
  );
}

