/* ════════════════════════════════════════════════════
   ICARUS — script.js
   Handles: particles, nav, scroll reveal, demo simulation
════════════════════════════════════════════════════ */

/* ── Particles init ─────────────────────────────── */
if (typeof particlesJS !== 'undefined') {
  particlesJS('particles-js', {
    particles: {
      number: { value: 55, density: { enable: true, value_area: 1100 } },
      color:  { value: ['#f0a500', '#7a5200', '#3a2800'] },
      shape:  { type: 'circle' },
      opacity: {
        value: 0.35, random: true,
        anim: { enable: true, speed: 0.6, opacity_min: 0.04, sync: false }
      },
      size: { value: 1.8, random: true },
      line_linked: {
        enable: true, distance: 120,
        color: '#3a2800', opacity: 0.3, width: 1
      },
      move: {
        enable: true, speed: 0.5, direction: 'none',
        random: true, straight: false, out_mode: 'out'
      }
    },
    interactivity: {
      detect_on: 'window',
      events: {
        onhover: { enable: true, mode: 'grab' },
        onclick: { enable: true, mode: 'push' },
        resize: true
      },
      modes: {
        grab: { distance: 150, line_linked: { opacity: 0.55 } },
        push: { particles_nb: 3 }
      }
    },
    retina_detect: true
  });
}

/* ── Nav sticky ─────────────────────────────────── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('stuck', scrollY > 50);
}, { passive: true });

/* ── Mobile nav ─────────────────────────────────── */
const mn = document.getElementById('mobileNav');
function navOpen()  { mn.classList.add('open');    document.body.style.overflow = 'hidden'; }
function navClose() { mn.classList.remove('open'); document.body.style.overflow = ''; }

/* ── Reveal on scroll ───────────────────────────── */
const revObs = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }),
  { threshold: 0.08 }
);
document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

/* ════════════════════════════════════════════════════
   DEMO SIMULATION
════════════════════════════════════════════════════ */

// Port definitions
const REAL_PORTS   = [22, 80, 443, 3389, 5432];
const COMMON_PORTS = [21, 23, 25, 53, 110, 143, 389, 445, 993, 995,
                      1080, 1433, 2049, 3306, 6379, 8080, 8443, 27017];
const DECOY_PORTS  = [];

let state = {
  realPort: 443,
  decoys: [],
  probedPorts: new Set(),
  threatScore: 0,
  phaseActive: false,
  actionLog: []
};

// Build the port map grid
function buildPortMap() {
  const map = document.getElementById('portMap');
  map.innerHTML = '';
  state.decoys = [];

  // Generate 30 unique decoy ports not in REAL_PORTS or COMMON_PORTS
  const pool = [];
  for (let p = 1024; p <= 9999; p++) {
    if (!REAL_PORTS.includes(p) && !COMMON_PORTS.includes(p)) pool.push(p);
  }
  // Shuffle and pick 30
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  state.decoys = pool.slice(0, 30);

  // All ports to display
  const displayPorts = [...COMMON_PORTS, state.realPort, ...state.decoys.slice(0, 14)];

  displayPorts.forEach(port => {
    const node = document.createElement('div');
    node.className = 'port-node';
    node.id = 'port-' + port;

    if (port === state.realPort) {
      node.classList.add('real');
    } else if (state.decoys.includes(port)) {
      // Only show decoys once spawned
      node.style.display = 'none';
    }

    node.innerHTML = `<span>${port}</span>`;
    map.appendChild(node);
  });
}

function getNode(port) {
  return document.getElementById('port-' + port);
}

