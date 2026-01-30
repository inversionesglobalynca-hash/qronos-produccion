"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ProfessorDashboard } from "~~/components/qronos/ProfessorDashboard";
import { StudentDashboard } from "~~/components/qronos/StudentDashboard";

const Home = () => {
  const { address, isConnected } = useAccount();
  const [selectedRole, setSelectedRole] = useState<"student" | "professor" | null>(null);

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ⏰ QRonos
          </h1>
          <p className="text-3xl mb-2 text-base-content/80">Asistencia sincronizada a la velocidad del bloque</p>
          <p className="text-lg text-base-content/60 max-w-2xl mx-auto">
            Sistema de certificación de asistencia universitaria con QR dinámico y POAPs verificables
          </p>
        </div>

        {/* Connect Wallet Prompt */}
        {!isConnected ? (
          <div className="card bg-base-200 shadow-xl max-w-2xl mx-auto">
            <div className="card-body items-center text-center">
              <h2 className="card-title text-3xl mb-4">🔐 Conecta tu Wallet</h2>
              <p className="mb-6 text-base-content/70">
                Para usar QRonos, conecta tu wallet usando el botón en la esquina superior derecha
              </p>
              <div className="flex gap-2 items-center">
                <span className="text-4xl">→</span>
                <span className="text-lg">Click en &quot;Connect Wallet&quot;</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Role Selection */}
            {!selectedRole ? (
              <div className="card bg-base-200 shadow-xl max-w-3xl mx-auto">
                <div className="card-body items-center text-center">
                  <h2 className="card-title text-3xl mb-6">👤 Selecciona tu Rol</h2>
                  <p className="mb-8 text-base-content/70">¿Eres profesor o estudiante?</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                    {/* Profesor Card */}
                    <div
                      onClick={() => setSelectedRole("professor")}
                      className="card bg-primary text-primary-content hover:scale-105 transition-transform cursor-pointer"
                    >
                      <div className="card-body items-center text-center">
                        <span className="text-6xl mb-4">👨‍🏫</span>
                        <h3 className="card-title text-2xl">Profesor</h3>
                        <p className="text-sm opacity-90">
                          Crea eventos de clase y genera QR dinámicos para tomar asistencia
                        </p>
                        <div className="badge badge-secondary mt-2">Crear Eventos</div>
                      </div>
                    </div>

                    {/* Estudiante Card */}
                    <div
                      onClick={() => setSelectedRole("student")}
                      className="card bg-secondary text-secondary-content hover:scale-105 transition-transform cursor-pointer"
                    >
                      <div className="card-body items-center text-center">
                        <span className="text-6xl mb-4">🎓</span>
                        <h3 className="card-title text-2xl">Estudiante</h3>
                        <p className="text-sm opacity-90">Escanea QR para marcar asistencia y colecciona tus POAPs</p>
                        <div className="badge badge-accent mt-2">Escanear QR</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Role Indicator & Switch */}
                <div className="flex justify-center mb-8">
                  <div className="btn-group">
                    <button
                      className={`btn ${selectedRole === "professor" ? "btn-active btn-primary" : ""}`}
                      onClick={() => setSelectedRole("professor")}
                    >
                      👨‍🏫 Profesor
                    </button>
                    <button
                      className={`btn ${selectedRole === "student" ? "btn-active btn-secondary" : ""}`}
                      onClick={() => setSelectedRole("student")}
                    >
                      🎓 Estudiante
                    </button>
                  </div>
                </div>

                {/* Dashboard Content */}
                {selectedRole === "professor" ? <ProfessorDashboard /> : <StudentDashboard />}
              </>
            )}
          </>
        )}

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 mb-8">
          <div className="card bg-base-200 shadow-md">
            <div className="card-body items-center text-center">
              <span className="text-4xl mb-2">🔄</span>
              <h3 className="card-title text-lg">QR Dinámico</h3>
              <p className="text-sm text-base-content/70">Se actualiza cada 15 segundos</p>
            </div>
          </div>

          <div className="card bg-base-200 shadow-md">
            <div className="card-body items-center text-center">
              <span className="text-4xl mb-2">⛓️</span>
              <h3 className="card-title text-lg">Inmutable</h3>
              <p className="text-sm text-base-content/70">Registros permanentes en blockchain</p>
            </div>
          </div>

          <div className="card bg-base-200 shadow-md">
            <div className="card-body items-center text-center">
              <span className="text-4xl mb-2">🎖️</span>
              <h3 className="card-title text-lg">POAPs</h3>
              <p className="text-sm text-base-content/70">NFTs verificables de asistencia</p>
            </div>
          </div>
        </div>

        {/* Connected Wallet Info */}
        {isConnected && (
          <div className="text-center mt-8 text-sm text-base-content/50">
            <p>
              Conectado como: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
