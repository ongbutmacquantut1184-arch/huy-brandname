// ========== SPREADSHEET CONFIG ==========
var _cachedSpreadsheet = null;

function getSpreadsheetId() {
  return '1eTm1rPTrwx__iZsEFIwZ3vN62OMFzH8lpSHIoZL-2lU';
}

function getSpreadsheet() {
  if (_cachedSpreadsheet === null) {
    _cachedSpreadsheet = SpreadsheetApp.openById(getSpreadsheetId());
  }
  return _cachedSpreadsheet;
}

// ========== FIREBASE CONFIG ==========
var FIREBASE_URL = "https://huy-brandname-db-default-rtdb.asia-southeast1.firebasedatabase.app/";
var FIREBASE_SECRET = "a7fn70l1fRAEtEuudk6rzfxGTXotxnpJB6Dz7hLO";

// ========== CACHE SERVICE ==========
var CACHE_TTL = 600; // 10 phút
var _inMemoryLookup = null;

/**
 * Lấy tất cả lookup maps từ CacheService (hoặc Sheets nếu cache hết hạn).
 * Giảm đáng kể thời gian vì không cần đọc lại 7 sheet mỗi lần gọi API.
 */
function getLookupMaps() {
  // In-memory cache trong cùng script execution
  if (_inMemoryLookup) return _inMemoryLookup;

  var cache = CacheService.getScriptCache();
  var cached = cache.get('lookupMaps');
  if (cached) {
    try {
      var parsed = JSON.parse(cached);
      if (parsed && parsed._chunked) {
        var fullStr = '';
        var chunkFail = false;
        for (var i = 0; i < parsed.count; i++) {
          var ch = cache.get('lookupMaps_chunk_' + i);
          if (ch) {
            fullStr += ch;
          } else {
            chunkFail = true;
            break;
          }
        }
        if (!chunkFail) {
          _inMemoryLookup = JSON.parse(fullStr);
          return _inMemoryLookup;
        }
      } else {
        _inMemoryLookup = parsed;
        return _inMemoryLookup;
      }
    } catch(e) { /* cache bị lỗi, đọc lại từ Sheets */ }
  }

  // Đọc từ Sheets và cache lại
  var maps = _buildLookupMapsFromSheets();
  
  // CacheService có giới hạn 100KB per key. Nếu data lớn, chia nhỏ.
  var jsonStr = JSON.stringify(maps);
  if (jsonStr.length < 100000) {
    cache.put('lookupMaps', jsonStr, CACHE_TTL);
  } else {
    // Chia thành nhiều key nhỏ
    var chunks = [];
    for (var ci = 0; ci < jsonStr.length; ci += 90000) {
      chunks.push(jsonStr.substring(ci, ci + 90000));
    }
    var chunkKeys = {};
    for (var ck = 0; ck < chunks.length; ck++) {
      var key = 'lookupMaps_chunk_' + ck;
      cache.put(key, chunks[ck], CACHE_TTL);
      chunkKeys[key] = true;
    }
    cache.put('lookupMaps', JSON.stringify({_chunked: true, count: chunks.length}), CACHE_TTL);
  }

  _inMemoryLookup = maps;
  return maps;
}

/**
 * Xóa cache lookup khi có thay đổi dữ liệu danh mục
 */
function invalidateLookupCache() {
  _inMemoryLookup = null;
  var cache = CacheService.getScriptCache();
  cache.remove('lookupMaps');
  // Xóa chunks nếu có
  for (var i = 0; i < 20; i++) {
    cache.remove('lookupMaps_chunk_' + i);
  }
}

function _buildLookupMapsFromSheets() {
  var ss = getSpreadsheet();

  // Users
  var userSheet = ss.getSheetByName('User');
  var users = [], userMap = {};
  if (userSheet && userSheet.getLastRow() > 1) {
    var uData = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 2).getValues();
    for (var u = 0; u < uData.length; u++) {
      if (uData[u][0] && uData[u][1]) {
        users.push({id: String(uData[u][0]), name: String(uData[u][1])});
        userMap[String(uData[u][0])] = String(uData[u][1]);
      }
    }
  }

  // Owners
  var ownerSheet = ss.getSheetByName('Company_Owner');
  var owners = [], ownerMap = {};
  if (ownerSheet && ownerSheet.getLastRow() > 1) {
    var oData = ownerSheet.getRange(2, 1, ownerSheet.getLastRow() - 1, 2).getValues();
    for (var o = 0; o < oData.length; o++) {
      if (oData[o][0] && oData[o][1]) {
        owners.push({id: String(oData[o][0]), name: String(oData[o][1])});
        ownerMap[String(oData[o][0])] = String(oData[o][1]);
      }
    }
  }

  // CPs
  var cpSheet = ss.getSheetByName('CP');
  var cps = [], cpMap = {};
  if (cpSheet && cpSheet.getLastRow() > 1) {
    var cData = cpSheet.getRange(2, 1, cpSheet.getLastRow() - 1, 2).getValues();
    for (var c = 0; c < cData.length; c++) {
      if (cData[c][0] && cData[c][1]) {
        cps.push({id: String(cData[c][0]), name: String(cData[c][1])});
        cpMap[String(cData[c][0])] = String(cData[c][1]);
      }
    }
  }

  // Brands
  var brandSheet = ss.getSheetByName('Brandname');
  var brands = [], brandMap = {};
  if (brandSheet && brandSheet.getLastRow() > 1) {
    var bData = brandSheet.getRange(2, 1, brandSheet.getLastRow() - 1, 4).getValues();
    for (var b = 0; b < bData.length; b++) {
      if (bData[b][0]) {
        var br = {id: String(bData[b][0]), name: String(bData[b][1] || ''), owner: String(bData[b][2] || ''), cp: String(bData[b][3] || '')};
        brands.push(br);
        brandMap[String(bData[b][0])] = {name: br.name, owner: br.owner, cp: br.cp};
      }
    }
  }

  // Operators (sorted)
  var OPERATOR_ORDER = ['Viettel','Vina','Mobi','VNM','Gtel','iTelecom','Reddi'];
  var opSheet = ss.getSheetByName('Nha_Mang');
  var operators = [], opMap = {};
  if (opSheet && opSheet.getLastRow() > 1) {
    var opData = opSheet.getRange(2, 1, opSheet.getLastRow() - 1, 2).getValues();
    for (var op = 0; op < opData.length; op++) {
      if (opData[op][0] && opData[op][1]) {
        operators.push({id: String(opData[op][0]), name: String(opData[op][1])});
        opMap[String(opData[op][0])] = String(opData[op][1]);
      }
    }
    operators.sort(function(a, b) {
      var idxA = OPERATOR_ORDER.indexOf(a.name); if (idxA === -1) idxA = 999;
      var idxB = OPERATOR_ORDER.indexOf(b.name); if (idxB === -1) idxB = 999;
      return idxA - idxB;
    });
  }

  // Providers
  var provSheet = ss.getSheetByName('Nha_Cung_Cap');
  var providers = [], provMap = {};
  if (provSheet && provSheet.getLastRow() > 1) {
    var pData = provSheet.getRange(2, 1, provSheet.getLastRow() - 1, 2).getValues();
    for (var p = 0; p < pData.length; p++) {
      if (pData[p][0] && pData[p][1]) {
        providers.push({id: String(pData[p][0]), name: String(pData[p][1])});
        provMap[String(pData[p][0])] = String(pData[p][1]);
      }
    }
  }

  // Operator-Provider Mapping
  var mapSheet = ss.getSheetByName('Operator_Provider');
  var opProvMapping = [];
  if (mapSheet && mapSheet.getLastRow() > 1) {
    var mapData = mapSheet.getDataRange().getValues();
    var mapping = {};
    for (var j = 1; j < mapData.length; j++) {
      var mOpId = String(mapData[j][0]);
      var mProvId = String(mapData[j][1]);
      if (!mapping[mOpId]) mapping[mOpId] = [];
      if (provMap[mProvId]) {
        mapping[mOpId].push({id: mProvId, name: provMap[mProvId]});
      }
    }
    opProvMapping = Object.keys(mapping).map(function(opId) {
      return {
        id: opId,
        name: opMap[opId] || opId,
        providers: mapping[opId].sort(function(a,b) { return (a.name || '').localeCompare(b.name || ''); })
      };
    }).sort(function(a, b) {
      var idxA = OPERATOR_ORDER.indexOf(a.name); if (idxA === -1) idxA = 999;
      var idxB = OPERATOR_ORDER.indexOf(b.name); if (idxB === -1) idxB = 999;
      return idxA - idxB;
    });
  }

  return {
    users: users, userMap: userMap,
    owners: owners, ownerMap: ownerMap,
    cps: cps, cpMap: cpMap,
    brands: brands, brandMap: brandMap,
    operators: operators, opMap: opMap,
    providers: providers, provMap: provMap,
    operatorProviderMapping: opProvMapping
  };
}

