import 'server-only';

const DEFAULT_FROM = 'Aevia <noreply@aevia.live>';
const DEFAULT_REPLY_TO = 'support@lycheecorp.com';

type Email = { to: string; subject: string; html: string; text: string };

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);

// Settings use || rather than ?? on purpose: a blank line such as `EMAIL_FROM=` in .env is an empty string, and must fall back to the default.

/** Sends one email through Resend. Throws if Resend refuses it, so callers can log the reason. */
export async function sendEmail({ to, subject, html, text }: Email) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  const base = process.env.RESEND_API_URL || 'https://api.resend.com';

  const response = await fetch(`${base}/emails`, {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to: [to],
      reply_to: process.env.EMAIL_REPLY_TO || DEFAULT_REPLY_TO,
      subject,
      html,
      text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Resend rejected the email (${response.status}): ${(await response.text()).slice(0, 300)}`);
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Sends the password-reset link. Never throws: a failed email is logged, and the user can ask again. */
export async function sendPasswordResetEmail({ to, name, url }: { to: string; name: string; url: string }) {
  if (!emailConfigured()) {
    // Without a key, show the link while developing. In production it is a live credential, so never log it.
    if (process.env.NODE_ENV !== 'production') console.log(`[email] Password reset link for ${to}: ${url}`);
    else console.error('[email] Password reset requested but RESEND_API_KEY is not set, so nothing was sent.');
    return;
  }

  const first = escapeHtml(name.trim().split(/\s+/)[0] || 'there');
  const link = escapeHtml(url);
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f4f2ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1816;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:36px 32px;">
      <p style="margin:0 0 24px;font-size:20px;font-weight:600;letter-spacing:-0.02em;">aevia</p>
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;letter-spacing:-0.02em;">Reset your password</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4a4641;">Hi ${first}, we got a request to reset the password for your Aevia account. Choose a new one with the button below. The link works for 1 hour.</p>
      <p style="margin:0 0 28px;"><a href="${link}" style="display:inline-block;background:#f5c518;color:#14110d;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:8px;">Choose a new password</a></p>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b665f;">If you did not ask for this, you can ignore this email. Your password will not change.</p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#6b665f;">Button not working? Paste this address into your browser:<br><span style="word-break:break-all;">${link}</span></p>
    </div>
    <p style="max-width:480px;margin:16px auto 0;font-size:12px;color:#8a857d;text-align:center;">Aevia &middot; aevia.live</p>
  </body>
</html>`;
  const text = `Hi ${name.trim().split(/\s+/)[0] || 'there'},

We got a request to reset the password for your Aevia account. Choose a new one here (the link works for 1 hour):

${url}

If you did not ask for this, you can ignore this email. Your password will not change.

Aevia - aevia.live`;

  try {
    await sendEmail({ to, subject: 'Reset your Aevia password', html, text });
  } catch (error) {
    console.error('[email] Could not send the password reset email', error);
  }
}
