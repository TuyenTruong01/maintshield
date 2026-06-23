# MaintShield deployment guide — Zama + Sepolia

This is the intended real deployment flow for Zama Builder Track.

## 0. Do not use seed phrase

You do not need seed phrase.
Use only a private key of a fresh Sepolia-only wallet in your local `.env`.
Never upload `.env` to GitHub.

## 1. Prepare wallet

1. Create a new MetaMask wallet/account for Sepolia testing.
2. Add Sepolia network.
3. Get Sepolia ETH from faucet.
4. Export the private key of this Sepolia-only account.

## 2. Clone the Zama FHEVM Hardhat template

Follow the current Zama Quick Start and Hardhat template instructions from official docs.

General idea:

```bash
git clone <official-zama-fhevm-hardhat-template-url> maintshield-fhe-contract
cd maintshield-fhe-contract
npm install
```

## 3. Copy contract

Copy this file from the frontend project:

```text
contracts/MaintShieldFHE.sol
```

into the Zama template:

```text
maintshield-fhe-contract/contracts/MaintShieldFHE.sol
```

## 4. Create deploy script

Create:

```text
scripts/deploy-maintshield.ts
```

Pseudo-code:

```ts
import { ethers } from "hardhat";

async function main() {
  const managers = [
    "0xManager1...",
    "0xManager2..."
  ];

  const technicians = [
    "0xTech1...",
    "0xTech2...",
    "0xTech3...",
    "0xTech4...",
    "0xTech5..."
  ];

  const MaintShield = await ethers.getContractFactory("MaintShieldFHE");
  const contract = await MaintShield.deploy(managers, technicians);
  await contract.waitForDeployment();

  console.log("MaintShieldFHE deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

## 5. Set `.env` in Zama contract project

Example only:

```env
PRIVATE_KEY=your_fresh_sepolia_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

Use the exact variable names required by the current Zama template.

## 6. Compile and deploy

```bash
npx hardhat compile
npx hardhat run scripts/deploy-maintshield.ts --network sepolia
```

Copy the contract address.

## 7. Configure frontend

In the frontend project `.env`:

```env
VITE_APP_MODE=contract
VITE_CONTRACT_ADDRESS=0xYourDeployedMaintShieldFHE
VITE_INITIAL_MANAGERS=0xManager1...,0xManager2...
VITE_INITIAL_TECHNICIANS=0xTech1...,0xTech2...,0xTech3...,0xTech4...,0xTech5...
```

Restart:

```bash
npm run dev
```

## 8. Real encryption/decryption step

For the final Builder Track version, integrate Zama Relayer SDK in the frontend:

- Initialize Relayer SDK.
- Encrypt the reward amount as `externalEuint64`.
- Send `externalEuint64` and `inputProof` to `assignConfidentialReward(...)`.
- Use user decryption so only the assigned technician can decrypt the reward.

## 9. Deploy frontend to Vercel

```bash
git init
git add .
git commit -m "MaintShield Zama Builder Track MVP v3"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/maintshield.git
git push -u origin main
```

Then import the repo into Vercel and set the same `VITE_...` environment variables in Vercel.