// ========== FIREBASE IN-MEMORY CACHE ==========
var _fbCancellationsCache = null;

/**
 * Lấy toàn bộ cancellations từ Firebase, cache trong RAM cho cùng script execution.
 * Tránh gọi Firebase nhiều lần trong 1 request.
 */
function getFirebaseCancellations() {
  if (_fbCancellationsCache) return _fbCancellationsCache;
  var response = UrlFetchApp.fetch(FIREBASE_URL + 'cancellations.json?auth=' + FIREBASE_SECRET, {muteHttpExceptions: true});
  if (response.getResponseCode() !== 200) {
    Logger.log('Firebase fetch error: ' + response.getContentText());
    return {};
  }
  _fbCancellationsCache = JSON.parse(response.getContentText()) || {};
  return _fbCancellationsCache;
}

function invalidateFirebaseCache() {
  _fbCancellationsCache = null;
}

function doGet(e) {
  var page = e?.parameter?.page;
  var exportData = e?.parameter?.exportData;

  if (exportData === 'master') {
    return ContentService.createTextOutput(JSON.stringify(getLookupMaps())).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (page === 'admin') {
    return HtmlService.createHtmlOutputFromFile('Admin').setTitle('Admin');
  }
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('Quản lý hủy Brandname');
}

function doPost(e) {
  var result = { success: false, message: '' };
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Dữ liệu yêu cầu trống');
    }
    
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var recordId = data.recordId;
    var payload = data.payload;
    
    if (action === 'create') {
      var saveRes = saveCancellation(payload);
      result = { success: true, message: 'Đồng bộ thêm mới thành công!', data: saveRes };
    } else if (action === 'update') {
      if (!recordId) throw new Error('Thiếu recordId khi cập nhật');
      var updateRes = updateCancellation(recordId, payload);
      result = { success: true, message: 'Đồng bộ cập nhật thành công!', data: updateRes };
    } else {
      throw new Error('Hành động không hợp lệ: ' + action);
    }
  } catch (err) {
    result = { success: false, message: 'Lỗi đồng bộ Google Sheets: ' + err.message };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========== DANH MỤC ==========
function getList(sheetName, idCol, nameCol) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  return data.filter(function(r) { return r[0] && r[1]; }).map(function(r) { return { id: r[0], name: r[1] }; });
}

function getUsers() { return getList('User','UserID','FullName'); }
function getOwners() { return getList('Company_Owner','OwnerID','OwnerName'); }
function getCPs() { return getList('CP','CPID','CPName'); }
function getAllOperators() { 
  var ops = getList('Nha_Mang','OperatorID','OperatorName'); 
  var order = ["Viettel", "Vina", "Mobi", "VNM", "Gtel", "iTelecom", "Reddi"];
  ops.sort(function(a, b) {
    var idxA = order.indexOf(a.name);
    var idxB = order.indexOf(b.name);
    if (idxA === -1) idxA = 999;
    if (idxB === -1) idxB = 999;
    return idxA - idxB;
  });
  return ops;
}
function getOperators() { return getAllOperators(); }
function getAllProviders() { return getList('Nha_Cung_Cap','ProviderID','ProviderName'); }

function getBrands() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Brandname');
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  return data.filter(function(r) { return r[0]; }).map(function(r) {
    return { id: r[0], name: r[1], owner: r[2] || '', cp: r[3] || '' };
  });
}

function getProvidersByOperator(operatorId) {
  var ss = getSpreadsheet();
  var mapSheet = ss.getSheetByName('Operator_Provider');
  var provSheet = ss.getSheetByName('Nha_Cung_Cap');
  if (!mapSheet || !provSheet) return [];
  var mapData = mapSheet.getDataRange().getValues();
  var provMap = {};
  var provData = provSheet.getDataRange().getValues();
  for (var i = 1; i < provData.length; i++) {
    if (provData[i][0]) provMap[provData[i][0]] = provData[i][1] || '';
  }
  var result = [];
  for (var j = 1; j < mapData.length; j++) {
    if (mapData[j][0] == operatorId && provMap[mapData[j][1]]) {
      result.push({ id: mapData[j][1], name: provMap[mapData[j][1]] });
    }
  }
  return result;
}

function getOperatorProviderMapping() {
  var ss = getSpreadsheet();
  var mapSheet = ss.getSheetByName('Operator_Provider');
  var provSheet = ss.getSheetByName('Nha_Cung_Cap');
  var opSheet = ss.getSheetByName('Nha_Mang');
  if (!mapSheet || !provSheet || !opSheet) return [];

  var provData = provSheet.getDataRange().getValues();
  var provMap = {};
  for (var i = 1; i < provData.length; i++) {
    if (provData[i][0]) provMap[provData[i][0]] = provData[i][1] || '';
  }
  var opData = opSheet.getDataRange().getValues();
  var opNames = {};
  for (var i = 1; i < opData.length; i++) {
    if (opData[i][0]) opNames[opData[i][0]] = opData[i][1] || '';
  }

  var mapData = mapSheet.getDataRange().getValues();
  var mapping = {};
  for (var j = 1; j < mapData.length; j++) {
    var opId = mapData[j][0];
    var provId = mapData[j][1];
    if (!mapping[opId]) mapping[opId] = [];
    if (provMap[provId]) {
      mapping[opId].push({ id: provId, name: provMap[provId] });
    }
  }

  var OPERATOR_ORDER = ["Viettel", "Vina", "Mobi", "VNM", "Gtel", "iTelecom", "Reddi"];
  return Object.keys(mapping).map(function(opId) {
    return {
      id: opId,
      name: opNames[opId] || opId,
      providers: mapping[opId].sort(function(a,b) { return (a.name || '').localeCompare(b.name || ''); })
    };
  }).sort(function(a, b) {
    var idxA = OPERATOR_ORDER.indexOf(a.name);
    var idxB = OPERATOR_ORDER.indexOf(b.name);
    if (idxA === -1) idxA = 999;
    if (idxB === -1) idxB = 999;
    return idxA - idxB;
  });
}


function getNextId(sheetName, idColIndex, prefix, numberLength) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return prefix + '0'.repeat(numberLength - 1) + '1';
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return prefix + '0'.repeat(numberLength - 1) + '1';
  
  // Tối ưu hóa cực đại: Chỉ đọc đúng 1 ô duy nhất ở dòng cuối cùng (vì ID tăng dần nên dòng cuối luôn chứa ID lớn nhất)
  var lastIdVal = String(sheet.getRange(lastRow, idColIndex).getValue() || '').trim();
  var validIdRegex = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d{' + numberLength + '})$');
  var match = lastIdVal.match(validIdRegex);
  var nextNum = 1;
  if (match) {
    var num = parseInt(match[1], 10);
    if (!isNaN(num)) nextNum = num + 1;
  }
  
  var nextNumStr = nextNum.toString();
  while (nextNumStr.length < numberLength) {
    nextNumStr = '0' + nextNumStr;
  }
  return prefix + nextNumStr;
}

