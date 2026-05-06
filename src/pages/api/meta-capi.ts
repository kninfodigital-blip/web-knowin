export const prerender = false;

import type { APIRoute } from 'astro';

interface RequestBody {
  event_name: string;
  event_id: string;
  event_source_url: string;
  user_data?: {
    email?: string;
    phone?: string;
    fbp?: string;
    fbc?: string;
  };
  custom_data?: Record<string, unknown>;
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const POST: APIRoute = async ({ request }) => {
  const pixelId = import.meta.env.META_PIXEL_ID;
  const token = import.meta.env.META_CAPI_TOKEN;

  if (!pixelId || !token) {
    return new Response(
      JSON.stringify({ error: 'Meta CAPI not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { event_name, event_id, event_source_url, user_data, custom_data } = body;

  if (!event_name || !event_id) {
    return new Response(
      JSON.stringify({ error: 'event_name and event_id are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Build user_data with hashed PII
  const serverUserData: Record<string, string> = {};
  if (user_data?.email) serverUserData.em = await sha256(user_data.email);
  if (user_data?.phone) serverUserData.ph = await sha256(user_data.phone);
  if (user_data?.fbp) serverUserData.fbp = user_data.fbp;
  if (user_data?.fbc) serverUserData.fbc = user_data.fbc;

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  const clientUa = request.headers.get('user-agent') ?? '';

  if (clientIp) serverUserData.client_ip_address = clientIp;
  if (clientUa) serverUserData.client_user_agent = clientUa;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id,
        event_source_url,
        action_source: 'website',
        user_data: serverUserData,
        ...(custom_data ? { custom_data } : {}),
      },
    ],
  };

  const testCode = process.env.META_TEST_EVENT_CODE;
  if (testCode) {
    payload.test_event_code = testCode;
  }

  const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`;

  try {
    const metaRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const metaJson = await metaRes.json();
    return new Response(JSON.stringify(metaJson), {
      status: metaRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to reach Meta API' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
