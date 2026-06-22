const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

async function test() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(url, key);
  
  const { data: contracts, error } = await supabase
    .from('cx_contracts')
    .select('*')
    .order('created_at', { ascending: false });
    
  const customerIds = [...new Set(contracts.map(c => c.customer_id).filter(Boolean))];
  const { data: customers } = await supabase.from('cx_customers').select('customer_id, ten_cong_ty, org_id, sale_in_charge, cs_in_charge, sale_phu_trach, customer_success').in('customer_id', customerIds);
  
  const custMap = (customers || []).reduce((acc, curr) => {
    acc[curr.customer_id] = curr;
    return acc;
  }, {});

  const mapped = contracts.map(c => ({
    contract_id: c.contract_id,
    customer_id: c.customer_id,
    ten_cong_ty: custMap[c.customer_id]?.ten_cong_ty || '',
    org_id: custMap[c.customer_id]?.org_id || '',
    sale_in_charge: custMap[c.customer_id]?.sale_in_charge || custMap[c.customer_id]?.sale_phu_trach || '',
    cs_in_charge: custMap[c.customer_id]?.cs_in_charge || custMap[c.customer_id]?.customer_success || ''
  }));
  
  console.log(mapped);
}
test();
