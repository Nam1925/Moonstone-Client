(() => {
  'use strict';

  // Moonstone Client Content Script
  // Original Author: Nam1925
  const version = "1.13.1";
  /*
  Last Build Date: 2025-06-28 UTC+7
  ---------------------------------
  This is open-source, feel free to modify and use it as you wish.
  Please leave the original author credit in the description.
  */




// ============ P1. INITIALIZATION & MENU ============
  console.log("[Moostone Client] Content script started.");

  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Ubuntu&display=swap'; // Load Ubuntu font


  // Fix the tab title and add icon
  function showVersionTag() {
    const url = window.location.href;
    // Remove old tag if exists
    const oldTag = document.getElementById('moonstone-version-tag');
    if (oldTag) oldTag.remove();

    if (!url.includes("play")) {
      const versionTag = document.createElement('div');
      versionTag.id = 'moonstone-version-tag';
      const now = new Date();
      const month = now.getMonth() + 1;
      const date = now.getDate();
      if (month == 8 && date == 9) {
      versionTag.textContent = `Moonstone v${version} | Happy Birthday Nam1925! 🥳`; 
    }
      else versionTag.textContent = `Moonstone v${version}`;
      versionTag.style.position = 'fixed';
      versionTag.style.left = '10px';
      versionTag.style.bottom = '8px';
      versionTag.style.color = 'white';
      versionTag.style.fontSize = '14px';
      versionTag.style.fontFamily = '"Ubuntu", sans-serif';
      versionTag.style.opacity = '0.7';
      versionTag.style.zIndex = '9999';
      document.body.appendChild(versionTag);
    }
  }

  // Initial run
  showVersionTag();

  const observer = new MutationObserver(() => {
    const el = document.querySelector('.CustomTextureFolderUploadInstructions.Active');
    if (el) {
      const packName = el.innerText.trim();
      if (packName) {
        chrome.storage.local.get('moon_packName', data => {
          if (data.moon_packName !== packName) {
            chrome.storage.local.set({ moon_packName: packName }, () => {
              console.log(`[Moonstone] Detected and saved new pack: ${packName}`);
              updatePackNameHUD(packName);
            });
          }
        });
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });


  // Listen for SPA navigation (Bloxd.io uses client-side navigation)
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      showVersionTag();
      document.title = `Moonstone Client | ${document.title}`;
    }
  }).observe(document.body, { childList: true, subtree: true });

  chrome.storage.local.get('moon_packName', res => {
    if (res.moon_packName) updatePackNameHUD(res.moon_packName);
    else updatePackNameHUD('Default')
  });



// Menu
let menuOpen = false;
let menuEl = null;
let backdrop = null;
let hudEditMode = false;
let hudExitButton = null;


const baseWidth = 1000;
const baseHeight = 600;

function getZoomFactor() {
  return window.devicePixelRatio || 1;
}

function updateMenuSize() {
  const zoom = getZoomFactor();
  if (menuEl) {
    menuEl.style.width = `${baseWidth / zoom}px`;
    menuEl.style.height = `${baseHeight / zoom}px`;
  }
}

const style = document.createElement('style');
style.textContent = `
  .tab-button.active-tab {
    background: rgba(255,255,255,0.2) !important;
  }
  .switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 22px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    background-color: #ccc;
    border-radius: 34px;
    top: 0; left: 0;
    right: 0; bottom: 0;
    transition: 0.4s;
    background-color: #333;
  }

  
  .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    border-radius: 50%;
    transition: 0.4s;
  }

  .switch input:checked + .slider {
    background-color: #ccc;
  }

  .switch input:checked + .slider:before {
    transform: translateX(18px);
  }
`;
document.head.appendChild(style);

function createMenu() {
  // Backdrop
  backdrop = document.createElement('div');
  backdrop.style.position = 'fixed';
  backdrop.style.top = '0';
  backdrop.style.left = '0';
  backdrop.style.width = '100vw';
  backdrop.style.height = '100vh';
  backdrop.style.background = 'transparent';
  backdrop.style.zIndex = '9998';
  backdrop.addEventListener('click', toggleMenu);
  document.body.appendChild(backdrop);

  // Menu box
  menuEl = document.createElement('div');
  menuEl.style.position = 'fixed';
  menuEl.style.top = '50%';
  menuEl.style.left = '50%';
  menuEl.style.transform = 'translate(-50%, -50%) scale(0.9)';
  menuEl.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
  menuEl.style.opacity = '0';
  menuEl.style.background = 'rgba(0, 0, 0, 0.85)';
  menuEl.style.borderRadius = '16px';
  menuEl.style.zIndex = '9999';
  menuEl.style.color = 'white';
  menuEl.style.padding = '0';
  menuEl.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
  menuEl.style.overflow = 'hidden';
  document.body.appendChild(menuEl);

  updateMenuSize();
  buildMenuContent();

  // Animate in
  requestAnimationFrame(() => {
    menuEl.style.opacity = '1';
    menuEl.style.transform = 'translate(-50%, -50%) scale(1)';
  });
}


function toggleMenu() {
  if (!menuEl) {
    createMenu();
    menuOpen = true;
  } else {
    menuOpen = !menuOpen;
    menuEl.style.display = menuOpen ? 'block' : 'none';
    backdrop.style.display = menuOpen ? 'block' : 'none';

    if (menuOpen) {
      updateMenuSize();
    }
  }
}

// Edit Hud Mode
function toggleHudEditMode(enable) {
  hudEditMode = enable;

  const hud = document.getElementById('moon-hud-container');
  if (!hud) return;

  const keyHUD = document.getElementById('moon-keystrokes');
  const cpsHUD = document.getElementById('moon-cps');
  const pingHUD = document.getElementById('moon-ping');

  if (enable) {
    // Hide menu and backdrop
    if (menuEl) menuEl.style.display = 'none';
    if (backdrop) backdrop.style.display = 'none';

    // Enable HUD editing
    hud.style.pointerEvents = 'auto';
    hud.style.outline = '2px dashed white';

    // Dark overlay
    const editOverlay = document.createElement('div');
    editOverlay.id = 'moon-edit-overlay';
    editOverlay.style.position = 'fixed';
    editOverlay.style.top = '0';
    editOverlay.style.left = '0';
    editOverlay.style.width = '100vw';
    editOverlay.style.height = '100vh';
    editOverlay.style.background = 'rgba(0, 0, 0, 0.4)';
    editOverlay.style.zIndex = '9998';
    editOverlay.style.opacity = '0';
    editOverlay.style.transition = 'opacity 0.3s ease';
    document.body.appendChild(editOverlay);
    requestAnimationFrame(() => editOverlay.style.opacity = '1');

    // OK button
    hudExitButton = document.createElement('button');
    hudExitButton.textContent = 'OK';
    hudExitButton.style.position = 'fixed';
    hudExitButton.style.top = '50%';
    hudExitButton.style.left = '50%';
    hudExitButton.style.transform = 'translate(-50%, -50%)';
    hudExitButton.style.background = 'rgba(255,255,255,0.2)';
    hudExitButton.style.border = '2px solid rgba(255,255,255,0.6)';
    hudExitButton.style.padding = '14px 28px';
    hudExitButton.style.borderRadius = '12px';
    hudExitButton.style.color = 'white';
    hudExitButton.style.fontSize = '20px';
    hudExitButton.style.fontFamily = '"Ubuntu", sans-serif';
    hudExitButton.style.cursor = 'pointer';
    hudExitButton.style.zIndex = '9999';
    hudExitButton.style.boxShadow = '0 0 20px rgba(255,255,255,0.5)';

    // Hover effect
    hudExitButton.onmouseenter = () => {
      hudExitButton.style.background = 'rgba(255,255,255,0.3)';
      hudExitButton.style.boxShadow = '0 0 30px rgba(255,255,255,0.8)';
    };
    hudExitButton.onmouseleave = () => {
      hudExitButton.style.background = 'rgba(255,255,255,0.2)';
      hudExitButton.style.boxShadow = '0 0 20px rgba(255,255,255,0.5)';
    };

    document.body.appendChild(hudExitButton);

    // Glow animation
    hudExitButton.animate(
      [
        { boxShadow: '0 0 20px rgba(255,255,255,0.5)' },
        { boxShadow: '0 0 35px rgba(255,255,255,0.9)' },
        { boxShadow: '0 0 20px rgba(255,255,255,0.5)' }
      ],
      { duration: 1500, iterations: Infinity }
    );

    // Click or ESC to exit
    hudExitButton.onclick = () => toggleHudEditMode(false);
    const escHandler = (e) => { if (e.key === 'Escape') toggleHudEditMode(false); };
    document.addEventListener('keydown', escHandler);
    hudExitButton._escHandler = escHandler;

    // Enable dragging for all HUDs
    [keyHUD, cpsHUD, pingHUD].forEach(el => {
      if (el) {
        el.style.pointerEvents = 'auto';
        makeDraggableHUD(el);
      }
    });

  } else {
    // Exit edit mode
    hud.style.pointerEvents = 'none';
    hud.style.outline = 'none';

    if (menuEl && menuOpen) menuEl.style.display = 'block';
    if (backdrop && menuOpen) backdrop.style.display = 'block';

    if (hudExitButton) {
      document.removeEventListener('keydown', hudExitButton._escHandler);
      hudExitButton.remove();
      hudExitButton = null;
    }

    const overlay = document.getElementById('moon-edit-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    }

    // Disable drag + save positions
    if (keyHUD) {
      keyHUD.style.pointerEvents = 'none';
      keyHUD.onmousedown = null;
      chrome.storage.local.set({
        moon_hudPosK: { left: keyHUD.style.left, bottom: keyHUD.style.bottom }
      });
    }
    if (cpsHUD) {
      cpsHUD.style.pointerEvents = 'none';
      cpsHUD.onmousedown = null;
      chrome.storage.local.set({
        moon_hudPosC: { left: cpsHUD.style.left, bottom: cpsHUD.style.bottom }
      });
    }
    if (pingHUD) {
      pingHUD.style.pointerEvents = 'none';
      pingHUD.onmousedown = null;
      chrome.storage.local.set({
        moon_hudPosP: { left: pingHUD.style.left, bottom: pingHUD.style.bottom }
      });
    }

    hud.style.cursor = 'default';
    document.onmouseup = null;
    document.onmousemove = null;
  }
}



function makeDraggableHUD(el) {
  let offsetX = 0, offsetY = 0;
  el.style.cursor = 'move';

  el.onmousedown = function(e) {
    e.preventDefault();
    offsetX = e.clientX - el.getBoundingClientRect().left;
    offsetY = e.clientY - el.getBoundingClientRect().top;

    document.onmousemove = function(e) {
      e.preventDefault();
      el.style.left = e.clientX - offsetX + "px";
      el.style.bottom = (window.innerHeight - e.clientY - el.offsetHeight + offsetY) + "px";
      el.style.right = 'unset';
      el.style.top = 'unset';
      el.style.transform = 'translateX(0%)';
    };

    document.onmouseup = function() {
      document.onmouseup = null;
      document.onmousemove = null;
    };
  };
}



function buildMenuContent() {
  menuEl.innerHTML = ''; // Clear menu first

  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.height = '100%';

  // Sidebar
  const sidebar = document.createElement('div');
  sidebar.style.width = '110px';
  sidebar.style.background = 'rgba(255,255,255,0.05)';
  sidebar.style.padding = '10px 6px';
  sidebar.style.display = 'flex';
  sidebar.style.flexDirection = 'column';
  sidebar.style.alignItems = 'stretch';
  sidebar.style.borderRight = '1px solid rgba(255,255,255,0.1)';
  sidebar.style.position = 'relative';

  const title = document.createElement('div');
  title.innerText = 'Moonstone\nClient';
  title.style.fontFamily = '"Ubuntu", sans-serif';
  title.style.color = 'white';
  title.style.fontSize = '20px';
  title.style.fontWeight = 'bold';
  title.style.whiteSpace = 'pre-line';
  title.style.marginBottom = '16px';
  title.style.textAlign = 'center';

  const editHudBtn = document.createElement('button');
  editHudBtn.textContent = "Edit HUD";
  styleButton(editHudBtn, true);
  editHudBtn.style.height = '36px';

    editHudBtn.addEventListener('click', () => {
      toggleHudEditMode(true);
    });


  const sidebarContent = document.createElement('div');
  sidebarContent.style.display = 'flex';
  sidebarContent.style.flexDirection = 'column';
  sidebarContent.style.justifyContent = 'space-between';

  const topPart = document.createElement('div');
  topPart.append(title);

  const bottomPart = document.createElement('div');
  bottomPart.appendChild(editHudBtn);
  bottomPart.style.marginTop = 'auto';

  sidebarContent.append(topPart, bottomPart);
  sidebar.appendChild(sidebarContent);

  // Content Area
  const contentArea = document.createElement('div');
  contentArea.style.flex = '1';
  contentArea.style.padding = '20px';
  contentArea.style.overflowY = 'auto';

  // --- Mods Section ---
  const modsHeader = document.createElement('h2');
  modsHeader.textContent = 'Mods';
  contentArea.appendChild(modsHeader);

  const modsContainer = document.createElement('div');
  modsContainer.id = 'mods-tab';
  contentArea.appendChild(modsContainer);

  // Append both parts
  wrapper.append(sidebar, contentArea);
  menuEl.appendChild(wrapper);

  renderModsTab();
}



function styleButton(btn, isStandalone = false) {
  btn.style.background = isStandalone ? 'rgba(255,255,255,0.1)' : 'transparent';
  btn.style.border = 'none';
  btn.style.padding = '10px';
  btn.style.borderRadius = '0';
  btn.style.width = '100%';
  btn.style.height = '50%';
  btn.style.background = 'rgba(255,255,255,0.05)';
  btn.style.textAlign = 'left';
  btn.style.justifyContent = 'flex-start';
  btn.style.paddingLeft = '8px';
  btn.onmouseenter = () => btn.style.background = 'rgba(255,255,255,0.1)';
  btn.onmouseleave = () => {
    if (!btn.classList.contains('active-tab'))
      btn.style.background = 'rgba(255,255,255,0.05)';
  };

  btn.style.color = 'white';
  btn.style.fontSize = '16px';
  btn.style.cursor = 'pointer';
  btn.style.transition = 'background 0.2s';
  btn.style.textAlign = 'left';
  if (isStandalone) {
    btn.onmouseenter = () => btn.style.background = 'rgba(255,255,255,0.2)';
    btn.onmouseleave = () => btn.style.background = 'rgba(255,255,255,0.1)';
  }
}

function styleTab(btn) {
  styleButton(btn);
  btn.style.borderRadius = '6px';
  btn.classList.add('tab-button');
  btn.onclick = () => {
  document.querySelectorAll('.tab-button').forEach(el => {
    el.classList.remove('active-tab');
    el.style.background = 'rgba(255,255,255,0.05)';
  });
  btn.classList.add('active-tab');
  btn.style.background = 'rgba(255,255,255,0.2)';
};

}


function styleButton(btn) {
  btn.style.background = 'rgba(255,255,255,0.1)';
  btn.style.border = 'none';
  btn.style.padding = '10px';
  btn.style.borderRadius = '8px';
  btn.style.color = 'white';
  btn.style.fontSize = '16px';
  btn.style.cursor = 'pointer';
  btn.style.transition = 'background 0.2s';
  btn.onmouseenter = () => btn.style.background = 'rgba(255,255,255,0.2)';
  btn.onmouseleave = () => btn.style.background = 'rgba(255,255,255,0.1)';
}

/*
  This file defines the Mods tab UI for the Bloxd Mods Chrome extension.
  It uses dynamic creation of mod boxes styled according to the user's finalized HTML/CSS template.
*/



// ============ P3. EVENT LISTENERS ============


document.addEventListener('click', (e) => {
  if (e.button === 0) LMBClicks.push(Date.now());
  if (e.button === 2) RMBClicks.push(Date.now());
});

document.addEventListener('contextmenu', (e) => {
  // Prevent context menu popup
  e.preventDefault();
  RMBClicks.push(Date.now());
});


document.addEventListener('keydown', e => {
  if (e.code === 'ShiftRight') {
    toggleMenu();
  } else if (e.code === 'Escape' && menuOpen) {
    toggleMenu();
  } else if (e.code === 'Escape') {
  if (hudEditMode) toggleHudEditMode(false);
  else if (menuOpen) toggleMenu();
}


  highlightKey(e.key.toLowerCase(), '#547fff');
});

document.addEventListener('keyup', e => {
  highlightKey(e.key.toLowerCase(), '#000');
});

document.addEventListener('mousedown', e => {
  if (e.button === 0) {
    if (keyMap['LMB']) keyMap['LMB'].style.backgroundColor = '#547fff';
  }
  if (e.button === 2) {
    if (keyMap['RMB']) keyMap['RMB'].style.backgroundColor = '#547fff';
  }
});

document.addEventListener('mouseup', e => {
  if (e.button === 0 && keyMap['LMB']) keyMap['LMB'].style.backgroundColor = '#000';
  if (e.button === 2 && keyMap['RMB']) keyMap['RMB'].style.backgroundColor = '#000';
});

  console.log("[Moonstone Client] Content script loaded successfully.");
})();
