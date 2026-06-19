import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import ExcelJS from 'exceljs';

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
      supabase.from('providers').select('id, name, emails')
    ]);

    const provMap: Record<string, { name: string; emails: string }> = {};
    providers?.forEach(p => provMap[p.id] = { name: p.name, emails: p.emails || '' });

    // 2. Query cancellation details
    const { data: details, error: detailsError } = await supabase
      .from('cancellation_details')
      .select(`
        operator_id,
        provider_id,
        cancellation:cancellations!inner(
          brand:brands(name),
          cp:cps(name)
        )
      `)
      .eq('cancellation.month', month)
      .in('provider_id', selectedProviderIds);

    if (detailsError) throw detailsError;

    // 3. Gom nhóm dữ liệu theo provider -> brand
    const aggMap: Record<string, Record<string, { brandName: string; cp: string; operators: Set<string> }>> = {};
    selectedProviderIds.forEach(pid => {
      aggMap[pid] = {};
    });

    details?.forEach((item: any) => {
      const pid = item.provider_id;
      const cancel = item.cancellation;
      if (!cancel || !cancel.brand) return;

      const brandName = cancel.brand.name;
      const cpName = cancel.cp?.name || '';
      const opId = item.operator_id;

      if (!aggMap[pid]) aggMap[pid] = {};
      
      const brandKey = brandName;
      if (!aggMap[pid][brandKey]) {
        aggMap[pid][brandKey] = {
          brandName,
          cp: cpName,
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

        const providerInfo = provMap[pid] || { name: pid, emails: '' };
        csvContent += `"${providerInfo.name}"\n`;

        // Headers
        const headers = ['STT', 'Brandname'];
        operators?.forEach(op => headers.push(`Hủy ${op.name}`));
        headers.push('Lĩnh vực');
        csvContent += headers.map(h => `"${h}"`).join(',') + '\n';

        // Data Rows
        brandsObj.forEach((brand: any, bIdx) => {
          const row = [bIdx + 1, brand.brandName];
          operators?.forEach(op => {
            row.push(brand.operators.has(op.id) ? 'Yes' : '-');
          });
          row.push(''); // Lĩnh vực CP
          
          csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
        });

        if (providerInfo.emails) {
          csvContent += `"${providerInfo.emails}"\n`;
        }

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

    // 5. Xử lý xuất Excel (.xlsx) bằng exceljs
    const workbook = new ExcelJS.Workbook();
    let hasSheets = false;

    selectedProviderIds.forEach(pid => {
      const brandsObj = aggMap[pid] ? Object.values(aggMap[pid]) : [];
      if (brandsObj.length === 0) return;

      brandsObj.sort((a, b) => a.brandName.localeCompare(b.brandName));

      const providerInfo = provMap[pid] || { name: pid, emails: '' };
      const sheetName = providerInfo.name.substring(0, 31).replace(/[\\\?\*\/\[\]]/g, '');

      const worksheet = workbook.addWorksheet(sheetName);

      const headers = ['STT', 'Brandname'];
      operators?.forEach(op => headers.push(`Hủy ${op.name}`));
      headers.push('Lĩnh vực');
      
      const headerRow = worksheet.addRow(headers);
      
      // Styling header
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEFEFEF' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Data rows
      brandsObj.forEach((brand: any, bIdx) => {
        const row = [bIdx + 1, brand.brandName];
        operators?.forEach(op => {
          row.push(brand.operators.has(op.id) ? 'Yes' : '-');
        });
        row.push(brand.cp || '');
        worksheet.addRow(row);
      });

      // Thêm dòng hiển thị Email nếu có
      if (providerInfo.emails) {
        const emailText = providerInfo.emails;
        const emailRow = worksheet.addRow([emailText]);
        worksheet.mergeCells(emailRow.number, 1, emailRow.number, headers.length);
        emailRow.getCell(1).font = { italic: true };
      }

      // Format tất cả các ô có border
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Tự động căn chỉnh độ rộng cột
      worksheet.getColumn(1).width = 5; // STT
      worksheet.getColumn(2).width = 25; // Brandname
      for (let i = 3; i <= headers.length; i++) {
        worksheet.getColumn(i).width = 15;
      }
      
      hasSheets = true;
    });

    if (!hasSheets) {
      workbook.addWorksheet('NoData').addRow(['Không có dữ liệu phát sinh hủy']);
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
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
