"use client";

import { useEffect, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export const QRScanner = ({ onScan, onError }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");

  // Detectar cámaras disponibles
  useEffect(() => {
    const getCameras = async () => {
      try {
        // Primero solicitar permiso para acceder a las cámaras
        await navigator.mediaDevices
          .getUserMedia({ video: true })
          .then(stream => {
            // Detener el stream inmediatamente, solo necesitamos el permiso
            stream.getTracks().forEach(track => track.stop());
          })
          .catch(() => console.log("Permiso de cámara necesario"));

        // Ahora enumerar todas las cámaras disponibles
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === "videoinput");

        console.log("Cámaras detectadas:", videoDevices);
        console.log("Total de cámaras:", videoDevices.length);

        setCameras(videoDevices);

        // Seleccionar la ÚLTIMA cámara (normalmente la USB/externa)
        if (videoDevices.length > 0) {
          const preferredCamera = videoDevices[videoDevices.length - 1];
          setSelectedCamera(preferredCamera.deviceId);
          console.log("Cámara seleccionada:", preferredCamera.label || preferredCamera.deviceId);
        }
      } catch (error) {
        console.error("Error al detectar cámaras:", error);
      }
    };

    getCameras();
  }, []);

  const handleScan = (result: any) => {
    if (result && result[0]?.rawValue) {
      const qrData = result[0].rawValue;
      console.log("QR escaneado:", qrData);
      onScan(qrData);
      setIsScanning(false);
    }
  };

  const handleError = (error: any) => {
    console.error("Error al escanear:", error);
    if (onError) {
      onError(error?.message || "Error al acceder a la cámara");
    }
  };

  const startScanning = async () => {
    try {
      // Solicitar permisos
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
      });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setIsScanning(true);
    } catch (error: any) {
      console.error("Error de permisos:", error);
      setHasPermission(false);
      if (onError) {
        onError("No se pudo acceder a la cámara. Verifica los permisos.");
      }
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  return (
    <div className="w-full">
      {!isScanning ? (
        <div className="flex flex-col items-center gap-4">
          {/* Selector de Cámara */}
          {cameras.length > 1 && (
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">📷 Selecciona tu cámara:</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedCamera}
                onChange={e => setSelectedCamera(e.target.value)}
              >
                {cameras.map((camera, index) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Cámara ${index + 1}${index === cameras.length - 1 ? " (USB/Externa)" : ""}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button className="btn btn-primary btn-lg w-full" onClick={startScanning}>
            📸 Activar Cámara para Escanear
          </button>

          {hasPermission === false && (
            <div className="alert alert-error">
              <span>❌ No se pudo acceder a la cámara. Verifica que hayas dado permisos en tu navegador.</span>
            </div>
          )}

          <div className="alert alert-info">
            <div className="flex flex-col items-start w-full">
              <span className="font-bold">📱 Instrucciones:</span>
              <ol className="text-sm list-decimal list-inside mt-2">
                <li>Selecciona tu cámara USB si tienes múltiples</li>
                <li>Click en &quot;Activar Cámara&quot;</li>
                <li>Permite el acceso a la cámara</li>
                <li>Apunta al QR mostrado por el profesor</li>
                <li>El sistema procesará automáticamente</li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative w-full aspect-square max-w-md mx-auto bg-black rounded-lg overflow-hidden">
            <Scanner
              onScan={handleScan}
              onError={handleError}
              constraints={{
                deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
                facingMode: selectedCamera ? undefined : "environment",
              }}
              styles={{
                container: {
                  width: "100%",
                  height: "100%",
                },
              }}
            />

            {/* Overlay con guía visual */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-primary rounded-lg opacity-50"></div>
              </div>
            </div>
          </div>

          <div className="alert alert-success">
            <span>📷 Cámara activa - Apunta al QR del profesor</span>
          </div>

          <button className="btn btn-error btn-block" onClick={stopScanning}>
            🛑 Detener Cámara
          </button>
        </div>
      )}
    </div>
  );
};
