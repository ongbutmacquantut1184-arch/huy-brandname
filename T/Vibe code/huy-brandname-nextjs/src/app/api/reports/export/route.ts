export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as xlsx from 'xlsx';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || '';
  const providersParam = searchParams.get('providers') || '';
  const format = searchParams.get('format') || 'xlsx'; // 'xlsx' or 'csv'

  if (!month) {
    return new NextResponse('Thiếu tham số tháng', { status: 400 });
  }

  const selectedProviderIds = providersParam ? providersParam.split(',') : [];
  if (selectedProviderIds.length === 0) {
    return new NextResponse('Thiếu nhà cung cấp chọn lọc', { status: 400 });
  }

  try {
    // 1. Lấy danh sách operators & providers map để lấy tên hiển thị
    const [
      { data: operators },
      { data: providers }
    ] = await Promise.all([
      supabase.from('operators').select('id, name').order('order_index'),
      supabase.from('providers').select('id, name')
    ]);

    const provMap: Record<string, string> = {};
    providers?.forEach(p => provMap[p.id] = p.name);

    // 2. Query cancellation details
    const { data: details, error: detailsError } = await supabase
      .from('cancellation_details')
      .select(`
        operator_id,
        provider_id,
        cancellation:cancellations!inner(
          brand:brands(name),
          cp:cps(name),
          owner:owners(name)
        )
      `)
      .eq('cancellation.month', month)
      .in('provider_id', selectedProviderIds);

    if (detailsError) throw detailsError;

    // 3. Gom nhóm dữ liệu theo provider -> brand
    const aggMap: Record<string, Record<string, { brandName: string; cp: string; owner: string; operators: Set<string> }>> = {};
    selectedProviderIds.forEach(pid => {
      aggMap[pid] = {};
    });

    details?.forEach((item: any) => {
      const pid = item.provider_id;
      const cancel = item.cancellation;
      if (!cancel || !cancel.brand) return;

      const brandName = cancel.brand.name;
      const cpName = cancel.cp?.name || '';
      const ownerName = cancel.owner?.name || '';
      const opId = item.operator_id;

      if (!aggMap[pid]) aggMap[pid] = {};
      
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

    // 4. Xử lý xuất CSV
    if (format === 'csv') {
      let csvContent = '\uFEFF'; // UTF-8 BOM
      
      selectedProviderIds.forEach((pid, idx) => {
        const brandsObj = aggMap[pid] ? Object.values(aggMap[pid]) : [];
        if (brandsObj.length === 0) return;

        // Sắp xếp brandname A-Z
        brandsObj.sort((a, b) => a.brandName.localeCompare(b.brandName));

        const providerName = provMap[pid] || pid;
        csvContent += `"${providerName}"\n`;

        // Headers
        const headers = ['STT', 'Brandname'];
        operators?.forEach(op => headers.push(`Hủy ${op.name}`));
        headers.push('Lĩnh vực', 'Đơn vị sử dụng Brandname');
        csvContent += headers.map(h => `"${h}"`).join(',') + '\n';

        // Data Rows
        brandsObj.forEach((brand: any, bIdx) => {
          const row = [bIdx + 1, brand.brandName];
          operators?.forEach(op => {
            row.push(brand.operators.has(op.id) ? 'Yes' : '-');
          });
          row.push('');
          row.push(brand.owner || '');
          
          csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
        });

        // Add blank line between providers
        if (idx < selectedProviderIds.length - 1) {
          csvContent += '\n';
        }
      });

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="Bao_cao_huy_brandname_${month}.csv"`
        }
      });
    }

    // 5. Xử lý xuất Excel (.xlsx) đa tab
    const wb = xlsx.utils.book_new();
    let hasSheets = false;

    selectedProviderIds.forEach(pid => {
      const brandsObj = aggMap[pid] ? Object.values(aggMap[pid]) : [];
      if (brandsObj.length === 0) return;

      // Sắp xếp brandname A-Z
      brandsObj.sort((a, b) => a.brandName.localeCompare(b.brandName));

      const providerName = provMap[pid] || pid;
      // Sheet name tối đa 31 ký tự, thay thế các ký tự đặc biệt
      const sheetName = providerName.substring(0, 31).replace(/[\\\?\*\/\[\]]/g, '');

      // Build rows
      const rows: any[][] = [];
      
      // Header row
      const headers = ['STT', 'Brandname'];
      operators?.forEach(op => headers.push(`Hủy ${op.name}`));
      headers.push('Lĩnh vực', 'Đơn vị sử dụng Brandname');
      rows.push(headers);

      // Data rows
      brandsObj.forEach((brand: any, bIdx) => {
        const row = [bIdx + 1, brand.brandName];
        operators?.forEach(op => {
          row.push(brand.operators.has(op.id) ? 'Yes' : '-');
        });
        row.push('');
        row.push(brand.owner || '');
        rows.push(row);
      });

      const ws = xlsx.utils.aoa_to_sheet(rows);
      xlsx.utils.book_append_sheet(wb, ws, sheetName);
      hasSheets = true;
    });

    if (!hasSheets) {
      // Nếu không có dữ liệu cho bất cứ provider nào, tạo sheet trống để tránh lỗi Excel
      const ws = xlsx.utils.aoa_to_sheet([['Không có dữ liệu phát sinh hủy']]);
      xlsx.utils.book_append_sheet(wb, ws, 'NoData');
    }

    const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Bao_cao_huy_brandname_${month}.xlsx"`
      }
    });

  } catch (error: any) {
    console.error('Lỗi xuất báo cáo:', error);
    return new NextResponse('Lỗi máy chủ khi sinh báo cáo: ' + error.message, { status: 500 });
  }
}
