import { getSupabaseClient, getStoredUser } from './supabase';

export interface ActivityLogPayload {
  acao: string;
  detalhes?: Record<string, any>;
  userId?: string;
  userEmail?: string;
}

/**
 * Extracts a human-readable device and browser summary from navigator.
 */
function getDeviceInfo(): string {
  if (typeof window === 'undefined' || !navigator) return 'Desconhecido';

  const ua = navigator.userAgent;
  let browser = 'Navegador';
  let os = 'SO';

  // Detect OS
  if (/android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // Detect Browser
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/samsungbrowser/i.test(ua)) browser = 'Samsung Browser';

  const screenRes = typeof window !== 'undefined' ? ` (${window.screen.width}x${window.screen.height})` : '';
  return `${browser} no ${os}${screenRes}`;
}

/**
 * Silently records user activity into Supabase's `logs_atividades` table.
 * Restricted to database storage only — never displayed to standard users.
 */
export function logActivity(
  acao: string,
  detalhes: Record<string, any> = {},
  userOverride?: { id?: string; email?: string }
): void {
  // Fire and forget in the background
  try {
    const client = getSupabaseClient();
    const currentUser = userOverride || getStoredUser();
    const dispositivo = getDeviceInfo();
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';

    const payload = {
      user_id: currentUser?.id || 'anonimo',
      user_email: currentUser?.email || 'anonimo',
      acao,
      detalhes: detalhes || {},
      dispositivo,
      url: currentUrl,
      created_at: new Date().toISOString(),
    };

    if (client) {
      void (async () => {
        try {
          const { error } = await client.from('logs_atividades').insert([payload]);
          if (error) {
            console.debug('Log de atividade não gravado:', error.message);
          }
        } catch {
          // Silent catch
        }
      })();
    }
  } catch {
    // Fail-safe: Never disrupt user experience
  }
}
