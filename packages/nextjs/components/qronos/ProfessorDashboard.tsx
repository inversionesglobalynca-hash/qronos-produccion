"use client";

import { useEffect, useRef, useState } from "react";
import { MyStudents } from "./MyStudents";
import { QRCodeSVG } from "qrcode.react";
import { useAccount, useWalletClient } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface ProfessorProfile {
  address: string;
  fullName: string;
  specialty: string;
  courses: string[];
  registeredAt: string;
}

type TabType = "create-event" | "students";

export const ProfessorDashboard = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [professorProfile, setProfessorProfile] = useState<ProfessorProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("create-event");

  // Form state
  const [selectedCourse, setSelectedCourse] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventCode, setEventCode] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("30");
  const [duration, setDuration] = useState("90");

  // QR state
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
  const [qrData, setQrData] = useState("");
  const [qrTimestamp, setQrTimestamp] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Load professor profile
  useEffect(() => {
    if (address) {
      const stored = localStorage.getItem(`professor_${address}`);
      if (stored) {
        const profile = JSON.parse(stored);
        setProfessorProfile(profile);
        // Seleccionar el primer curso por defecto
        if (profile.courses && profile.courses.length > 0) {
          setSelectedCourse(profile.courses[0]);
        }
      }
    }
  }, [address]);

  // Read event details
  const { data: eventData } = useScaffoldReadContract({
    contractName: "QRonos",
    functionName: "getEventDetails",
    args: activeEventId !== null ? [BigInt(activeEventId)] : [BigInt(0)],
    watch: true,
  });

  // Create event
  const { writeContractAsync: createEvent, isPending: isCreating } = useScaffoldWriteContract("QRonos");

  const generateQRSignature = async (eventId: number, timestamp: number) => {
    if (!walletClient || !address) {
      console.error("Wallet not connected");
      return null;
    }

    try {
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

  const updateQR = async () => {
    if (activeEventId === null || !walletClient) return;

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

  const startQRGeneration = (eventId: number) => {
    setActiveEventId(eventId);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setTimeout(updateQR, 100);
    intervalRef.current = setInterval(updateQR, 15000);
  };

  const stopQRGeneration = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setActiveEventId(null);
    setQrData("");
    setTimeRemaining(15);
  };

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

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleCreateEvent = async () => {
    if (!eventName || !eventCode) {
      notification.error("Por favor completa todos los campos");
      return;
    }

    if (!selectedCourse) {
      notification.error("Debes seleccionar un curso");
      return;
    }

    if (!professorProfile) {
      notification.error("No se encontró tu perfil de profesor");
      return;
    }

    try {
      await createEvent({
        functionName: "createClassEvent",
        args: [eventName, eventCode, BigInt(maxAttendees), "", BigInt(duration)],
      });

      const eventMetadata = {
        eventName,
        eventCode,
        professorName: professorProfile.fullName,
        specialty: professorProfile.specialty,
        course: selectedCourse,
        createdAt: new Date().toISOString(),
      };

      const eventsKey = `professor_events_${address}`;
      const existingEvents = JSON.parse(localStorage.getItem(eventsKey) || "[]");
      existingEvents.push(eventMetadata);
      localStorage.setItem(eventsKey, JSON.stringify(existingEvents));

      notification.success("✅ Evento creado exitosamente!");

      setEventName("");
      setEventCode("");
      setMaxAttendees("30");
      setDuration("90");

      notification.info("💡 Usa 'Activar QR Manualmente' con el Event ID del nuevo evento");
    } catch (error) {
      console.error("Error al crear evento:", error);
      notification.error("❌ Error al crear evento");
    }
  };

  const [manualEventId, setManualEventId] = useState("");

  return (
    <div className="space-y-6">
      {/* Professor Info Card */}
      {professorProfile && (
        <div className="card bg-primary text-primary-content shadow-xl">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <span className="text-5xl">👨‍🏫</span>
              <div>
                <h2 className="card-title text-2xl">{professorProfile.fullName}</h2>
                <p className="text-sm opacity-90">
                  {professorProfile.specialty} • {professorProfile.courses.length} curso(s)
                </p>
                <p className="text-xs opacity-70 mt-1">
                  Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200 p-1">
        <a
          className={`tab ${activeTab === "create-event" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("create-event")}
        >
          📅 Crear Evento
        </a>
        <a className={`tab ${activeTab === "students" ? "tab-active" : ""}`} onClick={() => setActiveTab("students")}>
          🎓 Mis Estudiantes
        </a>
      </div>

      {/* Tab Content */}
      {activeTab === "create-event" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Creation Form */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">📅 Crear Evento de Clase</h2>

              {/* Selector de Curso */}
              {professorProfile && professorProfile.courses.length > 0 && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Selecciona el Curso *</span>
                  </label>
                  <select
                    className="select select-bordered select-lg"
                    value={selectedCourse}
                    onChange={e => setSelectedCourse(e.target.value)}
                  >
                    {professorProfile.courses.map(course => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Info automática */}
              {professorProfile && selectedCourse && (
                <div className="alert alert-info mb-4">
                  <div className="flex flex-col w-full">
                    <span className="font-bold text-sm">📋 Información del Evento:</span>
                    <p className="text-xs mt-1">
                      Especialidad: {professorProfile.specialty}
                      <br />
                      Materia: {selectedCourse}
                    </p>
                  </div>
                </div>
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Nombre del Evento</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Clase 5 - React Hooks"
                  className="input input-bordered"
                  value={eventName}
                  onChange={e => setEventName(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Código del Evento</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: PROG-WEB-05"
                  className="input input-bordered"
                  value={eventCode}
                  onChange={e => setEventCode(e.target.value)}
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
                        <div className="stat-title">Evento</div>
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

                  {professorProfile && selectedCourse && (
                    <div className="alert alert-success mt-2 w-full">
                      <div className="flex flex-col items-start w-full text-sm">
                        <span className="font-bold">📚 {selectedCourse}</span>
                        <span className="text-xs opacity-80">{professorProfile.specialty}</span>
                      </div>
                    </div>
                  )}

                  <div className="alert alert-info mt-2 w-full">
                    <div className="flex flex-col items-start w-full">
                      <span className="font-bold">⏰ QR Activo</span>
                      <p className="text-sm">Se actualiza cada 15 segundos automáticamente</p>
                      <p className="text-xs opacity-70 mt-1">
                        Última actualización: {new Date(qrTimestamp * 1000).toLocaleTimeString()}
                      </p>

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
      )}

      {activeTab === "students" && <MyStudents />}
    </div>
  );
};
