# MaintShield

MaintShield is a confidential reward layer for maintenance teams, built for the Zama Builder Track.

Maintenance task information remains public so the team can coordinate work transparently, while reward amounts are encrypted before being stored on-chain. Only the assigned technician can decrypt their own reward.

## Live Demo

Website: https://maintshielder.vercel.app/

GitHub: https://github.com/TuyenTruong01/maintshield

Sepolia Contract: `0xa32AB0188823d25972F27f7c4D9254ae626a0AB7`

Network: Sepolia
Chain ID: `11155111`

## Problem

Maintenance teams often need a clear workflow for assigning, completing, and approving repair tasks.

However, some information should not be public to everyone. In particular, reward amounts, incentives, or performance-based bonuses may need to remain private between the manager and the assigned technician.

Traditional public smart contracts make all stored values visible. MaintShield solves this by keeping the task workflow public while encrypting the reward amount.

## Solution

MaintShield separates the workflow into two layers:

### Public workflow

The following information is visible to the team:

* Maintenance task title
* Equipment code
* Assigned technician
* Task status
* Submit and approval state

### Confidential reward

The reward amount is not stored as a public plaintext value.

The manager enters the official reward only after the technician submits the task and the manager approves it. The reward is then encrypted using Zama technology and assigned to the technician.

Only the assigned technician can decrypt their own reward.

## Core Workflow

1. Manager connects wallet.
2. Manager creates a maintenance task.
3. Manager assigns the task to a whitelisted technician.
4. Technician connects wallet.
5. Technician submits the task after completion.
6. Manager approves the submitted task.
7. Manager enters the confidential reward amount.
8. Manager encrypts and assigns the reward.
9. Assigned technician decrypts their own reward.

## Example Demo Flow

Example task:

* Task: `Fix V110 leaking valve`
* Equipment: `V110 / Mixproof Valve`
* Technician: `Noah Bennett`
* Confidential reward: `120 points`

The task workflow is public, but the reward value is encrypted before being stored on-chain. Only Noah Bennett’s assigned wallet can decrypt the reward.

## Zama / FHE Usage

MaintShield uses Zama’s confidential computation tooling to protect reward amounts.

The application uses:

* Zama FHEVM smart contract workflow
* Zama Relayer SDK in the frontend
* Encrypted reward assignment
* Technician-only reward decryption

The reward amount is encrypted before being stored on-chain. A guest or another technician cannot decrypt a reward that was not assigned to them.

## Smart Contract

Contract address:


0xa32AB0188823d25972F27f7c4D9254ae626a0AB7


Network:


Sepolia


Chain ID:


11155111


## Roles

### Manager

The manager can:

* Create maintenance tasks
* Assign tasks to whitelisted technicians
* Approve submitted tasks
* Encrypt and assign confidential rewards

### Technician

A technician can:

* View assigned tasks
* Submit completed tasks
* Decrypt their own assigned reward

### Guest

A guest cannot access confidential reward information.

## Test Accounts

### Manager


Ethan Brooks
0x8e23Ca66E4E4d68c6C52Ed651d8487320B3d57d2


### Technicians


Liam Carter
0x7c2C99A13E9632bd4eB75266D5b4BF542893eb8c

Noah Bennett
0x757cA0b11D16F19d1CB9C4cEDbbB75756E60eE07

Oliver Reed
0xE39466bAf3a8F3408085675D3f70cCdc3055Fd2c

Lucas Morgan
0xFC113F00AF0DE0397755012c6c6C4B638cB980CD

Mason Clark
0x9Eb1e4207a84002c6deaACD56589322Ffbb708e5


## Tech Stack

* React
* Vite
* ethers.js
* MetaMask / browser wallet
* Zama Relayer SDK
* Solidity
* Sepolia testnet
* Vercel

## Environment Variables

Create a `.env` file:

VITE_CONTRACT_ADDRESS=0xa32AB0188823d25972F27f7c4D9254ae626a0AB7
VITE_INITIAL_MANAGERS=0x8e23Ca66E4E4d68c6C52Ed651d8487320B3d57d2
VITE_INITIAL_TECHNICIANS=0x7c2C99A13E9632bd4eB75266D5b4BF542893eb8c,0x757cA0b11D16F19d1CB9C4cEDbbB75756E60eE07,0xE39466bAf3a8F3408085675D3f70cCdc3055Fd2c,0xFC113F00AF0DE0397755012c6c6C4B638cB980CD,0x9Eb1e4207a84002c6deaACD56589322Ffbb708e5
VITE_MANAGER_NAMES=Ethan Brooks
VITE_TECHNICIAN_NAMES=Liam Carter,Noah Bennett,Oliver Reed,Lucas Morgan,Mason Clark
VITE_APP_MODE=contract
VITE_CONTRACT_DEPLOY_BLOCK=11126883
VITE_RELAYER_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

## Local Development

Install dependencies:


npm install


Run locally:


npm run dev


Build:


npm run build


## Production Deployment

The frontend is deployed on Vercel:


https://maintshielder.vercel.app/


The app runs in contract mode and interacts with the deployed Sepolia smart contract.

## Important Privacy Design

The reward amount is not treated as official when a task is created.

The official reward is the number entered by the manager immediately before clicking:


Encrypt & Assign Reward


At that moment, the amount is encrypted and assigned to the selected technician.

This prevents plaintext reward values from becoming part of the public task workflow.

## Why This Matters

MaintShield demonstrates how confidential blockchain applications can be useful outside finance.

Factory maintenance, field service, internal operations, and enterprise workflows often need public coordination with private incentives.

MaintShield shows a simple example:


Public task workflow
+
Private encrypted reward
+
Role-based technician decryption


## Demo Video Script

A 3-minute demo should show:

1. Open MaintShield.
2. Explain that task status is public but reward amounts are private.
3. Connect as Manager Ethan Brooks.
4. Create a maintenance task for a technician.
5. Switch to the assigned technician wallet.
6. Submit the task.
7. Switch back to Manager.
8. Approve the task.
9. Enter a confidential reward amount.
10. Encrypt and assign the reward.
11. Switch back to the assigned technician.
12. Decrypt the reward.
13. Show that only the assigned technician can see the reward.

## Submission Summary

Project name:
MaintShield

Description:

MaintShield is a confidential reward layer for maintenance teams. Maintenance task status and equipment information remain public, while reward amounts are encrypted with Zama and only the assigned technician can decrypt their own reward.


Website:
https://maintshielder.vercel.app/


GitHub:
https://github.com/TuyenTruong01/maintshield


Sepolia contract:

0xa32AB0188823d25972F27f7c4D9254ae626a0AB7


Network:

Sepolia


## License

MIT
