import { json, ProviderError, request, statusCode, type Fetch } from './http';

/**
 * 2Factor.in SMS OTP adapter (server only). Uses 2Factor's own OTP lifecycle, as documented in the 2Factor API
 * reference (documenter.getpostman.com/view/301893/TWDamFGh):
 *   send   GET https://2factor.in/API/V1/{api_key}/SMS/{phone}/AUTOGEN/{otp_template_name}
 *          → { "Status": "Success", "Details": "<otp session id>" }   (AUTOGEN does not return the OTP)
 *   verify GET https://2factor.in/API/V1/{api_key}/SMS/VERIFY/{otp_session_id}/{otp_entered_by_user}
 *          → Details "OTP Matched" | "OTP Mismatch" | "OTP Expired"
 * 2Factor generates the code; INRGIFT never sees, stores or logs it. The API key sits in the URL path, so URLs are
 * never logged or put into errors (see ./http.ts).
 */
export type OtpCheck = 'matched' | 'mismatch' | 'expired';
export interface SmsOtpProvider {
  sendOtp(phoneE164: string): Promise<{ sessionId: string }>;
  verifyOtp(sessionId: string, code: string): Promise<OtpCheck>;
}
const NAME = '2factor';
const BASE = 'https://2factor.in/API/V1';

function check(body: unknown, status: number): { status: string; details: string } {
  const b = body as { Status?: unknown; Details?: unknown } | null;
  if (!b || typeof b.Status !== 'string' || typeof b.Details !== 'string') throw new ProviderError(NAME, 'MALFORMED', status);
  return { status: b.Status, details: b.Details };
}
/** 2Factor reports account problems in `Details` (sometimes with HTTP 200). */
function accountError(details: string, status: number): ProviderError | null {
  const d = details.toLowerCase();
  if (d.includes('api key') || d.includes('apikey') || d.includes('unauthori')) return new ProviderError(NAME, 'INVALID_KEY', status);
  if (d.includes('balance') || d.includes('credit') || d.includes('quota')) return new ProviderError(NAME, 'QUOTA', status);
  if (d.includes('limit') || d.includes('too many')) return new ProviderError(NAME, 'RATE_LIMITED', status);
  return null;
}

export function twoFactor(opts: { apiKey: string; template?: string; fetchImpl?: Fetch; timeoutMs?: number }): SmsOtpProvider {
  if (!opts.apiKey) throw new ProviderError(NAME, 'NOT_CONFIGURED');
  const key = encodeURIComponent(opts.apiKey);
  const get = (path: string) => request(NAME, `${BASE}/${key}/SMS/${path}`, { method: 'GET', fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs });
  return {
    async sendOtp(phoneE164) {
      if (!/^\+[1-9]\d{7,14}$/.test(phoneE164)) throw new ProviderError(NAME, 'REJECTED');
      const res = await get(`${encodeURIComponent(phoneE164)}/AUTOGEN${opts.template ? `/${encodeURIComponent(opts.template)}` : ''}`);
      const body = check(await json(NAME, res), res.status);
      if (body.status === 'Success' && body.details) return { sessionId: body.details };
      throw accountError(body.details, res.status) ?? new ProviderError(NAME, statusCode(res.status) ?? 'REJECTED', res.status);
    },
    async verifyOtp(sessionId, code) {
      if (!/^\d{4,8}$/.test(code) || !sessionId) return 'mismatch';
      const res = await get(`VERIFY/${encodeURIComponent(sessionId)}/${encodeURIComponent(code)}`);
      const body = check(await json(NAME, res), res.status);
      const d = body.details.toLowerCase();
      if (d.includes('otp matched')) return 'matched';
      if (d.includes('expired')) return 'expired';
      if (d.includes('mismatch') || d.includes('invalid otp')) return 'mismatch';
      throw accountError(body.details, res.status) ?? new ProviderError(NAME, statusCode(res.status) ?? 'REJECTED', res.status);
    },
  };
}
