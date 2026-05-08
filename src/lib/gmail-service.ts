import { google } from 'googleapis';

export async function getGmailClient(refreshToken: string, onTokenRefresh?: (tokens: any) => Promise<void>) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  oauth2Client.on('tokens', (tokens) => {
    if (onTokenRefresh) {
      onTokenRefresh(tokens).catch(err => console.error('Error in onTokenRefresh:', err));
    }
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export async function fetchEmails(gmail: any, query: string) {
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 20
  });

  return res.data.messages || [];
}

export async function getEmailContent(gmail: any, messageId: string) {
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full'
  });

  const payload = res.data.payload;
  let body = '';
  let from = '';
  let subject = '';

  const headers = payload.headers || [];
  const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from');
  const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject');

  if (fromHeader) from = fromHeader.value;
  if (subjectHeader) subject = subjectHeader.value;

  function extractBody(part: any): string {
    if (part.body && part.body.data) {
      return Buffer.from(part.body.data, 'base64').toString();
    }
    if (part.parts) {
      for (const p of part.parts) {
        const result = extractBody(p);
        if (result) return result;
      }
    }
    return '';
  }

  // Look for text/plain first
  let textPart = null;
  let htmlPart = null;

  function findParts(part: any) {
    if (part.mimeType === 'text/plain') textPart = part;
    if (part.mimeType === 'text/html') htmlPart = part;
    if (part.parts) part.parts.forEach(findParts);
  }

  findParts(payload);

  if (textPart) {
    body = extractBody(textPart);
  } else if (htmlPart) {
    body = extractBody(htmlPart);
    // Strip HTML tags
    body = body.replace(/<[^>]*>/g, ' ');
    // Decode common entities
    body = body.replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"');
  } else {
    body = extractBody(payload);
  }

  return {
    id: messageId,
    threadId: res.data.threadId,
    subject,
    from,
    date: new Date(parseInt(res.data.internalDate)).toISOString(),
    snippet: res.data.snippet,
    body: body.trim()
  };
}