// ========== THÊM MỚI ==========
function addOwner(ownerName) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Company_Owner');
    if (!sheet) throw new Error('Sheet CompanyOwners không tồn tại');
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] && data[i][1].toString().toLowerCase().trim() === ownerName.toLowerCase().trim()) {
        throw new Error('Company Owner này đã tồn tại!');
      }
    }
    var newId = getNextId('Company_Owner', 1, 'O', 5);
    sheet.appendRow([newId, ownerName]);
    invalidateLookupCache();
    return { id: newId, name: ownerName };
  } finally {
    lock.releaseLock();
  }
}

function addCP(cpName) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('CP');
    if (!sheet) throw new Error('Sheet CPs không tồn tại');
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] && data[i][1].toString().toLowerCase().trim() === cpName.toLowerCase().trim()) {
        throw new Error('CP này đã tồn tại!');
      }
    }
    var newId = getNextId('CP', 1, 'CP', 5);
    sheet.appendRow([newId, cpName]);
    invalidateLookupCache();
    return { id: newId, name: cpName };
  } finally {
    lock.releaseLock();
  }
}

function addBrand(brandName, ownerId, cpId) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Brandname');
    if (!sheet) throw new Error('Sheet Brandnames không tồn tại');
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] && data[i][1].toString().toLowerCase().trim() === brandName.toLowerCase().trim()) {
        throw new Error('Brandname này đã tồn tại trong hệ thống!');
      }
    }
    var newId = getNextId('Brandname', 1, 'BR', 7);
    sheet.appendRow([newId, brandName, ownerId || '', cpId || '']);
    invalidateLookupCache();
    return { id: newId, name: brandName, owner: ownerId || '', cp: cpId || '' };
  } finally {
    lock.releaseLock();
  }
}

// ========== LƯU HỦY ==========
function saveCancellation(payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = getSpreadsheet();
    var mainSheet = ss.getSheetByName('Lich_Su_Huy');
    var detailSheet = ss.getSheetByName('Chi_Tiet_Huy');
    if (!mainSheet || !detailSheet) throw new Error('Thiếu sheet dữ liệu.');

    var recordId = payload.recordId || getNextId('Lich_Su_Huy', 1, 'R', 6);
    var enterDate = payload.enterDate;
    if (enterDate && enterDate.indexOf('-') >= 0) {
      var parts = enterDate.split('-');
      if (parts.length === 3) enterDate = parts[2] + '/' + parts[1] + '/' + parts[0];
    } else if (!enterDate) {
      var today = new Date();
      enterDate = ('0' + today.getDate()).slice(-2) + '/' + ('0' + (today.getMonth()+1)).slice(-2) + '/' + today.getFullYear();
    }

    // 0. Tra cứu FullName của người nhập (từ cache)
    var maps = getLookupMaps();
    var fullName = maps.userMap[String(payload.user)] || payload.user;

    // 1. Tạo chuỗi Hash đại diện cho bản ghi mới
    var payDetails = [];
    var details = payload.details || [];
    details.forEach(function(d) {
       var opId = (d.operatorId || '').toString().trim();
       (d.providerIds || []).forEach(function(p) {
          payDetails.push(opId + '_' + p.toString().trim());
       });
    });
    payDetails.sort();
    
    var hashString = [
      (fullName || '').toString().trim(),
      (payload.owner || '').toString().trim(),
      (payload.brandId || '').toString().trim(),
      (payload.cp || '').toString().trim(),
      (payload.month || '').toString().trim(),
      (payload.note || '').toString().trim(),
      payDetails.join(',')
    ].join('|');
    
    var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, hashString, Utilities.Charset.UTF_8)
                 .map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); })
                 .join('');

    // 2. Kiểm tra trùng lặp và lấy ngày nhập bằng cách đọc 1 lần toàn bộ bảng (RAM)
    var lastRow = mainSheet.getLastRow();
    var isDuplicate = false;
    var duplicateDate = '';
    if (lastRow > 1) {
      var mainData = mainSheet.getRange(2, 1, lastRow - 1, 9).getValues();
      for (var i = 0; i < mainData.length; i++) {
        if (mainData[i][8] && mainData[i][8].toString().trim() === hash) {
          isDuplicate = true;
          duplicateDate = formatSheetDateToDDMMYYYY(mainData[i][2]);
          break;
        }
      }
    }
    
    if (isDuplicate) {
      throw new Error('Bản ghi nhập hủy này đã tồn tại trên hệ thống (đã được nhập hủy vào ngày ' + duplicateDate + ')!');
    }

    // --- 3. LƯU DỮ LIỆU LÊN FIREBASE REALTIME DATABASE ---
    var firebaseDetails = [];
    details.forEach(function(block) {
      firebaseDetails.push({
        operatorId: block.operatorId,
        providerIds: block.providerIds || []
      });
    });

    var firebaseData = {
      recordId: recordId,
      user: payload.user,
      enterDate: enterDate,
      owner: payload.owner || '',
      brandId: payload.brandId,
      cp: payload.cp || '',
      month: payload.month,
      note: payload.note || '',
      hash: hash,
      details: firebaseDetails
    };

    var fbUrl = FIREBASE_URL + "cancellations/" + recordId + ".json?auth=" + FIREBASE_SECRET;
    var fbOptions = {
      method: "put",
      contentType: "application/json",
      payload: JSON.stringify(firebaseData),
      muteHttpExceptions: true
    };
    var fbResponse = UrlFetchApp.fetch(fbUrl, fbOptions);
    if (fbResponse.getResponseCode() !== 200) {
      throw new Error("Lỗi lưu trữ Firebase: " + fbResponse.getContentText());
    }
    invalidateFirebaseCache(); // Reset cache sau khi ghi

    // --- 4. GHI ĐỒNG BỘ SANG GOOGLE SHEETS ---
    // A. Ghi Main Record
    mainSheet.getRange(lastRow + 1, 1, 1, 9).setValues([[
      recordId,
      fullName,
      enterDate,
      payload.owner || '',
      payload.brandId,
      payload.cp || '',
      payload.month,
      payload.note || '',
      hash
    ]]);

    // B. Ghi Detail Records
    var detailRows = [];
    var dPrefix = 'D';
    var nextDetailNum = 1;
    var dLastRow = detailSheet.getLastRow();
    if (dLastRow > 1) {
      var lastDetailIdVal = String(detailSheet.getRange(dLastRow, 1).getValue() || '').trim();
      var dRegex = /^D(\d{10})$/;
      var dMatch = lastDetailIdVal.match(dRegex);
      if (dMatch) {
        var num = parseInt(dMatch[1], 10);
        if (!isNaN(num)) nextDetailNum = num + 1;
      }
    }

    var count = 0;
    details.forEach(function(block) {
      var opId = block.operatorId;
      var provIds = block.providerIds || [];
      provIds.forEach(function(provId) {
        var nextStr = (nextDetailNum + count).toString();
        while(nextStr.length < 10) nextStr = '0' + nextStr;
        var detailId = dPrefix + nextStr;
        detailRows.push([detailId, recordId, opId, provId]);
        count++;
      });
    });
    
    if (detailRows.length > 0) {
      var finalDLastRow = detailSheet.getLastRow();
      detailSheet.getRange(finalDLastRow + 1, 1, detailRows.length, 4).setValues(detailRows);
    }

    SpreadsheetApp.flush(); // Đồng bộ hóa dữ liệu lập tức lên Google Sheets

    return { success: true, message: 'Đã lưu thành công!', recordId: recordId };
  } finally {
    lock.releaseLock();
  }
}

