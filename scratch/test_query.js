const https = require('https');
const url = 'https://jyswqydnhkgholntnaww.supabase.co/rest/v1/cx_customers?select=customer_id,ten_cong_ty,org_id,sale_phu_trach,customer_success,sale_in_charge,cs_in_charge&order=created_at.desc&limit=5';
const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Let's just use the known key if possible. Wait, let me extract it from .env.local

const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const key = keyMatch ? keyMatch[1] : '';

https.get(url, { headers: { 'apikey': key, 'Authorization': 'Bearer ' + key } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(JSON.parse(data)));
}).on('error', err => console.log(err));
