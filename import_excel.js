const ExcelJS = require('exceljs');
const fs = require('fs');

async function runImport() {
  console.log("Loading Excel file...");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('Acc GapOne ver2.xlsx');
  
  const worksheet = workbook.getWorksheet('Acc GapOne ver2');
  if (!worksheet) {
    console.error("Could not find sheet 'Acc GapOne ver2'");
    return;
  }

  const headers = {};
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[cell.value.trim()] = colNumber;
  });

  const getValue = (row, colName) => {
    const colNum = headers[colName];
    if (!colNum) return null;
    const val = row.getCell(colNum).value;
    if (val === null || val === undefined) return null;
    if (typeof val === 'object') {
      if (val.result !== undefined) return val.result;
      if (val instanceof Date) return val.toISOString();
      if (val.text) return val.text;
    }
    return String(val).trim();
  };

  const escapeSql = (str) => {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/'/g, "''") + "'";
  };

  const customersMap = new Map();
  const accountsData = [];
  const contractsData = [];
  const servicesData = [];

  let subCounter = 1;
  let camCounter = 1;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    
    let orgId = getValue(row, "ORG ID");
    const tenCongTy = getValue(row, "Tên công ty") || "Không rõ tên";
    
    if (!orgId || orgId.toLowerCase() === 'none' || orgId === '-') {
      orgId = null;
    }
    const groupKey = orgId || tenCongTy;
    const maPhanLoai = getValue(row, "Mã phân loại") || "";
    const isCampaign = maPhanLoai.toLowerCase().includes("campaign");
    const loaiKhachHang = isCampaign ? "Campaign" : "Subscription";

    let customerId;
    if (customersMap.has(groupKey)) {
      customerId = customersMap.get(groupKey).customer_id;
    } else {
      const prefix = isCampaign ? "CAM" : "SUB";
      const counter = isCampaign ? camCounter++ : subCounter++;
      customerId = `${prefix}-IM-${String(counter).padStart(4, '0')}`;
      
      const customer = {
        customer_id: customerId,
        org_id: orgId || '',
        ten_cong_ty: tenCongTy,
        khu_vuc: getValue(row, "Khu vực (theo Sale)") || '',
        nganh_nghe: getValue(row, "Ngành nghề") || '',
        phan_khuc: getValue(row, "Phân khúc KH") || '',
        cpid: getValue(row, "CPID") || '',
        customer_success: getValue(row, "Customer Success") || '',
        sale_phu_trach: getValue(row, "Sales") || '',
        mo_ta_nhu_cau_tu_sale: getValue(row, "Mô tả nhu cầu KH (từ sale)") || '',
        lock_nguyen_nhan: getValue(row, "Locked vì nguyên nhân khách quan") || '',
        loai_khach_hang: loaiKhachHang,
        created_by: 'system_import',
        trang_thai: 'Active'
      };
      customersMap.set(groupKey, customer);
    }

    const tenTaiKhoan = getValue(row, "Tên tài khoản") || '';
    let accountId = null;
    if (tenTaiKhoan) {
      accountId = `ACC-${customerId}-${rowNumber}`;
      accountsData.push({
        account_id: accountId,
        customer_id: customerId,
        ten_tai_khoan: tenTaiKhoan,
        mat_khau: getValue(row, "Mật khẩu") || '',
        email_tao_tk: getValue(row, "Email tạo tài khoản") || '',
        trang_thai: getValue(row, "Status") || 'Active',
        ngay_het_han: getValue(row, "Ngày hết hạn") ? new Date(getValue(row, "Ngày hết hạn")).toISOString() : null,
        created_by: 'system_import'
      });
    }

    const loaiGoiCuoc = getValue(row, "Loại gói cước") || '';
    const ngayBatDau = getValue(row, "Ngày bắt đầu") ? new Date(getValue(row, "Ngày bắt đầu")).toISOString() : null;
    const ngayHetHan = getValue(row, "Ngày hết hạn") ? new Date(getValue(row, "Ngày hết hạn")).toISOString() : null;
    
    let contractId = `CTR-${customerId}-${rowNumber}`;
    contractsData.push({
      contract_id: contractId,
      customer_id: customerId,
      loai_hop_dong: loaiGoiCuoc,
      hinh_thuc_thanh_toan: getValue(row, "Hình thức thanh toán") || '',
      tu_dong_gia_han: getValue(row, "HĐ có tự động gia hạn?") === 'Có' ? 'true' : 'false',
      ngay_bat_dau_hd: ngayBatDau,
      ngay_ket_thuc_hd: ngayHetHan,
      trang_thai: 'Active',
      created_by: 'system_import'
    });

    let channels = getValue(row, "Kênh gửi tin") || '';
    let channelList = channels.split(',').map(c => c.trim()).filter(c => c);
    if (channelList.length === 0) channelList = [''];

    for (let i = 0; i < channelList.length; i++) {
      const channel = channelList[i];
      const serviceId = `SRV-${customerId}-${rowNumber}-${i}`;
      
      servicesData.push({
        service_id: serviceId,
        customer_id: customerId,
        account_id: accountId,
        contract_id: contractId,
        channel: channel,
        usage_method: getValue(row, "Hình thức sử dụng") || '',
        cp_id: getValue(row, "CPID") || null,
        customer_support: getValue(row, "Customer Support") || '',
        trang_thai: getValue(row, "Status") || 'Active',
        ghi_chu: getValue(row, "Note/Thông tin gia hạn") || '',
        ngay_bat_dau: ngayBatDau,
        ngay_het_han: ngayHetHan,
        loai_dich_vu: loaiGoiCuoc,
        created_by: 'system_import'
      });
    }
  });

  console.log(`Parsed ${customersMap.size} customers, ${accountsData.length} accounts, ${contractsData.length} contracts, ${servicesData.length} services.`);
  
  let sql = `-- Migration script generated from Excel\n\n`;

  sql += `\n-- Insert Customers\n`;
  const customersArray = Array.from(customersMap.values());
  for (const c of customersArray) {
    sql += `INSERT INTO cx_customers (customer_id, org_id, ten_cong_ty, khu_vuc, nganh_nghe, phan_khuc, cpid, customer_success, sale_phu_trach, mo_ta_nhu_cau_tu_sale, lock_nguyen_nhan, loai_khach_hang, created_by, trang_thai) VALUES (${escapeSql(c.customer_id)}, ${escapeSql(c.org_id)}, ${escapeSql(c.ten_cong_ty)}, ${escapeSql(c.khu_vuc)}, ${escapeSql(c.nganh_nghe)}, ${escapeSql(c.phan_khuc)}, ${escapeSql(c.cpid)}, ${escapeSql(c.customer_success)}, ${escapeSql(c.sale_phu_trach)}, ${escapeSql(c.mo_ta_nhu_cau_tu_sale)}, ${escapeSql(c.lock_nguyen_nhan)}, ${escapeSql(c.loai_khach_hang)}, ${escapeSql(c.created_by)}, ${escapeSql(c.trang_thai)}) ON CONFLICT DO NOTHING;\n`;
  }

  sql += `\n-- Insert Accounts\n`;
  for (const a of accountsData) {
    sql += `INSERT INTO cx_accounts (account_id, customer_id, ten_tai_khoan, mat_khau, email_tao_tk, trang_thai, ngay_het_han, created_by) VALUES (${escapeSql(a.account_id)}, ${escapeSql(a.customer_id)}, ${escapeSql(a.ten_tai_khoan)}, ${escapeSql(a.mat_khau)}, ${escapeSql(a.email_tao_tk)}, ${escapeSql(a.trang_thai)}, ${a.ngay_het_han ? escapeSql(a.ngay_het_han) : 'NULL'}, ${escapeSql(a.created_by)}) ON CONFLICT DO NOTHING;\n`;
  }

  sql += `\n-- Insert Contracts\n`;
  for (const c of contractsData) {
    sql += `INSERT INTO cx_contracts (contract_id, customer_id, loai_hop_dong, hinh_thuc_thanh_toan, tu_dong_gia_han, ngay_bat_dau_hd, ngay_ket_thuc_hd, trang_thai, created_by) VALUES (${escapeSql(c.contract_id)}, ${escapeSql(c.customer_id)}, ${escapeSql(c.loai_hop_dong)}, ${escapeSql(c.hinh_thuc_thanh_toan)}, ${c.tu_dong_gia_han}, ${c.ngay_bat_dau_hd ? escapeSql(c.ngay_bat_dau_hd) : 'NULL'}, ${c.ngay_ket_thuc_hd ? escapeSql(c.ngay_ket_thuc_hd) : 'NULL'}, ${escapeSql(c.trang_thai)}, ${escapeSql(c.created_by)}) ON CONFLICT DO NOTHING;\n`;
  }

  sql += `\n-- Insert Services\n`;
  for (const s of servicesData) {
    sql += `INSERT INTO cx_services (service_id, customer_id, account_id, contract_id, channel, usage_method, cp_id, customer_support, trang_thai, ghi_chu, ngay_bat_dau, ngay_het_han, loai_dich_vu, created_by) VALUES (${escapeSql(s.service_id)}, ${escapeSql(s.customer_id)}, ${escapeSql(s.account_id)}, ${escapeSql(s.contract_id)}, ${escapeSql(s.channel)}, ${escapeSql(s.usage_method)}, ${escapeSql(s.cp_id)}, ${escapeSql(s.customer_support)}, ${escapeSql(s.trang_thai)}, ${escapeSql(s.ghi_chu)}, ${s.ngay_bat_dau ? escapeSql(s.ngay_bat_dau) : 'NULL'}, ${s.ngay_het_han ? escapeSql(s.ngay_het_han) : 'NULL'}, ${escapeSql(s.loai_dich_vu)}, ${escapeSql(s.created_by)}) ON CONFLICT DO NOTHING;\n`;
  }

  fs.writeFileSync('seed_data.sql', sql);
  console.log("🎉 SQL generation completed! File saved as seed_data.sql");
}

runImport();
