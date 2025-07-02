// Load current settings when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const { qrSize, qrStocks } = await chrome.storage.sync.get(['qrSize', 'qrStocks']);
    const currentSize = qrSize || 192;
    
    // Set the current size radio button
    const sizeRadio = document.querySelector(`input[name="qrSize"][value="${currentSize}"]`);
    if (sizeRadio) {
        sizeRadio.checked = true;
    }
    
    // Load and display stocks
    displayStocks(qrStocks || []);
});

function displayStocks(stocks) {
    const stocksList = document.getElementById('qr-stocks-list');
    const stocksEmpty = document.getElementById('qr-stocks-empty');
    
    if (stocks.length === 0) {
        stocksList.innerHTML = '';
        stocksEmpty.style.display = 'block';
        return;
    }
    
    stocksEmpty.style.display = 'none';
    
    stocksList.innerHTML = stocks.map(stock => {
        const date = new Date(stock.createdAt).toLocaleDateString('ja-JP');
        return `
            <div class="stock-item" data-stock-id="${stock.id}">
                <div class="stock-item-header">
                    <span class="stock-name">${escapeHtml(stock.name)}</span>
                    <span class="stock-date">${date}</span>
                </div>
                <div class="stock-url">${escapeHtml(stock.url)}</div>
                <div class="stock-actions">
                    <button class="stock-btn stock-btn-download" onclick="downloadStock('${stock.id}')">ダウンロード</button>
                    <button class="stock-btn stock-btn-rename" onclick="renameStock('${stock.id}')">名前変更</button>
                    <button class="stock-btn stock-btn-delete" onclick="deleteStock('${stock.id}')">削除</button>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function downloadStock(stockId) {
    const { qrStocks = [] } = await chrome.storage.sync.get('qrStocks');
    const stock = qrStocks.find(s => s.id === stockId);
    
    if (stock) {
        const link = document.createElement('a');
        link.download = `${stock.name}.png`;
        link.href = stock.qrData;
        link.click();
    }
}

async function renameStock(stockId) {
    const { qrStocks = [] } = await chrome.storage.sync.get('qrStocks');
    const stock = qrStocks.find(s => s.id === stockId);
    
    if (!stock) return;
    
    const newName = prompt('新しい名前を入力してください:', stock.name);
    if (newName && newName.trim()) {
        stock.name = newName.trim();
        await chrome.storage.sync.set({ qrStocks });
        displayStocks(qrStocks);
        showSaveStatus();
    }
}

async function deleteStock(stockId) {
    if (!confirm('このQRコードを削除しますか？')) return;
    
    const { qrStocks = [] } = await chrome.storage.sync.get('qrStocks');
    const updatedStocks = qrStocks.filter(s => s.id !== stockId);
    
    await chrome.storage.sync.set({ qrStocks: updatedStocks });
    displayStocks(updatedStocks);
    showSaveStatus();
}

function showSaveStatus() {
    const saveStatus = document.getElementById('saveStatus');
    saveStatus.classList.add('show');
    setTimeout(() => {
        saveStatus.classList.remove('show');
    }, 2000);
}

// Handle size change
document.querySelectorAll('input[name="qrSize"]').forEach(radio => {
    radio.addEventListener('change', async (e) => {
        const newSize = parseInt(e.target.value);
        
        // Save to storage
        await chrome.storage.sync.set({ qrSize: newSize });
        
        // Show save confirmation
        showSaveStatus();
        
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