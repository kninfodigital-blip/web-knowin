declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

interface UserData {
  email?: string;
  phone?: string;
}

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1];
}

export async function track(
  eventName: string,
  params: Record<string, unknown> = {},
  userData?: UserData,
): Promise<void> {
  const event_id = crypto.randomUUID();

  // Client-side pixel
  window.fbq?.('track', eventName, params, { eventID: event_id });

  // Server-side CAPI
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');

  try {
    await fetch('/api/meta-capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        event_id,
        event_source_url: location.href,
        user_data: { ...userData, fbp, fbc },
        custom_data: params,
      }),
    });
  } catch {
    // Silently fail — tracking should never break UX
  }
}
