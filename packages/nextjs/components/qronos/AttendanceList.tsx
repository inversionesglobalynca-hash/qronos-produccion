"use client";

import { useCallback, useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface StudentProfile {
  address: string;
  fullName: string;
  idCard: string;
  specialty: string;
  courses: string[];
  registeredAt: string;
}

interface AttendanceRecord {
  address: string;
  fullName: string;
  idCard: string;
  timestamp: string;
  isRegistered: boolean;
}

interface AttendanceListProps {
  eventId: number;
}

export const AttendanceList = ({ eventId }: AttendanceListProps) => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  const publicClient = usePublicClient();
  const { data: contract } = useScaffoldContract({
    contractName: "QRonos",
  });

  // Leer evento del smart contract
  const { data: eventData } = useScaffoldReadContract({
    contractName: "QRonos",
    functionName: "getEventDetails",
    args: [BigInt(eventId)],
  });

  // Cargar asistentes desde eventos del blockchain
  const loadAttendees = useCallback(async () => {
    if (!contract || !publicClient) {
      return;
    }

    setIsLoadingAttendance(true);

    try {
      // Obtener bloque actual
      const currentBlock = await publicClient.getBlockNumber();

      // Buscar solo los últimos 10,000 bloques (aprox últimos días en Sepolia)
      const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;

      // Leer eventos AttendanceMarked para este eventId
      const logs = await publicClient.getLogs({
        address: contract.address,
        event: {
          type: "event",
          name: "AttendanceMarked",
          inputs: [
            { type: "uint256", indexed: true, name: "eventId" },
            { type: "address", indexed: true, name: "student" },
            { type: "uint256", indexed: false, name: "timestamp" },
          ],
        },
        args: {
          eventId: BigInt(eventId),
        },
        fromBlock,
        toBlock: "latest",
      });

      // Procesar logs y obtener perfiles
      const attendees: AttendanceRecord[] = logs.map(log => {
        const studentAddress = log.args.student as string;
        const timestamp = log.args.timestamp as bigint;

        // Buscar perfil del estudiante en localStorage
        const profileKey = `student_${studentAddress}`;
        const storedProfile = localStorage.getItem(profileKey);

        if (storedProfile) {
          const profile: StudentProfile = JSON.parse(storedProfile);
          return {
            address: studentAddress,
            fullName: profile.fullName,
            idCard: profile.idCard,
            timestamp: new Date(Number(timestamp) * 1000).toLocaleString(),
            isRegistered: true,
          };
        } else {
          return {
            address: studentAddress,
            fullName: "No registrado",
            idCard: "-",
            timestamp: new Date(Number(timestamp) * 1000).toLocaleString(),
            isRegistered: false,
          };
        }
      });

      setAttendanceData(attendees);
      setIsLoadingAttendance(false);
    } catch (error) {
      console.error("Error al cargar asistentes:", error);
      notification.error("❌ Error al cargar lista de asistencia");
      setIsLoadingAttendance(false);
    }
  }, [contract, publicClient, eventId]);

  // Cargar automáticamente al montar
  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  // Exportar a CSV
  const handleExportCSV = () => {
    if (attendanceData.length === 0) {
      notification.warning("⚠️ No hay datos para exportar");
      return;
    }

    const eventName = eventData ? eventData[0] : "Evento";
    const eventCode = eventData ? eventData[1] : "";

    const csv = [
      `Lista de Asistencia - ${eventName} (${eventCode})`,
      `Fecha de Exportación: ${new Date().toLocaleString()}`,
      "",
      "N°,Dirección Wallet,Nombre y Apellido,Cédula de Identidad,Fecha y Hora,Estado",
      ...attendanceData.map(
        (student, index) =>
          `${index + 1},${student.address},${student.fullName},${student.idCard},${student.timestamp},${student.isRegistered ? "Registrado" : "Sin Registro"}`,
      ),
      "",
      `Total de Estudiantes: ${attendanceData.length}`,
      `Registrados: ${attendanceData.filter(s => s.isRegistered).length}`,
      `Sin Perfil: ${attendanceData.filter(s => !s.isRegistered).length}`,
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `asistencia_evento_${eventId}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    notification.success("📥 CSV descargado exitosamente");
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">📊 Lista de Asistencia</h2>

        {/* Event Info */}
        {eventData && (
          <div className="alert alert-info mb-4">
            <div className="flex flex-col w-full">
              <span className="font-bold text-lg">{eventData[0]}</span>
              <span className="text-sm">{eventData[1]}</span>
              <span className="text-xs opacity-70 mt-1">Evento ID: {eventId}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingAttendance && (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
            <span className="ml-4">Cargando asistentes desde blockchain...</span>
          </div>
        )}

        {/* No Attendees */}
        {!isLoadingAttendance && attendanceData.length === 0 && (
          <div className="alert alert-warning">
            <span>Aún no hay estudiantes que hayan marcado asistencia para este evento</span>
          </div>
        )}

        {/* Attendance Table */}
        {!isLoadingAttendance && attendanceData.length > 0 && (
          <>
            {/* Stats */}
            <div className="stats shadow mb-4 w-full">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <span className="text-4xl">🎓</span>
                </div>
                <div className="stat-title">Total de Asistentes</div>
                <div className="stat-value text-primary">{attendanceData.length}</div>
                <div className="stat-desc">
                  {eventData && eventData[4]
                    ? `${Math.round((attendanceData.length / Number(eventData[4])) * 100)}% del cupo`
                    : "Registrados en blockchain"}
                </div>
              </div>

              <div className="stat">
                <div className="stat-figure text-secondary">
                  <span className="text-4xl">✅</span>
                </div>
                <div className="stat-title">Estudiantes Registrados</div>
                <div className="stat-value text-secondary">{attendanceData.filter(s => s.isRegistered).length}</div>
                <div className="stat-desc">{attendanceData.filter(s => !s.isRegistered).length} sin perfil</div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Dirección Wallet</th>
                    <th>Nombre y Apellido</th>
                    <th>Cédula</th>
                    <th>Fecha y Hora</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((student, index) => (
                    <tr key={`${student.address}-${index}`} className={!student.isRegistered ? "opacity-60" : ""}>
                      <td>{index + 1}</td>
                      <td>
                        <code className="text-xs bg-base-300 px-2 py-1 rounded">
                          {student.address.slice(0, 6)}...{student.address.slice(-4)}
                        </code>
                      </td>
                      <td className={student.isRegistered ? "font-semibold" : "italic"}>{student.fullName}</td>
                      <td className="font-mono text-sm">{student.idCard}</td>
                      <td className="text-sm">{student.timestamp}</td>
                      <td>
                        {student.isRegistered ? (
                          <div className="badge badge-success gap-2">✅ Registrado</div>
                        ) : (
                          <div className="badge badge-warning gap-2">⚠️ Sin Perfil</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button className="btn btn-primary" onClick={handleExportCSV}>
                📥 Exportar CSV
              </button>
              <button className="btn btn-outline" onClick={loadAttendees}>
                🔄 Actualizar Lista
              </button>
            </div>

            {/* Note */}
            {attendanceData.some(s => !s.isRegistered) && (
              <div className="alert alert-warning mt-4">
                <div className="flex flex-col w-full">
                  <span className="font-bold text-sm">⚠️ Estudiantes Sin Perfil:</span>
                  <span className="text-xs mt-1">
                    Algunos estudiantes marcaron asistencia pero no completaron su registro en el sistema. Solo se
                    muestra su dirección de wallet.
                  </span>
                </div>
              </div>
            )}

            <div className="alert alert-success mt-2">
              <div className="flex flex-col w-full">
                <span className="font-bold text-sm">✅ Datos Verificables:</span>
                <span className="text-xs mt-1">
                  Esta lista se genera leyendo eventos directamente del blockchain. Todos los registros son verificables
                  en Sepolia Etherscan.
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