// ========== CẬP NHẬT HỦY ==========
function updateCancellation(recordId, payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = getSpreadsheet();
    var mainSheet = ss.getSheetByName('Lich_Su_Huy');
    var detailSheet = ss.getSheetByName('Chi_Tiet_Huy');
    if (!mainSheet || !detailSheet) throw new Error('Thiếu sheet dữ liệu.');

    var enterDate = payload.enterDate;
    if (enterDate && enterDate.indexOf('-') >= 0) {
      var parts = enterDate.split('-');
      if (parts.length === 3) enterDate = parts[2] + '/' + parts[1] + '/' + parts[0];
    } else if (!enterDate) {
      var today = new Date();
      enterDate = ('0' + today.getDate()).slice(-2) + '/' + ('0' + (today.getMonth()+1)).slice(-2) + '/' + today.getFullYear();
    }

    // Tra cứu FullName từ cache
    var maps = getLookupMaps();
    var fullName = maps.userMap[String(payload.user)] || payload.user;

    var payDetails = [];
    var details = payload.details || [];
    details.forEach(function(d) {
       var opId = (d.operatorId || '').toString().trim();
       (d.providerIds || []).forEach(function(p) {
          payDetails.push(opId + '_' + p.toString().trim());
       });
    });
    payDetails.sort();
    
    var hashString = [
      (fullName || '').toString().trim(),
      (payload.owner || '').toString().trim(),
      (payload.brandId || '').toString().trim(),
      (payload.cp || '').toString().trim(),
      (payload.month || '').toString().trim(),
      (payload.note || '').toString().trim(),
      payDetails.join(',')
    ].join('|');
    
    var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, hashString, Utilities.Charset.UTF_8)
                 .map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); })
                 .join('');

    var lastRow = mainSheet.getLastRow();
    var isDuplicate = false;
    var duplicateDate = '';
    var rowIndexToUpdate = -1;
    
    if (lastRow > 1) {
      var mainData = mainSheet.getRange(2, 1, lastRow - 1, 9).getValues();
      for (var i = 0; i < mainData.length; i++) {
        var currentRecordId = String(mainData[i][0]).trim();
        if (currentRecordId === recordId) {
          rowIndexToUpdate = i + 2;
        } else if (mainData[i][8] && String(mainData[i][8]).trim() === hash) {
          isDuplicate = true;
          var dateVal = mainData[i][2];
          duplicateDate = formatSheetDateToDDMMYYYY(dateVal);
        }
      }
    }
    
    if (rowIndexToUpdate === -1) {
      throw new Error('Không tìm thấy bản ghi gốc để cập nhật.');
    }
    
    if (isDuplicate) {
      throw new Error('Bản ghi cập nhật này đã tồn tại trên hệ thống (nhập vào ngày ' + duplicateDate + ')!');
    }

    // --- 3. CẬP NHẬT LÊN FIREBASE REALTIME DATABASE ---
    var firebaseDetails = [];
    details.forEach(function(block) {
      firebaseDetails.push({
        operatorId: block.operatorId,
        providerIds: block.providerIds || []
      });
    });

    var firebaseData = {
      recordId: recordId,
      user: payload.user,
      enterDate: enterDate,
      owner: payload.owner || '',
      brandId: payload.brandId,
      cp: payload.cp || '',
      month: payload.month,
      note: payload.note || '',
      hash: hash,
      details: firebaseDetails
    };

    var fbUrl = FIREBASE_URL + "cancellations/" + recordId + ".json?auth=" + FIREBASE_SECRET;
    var fbOptions = {
      method: "put",
      contentType: "application/json",
      payload: JSON.stringify(firebaseData),
      muteHttpExceptions: true
    };
    var fbResponse = UrlFetchApp.fetch(fbUrl, fbOptions);
    if (fbResponse.getResponseCode() !== 200) {
      throw new Error("Lỗi lưu trữ Firebase: " + fbResponse.getContentText());
    }
    invalidateFirebaseCache(); // Reset cache sau khi ghi

    // --- 4. GHI ĐỒNG BỘ SANG GOOGLE SHEETS ---
    // A. Ghi Main Record
    mainSheet.getRange(rowIndexToUpdate, 2, 1, 8).setValues([[
      fullName,
      enterDate,
      payload.owner || '',
      payload.brandId,
      payload.cp || '',
      payload.month,
      payload.note || '',
      hash
    ]]);

    // B. Xóa chi tiết cũ trong Sheet
    var dLastRow = detailSheet.getLastRow();
    if (dLastRow > 1) {
      var dData = detailSheet.getRange(1, 1, dLastRow, 4).getValues();
      var headerRow = dData[0];
      var newDData = [headerRow];
      for (var di = 1; di < dData.length; di++) {
        if (String(dData[di][1]).trim() !== recordId) {
          newDData.push(dData[di]);
        }
      }
      detailSheet.clearContents();
      detailSheet.getRange(1, 1, newDData.length, 4).setValues(newDData);
    }

    // C. Ghi chi tiết mới vào Sheet
    var detailRows = [];
    var dPrefix = 'D';
    var nextDetailNum = 1;
    var newDLastRow = detailSheet.getLastRow();
    if (newDLastRow > 1) {
      var lastDetailIdVal = String(detailSheet.getRange(newDLastRow, 1).getValue() || '').trim();
      var dRegex = /^D(\d{10})$/;
      var dMatch = lastDetailIdVal.match(dRegex);
      if (dMatch) {
        var num = parseInt(dMatch[1], 10);
        if (!isNaN(num)) nextDetailNum = num + 1;
      }
    }

    var count = 0;
    details.forEach(function(block) {
      var opId = block.operatorId;
      var provIds = block.providerIds || [];
      provIds.forEach(function(provId) {
        var nextStr = (nextDetailNum + count).toString();
        while(nextStr.length < 10) nextStr = '0' + nextStr;
        var detailId = dPrefix + nextStr;
        detailRows.push([detailId, recordId, opId, provId]);
        count++;
      });
    });
    
    if (detailRows.length > 0) {
      var finalDLastRow = detailSheet.getLastRow();
      detailSheet.getRange(finalDLastRow + 1, 1, detailRows.length, 4).setValues(detailRows);
    }

    SpreadsheetApp.flush(); // Đồng bộ hóa dữ liệu lập tức lên Google Sheets

    return { success: true, message: 'Đã cập nhật thành công!', recordId: recordId };
  } finally {
    lock.releaseLock();
  }
}

// ========== TÌM KIẾM ==========
function getSearchSuggestions() {
  var ss = getSpreadsheet();
  var suggestions = [];
  ['Brandname','Company_Owner','CP'].forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return;
    var data = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    data.forEach(function(row) {
      if (row[0] && suggestions.indexOf(row[0]) === -1) suggestions.push(row[0]);
    });
  });
  return suggestions.sort();
}

