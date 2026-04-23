import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/meetings.space.created'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

interface Credentials {
  installed?: {
    client_id: string;
    client_secret: string;
  };
  web?: {
    client_id: string;
    client_secret: string;
  };
}

interface StoredToken {
  type: string;
  client_id: string;
  client_secret: string;
  refresh_token: string;
  access_token?: string;
  expiry_date?: number;
}

async function loadSavedCredentials(): Promise<any> {
  try {
    const content = await fs.readFile(TOKEN_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch {
    return null;
  }
}

async function saveCredentials(client: any): Promise<void> {
  const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
  const keys = JSON.parse(content) as Credentials;
  const key = keys.installed || keys.web;

  const payload: StoredToken = {
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token || '',
    access_token: client.credentials.access_token,
    expiry_date: client.credentials.expiry_date,
  };

  await fs.writeFile(TOKEN_PATH, JSON.stringify(payload, null, 2));
}

export async function authorize(): Promise<any> {
  let client = await loadSavedCredentials();

  if (client) {
    return client;
  }

  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });

  if (!client.credentials.refresh_token) {
    throw new Error('No refresh token received. Ensure offline access is selected.');
  }

  await saveCredentials(client);
  return client;
}

export interface MeetingResult {
  meetingUri: string;
  name?: string;
}

export async function createMeeting(): Promise<MeetingResult> {
  try {
    const authClient = await authorize();

    const meet = google.meet({
      version: 'v2',
      auth: authClient as any,
    });

    const res = await meet.spaces.create({});
    console.log('Meeting created:', res.data.meetingUri);

    return res.data as MeetingResult;
  } catch (error: unknown) {
    const err = error as Error & { message?: string; response?: { data?: unknown } };
    console.error('Error creating meeting:', err.message);

    if (err.response) {
      console.error('Details:', err.response.data);
    }

    throw error;
  }
}

createMeeting().catch(console.error);