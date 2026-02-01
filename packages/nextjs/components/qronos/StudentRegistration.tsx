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
  courses: string[];
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

  const validateIdCard = (idCard: string): boolean => {
    const regex = /^[VE]-\d{7,8}$/i;
    return regex.test(idCard);
  };

  const handleRegister = () => {
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

    if (formData.courses.length === 0) {
      notification.error("❌ Debes seleccionar al menos un curso/materia");
      return;
    }

    if (!connectedAddress) {
      notification.error("❌ Conecta tu wallet primero");
      return;
    }

    try {
      const profile: StudentProfile = {
        address: connectedAddress,
        fullName: formData.fullName.trim(),
        idCard: formData.idCard.trim().toUpperCase(),
        specialty: formData.specialty,
        courses: formData.courses,
        registeredAt: new Date().toISOString(),
      };

      // Guardar perfil del estudiante
      localStorage.setItem(`student_${connectedAddress}`, JSON.stringify(profile));

      // 🔗 TRAZABILIDAD: Vincular estudiante con profesores
      formData.courses.forEach(course => {
        // Obtener profesor de ese curso
        const professorAddress = localStorage.getItem(`course_professor_${course}`);

        if (professorAddress) {
          // Agregar estudiante a la lista del profesor en ese curso
          const key = `course_students_${course}`;
          const existing = JSON.parse(localStorage.getItem(key) || "[]");

          // Verificar que no esté duplicado
          const alreadyEnrolled = existing.some((s: any) => s.address === connectedAddress);

          if (!alreadyEnrolled) {
            existing.push({
              address: connectedAddress,
              fullName: profile.fullName,
              idCard: profile.idCard,
              enrolledAt: new Date().toISOString(),
            });
            localStorage.setItem(key, JSON.stringify(existing));
          }
        }
      });

      setFormData({ fullName: "", idCard: "", specialty: "", courses: [] });

      notification.success(`✅ ¡Bienvenido, ${formData.fullName}! Ya puedes marcar asistencia.`);

      onRegistrationComplete(profile);
    } catch (error: any) {
      console.error("Error al registrar estudiante:", error);
      notification.error(`❌ Error al registrar: ${error.message || "Intenta de nuevo"}`);
    }
  };

  const availableCourses = formData.specialty ? getCoursesBySpecialty(formData.specialty) : [];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="card bg-base-200 shadow-xl w-full max-w-3xl">
        <div className="card-body">
          <div className="text-center mb-6">
            <span className="text-6xl mb-4 block">🎓</span>
            <h2 className="card-title text-3xl justify-center mb-2">Registro de Estudiante</h2>
            <p className="text-base-content/70">Completa tu perfil para empezar a marcar asistencia</p>
          </div>

          <div className="alert alert-info mb-4">
            <div className="flex flex-col w-full">
              <span className="font-bold">🔗 Wallet Conectada:</span>
              <code className="text-sm mt-1">{connectedAddress}</code>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <span className="label-text font-semibold">Cédula *</span>
              </label>
              <input
                type="text"
                placeholder="V-25123456"
                className="input input-bordered input-lg"
                value={formData.idCard}
                onChange={e => setFormData({ ...formData, idCard: e.target.value })}
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

          {/* Cursos que Cursa */}
          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text font-semibold">Materias/Cursos que Estás Cursando Actualmente *</span>
              {formData.courses.length > 0 && (
                <span className="label-text-alt badge badge-secondary">{formData.courses.length} seleccionados</span>
              )}
            </label>

            {!formData.specialty ? (
              <div className="alert alert-warning">
                <span className="text-sm">Primero selecciona una especialidad</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 bg-base-300 rounded-lg max-h-64 overflow-y-auto">
                {availableCourses.map(course => {
                  const professorAddress = localStorage.getItem(`course_professor_${course}`);
                  const hasProfessor = !!professorAddress;

                  return (
                    <label
                      key={course}
                      className={`label cursor-pointer justify-start gap-3 ${!hasProfessor ? "opacity-50" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-secondary"
                        checked={formData.courses.includes(course)}
                        onChange={() => handleCourseToggle(course)}
                        disabled={!hasProfessor}
                      />
                      <div className="flex flex-col">
                        <span className="label-text">{course}</span>
                        {!hasProfessor && <span className="text-xs text-warning">⚠️ Sin profesor asignado</span>}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="alert alert-warning mt-4">
            <div className="flex flex-col w-full">
              <span className="font-bold">⚠️ Importante:</span>
              <span className="text-sm mt-1">
                Una vez registrado, NO podrás modificar estos datos. Asegúrate de seleccionar todas las materias que
                estás cursando este semestre.
              </span>
            </div>
          </div>

          <div className="alert alert-success mt-2">
            <div className="flex flex-col w-full">
              <span className="font-bold">ℹ️ ¿Para qué necesitamos esto?</span>
              <ul className="text-sm mt-1 list-disc list-inside">
                <li>Tu profesor verá tu nombre en la lista de asistencia</li>
                <li>Solo podrás marcar asistencia en eventos de tus cursos</li>
                <li>Serás vinculado automáticamente con tus profesores</li>
              </ul>
            </div>
          </div>

          <div className="card-actions justify-center mt-6">
            <button
              className="btn btn-secondary btn-lg w-full"
              onClick={handleRegister}
              disabled={!formData.fullName || !formData.idCard || !formData.specialty || formData.courses.length === 0}
            >
              ✅ Registrarme como Estudiante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
