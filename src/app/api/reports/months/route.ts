export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('cancellations')
      .select('month');

    if (error) throw error;

    // Lọc ra các tháng duy nhất và sắp xếp từ mới nhất đến cũ nhất
    const uniqueMonths = Array.from(
      new Set(data?.map((item: any) => item.month).filter(Boolean) || [])
    ).sort((a: string, b: string) => b.localeCompare(a));

    return new NextResponse(JSON.stringify(uniqueMonths), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách tháng báo cáo:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  }
}
