export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const providersParam = searchParams.get('providers'); // comma-separated list of provider IDs

  if (!month) {
    return NextResponse.json({ error: 'Thiếu tham số tháng' }, { status: 400 });
  }

  const selectedProviderIds = providersParam ? providersParam.split(',') : [];
  if (selectedProviderIds.length === 0) {
    return NextResponse.json({ error: 'Thiếu nhà cung cấp chọn lọc' }, { status: 400 });
  }

  try {
    // 1. Lấy danh sách các nhà mạng và sắp xếp theo order_index
    const { data: operators, error: opError } = await supabase
      .from('operators')
      .select('id, name')
      .order('order_index');

    if (opError) throw opError;

    // 2. Query tất cả cancellation details cho các nhà cung cấp được chọn trong tháng được chọn
    const { data: details, error: detailsError } = await supabase
      .from('cancellation_details')
      .select(`
        operator_id,
        provider_id,
        cancellation:cancellations!inner(
          id,
          brand:brands(name),
          cp:cps(name),
          owner:owners(name)
        )
      `)
      .eq('cancellation.month', month)
      .in('provider_id', selectedProviderIds);

    if (detailsError) throw detailsError;

    // 3. Xây dựng dữ liệu gom nhóm
    // reportData[providerId] = list of brand cancellations
    const reportData: Record<string, any> = {};

    selectedProviderIds.forEach(pid => {
      reportData[pid] = {
        operators: operators || [],
        brands: []
      };
    });

    // Gom dữ liệu theo provider -> brand
    const aggMap: Record<string, Record<string, { brandName: string; cp: string; owner: string; operators: Set<string> }>> = {};

    details?.forEach((item: any) => {
      const pid = item.provider_id;
      const cancel = item.cancellation;
      if (!cancel || !cancel.brand) return;

      const brandName = cancel.brand.name;
      const cpName = cancel.cp?.name || '';
      const ownerName = cancel.owner?.name || '';
      const opId = item.operator_id;

      if (!aggMap[pid]) aggMap[pid] = {};
      
      // Khóa gom nhóm là brandName để gộp các phiếu hủy trùng tên thương hiệu
      const brandKey = brandName; 

      if (!aggMap[pid][brandKey]) {
        aggMap[pid][brandKey] = {
          brandName,
          cp: cpName,
          owner: ownerName,
          operators: new Set<string>()
        };
      }
      aggMap[pid][brandKey].operators.add(opId);
    });

    // Chuyển map gom nhóm thành array kết quả cho mỗi provider
    for (const pid in aggMap) {
      if (!reportData[pid]) continue;
      
      const brandList = Object.values(aggMap[pid]).map((b: any) => {
        const operatorStatus: Record<string, string> = {};
        operators?.forEach(op => {
          operatorStatus[op.id] = b.operators.has(op.id) ? 'Yes' : '-';
        });

        return {
          brandName: b.brandName,
          cp: b.cp,
          owner: b.owner,
          operatorStatus
        };
      });

      // Sắp xếp brandname theo bảng chữ cái A-Z
      brandList.sort((a, b) => a.brandName.localeCompare(b.brandName));
      reportData[pid].brands = brandList;
    }

    return new NextResponse(JSON.stringify(reportData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Lỗi lấy dữ liệu báo cáo:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  }
}
