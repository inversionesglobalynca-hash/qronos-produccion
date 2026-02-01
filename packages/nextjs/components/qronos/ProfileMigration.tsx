"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

export const ProfileMigration = () => {
  const { address } = useAccount();

  useEffect(() => {
    if (!address) return;

    const profileKey = `professor_${address}`;
    const storedProfile = localStorage.getItem(profileKey);

    if (!storedProfile) return;

    try {
      const profile = JSON.parse(storedProfile);

      // Detectar perfil antiguo (tiene 'course' en lugar de 'courses')
      if (profile.course && !profile.courses) {
        console.log("🔄 Migrando perfil antiguo a nuevo formato...");

        // Migrar a nuevo formato
        const updatedProfile = {
          ...profile,
          courses: [profile.course], // Convertir string a array
        };

        // Eliminar campo antiguo
        delete updatedProfile.course;

        // Guardar perfil actualizado
        localStorage.setItem(profileKey, JSON.stringify(updatedProfile));

        // Indexar el curso
        const indexKey = `course_professor_${updatedProfile.courses[0]}`;
        localStorage.setItem(indexKey, address);

        console.log("✅ Perfil migrado exitosamente:", updatedProfile);
        notification.success("✅ Tu perfil fue actualizado al nuevo formato");
      }
    } catch (error) {
      console.error("Error al migrar perfil:", error);
    }
  }, [address]);

  return null; // No renderiza nada
};
