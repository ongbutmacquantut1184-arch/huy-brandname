import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, emails } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID nhà cung cấp' }, { status: 400 });
    }

    const { error } = await supabase
      .from('providers')
      .update({ emails })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Lỗi cập nhật email nhà cung cấp:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
