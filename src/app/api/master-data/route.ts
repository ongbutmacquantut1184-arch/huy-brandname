import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { type, name } = await request.json();

    if (!type || !name) {
      return NextResponse.json({ error: 'Missing type or name' }, { status: 400 });
    }

    let tableName = '';
    let prefix = '';
    let padLength = 5;

    if (type === 'brand') {
      tableName = 'brands';
      prefix = 'BR';
      padLength = 7;
    } else if (type === 'cp') {
      tableName = 'cps';
      prefix = 'CP';
      padLength = 5;
    } else if (type === 'owner') {
      tableName = 'owners';
      prefix = 'OW';
      padLength = 5;
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // 1. Kiểm tra trùng lặp tên danh mục (chính xác phân biệt hoa thường)
    const { data: existing } = await supabase
      .from(tableName)
      .select('id')
      .eq('name', trimmedName)
      .single();

    if (existing) {
      const typeName = type === 'brand' ? 'Brandname' : type === 'cp' ? 'CP' : 'Đơn vị sử dụng';
      return NextResponse.json({ error: `${typeName} "${trimmedName}" đã tồn tại trên hệ thống. Vui lòng chọn từ danh sách thay vì thêm mới.` }, { status: 409 });
    }

    // 2. Tự động sinh ID theo rule
    // Lấy ID lớn nhất hiện tại
    const { data: maxRecord } = await supabase
      .from(tableName)
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    let nextNum = 1;
    if (maxRecord && maxRecord.id && maxRecord.id.startsWith(prefix)) {
      const numPart = maxRecord.id.replace(prefix, '');
      const parsedNum = parseInt(numPart, 10);
      if (!isNaN(parsedNum)) {
        nextNum = parsedNum + 1;
      }
    }

    const newId = `${prefix}${String(nextNum).padStart(padLength, '0')}`;

    // 3. Chèn bản ghi mới
    const { data, error } = await supabase
      .from(tableName)
      .insert([{ id: newId, name: trimmedName }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Lỗi thêm danh mục:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
