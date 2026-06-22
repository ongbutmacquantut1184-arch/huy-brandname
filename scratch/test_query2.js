const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');

const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

fetch(`${url}/rest/v1/cx_customers?select=*&limit=3`, {
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key
  }
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