function searchCancellations(filters) {
  try {
    // Sử dụng lookup maps từ CacheService thay vì nhận từ frontend
    var maps = getLookupMaps();
    var brandMap = maps.brandMap || {};
    var ownerMap = maps.ownerMap || {};
    var cpMap = maps.cpMap || {};
    var userMap = maps.userMap || {};
    var opMap = maps.opMap || {};
    var provMap = maps.provMap || {};

    // Nhận tham số từ bộ lọc (multiselect)
    var keyword = (filters.keyword || '').toLowerCase().trim();
    var operatorIds = filters.operatorIds || [];
    var userIds = filters.userIds || [];
    var month = (filters.month || '').trim();

    // 1. Fetch từ Firebase (có in-memory cache)
    var cancellationsObj = getFirebaseCancellations();

    var results = [];
    var filterUserNames = userIds.map(function(id) { return userMap[id] || id; });

    // 2. Lọc dữ liệu trong bộ nhớ RAM
    for (var key in cancellationsObj) {
      var r = cancellationsObj[key];
      if (!r) continue;

      var recordId = String(r.recordId || '');
      var recUserId = String(r.user || ''); // userId trong Firebase
      var userName = userMap[recUserId] || recUserId; // Map ra tên hiển thị
      var enterDate = formatSheetDateToDDMMYYYY(r.enterDate);
      var ownerId = String(r.owner || '');
      var brandId = String(r.brandId || '');
      var cpId = String(r.cp || '');
      var cancelMonth = String(r.month || '');
      var note = String(r.note || '');
      var details = r.details || [];

      // Lọc tháng
      if (month && cancelMonth !== month) continue;

      // Lọc theo nhiều người nhập
      if (filterUserNames.length > 0 && filterUserNames.indexOf(userName) === -1) continue;

      // Lọc theo nhà mạng
      if (operatorIds.length > 0) {
        var hasMatchingOperator = false;
        for (var dIdx = 0; dIdx < details.length; dIdx++) {
          if (operatorIds.indexOf(details[dIdx].operatorId) !== -1) {
            hasMatchingOperator = true;
            break;
          }
        }
        if (!hasMatchingOperator) continue;
      }

      // Lọc từ khóa
      var brandName = (brandMap[brandId]?.name || '').toLowerCase();
      var ownerName = (ownerMap[ownerId] || '').toLowerCase();
      var cpName = (cpMap[cpId] || '').toLowerCase();
      var recordIdLower = recordId.toLowerCase();
      var noteLower = note.toLowerCase();

      if (keyword) {
        var found = brandName.indexOf(keyword) !== -1 ||
                    ownerName.indexOf(keyword) !== -1 ||
                    cpName.indexOf(keyword) !== -1 ||
                    recordIdLower.indexOf(keyword) !== -1 ||
                    noteLower.indexOf(keyword) !== -1;
        if (!found) continue;
      }

      // Ánh xạ tên operator và provider cho chi tiết hủy
      var mappedDetails = [];
      details.forEach(function(d) {
        if (d.operatorId && d.providerIds) {
          d.providerIds.forEach(function(pId) {
            mappedDetails.push({
              operatorId: d.operatorId,
              operatorName: opMap[d.operatorId] || d.operatorId,
              providerId: pId,
              providerName: provMap[pId] || pId
            });
          });
        } else if (d.operatorId && d.providerId) { // Fallback cho cấu trúc phẳng cũ
          mappedDetails.push({
            operatorId: d.operatorId,
            operatorName: opMap[d.operatorId] || d.operatorId,
            providerId: d.providerId,
            providerName: provMap[d.providerId] || d.providerId
          });
        }
      });

      results.push({
        recordId: recordId,
        userId: recUserId,
        userName: userName,
        enterDate: enterDate,
        brandId: brandId,
        brandName: brandMap[brandId]?.name || '',
        ownerId: ownerId,
        ownerName: ownerMap[ownerId] || '',
        cpId: cpId,
        cpName: cpMap[cpId] || '',
        cancelMonth: cancelMonth,
        note: note,
        details: mappedDetails
      });
    }

    // Sắp xếp theo ngày nhập giảm dần (mới nhất lên đầu)
    results.sort(function(a, b) {
      var timeA = 0, timeB = 0;
      if (a.enterDate) {
        var pA = a.enterDate.split('/');
        if (pA.length === 3) timeA = new Date(pA[2], pA[1] - 1, pA[0]).getTime();
      }
      if (b.enterDate) {
        var pB = b.enterDate.split('/');
        if (pB.length === 3) timeB = new Date(pB[2], pB[1] - 1, pB[0]).getTime();
      }
      if (timeA !== timeB) return timeB - timeA;
      return String(b.recordId || '').localeCompare(String(a.recordId || ''));
    });

    return results;
  } catch (err) {
    Logger.log("Firebase search error, fallback to Sheets: " + err.message);
    return searchCancellationsFallback(filters);
  }
}

function searchCancellationsFallback(filters) {
  var ss = getSpreadsheet();
  var mainSheet = ss.getSheetByName('Lich_Su_Huy');
  var detailSheet = ss.getSheetByName('Chi_Tiet_Huy');

  if (!mainSheet || !detailSheet) return [];

  var mainData = mainSheet.getDataRange().getValues();
  var detailData = detailSheet.getDataRange().getValues();

  var brandMap = filters.brandMap || {};
  var ownerMap = filters.ownerMap || {};
  var cpMap = filters.cpMap || {};
  var userMap = filters.userMap || {};
  var opMap = filters.opMap || {};
  var provMap = filters.provMap || {};

  var keyword = (filters.keyword || '').toLowerCase().trim();
  var operatorIds = filters.operatorIds || []; 
  var userIds = filters.userIds || [];         
  var month = (filters.month || '').trim();

  var filterUserNames = userIds.map(function(id) { return userMap[id] || id; });

  var filteredMain = [];
  for (var i = 1; i < mainData.length; i++) {
    var row = mainData[i];
    if (!row[0]) continue;

    var recordId = String(row[0] || '');
    var recUserId = String(row[1] || '');
    var enterDate = formatSheetDateToDDMMYYYY(row[2]);
    var ownerId = String(row[3] || '');
    var brandId = String(row[4] || '');
    var cpId = String(row[5] || '');
    var cancelMonth = formatSheetDateToYYYYMM(row[6]);
    var note = String(row[7] || '');

    if (month && cancelMonth !== month) continue;
    if (filterUserNames.length > 0 && filterUserNames.indexOf(recUserId) === -1) continue;

    if (keyword) {
      var brandName = (brandMap[brandId]?.name || '').toLowerCase();
      var ownerName = (ownerMap[ownerId] || '').toLowerCase();
      var cpName = (cpMap[cpId] || '').toLowerCase();
      var recordIdLower = recordId.toLowerCase();
      var noteLower = note.toLowerCase();

      var found = brandName.indexOf(keyword) !== -1 ||
                  ownerName.indexOf(keyword) !== -1 ||
                  cpName.indexOf(keyword) !== -1 ||
                  recordIdLower.indexOf(keyword) !== -1 ||
                  noteLower.indexOf(keyword) !== -1;
      if (!found) continue;
    }

    var actualUserId = '';
    for (var uid in userMap) {
      if (userMap[uid] === recUserId) {
        actualUserId = uid;
        break;
      }
    }

    var record = {
      recordId: recordId,
      userId: actualUserId || recUserId,
      userName: recUserId,
      enterDate: enterDate,
      ownerId: ownerId,
      ownerName: ownerMap[ownerId] || '',
      brandId: brandId,
      brandName: brandMap[brandId]?.name || '',
      cpId: cpId,
      cpName: cpMap[cpId] || '',
      cancelMonth: cancelMonth,
      note: note
    };
    filteredMain.push(record);
  }

  if (filteredMain.length === 0) return [];

  var recordIds = filteredMain.map(function(r) { return r.recordId; });
  var detailMap = {};
  for (var j = 1; j < detailData.length; j++) {
    var d = detailData[j];
    var dRecordId = String(d[1] || '');
    var dOpId = String(d[2] || '');
    var dProvId = String(d[3] || '');

    if (recordIds.indexOf(dRecordId) === -1) continue;
    if (operatorIds.length > 0 && operatorIds.indexOf(dOpId) === -1) continue;

    if (!detailMap[dRecordId]) detailMap[dRecordId] = [];
    detailMap[dRecordId].push({
      operatorId: dOpId,
      operatorName: opMap[dOpId] || dOpId,
      providerId: dProvId,
      providerName: provMap[dProvId] || dProvId
    });
  }

  if (operatorIds.length > 0) {
    filteredMain = filteredMain.filter(function(r) {
      return detailMap[r.recordId] && detailMap[r.recordId].length > 0;
    });
  }

  var results = filteredMain.map(function(r) {
    return {
      recordId: r.recordId,
      userId: r.userId,
      userName: r.userName,
      enterDate: r.enterDate,
      brandId: r.brandId,
      brandName: r.brandName,
      ownerId: r.ownerId,
      ownerName: r.ownerName,
      cpId: r.cpId,
      cpName: r.cpName,
      cancelMonth: r.cancelMonth,
      note: r.note,
      details: detailMap[r.recordId] || []
    };
  });

  // Sắp xếp theo ngày nhập giảm dần (mới nhất lên đầu)
  results.sort(function(a, b) {
    var timeA = 0, timeB = 0;
    if (a.enterDate) {
      var pA = a.enterDate.split('/');
      if (pA.length === 3) timeA = new Date(pA[2], pA[1] - 1, pA[0]).getTime();
    }
    if (b.enterDate) {
      var pB = b.enterDate.split('/');
      if (pB.length === 3) timeB = new Date(pB[2], pB[1] - 1, pB[0]).getTime();
    }
    if (timeA !== timeB) return timeB - timeA;
    return String(b.recordId || '').localeCompare(String(a.recordId || ''));
  });

  return results;
}

