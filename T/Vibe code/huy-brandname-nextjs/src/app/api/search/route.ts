import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const month = searchParams.get('month');
  const user_id = searchParams.get('user');
  const keyword = searchParams.get('keyword');
  const operatorIds = searchParams.get('operators'); // comma separated

  try {
    let query = supabase
      .from('cancellations')
      .select(`
        id, month, enter_date, note,
        user:users(name),
        brand:brands(name),
        owner:owners(name),
        cp:cps(name),
        details:cancellation_details(
          operator:operators(id, name),
          provider:providers(id, name)
        )
      `)
      .order('id', { ascending: false });

    // Áp dụng các bộ lọc cứng (Month, User) trực tiếp
    if (month) query = query.eq('month', month);
    if (user_id) query = query.eq('user_id', user_id);

    // Chạy truy vấn (Lấy tối đa 1000 bản ghi để giảm tải mạng, việc tra cứu siêu nhanh)
    const { data, error } = await query.limit(1000);
    
    if (error) throw error;

    let results = data || [];

    // Nếu có lọc bằng Từ khóa (Brandname, Owner, CP, Record ID) => Lọc in-memory
    if (keyword) {
      const kw = keyword.toLowerCase();
      results = results.filter((item: any) => {
        const str = [
          item.id,
          item.note,
          item.brand?.name,
          item.owner?.name,
          item.cp?.name
        ].join(' ').toLowerCase();
        return str.includes(kw);
      });
    }

    // Nếu có lọc bằng Nhà mạng => Lọc in-memory (vì PostgREST array intersect với joined table hơi phức tạp)
    if (operatorIds) {
      const ops = operatorIds.split(',');
      results = results.filter((item: any) => {
        const itemOps = item.details.map((d: any) => d.operator?.id);
        return ops.some(op => itemOps.includes(op));
      });
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Lỗi API Tra cứu:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
