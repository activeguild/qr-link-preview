chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "toggle-qr",
      title: "QRコード表示を切り替え",
      contexts: ["all"]
    });

    chrome.contextMenus.create({
      id: "qr-size-small",
      title: "QRコードサイズ: 小 (128px)",
      contexts: ["all"]
    });

    chrome.contextMenus.create({
      id: "qr-size-medium",
      title: "QRコードサイズ: 中 (192px)",
      contexts: ["all"]
    });

    chrome.contextMenus.create({
      id: "qr-size-large",
      title: "QRコードサイズ: 大 (256px)",
      contexts: ["all"]
    });
  
    chrome.storage.sync.set({ qrEnabled: true, qrSize: 192 });
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
    } else if (info.menuItemId.startsWith("qr-size-")) {
      let newSize;
      switch (info.menuItemId) {
        case "qr-size-small":
          newSize = 128;
          break;
        case "qr-size-medium":
          newSize = 192;
          break;
        case "qr-size-large":
          newSize = 256;
          break;
      }
      
      await chrome.storage.sync.set({ qrSize: newSize });
      
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (size) => {
          window.dispatchEvent(new CustomEvent("qr-size-change", { detail: size }));
        },
        args: [newSize]
      });
    }
  });
  