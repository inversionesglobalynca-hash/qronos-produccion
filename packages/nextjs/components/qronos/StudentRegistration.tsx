"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { SPECIALTIES_LIST, getCoursesBySpecialty } from "~~/utils/qronos/constants";
import { notification } from "~~/utils/scaffold-eth";

interface StudentProfile {
  address: string;
  fullName: string;
  idCard: string;
  specialty: string;
  course: string;
  registeredAt: string;
}

interface StudentRegistrationProps {
  onRegistrationComplete: (profile: StudentProfile) => void;
}

export const StudentRegistration = ({ onRegistrationComplete }: StudentRegistrationProps) => {
  const { address: connectedAddress } = useAccount();
  const [formData, setFormData] = useState({
    fullName: "",
    idCard: "",
    specialty: "",
    course: "",
  });

  const handleSpecialtyChange = (newSpecialty: string) => {
    setFormData({
      ...formData,
      specialty: newSpecialty,
      course: "", // Resetear curso al cambiar especialidad
    });
  };

  const validateIdCard = (idCard: string): boolean => {
    // Validación básica para cédula venezolana (V-12345678 o E-12345678)
    const regex = /^[VE]-\d{7,8}$/i;
    return regex.test(idCard);
  };

  const handleRegister = () => {
    // Validaciones
    if (!formData.fullName.trim()) {
      notification.error("❌ El nombre es obligatorio");
      return;
    }

    if (!formData.idCard.trim()) {
      notification.error("❌ La cédula es obligatoria");
      return;
    }

    if (!validateIdCard(formData.idCard)) {
      notification.error("❌ Formato de cédula inválido. Usa formato: V-12345678 o E-12345678");
      return;
    }

    if (!formData.specialty) {
      notification.error("❌ Debes seleccionar una especialidad");
      return;
    }

    if (!formData.course) {
      notification.error("❌ Debes seleccionar una materia/curso");
      return;
    }

    if (!connectedAddress) {
      notification.error("❌ Conecta tu wallet primero");
      return;
    }

    try {
      // Guardar perfil completo en localStorage
      const profile: StudentProfile = {
        address: connectedAddress,
        fullName: formData.fullName.trim(),
        idCard: formData.idCard.trim().toUpperCase(),
        specialty: formData.specialty,
        course: formData.course,
        registeredAt: new Date().toISOString(),
      };

      localStorage.setItem(`student_${connectedAddress}`, JSON.stringify(profile));

      notification.success(`✅ ¡Bienvenido, ${formData.fullName}! Ya puedes marcar asistencia.`);

      // Notificar al componente padre
      onRegistrationComplete(profile);
    } catch (error: any) {
      console.error("Error al registrar estudiante:", error);
      notification.error(`❌ Error al registrar: ${error.message || "Intenta de nuevo"}`);
    }
  };

  const availableCourses = formData.specialty ? getCoursesBySpecialty(formData.specialty) : [];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="card bg-base-200 shadow-xl w-full max-w-2xl">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-6xl mb-4 block">🎓</span>
            <h2 className="card-title text-3xl justify-center mb-2">Registro de Estudiante</h2>
            <p className="text-base-content/70">Completa tu perfil para empezar a marcar asistencia</p>
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
                placeholder="Ej: María González"
                className="input input-bordered input-lg"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            {/* Cédula de Identidad */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Cédula de Identidad *</span>
              </label>
              <input
                type="text"
                placeholder="V-25123456 o E-12345678"
                className="input input-bordered input-lg"
                value={formData.idCard}
                onChange={e => setFormData({ ...formData, idCard: e.target.value })}
              />
              <label className="label">
                <span className="label-text-alt">Formato: V-12345678 o E-12345678</span>
              </label>
            </div>

            {/* Especialidad */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Especialidad que Cursas *</span>
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

            {/* Materia/Curso */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Materia/Curso Actual *</span>
              </label>
              <select
                className="select select-bordered select-lg"
                value={formData.course}
                onChange={e => setFormData({ ...formData, course: e.target.value })}
                disabled={!formData.specialty}
              >
                <option value="">
                  {formData.specialty ? "Seleccionar materia..." : "Primero selecciona una especialidad"}
                </option>
                {availableCourses.map(course => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
              {formData.specialty && (
                <label className="label">
                  <span className="label-text-alt">Solo materias de {formData.specialty}</span>
                </label>
              )}
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

          {/* Información Adicional */}
          <div className="alert alert-success mt-2">
            <div className="flex flex-col w-full">
              <span className="font-bold">ℹ️ ¿Para qué necesitamos esto?</span>
              <ul className="text-sm mt-1 list-disc list-inside">
                <li>Tu profesor verá tu nombre en la lista de asistencia</li>
                <li>Solo podrás marcar asistencia en eventos de tu especialidad y curso</li>
                <li>Tus POAPs mostrarán tu información académica</li>
              </ul>
            </div>
          </div>

          {/* Botón de Registro */}
          <div className="card-actions justify-center mt-6">
            <button
              className="btn btn-primary btn-lg w-full"
              onClick={handleRegister}
              disabled={!formData.fullName || !formData.idCard || !formData.specialty || !formData.course}
            >
              ✅ Registrarme como Estudiante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
