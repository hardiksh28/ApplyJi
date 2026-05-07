import { google } from 'googleapis';

export async function getGmailClient(refreshToken: string, onTokenUpdate?: (tokens: any) => void) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  // Automatically listen for token refreshes and notify the caller
  oauth2Client.on('tokens', (tokens) => {
    if (onTokenUpdate) {
      onTokenUpdate(tokens);
    }
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export async function fetchEmails(gmail: any, query: string = 'newer_than:30d') {
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

  if (payload.parts) {
    // Basic part traversal for text/plain
    const part = payload.parts.find((p: any) => p.mimeType === 'text/plain') || payload.parts[0];
    if (part.body.data) {
      body = Buffer.from(part.body.data, 'base64').toString();
    }
  } else if (payload.body.data) {
    body = Buffer.from(payload.body.data, 'base64').toString();
  }

  const subjectHeader = payload.headers?.find((h: any) => h.name.toLowerCase() === 'subject');
  const subject = subjectHeader ? subjectHeader.value : '';

  return {
    id: messageId,
    threadId: res.data.threadId,
    snippet: res.data.snippet,
    subject: subject,
    body: body,
    date: new Date(parseInt(res.data.internalDate)).toISOString()
  };
}
