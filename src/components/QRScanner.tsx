import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Image as ImageIcon, Loader2, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanError, onClose }) => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCodeRef.current = html5QrCode;

      const startCamera = async () => {
        console.log("Attempting to start camera...");
        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 15,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              console.log("QR Code scanned successfully:", decodedText);
              onScanSuccess(decodedText);
              stopCamera();
            },
            (errorMessage) => {
              // Only log real errors, not frequent scan failures
            }
          );
          console.log("Camera started successfully");
          setIsCameraReady(true);
          setErrorStatus(null);
        } catch (err: any) {
          console.error("Critical error starting camera:", err);
          const name = err?.name || "";
          const message = err?.message || "";
          
          if (name === "NotAllowedError" || message.toLowerCase().includes("permission denied")) {
            setErrorStatus("Izin kamera ditolak. Silakan klik ikon gembok (🔒) di sebelah alamat browser (URL bar) dan aktifkan 'Kamera', lalu segarkan halaman ini.");
          } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
            setErrorStatus("Kamera tidak ditemukan. Pastikan perangkat memiliki kamera belakang dan berikan izin di pengaturan Chrome/Browser Anda.");
          } else if (name === "NotReadableError" || name === "TrackStartError") {
            setErrorStatus("Kamera terkunci oleh aplikasi lain. Silakan tutup aplikasi kamera atau tab lain yang menggunakan kamera.");
          } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            setErrorStatus("Kamera memerlukan koneksi aman (HTTPS). Pastikan Anda menggunakan link yang diawali https://");
          } else {
            setErrorStatus("Gagal mengakses kamera. Error: " + (name || message || "Unknown"));
          }
        }
      };

    const stopCamera = async () => {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          await html5QrCodeRef.current.clear();
        } catch (err) {
          console.error("Failed to clean up scanner", err);
        }
      }
    };

    // Small delay to ensure the DOM element is ready
    const timer = setTimeout(() => {
      if (html5QrCodeRef.current) {
        startCamera();
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [onScanSuccess]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorStatus(null);

    const helper = new Html5Qrcode("qr-reader-hidden");
    
    try {
      const decodedText = await helper.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch (err) {
      console.error("Error scanning file", err);
      setErrorStatus("QR Code tidak ditemukan dalam foto.");
      setTimeout(() => setErrorStatus(null), 3000);
    } finally {
      setIsProcessing(false);
      try { helper.clear(); } catch(e) {}
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
    >
      <div id="qr-reader-hidden" className="hidden" />

      <div className="absolute top-8 right-6 z-[110]">
        <button 
          onClick={onClose}
          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <X size={24} />
        </button>
      </div>

      <div className="w-full max-w-sm aspect-square bg-stone-900 rounded-[40px] overflow-hidden relative border-2 border-white/10 shadow-2xl">
        <div id="qr-reader" className="w-full h-full" />
        
        {!isCameraReady && !errorStatus && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900">
            <Loader2 className="text-orange-500 animate-spin mb-4" size={40} />
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Menyiapkan Kamera...</p>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-[120]">
            <Loader2 className="text-orange-500 animate-spin mb-4" size={40} />
            <p className="text-white font-bold text-sm">Memproses Foto...</p>
          </div>
        )}

        {errorStatus && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950 p-8 text-center z-[150]">
            <div className="w-20 h-20 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Camera size={40} />
            </div>
            <h4 className="text-white font-black text-xl mb-3">Akses Kamera Terkendala</h4>
            <p className="text-stone-400 text-sm leading-relaxed mb-8 max-w-xs px-2">
              {errorStatus}
              <br /><br />
              <span className="text-xs text-orange-500 font-bold block mb-1">PENTING:</span>
              <span className="text-xs text-stone-500 italic block">Ini adalah aplikasi web. Cek izin di Chrome/Safari, bukan di Pengaturan HP untuk aplikasi terpisah.</span>
            </p>
            
            <div className="flex flex-col gap-3 w-full max-w-[280px]">
              <button 
                onClick={() => window.open(window.location.href, '_blank')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/40 ring-4 ring-orange-500/20"
              >
                <span>Buka di Tab Baru</span>
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white/10 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all text-sm border border-white/10 flex items-center justify-center gap-2"
              >
                <ImageIcon size={18} />
                <span>Unggah Foto QR</span>
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-transparent text-stone-500 font-bold py-2 rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-widest"
              >
                Segarkan Halaman
              </button>
            </div>
          </div>
        )}

        {/* Framing brackets */}
        {isCameraReady && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-orange-500 rounded-tl-2xl" />
            <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-orange-500 rounded-tr-2xl" />
            <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-orange-500 rounded-bl-2xl" />
            <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-orange-500 rounded-br-2xl" />
          </div>
        )}
      </div>

      <div className="mt-10 text-center text-white space-y-4 w-full max-w-xs">
        <div className="space-y-1">
          <h3 className="text-xl font-black tracking-tight">Pindai QR Menu</h3>
          <p className="text-stone-400 text-sm">Arahkan kamera ke QR code atau unggah foto dari galeri.</p>
        </div>

        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
        />

        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full bg-white/10 hover:bg-white/20 text-white rounded-2xl py-4 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
        >
          <ImageIcon size={20} className="text-orange-500" />
          <span className="text-sm font-bold">Unggah dari Galeri</span>
        </button>
      </div>

      <div className="mt-8 flex gap-1 items-center">
        {isCameraReady ? (
          <>
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Kamera Aktif</span>
          </>
        ) : (
          <>
            <div className="w-1.5 h-1.5 bg-stone-500 rounded-full" />
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Kamera Nonaktif</span>
          </>
        )}
      </div>
    </motion.div>
  );
};

