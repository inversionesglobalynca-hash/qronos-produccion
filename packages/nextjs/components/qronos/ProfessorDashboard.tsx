"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAccount, useWalletClient } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const ProfessorDashboard = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Form state
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("30");
  const [duration, setDuration] = useState("90");

  // QR state
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
  const [qrData, setQrData] = useState("");
  const [qrTimestamp, setQrTimestamp] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Read event details
  const { data: eventData } = useScaffoldReadContract({
    contractName: "QRonos",
    functionName: "getEventDetails",
    args: activeEventId !== null ? [BigInt(activeEventId)] : [BigInt(0)],
    watch: true,
  });

  // Create event
  const { writeContractAsync: createEvent, isPending: isCreating } = useScaffoldWriteContract("QRonos");

  /**
   * Generate QR signature - CORREGIDO
   */
  const generateQRSignature = async (eventId: number, timestamp: number) => {
    if (!walletClient || !address) {
      console.error("Wallet not connected");
      return null;
    }

    try {
      // El mensaje DEBE coincidir exactamente con el smart contract
      // Smart contract espera: "eventId-timestamp"
      const message = `${eventId}-${timestamp}`;

      console.log("Firmando mensaje:", message);

      const signature = await walletClient.signMessage({
        account: address,
        message: message,
      });

      console.log("Firma generada:", signature);
      return signature;
    } catch (error) {
      console.error("Error al firmar:", error);
      return null;
    }
  };

  /**
   * Update QR code
   */
  const updateQR = async () => {
    if (activeEventId === null || !walletClient) return;

    // Usar timestamp actual SIN ajustes
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await generateQRSignature(activeEventId, timestamp);

    if (signature) {
      const qrPayload = JSON.stringify({
        eventId: activeEventId,
        timestamp: timestamp,
        signature: signature,
      });

      setQrData(qrPayload);
      setQrTimestamp(timestamp);
      setTimeRemaining(15);

      console.log("QR actualizado:", { eventId: activeEventId, timestamp, signature });
    }
  };

  /**
   * Start QR generation
   */
  const startQRGeneration = (eventId: number) => {
    setActiveEventId(eventId);

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Generate first QR immediately
    setTimeout(updateQR, 100);

    // Then update every 15 seconds
    intervalRef.current = setInterval(updateQR, 15000);
  };

  /**
   * Stop QR generation
   */
  const stopQRGeneration = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setActiveEventId(null);
    setQrData("");
    setTimeRemaining(15);
  };

  /**
   * Countdown timer
   */
  useEffect(() => {
    if (!qrTimestamp || activeEventId === null) return;

    const countdownInterval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const elapsed = now - qrTimestamp;
      const remaining = Math.max(0, 15 - elapsed);
      setTimeRemaining(remaining);
    }, 100);

    return () => clearInterval(countdownInterval);
  }, [qrTimestamp, activeEventId]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  /**
   * Handle create event
   */
  const handleCreateEvent = async () => {
    if (!courseName || !courseCode) {
      notification.error("Por favor completa todos los campos");
      return;
    }

    try {
      await createEvent({
        functionName: "createClassEvent",
        args: [courseName, courseCode, BigInt(maxAttendees), "", BigInt(duration)],
      });

      notification.success("✅ Evento creado exitosamente!");

      // Reset form
      setCourseName("");
      setCourseCode("");
      setMaxAttendees("30");
      setDuration("90");

      // Informar al usuario
      notification.info("💡 Usa 'Activar QR Manualmente' con el Event ID del nuevo evento");
    } catch (error) {
      console.error("Error al crear evento:", error);
      notification.error("❌ Error al crear evento");
    }
  };

  /**
   * Manual event ID input for testing
   */
  const [manualEventId, setManualEventId] = useState("");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Event Creation Form */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">👨‍🏫 Crear Evento de Clase</h2>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Nombre del Curso</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Desarrollo de dApps"
              className="input input-bordered"
              value={courseName}
              onChange={e => setCourseName(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Código del Curso</span>
            </label>
            <input
              type="text"
              placeholder="Ej: DDA-2025"
              className="input input-bordered"
              value={courseCode}
              onChange={e => setCourseCode(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Cupo Máximo</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={maxAttendees}
                onChange={e => setMaxAttendees(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Duración (min)</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={duration}
                onChange={e => setDuration(e.target.value)}
              />
            </div>
          </div>

          <button className="btn btn-primary mt-4" onClick={handleCreateEvent} disabled={isCreating}>
            {isCreating ? (
              <>
                <span className="loading loading-spinner"></span>
                Creando...
              </>
            ) : (
              "🚀 Crear Evento"
            )}
          </button>

          {/* Manual Event ID for Testing */}
          <div className="divider">Testing: Activar QR Manualmente</div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Event ID (ej: 0)"
              className="input input-bordered flex-1"
              value={manualEventId}
              onChange={e => setManualEventId(e.target.value)}
            />
            <button
              className="btn btn-secondary"
              onClick={() => {
                const id = parseInt(manualEventId);
                if (!isNaN(id)) {
                  startQRGeneration(id);
                  notification.success(`QR activado para Event ID: ${id}`);
                }
              }}
            >
              Activar QR
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic QR Display */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body items-center">
          <h2 className="card-title text-2xl mb-4">📱 QR de Asistencia</h2>

          {activeEventId !== null && qrData ? (
            <>
              <div className="bg-white p-6 rounded-lg mb-4">
                <QRCodeSVG value={qrData} size={256} level="H" />
              </div>

              {/* Countdown Timer */}
              <div
                className="radial-progress text-primary mb-4"
                style={{ "--value": (timeRemaining / 15) * 100, "--size": "5rem" } as React.CSSProperties}
                role="progressbar"
              >
                {timeRemaining}s
              </div>

              {eventData && (
                <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
                  <div className="stat">
                    <div className="stat-title">Curso</div>
                    <div className="stat-value text-lg">{eventData[0]}</div>
                    <div className="stat-desc">{eventData[1]}</div>
                  </div>

                  <div className="stat">
                    <div className="stat-title">Asistentes</div>
                    <div className="stat-value text-primary">
                      {eventData[3]?.toString()}/{eventData[4]?.toString()}
                    </div>
                    <div className="stat-desc">
                      {eventData[3] && eventData[4]
                        ? `${Math.round((Number(eventData[3]) / Number(eventData[4])) * 100)}% de cupo`
                        : "0%"}
                    </div>
                  </div>
                </div>
              )}

              <div className="alert alert-info mt-4 w-full">
                <div className="flex flex-col items-start w-full">
                  <span className="font-bold">⏰ QR Activo</span>
                  <p className="text-sm">Se actualiza cada 15 segundos automáticamente</p>
                  <p className="text-xs opacity-70 mt-1">
                    Última actualización: {new Date(qrTimestamp * 1000).toLocaleTimeString()}
                  </p>

                  {/* Botón para copiar JSON */}
                  <button
                    className="btn btn-sm btn-outline mt-2 w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(qrData);
                      notification.success("📋 JSON copiado al portapapeles");
                    }}
                  >
                    📋 Copiar JSON del QR
                  </button>
                </div>
              </div>

              <button className="btn btn-error mt-4 w-full" onClick={stopQRGeneration}>
                🛑 Detener QR
              </button>
            </>
          ) : (
            <div className="alert alert-warning">
              <span>Crea un evento o ingresa un Event ID para generar el QR dinámico</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
