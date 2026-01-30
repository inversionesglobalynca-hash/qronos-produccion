"use client";

import { useState } from "react";
import { QRScanner } from "./QRScanner";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const StudentDashboard = () => {
  const { address } = useAccount();

  const [scannedData, setScannedData] = useState<any>(null);
  const [manualQRData, setManualQRData] = useState("");

  // Read student events
  const { data: studentEvents } = useScaffoldReadContract({
    contractName: "QRonos",
    functionName: "getStudentEvents",
    args: address ? [address] : ["0x0000000000000000000000000000000000000000"],
    watch: true,
  });

  // Mark attendance
  const { writeContractAsync: markAttendance, isPending: isMarking } = useScaffoldWriteContract("QRonos");

  /**
   * Procesar QR - SIN VALIDACIONES DE TIMESTAMP
   */
  const processQR = (qrData: string) => {
    try {
      const data = JSON.parse(qrData);
      console.log("QR escaneado:", data);

      // Validar estructura básica
      if (!data.eventId && data.eventId !== 0) {
        notification.error("❌ QR inválido - falta eventId");
        return;
      }

      if (!data.timestamp) {
        notification.error("❌ QR inválido - falta timestamp");
        return;
      }

      if (!data.signature) {
        notification.error("❌ QR inválido - falta signature");
        return;
      }

      // Guardar datos SIN validar timestamp
      // El smart contract se encargará de validar
      setScannedData(data);
      notification.success(`✅ QR válido! Evento: ${data.eventId}`);
    } catch (error) {
      console.error("Error al procesar QR:", error);
      notification.error("❌ Error al leer QR. Verifica el formato JSON.");
    }
  };

  /**
   * Handle manual QR input
   */
  const handleManualScan = () => {
    if (!manualQRData) {
      notification.error("Ingresa los datos del QR");
      return;
    }

    processQR(manualQRData);
  };

  /**
   * Mark attendance with scanned data
   */
  const handleMarkAttendance = async () => {
    if (!scannedData) {
      notification.error("Primero escanea un QR válido");
      return;
    }

    try {
      await markAttendance({
        functionName: "markAttendanceWithQR",
        args: [BigInt(scannedData.eventId), BigInt(scannedData.timestamp), scannedData.signature],
      });

      notification.success("✅ ¡Asistencia registrada exitosamente!");
      setScannedData(null);
      setManualQRData("");
    } catch (error: any) {
      console.error("Error:", error);

      if (error.message?.includes("Ya registraste")) {
        notification.warning("⚠️ Ya registraste tu asistencia para este evento.");
      } else if (error.message?.includes("Firma invalida")) {
        notification.error("❌ QR inválido o fraudulento.");
      } else if (error.message?.includes("termino")) {
        notification.error("❌ La clase ya terminó. No puedes marcar asistencia.");
      } else if (error.message?.includes("comienza")) {
        notification.error("❌ La clase aún no ha comenzado.");
      } else {
        notification.error("❌ Error al marcar asistencia");
      }

      setScannedData(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* QR Scanner Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">📸 Escanear QR de Asistencia</h2>

          {/* Scanner con Cámara */}
          <QRScanner
            onScan={qrData => processQR(qrData)}
            onError={error => {
              notification.error(`❌ ${error}`);
            }}
          />

          {/* Divider */}
          <div className="divider">O ingresa manualmente para testing</div>

          {/* Método Manual (Backup) */}
          <div className="collapse collapse-arrow bg-base-200">
            <input type="checkbox" />
            <div className="collapse-title text-sm font-medium">🔧 Modo Manual (Para Testing sin Cámara)</div>
            <div className="collapse-content">
              <div className="form-control mt-2">
                <label className="label">
                  <span className="label-text">Datos del QR (JSON)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder='{"eventId":0,"timestamp":1234567890,"signature":"0x..."}'
                  value={manualQRData}
                  onChange={e => setManualQRData(e.target.value)}
                />
              </div>

              <button
                className="btn btn-primary btn-sm mt-4 w-full"
                onClick={handleManualScan}
                disabled={!manualQRData}
              >
                🔍 Procesar Manualmente
              </button>
            </div>
          </div>

          {/* QR Procesado - Marcar Asistencia */}
          {scannedData && (
            <div className="alert alert-success mt-4">
              <div className="flex flex-col items-start w-full">
                <span className="font-bold">✅ QR Válido Procesado</span>
                <p className="text-sm mt-2">Evento ID: {scannedData.eventId}</p>
                <p className="text-sm">Timestamp: {new Date(scannedData.timestamp * 1000).toLocaleTimeString()}</p>

                <button className="btn btn-success btn-block mt-4" onClick={handleMarkAttendance} disabled={isMarking}>
                  {isMarking ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Registrando...
                    </>
                  ) : (
                    "✓ Marcar Mi Asistencia"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* My POAPs Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">🎖️ Mis POAPs de Asistencia</h2>

          {studentEvents && studentEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Evento ID</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {studentEvents.map((eventId: bigint) => (
                    <tr key={eventId.toString()}>
                      <td className="font-mono">#{eventId.toString()}</td>
                      <td>
                        <span className="badge badge-success gap-2">✅ Asistencia Registrada</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="stats shadow mt-4 w-full">
                <div className="stat">
                  <div className="stat-figure text-primary">
                    <span className="text-4xl">🎓</span>
                  </div>
                  <div className="stat-title">Total de Asistencias</div>
                  <div className="stat-value text-primary">{studentEvents.length}</div>
                  <div className="stat-desc">POAPs coleccionados</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-warning">
              <span>Aún no has registrado asistencia a ningún evento</span>
            </div>
          )}

          <div className="divider">Información</div>

          <div className="prose max-w-none">
            <p className="text-sm text-base-content/70">
              Los POAPs (Proof of Attendance Protocol) son NFTs que certifican tu asistencia a eventos de clase. Son
              verificables en la blockchain y pueden ser usados como comprobante para:
            </p>
            <ul className="text-sm text-base-content/70 list-disc list-inside">
              <li>Solicitudes de pasantías</li>
              <li>Constancias académicas</li>
              <li>Portafolio profesional</li>
              <li>Requisitos de graduación</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
