import { searchCustomers } from './src/lib/cx-actions';
async function run() {
  const res = await searchCustomers('test');
  console.log(JSON.stringify(res, null, 2));
}
run();
