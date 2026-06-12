import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const brand_id = searchParams.get('brand_id');
    const cp_id = searchParams.get('cp_id');
    const exclude_id = searchParams.get('exclude_id');

    if (!month || !brand_id) {
      return NextResponse.json({ error: 'Missing month or brand_id' }, { status: 400 });
    }

    let dupQuery = supabase.from('cancellations').select('id').eq('month', month).eq('brand_id', brand_id);
    if (cp_id) {
      dupQuery = dupQuery.eq('cp_id', cp_id);
    } else {
      dupQuery = dupQuery.is('cp_id', null);
    }
    if (exclude_id) {
      dupQuery = dupQuery.neq('id', exclude_id);
    }

    const { data: existingCancellations, error: queryError } = await dupQuery;
    
    if (queryError || !existingCancellations || existingCancellations.length === 0) {
      return NextResponse.json([]);
    }

    const existingIds = existingCancellations.map(c => c.id);
    const { data: existingDetails, error: detailsError } = await supabase
      .from('cancellation_details')
      .select('cancellation_id, provider_id')
      .in('cancellation_id', existingIds);

    if (detailsError || !existingDetails) {
      return NextResponse.json([]);
    }

    return NextResponse.json(existingDetails);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
