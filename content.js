const popover = document.createElement("div");
popover.className = "qr-popover";
document.body.appendChild(popover);

let currentAnchor = null;
let isEnabled = true;

chrome.storage.sync.get("qrEnabled", (data) => {
  isEnabled = data.qrEnabled ?? true;
});

window.addEventListener("qr-toggle", (e) => {
  isEnabled = e.detail;
  if (!isEnabled) {
    popover.style.display = "none";
    popover.innerHTML = "";
  }
});

document.addEventListener("mouseover", (e) => {
  if (!isEnabled) return;

  const target = e.target.closest("a");
  if (target && target.href !== currentAnchor) {
    currentAnchor = target.href;

    popover.innerHTML = "";

    new QRCode(popover, {
      width: 128,
      height: 128,
      text: currentAnchor
    });

    const rect = target.getBoundingClientRect();
    popover.style.left = `${rect.right + window.scrollX + 10}px`;
    popover.style.top = `${rect.top + window.scrollY}px`;
    popover.style.display = "block";
  }
});

document.addEventListener("mouseout", (e) => {
  if (!isEnabled) return;

  if (e.target.closest("a")) {
    currentAnchor = null;
    popover.style.display = "none";
    popover.innerHTML = "";
  }
});
