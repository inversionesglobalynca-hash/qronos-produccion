import hre from "hardhat";

async function main() {
  console.log("🎓 Agregando profesor al contrato QRonos...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Usando cuenta:", deployer.address);

  // Get contract address from deployments
  const deployments = await hre.deployments.all();
  const qronosAddress = deployments.QRonos.address;
  console.log("📍 Contrato QRonos:", qronosAddress);

  // Get contract instance
  const QRonos = await hre.ethers.getContractAt("QRonos", qronosAddress);

  // Address to add as professor
  const professorAddress = "0x6342E663475E146BF32488BAdfA12202a91eBC13";
  console.log("👨‍🏫 Agregando profesor:", professorAddress);

  // Check if already professor
  const wasAlreadyProfessor = await QRonos.isProfessor(professorAddress);
  console.log("🔍 Ya era profesor antes:", wasAlreadyProfessor);

  if (!wasAlreadyProfessor) {
    // Add professor
    const tx = await QRonos.addProfessor(professorAddress, {
      gasLimit: 500000, // 500k gas es más que suficiente
    });
    console.log("⏳ Transacción enviada:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ Transacción confirmada en bloque:", receipt?.blockNumber || "desconocido");

    // Verify
    const isProfessor = await QRonos.isProfessor(professorAddress);
    console.log("🔍 Verificación - Es profesor ahora:", isProfessor);

    if (isProfessor) {
      console.log("🎉 ¡Profesor agregado exitosamente!");
    } else {
      console.log("❌ Error: No se pudo agregar como profesor");
    }
  } else {
    console.log("ℹ️ La dirección ya tiene el rol de profesor");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
