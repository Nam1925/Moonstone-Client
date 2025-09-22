// ============ P2. MODS ============

// Mod list
const modList = [
  { name: "Resolution Changer", enabled: false, level: 2 }, // Change game resolution
  { name: "CPS", enabled: false }, // Counts clicks per second
  { name: "Keystrokes", enabled: false }, // Display keystrokes
  { name: "Ping", enabled: false }, // Show current ping (ms)
  { name: "Clock", enabled: false }, // Show current time
  { name: "Hotbar", enabled: false }, // Change hotbar style
  { name: "HealthBar", enabled: false }, // Change health bar style
  { name: "Crosshair", enabled: false }, // Change crosshair style
  { name: "InGame Music", enabled: false }, // Play music in-game
  { name: "Hud", enabled: false }, // Show custom HUD
  { name: "AutoSort", enabled: false }, // Auto sort inventory
  { name: "AutoPack", enabled: false }, // Auto switch texture pack depending on game mode
  { name: "AutoGunReload", enabled: false }, // Auto reload gun when out of ammo
  { name: "AutoGG", enabled: false }, // Automatically send "GG" message after game ends
  { name: "FastStore", enabled: false }, // Fast store (Left click to chest/echest to instantly put item(s) in)
  { name: "PackName", enabled: false }, // Show current texture pack name
  { name: "Toggle Sprint", enabled: false }, // Toggle sprint on/off
  { name: "Hack Theme (Not Hacks)", enabled: false }, // Change theme to look like a hack client (THIS IS NOT HACKS)

  // More mods will be added in the future :)
];

loadModStates(() => {
  createKeystrokesHUD();
  createPingHUD();
});


function saveModStates() {
  chrome.storage.local.set({ moon_modList: modList });
}

function loadModStates(callback) {
  chrome.storage.local.get(['moon_modList'], (result) => {
    if (result.moon_modList) {
      result.moon_modList.forEach((saved, i) => {
        if (modList[i]) modList[i].enabled = saved.enabled;
      });
    }
    if (callback) callback();
  });
}



const hudPosition = {
  keystrokes: { left: '50%', bottom: '10px' },
  cps: { left: '50%', bottomOffset: 80 } // pixels above keystrokes
};

const keyMap = {};

function createModBox(mod) {
  const box = document.createElement("div");
  box.style.display = "flex";
  box.style.alignItems = "center";
  box.style.justifyContent = "space-between";
  box.style.padding = "12px 16px";
  box.style.marginBottom = "8px";
  box.style.background = "rgba(255,255,255,0.05)";
  box.style.borderRadius = "12px";
  box.style.fontFamily = '"Ubuntu", sans-serif';
  box.style.color = "white";

  const name = document.createElement("div");
  name.textContent = mod.name;
  name.style.fontSize = "16px";
  name.style.flex = "1";
  box.appendChild(name);

  const rightControls = document.createElement("div");
  rightControls.style.display = "flex";
  rightControls.style.alignItems = "center";
  rightControls.style.gap = "12px";

  // Toggle
  const toggle = document.createElement("label");
  toggle.className = "switch";
  const toggleInput = document.createElement("input");
  toggleInput.type = "checkbox";
  toggleInput.checked = mod.enabled;

  const slider = document.createElement("span");
  slider.className = "slider";
  toggle.append(toggleInput, slider);

  // When the toggle is clicked
  toggleInput.addEventListener("change", () => {
    mod.enabled = toggleInput.checked;
    saveModStates();
    if (mod.name === "Keystrokes" || mod.name === "CPS") {
      createKeystrokesHUD();
    }
    if (mod.name === "Ping") {
      createPingHUD();
    }

  });


  rightControls.appendChild(toggle);

  // Gear icon
  const gear = document.createElement("span");
  gear.innerHTML = `<img src="https://iili.io/Fq0uqKJ.png" alt="Settings" style="width:20px;height:20px;vertical-align:middle;">`;
  gear.style.cursor = "pointer";
  gear.title = `Customize ${mod.name}`;
  rightControls.appendChild(gear);

  box.appendChild(rightControls);
  return box;
}


