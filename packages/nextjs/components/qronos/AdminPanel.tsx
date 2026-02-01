"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

// Wallet del admin (la que desplegó el contrato)
const ADMIN_ADDRESS = "0xB747850110877925Bd434CBC3Dac369941892A5a";

interface ProfessorProfile {
  address: string;
  fullName: string;
  specialty: string;
  courses: string[];
  registeredAt: string;
  status?: "pending" | "approved" | "rejected";
}

export const AdminPanel = () => {
  const { address } = useAccount();
  const [professors, setProfessors] = useState<ProfessorProfile[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");

  const { writeContractAsync: addProfessor, isPending: isApproving } = useScaffoldWriteContract({
    contractName: "QRonos",
  });

  // Verificar si es admin
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  // Cargar profesores
  useEffect(() => {
    if (!isAdmin) return;

    loadProfessors();
  }, [isAdmin]);

  const loadProfessors = () => {
    const allProfessors: ProfessorProfile[] = [];

    // Recorrer localStorage buscando perfiles de profesores
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("professor_")) {
        const profile = JSON.parse(localStorage.getItem(key)!);

        // Verificar estado de aprobación
        const statusKey = `professor_status_${profile.address}`;
        const status = localStorage.getItem(statusKey) || "pending";

        allProfessors.push({
          ...profile,
          status: status as "pending" | "approved" | "rejected",
        });
      }
    }

    setProfessors(allProfessors);
  };

  const handleApprove = async (professorAddress: string) => {
    try {
      notification.info("📝 Aprobando profesor en blockchain...");

      await addProfessor({
        functionName: "addProfessor",
        args: [professorAddress as `0x${string}`],
      });

      // Marcar como aprobado en localStorage
      const statusKey = `professor_status_${professorAddress}`;
      localStorage.setItem(statusKey, "approved");

      notification.success("✅ Profesor aprobado exitosamente!");
      loadProfessors();
    } catch (error: any) {
      console.error("Error al aprobar profesor:", error);

      if (error.message?.includes("Ya es profesor")) {
        // Si ya es profesor, marcar como aprobado de todos modos
        const statusKey = `professor_status_${professorAddress}`;
        localStorage.setItem(statusKey, "approved");
        notification.success("✅ Profesor ya estaba aprobado en el contrato");
        loadProfessors();
      } else {
        notification.error(`❌ Error al aprobar: ${error.message || "Intenta de nuevo"}`);
      }
    }
  };

  const handleReject = (professorAddress: string) => {
    const statusKey = `professor_status_${professorAddress}`;
    localStorage.setItem(statusKey, "rejected");
    notification.warning("⚠️ Profesor rechazado");
    loadProfessors();
  };

  const handleResetStatus = (professorAddress: string) => {
    const statusKey = `professor_status_${professorAddress}`;
    localStorage.setItem(statusKey, "pending");
    notification.info("🔄 Estado restablecido a pendiente");
    loadProfessors();
  };

  const filteredProfessors = professors.filter(p => p.status === filter);

  if (!isAdmin) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <span className="text-6xl mb-4">🔒</span>
          <h2 className="card-title text-2xl mb-2">Acceso Denegado</h2>
          <p className="text-base-content/70">Solo el administrador del sistema puede acceder a este panel.</p>
          <p className="text-sm text-base-content/50 mt-4">
            Wallet actual: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="card bg-warning text-warning-content shadow-xl">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <span className="text-5xl">👑</span>
            <div>
              <h2 className="card-title text-2xl">Panel de Administración</h2>
              <p className="text-sm opacity-90">
                Wallet Admin: {address?.slice(0, 6)}...{address?.slice(-4)} ✅
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-figure text-warning">
            <span className="text-4xl">⏳</span>
          </div>
          <div className="stat-title">Pendientes</div>
          <div className="stat-value text-warning">{professors.filter(p => p.status === "pending").length}</div>
          <div className="stat-desc">Esperando aprobación</div>
        </div>

        <div className="stat">
          <div className="stat-figure text-success">
            <span className="text-4xl">✅</span>
          </div>
          <div className="stat-title">Aprobados</div>
          <div className="stat-value text-success">{professors.filter(p => p.status === "approved").length}</div>
          <div className="stat-desc">Profesores activos</div>
        </div>

        <div className="stat">
          <div className="stat-figure text-error">
            <span className="text-4xl">❌</span>
          </div>
          <div className="stat-title">Rechazados</div>
          <div className="stat-value text-error">{professors.filter(p => p.status === "rejected").length}</div>
          <div className="stat-desc">No aprobados</div>
        </div>
      </div>

      {/* Filters */}
      <div className="tabs tabs-boxed bg-base-200 p-1">
        <a className={`tab ${filter === "pending" ? "tab-active" : ""}`} onClick={() => setFilter("pending")}>
          ⏳ Pendientes ({professors.filter(p => p.status === "pending").length})
        </a>
        <a className={`tab ${filter === "approved" ? "tab-active" : ""}`} onClick={() => setFilter("approved")}>
          ✅ Aprobados ({professors.filter(p => p.status === "approved").length})
        </a>
        <a className={`tab ${filter === "rejected" ? "tab-active" : ""}`} onClick={() => setFilter("rejected")}>
          ❌ Rechazados ({professors.filter(p => p.status === "rejected").length})
        </a>
      </div>

      {/* Professors List */}
      {filteredProfessors.length === 0 ? (
        <div className="alert alert-info">
          <span>No hay profesores en esta categoría</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProfessors.map(prof => (
            <div key={prof.address} className="card bg-base-200 shadow">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-xl">{prof.fullName}</h3>
                    <p className="text-sm opacity-70 mt-1">
                      {prof.specialty} • {prof.courses.length} curso(s)
                    </p>
                    <div className="mt-2">
                      <code className="text-xs bg-base-300 px-2 py-1 rounded">
                        {prof.address.slice(0, 10)}...{prof.address.slice(-8)}
                      </code>
                    </div>
                    <p className="text-xs opacity-50 mt-2">
                      Registrado: {new Date(prof.registeredAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2">
                      <span className="text-xs font-semibold">Cursos:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {prof.courses.map((course, i) => (
                          <div key={i} className="badge badge-sm badge-outline">
                            {course}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {prof.status === "pending" && (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove(prof.address)}
                          disabled={isApproving}
                        >
                          {isApproving ? (
                            <>
                              <span className="loading loading-spinner loading-xs"></span>
                              Aprobando...
                            </>
                          ) : (
                            "✅ Aprobar"
                          )}
                        </button>
                        <button className="btn btn-error btn-sm" onClick={() => handleReject(prof.address)}>
                          ❌ Rechazar
                        </button>
                      </>
                    )}

                    {prof.status === "approved" && <div className="badge badge-success gap-2">✅ Aprobado</div>}

                    {prof.status === "rejected" && (
                      <>
                        <div className="badge badge-error gap-2">❌ Rechazado</div>
                        <button className="btn btn-ghost btn-xs" onClick={() => handleResetStatus(prof.address)}>
                          🔄 Restablecer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="alert alert-info">
        <div className="flex flex-col w-full">
          <span className="font-bold text-sm">ℹ️ Instrucciones:</span>
          <ul className="text-xs mt-2 list-disc list-inside">
            <li>Los profesores se registran de forma autónoma en el sistema</li>
            <li>Aparecerán aquí como &quot;Pendientes&quot;</li>
            <li>Al aprobar, se les otorgan permisos en el contrato para crear eventos</li>
            <li>Los profesores rechazados no pueden crear eventos</li>
            <li>Puedes restablecer el estado de un profesor rechazado</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
