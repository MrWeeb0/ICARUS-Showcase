const nodesDisplay = document.getElementById('nodes-display');
const terminalContentEl = document.getElementById('terminal-content');
const decoyCountEl = document.getElementById('decoy-count');

// Agent Labels
const icarusAgent = document.getElementById('icarus-agent');
const redAgent = document.getElementById('red-agent');

// Speed Controls
const icarusSpeedSlider = document.getElementById('icarus-speed');
const icarusSpeedVal = document.getElementById('icarus-speed-val');
const redSpeedSlider = document.getElementById('red-speed');
const redSpeedVal = document.getElementById('red-speed-val');

let icarusReactionTime = parseInt(icarusSpeedSlider.value);
let redAttackRate = parseInt(redSpeedSlider.value);
let nodes = [];

// Update speed variables when sliders move
icarusSpeedSlider.addEventListener('input', (e) => {
    icarusReactionTime = parseInt(e.target.value);
    icarusSpeedVal.innerText = icarusReactionTime;
});

redSpeedSlider.addEventListener('input', (e) => {
    redAttackRate = parseInt(e.target.value);
    redSpeedVal.innerText = redAttackRate;
});

function addLog(msg, type = 'system') {
    const p = document.createElement('p');
    p.className = type === 'alert' ? 'alert-msg' : 'system-msg';
    p.innerText = `>> ${msg}`;
    terminalContentEl.appendChild(p);
    terminalContentEl.scrollTop = terminalContentEl.scrollHeight;
}

function spawnNode(type) {
    const node = document.createElement('div');
    node.className = `node ${type}`;
    node.textContent = type === 'real' ? 'REAL ASSET' : 'DECOY';
    
    nodesDisplay.appendChild(node);
    const nodeObj = { el: node, type: type };
    nodes.push(nodeObj);
    return nodeObj;
}

function initNetwork() {
    for(let i = 0; i < 4; i++) spawnNode('decoy');
    spawnNode('real');
    for(let i = 0; i < 5; i++) spawnNode('decoy');
    
    decoyCountEl.innerText = '9';
    addLog("Subnetwork initialized. 1 Real Asset, 9 Decoys active.");
}

function swapNodes(targetedReal, randomDecoy) {
    targetedReal.el.className = 'node decoy';
    targetedReal.el.textContent = 'DECOY';
    targetedReal.type = 'decoy';
    
    randomDecoy.el.className = 'node real action-blue';
    randomDecoy.el.textContent = 'REAL ASSET';
    randomDecoy.type = 'real';
    
    setTimeout(() => {
        randomDecoy.el.classList.remove('action-blue');
    }, 1000);
}

function redAgentScan() {
    redAgent.classList.add('active-red');
    
    const targetIdx = Math.floor(Math.random() * nodes.length);
    const target = nodes[targetIdx];
    target.el.classList.add('scan-red');
    
    // Scale animation duration based on speed slider
    const scanAnimDuration = Math.min(800, redAttackRate * 0.4); 

    setTimeout(() => {
        redAgent.classList.remove('active-red');
        
        if(target.type === 'real') {
            addLog("CRITICAL: Real Server Targeted!", "alert");
            icarusAgent.classList.add('active-icarus');
            
            setTimeout(() => {
                addLog("ICARUS: Shifting Real Asset...", "system");
                const decoys = nodes.filter(n => n.type === 'decoy');
                const randomDecoy = decoys[Math.floor(Math.random() * decoys.length)];
                
                swapNodes(target, randomDecoy);
                target.el.classList.remove('scan-red');
                
                setTimeout(() => {
                    icarusAgent.classList.remove('active-icarus');
                }, Math.min(800, icarusReactionTime)); 
                
            }, icarusReactionTime);
            
        } else {
            target.el.classList.remove('scan-red');
        }
        
        setTimeout(redAgentScan, redAttackRate);
        
    }, scanAnimDuration); 
}

// Timer
let seconds = 0;
setInterval(() => { 
    seconds++; 
    document.getElementById('timer').innerText = seconds; 
}, 1000);

// Boot up
initNetwork();
setTimeout(redAgentScan, 2000);