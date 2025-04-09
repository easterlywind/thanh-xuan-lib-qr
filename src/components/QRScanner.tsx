
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Camera, RefreshCw } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose?: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const initCamera = async () => {
    try {
      setScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start scanning for QR codes
        startScanning();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
      setScanning(false);
    }
  };

  const startScanning = () => {
    // Simulating QR code detection (in a real app, you would use a QR code library)
    timeoutRef.current = setTimeout(() => {
      // For demo purposes, we'll simulate finding a QR code after 3 seconds
      const mockQRData = `STUDENT:${Math.floor(Math.random() * 3) + 2}`; // Random student ID 2-4
      onScan(mockQRData);
      stopScanning();
    }, 3000);
  };

  const stopScanning = () => {
    setScanning(false);
    
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      videoRef.current!.srcObject = null;
    }
    
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleClose = () => {
    stopScanning();
    if (onClose) onClose();
  };

  const restartScanning = () => {
    stopScanning();
    initCamera();
  };

  useEffect(() => {
    initCamera();
    
    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md aspect-square mb-4 bg-black rounded-lg overflow-hidden">
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover"
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* QR code overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3/4 h-3/4 border-2 border-white opacity-70 rounded-lg relative">
            {scanning && (
              <div className="absolute top-0 left-0 w-full h-1 bg-library-primary animate-[scan_2s_ease-in-out_infinite]" />
            )}
          </div>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <Button 
          variant="outline"
          onClick={handleClose}
          className="flex-1"
        >
          Hủy
        </Button>
        
        <Button 
          variant="outline"
          onClick={restartScanning}
          className="flex-1"
          disabled={!scanning}
        >
          <RefreshCw size={18} className="mr-2" />
          Quét lại
        </Button>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <div className="flex justify-center mb-2">
          <Camera size={20} className="text-gray-400" />
        </div>
        Đưa mã QR vào khung hình để quét
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: calc(100% - 4px); }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
