chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "toggle-qr",
      title: "QRコード表示を切り替え",
      contexts: ["all"]
    });
  
    chrome.storage.sync.set({ qrEnabled: true });
  });
  
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "toggle-qr") {
      const { qrEnabled } = await chrome.storage.sync.get("qrEnabled");
      const newState = !qrEnabled;
      await chrome.storage.sync.set({ qrEnabled: newState });
  
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (state) => {
          window.dispatchEvent(new CustomEvent("qr-toggle", { detail: state }));
        },
        args: [newState]
      });
    }
  });
  