function renderModsTab() {
  const modsContainer = document.getElementById("mods-tab");
  if (!modsContainer) {
    console.log("[Moonstone Client] (ERR) Element with id 'mods-tab' not found in the DOM.")
    return;
  }

  modsContainer.innerHTML = "";
  modList.forEach(mod => {
    const box = createModBox(mod);
    modsContainer.appendChild(box);
  });
  console.log("[Moonstone Client] Mods tab rendered successfully.");
}


function createKeystrokesHUD() {
  // Remove old
  const existingK = document.getElementById('moon-keystrokes');
  const existingC = document.getElementById('moon-cps');
  if (existingK) existingK.remove();
  if (existingC) existingC.remove();

  // Create HUD container if not exist
let hudContainer = document.getElementById('moon-hud-container');
if (!hudContainer) {
  hudContainer = document.createElement('div');
  hudContainer.id = 'moon-hud-container';
  hudContainer.style.position = 'fixed';
  hudContainer.style.top = '0';
  hudContainer.style.left = '0';
  hudContainer.style.width = '100vw';
  hudContainer.style.height = '100vh';
  hudContainer.style.zIndex = '9999';
  hudContainer.style.pointerEvents = 'none'; // Let HUD be clickable when needed
  document.body.appendChild(hudContainer);
}

const keystrokesEnabled = modList.find(mod => mod.name === "Keystrokes")?.enabled;
const cpsEnabled = modList.find(mod => mod.name === "CPS")?.enabled;


  if (!keystrokesEnabled && !cpsEnabled) return;

  // ============ KEYSTROKES HUD ============
  if (keystrokesEnabled) {
    const ksContainer = document.createElement('div');
    ksContainer.id = 'moon-keystrokes';
    ksContainer.style.position = 'fixed';
    ksContainer.style.bottom = hudPosition.keystrokes.bottom;
    ksContainer.style.left = hudPosition.keystrokes.left;
    ksContainer.style.transform = 'translateX(-50%)';
    ksContainer.style.zIndex = '9999';
    ksContainer.style.display = 'flex';
    ksContainer.style.flexDirection = 'column';
    ksContainer.style.alignItems = 'center';
    ksContainer.style.gap = '4px';

    const row1 = createKeyRow(['W']);
    const row2 = createKeyRow(['A', 'S', 'D']);
    const row3 = createKeyRow(['_________']);
    const row4 = createKeyRow(['LMB', 'RMB']);
    ksContainer.append(row1, row2, row3, row4);

    chrome.storage.local.get(['moon_hudPosK'], (res) => {
      if (res.moon_hudPosK) {
        ksContainer.style.left = res.moon_hudPosK.left;
        ksContainer.style.bottom = res.moon_hudPosK.bottom;
        ksContainer.style.transform = 'translateX(0%)';
      }
      hudContainer.appendChild(ksContainer);

    });
  }

  // ============ CPS COUNTER ============
  if (cpsEnabled) {
    const cps = document.createElement('div');
    cps.id = 'moon-cps';
    cps.style.position = 'fixed';
    cps.style.bottom = hudPosition.cps.bottomOffset + 'px';
    cps.style.left = hudPosition.cps.left;
    cps.style.transform = 'translateX(-50%)';
    cps.style.zIndex = '9999';
    cps.style.background = 'rgba(0, 0, 0, 0.6)';
    cps.style.color = 'white';
    cps.style.padding = '6px 12px';
    cps.style.borderRadius = '8px';
    cps.style.fontFamily = 'Arial';
    cps.style.fontSize = '14px';
    cps.style.display = 'flex';
    cps.style.gap = '6px';
    cps.style.justifyContent = 'center';
    cps.style.alignItems = 'center';

    const LMB = document.createElement('span');
    const slash = document.createElement('span');
    const RMB = document.createElement('span');
    slash.textContent = '|';
    cps.append(LMB, slash, RMB);

    chrome.storage.local.get(['moon_hudPosC'], (res) => {
      if (res.moon_hudPosC) {
        cps.style.left = res.moon_hudPosC.left;
        cps.style.bottom = res.moon_hudPosC.bottom;
        cps.style.transform = 'translateX(0%)';
      }
      hudContainer.appendChild(cps);

    });

    setInterval(() => {
      const now = Date.now();
      LMB.textContent = LMBClicks.filter(t => t > now - 1000).length;
      RMB.textContent = RMBClicks.filter(t => t > now - 1000).length;
    }, 100);
  }
}

