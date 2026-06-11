import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Thiếu ID bản ghi' }, { status: 400 });
  }

  try {
    const { data: cancellation, error } = await supabase
      .from('cancellations')
      .select(`
        id, month, enter_date, note, user_id, updated_at,
        brand:brands(id, name, cp_id, owner_id),
        owner:owners(id, name),
        cp:cps(id, name),
        details:cancellation_details(operator_id, provider_id)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!cancellation) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 });
    }

    return NextResponse.json(cancellation);
  } catch (error: any) {
    console.error('Lỗi lấy chi tiết phiếu hủy:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, user_id, brand_id, owner_id, cp_id, note, details } = body;

    // Generate a unique ID for cancellation if not provided
    // Logic cũ sinh ID tăng dần dạng C00001, ở đây ta có thể dùng timestamp + random ngắn hoặc query count
    const { count } = await supabase.from('cancellations').select('*', { count: 'exact', head: true });
    const nextNum = (count || 0) + 1;
    const generatedId = `C${String(nextNum).padStart(5, '0')}`;

    // Fetch user name
    const { data: user } = await supabase.from('users').select('name').eq('id', user_id).single();
    const user_name = user?.name || '';

    // 1. Insert Cancellation record
    const { data: cancelData, error: cancelError } = await supabase
      .from('cancellations')
      .insert({
        id: generatedId,
        month,
        user_id,
        user_name,
        brand_id,
        owner_id,
        cp_id,
        note,
        enter_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (cancelError) throw cancelError;

    const cancellationId = cancelData.id;

    // 2. Prepare Details
    const detailRows: any[] = [];
    details.forEach((op: any) => {
      op.provider_ids.forEach((provId: string) => {
        detailRows.push({
          cancellation_id: cancellationId,
          operator_id: op.operator_id,
          provider_id: provId
        });
      });
    });

    // 3. Insert Details
    if (detailRows.length > 0) {
      const { error: detailError } = await supabase
        .from('cancellation_details')
        .insert(detailRows);
        
      if (detailError) {
        // Rollback cancellation if details fail
        await supabase.from('cancellations').delete().eq('id', cancellationId);
        throw detailError;
      }
    }

    // Đồng bộ sang Google Sheets chạy ngầm (không await để tránh block 5 giây)
    syncToGoogleSheets('create', cancellationId, body).catch(e => console.error(e));

    return NextResponse.json({ success: true, id: cancellationId });
  } catch (error: any) {
    console.error('Lưu phiếu hủy lỗi:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, month, user_id, brand_id, owner_id, cp_id, note, details } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID bản ghi cần cập nhật' }, { status: 400 });
    }

    // 0. Lấy bản ghi hiện tại để kiểm tra updated_at
    const { data: currentData, error: fetchError } = await supabase
      .from('cancellations')
      .select('updated_at')
      .eq('id', id)
      .single();

    if (fetchError || !currentData) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi hoặc lỗi kết nối' }, { status: 404 });
    }

    // Nếu client gửi lên updated_at, và nó khác với trong DB -> có người khác đã sửa
    if (body.updated_at && currentData.updated_at && body.updated_at !== currentData.updated_at) {
      return NextResponse.json({ 
        error: 'Bản ghi này vừa được cập nhật bởi một người khác. Vui lòng làm mới trang (F5) để lấy dữ liệu mới nhất trước khi lưu!' 
      }, { status: 409 });
    }

    // Fetch user name
    const { data: user } = await supabase.from('users').select('name').eq('id', user_id).single();
    const user_name = user?.name || '';

    // 1. Cập nhật bảng cancellations
    const { error: cancelError } = await supabase
      .from('cancellations')
      .update({
        month,
        user_id,
        user_name,
        brand_id,
        owner_id,
        cp_id,
        note,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (cancelError) throw cancelError;

    // 2. Xóa toàn bộ chi tiết cũ trong cancellation_details
    const { error: deleteError } = await supabase
      .from('cancellation_details')
      .delete()
      .eq('cancellation_id', id);

    if (deleteError) throw deleteError;

    // 3. Chuẩn bị hàng chi tiết mới
    const detailRows: any[] = [];
    details.forEach((op: any) => {
      op.provider_ids.forEach((provId: string) => {
        detailRows.push({
          cancellation_id: id,
          operator_id: op.operator_id,
          provider_id: provId
        });
      });
    });

    // 4. Chèn chi tiết mới
    if (detailRows.length > 0) {
      const { error: detailError } = await supabase
        .from('cancellation_details')
        .insert(detailRows);
        
      if (detailError) throw detailError;
    }

    // Gắn thêm user_name vào body để đồng bộ Sheets
    const payloadForSheets = { ...body, user_name };
    syncToGoogleSheets('update', id, payloadForSheets).catch(e => console.error(e));

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Cập nhật phiếu hủy lỗi:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function syncToGoogleSheets(action: 'create' | 'update', recordId: string, body: any) {
  const syncUrl = process.env.GOOGLE_SCRIPT_SYNC_URL;
  if (!syncUrl) {
    console.warn('CẢNH BÁO: GOOGLE_SCRIPT_SYNC_URL chưa được cấu hình, bỏ qua đồng bộ sang Google Sheets');
    return;
  }

  // Định dạng lại ngày để gửi sang Google Sheets: YYYY-MM-DD
  const today = new Date();
  const enterDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  // Chuyển đổi dữ liệu sang định dạng Apps Script mong đợi
  const payload = {
    recordId: recordId,
    user: body.user_name || body.user_id, // Lấy tên người dùng thay vì ID
    enterDate: enterDate,
    owner: body.owner_id || '',
    brandId: body.brand_id,
    cp: body.cp_id || '',
    month: body.month,
    note: body.note || '',
    details: (body.details || []).map((op: any) => ({
      operatorId: op.operator_id,
      providerIds: op.provider_ids || []
    }))
  };

  try {
    console.log(`Bắt đầu đồng bộ sang Google Sheets (${action}):`, recordId);
    const res = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        recordId,
        payload
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log(`Kết quả đồng bộ Google Sheets (${action}):`, data);
  } catch (err: any) {
    console.error(`Lỗi đồng bộ Google Sheets (${action}) cho bản ghi ${recordId}:`, err);
  }
}
