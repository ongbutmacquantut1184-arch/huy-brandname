const ExcelJS = require('exceljs');
const fs = require('fs');

async function run() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('Acc GapOne ver2.xlsx');
  const worksheet = workbook.getWorksheet('Acc GapOne ver2');
  
  const headers = {};
  worksheet.getRow(1).eachCell((cell, colNumber) => { headers[cell.value.trim()] = colNumber; });
  const getValue = (row, colName) => {
    const colNum = headers[colName];
    if (!colNum) return null;
    let val = row.getCell(colNum).value;
    if (val === null || val === undefined) return null;
    if (typeof val === 'object' && val.result !== undefined) val = val.result;
    return String(val).trim();
  };

  const cpIds = new Set();
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const cp = getValue(row, 'CPID');
    if (cp && cp.toLowerCase() !== 'none' && cp !== '-') {
      cpIds.add(cp);
    }
  });

  let sql = '-- Insert missing CPs\n';
  for (const cp of cpIds) {
    const safeCp = cp.replace(/'/g, "''");
    sql += `INSERT INTO cps (id, name) VALUES ('${safeCp}', 'CP ${safeCp}') ON CONFLICT DO NOTHING;\n`;
  }
  fs.writeFileSync('seed_0_cps.sql', sql);
  console.log('Created seed_0_cps.sql with ' + cpIds.size + ' CPs');
}
run();
