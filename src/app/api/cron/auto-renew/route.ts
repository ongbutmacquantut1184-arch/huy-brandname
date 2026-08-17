import { NextResponse } from 'next/server';
import { processAutoRenewContracts } from '@/lib/cx-actions';

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (!cronSecret) {
      console.error('[CRON] CRON_SECRET is not configured. Refusing to run.');
      return NextResponse.json({ error: 'Cron secret is not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting auto-renew scan...');
    const result = await processAutoRenewContracts();

    if (!result.success) {
      console.error('[CRON] Error:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    console.log(`[CRON] Finished. ${result.message}`);
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
