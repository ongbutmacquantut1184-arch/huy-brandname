const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Bắt đầu quá trình Migration...');
  if (!fs.existsSync('data.xlsx')) {
    console.error('Không tìm thấy file data.xlsx. Vui lòng tải file Google Sheet dưới dạng Excel và lưu thành data.xlsx');
    return;
  }

  const workbook = xlsx.readFile('data.xlsx');
  
  // 1. Users
  const userSheet = workbook.Sheets['User'];
  if (userSheet) {
    const users = xlsx.utils.sheet_to_json(userSheet, { header: 1 }).slice(1)
      .filter(row => row[0])
      .map(row => ({ id: String(row[0]), name: String(row[1]) }));
    if (users.length > 0) {
      const { error } = await supabase.from('users').upsert(users);
      if (error) console.error('Lỗi Users:', error);
      else console.log(`Đã migrate ${users.length} Users.`);
    }
  }

  // 2. Owners
  const ownerSheet = workbook.Sheets['Company_Owner'];
  if (ownerSheet) {
    const owners = xlsx.utils.sheet_to_json(ownerSheet, { header: 1 }).slice(1)
      .filter(row => row[0])
      .map(row => ({ id: String(row[0]), name: String(row[1]) }));
    if (owners.length > 0) {
      const { error } = await supabase.from('owners').upsert(owners);
      if (error) console.error('Lỗi Owners:', error);
      else console.log(`Đã migrate ${owners.length} Owners.`);
    }
  }

  // 3. CPs
  const cpSheet = workbook.Sheets['CP'];
  if (cpSheet) {
    const cps = xlsx.utils.sheet_to_json(cpSheet, { header: 1 }).slice(1)
      .filter(row => row[0])
      .map(row => ({ id: String(row[0]), name: String(row[1]) }));
    if (cps.length > 0) {
      const { error } = await supabase.from('cps').upsert(cps);
      if (error) console.error('Lỗi CPs:', error);
      else console.log(`Đã migrate ${cps.length} CPs.`);
    }
  }

  // 4. Brands
  const brandSheet = workbook.Sheets['Brandname'];
  if (brandSheet) {
    const brands = xlsx.utils.sheet_to_json(brandSheet, { header: 1 }).slice(1)
      .filter(row => row[0])
      .map(row => ({ 
        id: String(row[0]), 
        name: String(row[1] || ''),
        owner_id: row[2] ? String(row[2]) : null,
        cp_id: row[3] ? String(row[3]) : null
      }));
    if (brands.length > 0) {
      const { error } = await supabase.from('brands').upsert(brands);
      if (error) console.error('Lỗi Brands:', error);
      else console.log(`Đã migrate ${brands.length} Brands.`);
    }
  }

  // 5. Operators
  const opSheet = workbook.Sheets['Nha_Mang'];
  if (opSheet) {
    const ops = xlsx.utils.sheet_to_json(opSheet, { header: 1 }).slice(1)
      .filter(row => row[0])
      .map((row, idx) => ({ id: String(row[0]), name: String(row[1]), order_index: idx }));
    if (ops.length > 0) {
      const { error } = await supabase.from('operators').upsert(ops);
      if (error) console.error('Lỗi Operators:', error);
      else console.log(`Đã migrate ${ops.length} Operators.`);
    }
  }

  // 6. Providers
  const provSheet = workbook.Sheets['Nha_Cung_Cap'];
  if (provSheet) {
    const provs = xlsx.utils.sheet_to_json(provSheet, { header: 1 }).slice(1)
      .filter(row => row[0])
      .map(row => ({ id: String(row[0]), name: String(row[1]) }));
    if (provs.length > 0) {
      const { error } = await supabase.from('providers').upsert(provs);
      if (error) console.error('Lỗi Providers:', error);
      else console.log(`Đã migrate ${provs.length} Providers.`);
    }
  }

  // 7. Operator_Provider Mapping
  const mapSheet = workbook.Sheets['Operator_Provider'];
  if (mapSheet) {
    const mappings = xlsx.utils.sheet_to_json(mapSheet, { header: 1 }).slice(1)
      .filter(row => row[0] && row[1])
      .map(row => ({ operator_id: String(row[0]), provider_id: String(row[1]) }));
    if (mappings.length > 0) {
      const { error } = await supabase.from('operator_provider_map').upsert(mappings);
      if (error) console.error('Lỗi Mapping:', error);
      else console.log(`Đã migrate ${mappings.length} Mappings.`);
    }
  }

  // 8. Lịch sử Hủy (Cancellations)
  const historySheet = workbook.Sheets['Lich_Su_Huy'];
  if (historySheet) {
    const rows = xlsx.utils.sheet_to_json(historySheet, { header: 1 }).slice(1).filter(r => r[0]);
    const cancellations = rows.map(row => {
      let enter_date = row[2];
      if (typeof enter_date === 'number') { // Excel date
        enter_date = new Date((enter_date - 25569) * 86400 * 1000).toISOString().split('T')[0];
      } else {
        const d = new Date(enter_date);
        enter_date = isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
      }
      return {
        id: String(row[0]),
        user_id: row[1] ? String(row[1]) : null,
        enter_date: enter_date || new Date().toISOString().split('T')[0],
        owner_id: row[3] ? String(row[3]) : null,
        brand_id: row[4] ? String(row[4]) : null,
        cp_id: row[5] ? String(row[5]) : null,
        month: String(row[6]),
        note: row[7] ? String(row[7]) : ''
      };
    });
    if (cancellations.length > 0) {
      const { error } = await supabase.from('cancellations').upsert(cancellations);
      if (error) console.error('Lỗi Cancellations:', error);
      else console.log(`Đã migrate ${cancellations.length} phiếu Hủy.`);
    }
  }

  // 9. Chi Tiết Hủy
  const detailSheet = workbook.Sheets['Chi_Tiet_Huy'];
  if (detailSheet) {
    const rows = xlsx.utils.sheet_to_json(detailSheet, { header: 1 }).slice(1).filter(r => r[1] && r[2] && r[3]);
    const details = rows.map(row => ({
      cancellation_id: String(row[1]),
      operator_id: String(row[2]),
      provider_id: String(row[3])
    }));
    // Loại bỏ trùng lặp (nếu có)
    const uniqueMap = {};
    details.forEach(d => {
       uniqueMap[`${d.cancellation_id}_${d.operator_id}_${d.provider_id}`] = d;
    });
    const uniqueDetails = Object.values(uniqueMap);
    
    if (uniqueDetails.length > 0) {
      const { error } = await supabase.from('cancellation_details').upsert(uniqueDetails);
      if (error) console.error('Lỗi Cancellation Details:', error);
      else console.log(`Đã migrate ${uniqueDetails.length} chi tiết Hủy.`);
    }
  }

  console.log('Hoàn thành quá trình Migration!');
}

migrate();
