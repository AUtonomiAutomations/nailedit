// GET /api/quote/<token>/pdf → renders /quote/<token>?print=1 in headless Chromium and returns an A4 PDF.
// The page itself fetches the quote via the public RPC, so this route needs no DB access of its own.
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const runtime = 'nodejs';
export const maxDuration = 30;

const LOCAL_CHROME = process.platform === 'darwin'
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  : '/usr/bin/google-chrome';

export async function GET(req: Request, { params }: { params: { token: string } }) {
  if (!/^[a-z0-9]{20,80}$/i.test(params.token)) return new Response('Not found', { status: 404 });
  const origin = new URL(req.url).origin;
  const onVercel = !!process.env.VERCEL;
  const browser = await puppeteer.launch({
    args: onVercel ? chromium.args : ['--no-sandbox'],
    executablePath: onVercel ? await chromium.executablePath() : LOCAL_CHROME,
    headless: true,
    defaultViewport: { width: 794, height: 1123 },
  });
  try {
    const page = await browser.newPage();
    await page.goto(`${origin}/quote/${params.token}?print=1`, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.waitForSelector('body[data-ready="1"], .empty', { timeout: 15000 });
    if (await page.$('.empty')) return new Response('Quote not found', { status: 404 });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    const no = await page.$eval('.qd', (el) => el.getAttribute('aria-label') || 'quote').catch(() => 'quote');
    const filename = `${no.replace(/[^\d-]/g, '') || 'quote'}.pdf`;
    return new Response(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quote-${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } finally {
    await browser.close();
  }
}
