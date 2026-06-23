# MaintShield — Zama Builder Track MVP v3

MaintShield is a confidential reward layer for maintenance teams.

Public workflow:
- Manager creates a maintenance task.
- Manager assigns it only to a whitelisted technician wallet.
- Technician submits completion.
- Manager approves after real-world verification.

Private data:
- Reward amount
- KPI score
- Bonus points

The v3 frontend can connect MetaMask and classify the connected wallet as Owner / Manager / Technician / Guest based on public wallet addresses in the whitelist.

## Important security note

Never share seed phrase.
Never paste seed phrase into this app.
Never upload private key to GitHub.
Use a fresh Sepolia-only wallet for deployment.

## Run frontend

```bash
cd maintshield-zama-builder-v3
npm install
npm run dev
```

Open the local URL shown by Vite, normally:

```text
http://localhost:5173
```

## Configure your 2 manager wallets and 5 technician wallets

Open `.env.example`, copy it to `.env`, then put PUBLIC wallet addresses only:

```bash
cp .env.example .env
```

Example:

```env
VITE_INITIAL_MANAGERS=0xManager1...,0xManager2...
VITE_INITIAL_TECHNICIANS=0xTech1...,0xTech2...,0xTech3...,0xTech4...,0xTech5...
VITE_APP_MODE=demo
```

Restart Vite after changing `.env`:

```bash
npm run dev
```

## Frontend modes

### 1. Demo mode

```env
VITE_APP_MODE=demo
```

This mode:
- Connects real MetaMask wallet.
- Checks role based on whitelist.
- Requires MetaMask signature for actions.
- Stores task state in browser `localStorage`.
- Good for UI testing and video flow rehearsal.

### 2. Contract mode

```env
VITE_APP_MODE=contract
VITE_CONTRACT_ADDRESS=0xYourSepoliaContract
```

This mode sends transactions to the contract address.
For full Zama encrypted reward, connect the frontend to the Zama Relayer SDK encryption/decryption flow.

## Contracts included

### `contracts/MaintShieldWorkflow.sol`

A normal Solidity workflow contract for dry-run and basic Sepolia tests. It does not store plaintext reward; it stores a `bytes32 encryptedRewardHandle` placeholder.

### `contracts/MaintShieldFHE.sol`

The Zama/FHEVM version. Copy this into the official Zama FHEVM Hardhat template. It uses:

- `externalEuint64 encryptedReward`
- `bytes inputProof`
- `FHE.fromExternal(...)`
- `FHE.allowThis(...)`
- `FHE.allow(..., technician)`

This is the contract direction for Builder Track, because Zama encrypted inputs keep sensitive values confidential and user decryption allows only authorized users to decrypt their own encrypted values.

## Real Builder Track deployment flow

1. Create a fresh MetaMask wallet for Sepolia testnet.
2. Get Sepolia ETH from a faucet.
3. Clone the official Zama FHEVM Hardhat template.
4. Copy `contracts/MaintShieldFHE.sol` into the template `contracts/` folder.
5. Add your manager and technician addresses to the deploy script.
6. Compile.
7. Deploy to Sepolia.
8. Copy deployed contract address into frontend `.env`.
9. Connect Relayer SDK in frontend for real reward encryption/decryption.
10. Deploy frontend to Vercel.
11. Record a real-person 3-minute pitch video.
12. Publish X thread/article.
13. Submit Zama Builder Track form.

## Demo story

> Maintenance work is visible. Rewards and KPI values are private.

Demo sequence:

1. Connect Manager wallet.
2. Add another manager wallet.
3. Add 5 technician wallets to whitelist.
4. Create task: `Fix V131 leaking valve`.
5. Assign task to one whitelisted technician.
6. Connect technician wallet.
7. Technician submits completed work.
8. Connect manager wallet.
9. Manager approves after verification.
10. Manager assigns confidential reward.
11. Connect technician wallet.
12. Technician decrypts own reward.
13. Guest wallet cannot operate or decrypt.

## v3.2 update

- Added Public Demo Mode for judges and visitors.
- Guest wallets still cannot see team wallet lists, full wallet addresses, contract address, or reward controls.
- Public Demo Mode shows the workflow using sample names only: manager creates task, technician submits, manager approves, reward is encrypted, assigned technician decrypts.
- Real actions still require a registered Manager or Technician wallet.