let pingInterval;

function createPingHUD() {
  const pingEnabled = modList.find(mod => mod.name === "Ping")?.enabled;

  // Remove existing ping HUD if present
  const existingPing = document.getElementById('moon-ping');
  if (existingPing) existingPing.remove();

  if (!pingEnabled) {
    if (pingInterval) clearInterval(pingInterval);
    return;
  }

  // Create HUD container if not exist
  let hudContainer = document.getElementById('moon-hud-container');
  if (!hudContainer) {
    hudContainer = document.createElement('div');
    hudContainer.id = 'moon-hud-container';
    hudContainer.style.position = 'fixed';
    hudContainer.style.top = '0';
    hudContainer.style.left = '0';
    hudContainer.style.width = '100vw';
    hudContainer.style.height = '100vh';
    hudContainer.style.zIndex = '9999';
    hudContainer.style.pointerEvents = 'none';
    document.body.appendChild(hudContainer);
  }

  // Create Ping HUD
  const pingDiv = document.createElement('div');
  pingDiv.id = 'moon-ping';
  pingDiv.style.position = 'fixed';
  pingDiv.style.bottom = '140px'; // default position
  pingDiv.style.left = '50%';
  pingDiv.style.transform = 'translateX(-50%)';
  pingDiv.style.zIndex = '9999';
  pingDiv.style.background = 'rgba(0, 0, 0, 0.6)';
  pingDiv.style.color = 'white';
  pingDiv.style.padding = '6px 12px';
  pingDiv.style.borderRadius = '8px';
  pingDiv.style.fontFamily = 'Arial';
  pingDiv.style.fontSize = '14px';
  pingDiv.textContent = 'Ping: -- ms';

  // Apply saved position
  chrome.storage.local.get(['moon_hudPosP'], (res) => {
    if (res.moon_hudPosP) {
      pingDiv.style.left = res.moon_hudPosP.left;
      pingDiv.style.bottom = res.moon_hudPosP.bottom;
      pingDiv.style.transform = 'translateX(0%)';
    }
    hudContainer.appendChild(pingDiv);
  });

  // Make draggable in Edit HUD mode
  makeDraggable(pingDiv, 'moon_hudPosP');

  // Start ping updates
  pingInterval = setInterval(async () => {
    const ping = await getPing();
    pingDiv.textContent = `Ping: ${ping} ms`;

    if (ping <= 50) {
      pingDiv.style.color = 'lime';
    } else if (ping <= 150) {
      pingDiv.style.color = 'yellow';
    } else {
      pingDiv.style.color = 'red';
    }
  }, 1000);
}

function makeDraggable(element, storageKey) {
  let isDragging = false, startX, startY;

  element.addEventListener('mousedown', (e) => {
    if (!window.hudEditMode) return; // Only draggable in Edit HUD mode
    e.preventDefault();
    isDragging = true;
    startX = e.clientX - element.offsetLeft;
    startY = e.clientY - element.offsetTop;

    document.onmousemove = (e) => {
      if (isDragging) {
        element.style.left = e.clientX - startX + 'px';
        element.style.top = e.clientY - startY + 'px';
        element.style.bottom = 'auto';
      }
    };

    document.onmouseup = () => {
      if (isDragging) {
        isDragging = false;
        document.onmousemove = null;

        // Save new position
        chrome.storage.local.set({
          [storageKey]: {
            left: element.style.left,
            bottom: element.style.bottom || 'auto',
            top: element.style.top || 'auto'
          }
        });
      }
    };
  });
}


async function getPing() {
  const start = performance.now();
  try {
    await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' });
  } catch (err) {
    return 'ERR';
  }
  return Math.round(performance.now() - start);
}



let LMBClicks = [], RMBClicks = [];

