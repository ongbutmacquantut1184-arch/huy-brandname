import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { type, name } = await request.json();

    if (!type || !name) {
      return NextResponse.json({ error: 'Missing type or name' }, { status: 400 });
    }

    let tableName = '';
    if (type === 'brand') tableName = 'brands';
    else if (type === 'cp') tableName = 'cps';
    else if (type === 'owner') tableName = 'owners';
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    // Generate a simple ID (e.g., lowercased, spaces replaced, or just use name as ID for CPs and Owners if needed)
    // The old system used string IDs. Let's use name.trim() as ID for simplicity, or let Supabase handle if it's text.
    const id = name.trim();

    const { data, error } = await supabase
      .from(tableName)
      .insert([{ id, name: id }]) // For brands/cps/owners, id and name are often the same in the old system, or id is generated
      .select()
      .single();

    if (error) {
      // Nếu là lỗi duplicate key value violates unique constraint (23505)
      if (error.code === '23505') {
        const typeName = type === 'brand' ? 'Brandname' : type === 'cp' ? 'CP' : 'Đơn vị sử dụng';
        return NextResponse.json({ error: `${typeName} "${name}" đã tồn tại trên hệ thống. Vui lòng chọn từ danh sách thay vì thêm mới.` }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Lỗi thêm danh mục:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
