import { createHash } from 'crypto';

function sha256(value) {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;

  if (!pixelId || !token) {
    return res.status(500).json({ error: 'Meta CAPI not configured' });
  }

  const { event_name, event_id, event_source_url, user_data, custom_data } = req.body;

  if (!event_name || !event_id) {
    return res.status(400).json({ error: 'event_name and event_id are required' });
  }

  const serverUserData = {};
  if (user_data?.email) serverUserData.em = sha256(user_data.email);
  if (user_data?.phone) serverUserData.ph = sha256(user_data.phone);
  if (user_data?.fbp) serverUserData.fbp = user_data.fbp;
  if (user_data?.fbc) serverUserData.fbc = user_data.fbc;

  const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const clientUa = req.headers['user-agent'] || '';

  if (clientIp) serverUserData.client_ip_address = clientIp;
  if (clientUa) serverUserData.client_user_agent = clientUa;

  const payload = {
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
  if (testCode) payload.test_event_code = testCode;

  const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${token}`;

  try {
    const metaRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const metaJson = await metaRes.json();
    return res.status(metaRes.status).json(metaJson);
  } catch {
    return res.status(502).json({ error: 'Failed to reach Meta API' });
  }
}
