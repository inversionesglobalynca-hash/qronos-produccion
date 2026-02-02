"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { SPECIALTIES_LIST, getCoursesBySpecialty } from "~~/utils/qronos/constants";
import { notification } from "~~/utils/scaffold-eth";

interface ProfessorProfile {
  address: string;
  fullName: string;
  specialty: string;
  courses: string[];
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
    courses: [] as string[],
  });

  const handleSpecialtyChange = (newSpecialty: string) => {
    setFormData({
      ...formData,
      specialty: newSpecialty,
      courses: [],
    });
  };

  const handleCourseToggle = (course: string) => {
    const currentCourses = formData.courses;
    if (currentCourses.includes(course)) {
      setFormData({
        ...formData,
        courses: currentCourses.filter(c => c !== course),
      });
    } else {
      setFormData({
        ...formData,
        courses: [...currentCourses, course],
      });
    }
  };

  const handleRegister = async () => {
    if (!formData.fullName.trim()) {
      notification.error("❌ El nombre es obligatorio");
      return;
    }

    if (!formData.specialty) {
      notification.error("❌ Debes seleccionar una especialidad");
      return;
    }

    if (formData.courses.length === 0) {
      notification.error("❌ Debes seleccionar al menos un curso/materia");
      return;
    }

    if (!connectedAddress) {
      notification.error("❌ Conecta tu wallet primero");
      return;
    }

    try {
      const profile: ProfessorProfile = {
        address: connectedAddress,
        fullName: formData.fullName.trim(),
        specialty: formData.specialty,
        courses: formData.courses,
        registeredAt: new Date().toISOString(),
      };

      localStorage.setItem(`professor_${connectedAddress}`, JSON.stringify(profile));

      // Indexar por curso para trazabilidad
      formData.courses.forEach(course => {
        const indexKey = `course_professor_${course}`;
        localStorage.setItem(indexKey, connectedAddress);
      });

      setFormData({ fullName: "", specialty: "", courses: [] });

      notification.success(`✅ ¡Bienvenido, ${formData.fullName}! Perfil registrado.`);
      notification.info("⚠️ Para crear eventos, un admin debe darte permisos en el contrato.");

      onRegistrationComplete(profile);
    } catch (error: any) {
      console.error("Error al registrar profesor:", error);
      notification.error(`❌ Error al registrar: ${error.message || "Intenta de nuevo"}`);
    }
  };

  const availableCourses = formData.specialty ? getCoursesBySpecialty(formData.specialty) : [];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="card bg-base-200 shadow-xl w-full max-w-3xl">
        <div className="card-body">
          <div className="text-center mb-6">
            <span className="text-6xl mb-4 block">👨‍🏫</span>
            <h2 className="card-title text-3xl justify-center mb-2">Registro de Profesor</h2>
            <p className="text-base-content/70">Completa tu perfil para empezar a crear eventos</p>
          </div>

          <div className="alert alert-info mb-4">
            <div className="flex flex-col w-full">
              <span className="font-bold">🔗 Wallet Conectada:</span>
              <code className="text-sm mt-1">{connectedAddress}</code>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="">Seleccionar...</option>
                {SPECIALTIES_LIST.map(spec => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cursos que Imparte */}
          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text font-semibold">Cursos/Materias que Imparte *</span>
              {formData.courses.length > 0 && (
                <span className="label-text-alt badge badge-primary">{formData.courses.length} seleccionados</span>
              )}
            </label>

            {!formData.specialty ? (
              <div className="alert alert-warning">
                <span className="text-sm">Primero selecciona una especialidad</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 bg-base-300 rounded-lg max-h-64 overflow-y-auto">
                {availableCourses.map(course => (
                  <label key={course} className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={formData.courses.includes(course)}
                      onChange={() => handleCourseToggle(course)}
                    />
                    <span className="label-text">{course}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="alert alert-warning mt-4">
            <div className="flex flex-col w-full">
              <span className="font-bold">⚠️ Importante:</span>
              <span className="text-sm mt-1">
                Una vez registrado, NO podrás modificar estos datos. Asegúrate de seleccionar todos los cursos que
                impartes.
              </span>
            </div>
          </div>

          <div className="card-actions justify-center mt-6">
            <button
              className="btn btn-primary btn-lg w-full"
              onClick={handleRegister}
              disabled={!formData.fullName || !formData.specialty || formData.courses.length === 0}
            >
              ✅ Registrarme como Profesor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
