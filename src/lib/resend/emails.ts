import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_EMAIL = "VST Wedding <zgloszenia@vstwedding.pl>";

function getTeamEmails(): string[] {
  const emails: string[] = [];
  if (process.env.TEAM_EMAIL_MAREK) emails.push(process.env.TEAM_EMAIL_MAREK);
  if (process.env.TEAM_EMAIL_MONTAZYSTA)
    emails.push(process.env.TEAM_EMAIL_MONTAZYSTA);
  // Usuń duplikaty
  return [...new Set(emails)];
}

// Wspólny wrapper HTML maila — dark theme VST
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0; padding:0; background-color:#0a0a0a; font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px; margin:0 auto; padding:40px 24px;">
    <div style="text-align:center; margin-bottom:32px;">
      <span style="font-size:24px; font-weight:600; color:#c9a84c; letter-spacing:2px;">
        VST WEDDING
      </span>
    </div>
    <div style="background-color:#161616; border:1px solid #2a2a2a; border-radius:4px; padding:32px 24px;">
      ${content}
    </div>
    <div style="text-align:center; margin-top:24px;">
      <span style="color:#555555; font-size:12px;">vstwedding.pl</span>
    </div>
  </div>
</body>
</html>`;
}

function goldButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block; background-color:#c9a84c; color:#0a0a0a; padding:12px 32px; text-decoration:none; border-radius:2px; font-weight:600; font-size:14px; margin-top:16px;">${text}</a>`;
}

// Mail 1: Potwierdzenie zgłoszenia → klient
export async function sendTicketConfirmation(
  clientEmail: string,
  accessToken: string
) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/moje-zgloszenie/${accessToken}`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: clientEmail,
    subject: "Twoje zgłoszenie zostało przyjęte — VST Wedding",
    html: emailWrapper(`
      <p style="color:#f0ead6; font-size:16px; margin:0 0 16px;">
        Dziękujemy za zgłoszenie. Odezwiemy się wkrótce.
      </p>
      <p style="color:#888888; font-size:14px; margin:0 0 24px;">
        Możesz sprawdzić status swojego zgłoszenia klikając poniższy przycisk.
      </p>
      <div style="text-align:center;">
        ${goldButton("Sprawdź status zgłoszenia", url)}
      </div>
    `),
  });
}

// Mail 2: Nowe zgłoszenie → team
export async function sendNewTicketNotification(ticket: {
  id: string;
  clientName: string;
  weddingDate: string;
  description: string;
  hasFiles: boolean;
  hasAudio: boolean;
}) {
  const teamEmails = getTeamEmails();
  if (teamEmails.length === 0) return;

  const panelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/panel/${ticket.id}`;
  const preview =
    ticket.description.length > 200
      ? ticket.description.slice(0, 200) + "…"
      : ticket.description;

  const attachmentInfo = [
    ticket.hasFiles ? "📎 Załączniki" : "",
    ticket.hasAudio ? "🎙️ Nagranie głosowe" : "",
  ]
    .filter(Boolean)
    .join(" &nbsp; ");

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: teamEmails,
    subject: `Nowe zgłoszenie — ${ticket.clientName}, ${ticket.weddingDate}`,
    html: emailWrapper(`
      <p style="color:#c9a84c; font-size:14px; font-weight:600; margin:0 0 4px;">NOWE ZGŁOSZENIE</p>
      <p style="color:#f0ead6; font-size:18px; margin:0 0 4px;">${ticket.clientName}</p>
      <p style="color:#888888; font-size:14px; margin:0 0 16px;">Data ślubu: ${ticket.weddingDate}</p>
      <p style="color:#f0ead6; font-size:14px; margin:0 0 12px;">${preview}</p>
      ${attachmentInfo ? `<p style="color:#888888; font-size:13px; margin:0 0 16px;">${attachmentInfo}</p>` : ""}
      <div style="text-align:center;">
        ${goldButton("Otwórz w panelu", panelUrl)}
      </div>
    `),
  });
}

// Mail 3: Nowa wiadomość od klienta → team
export async function sendClientMessageNotification(ticket: {
  id: string;
  clientName: string;
  messageContent: string;
}) {
  const teamEmails = getTeamEmails();
  if (teamEmails.length === 0) return;

  const panelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/panel/${ticket.id}`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: teamEmails,
    subject: `Odpowiedź od klienta — ${ticket.clientName}`,
    html: emailWrapper(`
      <p style="color:#c9a84c; font-size:14px; font-weight:600; margin:0 0 4px;">NOWA WIADOMOŚĆ OD KLIENTA</p>
      <p style="color:#f0ead6; font-size:16px; margin:0 0 16px;">${ticket.clientName}</p>
      <p style="color:#f0ead6; font-size:14px; margin:0 0 24px;">${ticket.messageContent}</p>
      <div style="text-align:center;">
        ${goldButton("Otwórz w panelu", panelUrl)}
      </div>
    `),
  });
}

// Mail 4: Odpowiedź studia → klient
export async function sendTeamReplyNotification(
  clientEmail: string,
  accessToken: string,
  replyPreview: string
) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/moje-zgloszenie/${accessToken}`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: clientEmail,
    subject: "Odpowiedź od VST Wedding",
    html: emailWrapper(`
      <p style="color:#f0ead6; font-size:16px; margin:0 0 16px;">
        Studio odpowiedziało na Twoje zgłoszenie.
      </p>
      <p style="color:#888888; font-size:14px; margin:0 0 24px;">
        „${replyPreview}"
      </p>
      <div style="text-align:center;">
        ${goldButton("Zobacz odpowiedź", url)}
      </div>
    `),
  });
}

// Mail 5: Weekly digest → Marek
export async function sendWeeklyDigest(stats: {
  newCount: number;
  inProgressCount: number;
  activePairs: { name: string; date: string }[];
}) {
  const marekEmail = process.env.TEAM_EMAIL_MAREK;
  if (!marekEmail) return;

  const panelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/panel`;

  const pairsList = stats.activePairs
    .map(
      (p) =>
        `<li style="color:#f0ead6; font-size:14px; margin-bottom:6px;">${p.name} — <span style="color:#888888;">${p.date}</span></li>`
    )
    .join("");

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: marekEmail,
    subject: "Podsumowanie tygodnia — zgłoszenia VST",
    html: emailWrapper(`
      <p style="color:#c9a84c; font-size:14px; font-weight:600; margin:0 0 16px;">PODSUMOWANIE TYGODNIA</p>
      <div style="display:flex; gap:24px; margin-bottom:20px;">
        <div>
          <p style="color:#c9a84c; font-size:28px; font-weight:700; margin:0;">${stats.newCount}</p>
          <p style="color:#888888; font-size:12px; margin:0;">nowych</p>
        </div>
        <div>
          <p style="color:#e2c97e; font-size:28px; font-weight:700; margin:0;">${stats.inProgressCount}</p>
          <p style="color:#888888; font-size:12px; margin:0;">w trakcie</p>
        </div>
      </div>
      ${
        stats.activePairs.length > 0
          ? `<p style="color:#888888; font-size:13px; margin:0 0 8px;">Aktywne pary:</p><ul style="padding-left:16px; margin:0 0 20px;">${pairsList}</ul>`
          : ""
      }
      <div style="text-align:center;">
        ${goldButton("Otwórz panel", panelUrl)}
      </div>
    `),
  });
}
