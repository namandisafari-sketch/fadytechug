import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScanLine, X } from 'lucide-react';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

const BarcodeScanner = ({ open, onClose, onScan }: BarcodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'barcode-scanner-container';

  useEffect(() => {
    if (open && !isScanning) {
      startScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [open]);

  const startScanner = async () => {
    setError(null);
    
    try {
      // Wait for DOM element to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          // Success callback
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        () => {
          // Error callback - ignore scan errors
        }
      );
      
      setIsScanning(true);
    } catch (err: any) {
      console.error('Scanner error:', err);
      setError(err.message || 'Failed to start camera. Please ensure camera permissions are granted.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    scannerRef.current = null;
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Scan Receipt Barcode
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div 
            id={containerId} 
            className="w-full min-h-[300px] bg-muted rounded-lg overflow-hidden"
          />
          
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={startScanner}
              >
                Try Again
              </Button>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground text-center">
            Point your camera at a receipt barcode or QR code
          </p>
          
          <Button variant="outline" onClick={handleClose} className="w-full">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