// Log a message to the ICARUS console
function iLog(msg, type = '') {
  const log = document.getElementById('icarusLog');
  const line = document.createElement('div');
  line.className = 'log-line mono' + (type ? ' ' + type : '');
  const time = new Date().toTimeString().slice(0, 8);
  line.textContent = `[${time}] ${msg}`;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function setStatus(text, type = '') {
  const el = document.getElementById('tStatus');
  el.textContent = text;
  el.className = 'mono t-status' + (type ? ' ' + type : '');
}

function updateThreat(delta) {
  state.threatScore = Math.min(100, state.threatScore + delta);
  document.getElementById('threatBar').style.width = state.threatScore + '%';
  document.getElementById('threatVal').textContent = state.threatScore + ' / 100';
}

// Spawn decoys visually
async function spawnDecoys() {
  iLog('⚡ SPAWNING DECOY MESH — 30 honeypots initializing...', 'warn');
  setStatus('SPAWNING DECOYS', 'warn');

  const map = document.getElementById('portMap');

  for (let i = 0; i < 30; i++) {
    const port = state.decoys[i];
    let node = document.getElementById('port-' + port);

    if (!node) {
      node = document.createElement('div');
      node.className = 'port-node decoy';
      node.id = 'port-' + port;
      node.innerHTML = `<span>${port}</span>`;
      map.appendChild(node);
    } else {
      node.style.display = '';
      node.classList.add('decoy');
    }

    await sleep(35);
  }

  iLog('✓ 30 decoy services online — honeypot mesh active', 'success');
}

// Port displacement
async function displaceRealPort() {
  // Pick a new port for the real service
  const newPort = state.decoys[Math.floor(Math.random() * state.decoys.length)];
  const oldPort = state.realPort;

  iLog(`⇄ DISPLACING real service: :${oldPort} → :${newPort}`, 'warn');

  const oldNode = getNode(oldPort);
  if (oldNode) {
    oldNode.classList.remove('real');
    oldNode.classList.add('probed');
    await sleep(400);
    oldNode.classList.remove('probed');
    oldNode.classList.add('decoy');
  }

  state.realPort = newPort;

  const newNode = getNode(newPort);
  if (newNode) {
    newNode.classList.remove('decoy');
    newNode.classList.add('displaced');
    await sleep(600);
    newNode.classList.remove('displaced');
    newNode.classList.add('real');
  }

  iLog(`✓ Real service now running on :${newPort} — attacker is lost`, 'success');
  setStatus('DISPLACED — SECURE', '');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Attacker actions
async function attackerAction(type) {
  if (state.phaseActive) return;
  state.phaseActive = true;

  const btns = document.querySelectorAll('.ap-btn');
  btns.forEach(b => b.disabled = true);

  setStatus('THREAT DETECTED', 'alert');

  switch (type) {
    case 'scan': {
      iLog('⚠ ALERT: Port scan detected from 10.0.0.99', 'alert');
      iLog('  Tool signature: nmap SYN scan / OS detection', 'alert');
      updateThreat(18);

      if (state.decoys.length === 0 || document.querySelectorAll('.port-node.decoy').length < 5) {
        await spawnDecoys();
      } else {
        iLog('  Decoy mesh already active — reinforcing...', 'warn');
        await sleep(600);
      }

      // Flash a few random ports as probed
      for (let i = 0; i < 4; i++) {
        const randomPort = COMMON_PORTS[Math.floor(Math.random() * COMMON_PORTS.length)];
        const node = getNode(randomPort);
        if (node) {
          node.classList.add('probed');
          await sleep(180);
          node.classList.remove('probed');
        }
      }

      iLog('→ Model analysis: Automated scanner, low sophistication', '');
      iLog('→ Action: Decoy mesh maintained, real port unchanged', '');
      break;
    }

    case 'probe': {
      iLog('⚠ ALERT: Deep probe on :' + state.realPort + ' from 10.0.0.99', 'alert');
      iLog('  Attacker is targeting your primary service!', 'alert');
      updateThreat(28);

      if (document.querySelectorAll('.port-node.decoy').length < 5) {
        await spawnDecoys();
      }

      const realNode = getNode(state.realPort);
      if (realNode) {
        realNode.classList.add('probed');
        await sleep(500);
        realNode.classList.remove('probed');
      }

      iLog('→ Model analysis: Targeted attack, banner grab detected', 'warn');
      iLog('→ Action: INITIATING PORT DISPLACEMENT SEQUENCE', 'warn');
      await sleep(400);
      await displaceRealPort();
      break;
    }

    case 'connect': {
      iLog('⚠ ALERT: Forced connection attempt on :' + state.realPort, 'alert');
      iLog('  Attacker attempting service enumeration', 'alert');
      updateThreat(22);

      if (document.querySelectorAll('.port-node.decoy').length < 5) {
        await spawnDecoys();
      }

      // Attacker hits decoy
      const decoyHit = state.decoys[Math.floor(Math.random() * state.decoys.length)];
      const decoyNode = getNode(decoyHit);
      if (decoyNode) {
        decoyNode.classList.add('probed');
        await sleep(700);
        decoyNode.classList.remove('probed');
      }

      iLog(`→ Attacker connected to decoy :${decoyHit} — feeding false data`, 'success');
      iLog(`→ Forensic session capture started — logging attacker activity`, 'success');
      iLog(`→ Real service on :${state.realPort} untouched`, '');
      break;
    }

    case 'brute': {
      iLog('⚠ ALERT: Brute force sequence from 10.0.0.99', 'alert');
      iLog('  Hydra signature detected — credential stuffing attack', 'alert');
      updateThreat(32);

      if (document.querySelectorAll('.port-node.decoy').length < 5) {
        await spawnDecoys();
      }

      // Flash multiple ports
      for (let i = 0; i < 6; i++) {
        const p = state.decoys[Math.floor(Math.random() * state.decoys.length)];
        const n = getNode(p);
        if (n) {
          n.classList.add('probed');
          await sleep(120);
          n.classList.remove('probed');
          await sleep(60);
        }
      }

      iLog('→ Model analysis: APT-level threat — credential harvesting', 'warn');
      iLog('→ Action: Rotating entire decoy mesh configuration', 'warn');
      await sleep(300);
      await displaceRealPort();

      // Refresh some decoy labels
      document.querySelectorAll('.port-node.decoy').forEach(n => {
        n.classList.add('probed');
        setTimeout(() => n.classList.remove('probed'), 200);
      });

      iLog('→ All 30 decoys reconfigured — attacker map invalidated', 'success');
      break;
    }
  }

  // Check if threat score is high
  if (state.threatScore >= 80) {
    setStatus('CRITICAL THREAT', 'alert');
    iLog('! CRITICAL: Persistent threat actor detected — alerting SOC team', 'alert');
  } else if (state.threatScore >= 40) {
    setStatus('MONITORING', 'warn');
  } else {
    setStatus('ACTIVE', '');
  }

  btns.forEach(b => b.disabled = false);
  state.phaseActive = false;
}

function resetDemo() {
  state = {
    realPort: 443,
    decoys: [],
    probedPorts: new Set(),
    threatScore: 0,
    phaseActive: false,
    actionLog: []
  };

  document.getElementById('threatBar').style.width = '0%';
  document.getElementById('threatVal').textContent = '0 / 100';
  setStatus('IDLE', '');

  const log = document.getElementById('icarusLog');
  log.innerHTML = `
    <div class="log-line mono dim">// ICARUS engine standing by...</div>
    <div class="log-line mono dim">// Monitoring 65535 ports</div>
    <div class="log-line mono dim">// AI model loaded — v2.4.1</div>
    <div class="log-line mono dim">// [ SIMULATION RESET ]</div>
  `;

  buildPortMap();
}

// Init demo on load
buildPortMap();

/* ── Animate model bars on scroll ──────────────── */
const modelSection = document.querySelector('.section-model');
if (modelSection) {
  const barObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      // Bars already set via inline style, just add a CSS animation trigger
      document.querySelectorAll('.mv-bar-fill').forEach(bar => {
        const target = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => { bar.style.width = target; }, 100);
      });
      barObs.disconnect();
    }
  }, { threshold: 0.3 });
  barObs.observe(modelSection);
}