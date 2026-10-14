import * as SecureStore from 'expo-secure-store';

export type Config = { apiUrl: string; managerUrl: string };
export type User = { employee: string; username?: string; email?: string; native?: boolean; permissions: string[] };
export type Session = { token: string; user: User };
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
export const vault = {
  async config(): Promise<Config | null> { const v = await SecureStore.getItemAsync('config'); return v ? JSON.parse(v) : null; },
  async session(): Promise<Session | null> { const v = await SecureStore.getItemAsync('session'); return v ? JSON.parse(v) : null; },
  saveConfig: (v: Config) => SecureStore.setItemAsync('config', JSON.stringify(v), options),
  saveSession: (v: Session) => SecureStore.setItemAsync('session', JSON.stringify(v), options),
  clear: () => SecureStore.deleteItemAsync('session'),
};
export function validateEndpoint(url: string) {
  return /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(url.trim());
}
export async function request(config: Config, body: Record<string, unknown>): Promise<any> {
  if (!validateEndpoint(config.apiUrl)) throw new Error('أدخل رابط نشر Apps Script الصحيح أولًا.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: 'mobile=1&data=' + encodeURIComponent(JSON.stringify({ ...body, v: 1 })), signal: controller.signal,
    });
    if (!response.ok) throw new Error('تعذر الاتصال بالخادم. حاول لاحقًا.');
    const raw = await response.text();
    let result; try { result = JSON.parse(raw); } catch { throw new Error('الخادم لم يُجهّز للتطبيق بعد، أو رابط النشر غير صحيح.'); }
    if (!result.ok) throw new Error(result.error || 'تعذر تنفيذ الطلب.');
    if (!Object.prototype.hasOwnProperty.call(result, 'data')) throw new Error('يلزم نشر تحديث ربط التطبيق على الخادم.');
    return result.data;
  } catch (e: any) {
    if (e.name === 'AbortError') throw new Error('انتهت مهلة الاتصال. إن كنت تحفظ تعديلًا، حدّث السجل للتحقق قبل إعادة الحفظ.');
    throw e;
  } finally { clearTimeout(timer); }
}
export const rpc = (config: Config, session: Session, method: string, ...args: unknown[]) => request(config, { action: 'rpc', token: session.token, method, args });
