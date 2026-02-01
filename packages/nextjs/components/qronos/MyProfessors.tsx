"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

interface ProfessorInfo {
  course: string;
  professorAddress: string;
  professorName: string;
  professorSpecialty: string;
}

export const MyProfessors = () => {
  const { address } = useAccount();
  const [professors, setProfessors] = useState<ProfessorInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;

    const loadProfessors = () => {
      // Obtener perfil del estudiante
      const studentProfile = localStorage.getItem(`student_${address}`);

      if (!studentProfile) {
        setLoading(false);
        return;
      }

      const student = JSON.parse(studentProfile);
      const professorList: ProfessorInfo[] = [];

      // Por cada curso del estudiante, buscar su profesor
      student.courses.forEach((course: string) => {
        const professorAddress = localStorage.getItem(`course_professor_${course}`);

        if (professorAddress) {
          const professorProfile = localStorage.getItem(`professor_${professorAddress}`);

          if (professorProfile) {
            const professor = JSON.parse(professorProfile);
            professorList.push({
              course,
              professorAddress,
              professorName: professor.fullName,
              professorSpecialty: professor.specialty,
            });
          } else {
            professorList.push({
              course,
              professorAddress,
              professorName: "No registrado",
              professorSpecialty: "-",
            });
          }
        }
      });

      setProfessors(professorList);
      setLoading(false);
    };

    loadProfessors();
  }, [address]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (professors.length === 0) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">👨‍🏫 Mis Profesores</h2>
          <div className="alert alert-warning">
            <span>
              No tienes profesores asignados aún. Los cursos que seleccionaste no tienen profesores registrados.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">👨‍🏫 Mis Profesores</h2>

        <div className="stats shadow mb-4">
          <div className="stat">
            <div className="stat-figure text-primary">
              <span className="text-4xl">📚</span>
            </div>
            <div className="stat-title">Total de Cursos</div>
            <div className="stat-value text-primary">{professors.length}</div>
            <div className="stat-desc">Con profesores asignados</div>
          </div>
        </div>

        <div className="space-y-4">
          {professors.map((prof, index) => (
            <div key={index} className="card bg-base-200 shadow">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-12">
                      <span className="text-xl">👨‍🏫</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{prof.course}</h3>
                    <p className="text-sm opacity-70">{prof.professorSpecialty}</p>
                    <div className="divider my-2"></div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Profesor:</span>
                        <span className="text-sm">{prof.professorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Wallet:</span>
                        <code className="text-xs bg-base-300 px-2 py-1 rounded">
                          {prof.professorAddress.slice(0, 6)}...{prof.professorAddress.slice(-4)}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="alert alert-info mt-4">
          <div className="flex flex-col w-full">
            <span className="font-bold text-sm">ℹ️ Información:</span>
            <span className="text-xs mt-1">
              Solo podrás marcar asistencia en eventos creados por estos profesores para los cursos correspondientes.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