// ========== BÁO CÁO ==========
function getDistinctMonths() {
  try {
    var cancellationsObj = getFirebaseCancellations();
    var months = {};
    for (var key in cancellationsObj) {
      var r = cancellationsObj[key];
      if (r && r.month) months[r.month] = true;
    }
    return Object.keys(months).sort().reverse();
  } catch (err) {
    Logger.log('getDistinctMonths Firebase error, fallback: ' + err.message);
    return getDistinctMonthsFallback();
  }
}

function getDistinctMonthsFallback() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Lich_Su_Huy');
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var data = sheet.getRange(2, 7, lastRow - 1, 1).getValues();
  var months = {};
  data.forEach(function(row) {
    var val = formatSheetDateToYYYYMM(row[0]);
    if (val) months[val] = true;
  });
  return Object.keys(months).sort().reverse();
}

function getReportDataForProvider(month, providerId) {
  var maps = getLookupMaps();
  var operators = maps.operators;
  var brandMap = maps.brandMap;

  try {
    // Lấy dữ liệu từ Firebase (cached in-memory)
    var cancellationsObj = getFirebaseCancellations();
    
    var recordOperatorMap = {};
    var records = [];
    for (var key in cancellationsObj) {
      var r = cancellationsObj[key];
      if (!r) continue;
      if (month && r.month !== month) continue;
      
      var hasProvider = false;
      var details = r.details || [];
      for (var di = 0; di < details.length; di++) {
        var d = details[di];
        var provIds = d.providerIds || [];
        if (provIds.indexOf(providerId) !== -1) {
          hasProvider = true;
          if (!recordOperatorMap[r.recordId]) recordOperatorMap[r.recordId] = {};
          recordOperatorMap[r.recordId][d.operatorId] = true;
        }
      }
      if (hasProvider) {
        records.push({ recordId: r.recordId, brandId: r.brandId });
      }
    }

    if (records.length === 0) return { operators: operators, brands: [] };

    var brandAgg = {};
    records.forEach(function(rec) {
      var opMap = recordOperatorMap[rec.recordId];
      if (!opMap) return;
      var bid = rec.brandId;
      if (!brandAgg[bid]) {
        var binfo = brandMap[bid] || {};
        brandAgg[bid] = {
          brandName: binfo.name || '',
          owner: '',
          cp: '',
          operators: {}
        };
      }
      for (var opId in opMap) {
        brandAgg[bid].operators[opId] = true;
      }
    });

    var brands = [];
    for (var bid in brandAgg) {
      var b = brandAgg[bid];
      var row = { brandName: b.brandName, owner: b.owner, cp: b.cp, operatorStatus: {} };
      operators.forEach(function(op) {
        row.operatorStatus[op.id] = b.operators[op.id] ? 'Yes' : '-';
      });
      brands.push(row);
    }
    brands.sort(function(a, b) { return (a.brandName || '').localeCompare(b.brandName || ''); });
    return { operators: operators, brands: brands };
  } catch (err) {
    Logger.log('getReportDataForProvider Firebase error: ' + err.message);
    return { operators: operators, brands: [] };
  }
}

function exportReportToCSV(month, providerIds) {
  var maps = getLookupMaps();
  var providerNames = {};
  maps.providers.forEach(function(p) { providerNames[p.id] = p.name; });

  var csvContent = '';
  providerIds.forEach(function(pid, index) {
    var data = getReportDataForProvider(month, pid);
    if (data.brands.length === 0) return;

    // Tiêu đề nhà cung cấp
    csvContent += (providerNames[pid] || pid) + '\n';
    var headers = ['STT', 'Brandname'];
    data.operators.forEach(function(op) { headers.push('Hủy ' + op.name); });
    headers.push('CP_Name', 'Đơn vị sử dụng Brandname');
    csvContent += headers.join(',') + '\n';

    data.brands.forEach(function(brand, idx) {
      var row = [idx + 1, '"' + brand.brandName + '"'];
      data.operators.forEach(function(op) {
        row.push(brand.operatorStatus[op.id] || '-');
      });
      row.push('', ''); // Lĩnh vực và Đơn vị sử dụng để trống
      csvContent += row.join(',') + '\n';
    });
    // Cách dòng giữa các provider (trừ provider cuối)
    if (index < providerIds.length - 1) csvContent += '\n';
  });
  return csvContent;
}

