export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');

  if (!month) {
    return NextResponse.json({ error: 'Thiếu tham số tháng' }, { status: 400 });
  }

  try {
    // Lấy các chi tiết hủy có liên quan đến các phiếu hủy trong tháng được chọn
    const { data, error } = await supabase
      .from('cancellation_details')
      .select(`
        provider_id,
        cancellation:cancellations!inner(month)
      `)
      .eq('cancellation.month', month);

    if (error) throw error;

    const activeProviderIds = Array.from(
      new Set(data?.map((item: any) => item.provider_id).filter(Boolean) || [])
    );

    return new NextResponse(JSON.stringify(activeProviderIds), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Lỗi lấy active providers:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  }
}
