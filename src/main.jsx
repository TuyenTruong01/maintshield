import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ethers } from 'ethers';
import {
  ShieldCheck, Wallet, ExternalLink, LockKeyhole, Users, UserPlus, Wrench,
  ClipboardCheck, CheckCircle2, KeyRound, AlertTriangle, Factory, PlayCircle,
  RefreshCw, LogOut, Copy, Eye, BadgeCheck, UserCog, ListChecks, Send, ShieldAlert, MonitorPlay, UserCheck, Archive
} from 'lucide-react';
import './styles.css';

const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';
const SEPOLIA_CHAIN_ID = 11155111n;
const ZERO = '0x0000000000000000000000000000000000000000';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || ZERO;
const APP_MODE = (import.meta.env.VITE_APP_MODE || 'demo').toLowerCase();

const ABI = [
  'function addManager(address wallet) external',
  'function addTechnician(address wallet) external',
  'function createTask(string title,string equipmentCode,address technician) external',
  'function submitTask(uint256 taskId) external',
  'function approveTask(uint256 taskId) external',
  'function assignRewardHandle(uint256 taskId, bytes32 encryptedRewardHandle) external',
  'function managers(address) view returns (bool)',
  'function technicians(address) view returns (bool)'
];

const addr = (a) => (a || '').trim();
const lower = (a) => addr(a).toLowerCase();
const isAddress = (a) => ethers.isAddress(addr(a));
const short = (a) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : 'Not connected';
const parseList = (v) => (v || '').split(',').map(x => x.trim()).filter(isAddress);
const parseNames = (v) => (v || '').split(',').map(x => x.trim()).filter(Boolean);
const roleLabel = { owner: 'Owner', manager: 'Manager', technician: 'Technician', guest: 'Guest' };
const statusLabel = { 0: 'Open', 1: 'Submitted', 2: 'Approved', 3: 'Reward Assigned' };

const defaultManagers = parseList(import.meta.env.VITE_INITIAL_MANAGERS);
const defaultTechs = parseList(import.meta.env.VITE_INITIAL_TECHNICIANS);
const managerNames = parseNames(import.meta.env.VITE_MANAGER_NAMES || 'Ethan Brooks');
const technicianNames = parseNames(import.meta.env.VITE_TECHNICIAN_NAMES || 'Liam Carter,Noah Bennett,Oliver Reed,Lucas Morgan,Mason Clark');

function labelFor(wallet, list, names, fallback) {
  const index = list.findIndex(w => lower(w) === lower(wallet));
  const name = index >= 0 ? names[index] : '';
  return name || `${fallback} ${index >= 0 ? index + 1 : ''}`.trim();
}

function techLabel(wallet, state, revealAddress = true) {
  const name = labelFor(wallet, state.technicians, state.technicianNames || [], 'Technician');
  return revealAddress ? `${name} — ${short(wallet)}` : name;
}

function managerLabel(wallet, state, revealAddress = true) {
  const name = labelFor(wallet, state.managers, state.managerNames || [], 'Manager');
  return revealAddress ? `${name} — ${short(wallet)}` : name;
}

function initialState() {
  const saved = localStorage.getItem('maintshield-v32-state');
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  return {
    owner: '',
    managers: defaultManagers,
    technicians: defaultTechs,
    managerNames,
    technicianNames,
    tasks: [
      { id: 1, title: 'Fix V131 leaking mixproof valve', equipment: 'V131 / Mixproof Valve', technician: defaultTechs[0] || '', status: 0, rewardAssigned: false, rewardPreview: '', encryptedHandle: '', history: ['Task created by manager'] },
      { id: 2, title: 'Preventive maintenance for UHT line', equipment: 'UHT-02 / 6000h service', technician: defaultTechs[1] || '', status: 0, rewardAssigned: false, rewardPreview: '', encryptedHandle: '', history: ['Task created by manager'] }
    ]
  };
}

