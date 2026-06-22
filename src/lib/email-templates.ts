function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>PackMind</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#111111;border:1px solid #222;border-radius:16px;overflow:hidden;">
<!-- Header -->
<tr><td style="padding:28px 32px 20px;border-bottom:1px solid #222;">
  <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">PackMind</span>
</td></tr>
<!-- Content -->
<tr><td style="padding:32px;">
${content}
</td></tr>
<!-- Footer -->
<tr><td style="padding:20px 32px;border-top:1px solid #222;">
  <p style="margin:0;font-size:12px;color:#555;line-height:1.5;">
    You're receiving this because you created a trip on PackMind.<br/>
    &copy; ${new Date().getFullYear()} PackMind
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function tripConfirmationEmail({
  destination,
  departureDate,
  returnDate,
}: {
  destination: string;
  departureDate: string;
  returnDate: string;
}) {
  const subject = `Your trip to ${destination} is set!`;

  const html = layout(`
  <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">
    You're going to ${destination}!
  </h1>
  <p style="margin:0 0 24px;font-size:15px;color:#999;line-height:1.6;">
    Your trip has been created. Here's what's next.
  </p>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;margin-bottom:24px;">
    <tr>
      <td style="padding:16px 20px;border-bottom:1px solid #2a2a2a;">
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#666;">Destination</span><br/>
        <span style="font-size:16px;font-weight:700;color:#fff;">${destination}</span>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 20px;">
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#666;">Dates</span><br/>
        <span style="font-size:16px;font-weight:700;color:#fff;">${departureDate} &mdash; ${returnDate}</span>
      </td>
    </tr>
  </table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr>
      <td style="padding:12px 16px;background-color:rgba(45,212,191,0.08);border:1px solid rgba(45,212,191,0.2);border-radius:10px;">
        <p style="margin:0;font-size:14px;color:#5eead4;line-height:1.5;">
          &#9889; Your AI packing list is ready to generate &mdash; head to your dashboard to get started.
        </p>
      </td>
    </tr>
  </table>

  <p style="margin:0 0 4px;font-size:14px;color:#888;line-height:1.5;">
    We'll send you packing reminders starting <strong style="color:#ccc;">3 days before departure</strong> with your live packing progress so nothing gets left behind.
  </p>
`);

  return { subject, html };
}

export function packingReminderEmail({
  destination,
  daysLeft,
  packed,
  total,
}: {
  destination: string;
  daysLeft: number;
  packed: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((packed / total) * 100) : 0;
  const itemsLeft = total - packed;
  const allPacked = total > 0 && packed === total;

  const subject = allPacked
    ? `You're 100% packed for ${destination}!`
    : `${daysLeft} day${daysLeft === 1 ? "" : "s"} until ${destination} — you're ${pct}% packed`;

  const headline = allPacked
    ? "You're all packed!"
    : daysLeft === 0
      ? `Today's the day — ${destination}!`
      : daysLeft === 1
        ? `Tomorrow you're off to ${destination}!`
        : `${daysLeft} days until ${destination}`;

  const statusColor = allPacked ? "#5eead4" : pct >= 70 ? "#facc15" : "#f87171";
  const barColor = allPacked ? "#2dd4bf" : pct >= 70 ? "#eab308" : "#ef4444";

  const encouragement = allPacked
    ? "Everything's checked off — have an amazing trip! 🎉"
    : itemsLeft <= 3
      ? "Almost there — just a few more items to check off!"
      : `You have ${itemsLeft} item${itemsLeft === 1 ? "" : "s"} left to pack. You've got this!`;

  const html = layout(`
  <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">
    ${headline}
  </h1>
  <p style="margin:0 0 24px;font-size:15px;color:#999;line-height:1.6;">
    Here's your packing status for <strong style="color:#ccc;">${destination}</strong>.
  </p>

  <!-- Progress card -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;margin-bottom:24px;">
    <tr>
      <td style="padding:20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:42px;font-weight:800;color:${statusColor};line-height:1;">
              ${pct}%
            </td>
            <td align="right" style="font-size:14px;color:#888;vertical-align:bottom;">
              ${packed} of ${total} items packed
            </td>
          </tr>
        </table>
        <!-- Progress bar -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
          <tr>
            <td style="background-color:#2a2a2a;border-radius:6px;height:10px;padding:0;">
              <div style="background-color:${barColor};width:${pct}%;height:10px;border-radius:6px;min-width:${pct > 0 ? "10px" : "0"};"></div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <p style="margin:0;font-size:15px;color:#aaa;line-height:1.6;">
    ${encouragement}
  </p>
`);

  return { subject, html };
}
