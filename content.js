const popover = document.createElement("div");
popover.className = "qr-popover";
document.body.appendChild(popover);

let currentAnchor = null;
let isEnabled = true;
let qrSize = 192; // Increased default size from 128 to 192
let hideTimeout = null;

chrome.storage.sync.get(["qrEnabled", "qrSize"], (data) => {
  isEnabled = data.qrEnabled ?? true;
  qrSize = data.qrSize ?? 192;
});

window.addEventListener("qr-toggle", (e) => {
  isEnabled = e.detail;
  if (!isEnabled) {
    hidePopover();
  }
});

window.addEventListener("qr-size-change", (e) => {
  qrSize = e.detail;
});

function hidePopover() {
  popover.style.display = "none";
  popover.innerHTML = "";
  currentAnchor = null;
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
}

function getBestPosition(rect, popoverWidth, popoverHeight) {
  const margin = 10;
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY
  };

  // Try right position (default)
  if (rect.right + margin + popoverWidth <= viewport.width + viewport.scrollX) {
    return {
      left: rect.right + viewport.scrollX + margin,
      top: rect.top + viewport.scrollY
    };
  }

  // Try left position
  if (rect.left - margin - popoverWidth >= viewport.scrollX) {
    return {
      left: rect.left + viewport.scrollX - margin - popoverWidth,
      top: rect.top + viewport.scrollY
    };
  }

  // Try bottom position
  if (rect.bottom + margin + popoverHeight <= viewport.height + viewport.scrollY) {
    return {
      left: Math.max(viewport.scrollX, Math.min(rect.left + viewport.scrollX, viewport.width + viewport.scrollX - popoverWidth)),
      top: rect.bottom + viewport.scrollY + margin
    };
  }

  // Try top position
  if (rect.top - margin - popoverHeight >= viewport.scrollY) {
    return {
      left: Math.max(viewport.scrollX, Math.min(rect.left + viewport.scrollX, viewport.width + viewport.scrollX - popoverWidth)),
      top: rect.top + viewport.scrollY - margin - popoverHeight
    };
  }

  // Fallback to right position (original behavior)
  return {
    left: rect.right + viewport.scrollX + margin,
    top: rect.top + viewport.scrollY
  };
}

document.addEventListener("mouseover", (e) => {
  if (!isEnabled) return;

  const target = e.target.closest("a");
  if (target && target.href && target.href !== currentAnchor) {
    // Clear any pending hide timeout
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    currentAnchor = target.href;

    popover.innerHTML = "";

    // Create QR code container
    const qrContainer = document.createElement("div");
    qrContainer.className = "qr-container";
    
    new QRCode(qrContainer, {
      width: qrSize,
      height: qrSize,
      text: currentAnchor
    });

    // Create download button
    const downloadBtn = document.createElement("button");
    downloadBtn.className = "qr-download-btn";
    downloadBtn.textContent = "ダウンロード";
    downloadBtn.onclick = (event) => {
      event.stopPropagation();
      const canvas = qrContainer.querySelector("canvas");
      if (canvas) {
        const link = document.createElement("a");
        link.download = "qrcode.png";
        link.href = canvas.toDataURL();
        link.click();
      }
    };

    popover.appendChild(qrContainer);
    popover.appendChild(downloadBtn);

    const rect = target.getBoundingClientRect();
    const popoverSize = qrSize + 60; // QR size + padding + button
    const position = getBestPosition(rect, popoverSize, popoverSize);
    
    popover.style.left = `${position.left}px`;
    popover.style.top = `${position.top}px`;
    popover.style.display = "block";
  }
});

document.addEventListener("mouseout", (e) => {
  if (!isEnabled) return;

  if (e.target.closest("a")) {
    // Delay hiding to allow user to move to popover
    hideTimeout = setTimeout(() => {
      // Double-check if mouse is still not over the popover or any link
      const isOverPopover = popover.matches(':hover');
      const isOverLink = document.querySelector('a:hover');
      
      if (!isOverPopover && !isOverLink) {
        hidePopover();
      }
    }, 500); // Increased delay to 500ms for better UX
  }
});

// Keep popover visible when mouse is over it
popover.addEventListener("mouseenter", () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
});

// Hide popover when mouse leaves it
popover.addEventListener("mouseleave", () => {
  hideTimeout = setTimeout(() => {
    hidePopover();
  }, 200); // Slightly longer delay to prevent flickering
});

// Hide popover when clicking on any link (navigation)
document.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    hidePopover();
  }
});

// Hide popover on page navigation/unload
window.addEventListener("beforeunload", () => {
  hidePopover();
});

window.addEventListener("pagehide", () => {
  hidePopover();
});

// Hide popover on SPA navigation (popstate)
window.addEventListener("popstate", () => {
  hidePopover();
});
