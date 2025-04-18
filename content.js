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
      width: 256,
      height: 256,
      text: currentAnchor
    });

    const rect = target.getBoundingClientRect();
    const popoverWidth = 256; // QRコードの幅
    const popoverHeight = 256; // QRコードの高さ

    let left = rect.right + window.scrollX + 10;
    let top = rect.top + window.scrollY;

    // ウィンドウの右端を超える場合
    if (left + popoverWidth > window.innerWidth) {
      left = rect.left + window.scrollX - popoverWidth - 10;
    }

    // ウィンドウの下端を超える場合
    if (top + popoverHeight > window.innerHeight) {
      top = window.innerHeight - popoverHeight - 10;
    }

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
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