function App() {
  const [state, setState] = useState(initialState);
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(1);
  const [notice, setNotice] = useState('Connect MetaMask with an authorized Manager or Technician wallet.');
  const [busy, setBusy] = useState(false);
  const [forms, setForms] = useState({
    manager: '', technician: '', taskTitle: 'Fix V131 leaking valve', equipment: 'V131 / Mixproof Valve', assignTo: defaultTechs[0] || '', reward: '150'
  });
  const [publicDemo, setPublicDemo] = useState(false);

  useEffect(() => localStorage.setItem('maintshield-v32-state', JSON.stringify(state)), [state]);
  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.request({ method: 'eth_accounts' }).then((accs) => { if (accs?.[0]) setAccount(accs[0]); });
    window.ethereum.request({ method: 'eth_chainId' }).then(setChainId);
    const accHandler = (accs) => setAccount(accs?.[0] || '');
    const chainHandler = (id) => setChainId(id);
    window.ethereum.on?.('accountsChanged', accHandler);
    window.ethereum.on?.('chainChanged', chainHandler);
    return () => {
      window.ethereum.removeListener?.('accountsChanged', accHandler);
      window.ethereum.removeListener?.('chainChanged', chainHandler);
    };
  }, []);

  const selectedTask = state.tasks.find(t => t.id === selectedTaskId) || state.tasks[0];
  const role = useMemo(() => getRole(account, state), [account, state]);
  const isAuthorized = role !== 'guest';
  const isManager = role === 'manager' || role === 'owner';
  const contractReady = CONTRACT_ADDRESS !== ZERO && APP_MODE === 'contract';
  const isSepolia = chainId === SEPOLIA_CHAIN_ID_HEX || BigInt(chainId || 0) === SEPOLIA_CHAIN_ID;

  function getRole(wallet, s) {
    if (!wallet) return 'guest';
    if (s.owner && lower(wallet) === lower(s.owner)) return 'owner';
    if (s.managers.some(m => lower(m) === lower(wallet))) return 'manager';
    if (s.technicians.some(t => lower(t) === lower(wallet))) return 'technician';
    return 'guest';
  }


  function signOut() {
    setAccount('');
    setChainId(null);
    setPublicDemo(false);
    setNotice('Signed out from MaintShield. To fully disconnect the site, remove this site connection in MetaMask.');
  }

  async function connectWallet() {
    if (!window.ethereum) { setNotice('MetaMask is not installed. Install MetaMask and refresh this page.'); return; }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const c = await window.ethereum.request({ method: 'eth_chainId' });
      setAccount(accounts[0]); setChainId(c);
      setState(s => (!s.owner && s.managers.length === 0 ? { ...s, owner: accounts[0], managers: [accounts[0], ...s.managers], managerNames: ['Primary Manager', ...(s.managerNames || [])] } : s));
      const nextRole = getRole(accounts[0], state);
      setNotice(nextRole === 'guest' ? 'Wallet connected, but this address is not authorized.' : `Wallet connected. Role: ${roleLabel[nextRole]}.`);
    } catch (e) { setNotice(e?.message || 'User rejected wallet request.'); }
  }

  async function switchSepolia() {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }] });
    } catch (e) {
      setNotice('Could not switch to Sepolia. Add Sepolia manually in MetaMask.');
    }
  }

  async function signer() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return provider.getSigner();
  }

  async function signAction(text) {
    const s = await signer();
    return s.signMessage(`MaintShield demo action:\n${text}\nWallet: ${account}\nTime: ${new Date().toISOString()}`);
  }

  async function txCall(method, args, message) {
    if (!account) return setNotice('Connect your wallet first.');
    if (APP_MODE === 'contract' && CONTRACT_ADDRESS !== ZERO) {
      if (!isSepolia) await switchSepolia();
      const s = await signer();
      const c = new ethers.Contract(CONTRACT_ADDRESS, ABI, s);
      const tx = await c[method](...args);
      setNotice(`Transaction sent: ${tx.hash}`);
      await tx.wait();
      setNotice(`${message} | confirmed: ${tx.hash}`);
      return tx.hash;
    }
    const sig = await signAction(message);
    setNotice(`${message} | demo signature: ${sig.slice(0, 18)}...`);
    return sig;
  }

  function requireManager() {
    if (!isManager) { setNotice('Only Manager/Owner wallets can use this action.'); return false; }
    return true;
  }
  function requireAssignedTech(task) {
    if (role !== 'technician' || lower(account) !== lower(task.technician)) { setNotice('Only the assigned technician can submit or decrypt this task.'); return false; }
    return true;
  }

  async function addManager() {
    if (!requireManager() || !isAddress(forms.manager)) return setNotice('Enter a valid manager wallet address.');
    setBusy(true);
    try {
      await txCall('addManager', [forms.manager], `Add manager ${short(forms.manager)}`);
      setState(s => s.managers.some(m => lower(m) === lower(forms.manager)) ? s : { ...s, managers: [...s.managers, forms.manager], managerNames: [...(s.managerNames || []), `Manager ${s.managers.length + 1}`] });
      setForms(f => ({ ...f, manager: '' }));
    } catch (e) { setNotice(e?.shortMessage || e?.message || 'Add manager failed.'); } finally { setBusy(false); }
  }

  async function addTechnician() {
    if (!requireManager() || !isAddress(forms.technician)) return setNotice('Enter a valid technician wallet address.');
    setBusy(true);
    try {
      await txCall('addTechnician', [forms.technician], `Whitelist technician ${short(forms.technician)}`);
      setState(s => s.technicians.some(t => lower(t) === lower(forms.technician)) ? s : { ...s, technicians: [...s.technicians, forms.technician], technicianNames: [...(s.technicianNames || []), `Technician ${s.technicians.length + 1}`] });
      setForms(f => ({ ...f, technician: '', assignTo: f.assignTo || forms.technician }));
    } catch (e) { setNotice(e?.shortMessage || e?.message || 'Add technician failed.'); } finally { setBusy(false); }
  }

  async function createTask() {
    if (!requireManager()) return;
    if (!forms.taskTitle || !forms.equipment || !isAddress(forms.assignTo)) return setNotice('Enter task title, equipment code, and select a whitelisted technician.');
    if (!state.technicians.some(t => lower(t) === lower(forms.assignTo))) return setNotice('The assigned wallet is not in the technician whitelist.');
    setBusy(true);
    try {
      await txCall('createTask', [forms.taskTitle, forms.equipment, forms.assignTo], `Create task for ${short(forms.assignTo)}`);
      setState(s => {
        const id = Math.max(0, ...s.tasks.map(t => t.id)) + 1;
        return { ...s, tasks: [{ id, title: forms.taskTitle, equipment: forms.equipment, technician: forms.assignTo, status: 0, rewardAssigned: false, rewardPreview: '', encryptedHandle: '', history: [`Created by ${short(account)}`] }, ...s.tasks] };
      });
      setSelectedTaskId(Math.max(0, ...state.tasks.map(t => t.id)) + 1);
    } catch (e) { setNotice(e?.shortMessage || e?.message || 'Create task failed.'); } finally { setBusy(false); }
  }

  async function submitTask(task) {
    if (!requireAssignedTech(task)) return;
    if (task.status !== 0) return setNotice('Only open tasks can be submitted.');
    setBusy(true);
    try {
      await txCall('submitTask', [task.id], `Submit completed task #${task.id}`);
      updateTask(task.id, { status: 1 }, `Submitted by ${techLabel(account, state, false)}`);
    } catch (e) { setNotice(e?.shortMessage || e?.message || 'Submit failed.'); } finally { setBusy(false); }
  }

  async function approveTask(task) {
    if (!requireManager()) return;
    if (task.status !== 1) return setNotice('Only submitted tasks can be approved.');
    setBusy(true);
    try {
      await txCall('approveTask', [task.id], `Approve task #${task.id}`);
      updateTask(task.id, { status: 2 }, `Approved by manager`);
    } catch (e) { setNotice(e?.shortMessage || e?.message || 'Approve failed.'); } finally { setBusy(false); }
  }

  async function assignReward(task) {
    if (!requireManager()) return;
    if (task.status !== 2) return setNotice('Reward can only be assigned after manager approval.');
    if (!forms.reward || Number(forms.reward) <= 0) return setNotice('Enter a valid reward/KPI amount.');
    setBusy(true);
    try {
      const fakeHandle = ethers.keccak256(ethers.toUtf8Bytes(`${task.id}:${forms.reward}:${task.technician}:${Date.now()}`));
      await txCall('assignRewardHandle', [task.id, fakeHandle], `Encrypt & assign reward for task #${task.id}`);
      updateTask(task.id, { status: 3, rewardAssigned: true, rewardPreview: forms.reward, encryptedHandle: fakeHandle }, `Encrypted reward assigned`);
    } catch (e) { setNotice(e?.shortMessage || e?.message || 'Assign reward failed.'); } finally { setBusy(false); }
  }

  async function decryptReward(task) {
    if (!requireAssignedTech(task)) return;
    if (!task.rewardAssigned) return setNotice('No reward has been assigned to this task yet.');
    try {
      await signAction(`Decrypt my reward for task #${task.id}`);
      setNotice(`Your reward for task #${task.id}: ${task.rewardPreview} points. In the real Zama version, this value is decrypted through the Relayer SDK.`);
    } catch (e) { setNotice(e?.message || 'Decrypt/sign failed.'); }
  }

  function updateTask(id, patch, log) {
    setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, ...patch, history: [...(t.history || []), log] } : t) }));
  }

  function resetDemo() {
    localStorage.removeItem('maintshield-v32-state');
    setState(initialState());
    setNotice('Demo reset. Connect an authorized wallet to continue.');
  }

  function copy(text) { navigator.clipboard?.writeText(text); setNotice('Copied.'); }

  const counts = {
    tasks: state.tasks.length,
    managers: state.managers.length,
    technicians: state.technicians.length,
    rewards: state.tasks.filter(t => t.rewardAssigned).length
  };

  const demoTasks = [
    { id: 1, title: 'Fix V131 leaking mixproof valve', equipment: 'V131 / Mixproof Valve', technician: 'Liam Carter', status: 'Open', reward: 'Encrypted after approval' },
    { id: 2, title: 'Submit completed work order', equipment: 'UHT-02 / 6000h service', technician: 'Noah Bennett', status: 'Submitted', reward: 'Not assigned' },
    { id: 3, title: 'Approve maintenance inspection', equipment: 'CIP-01 / Monthly inspection', technician: 'Oliver Reed', status: 'Approved', reward: 'Ready to encrypt' },
    { id: 4, title: 'Decrypt personal KPI reward', equipment: 'Filler-03 / Breakdown recovery', technician: 'Lucas Morgan', status: 'Reward Assigned', reward: 'Only assigned technician can decrypt' }
  ];

  return <div className="app">
    <section className="hero">
      <div className="nav wrap">
        <div className="brand"><ShieldCheck size={26}/><span>MaintShield</span></div>
        <div className="nav-actions">
          <a href="https://docs.zama.org/protocol" target="_blank" rel="noreferrer">Zama Docs <ExternalLink size={13}/></a>
          {account ? <>
            <button className="btn yellow" onClick={connectWallet}><Wallet size={16}/>{isAuthorized ? short(account) : 'Connected Guest'}</button>
            <button className="btn outline small" onClick={signOut}><LogOut size={15}/> Sign out</button>
          </> : <button className="btn yellow" onClick={connectWallet}><Wallet size={16}/> Connect Wallet</button>}
        </div>
      </div>
      <div className="hero-grid wrap">
        <div className="hero-left">
          <div className="pill"><LockKeyhole size={14}/> Builder Track MVP — Sepolia Testnet</div>
          <h1>Confidential rewards for maintenance teams.</h1>
          <p>Managers create tasks and assign them only to whitelisted technician wallets. Technicians submit work, managers approve it, then reward/KPI values are encrypted with Zama.</p>
          <div className="hero-buttons">
            {isAuthorized ? <a className="btn yellow" href="#workflow"><PlayCircle size={17}/> Open Demo Flow</a> : <button className="btn yellow" onClick={()=>setPublicDemo(true)}><PlayCircle size={17}/> Open Public Demo Mode</button>}
            {!isAuthorized && publicDemo && <button className="btn muted" onClick={()=>setPublicDemo(false)}><ShieldAlert size={17}/> Close Demo Mode</button>}
            {isAuthorized && <a className="btn muted" href="#access"><Users size={17}/> Team Access Control</a>}
            <button className="btn outline" onClick={resetDemo}><RefreshCw size={16}/> Reset</button>
          </div>
        </div>
        <div className="case-card">
          <div className="case-title"><Factory size={17}/> Use case</div>
          <h2>Public workflow, private reward.</h2>
          <div className="case-boxes">
            <div><small>PUBLIC</small><b>Task status</b><b>Equipment code</b><b>Approval status</b></div>
            <div><small>ENCRYPTED</small><b>Reward amount</b><b>KPI score</b><b>Bonus points</b><b>Personal performance</b></div>
          </div>
        </div>
      </div>
    </section>

    <main className="wrap main">
      <div className="stats">
        <Stat icon={<ClipboardCheck/>} value={counts.tasks} label="Total tasks"/>
        <Stat icon={<UserCog/>} value={counts.managers} label="Managers"/>
        <Stat icon={<Users/>} value={counts.technicians} label="Whitelisted technicians"/>
        <Stat icon={<LockKeyhole/>} value={counts.rewards} label="Encrypted rewards"/>
      </div>

      <div className="notice"><AlertTriangle size={17}/><span>{notice}</span></div>

      <section className="wallet-panel">
        <div>
          <h3>{isAuthorized ? 'Wallet status' : 'Restricted access'}</h3>
          <p>{isAuthorized ? 'Your role is resolved from the connected wallet and the onchain/demo whitelist.' : 'Guest wallets can view the public product concept only. Team lists, wallet addresses, contract address, and reward controls are hidden.'}</p>
        </div>
        <div className="wallet-items">
          {isAuthorized && <Badge label="Wallet" value={short(account)}/>} 
          <Badge label="Role" value={roleLabel[role]}/>
          {isAuthorized && <Badge label="Network" value={isSepolia ? 'Sepolia' : (chainId || 'Unknown')}/>} 
          {isAuthorized && <Badge label="Mode" value={contractReady ? 'Contract' : 'Wallet demo'}/>} 
          {isAuthorized && !isSepolia && <button className="btn dark" onClick={switchSepolia}>Switch Sepolia</button>}
        </div>
      </section>

      {!isAuthorized && <section className="card locked-card">
        <ShieldAlert size={36}/>
        <h2>Guest view is limited</h2>
        <p>Connect a registered Manager or Technician wallet to access real team controls, task assignment, contract details, and confidential reward actions.</p>
        <div className="guest-actions">
          <button className="btn yellow" onClick={()=>setPublicDemo(true)}><MonitorPlay size={16}/> Open Public Demo Mode</button>
          <button className="btn dark" onClick={connectWallet}><Wallet size={16}/> Connect Authorized Wallet</button>
        </div>
      </section>}

      {!isAuthorized && publicDemo && <section id="workflow" className="public-demo">
        <div className="demo-header card">
          <div>
            <h2>Public Demo Tour</h2>
            <p>This preview lets judges understand the full MaintShield workflow without exposing live wallet lists, contract address, or private reward controls. Real actions still require a registered Manager or Technician wallet.</p>
          </div>
          <span className="demo-badge"><MonitorPlay size={15}/> Preview only</span>
        </div>
        <div className="demo-steps">
          <DemoStep icon={<UserCog/>} title="1. Manager creates task" text="A registered manager creates a maintenance task and chooses a technician from the whitelist."/>
          <DemoStep icon={<UserCheck/>} title="2. Technician submits" text="Only the assigned technician can submit the work as completed."/>
          <DemoStep icon={<BadgeCheck/>} title="3. Manager approves" text="The manager checks the real work and approves the task before any reward is assigned."/>
          <DemoStep icon={<LockKeyhole/>} title="4. Reward is encrypted" text="Reward/KPI values stay confidential; only the assigned technician can decrypt their own reward."/>
        </div>
        <div className="card demo-board">
          <div className="board-head"><h2>Sample Workflow Board</h2><p>No full wallet addresses, contract address, or reward amount is exposed in public demo mode.</p></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Task</th><th>Equipment</th><th>Assigned to</th><th>Status</th><th>Reward privacy</th></tr></thead>
              <tbody>{demoTasks.map(t => <tr key={t.id}>
                <td>#{t.id}</td>
                <td><b>{t.title}</b><small>Sample data for judges</small></td>
                <td>{t.equipment}</td>
                <td>{t.technician}</td>
                <td><span className={`status s${Math.min(t.id-1,3)}`}>{t.status}</span></td>
                <td><span className="encrypted">{t.reward}</span></td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>}

      {isManager && <section id="access" className="grid two">
        <div className="card">
          <div className="card-head"><div><h2>Team Access Control</h2><p>Managers can add other managers and whitelist technician wallets.</p></div><Users/></div>
          <div className="form-row">
            <input placeholder="Manager wallet 0x..." value={forms.manager} onChange={e=>setForms({...forms, manager:e.target.value})}/>
            <button className="btn dark" disabled={busy} onClick={addManager}><UserPlus size={16}/> Add Manager</button>
          </div>
          <div className="form-row">
            <input placeholder="Technician wallet 0x..." value={forms.technician} onChange={e=>setForms({...forms, technician:e.target.value})}/>
            <button className="btn dark" disabled={busy} onClick={addTechnician}><UserPlus size={16}/> Add Technician</button>
          </div>
          <div className="lists">
            <WalletList title="Managers" items={state.managers} names={state.managerNames} kind="manager" state={state} copy={copy}/>
            <WalletList title="Technician whitelist" items={state.technicians} names={state.technicianNames} kind="technician" state={state} copy={copy}/>
          </div>
        </div>

        <div className="card" id="workflow">
          <div className="card-head"><div><h2>Create Maintenance Task</h2><p>Managers can assign tasks only to whitelisted technicians.</p></div><Wrench/></div>
          <label>Task title</label>
          <input value={forms.taskTitle} onChange={e=>setForms({...forms, taskTitle:e.target.value})}/>
          <label>Equipment code</label>
          <input value={forms.equipment} onChange={e=>setForms({...forms, equipment:e.target.value})}/>
          <label>Assign to technician</label>
          <select value={forms.assignTo} onChange={e=>setForms({...forms, assignTo:e.target.value})}>
            <option value="">Select whitelisted technician</option>
            {state.technicians.map(t => <option key={t} value={t}>{techLabel(t, state)}</option>)}
          </select>
          <button className="btn yellow wide" disabled={busy} onClick={createTask}><Send size={16}/> Create Task</button>
        </div>
      </section>}

      {isAuthorized && !isManager && <section id="workflow" className="card locked-card">
        <ListChecks size={34}/>
        <h2>Technician workspace</h2>
        <p>You can submit only the tasks assigned to your wallet and decrypt only your own reward after manager approval.</p>
      </section>}

      {isAuthorized && <section className="grid two">
        <div className="card">
          <div className="card-head"><div><h2>Selected Task Workflow</h2><p>Technicians submit work. Managers approve and assign encrypted rewards.</p></div><ListChecks/></div>
          {selectedTask ? <>
            <div className="selected">
              <small>Selected task #{selectedTask.id}</small>
              <h3>{selectedTask.title}</h3>
              <p>{selectedTask.equipment}</p>
              <p>Technician: <b>{techLabel(selectedTask.technician, state)}</b></p>
              <span className={`status s${selectedTask.status}`}>{statusLabel[selectedTask.status]}</span>
            </div>
            <div className="flow-actions">
              <button className="btn dark" disabled={busy || selectedTask.status !== 0 || !(role === 'technician' && lower(account) === lower(selectedTask.technician))} onClick={()=>submitTask(selectedTask)}><CheckCircle2 size={16}/> Technician Submit</button>
              {isManager && <button className="btn dark" disabled={busy || selectedTask.status !== 1} onClick={()=>approveTask(selectedTask)}><BadgeCheck size={16}/> Manager Approve</button>}
            </div>
            {isManager && <div className="reward-box">
              <label>Reward / KPI amount</label>
              <input value={forms.reward} onChange={e=>setForms({...forms, reward:e.target.value})}/>
              <button className="btn dark wide" disabled={busy || selectedTask.status !== 2} onClick={()=>assignReward(selectedTask)}><LockKeyhole size={16}/> Encrypt & Assign Reward</button>
            </div>}
            {role === 'technician' && lower(account) === lower(selectedTask.technician) && <div className="reward-box">
              <p><b>Private reward access</b></p>
              <p className="muted-text">Only the assigned technician can request decryption.</p>
              <button className="btn soft wide" disabled={!selectedTask.rewardAssigned} onClick={()=>decryptReward(selectedTask)}><Eye size={16}/> Decrypt My Reward</button>
            </div>}
          </> : <p>No task selected.</p>}
        </div>

        {isManager && <div className="card">
          <div className="card-head"><div><h2>Deploy Contract Status</h2><p>Builder Track submission checklist.</p></div><KeyRound/></div>
          <div className="deploy-info">
            <small>CONTRACT ADDRESS</small>
            <code>{CONTRACT_ADDRESS}</code>
            <small>NETWORK</small>
            <code>Sepolia · chainId 11155111</code>
            <small>FRONTEND MODE</small>
            <code>{contractReady ? 'Contract mode: transactions call smart contract' : 'Demo mode: MetaMask signs action, browser stores state'}</code>
          </div>
          <ul className="checklist">
            <li>Smart contract: <code>contracts/MaintShieldFHE.sol</code></li>
            <li>Frontend: React/Vite + MetaMask + ethers.js</li>
            <li>Deploy contract: Zama FHEVM Hardhat template on Sepolia</li>
            <li>Deploy website: Vercel</li>
            <li>Video: 3-minute real-person pitch, no AI voice</li>
          </ul>
        </div>}
      </section>}

      {isAuthorized && <section className="card board">
        <div className="board-head"><h2>Maintenance Task Board</h2><p>Select a task to view its workflow. Reward values remain encrypted; only assigned technicians can decrypt their own rewards.</p></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Task</th><th>Equipment</th><th>Technician</th><th>Status</th><th>Reward</th><th>Action</th></tr></thead>
            <tbody>{state.tasks.map(t => <tr key={t.id} className={selectedTaskId === t.id ? 'active' : ''} onClick={()=>setSelectedTaskId(t.id)}>
              <td>#{t.id}</td>
              <td><b>{t.title}</b><small>{t.history?.[t.history.length-1]}</small></td>
              <td>{t.equipment}</td>
              <td>{techLabel(t.technician, state)}</td>
              <td><span className={`status s${t.status}`}>{statusLabel[t.status]}</span></td>
              <td>{t.rewardAssigned ? <span className="encrypted">Encrypted</span> : <span className="muted-text">Not assigned</span>}</td>
              <td><button className="mini" onClick={(e)=>{e.stopPropagation(); setSelectedTaskId(t.id);}}>Select</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>}
    </main>
  </div>;
}

function Stat({icon, value, label}) { return <div className="stat"><div className="stat-icon">{React.cloneElement(icon,{size:24})}</div><b>{value}</b><span>{label}</span></div>; }
function Badge({label, value}) { return <div className="badge"><small>{label}</small><b>{value}</b></div>; }
function WalletList({title, items, kind, state, copy}) {
  return <div className="wallet-list"><h4>{title}</h4>{items.length ? items.map(w => <div className="wallet-row" key={w}>
    <span>{kind === 'manager' ? managerLabel(w, state) : techLabel(w, state)}</span>
    <button onClick={()=>copy(w)}><Copy size={13}/></button>
  </div>) : <p className="empty">No wallet yet</p>}</div>;
}
function DemoStep({icon, title, text}) {
  return <div className="demo-step card"><div className="demo-icon">{React.cloneElement(icon,{size:24})}</div><h3>{title}</h3><p>{text}</p></div>;
}

createRoot(document.getElementById('root')).render(<App/>);
