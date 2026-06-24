# MaintShield v35 fixed

Fixes applied:

- Keep the working Sepolia contract workflow: create task, submit, approve, sync from events.
- Use the official browser/Vite bundle entry for Zama Relayer SDK: `@zama-fhe/relayer-sdk/bundle`.
- Remove fallback import from the root `@zama-fhe/relayer-sdk`, which can break Vite exports.
- Normalize manager, technician, contract, and user addresses with `ethers.getAddress()` before FHE calls.
- Remove KPI wording from the UI and use `Reward amount` only.
- Use a new localStorage key `maintshield-v35-fixed-state` to avoid stale/corrupt state from previous v35 runs.
- Improve sync error message if `VITE_CONTRACT_DEPLOY_BLOCK` or RPC range is wrong.

## Required .env

```env
VITE_CONTRACT_ADDRESS=0xa32AB0188823d25972F27f7c4D9254ae626a0AB7
VITE_INITIAL_MANAGERS=0x8e23Ca66E4E4d68c6C52Ed651d8487320B3d57d2
VITE_INITIAL_TECHNICIANS=0x7c2C99A13E9632bd4eB75266D5b4BF542893eb8c,0x757cA0b11D16F19d1CB9C4cEDbbB75756E60eE07,0xE39466bAf3a8F3408085675D3f70cCdc3055Fd2c,0xFC113F00AF0DE0397755012c6c6C4B638cB980CD,0x9Eb1e4207a84002c6deaACD56589322Ffbb708e5
VITE_MANAGER_NAMES=Ethan Brooks
VITE_TECHNICIAN_NAMES=Liam Carter,Noah Bennett,Oliver Reed,Lucas Morgan,Mason Clark
VITE_APP_MODE=contract
VITE_CONTRACT_DEPLOY_BLOCK=11126883
```

Optional if wallet RPC causes Relayer SDK trouble:

```env
VITE_RELAYER_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

## Test flow

1. Manager connects and clicks **Sync Contract**.
2. Manager creates task.
3. Technician connects and submits task.
4. Manager approves task.
5. Manager clicks **Encrypt & Assign Reward**.
6. Technician clicks **Decrypt My Reward**.

If Relayer SDK fails, the public workflow still works on-chain; capture the exact notice/console error for the reward step.

### v35 fixed3 note

`getEncryptedReward()` is called with the connected technician signer because the contract checks `msg.sender`. A read-only provider call can revert with `Not allowed`.
