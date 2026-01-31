"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { SPECIALTIES_LIST, getCoursesBySpecialty } from "~~/utils/qronos/constants";
import { notification } from "~~/utils/scaffold-eth";

interface ProfessorProfile {
  address: string;
  fullName: string;
  specialty: string;
  course: string;
  registeredAt: string;
}

interface ProfessorRegistrationProps {
  onRegistrationComplete: (profile: ProfessorProfile) => void;
}

export const ProfessorRegistration = ({ onRegistrationComplete }: ProfessorRegistrationProps) => {
  const { address: connectedAddress } = useAccount();
  const [formData, setFormData] = useState({
    fullName: "",
    specialty: "",
    course: "",
  });

  const { writeContractAsync: addProfessorWrite } = useScaffoldWriteContract("QRonos");

  const handleSpecialtyChange = (newSpecialty: string) => {
    setFormData({
      ...formData,
      specialty: newSpecialty,
      course: "", // Resetear curso al cambiar especialidad
    });
  };

  const handleRegister = async () => {
    // Validaciones
    if (!formData.fullName.trim()) {
      notification.error("❌ El nombre es obligatorio");
      return;
    }

    if (!formData.specialty) {
      notification.error("❌ Debes seleccionar una especialidad");
      return;
    }

    if (!formData.course) {
      notification.error("❌ Debes seleccionar un curso/materia");
      return;
    }

    if (!connectedAddress) {
      notification.error("❌ Conecta tu wallet primero");
      return;
    }

    try {
      // 1. Agregar profesor al smart contract
      notification.info("📝 Registrando profesor en blockchain...");

      await addProfessorWrite({
        functionName: "addProfessor",
        args: [connectedAddress],
      });

      // 2. Guardar perfil completo en localStorage
      const profile: ProfessorProfile = {
        address: connectedAddress,
        fullName: formData.fullName.trim(),
        specialty: formData.specialty,
        course: formData.course,
        registeredAt: new Date().toISOString(),
      };

      localStorage.setItem(`professor_${connectedAddress}`, JSON.stringify(profile));

      notification.success(`✅ ¡Bienvenido, ${formData.fullName}! Ya puedes crear eventos.`);

      // 3. Notificar al componente padre
      onRegistrationComplete(profile);
    } catch (error: any) {
      console.error("Error al registrar profesor:", error);

      // Verificar si el error es porque ya está registrado
      if (error.message?.includes("Ya es profesor")) {
        notification.warning("⚠️ Ya estás registrado como profesor");
      } else {
        notification.error(`❌ Error al registrar: ${error.message || "Intenta de nuevo"}`);
      }
    }
  };

  const availableCourses = formData.specialty ? getCoursesBySpecialty(formData.specialty) : [];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="card bg-base-200 shadow-xl w-full max-w-2xl">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-6xl mb-4 block">👨‍🏫</span>
            <h2 className="card-title text-3xl justify-center mb-2">Registro de Profesor</h2>
            <p className="text-base-content/70">Completa tu perfil para empezar a crear eventos</p>
          </div>

          {/* Wallet Conectada */}
          <div className="alert alert-info mb-4">
            <div className="flex flex-col w-full">
              <span className="font-bold">🔗 Wallet Conectada:</span>
              <code className="text-sm mt-1">{connectedAddress}</code>
            </div>
          </div>

          {/* Formulario */}
          <div className="space-y-4">
            {/* Nombre Completo */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Nombre Completo *</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Dr. Juan Pérez"
                className="input input-bordered input-lg"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            {/* Especialidad */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Especialidad *</span>
              </label>
              <select
                className="select select-bordered select-lg"
                value={formData.specialty}
                onChange={e => handleSpecialtyChange(e.target.value)}
              >
                <option value="">Seleccionar especialidad...</option>
                {SPECIALTIES_LIST.map(spec => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {/* Curso/Materia */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Curso/Materia que Imparte *</span>
              </label>
              <select
                className="select select-bordered select-lg"
                value={formData.course}
                onChange={e => setFormData({ ...formData, course: e.target.value })}
                disabled={!formData.specialty}
              >
                <option value="">
                  {formData.specialty ? "Seleccionar curso..." : "Primero selecciona una especialidad"}
                </option>
                {availableCourses.map(course => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Advertencia */}
          <div className="alert alert-warning mt-4">
            <div className="flex flex-col w-full">
              <span className="font-bold">⚠️ Importante:</span>
              <span className="text-sm mt-1">
                Una vez registrado, NO podrás modificar estos datos. Asegúrate de que toda la información sea correcta.
              </span>
            </div>
          </div>

          {/* Botón de Registro */}
          <div className="card-actions justify-center mt-6">
            <button
              className="btn btn-primary btn-lg w-full"
              onClick={handleRegister}
              disabled={!formData.fullName || !formData.specialty || !formData.course}
            >
              ✅ Registrarme como Profesor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
