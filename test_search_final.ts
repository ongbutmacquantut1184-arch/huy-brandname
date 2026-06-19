import { searchCustomers } from './src/lib/cx-actions';
async function test() {
  const res = await searchCustomers('1184');
  console.log(JSON.stringify(res, null, 2));
}
test();
