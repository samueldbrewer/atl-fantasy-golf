// UPDATED GOOGLE APPS SCRIPT WITH SHEET SELECTOR
// Copy this entire script and replace your current Apps Script

function doGet(e) {
  const spreadsheet = SpreadsheetApp.openById('1P0T6I6pVW0e6EcfFwSh3y5PJ2h_18PtH9utwEx0i00c');
  
  // Get sheet name from parameters, default to first sheet
  const sheetName = e.parameter.sheet;
  const sheet = sheetName ? spreadsheet.getSheetByName(sheetName) : spreadsheet.getActiveSheet();
  
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: `Sheet "${sheetName}" not found`
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // If requesting sheet list
  if (e.parameter.action === 'listSheets') {
    const sheets = spreadsheet.getSheets().map(s => ({
      name: s.getName(),
      id: s.getSheetId(),
      rows: s.getMaxRows(),
      cols: s.getMaxColumns()
    }));
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        sheets: sheets
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'success',
      data: data,
      sheetName: sheet.getName(),
      sheetId: sheet.getSheetId()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById('1P0T6I6pVW0e6EcfFwSh3y5PJ2h_18PtH9utwEx0i00c');
    const data = JSON.parse(e.postData.contents);
    
    // Get sheet name from data, default to first sheet
    const sheetName = data.sheet;
    const sheet = sheetName ? spreadsheet.getSheetByName(sheetName) : spreadsheet.getActiveSheet();
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'error',
          message: `Sheet "${sheetName}" not found`
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // List all sheets
    if (data.action === 'listSheets') {
      const sheets = spreadsheet.getSheets().map(s => ({
        name: s.getName(),
        id: s.getSheetId(),
        rows: s.getMaxRows(),
        cols: s.getMaxColumns()
      }));
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          sheets: sheets
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get all data from specific sheet
    if (data.action === 'getSheet') {
      const sheetData = sheet.getDataRange().getValues();
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          data: sheetData,
          sheetName: sheet.getName()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Update a specific cell
    if (data.action === 'updateCell') {
      const range = sheet.getRange(data.row, data.col);
      range.setValue(data.value);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          message: `Cell updated at row ${data.row}, col ${data.col} in sheet "${sheet.getName()}"`
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Append a new row
    if (data.action === 'appendRow') {
      sheet.appendRow(data.values);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          message: `Row appended to sheet "${sheet.getName()}"`
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get specific range
    if (data.action === 'getRange') {
      const range = sheet.getRange(data.range);
      const values = range.getValues();
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          data: values,
          sheetName: sheet.getName()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Update multiple cells
    if (data.action === 'updateRange') {
      const range = sheet.getRange(data.range);
      range.setValues(data.values);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          message: `Range ${data.range} updated in sheet "${sheet.getName()}"`
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Create new sheet
    if (data.action === 'createSheet') {
      const newSheet = spreadsheet.insertSheet(data.sheetName);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          message: `Sheet "${data.sheetName}" created`,
          sheetId: newSheet.getSheetId()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Delete sheet
    if (data.action === 'deleteSheet') {
      const sheetToDelete = spreadsheet.getSheetByName(data.sheetName);
      if (sheetToDelete) {
        spreadsheet.deleteSheet(sheetToDelete);
        return ContentService
          .createTextOutput(JSON.stringify({
            status: 'success',
            message: `Sheet "${data.sheetName}" deleted`
          }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService
          .createTextOutput(JSON.stringify({
            status: 'error',
            message: `Sheet "${data.sheetName}" not found`
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
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