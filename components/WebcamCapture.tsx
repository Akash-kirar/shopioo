import React, { useRef, useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface WebcamCaptureProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [facingMode]);

    const fallbackInputRef = useRef<HTMLInputElement>(null);

    const startCamera = async () => {
        try {
            stopCamera();
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera API is not supported in this browser or requires HTTPS.");
            }
            const constraints = {
                video: { 
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };
            
            let mediaStream;
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (initialErr: any) {
                // Fallback to any camera if specific facing mode or resolution fails
                if (initialErr.name === 'OverconstrainedError' || initialErr.name === 'NotFoundError' || initialErr.message?.includes('constraint')) {
                    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                } else {
                    throw initialErr;
                }
            }
            
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError('');
        } catch (err: any) {
            console.error("Camera access denied:", err);
            let errorMessage = 'Unable to access camera. Please ensure you have granted camera permissions.';
            
            if (err.name === 'NotAllowedError' || err.message === 'Permission dismissed' || err.message === 'Permission denied') {
                errorMessage = 'Camera access was denied or dismissed. Please allow camera access in your browser settings, or use the native camera fallback.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage = 'No camera device found. Please connect a camera or use the native camera fallback.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMessage = 'Camera is already in use by another application. Please close it and try again.';
            }
            
            setError(errorMessage);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleFallbackCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onCapture(e.target.files[0]);
            onClose();
        }
    };

    const handleCapture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                        onCapture(file);
                        stopCamera();
                    }
                }, 'image/jpeg', 0.9);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-200">
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                {error ? (
                    <div className="text-white text-center p-6 max-w-sm">
                        <p className="mb-6 font-medium">{error}</p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={startCamera} 
                                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                Retry Camera
                            </button>
                            <button 
                                onClick={() => fallbackInputRef.current?.click()} 
                                className="bg-[#a82283] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#8a1c6b] transition-colors"
                            >
                                Use Native Camera
                            </button>
                            <button 
                                onClick={onClose} 
                                className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            ref={fallbackInputRef}
                            onChange={handleFallbackCapture}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted
                        className="w-full h-full object-cover" 
                    />
                )}
                
                <button 
                    onClick={() => { stopCamera(); onClose(); }} 
                    className="absolute top-6 right-6 bg-black/40 text-white p-3 rounded-full backdrop-blur-md z-20 hover:bg-black/60 transition-colors"
                >
                    <X size={24} />
                </button>
                
                {!error && (
                    <button 
                        onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} 
                        className="absolute top-6 left-6 bg-black/40 text-white p-3 rounded-full backdrop-blur-md z-20 hover:bg-black/60 transition-colors"
                    >
                        <RefreshCw size={24} />
                    </button>
                )}
            </div>
            
            {!error && (
                <div className="h-36 bg-black flex items-center justify-center pb-8 pt-4">
                    <button 
                        onClick={handleCapture}
                        className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10"
                        aria-label="Capture Photo"
                    >
                        <div className="w-16 h-16 bg-white border-[3px] border-black rounded-full"></div>
                    </button>
                </div>
            )}
        </div>
    );
};