function createCPSCounter(container) {
  if (!modList.find(m => m.name === "CPS")?.enabled) return;

  const cps = document.createElement('div');
  cps.id = 'moon-cps';
  cps.style.background = 'rgba(0, 0, 0, 0.6)';
  cps.style.color = 'white';
  cps.style.padding = '6px 12px';
  cps.style.borderRadius = '8px';
  cps.style.fontFamily = 'Arial';
  cps.style.fontSize = '14px';
  cps.style.display = 'flex';
  cps.style.gap = '6px';
  cps.style.justifyContent = 'center';
  cps.style.alignItems = 'center';

  const LMB = document.createElement('span');
  const slash = document.createElement('span');
  const RMB = document.createElement('span');
  slash.textContent = '|';
  cps.append(LMB, slash, RMB);

  container.appendChild(cps);

  setInterval(() => {
    const now = Date.now();
    LMB.textContent = LMBClicks.filter(t => t > now - 1000).length;
    RMB.textContent = RMBClicks.filter(t => t > now - 1000).length;
  }, 100);
}



function createKeyRow(keys) {
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.justifyContent = 'center';
  row.style.gap = '4px';
  keys.forEach(key => row.appendChild(createKeyElement(key)));
  return row;
}

function createKeyElement(text) {
  const div = document.createElement('div');
  div.classList.add('key-box');
  div.textContent = text;
  div.style.backgroundColor = '#000';
  div.style.color = '#fff';
  div.style.padding = '4px 8px';
  div.style.border = '1px solid white';
  div.style.borderRadius = '4px';
  div.style.fontSize = '16px';
  div.style.fontFamily = 'Arial';
  div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.5)';

  // Register the key for highlight
  const upper = text.toUpperCase();
  if (['W', 'A', 'S', 'D', 'LMB', 'RMB', '___'].includes(upper)) {
    keyMap[upper] = div;
  }

  return div;
}

function highlightKey(key, color) {
  document.querySelectorAll('.key-box').forEach(el => {
    const text = el.textContent;
    if (
      (key === 'w' && text === 'W') ||
      (key === 'a' && text === 'A') ||
      (key === 's' && text === 'S') ||
      (key === 'd' && text === 'D') ||
      (key === ' ' && text === '_________') ||
      (key === 'Shift' && (text === 'LMB' || text === 'RMB')) // optional, if you had Shift earlier
    ) {
      el.style.backgroundColor = color;
    }
  });
}

