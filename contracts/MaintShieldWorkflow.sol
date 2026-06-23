// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Standard Solidity workflow contract for local/sepolia dry-run.
/// @dev This contract stores only a bytes32 reward handle, not plaintext reward.
///      Use MaintShieldFHE.sol in Zama FHEVM template for real encrypted reward values.
contract MaintShieldWorkflow {
    enum Status { Open, Submitted, Approved, RewardAssigned }

    struct Task {
        uint256 id;
        string title;
        string equipmentCode;
        address technician;
        Status status;
        bytes32 encryptedRewardHandle;
    }

    address public owner;
    uint256 public nextTaskId = 1;
    mapping(address => bool) public managers;
    mapping(address => bool) public technicians;
    mapping(uint256 => Task) public tasks;

    event ManagerAdded(address indexed wallet);
    event TechnicianAdded(address indexed wallet);
    event TaskCreated(uint256 indexed taskId, address indexed technician, string title, string equipmentCode);
    event TaskSubmitted(uint256 indexed taskId, address indexed technician);
    event TaskApproved(uint256 indexed taskId, address indexed manager);
    event RewardAssigned(uint256 indexed taskId, bytes32 encryptedRewardHandle);

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
        tasks[taskId] = Task(taskId, title, equipmentCode, technician, Status.Open, bytes32(0));
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

    function assignRewardHandle(uint256 taskId, bytes32 encryptedRewardHandle) external onlyManager {
        require(tasks[taskId].status == Status.Approved, "Task not approved");
        require(encryptedRewardHandle != bytes32(0), "Empty handle");
        tasks[taskId].encryptedRewardHandle = encryptedRewardHandle;
        tasks[taskId].status = Status.RewardAssigned;
        emit RewardAssigned(taskId, encryptedRewardHandle);
    }
}