function exportReportToSheets(month, providerIds) {
  var ssNew = SpreadsheetApp.create('Báo cáo hủy Brandname ' + new Date().toLocaleDateString());
  var defaultSheet = ssNew.getSheets()[0];
  var maps = getLookupMaps();
  var providerNames = {};
  maps.providers.forEach(function(p) { providerNames[p.id] = p.name; });

  providerIds.forEach(function(pid, index) {
    var data = getReportDataForProvider(month, pid);
    if (data.brands.length === 0) return;
    var sheetName = (providerNames[pid] || pid).substring(0, 31);
    var sheet;
    if (index === 0) {
      sheet = defaultSheet;
      sheet.setName(sheetName);
    } else {
      sheet = ssNew.insertSheet(sheetName);
    }
    var headers = ['STT', 'Brandname'];
    data.operators.forEach(function(op) { headers.push('Hủy ' + op.name); });
    headers.push('CP_Name', 'Đơn vị sử dụng Brandname');
    sheet.appendRow(headers);
    data.brands.forEach(function(brand, idx) {
      var row = [idx + 1, brand.brandName];
      data.operators.forEach(function(op) {
        row.push(brand.operatorStatus[op.id] || '-');
      });
      row.push('', '');
      sheet.appendRow(row);
    });
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.autoResizeColumns(1, headers.length);
  });

  // Xóa sheet mặc định nếu chưa được đổi tên
  var sheets = ssNew.getSheets();
  if (sheets.length === 1 && sheets[0].getSheetName() === 'Sheet1') {
    return { url: null, name: 'Không có dữ liệu' };
  }

  try {
    DriveApp.getFileById(ssNew.getId()).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch(e) {}
  return { url: ssNew.getUrl(), name: ssNew.getName() };
}

// ========== DASHBOARD ==========
function getDashboardData(month) {
  var maps = getLookupMaps();
  var operators = maps.operators;
  var providers = maps.providers;
  var userMap = maps.userMap;
  var brandMapLookup = maps.brandMap;
  var ownerMap = maps.ownerMap;

  // Mặc định tháng hiện tại nếu không truyền vào
  if (!month || month === '') {
    var now = new Date();
    month = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2);
  }

  try {
    var cancellationsObj = getFirebaseCancellations();

    var totalRecords = 0;
    var uniqueBrands = {};
    var activeUsers = {};
    var totalCancellations = 0;
    var providerSet = {};
    var operatorCounts = {};
    operators.forEach(function(op) { operatorCounts[String(op.id)] = 0; });
    var providerCounts = {};
    providers.forEach(function(p) { providerCounts[String(p.id)] = 0; });

    // Trend 6 tháng
    var trendMonths = [];
    var nowDate = new Date();
    for (var tm = 5; tm >= 0; tm--) {
      var td = new Date(nowDate.getFullYear(), nowDate.getMonth() - tm, 1);
      trendMonths.push(td.getFullYear() + '-' + ('0' + (td.getMonth() + 1)).slice(-2));
    }
    var trendCountsMap = {};
    trendMonths.forEach(function(m) { trendCountsMap[m] = 0; });

    var brandCancelCount = {};
    var allRecords = [];

    for (var key in cancellationsObj) {
      var r = cancellationsObj[key];
      if (!r) continue;
      var recMonth = r.month || '';

      if (trendCountsMap.hasOwnProperty(recMonth)) trendCountsMap[recMonth]++;
      allRecords.push(r);

      if (recMonth !== month) continue;

      totalRecords++;
      if (r.brandId) uniqueBrands[r.brandId] = true;
      if (r.user) activeUsers[r.user] = true;
      if (r.brandId) brandCancelCount[r.brandId] = (brandCancelCount[r.brandId] || 0) + 1;

      var details = r.details || [];
      for (var di = 0; di < details.length; di++) {
        var d = details[di];
        var opId = d.operatorId || '';
        var provIds = d.providerIds || [];
        for (var pi = 0; pi < provIds.length; pi++) {
          totalCancellations++;
          var provId = provIds[pi];
          if (provId) providerSet[provId] = true;
          if (opId && operatorCounts.hasOwnProperty(opId)) operatorCounts[opId]++;
          if (provId && providerCounts.hasOwnProperty(provId)) providerCounts[provId]++;
        }
      }
    }

    var kpi = {
      month: month,
      totalCancellations: totalCancellations,
      totalRecords: totalRecords,
      uniqueBrands: Object.keys(uniqueBrands).length,
      uniqueProviders: Object.keys(providerSet).length,
      activeUsers: Object.keys(activeUsers).length
    };

    var operatorChart = {
      labels: operators.map(function(op) { return op.name; }),
      data: operators.map(function(op) { return operatorCounts[String(op.id)] || 0; })
    };

    var providerArr = providers.map(function(p) {
      return { name: p.name, count: providerCounts[String(p.id)] || 0 };
    });
    providerArr.sort(function(a, b) { return b.count - a.count; });
    var topProviders = providerArr.slice(0, 8);
    var providerChart = {
      labels: topProviders.map(function(p) { return p.name; }),
      data:   topProviders.map(function(p) { return p.count; })
    };

    var trendChart = {
      labels: trendMonths,
      data: trendMonths.map(function(m) { return trendCountsMap[m] || 0; })
    };

    // Recent 5
    allRecords.sort(function(a, b) {
      return String(b.recordId || '').localeCompare(String(a.recordId || ''));
    });
    var recent = [];
    for (var rr = 0; rr < allRecords.length && recent.length < 5; rr++) {
      var rec = allRecords[rr];
      recent.push({
        recordId: String(rec.recordId || ''),
        user: userMap[String(rec.user || '')] || String(rec.user || ''),
        brandName: (brandMapLookup[String(rec.brandId || '')] || {}).name || String(rec.brandId || ''),
        month: rec.month || '',
        date: formatSheetDateToDDMMYYYY(rec.enterDate)
      });
    }

    // Top 5 brands
    var topBrandsArr = Object.keys(brandCancelCount).map(function(id) {
      var bInfo = brandMapLookup[id] || {};
      var ownerId = bInfo.owner || '';
      return {
        brandName: bInfo.name || id,
        ownerName: ownerMap[ownerId] || '',
        count: brandCancelCount[id]
      };
    });
    topBrandsArr.sort(function(a, b) { return b.count - a.count; });

    return {
      kpi: kpi,
      operatorChart: operatorChart,
      providerChart: providerChart,
      trendChart: trendChart,
      recentActivity: recent,
      topBrands: topBrandsArr.slice(0, 5)
    };
  } catch (err) {
    Logger.log('getDashboardData Firebase error: ' + err.message);
    return {
      kpi: { month: month, totalCancellations: 0, totalRecords: 0, uniqueBrands: 0, uniqueProviders: 0, activeUsers: 0 },
      operatorChart: { labels: [], data: [] },
      providerChart: { labels: [], data: [] },
      trendChart: { labels: [], data: [] },
      recentActivity: [],
      topBrands: []
    };
  }
}









/**
* Lấy danh sách brandname và CP theo Owner
* Trả về { brands: [...], cps: [...] }
*/
function getBrandsAndCPsByOwner(ownerId) {
  var ss = getSpreadsheet();
  var brandSheet = ss.getSheetByName('Brandname');
  var cpSheet = ss.getSheetByName('CP');
  if (!brandSheet || !cpSheet) return { brands: [], cps: [] };

  var brandData = brandSheet.getDataRange().getValues();
  var cpData = cpSheet.getDataRange().getValues();
  var cpMap = {};
  for (var i = 1; i < cpData.length; i++) {
    cpMap[cpData[i][0]] = cpData[i][1] || '';
  }

  var brands = [];
  var cpSet = {};
  for (var i = 1; i < brandData.length; i++) {
    var row = brandData[i];
    if (row[2] == ownerId) {
      brands.push({ id: row[0], name: row[1], owner: row[2], cp: row[3] });
      if (row[3]) cpSet[row[3]] = cpMap[row[3]] || row[3];
    }
  }

  // Chuyển đổi cpSet thành mảng {id, name}
  var cps = Object.keys(cpSet).map(function(id) { return { id: id, name: cpSet[id] }; });
  return { brands: brands, cps: cps };
}

/**
* Lấy danh sách brandname theo CP
*/
function getBrandsByCP(cpId) {
  var ss = getSpreadsheet();
  var brandSheet = ss.getSheetByName('Brandname');
  if (!brandSheet) return [];

  var data = brandSheet.getDataRange().getValues();
  return data.filter(function(row, idx) {
    return idx > 0 && row[3] == cpId;
  }).map(function(row) {
    return { id: row[0], name: row[1], owner: row[2], cp: row[3] };
  });
}
function getInitialData() {
  var maps = getLookupMaps();
  return {
    users: maps.users,
    owners: maps.owners,
    cps: maps.cps,
    brands: maps.brands,
    operators: maps.operators,
    providers: maps.providers,
    operatorProviderMapping: maps.operatorProviderMapping,
    distinctMonths: getDistinctMonths()
  };
}

function formatSheetDateToDDMMYYYY(value) {
  if (value instanceof Date) {
    var dd = ('0' + value.getDate()).slice(-2);
    var mm = ('0' + (value.getMonth() + 1)).slice(-2);
    var yyyy = value.getFullYear();
    return dd + '/' + mm + '/' + yyyy;
  }
  var str = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    var parts = str.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }
  if (str.indexOf('T') > 0) {
    var d = new Date(str);
    if (!isNaN(d.getTime())) {
      var dd = ('0' + d.getDate()).slice(-2);
      var mm = ('0' + (d.getMonth() + 1)).slice(-2);
      var yyyy = d.getFullYear();
      return dd + '/' + mm + '/' + yyyy;
    }
  }
  return str;
}

function formatSheetDateToYYYYMM(value) {
  if (value instanceof Date) {
    var y = value.getFullYear();
    var m = value.getMonth() + 1;
    return y + '-' + (m < 10 ? '0' + m : m);
  }
  var str = String(value || '').trim();
  if (/^\d{4}-\d{2}$/.test(str)) return str;
  if (str) {
    var d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
    }
  }
  return str;
}

