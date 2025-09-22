/* Background service-worker for Moonstone extension
**EXPLAINATION:**

By zooming in on Bloxd.io tabs to ZOOM_LEVEL%, this helps reduce the resolution (the more zoom in, the lower resoultion, and opposite with zoom out), making the game-
render more smoothly on lower-end devices. This can be config in the menu or by editing the ZOOM_LEVEL constant below.

*/

// Background service-worker: auto-zoom Bloxd.io tabs to 200 %
const ZOOM_LEVEL = 1.33; // Default zoom level (200%)




// Whenever a tab finishes loading, check its URL
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status !== 'complete') return;
  if (!tab.url || !tab.url.includes('https://*.bloxd.io/*')) return;
  if (!modList.find(mod => mod.name === "Resolution Changer")?.enabled) return;

  // Set true browser zoom
  chrome.tabs.setZoom(tabId, ZOOM_LEVEL, () => {
    if (chrome.runtime.lastError) {
      console.warn('[Moonstone] Zoom failed:', chrome.runtime.lastError.message);
    } else {
      console.log('[Moonstone] Zoom set to 200 % on', tab.url);
    }
  });
});
