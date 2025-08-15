// ============================================
// GOOGLE APPS SCRIPT - SIMPLEST SOLUTION
// ============================================
// 
// Instructions:
// 1. Go to your Google Sheet
// 2. Click Extensions → Apps Script
// 3. Paste this code in the script editor
// 4. Click Deploy → New Deployment
// 5. Choose "Web app" as type
// 6. Set "Execute as: Me" and "Who has access: Anyone"
// 7. Copy the Web App URL you get
// 8. Use that URL in your JavaScript code

// --- PASTE THIS IN GOOGLE APPS SCRIPT EDITOR ---

function doGet(e) {
  const sheet = SpreadsheetApp.openById('1P0T6I6pVW0e6EcfFwSh3y5PJ2h_18PtH9utwEx0i00c');
  const data = sheet.getDataRange().getValues();
  
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'success',
      data: data
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById('1P0T6I6pVW0e6EcfFwSh3y5PJ2h_18PtH9utwEx0i00c');
    const data = JSON.parse(e.postData.contents);
    
    // Example: Update a specific cell
    if (data.action === 'updateCell') {
      const range = sheet.getRange(data.row, data.col);
      range.setValue(data.value);
    }
    
    // Example: Append a row
    if (data.action === 'appendRow') {
      sheet.appendRow(data.values);
    }
    
    // Example: Get specific range
    if (data.action === 'getRange') {
      const range = sheet.getRange(data.range);
      const values = range.getValues();
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          data: values
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Data updated'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}