/* Hud
// function createEquipmentHUD() {
//   const existing = document.getElementById('moon-gear-hud');
//   if (existing) existing.remove();

//   const hud = document.createElement('div');
//   hud.id = 'moon-gear-hud';
//   hud.style.position = 'fixed';
//   hud.style.right = '20px';
//   hud.style.bottom = '20px';
//   hud.style.zIndex = '9999';
//   hud.style.background = 'rgba(0, 0, 0, 0.5)';
//   hud.style.border = '1px solid white';
//   hud.style.borderRadius = '8px';
//   hud.style.padding = '10px';
//   hud.style.display = 'flex';
//   hud.style.flexDirection = 'column';
//   hud.style.gap = '8px';

//   const slots = ['helmet', 'chestplate', 'gauntlets', 'leggings', 'boots'];

//   slots.forEach(slot => {
//     const wrapper = document.createElement('div');
//     wrapper.classList.add(`armor-${slot}`);

//     const img = document.createElement('img');
//     img.src = 'https://textures.bloxd.io/items/blank.png';
//     img.style.width = '32px';
//     img.style.height = '32px';
//     img.id = `img-${slot}`;

//     const label = document.createElement('span');
//     label.textContent = slot.charAt(0).toUpperCase() + slot.slice(1);
//     label.style.marginLeft = '8px';
//     label.style.color = 'white';

//     wrapper.appendChild(img);
//     wrapper.appendChild(label);
//     hud.appendChild(wrapper);
//   });

//   const arrowWrapper = document.createElement('div');
//   arrowWrapper.id = 'arrow-hud';

//   const arrowImg = document.createElement('img');
//   arrowImg.src = 'https://textures.bloxd.io/items/arrows.png';
//   arrowImg.style.width = '32px';
//   arrowImg.style.height = '32px';
//   arrowImg.id = 'img-arrows';

//   const arrowLabel = document.createElement('span');
//   arrowLabel.id = 'arrow-count';
//   arrowLabel.textContent = 'x0';
//   arrowLabel.style.marginLeft = '8px';
//   arrowLabel.style.color = 'white';

//   arrowWrapper.appendChild(arrowImg);
//   arrowWrapper.appendChild(arrowLabel);
//   hud.appendChild(arrowWrapper);

//   document.body.appendChild(hud);
// }



// function updateEquipmentHUD({ helmet, chestplate, gauntlets, leggings, boots, arrows }) {
//   const path = {
//     helmet: 'https://textures.bloxd.io/items/armor_helmet.png',
//     chestplate: 'https://textures.bloxd.io/items/armor_chestplate.png',
//     gauntlets: 'https://textures.bloxd.io/items/armor_gauntlets.png',
//     leggings: 'https://textures.bloxd.io/items/armor_leggings.png',
//     boots: 'https://textures.bloxd.io/items/armor_boots.png',
//     arrows: 'https://textures.bloxd.io/items/arrows.png',
//     blank: 'https://textures.bloxd.io/items/blank.png'
//   };

//   const slots = { helmet, chestplate, gauntlets, leggings, boots };

//   for (const [slot, equipped] of Object.entries(slots)) {
//     const img = document.getElementById(`img-${slot}`);
//     if (img) img.src = equipped ? path[slot] : path.blank;
//   }

//   const arrowLabel = document.getElementById('arrow-count');
//   if (arrowLabel) arrowLabel.textContent = `x${arrows || 0}`;
// }



// // EX
// createEquipmentHUD();

// updateEquipmentHUD({
//   helmet: true,
//   chest: true,
//   gauntlets: true,
//   legs: false,
//   boots: true,
//   arrows: 9
// });

*/

function createPackNameHUD() {
  if (!modList.find(m => m.name === "PackName")?.enabled) return;
  const existing = document.getElementById('moon-packname');
  if (existing) existing.remove();

  chrome.storage.local.get('moon_packName', res => {
    const packName = res.moon_packName || 'Default';

    const hud = document.createElement('div');
    hud.id = 'moon-packname';
    hud.textContent = `Pack: ${packName}`;
    hud.style.position = 'fixed';
    hud.style.top = '20px';
    hud.style.right = '20px';
    hud.style.zIndex = '9999';
    hud.style.background = 'rgba(0,0,0,0.5)';
    hud.style.color = 'white';
    hud.style.padding = '6px 10px';
    hud.style.borderRadius = '6px';
    hud.style.fontFamily = 'Arial';
    hud.style.fontSize = '14px';
    document.body.appendChild(hud);
  });
}

function monitorPackNameChanges() {
  if (!modList.find(m => m.name === "PackName")?.enabled) return;
  const interval = setInterval(() => {
    const el = document.querySelector('.CustomTextureFolderUploadInstructions.Active');
    if (el) {
      const packName = el.innerText.trim();
      if (packName) {
        chrome.storage.local.set({ moon_packName: packName }, () => {
          console.log("[Moonstone] Saved texture pack:", packName);
        });
      }
    }
  }, 1000); // Check every second

  // Optional: stop after 15 seconds
  setTimeout(() => clearInterval(interval), 15000);
}

function updatePackNameHUD(name) {
  if (!modList.find(m => m.name === "PackName")?.enabled) return;
  let hud = document.getElementById('moon-packname');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'moon-packname';
    hud.style.position = 'fixed';
    hud.style.top = '20px';
    hud.style.right = '20px';
    hud.style.zIndex = '9999';
    hud.style.background = 'rgba(0,0,0,0.5)';
    hud.style.color = 'white';
    hud.style.padding = '6px 10px';
    hud.style.borderRadius = '6px';
    hud.style.fontFamily = 'Ubuntu, Arial, sans-serif';
    hud.style.fontSize = '14px';
    document.body.appendChild(hud);
  }
  hud.textContent = `Pack: ${name}`;
}