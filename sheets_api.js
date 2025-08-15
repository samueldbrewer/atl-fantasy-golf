// Google Apps Script API Integration
// This file will be updated with your Web App URL after deployment

class SheetsAPI {
    constructor(webAppUrl) {
        this.webAppUrl = webAppUrl;
        this.currentSheet = null;
    }
    
    // Get list of all sheets
    async listSheets() {
        try {
            const response = await fetch(this.webAppUrl + '?action=listSheets');
            const result = await response.json();
            
            if (result.status === 'success') {
                return result.sheets;
            } else {
                throw new Error(result.message || 'Failed to list sheets');
            }
        } catch (error) {
            console.error('Error listing sheets:', error);
            throw error;
        }
    }
    
    // Read all data from a specific sheet
    async readAll(sheetName = null) {
        try {
            let url = this.webAppUrl;
            if (sheetName) {
                url += `?sheet=${encodeURIComponent(sheetName)}`;
            }
            
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.status === 'success') {
                this.currentSheet = result.sheetName;
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to read sheet');
            }
        } catch (error) {
            console.error('Error reading sheet:', error);
            throw error;
        }
    }
    
    // Update a single cell
    async updateCell(row, col, value, sheetName = null) {
        try {
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'updateCell',
                    sheet: sheetName || this.currentSheet,
                    row: row,
                    col: col,
                    value: value
                })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error updating cell:', error);
            throw error;
        }
    }
    
    // Append a new row
    async appendRow(values, sheetName = null) {
        try {
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'appendRow',
                    sheet: sheetName || this.currentSheet,
                    values: values
                })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error appending row:', error);
            throw error;
        }
    }
    
    // Get a specific range
    async getRange(range, sheetName = null) {
        try {
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'getRange',
                    sheet: sheetName || this.currentSheet,
                    range: range
                })
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to get range');
            }
        } catch (error) {
            console.error('Error getting range:', error);
            throw error;
        }
    }
    
    // Update multiple cells at once
    async updateRange(range, values, sheetName = null) {
        try {
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'updateRange',
                    sheet: sheetName || this.currentSheet,
                    range: range,
                    values: values
                })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error updating range:', error);
            throw error;
        }
    }
}

// Initialize the API with your Web App URL
const sheetsAPI = new SheetsAPI('https://script.google.com/macros/s/AKfycbwLTiGMQmexBfEnkUY8FjTC45qI3p225dSJOK66YyBRBpl3tWLVFsONixUDBHlCM3JwuA/exec');

// Example: Read all data when page loads
async function loadSheetData() {
    try {
        const data = await sheetsAPI.readAll();
        console.log('Sheet data:', data);
        
        // Display the data in a table
        displaySheetData(data);
    } catch (error) {
        console.error('Failed to load sheet data:', error);
    }
}

// Example: Update a cell when user edits
async function handleCellEdit(row, col, newValue) {
    try {
        const result = await sheetsAPI.updateCell(row, col, newValue);
        console.log('Cell updated:', result);
    } catch (error) {
        console.error('Failed to update cell:', error);
    }
}

// Example: Add a new player
async function addNewPlayer(name, team, score) {
    try {
        const result = await sheetsAPI.appendRow([name, team, score]);
        console.log('Player added:', result);
        
        // Reload data to show the new row
        await loadSheetData();
    } catch (error) {
        console.error('Failed to add player:', error);
    }
}

// Display sheet data in a table
function displaySheetData(data) {
    const container = document.getElementById('sheetContainer');
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p>No data available</p>';
        return;
    }
    
    // Create table
    let html = '<table class="sheet-table">';
    
    // Header row
    html += '<thead><tr>';
    data[0].forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead>';
    
    // Data rows
    html += '<tbody>';
    for (let i = 1; i < data.length; i++) {
        html += '<tr>';
        data[i].forEach((cell, j) => {
            html += `<td contenteditable="true" 
                         data-row="${i + 1}" 
                         data-col="${j + 1}"
                         onblur="handleCellEdit(${i + 1}, ${j + 1}, this.textContent)">
                         ${cell || ''}</td>`;
        });
        html += '</tr>';
    }
    html += '</tbody></table>';
    
    container.innerHTML = html;
}

// QUICK TEST FUNCTION
// After you deploy and get your URL, you can test with this:
function testSheetsAPI(webAppUrl) {
    const api = new SheetsAPI(webAppUrl);
    
    console.log('Testing Sheets API...');
    
    // Test reading data
    api.readAll().then(data => {
        console.log('✅ Read successful:', data);
    }).catch(error => {
        console.error('❌ Read failed:', error);
    });
}