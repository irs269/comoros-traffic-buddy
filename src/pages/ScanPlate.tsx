import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import OfficerLayout from "@/components/OfficerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, RotateCcw, Search, AlertTriangle, CheckCircle, Loader2, ImagePlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type ScanStep = "idle" | "camera" | "processing" | "result";

interface ScanResult {
  plate: string | null;
  status: "fine_found" | "no_fine" | "not_found" | null;
  vehicle?: any;
  fines?: any[];
  totalAmount?: number;
}

export default function ScanPlate() {
  const [step, setStep] = useState<ScanStep>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const attachStreamToVideo = useCallback(async (stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;

    try {
      await video.play();
    } catch (error) {
      console.error("Video preview error:", error);
    }
  }, []);

  const openCamera = useCallback(async (mode: "environment" | "user") => {
    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setFacingMode(mode);
      setStep("camera");

      requestAnimationFrame(() => {
        void attachStreamToVideo(stream);
      });
    } catch (error) {
      console.error("Camera access error:", error);
      toast({
        title: "Erreur caméra",
        description: "Impossible d'afficher la caméra. Vérifiez les permissions puis réessayez.",
        variant: "destructive",
      });
    }
  }, [attachStreamToVideo, stopCamera, toast]);

  const startCamera = useCallback(() => {
    void openCamera(facingMode);
  }, [facingMode, openCamera]);

  const switchCamera = useCallback(() => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    void openCamera(nextMode);
  }, [facingMode, openCamera]);

  useEffect(() => {
    if (step === "camera" && streamRef.current) {
      void attachStreamToVideo(streamRef.current);
    }

    return () => stopCamera();
  }, [attachStreamToVideo, step, stopCamera]);

  const processImageDataUrl = useCallback(async (imageDataUrl: string) => {
    setStep("processing");
    try {
      const { data, error } = await supabase.functions.invoke("ocr-plate", {
        body: { image: imageDataUrl },
      });
      if (error) throw error;
      const plate = data?.plate?.trim().toUpperCase();
      if (!plate) {
        setResult({ plate: null, status: null });
        setStep("result");
        return;
      }
      const { data: vehicle } = await supabase
        .from("vehicles").select("*").eq("plate_number", plate).maybeSingle();
      if (!vehicle) {
        await supabase.from("scan_logs").insert({ plate_number: plate, result: "not_found", scanned_by: user?.id });
        setResult({ plate, status: "not_found" });
        setStep("result");
        return;
      }
      const { data: fines } = await supabase
        .from("fines").select("*").eq("vehicle_id", vehicle.id).eq("status", "unpaid");
      const unpaidFines = fines || [];
      const totalAmount = unpaidFines.reduce((sum, f) => sum + f.amount, 0);
      const status = unpaidFines.length > 0 ? "fine_found" : "no_fine";
      await supabase.from("scan_logs").insert({ plate_number: plate, result: status, fines_count: unpaidFines.length, total_amount: totalAmount, scanned_by: user?.id });
      setResult({ plate, status, vehicle, fines: unpaidFines, totalAmount });
      setStep("result");
    } catch (err) {
      console.error("OCR error:", err);
      toast({ title: "Erreur de reconnaissance", description: "Impossible de traiter l'image. Réessayez.", variant: "destructive" });
      setStep("idle");
    }
  }, [user, toast]);

  const captureAndProcess = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;

    // Wait until video has actual dimensions (stream fully ready)
    if (!video.videoWidth || !video.videoHeight) {
      toast({
        title: "Caméra pas prête",
        description: "Attendez que l'image apparaisse puis réessayez.",
        variant: "destructive",
      });
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    stopCamera();
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);

    // Safety check: ensure we got a real image
    if (!imageDataUrl || imageDataUrl === "data:," || imageDataUrl.length < 100) {
      toast({
        title: "Capture échouée",
        description: "L'image capturée est vide. Réessayez.",
        variant: "destructive",
      });
      setStep("idle");
      return;
    }

    processImageDataUrl(imageDataUrl);
  }, [stopCamera, processImageDataUrl, toast]);

  const handleGalleryImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      processImageDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }, [processImageDataUrl]);

  const reset = () => {
    setResult(null);
    setStep("idle");
  };

  return (
    <OfficerLayout>
      <div className="space-y-4 pt-2">
        <h1 className="text-2xl font-bold">Scanner Plaque</h1>

        <canvas ref={canvasRef} className="hidden" />

        <AnimatePresence mode="wait">
          {step === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Card className="border-2 border-dashed border-muted-foreground/30">
                <CardContent className="p-10 flex flex-col items-center gap-4 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Scanner une plaque</p>
                    <p className="text-sm text-muted-foreground">
                      Prenez une photo de la plaque d'immatriculation pour vérifier les amendes
                    </p>
                  </div>
                  <Button onClick={startCamera} size="lg" className="w-full">
                    <Camera className="w-5 h-5 mr-2" />
                    Ouvrir la caméra
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <ImagePlus className="w-5 h-5 mr-2" />
                    Importer une photo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleGalleryImport}
                  />
                  <Button
                    variant="outline"
                    onClick={() => navigate("/search")}
                    className="w-full"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Recherche manuelle
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "camera" && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Plate guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[80%] h-16 border-2 border-primary/70 rounded-lg bg-primary/5" />
                </div>
                {/* Top controls */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={switchCamera}
                    className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { stopCamera(); setStep("idle"); }}
                    className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Alignez la plaque dans le cadre puis capturez
              </p>
              <Button onClick={captureAndProcess} size="lg" className="w-full h-14 text-lg">
                📸 Capturer
              </Button>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card>
                <CardContent className="p-10 flex flex-col items-center gap-4 text-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <p className="font-semibold">Analyse en cours...</p>
                  <p className="text-sm text-muted-foreground">
                    Reconnaissance de la plaque d'immatriculation
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              {!result.plate && (
                <Card className="border-2 border-warning bg-warning/5">
                  <CardContent className="p-6 text-center space-y-3">
                    <Camera className="w-16 h-16 text-warning mx-auto" />
                    <p className="text-lg font-bold text-warning">PLAQUE NON DÉTECTÉE</p>
                    <p className="text-muted-foreground text-sm">
                      Impossible de lire la plaque. Essayez avec une meilleure prise de vue ou utilisez la recherche manuelle.
                    </p>
                  </CardContent>
                </Card>
              )}

              {result.status === "fine_found" && (
                <Card className="border-2 border-danger bg-danger/5">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-danger flex items-center justify-center animate-pulse-alert">
                        <AlertTriangle className="w-6 h-6 text-danger-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-danger">AMENDES IMPAYÉES</p>
                        <p className="text-sm text-muted-foreground">Véhicule en infraction</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plaque détectée</span>
                        <span className="font-mono font-bold">{result.plate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Propriétaire</span>
                        <span className="font-semibold">{result.vehicle?.owner_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amendes</span>
                        <span className="font-bold text-danger">{result.fines?.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Montant total</span>
                        <span className="font-bold text-danger text-lg">
                          {result.totalAmount?.toLocaleString()} KMF
                        </span>
                      </div>
                    </div>
                    {result.fines && result.fines.length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <p className="font-semibold text-sm">Détails des amendes :</p>
                        {result.fines.map((fine) => (
                          <div key={fine.id} className="flex justify-between text-sm bg-card rounded-lg p-2">
                            <span>{fine.violation_type}</span>
                            <span className="font-mono">{fine.amount.toLocaleString()} KMF</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {result.status === "no_fine" && (
                <Card className="border-2 border-success bg-success/5">
                  <CardContent className="p-6 text-center space-y-3">
                    <CheckCircle className="w-16 h-16 text-success mx-auto" />
                    <p className="text-lg font-bold text-success">AUCUNE AMENDE</p>
                    <p className="text-muted-foreground">
                      Plaque: <span className="font-mono font-bold">{result.plate}</span>
                    </p>
                    <p className="text-muted-foreground">Propriétaire: {result.vehicle?.owner_name}</p>
                  </CardContent>
                </Card>
              )}

              {result.status === "not_found" && (
                <Card className="border-2 border-warning bg-warning/5">
                  <CardContent className="p-6 text-center space-y-3">
                    <Search className="w-16 h-16 text-warning mx-auto" />
                    <p className="text-lg font-bold text-warning">VÉHICULE NON TROUVÉ</p>
                    <p className="text-muted-foreground">
                      La plaque <span className="font-mono font-bold">{result.plate}</span> n'est pas
                      enregistrée
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button onClick={reset} className="flex-1">
                  <Camera className="w-5 h-5 mr-2" />
                  Nouveau scan
                </Button>
                <Button variant="outline" onClick={() => navigate("/search")} className="flex-1">
                  <Search className="w-5 h-5 mr-2" />
                  Recherche manuelle
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </OfficerLayout>
  );
}
