"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

interface StudentInfo {
  address: string;
  fullName: string;
  idCard: string;
  enrolledAt: string;
}

interface CourseStudents {
  course: string;
  students: StudentInfo[];
}

export const MyStudents = () => {
  const { address } = useAccount();
  const [coursesList, setCoursesList] = useState<CourseStudents[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    const loadStudents = () => {
      // Obtener perfil del profesor
      const professorProfile = localStorage.getItem(`professor_${address}`);

      if (!professorProfile) {
        setLoading(false);
        return;
      }

      const professor = JSON.parse(professorProfile);
      const courses: CourseStudents[] = [];

      // Por cada curso del profesor, buscar sus estudiantes
      professor.courses.forEach((course: string) => {
        const studentsKey = `course_students_${course}`;
        const studentsData = localStorage.getItem(studentsKey);

        const students: StudentInfo[] = studentsData ? JSON.parse(studentsData) : [];

        courses.push({
          course,
          students,
        });
      });

      setCoursesList(courses);
      setLoading(false);

      // Seleccionar el primer curso por defecto
      if (courses.length > 0) {
        setSelectedCourse(courses[0].course);
      }
    };

    loadStudents();
  }, [address]);

  const handleExportCSV = (course: string, students: StudentInfo[]) => {
    const csv = [
      `Lista de Estudiantes - ${course}`,
      `Fecha: ${new Date().toLocaleDateString()}`,
      "",
      "N°,Nombre Completo,Cédula,Dirección Wallet,Fecha de Inscripción",
      ...students.map(
        (student, index) =>
          `${index + 1},${student.fullName},${student.idCard},${student.address},${new Date(student.enrolledAt).toLocaleDateString()}`,
      ),
      "",
      `Total de Estudiantes: ${students.length}`,
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `estudiantes_${course.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const totalStudents = coursesList.reduce((sum, course) => sum + course.students.length, 0);
  const selectedCourseData = coursesList.find(c => c.course === selectedCourse);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">🎓 Mis Estudiantes</h2>

        {/* Stats */}
        <div className="stats shadow mb-4 w-full">
          <div className="stat">
            <div className="stat-figure text-primary">
              <span className="text-4xl">📚</span>
            </div>
            <div className="stat-title">Total de Cursos</div>
            <div className="stat-value text-primary">{coursesList.length}</div>
            <div className="stat-desc">Que impartes</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-secondary">
              <span className="text-4xl">🎓</span>
            </div>
            <div className="stat-title">Total de Estudiantes</div>
            <div className="stat-value text-secondary">{totalStudents}</div>
            <div className="stat-desc">Inscritos en tus cursos</div>
          </div>
        </div>

        {/* Course Selector */}
        {coursesList.length > 0 && (
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Selecciona un Curso:</span>
            </label>
            <select
              className="select select-bordered select-lg"
              value={selectedCourse || ""}
              onChange={e => setSelectedCourse(e.target.value)}
            >
              {coursesList.map(course => (
                <option key={course.course} value={course.course}>
                  {course.course} ({course.students.length} estudiantes)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Students List */}
        {selectedCourseData && selectedCourseData.students.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre Completo</th>
                    <th>Cédula</th>
                    <th>Dirección Wallet</th>
                    <th>Inscrito</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCourseData.students.map((student, index) => (
                    <tr key={student.address}>
                      <td>{index + 1}</td>
                      <td className="font-semibold">{student.fullName}</td>
                      <td className="font-mono text-sm">{student.idCard}</td>
                      <td>
                        <code className="text-xs bg-base-300 px-2 py-1 rounded">
                          {student.address.slice(0, 6)}...{student.address.slice(-4)}
                        </code>
                      </td>
                      <td className="text-sm">{new Date(student.enrolledAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                className="btn btn-primary"
                onClick={() =>
                  selectedCourseData && handleExportCSV(selectedCourseData.course, selectedCourseData.students)
                }
              >
                📥 Exportar CSV
              </button>
            </div>
          </>
        ) : selectedCourseData ? (
          <div className="alert alert-warning">
            <span>Aún no hay estudiantes inscritos en {selectedCourseData.course}</span>
          </div>
        ) : (
          <div className="alert alert-info">
            <span>Selecciona un curso para ver tus estudiantes</span>
          </div>
        )}

        {coursesList.length === 0 && (
          <div className="alert alert-warning">
            <span>No tienes cursos asignados aún.</span>
          </div>
        )}
      </div>
    </div>
  );
};
