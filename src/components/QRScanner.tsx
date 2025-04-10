
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

  // In a real application, you would use a QR code library like jsQR
  // Here we're using a simplified version for demo purposes
  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const scan = () => {
      if (!videoRef.current || !context) return;
      
      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        // Set canvas dimensions to match video
        canvas.height = videoRef.current.videoHeight;
        canvas.width = videoRef.current.videoWidth;
        
        // Draw video frame to canvas
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // In a real application, you would process the image data with jsQR here
        // For demo, we'll simulate QR detection after a few seconds
        if (scanning) {
          setTimeout(() => {
            // Simulate QR code detection with a student ID
            const studentId = Math.floor(Math.random() * 3) + 2; // Random student ID 2-4
            const mockQRData = `STUDENT:${studentId}`;
            
            // Provide feedback to the user
            toast.success('Quét mã QR thành công');
            
            // Pass the result back
            onScan(mockQRData);
            
            // Stop scanning after successful detection
            stopScanning();
          }, 3000);
          
          // Prevent multiple simulated detections
          setScanning(false);
        }
      }
      
      // Continue scanning
      requestRef.current = requestAnimationFrame(scan);
    };
    
    requestRef.current = requestAnimationFrame(scan);
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

      <style>{`
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
