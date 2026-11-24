import React, { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  ImageUp,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';

interface XrplCameraQrScannerProps {
  onAddressScanned: (address: string) => void;
  onClose: () => void;
}

const CLASSIC_XRPL_REGEX = /\b(r[1-9A-HJ-NP-Za-km-z]{24,34})\b/;
const FAMILY_SEED_REGEX = /\b(s[1-9A-HJ-NP-Za-km-z]{24,34})\b/;

function extractPublicXrplAddress(rawQrText: string): {
  address: string | null;
  safetyWarning: string | null;
} {
  const cleaned = rawQrText.trim();
  if (!cleaned) return { address: null, safetyWarning: null };

  // Safety guard: never allow students to scan a secret seed or mnemonic phrase
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (
    (FAMILY_SEED_REGEX.test(cleaned) && !CLASSIC_XRPL_REGEX.test(cleaned)) ||
    words.length === 12 ||
    words.length === 24
  ) {
    return {
      address: null,
      safetyWarning:
        'Safety Stop: That looks like a private secret key or recovery phrase! Never scan a secret key. Tap "Receive" in Xaman to show only your public r... address QR.',
    };
  }

  const match = CLASSIC_XRPL_REGEX.exec(cleaned);
  if (match && match[1]) {
    return { address: match[1], safetyWarning: null };
  }

  return {
    address: null,
    safetyWarning:
      'QR code detected, but it does not contain an XRPL public r... address. Open Xaman on Android → tap "Request / Receive" → hold that QR up to this camera.',
  };
}

export const XrplCameraQrScanner: React.FC<XrplCameraQrScannerProps> = ({
  onAddressScanned,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Default to rear camera on tablets, with 1-tap switch to front camera
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraState, setCameraState] = useState<'starting' | 'active' | 'error'>('starting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);

  const stopCameraTracks = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopCameraTracks();
    onClose();
  }, [stopCameraTracks, onClose]);

  useEffect(() => {
    let cancelled = false;
    setCameraState('starting');
    setErrorMessage(null);

    const startScanner = async () => {
      stopCameraTracks();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!cancelled) {
          setCameraState('error');
          setErrorMessage(
            'Live camera access is not available in this browser. Use "Upload QR Photo" below to scan a screenshot of your Xaman Receive QR.'
          );
        }
        return;
      }

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          });
        } catch {
          // Fallback to any available camera (e.g. front-only laptop or tablet)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        await video.play();
        if (cancelled) return;

        setCameraState('active');

        let lastFrameCheck = 0;
        const tick = (now: number) => {
          if (cancelled) return;
          if (now - lastFrameCheck >= 160) {
            lastFrameCheck = now;
            const v = videoRef.current;
            const c = canvasRef.current;
            if (v && c && v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth > 0) {
              c.width = v.videoWidth;
              c.height = v.videoHeight;
              const ctx = c.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(v, 0, 0, c.width, c.height);
                const imgData = ctx.getImageData(0, 0, c.width, c.height);
                const decoded = jsQR(imgData.data, imgData.width, imgData.height, {
                  inversionAttempts: 'dontInvert',
                });
                if (decoded?.data) {
                  const parsed = extractPublicXrplAddress(decoded.data);
                  if (parsed.address) {
                    stopCameraTracks();
                    onAddressScanned(parsed.address);
                    return;
                  }
                  if (parsed.safetyWarning) {
                    setSafetyMessage(parsed.safetyWarning);
                  }
                }
              }
            }
          }
          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      } catch (err: unknown) {
        if (!cancelled) {
          setCameraState('error');
          const msg = err instanceof Error ? err.message : '';
          setErrorMessage(
            msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('permission')
              ? 'Camera permission was blocked by the browser. Allow camera access or tap "Upload QR Photo" below.'
              : 'Could not start the tablet camera. Tap "Flip Camera" or use "Upload QR Photo" below.'
          );
        }
      }
    };

    void startScanner();

    return () => {
      cancelled = true;
      stopCameraTracks();
    };
  }, [facingMode, onAddressScanned, stopCameraTracks]);

  const handleUploadQrImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSafetyMessage(null);
    setErrorMessage(null);

    const imgUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = canvasRef.current || document.createElement('canvas');
        const maxDim = 1024;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(data.data, data.width, data.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (!decoded?.data) {
          setSafetyMessage(
            'Could not read a QR code from that image. Make sure the full Xaman Receive QR square is clearly visible.'
          );
          return;
        }

        const parsed = extractPublicXrplAddress(decoded.data);
        if (parsed.address) {
          stopCameraTracks();
          onAddressScanned(parsed.address);
        } else if (parsed.safetyWarning) {
          setSafetyMessage(parsed.safetyWarning);
        }
      } finally {
        URL.revokeObjectURL(imgUrl);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(imgUrl);
      setSafetyMessage('Unable to read that image file. Try a PNG or JPG screenshot.');
    };
    img.src = imgUrl;
  };

  return (
    <div className="rounded-lg border border-emerald-500/50 bg-slate-950 text-slate-100 p-3 space-y-2.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="font-bold text-white flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Scan Android Xaman &ldquo;Receive&rdquo; QR</span>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 cursor-pointer whitespace-nowrap"
        >
          <X className="w-3 h-3" />
          <span>Close</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-300 leading-relaxed">
        On your Android phone: open <strong>Xaman</strong> → tap <strong>Request / Receive</strong>{' '}
        → hold your phone&apos;s public <span className="font-mono text-emerald-300">r...</span> QR
        code in front of this tablet camera.
      </p>

      {/* Live Video Preview Frame */}
      <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3] w-full flex items-center justify-center border border-slate-800">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`w-full h-full object-cover ${cameraState === 'active' ? 'block' : 'hidden'}`}
        />

        {/* Crisp Corner Scanning Reticle Overlay */}
        {cameraState === 'active' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-44 h-44 rounded-xl border-2 border-emerald-400/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.45)]" />
          </div>
        )}

        {cameraState === 'starting' && (
          <div className="text-xs text-slate-300 px-4 text-center">
            Starting tablet camera...
          </div>
        )}

        {cameraState === 'error' && (
          <div className="text-xs text-amber-300 px-4 text-center leading-relaxed max-w-xs">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Hidden Canvas for Local Browser QR Decoding */}
      <canvas ref={canvasRef} className="hidden" />

      {safetyMessage && (
        <div className="rounded-md border border-rose-500/50 bg-rose-950/60 p-2 flex items-start gap-1.5 text-[11px] text-rose-200 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{safetyMessage}</span>
        </div>
      )}

      {/* Camera Controls + Private Local Screenshot Fallback */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-200 cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          <span>
            {facingMode === 'environment' ? 'Switch to Front Camera' : 'Switch to Rear Camera'}
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUploadQrImage}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/50 text-[11px] font-semibold text-emerald-300 cursor-pointer whitespace-nowrap"
        >
          <ImageUp className="w-3.5 h-3.5 shrink-0" />
          <span>Upload QR Photo</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>
          100% private local scan on your tablet · Only accepts public r... addresses (never secret keys).
        </span>
      </div>
    </div>
  );
};
