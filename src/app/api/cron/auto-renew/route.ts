import { NextResponse } from 'next/server';
import { processAutoRenewContracts } from '@/lib/cx-actions';

// Endpoint này được gọi bởi dịch vụ Cron (ví dụ Vercel Cron hoặc một scheduler external)
// Phương thức GET để dễ dàng gọi tự động
export async function GET(request: Request) {
  try {
    // Kiểm tra bảo mật
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET) {
      console.warn('[CRON] Cảnh báo: CRON_SECRET chưa được cấu hình!');
    } else if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[CRON] Bắt đầu quét gia hạn tự động...');
    const result = await processAutoRenewContracts();

    if (!result.success) {
      console.error('[CRON] Lỗi:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    console.log(`[CRON] Hoàn tất. ${result.message}`);
    return NextResponse.json({
      success: true,
      message: result.message,
      processedCount: result.processedCount
    });

  } catch (error: any) {
    console.error('[CRON] Exception:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
