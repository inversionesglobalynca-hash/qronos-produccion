// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title QRonos - MVP Demo Version
 * @dev Sistema de certificación de asistencia con QR dinámico y POAPs
 * @notice Versión 1.0 para demo - Validación de firma desactivada temporalmente
 */
contract QRonos is ERC1155, AccessControl {
    
    bytes32 public constant PROFESSOR_ROLE = keccak256("PROFESSOR_ROLE");
    uint256 public constant QR_VALIDITY_WINDOW = 15;
    
    struct ClassEvent {
        uint256 eventId;
        string courseName;
        string courseCode;
        address professor;
        uint256 eventTimestamp;
        uint256 maxAttendees;
        uint256 currentAttendees;
        bool isActive;
        string metadata;
        uint256 startTime;
        uint256 endTime;
    }
    
    uint256 public eventCounter;
    mapping(uint256 => ClassEvent) public events;
    mapping(uint256 => mapping(address => bool)) public hasAttended;
    mapping(uint256 => mapping(address => uint256)) public attendanceTimestamp;
    mapping(address => uint256[]) public studentEvents;
    
    event EventCreated(uint256 indexed eventId, string courseName, address indexed professor, uint256 startTime, uint256 endTime);
    event AttendanceMarked(uint256 indexed eventId, address indexed student, uint256 timestamp);
    event ProfessorAdded(address indexed professor);
    event EventClosed(uint256 indexed eventId);
    
    constructor() ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROFESSOR_ROLE, msg.sender);
    }
    
    function createClassEvent(
        string memory _courseName,
        string memory _courseCode,
        uint256 _maxAttendees,
        string memory _metadata,
        uint256 _durationMinutes
    ) external onlyRole(PROFESSOR_ROLE) returns (uint256) {
        require(_maxAttendees > 0, "Cupo debe ser mayor a 0");
        require(_durationMinutes > 0, "Duracion debe ser mayor a 0");
        
        uint256 eventId = eventCounter;
        eventCounter++;
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + (_durationMinutes * 1 minutes);
        
        events[eventId] = ClassEvent({
            eventId: eventId,
            courseName: _courseName,
            courseCode: _courseCode,
            professor: msg.sender,
            eventTimestamp: block.timestamp,
            maxAttendees: _maxAttendees,
            currentAttendees: 0,
            isActive: true,
            metadata: _metadata,
            startTime: startTime,
            endTime: endTime
        });
        
        emit EventCreated(eventId, _courseName, msg.sender, startTime, endTime);
        return eventId;
    }
    
    /**
     * @notice Marcar asistencia - VERSIÓN DEMO (sin validación de firma)
     * @dev Para producción (v2.0), reactivar validación de firma criptográfica
     */
    function markAttendanceWithQR(
        uint256 _eventId,
        uint256  /* _qrTimestamp */,
        bytes memory /* _signature */
    ) external {
        ClassEvent storage classEvent = events[_eventId];
        
        // Validación 1: Evento existe y está activo
        require(classEvent.eventId == _eventId, "Evento no existe");
        require(classEvent.isActive, "Evento no activo");
        
        // Validación 2: No ha asistido antes
        require(!hasAttended[_eventId][msg.sender], "Ya registraste asistencia");
        
        // Validación 3: Dentro del horario de clase
        require(block.timestamp >= classEvent.startTime, "La clase aun no comienza");
        require(block.timestamp <= classEvent.endTime, "La clase ya termino");
        
        // Validación 4: Cupo disponible
        require(classEvent.currentAttendees < classEvent.maxAttendees, "Cupo lleno");
        
        // NOTA: Validación de firma desactivada para MVP v1.0
        // TODO v2.0: Reactivar verificación criptográfica de firma del profesor
        
        // Registrar asistencia
        hasAttended[_eventId][msg.sender] = true;
        attendanceTimestamp[_eventId][msg.sender] = block.timestamp;
        classEvent.currentAttendees++;
        studentEvents[msg.sender].push(_eventId);
        
        // Mintear POAP (NFT de asistencia)
        _mint(msg.sender, _eventId, 1, "");
        
        emit AttendanceMarked(_eventId, msg.sender, block.timestamp);
    }
    
    function closeEvent(uint256 _eventId) external {
        ClassEvent storage classEvent = events[_eventId];
        require(
            msg.sender == classEvent.professor || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "No autorizado"
        );
        classEvent.isActive = false;
        emit EventClosed(_eventId);
    }
    
    function autoCloseEvent(uint256 _eventId) external {
        ClassEvent storage classEvent = events[_eventId];
        require(block.timestamp > classEvent.endTime, "Evento aun activo");
        classEvent.isActive = false;
        emit EventClosed(_eventId);
    }
    
    function verifyAttendance(uint256 _eventId, address _student)
        external
        view
        returns (bool attended, uint256 timestamp)
    {
        return (hasAttended[_eventId][_student], attendanceTimestamp[_eventId][_student]);
    }
    
    function getStudentEvents(address _student) external view returns (uint256[] memory) {
        return studentEvents[_student];
    }
    
    function getEventDetails(uint256 _eventId)
        external
        view
        returns (
            string memory courseName,
            string memory courseCode,
            address professor,
            uint256 currentAttendees,
            uint256 maxAttendees,
            bool isActive,
            uint256 startTime,
            uint256 endTime
        )
    {
        ClassEvent storage e = events[_eventId];
        return (e.courseName, e.courseCode, e.professor, e.currentAttendees, e.maxAttendees, e.isActive, e.startTime, e.endTime);
    }
    
    function getTotalEvents() external view returns (uint256) {
        return eventCounter;
    }
    
    function addProfessor(address _professor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(PROFESSOR_ROLE, _professor);
        emit ProfessorAdded(_professor);
    }
    
    function isProfessor(address _address) external view returns (bool) {
        return hasRole(PROFESSOR_ROLE, _address);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    function uri(uint256 _eventId) public view override returns (string memory) {
        return events[_eventId].metadata;
    }
}