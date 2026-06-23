// Copy this into the official Zama FHEVM Hardhat template scripts folder.
// Replace wallet addresses with your real PUBLIC addresses.
import { ethers } from "hardhat";

async function main() {
  const initialManagers = [
    "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000002",
  ];

  const initialTechnicians = [
    "0x0000000000000000000000000000000000000011",
    "0x0000000000000000000000000000000000000012",
    "0x0000000000000000000000000000000000000013",
    "0x0000000000000000000000000000000000000014",
    "0x0000000000000000000000000000000000000015",
  ];

  const MaintShield = await ethers.getContractFactory("MaintShieldFHE");
  const maintShield = await MaintShield.deploy(initialManagers, initialTechnicians);
  await maintShield.waitForDeployment();

  console.log("MaintShieldFHE deployed to:", await maintShield.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
