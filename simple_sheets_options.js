// ============================================
// SIMPLER OPTIONS FOR GOOGLE SHEETS ACCESS
// ============================================

// OPTION 1: GOOGLE APPS SCRIPT (SIMPLEST)
// ----------------------------------------
// Already created in google_apps_script.js
// This is the simplest solution - no OAuth, no API keys needed

// Example usage from your frontend:
async function useGoogleAppsScript() {
    const WEB_APP_URL = 'YOUR_DEPLOYED_WEB_APP_URL'; // Get this after deploying
    
    // Read data
    const response = await fetch(WEB_APP_URL);
    const data = await response.json();
    console.log('Sheet data:', data);
    
    // Write data
    await fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'updateCell',
            row: 2,
            col: 3,
            value: 'New Value'
        })
    });
}


// OPTION 2: SHEET2API SERVICE (NO CODE)
// ----------------------------------------
// Use a service like Sheet2API that handles all auth for you
// Just need to sign up and get an API endpoint

async function useSheet2API() {
    const API_URL = 'https://sheet2api.com/v1/YOUR_API_KEY/YOUR_SHEET';
    
    // Read
    const response = await fetch(API_URL);
    const data = await response.json();
    
    // Write
    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            "Name": "John Doe",
            "Score": 72
        })
    });
}


// OPTION 3: SHEETY.CO (SUPER SIMPLE)
// ----------------------------------------
// Another service that turns your sheet into a REST API

async function useSheety() {
    const PROJECT_URL = 'https://api.sheety.co/YOUR_PROJECT/sheet1';
    
    // Read all rows
    const response = await fetch(PROJECT_URL);
    const data = await response.json();
    
    // Add a row
    await fetch(PROJECT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sheet1: {
                name: "Tiger Woods",
                score: 70
            }
        })
    });
}


// OPTION 4: PUBLISHED WEB CSV (READ ONLY)
// ----------------------------------------
// If you only need to READ data, publish sheet as CSV

async function readPublishedCSV() {
    const SHEET_ID = '1P0T6I6pVW0e6EcfFwSh3y5PJ2h_18PtH9utwEx0i00c';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
    
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    
    // Parse CSV
    const rows = csvText.split('\n').map(row => row.split(','));
    console.log('CSV data:', rows);
}


// OPTION 5: GOOGLE SHEETS AS DATABASE (Via Sheets API)
// ----------------------------------------
// Use a library like sheets-database that simplifies the API

// npm install sheets-database
import SheetsDatabase from 'sheets-database';

async function useSheetsDatabase() {
    const db = new SheetsDatabase({
        spreadsheetId: '1P0T6I6pVW0e6EcfFwSh3y5PJ2h_18PtH9utwEx0i00c',
        credentials: 'path/to/service-account.json'
    });
    
    // Read
    const rows = await db.getRows('Sheet1');
    
    // Write
    await db.appendRow('Sheet1', ['John', 'Doe', 72]);
}


// OPTION 6: ZAPIER/MAKE WEBHOOKS
// ----------------------------------------
// Create automation that responds to webhooks

async function useZapierWebhook() {
    const WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/YOUR_HOOK';
    
    // Send data to sheet via Zapier
    await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: JSON.stringify({
            player: 'Rory McIlroy',
            score: 68
        })
    });
}


// OPTION 7: GOOGLE FORMS AS INPUT
// ----------------------------------------
// Create a Google Form linked to your sheet
// Submit data programmatically to the form

async function submitToGoogleForm() {
    const FORM_URL = 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse';
    
    const formData = new FormData();
    formData.append('entry.123456', 'Player Name');  // entry IDs from form
    formData.append('entry.789012', '72');           // score field
    
    await fetch(FORM_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
    });
}


// ============================================
// COMPARISON OF OPTIONS
// ============================================
/*
┌─────────────────┬──────────┬──────────┬─────────┬───────────┐
│ Method          │ Read     │ Write    │ Auth    │ Cost      │
├─────────────────┼──────────┼──────────┼─────────┼───────────┤
│ Apps Script     │ ✅ Easy  │ ✅ Easy  │ None    │ Free      │
│ Sheet2API       │ ✅ Easy  │ ✅ Easy  │ API Key │ $$/month  │
│ Sheety          │ ✅ Easy  │ ✅ Easy  │ API Key │ Free/Paid │
│ Published CSV   │ ✅ Easy  │ ❌ No    │ None    │ Free      │
│ Sheets Database │ ✅ Easy  │ ✅ Easy  │ Service │ Free      │
│ Zapier          │ ❌ No    │ ✅ Easy  │ Webhook │ Free/Paid │
│ Google Forms    │ ❌ No    │ ✅ Easy  │ None    │ Free      │
└─────────────────┴──────────┴──────────┴─────────┴───────────┘

RECOMMENDED: Google Apps Script (Option 1)
- Completely free
- No API keys or OAuth needed
- Full read/write access
- Works with your existing sheet
- Deploy once and forget
*/


// ============================================
// QUICK START WITH APPS SCRIPT
// ============================================
/*
1. Open your Google Sheet
2. Click Extensions → Apps Script
3. Copy the code from google_apps_script.js
4. Click Deploy → New Deployment
5. Choose "Web app", set "Execute as: Me", "Who has access: Anyone"
6. Copy the Web App URL
7. Use this URL in your JavaScript:
*/

async function quickStart() {
    // Replace with your deployed Web App URL
    const WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
    
    try {
        // Read all data
        const response = await fetch(WEB_APP_URL);
        const result = await response.json();
        
        if (result.status === 'success') {
            console.log('Sheet data:', result.data);
            
            // Display in your app
            result.data.forEach(row => {
                console.log(row); // Each row is an array of values
            });
        }
        
        // Update a cell
        await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'updateCell',
                row: 2,
                col: 1,
                value: 'Updated value!'
            })
        });
        
        // Append a new row
        await fetch(WEB_APP_URL, {
            method: 'POST', 
            body: JSON.stringify({
                action: 'appendRow',
                values: ['New Player', 72, 'PGA Tour']
            })
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}