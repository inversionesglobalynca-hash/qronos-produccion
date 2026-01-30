# 🎓 QRonos - Sistema de Certificación de Asistencia Universitaria

![Solidity](https://img.shields.io/badge/Solidity-0.8.30-363636?style=flat-square&logo=solidity)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Sepolia](https://img.shields.io/badge/Network-Sepolia-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

Sistema descentralizado de registro de asistencia universitaria con QR dinámico y certificados NFT (POAPs) verificables en blockchain.

---

## 🌟 Características Principales

### ✅ Smart Contract Robusto
- **6 capas de validación** de seguridad
- **Control de eventos** con cupos y horarios
- **Sistema de roles** (Administrador/Profesor)
- **Validación de identidad** (doble asistencia, QR expirado)
- **POAPs (NFTs)** como certificados verificables

### ✅ Dashboard del Profesor
- Creación de eventos de clase
- **QR dinámico** con actualización automática (15 segundos)
- Contador visual en tiempo real
- Estadísticas de asistencia
- Botón copiar JSON para testing

### ✅ Dashboard del Estudiante
- **Scanner de cámara QR** con selector de múltiples dispositivos
- Detección automática de códigos QR
- Modo manual (backup sin cámara)
- Visualización de POAPs coleccionados
- Historial de asistencias

---

## 🚀 Deployment en Producción (v1.0)

### **Smart Contract Desplegado:**
```
Red: Sepolia Testnet
Dirección: 0x86f3FdE05CbbffA1Ce31129368994AC965bba914
ChainID: 11155111
Etherscan: https://sepolia.etherscan.io/address/0x86f3FdE05CbbffA1Ce31129368994AC965bba914
```

### **Estado:**
- ✅ Código verificado públicamente
- ✅ Auditable en Etherscan
- ✅ Listo para uso en producción

---

## 🛠️ Stack Tecnológico

### **Blockchain**
- **Solidity 0.8.30** - Smart contracts
- **Hardhat** - Desarrollo y testing
- **OpenZeppelin** - Librerías de seguridad (ERC1155, AccessControl)
- **Ethers.js** - Interacción Web3

### **Frontend**
- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **TailwindCSS + DaisyUI** - Diseño UI
- **Wagmi + Viem** - Hooks Web3
- **@yudiel/react-qr-scanner** - Scanner de cámara

### **Infraestructura**
- **Alchemy** - RPC Provider (Sepolia)
- **Scaffold-ETH 2** - Boilerplate Web3
- **Vercel** - Hosting del frontend

---

## 📦 Instalación y Configuración

### **Requisitos:**
- Node.js >= 18
- Yarn
- Wallet (MetaMask/Rabby) con SepoliaETH

### **Clonar el repositorio:**
```bash
git clone https://github.com/inversionesglobalynca-hash/qronos-produccion.git
cd qronos-produccion
```

### **Instalar dependencias:**
```bash
yarn install
```

### **Configurar variables de entorno:**

Crea un archivo `.env` en `packages/hardhat/`:
```env
ALCHEMY_API_KEY=tu_api_key_de_alchemy
DEPLOYER_PRIVATE_KEY=0xtu_private_key
__RUNTIME_DEPLOYER_PRIVATE_KEY=0xtu_private_key
ETHERSCAN_API_KEY=tu_etherscan_api_key
```

⚠️ **NUNCA subas el archivo `.env` a GitHub**

---

## 🧪 Testing Local

### **Terminal 1: Blockchain Local**
```bash
yarn chain
```

### **Terminal 2: Deploy Contratos**
```bash
yarn deploy
```

### **Terminal 3: Frontend**
```bash
yarn start
```

Abre: `http://localhost:3000`

---

## 🌐 Deploy en Sepolia

### **1. Deploy del Smart Contract:**
```bash
cd packages/hardhat
yarn deploy --network sepolia
```

### **2. Verificar en Etherscan:**
```bash
yarn verify --network sepolia
```

---

## 📖 Uso del Sistema

### **Como Profesor:**

1. Selecciona rol "👨‍🏫 Profesor"
2. Crea un evento (nombre, código, cupo, duración)
3. Activa el QR dinámico
4. Comparte el QR (proyector/pantalla)
5. Monitorea asistencias en tiempo real

### **Como Estudiante:**

1. Selecciona rol "🎓 Estudiante"
2. Activa la cámara o usa modo manual
3. Escanea el QR del profesor
4. Marca tu asistencia
5. Visualiza tu POAP (certificado NFT)

---

## 🔒 Seguridad

### **Validaciones del Smart Contract (v1.0):**

1. ✅ Evento existe y está activo
2. ✅ No ha asistido previamente
3. ✅ Dentro del horario de clase
4. ✅ Cupo disponible
5. ✅ Prevención de replay attacks

**Nota v1.0:** Validación de firma criptográfica desactivada temporalmente para MVP. Se reactivará en v2.0.

### **Buenas Prácticas:**

- Private keys encriptadas localmente
- Variables de entorno no versionadas
- Código verificado públicamente
- Testing exhaustivo

---

## 🎯 Roadmap - Versión 2.0

### **Mejoras Planificadas:**

#### **🔐 Seguridad**
- [ ] Reactivar validación criptográfica de firmas
- [ ] Sistema anti-suplantación avanzado
- [ ] Rate limiting en QR generation
- [ ] Auditoría de seguridad profesional

#### **📱 Funcionalidades**
- [ ] App móvil nativa (React Native)
- [ ] Notificaciones push
- [ ] Exportación de reportes PDF
- [ ] Dashboard de administración

#### **🎨 UX/UI**
- [ ] Metadata de POAPs con imágenes personalizadas
- [ ] Animaciones de feedback mejoradas
- [ ] Modo offline con sincronización
- [ ] Tema claro/oscuro

#### **🌐 Infraestructura**
- [ ] Deploy en mainnet (Ethereum/Polygon)
- [ ] IPFS para metadata
- [ ] Integración con sistemas universitarios
- [ ] API REST para terceros

#### **📊 Analytics**
- [ ] Dashboard de estadísticas avanzadas
- [ ] Reportes de asistencia automáticos
- [ ] Gráficos y visualizaciones
- [ ] Exportación de datos

---

## 👨‍💻 Desarrollo

### **Estructura del Proyecto:**
```
qronos-produccion/
├── packages/
│   ├── hardhat/              # Smart contracts
│   │   ├── contracts/
│   │   │   └── QRonos.sol
│   │   ├── deploy/
│   │   └── test/
│   └── nextjs/               # Frontend
│       ├── app/
│       ├── components/
│       │   └── qronos/
│       │       ├── ProfessorDashboard.tsx
│       │       ├── StudentDashboard.tsx
│       │       └── QRScanner.tsx
│       └── contracts/
└── README.md
```

---

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

---

## 👤 Autora

**Niurka Oropeza**
- Maestría en Informática - UPT Aragua Dr. Federico Brito Figueroa
- Especialización: Desarrollo de Software
---

## 🎓 Caso de Uso Académico

Este proyecto fue desarrollado como parte del curso de Desarrollo de Aplicaciones Descentralizadas (dApps) en la Maestría de Informática, mención Desarrollo de Software. UPTA, Venezuela.

**Objetivo:** Demostrar el potencial de la tecnología blockchain para resolver problemas reales en instituciones educativas, específicamente el registro transparente e inmutable de asistencia estudiantil.

---

_Última actualización: Enero 30, 2026_