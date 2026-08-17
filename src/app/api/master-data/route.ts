import { NextResponse } from 'next/server';
import { findOrCreateMasterData } from '@/lib/master-data';

export async function POST(request: Request) {
  try {
    const { type, name } = await request.json();

    if (!type || !name) {
      return NextResponse.json({ error: 'Missing type or name' }, { status: 400 });
    }

    let tableName: 'brands' | 'cps';

    if (type === 'brand') {
      tableName = 'brands';
    } else if (type === 'cp') {
      tableName = 'cps';
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const data = await findOrCreateMasterData(tableName, trimmedName);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Lỗi thêm danh mục:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
