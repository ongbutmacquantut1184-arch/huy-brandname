import { supabase } from './supabase';

type MasterDataTable = 'cps' | 'brands';

type MasterDataRecord = {
  id: string;
  name: string;
  cp_id?: string | null;
};

const MASTER_DATA_CONFIG = {
  cps: { prefix: 'CP', padLength: 5 },
  brands: { prefix: 'BR', padLength: 7 },
} as const;

function isDuplicateKey(error: any) {
  return error?.code === '23505' || String(error?.message || '').includes('duplicate key value');
}

async function findExistingByName(tableName: MasterDataTable, name: string) {
  const query = tableName === 'brands'
    ? supabase.from('brands').select('id, name, cp_id').eq('name', name).maybeSingle()
    : supabase.from('cps').select('id, name').eq('name', name).maybeSingle();

  const { data, error } = await query;

  if (error) throw error;
  return data as MasterDataRecord | null;
}

async function getNextReadableId(tableName: MasterDataTable, attempt: number) {
  const { prefix, padLength } = MASTER_DATA_CONFIG[tableName];
  const { data, error } = await supabase
    .from(tableName)
    .select('id')
    .like('id', `${prefix}%`);

  if (error) throw error;

  let maxNum = 0;
  if (data && data.length > 0) {
    for (const row of data) {
      if (row.id && row.id.startsWith(prefix)) {
        const parsedNum = parseInt(row.id.replace(prefix, ''), 10);
        if (!Number.isNaN(parsedNum) && parsedNum > maxNum) {
          maxNum = parsedNum;
        }
      }
    }
  }

  const nextNum = maxNum + 1 + attempt;
  return `${prefix}${String(nextNum).padStart(padLength, '0')}`;
}

export async function findOrCreateMasterData(
  tableName: MasterDataTable,
  name: string,
  extra: Partial<Pick<MasterDataRecord, 'cp_id'>> = {}
) {
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  const existing = await findExistingByName(tableName, trimmedName);
  if (existing) return existing;

  for (let attempt = 0; attempt < 8; attempt++) {
    const id = await getNextReadableId(tableName, attempt);
    const { data, error } = tableName === 'brands'
      ? await supabase
          .from('brands')
          .insert([{ id, name: trimmedName, cp_id: extra.cp_id || null }])
          .select('id, name, cp_id')
          .single()
      : await supabase
          .from('cps')
          .insert([{ id, name: trimmedName }])
          .select('id, name')
          .single();

    if (!error) return data as MasterDataRecord;

    if (!isDuplicateKey(error)) throw error;

    const racedExisting = await findExistingByName(tableName, trimmedName);
    if (racedExisting) return racedExisting;
  }

  throw new Error(`Không thể tạo ${tableName} do trùng khóa sau nhiều lần thử.`);
}
