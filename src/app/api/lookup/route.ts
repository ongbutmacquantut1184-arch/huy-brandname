export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const fetchAll = async (table: string, columns: string) => {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) throw error;
      if (!count) return [];
      
      const limit = 1000;
      const promises = [];
      for (let i = 0; i < count; i += limit) {
        promises.push(supabase.from(table).select(columns).range(i, i + limit - 1));
      }
      const results = await Promise.all(promises);
      let allData: any[] = [];
      for (const res of results) {
        if (res.error) throw res.error;
        if (res.data) allData = allData.concat(res.data);
      }
      return allData;
    };

    const [
      { data: users },
      owners,
      cps,
      brands,
      { data: operators },
      { data: providers },
      { data: mappings }
    ] = await Promise.all([
      supabase.from('users').select('id, name'),
      fetchAll('owners', 'id, name'),
      fetchAll('cps', 'id, name'),
      fetchAll('brands', 'id, name, owner_id, cp_id'),
      supabase.from('operators').select('id, name').order('order_index'),
      supabase.from('providers').select('id, name, emails'),
      supabase.from('operator_provider_map').select('operator_id, provider_id')
    ]);

    const userMap: Record<string, string> = {};
    users?.forEach(u => userMap[u.id] = u.name);

    const ownerMap: Record<string, string> = {};
    owners?.forEach(o => ownerMap[o.id] = o.name);

    const cpMap: Record<string, string> = {};
    cps?.forEach(c => cpMap[c.id] = c.name);

    const brandMap: Record<string, any> = {};
    brands?.forEach(b => brandMap[b.id] = { name: b.name, owner: b.owner_id, cp: b.cp_id });

    const opMap: Record<string, string> = {};
    operators?.forEach(op => opMap[op.id] = op.name);

    const provMap: Record<string, string> = {};
    providers?.forEach(p => provMap[p.id] = p.name);

    // Build Operator -> Provider Mapping
    const mappingObj: Record<string, any[]> = {};
    mappings?.forEach(m => {
      if (!mappingObj[m.operator_id]) mappingObj[m.operator_id] = [];
      if (provMap[m.provider_id]) {
        mappingObj[m.operator_id].push({ id: m.provider_id, name: provMap[m.provider_id] });
      }
    });

    const operatorProviderMapping = operators?.map(op => ({
      id: op.id,
      name: op.name,
      providers: (mappingObj[op.id] || []).sort((a, b) => a.name.localeCompare(b.name))
    })) || [];

    return new NextResponse(
      JSON.stringify({
        users, userMap,
        owners, ownerMap,
        cps, cpMap,
        brands, brandMap,
        operators, opMap,
        providers, provMap,
        operatorProviderMapping
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  }
}
