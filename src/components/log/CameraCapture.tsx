import { useRef, useEffect, useState, useCallback } from "react";
import { Camera, X, RefreshCw } from "lucide-react";
import { Button } from "../ui/Button";
import { useAppStore } from "../../store/useAppStore";
import { cn } from "../../lib/utils";

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onClose: () => void;
    label?: string;
}

export function CameraCapture({ onCapture, onClose, label }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const isDesktopView = useAppStore(state => state.isDesktopView);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(true);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
        }
        setStream(null);
    };

    const startCamera = useCallback(async () => {
        stopCamera();
        setIsStarting(true);
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: false
            });
            setStream(mediaStream);
            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError(err instanceof Error && err.name === "NotAllowedError"
                ? "Camera permission denied. Please enable it in your browser settings."
                : "Could not access camera. Please check your device.");
        } finally {
            setIsStarting(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            await startCamera();
            if (!isMounted) {
                stopCamera();
            }
        };

        init();

        return () => {
            isMounted = false;
            stopCamera();
        };
    }, [startCamera]);

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");

            if (context) {
                // Set canvas dimensions to match video
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Draw current frame to canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Convert canvas to blob then file
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                        onCapture(file);
                    }
                }, "image/jpeg", 0.8);
            }
        }
    };

    return (
        <div className={cn(
            "fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[110] flex flex-col items-center justify-center p-4 transition-all",
            !isDesktopView && "left-1/2 -translate-x-1/2 w-full max-w-[430px]"
        )}>
            <div className="w-full max-w-lg bg-black rounded-3xl overflow-hidden shadow-2xl relative">
                {/* Header */}
                <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium uppercase tracking-widest">
                        Live Scanner
                    </div>
                    <div className="w-10"></div> {/* Spacer */}
                </div>

                {/* Video Preview */}
                <div className="aspect-[3/4] sm:aspect-video bg-slate-800 flex items-center justify-center relative">
                    {isStarting && (
                        <div className="flex flex-col items-center gap-3 text-white/60">
                            <RefreshCw size={32} className="animate-spin" />
                            <span className="text-sm font-medium">Starting camera...</span>
                        </div>
                    )}

                    {error && (
                        <div className="p-8 text-center">
                            <p className="text-white font-medium mb-4">{error}</p>
                            <Button variant="outline" onClick={startCamera} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                                Try Again
                            </Button>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${stream ? 'block' : 'hidden'}`}
                    />

                    {/* Scan Overlay Overlay */}
                    <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none">
                        <div className="w-full h-full border-2 border-white/20 rounded-xl"></div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-8 pb-10 flex flex-col items-center gap-6 bg-zinc-900">
                    <p className="text-white/60 text-xs text-center max-w-[240px] font-medium leading-relaxed">
                        {label || "Position your meal in the center of the frame and tap the capture button."}
                    </p>

                    <button
                        onClick={capturePhoto}
                        disabled={!stream}
                        className="w-20 h-20 rounded-full border-4 border-white/30 p-1 active:scale-90 transition-transform disabled:opacity-50"
                    >
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                            <Camera size={32} className="text-black" />
                        </div>
                    </button>
                </div>

                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
}
