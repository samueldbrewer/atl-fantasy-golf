# Deploy Google Apps Script - Step by Step

## Step 1: Open Your Google Sheet
Go to: https://docs.google.com/spreadsheets/d/1P0T6I6pVW0e6EcfFwSh3y5PJ2h_18PtH9utwEx0i00c/edit

## Step 2: Open Apps Script Editor
1. In your Google Sheet, click **Extensions** → **Apps Script**
2. A new tab will open with the script editor

## Step 3: Copy the Script
Delete any existing code and paste this entire script:

```javascript
function doGet(e) {
  const sheet = SpreadsheetApp.openById('1P0T6I6pVW0e6EcfFwSh3y5PJ2h_18PtH9utwEx0i00c');
  const activeSheet = sheet.getActiveSheet();
  const data = activeSheet.getDataRange().getValues();
  
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'success',
      data: data,
      sheetName: activeSheet.getName()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById('1P0T6I6pVW0e6EcfFwSh3y5PJ2h_18PtH9utwEx0i00c');
    const activeSheet = sheet.getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    // Update a specific cell
    if (data.action === 'updateCell') {
      const range = activeSheet.getRange(data.row, data.col);
      range.setValue(data.value);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          message: `Cell updated at row ${data.row}, col ${data.col}`
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Append a new row
    if (data.action === 'appendRow') {
      activeSheet.appendRow(data.values);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Row appended successfully'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get specific range
    if (data.action === 'getRange') {
      const range = activeSheet.getRange(data.range);
      const values = range.getValues();
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          data: values
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Update multiple cells
    if (data.action === 'updateRange') {
      const range = activeSheet.getRange(data.range);
      range.setValues(data.values);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          message: `Range ${data.range} updated`
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Unknown action'
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
```

## Step 4: Save the Script
1. Click the **Save** button (or press Ctrl+S / Cmd+S)
2. Name it something like "Fantasy Golf API"

## Step 5: Deploy as Web App
1. Click **Deploy** → **New Deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Fill in the settings:
   - **Description**: "Fantasy Golf Sheet API" (or anything you want)
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone**
5. Click **Deploy**

## Step 6: Copy Your Web App URL
1. You'll see a screen with your Web App URL
2. **COPY THIS URL** - it looks like:
   `https://script.google.com/macros/s/AKfycbw.../exec`
3. Click **Done**

## Step 7: Share Your Web App URL
Once you have the URL, paste it here and I'll update your app to use it!

---

## What This Gives You:
- ✅ Read all data from your sheet
- ✅ Update any cell
- ✅ Append new rows
- ✅ No API keys needed
- ✅ No authentication required
- ✅ Works from any website
- ✅ Free forever

## Test Your Deployment:
After you get the URL, you can test it by opening it in your browser. You should see JSON data from your sheet!