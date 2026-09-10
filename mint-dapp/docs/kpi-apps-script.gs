function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("KPI") || ss.insertSheet("KPI");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Thời gian", "Tên", "GitHub/Gmail", "Telegram", "Ví", "Contract",
      "L1", "Mạng", "ChainId", "Số NFT đã mint"
    ]);
    sheet.setFrozenRows(1);
  }

  var d = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(d.at || Date.now()),
    d.name || "",
    d.contact || "",
    d.telegram || "",
    d.wallet || "",
    d.contract || "",
    d.l1 || "",
    d.chain || "",
    d.chainId || "",
    d.minted || 0
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput("AvaxCats KPI endpoint OK");
}
