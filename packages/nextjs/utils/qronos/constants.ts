// Especialidades y Materias del Sistema QRonos

export const SPECIALTIES = {
  INFORMATICA: "Informática",
  ELECTRICIDAD: "Electricidad",
  ADMINISTRACION: "Administración",
} as const;

export const COURSES_BY_SPECIALTY = {
  Informática: [
    "Programación Web",
    "Base de Datos",
    "Redes de Computadoras",
    "Sistemas Operativos",
    "Desarrollo Móvil",
    "Ingeniería de Software",
    "Inteligencia Artificial",
    "Seguridad Informática",
  ],
  Electricidad: [
    "Circuitos Eléctricos",
    "Electrónica Analógica",
    "Electrónica Digital",
    "Máquinas Eléctricas",
    "Sistemas de Potencia",
    "Control Automático",
    "Instalaciones Eléctricas",
    "Energías Renovables",
  ],
  Administración: [
    "Contabilidad General",
    "Gestión Empresarial",
    "Marketing Digital",
    "Finanzas Corporativas",
    "Recursos Humanos",
    "Emprendimiento",
    "Administración de Proyectos",
    "Economía Empresarial",
  ],
};

export const SPECIALTIES_LIST = Object.values(SPECIALTIES);

export type Specialty = (typeof SPECIALTIES)[keyof typeof SPECIALTIES];
export type Course = string;

// Función helper para obtener cursos de una especialidad
export const getCoursesBySpecialty = (specialty: string): string[] => {
  return COURSES_BY_SPECIALTY[specialty as keyof typeof COURSES_BY_SPECIALTY] || [];
};

// Validar si una combinación especialidad-curso es válida
export const isValidCombination = (specialty: string, course: string): boolean => {
  const courses = getCoursesBySpecialty(specialty);
  return courses.includes(course);
};
