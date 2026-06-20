import type { NextApiRequest, NextApiResponse } from "next";

interface InvoicePayload {
  email: string;
  name: string;
  plan: string;
  amount: number;
  invoice: string;
  purchaseDate: string;
}

// Build a clean HTML invoice email
function buildHtml(payload: InvoicePayload): string {
  const { name, plan, amount, invoice, purchaseDate } = payload;
  const formattedDate = new Date(purchaseDate).toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short"
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>YourTube Invoice</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#e53e3e; padding:24px 32px;">
              <h1 style="margin:0; color:#ffffff; font-size:22px;">YourTube</h1>
              <p style="margin:4px 0 0; color:#fecaca; font-size:14px;">Payment Invoice</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px; font-size:16px; color:#1a1a1a;">Hi ${name},</p>
              <p style="margin:0 0 24px; font-size:14px; color:#555;">
                Thank you for subscribing to the <strong>${plan}</strong> plan on YourTube.
                Your payment was processed successfully.
              </p>

              <!-- Invoice table -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #e5e7eb; border-radius:6px; overflow:hidden;">
                <tr style="background:#f9fafb;">
                  <td style="padding:10px 16px; font-size:13px; color:#6b7280; font-weight:600;">
                    INVOICE NUMBER
                  </td>
                  <td style="padding:10px 16px; font-size:13px; color:#1a1a1a; text-align:right;">
                    ${invoice}
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 16px; font-size:13px; color:#6b7280; font-weight:600;
                    border-top:1px solid #e5e7eb;">
                    DATE
                  </td>
                  <td style="padding:10px 16px; font-size:13px; color:#1a1a1a; text-align:right;
                    border-top:1px solid #e5e7eb;">
                    ${formattedDate}
                  </td>
                </tr>
                <tr style="background:#f9fafb;">
                  <td style="padding:10px 16px; font-size:13px; color:#6b7280; font-weight:600;
                    border-top:1px solid #e5e7eb;">
                    PLAN
                  </td>
                  <td style="padding:10px 16px; font-size:13px; color:#1a1a1a; text-align:right;
                    border-top:1px solid #e5e7eb;">
                    ${plan}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; font-size:15px; font-weight:700; color:#1a1a1a;
                    border-top:2px solid #e5e7eb;">
                    TOTAL PAID
                  </td>
                  <td style="padding:12px 16px; font-size:15px; font-weight:700; color:#e53e3e;
                    text-align:right; border-top:2px solid #e5e7eb;">
                    ₹${amount}
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0; font-size:13px; color:#888;">
                This is an automated receipt from YourTube. Please keep it for your records.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:16px 32px; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#aaa; text-align:center;">
                &copy; 2026 YourTube · yourtube.app
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = req.body as InvoicePayload;
  const { email, name, plan, amount, invoice, purchaseDate } = payload;

  // Validate required fields
  if (!email || !name || !plan || amount === undefined || !invoice || !purchaseDate) {
    return res.status(400).json({ error: "Missing required invoice fields." });
  }

  const resendKey = process.env.RESEND_API_KEY;

  // --- If Resend API key is configured, send a real email ---
  if (resendKey && resendKey !== "re_xxxxxxxxxx") {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`
        },
        body: JSON.stringify({
          from: "YourTube <invoice@yourtube.app>",
          to: [email],
          subject: `Your YourTube Invoice – ${invoice}`,
          html: buildHtml(payload)
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Resend API error:", errorBody);
        return res.status(502).json({ error: "Email delivery failed.", detail: errorBody });
      }

      const data = await response.json();
      return res.status(200).json({ ok: true, resendId: data.id });
    } catch (error) {
      console.error("Invoice email error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  // --- No Resend key: simulate delivery and log invoice details ---
  console.info("📧 Simulated invoice email (no RESEND_API_KEY configured):", {
    to: email,
    name,
    plan,
    amount: `₹${amount}`,
    invoice,
    purchaseDate
  });

  return res.status(200).json({ ok: true, simulated: true });
}