function migrationFillHashes() {
  var ss = getSpreadsheet();
  var mainSheet = ss.getSheetByName('Lich_Su_Huy');
  var detailSheet = ss.getSheetByName('Chi_Tiet_Huy');
  if (!mainSheet || !detailSheet) return;

  var lastRow = mainSheet.getLastRow();
  if (lastRow <= 1) return;

  // Đọc toàn bộ dữ liệu (chỉ sử dụng trong migration một lần)
  var mainData = mainSheet.getRange(2, 1, lastRow - 1, 8).getValues();
  var detailData = detailSheet.getDataRange().getValues();

  // Tạo map detail theo recordId
  var detailMap = {};
  for (var j = 1; j < detailData.length; j++) {
    var recId = (detailData[j][1] || '').toString().trim();
    var opId = (detailData[j][2] || '').toString().trim();
    var provId = (detailData[j][3] || '').toString().trim();
    if (!detailMap[recId]) detailMap[recId] = [];
    detailMap[recId].push(opId + '_' + provId);
  }

  var hashes = [];
  for (var i = 0; i < mainData.length; i++) {
    var row = mainData[i];
    var recId = (row[0] || '').toString().trim();
    var rowUser = (row[1] || '').toString().trim();
    // Bỏ qua rowEnterDate
    var rowOwner = (row[3] || '').toString().trim();
    var rowBrand = (row[4] || '').toString().trim();
    var rowCP = (row[5] || '').toString().trim();
    var rowMonth = formatSheetDateToYYYYMM(row[6]).trim();
    var rowNote = (row[7] || '').toString().trim();

    var recDetails = detailMap[recId] || [];
    recDetails.sort();

    var hashString = [
      rowUser,
      rowOwner,
      rowBrand,
      rowCP,
      rowMonth,
      rowNote,
      recDetails.join(',')
    ].join('|');

    var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, hashString, Utilities.Charset.UTF_8)
                 .map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); })
                 .join('');
    hashes.push([hash]);
  }

  // Ghi hàng loạt cột Hash vào cột 9 (RecordHashV2)
  mainSheet.getRange(2, 9, hashes.length, 1).setValues(hashes);
}

function getProvidersWithCancellationsInMonth(month) {
  if (!month) return [];
  try {
    var response = UrlFetchApp.fetch(FIREBASE_URL + "cancellations.json?auth=" + FIREBASE_SECRET);
    var cancellationsObj = JSON.parse(response.getContentText()) || {};
    var providerIds = {};
    for (var key in cancellationsObj) {
      var r = cancellationsObj[key];
      if (r && r.month === month) {
        var details = r.details || [];
        details.forEach(function(d) {
          if (d.providerIds) {
            d.providerIds.forEach(function(pId) {
              providerIds[pId] = true;
            });
          } else if (d.providerId) {
            providerIds[d.providerId] = true;
          }
        });
      }
    }
    return Object.keys(providerIds);
  } catch (err) {
    Logger.log("Firebase getProvidersWithCancellationsInMonth error, fallback to Sheets: " + err.message);
    return getProvidersWithCancellationsInMonthFallback(month);
  }
}

function getProvidersWithCancellationsInMonthFallback(month) {
  var ss = getSpreadsheet();
  var mainSheet = ss.getSheetByName('Lich_Su_Huy');
  var detailSheet = ss.getSheetByName('Chi_Tiet_Huy');
  if (!mainSheet || !detailSheet) return [];
  
  var mainData = mainSheet.getDataRange().getValues();
  var detailData = detailSheet.getDataRange().getValues();
  
  var recordIds = [];
  for (var i = 1; i < mainData.length; i++) {
    var row = mainData[i];
    if (!row[0]) continue;
    var rowMonth = formatSheetDateToYYYYMM(row[6]);
    if (rowMonth === month) {
      recordIds.push(String(row[0]).trim());
    }
  }
  
  if (recordIds.length === 0) return [];
  
  var providerIds = {};
  for (var j = 1; j < detailData.length; j++) {
    var d = detailData[j];
    var dRecordId = String(d[1] || '').trim();
    var dProvId = String(d[3] || '').trim();
    if (dProvId && recordIds.indexOf(dRecordId) !== -1) {
      providerIds[dProvId] = true;
    }
  }
  return Object.keys(providerIds);
}

function migrationSheetsToFirebase() {
  var ss = getSpreadsheet();
  var mainSheet = ss.getSheetByName('Lich_Su_Huy');
  var detailSheet = ss.getSheetByName('Chi_Tiet_Huy');
  var userSheet = ss.getSheetByName('User');
  if (!mainSheet || !detailSheet) {
    Logger.log("Thiếu sheet dữ liệu!");
    return "Thiếu sheet dữ liệu!";
  }

  var mainData = mainSheet.getDataRange().getValues();
  var detailData = detailSheet.getDataRange().getValues();
  
  // Tạo map ngược để tìm UserID từ FullName
  var userMapReverse = {};
  if (userSheet) {
    var uData = userSheet.getDataRange().getValues();
    for (var u = 1; u < uData.length; u++) {
      if (uData[u][1]) {
        userMapReverse[String(uData[u][1]).trim().toLowerCase()] = String(uData[u][0]).trim();
      }
    }
  }

  // Tạo map detail theo recordId
  var detailMap = {};
  for (var j = 1; j < detailData.length; j++) {
    var recId = String(detailData[j][1] || '').trim();
    var opId = String(detailData[j][2] || '').trim();
    var provId = String(detailData[j][3] || '').trim();
    if (!recId || !opId || !provId) continue;
    
    if (!detailMap[recId]) detailMap[recId] = {};
    if (!detailMap[recId][opId]) detailMap[recId][opId] = [];
    if (detailMap[recId][opId].indexOf(provId) === -1) {
      detailMap[recId][opId].push(provId);
    }
  }

  var cancellations = {};
  for (var i = 1; i < mainData.length; i++) {
    var row = mainData[i];
    var recordId = String(row[0] || '').trim();
    if (!recordId) continue;

    var fullName = String(row[1] || '').trim();
    var userId = userMapReverse[fullName.toLowerCase()] || fullName;

    var enterDate = formatSheetDateToDDMMYYYY(row[2]);
    var ownerId = String(row[3] || '').trim();
    var brandId = String(row[4] || '').trim();
    var cpId = String(row[5] || '').trim();
    var cancelMonth = formatSheetDateToYYYYMM(row[6]);
    var note = String(row[7] || '').trim();
    var hash = String(row[8] || '').trim();

    var recDetailsObj = detailMap[recordId] || {};
    var firebaseDetails = [];
    for (var opId in recDetailsObj) {
      firebaseDetails.push({
        operatorId: opId,
        providerIds: recDetailsObj[opId]
      });
    }

    cancellations[recordId] = {
      recordId: recordId,
      user: userId,
      enterDate: enterDate,
      owner: ownerId,
      brandId: brandId,
      cp: cpId,
      month: cancelMonth,
      note: note,
      hash: hash,
      details: firebaseDetails
    };
  }

  var fbUrl = FIREBASE_URL + "cancellations.json?auth=" + FIREBASE_SECRET;
  var fbOptions = {
    method: "put",
    contentType: "application/json",
    payload: JSON.stringify(cancellations),
    muteHttpExceptions: true
  };
  
  var response = UrlFetchApp.fetch(fbUrl, fbOptions);
  var responseCode = response.getResponseCode();
  if (responseCode === 200) {
    Logger.log("Migration thành công! Đã đồng bộ " + Object.keys(cancellations).length + " bản ghi lên Firebase.");
    return "Thành công: Đã đồng bộ " + Object.keys(cancellations).length + " bản ghi lên Firebase.";
  } else {
    Logger.log("Migration thất bại: " + response.getContentText());
    return "Thất bại: " + response.getContentText();
  }
}
// End of script
function __end(){
  // placeholder
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Migration')
    .addItem('Run Migration', 'migrationSheetsToFirebase')
    .addToUi();
}
