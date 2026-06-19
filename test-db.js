import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zpnwegnpkzwbtczultmr.supabase.co';
const supabaseKey = 'sb_secret_4TD8zyxoQlaF2SecjSYtSg_hgptXpLB'; // Not sure if this is valid anon/service key
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('relation "users" does not exist')) {
      console.log('Connection successful! Table "users" does not exist yet.');
    } else {
      console.error('Connection error:', error.message);
    }
  } else {
    console.log('Connection successful! Data:', data);
  }
}

testConnection();
