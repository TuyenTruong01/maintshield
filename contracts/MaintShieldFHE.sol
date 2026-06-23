// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Copy this file into the official Zama fhevm-hardhat-template.
// Exact package names may follow the template version. If imports fail,
// use the import paths from your cloned Zama template.
import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @notice Zama/FHE version for Builder Track: public maintenance workflow, private reward/KPI.
contract MaintShieldFHE is SepoliaConfig {
    enum Status { Open, Submitted, Approved, RewardAssigned }

    struct TaskPublic {
        uint256 id;
        string title;
        string equipmentCode;
        address technician;
        Status status;
    }

    address public owner;
    uint256 public nextTaskId = 1;
    mapping(address => bool) public managers;
    mapping(address => bool) public technicians;
    mapping(uint256 => TaskPublic) public tasks;
    mapping(uint256 => euint64) private encryptedRewards;

    event ManagerAdded(address indexed wallet);
    event TechnicianAdded(address indexed wallet);
    event TaskCreated(uint256 indexed taskId, address indexed technician, string title, string equipmentCode);
    event TaskSubmitted(uint256 indexed taskId, address indexed technician);
    event TaskApproved(uint256 indexed taskId, address indexed manager);
    event ConfidentialRewardAssigned(uint256 indexed taskId, address indexed technician);

    modifier onlyManager() {
        require(managers[msg.sender], "Only manager");
        _;
    }

    modifier onlyAssignedTechnician(uint256 taskId) {
        require(tasks[taskId].technician == msg.sender, "Not assigned technician");
        require(technicians[msg.sender], "Not whitelisted technician");
        _;
    }

    constructor(address[] memory initialManagers, address[] memory initialTechnicians) {
        owner = msg.sender;
        managers[msg.sender] = true;
        emit ManagerAdded(msg.sender);

        for (uint256 i = 0; i < initialManagers.length; i++) {
            managers[initialManagers[i]] = true;
            emit ManagerAdded(initialManagers[i]);
        }
        for (uint256 i = 0; i < initialTechnicians.length; i++) {
            technicians[initialTechnicians[i]] = true;
            emit TechnicianAdded(initialTechnicians[i]);
        }
    }

    function addManager(address wallet) external onlyManager {
        require(wallet != address(0), "Zero wallet");
        managers[wallet] = true;
        emit ManagerAdded(wallet);
    }

    function addTechnician(address wallet) external onlyManager {
        require(wallet != address(0), "Zero wallet");
        technicians[wallet] = true;
        emit TechnicianAdded(wallet);
    }

    function createTask(string calldata title, string calldata equipmentCode, address technician) external onlyManager returns (uint256 taskId) {
        require(technicians[technician], "Technician not whitelisted");
        taskId = nextTaskId++;
        tasks[taskId] = TaskPublic(taskId, title, equipmentCode, technician, Status.Open);
        emit TaskCreated(taskId, technician, title, equipmentCode);
    }

    function submitTask(uint256 taskId) external onlyAssignedTechnician(taskId) {
        require(tasks[taskId].status == Status.Open, "Task not open");
        tasks[taskId].status = Status.Submitted;
        emit TaskSubmitted(taskId, msg.sender);
    }

    function approveTask(uint256 taskId) external onlyManager {
        require(tasks[taskId].status == Status.Submitted, "Task not submitted");
        tasks[taskId].status = Status.Approved;
        emit TaskApproved(taskId, msg.sender);
    }

    /// @notice Manager assigns confidential reward after approval.
    /// @dev Frontend encrypts reward with Relayer SDK and sends externalEuint64 + inputProof.
    function assignConfidentialReward(uint256 taskId, externalEuint64 encryptedReward, bytes calldata inputProof) external onlyManager {
        require(tasks[taskId].status == Status.Approved, "Task not approved");

        euint64 reward = FHE.fromExternal(encryptedReward, inputProof);
        encryptedRewards[taskId] = reward;
        tasks[taskId].status = Status.RewardAssigned;

        // Permissions: contract can keep using it, technician can user-decrypt it,
        // and manager who assigned it can also decrypt for audit/demo.
        FHE.allowThis(encryptedRewards[taskId]);
        FHE.allow(encryptedRewards[taskId], tasks[taskId].technician);
        FHE.allow(encryptedRewards[taskId], msg.sender);

        emit ConfidentialRewardAssigned(taskId, tasks[taskId].technician);
    }

    function getEncryptedReward(uint256 taskId) external view returns (euint64) {
        require(msg.sender == tasks[taskId].technician || managers[msg.sender], "Not allowed");
        return encryptedRewards[taskId];
    }
}
