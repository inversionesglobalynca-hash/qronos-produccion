import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n📚 Desplegando QRonos...");

  await deploy("QRonos", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract
  const qronos = await hre.ethers.getContract<Contract>("QRonos", deployer);

  console.log("\n👨‍🏫 Configurando permisos de profesor...");

  // Lista de cuentas que serán profesores automáticamente
  const professorAccounts = [
    "0x6342E663475E146BF32488BAdfA12202a91eBC13", // Tu cuenta actual
    deployer, // El deployer también será profesor
  ];

  // Agregar cada cuenta como profesor
  for (const account of professorAccounts) {
    try {
      const isProfessor = await qronos.isProfessor(account);

      if (!isProfessor) {
        console.log(`  ➕ Agregando profesor: ${account}`);
        const tx = await qronos.addProfessor(account, {
          gasLimit: 500000, // 500k gas
        });
        await tx.wait();
        console.log(`  ✅ Profesor agregado exitosamente`);
      } else {
        console.log(`  ℹ️  Ya es profesor: ${account}`);
      }
    } catch (error) {
      console.log(`  ⚠️  Error al agregar ${account}:`, error);
    }
  }

  console.log("\n✅ QRonos desplegado y configurado exitosamente!");
  console.log("📍 Dirección del contrato:", await qronos.getAddress());
};

export default deployYourContract;

deployYourContract.tags = ["QRonos"];
