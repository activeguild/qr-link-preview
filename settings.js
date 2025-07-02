// Load current settings when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const { qrSize } = await chrome.storage.sync.get('qrSize');
    const currentSize = qrSize || 192;
    
    // Set the current size radio button
    const sizeRadio = document.querySelector(`input[name="qrSize"][value="${currentSize}"]`);
    if (sizeRadio) {
        sizeRadio.checked = true;
    }
});

// Handle size change
document.querySelectorAll('input[name="qrSize"]').forEach(radio => {
    radio.addEventListener('change', async (e) => {
        const newSize = parseInt(e.target.value);
        
        // Save to storage
        await chrome.storage.sync.set({ qrSize: newSize });
        
        // Show save confirmation
        const saveStatus = document.getElementById('saveStatus');
        saveStatus.classList.add('show');
        setTimeout(() => {
            saveStatus.classList.remove('show');
        }, 2000);
        
        // Notify all tabs about the size change
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (size) => {
                    window.dispatchEvent(new CustomEvent("qr-size-change", { detail: size }));
                },
                args: [newSize]
            }).catch(() => {
                // Ignore errors for tabs that can't run scripts
            });
        });
    });
});