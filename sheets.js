// Google Sheets Integration
const SPREADSHEET_ID = '1P0T6I6pVW0e6EcfFwSh3y5PJ2h_18PtH9utwEx0i00c';
const SHEET_RANGE = 'Sheet1!A1:Z100'; // Adjust range as needed
const API_KEY = 'YOUR_API_KEY'; // You'll need to add your API key here
const CLIENT_ID = 'YOUR_CLIENT_ID'; // You'll need to add your client ID here

// Discovery doc URL for APIs
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

// Authorization scopes required by the API
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Initialize the Google Sheets API
function initializeGoogleSheets() {
    // Load the Google API client library
    if (typeof gapi !== 'undefined') {
        gapi.load('client', initializeGapiClient);
    } else {
        console.log('Google API not loaded yet, retrying...');
        setTimeout(initializeGoogleSheets, 1000);
    }
}

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        console.log('Google API client initialized');
        
        // Try to load sheet with API key (public sheets only)
        loadSheetData();
    } catch (error) {
        console.error('Error initializing Google API client:', error);
        showAuthButton();
    }
}

// Show auth button if needed
function showAuthButton() {
    const authBtn = document.getElementById('authorizeGoogle');
    if (authBtn) {
        authBtn.style.display = 'inline-block';
        authBtn.addEventListener('click', handleAuthClick);
    }
}

// Handle auth button click
function handleAuthClick() {
    // For now, we'll use API key method
    // For OAuth2, you'd need to set up proper authentication
    console.log('Authentication would be handled here');
    loadSheetData();
}

// Load spreadsheet data
async function loadSheetData() {
    const container = document.getElementById('sheetContainer');
    
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Loading spreadsheet data...</div>';
    
    try {
        // Try to fetch the spreadsheet data
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: SHEET_RANGE,
        });
        
        const values = response.result.values;
        
        if (values && values.length > 0) {
            displaySheetData(values);
        } else {
            container.innerHTML = '<div class="loading">No data found in spreadsheet</div>';
        }
    } catch (error) {
        console.error('Error loading spreadsheet:', error);
        
        // Try alternative method using public URL
        loadSheetDataPublic();
    }
}

// Alternative method to load public sheet data
async function loadSheetDataPublic() {
    const container = document.getElementById('sheetContainer');
    
    try {
        // Use Google Sheets public CSV export
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=577350619`;
        
        const response = await fetch(csvUrl, {
            mode: 'no-cors' // This will work for public sheets
        });
        
        // Since no-cors blocks reading the response, we'll embed the sheet instead
        displayEmbeddedSheet();
        
    } catch (error) {
        console.error('Error loading public sheet:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>Unable to load spreadsheet data directly.</p>
                <p>Please ensure the sheet is publicly accessible or use the embedded view below.</p>
            </div>
        `;
        displayEmbeddedSheet();
    }
}

// Display sheet data in a table
function displaySheetData(values) {
    const container = document.getElementById('sheetContainer');
    
    if (!values || values.length === 0) {
        container.innerHTML = '<div class="loading">No data available</div>';
        return;
    }
    
    // Create table
    let tableHTML = '<div class="sheet-table-wrapper"><table class="sheet-table">';
    
    // Add header row
    if (values[0]) {
        tableHTML += '<thead><tr>';
        values[0].forEach(header => {
            tableHTML += `<th>${escapeHtml(header)}</th>`;
        });
        tableHTML += '</tr></thead>';
    }
    
    // Add data rows
    tableHTML += '<tbody>';
    for (let i = 1; i < values.length; i++) {
        tableHTML += '<tr>';
        values[i].forEach((cell, index) => {
            tableHTML += `<td contenteditable="true" data-row="${i}" data-col="${index}">${escapeHtml(cell || '')}</td>`;
        });
        tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table></div>';
    
    container.innerHTML = tableHTML;
    
    // Add edit handlers
    setupEditHandlers();
}

// Display embedded Google Sheet
function displayEmbeddedSheet() {
    const container = document.getElementById('sheetContainer');
    
    // Embed the Google Sheet directly
    container.innerHTML = `
        <iframe 
            src="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?usp=sharing&rm=minimal"
            width="100%" 
            height="600" 
            frameborder="0"
            style="border: 1px solid #ddd; border-radius: 8px;">
        </iframe>
        <div class="sheet-info">
            <p>📊 This is a live view of your Google Sheet</p>
            <p>✏️ Click inside the sheet to edit directly</p>
            <a href="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit" target="_blank" class="sheet-link">
                🔗 Open in Google Sheets
            </a>
        </div>
    `;
}

// Setup edit handlers for editable cells
function setupEditHandlers() {
    const cells = document.querySelectorAll('td[contenteditable="true"]');
    
    cells.forEach(cell => {
        cell.addEventListener('blur', async (e) => {
            const row = e.target.dataset.row;
            const col = e.target.dataset.col;
            const value = e.target.innerText;
            
            // Here you would save the value back to Google Sheets
            console.log(`Cell edited: Row ${row}, Col ${col}, Value: ${value}`);
            
            // To save, you'd need authenticated access
            // await updateCellValue(row, col, value);
        });
    });
}

// Update cell value in Google Sheets (requires authentication)
async function updateCellValue(row, col, value) {
    try {
        const range = `Sheet1!${String.fromCharCode(65 + parseInt(col))}${parseInt(row) + 1}`;
        
        const response = await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[value]]
            }
        });
        
        console.log('Cell updated successfully');
    } catch (error) {
        console.error('Error updating cell:', error);
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Setup refresh button for sheet
function setupSheetRefresh() {
    const refreshBtn = document.getElementById('refreshSheet');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.textContent = '🔄 Refreshing...';
            
            try {
                await loadSheetData();
                refreshBtn.textContent = '✅ Updated!';
                setTimeout(() => {
                    refreshBtn.textContent = '🔄 Refresh Sheet';
                }, 2000);
            } catch (error) {
                console.error('Error refreshing sheet:', error);
                refreshBtn.textContent = '❌ Failed';
                setTimeout(() => {
                    refreshBtn.textContent = '🔄 Refresh Sheet';
                }, 2000);
            } finally {
                refreshBtn.disabled = false;
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupSheetRefresh();
    
    // Load embedded sheet when tab is clicked
    const tabBtn = document.querySelector('[data-tab="spreadsheet"]');
    if (tabBtn) {
        let sheetLoaded = false;
        tabBtn.addEventListener('click', () => {
            if (!sheetLoaded) {
                displayEmbeddedSheet();
                sheetLoaded = true;
            }
        });
    }
    
    // Also handle if the spreadsheet tab is already active on load
    setTimeout(() => {
        const spreadsheetTab = document.getElementById('spreadsheet');
        if (spreadsheetTab && spreadsheetTab.classList.contains('active')) {
            displayEmbeddedSheet();
        }
    }, 100);
    
    // Uncomment when you have API credentials
    // initializeGoogleSheets();
});