import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import fs from "fs/promises";
import path from "path";
import process from "process";

const SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
];

const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const TOKEN_PATH = path.join(process.cwd(), "token.json");

interface Credentials {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
}

interface TokenPayload {
    type: string;
    client_id: string;
    client_secret: string;
    refresh_token: string;
}

interface MeetEventOptions {
    summary?: string;
    description?: string;
    startTime: string;
    endTime: string;
    timeZone?: string;
    hostemail: string;
}

interface MeetEventResult {
    success: boolean;
    meetingUrl?: string;
    eventId?: string;
    start?: { dateTime: string; timeZone: string };
    end?: { dateTime: string; timeZone: string };
    htmlLink?: string;
    conferenceData?: unknown;
    error?: string;
    originalError?: string;
    details?: unknown;
}

let oauth2Client: OAuth2Client | null = null;

async function loadSavedCredentials(): Promise<OAuth2Client | null> {
    try {
        const content = await fs.readFile(TOKEN_PATH, "utf8");
        const credentials = JSON.parse(content);

        if (!credentials.refresh_token) {
            console.log("No refresh token found in saved credentials");
            return null;
        }

        const client = google.auth.fromJSON(credentials);
        
        // The fromJSON method returns OAuth2Client but TypeScript needs explicit cast
        const oauthClient = client as any as OAuth2Client;
        
        oauthClient.on('tokens', (tokens) => {
            if (tokens.refresh_token) {
                console.log('New refresh token received, saving...');
                saveCredentials(oauthClient).catch(err => {
                    console.error('Failed to save new tokens:', err);
                });
            }
        });
        
        return oauthClient;
    } catch (err) {
        console.log("Loading credentials failed:", (err as Error).message);
        return null;
    }
}

async function saveCredentials(client: OAuth2Client): Promise<void> {
    const content = await fs.readFile(CREDENTIALS_PATH, "utf8");
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;

    if (!client.credentials || !client.credentials.refresh_token) {
        throw new Error("Missing refresh token in client credentials");
    }

    const payload: TokenPayload = {
        type: "authorized_user",
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    };

    await fs.writeFile(TOKEN_PATH, JSON.stringify(payload, null, 2));
    console.log("Credentials saved with refresh token");
}

async function getAuthUrl(): Promise<string> {
    const credentialsContent = await fs.readFile(CREDENTIALS_PATH, "utf8");
    const credentials = JSON.parse(credentialsContent);
    const { client_id, client_secret, redirect_uris } = credentials.web || credentials.installed;
    const redirectUri = redirect_uris[0];

    oauth2Client = new OAuth2Client({
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri: redirectUri,
    });

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent",
    });

    return authUrl;
}

async function getOAuthClient(): Promise<OAuth2Client> {
    try {
        const credentialsContent = await fs.readFile(CREDENTIALS_PATH, "utf8");
        const credentials = JSON.parse(credentialsContent);
        const { client_id, client_secret, redirect_uris } = credentials.web || credentials.installed;
        const redirectUri = redirect_uris[0];

        return new OAuth2Client({
            clientId: client_id,
            clientSecret: client_secret,
            redirectUri: redirectUri,
        });
    } catch (error) {
        console.error("Error getting OAuth client:", error);
        throw error;
    }
}

async function exchangeCodeForTokens(code: string): Promise<OAuth2Client> {
    if (!oauth2Client) {
        const credentialsContent = await fs.readFile(CREDENTIALS_PATH, "utf8");
        const credentials = JSON.parse(credentialsContent);
        const { client_id, client_secret, redirect_uris } = credentials.web || credentials.installed;
        const redirectUri = redirect_uris[0];

        oauth2Client = new OAuth2Client({
            clientId: client_id,
            clientSecret: client_secret,
            redirectUri: redirectUri,
        });
    }

    const tokenResponse = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokenResponse.tokens);
    await saveCredentials(oauth2Client);

    return oauth2Client;
}

async function authorize(): Promise<OAuth2Client> {
    let client = await loadSavedCredentials();

    if (client) {
        try {
            const tokenInfo = await client.getAccessToken();
            console.log("Successfully authorized with existing credentials");
            return client;
        } catch (e) {
            console.error("Error with previous token:", (e as Error).message);
            console.log("Token may be expired or invalid. Attempting to refresh...");

            try {
                await client.refreshAccessToken();
                console.log("Token refreshed successfully");
                return client;
            } catch (refreshError) {
                console.error("Token refresh failed:", (refreshError as Error).message);
                console.log("Re-authorization required");
            }
        }
    }

    const authUrl = await getAuthUrl();
    console.error(`\n========================================`);
    console.error(`GOOGLE AUTHENTICATION REQUIRED`);
    console.error(`========================================`);
    console.error(`Please visit this URL to authorize your application:`);
    console.error(`${authUrl}`);
    console.error(`========================================\n`);

    throw new Error(`Google Calendar authorization required. Please visit the authorization URL and complete the OAuth flow. Auth URL: ${authUrl}`);
}

async function createMeetEvent(options: MeetEventOptions): Promise<MeetEventResult> {
    const {
        summary = "Google Meet Meeting",
        description = "",
        startTime,
        endTime,
        timeZone = "UTC",
        hostemail
    } = options;

    try {
        if (!hostemail) {
            throw new Error("Host email is required");
        }
        if (!startTime || !endTime) {
            throw new Error("Both startTime and endTime are required");
        }

        const auth = await authorize();
        const calendar = google.calendar({ version: "v3", auth } as any);

        const startDateTime = new Date(startTime);
        const endDateTime = new Date(endTime);

        if (isNaN(startDateTime.getTime())) {
            throw new Error("Invalid startTime format");
        }
        if (isNaN(endDateTime.getTime())) {
            throw new Error("Invalid endTime format");
        }
        if (startDateTime >= endDateTime) {
            throw new Error("End time must be after start time");
        }

        const event: any = {
            summary,
            description,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: timeZone,
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: timeZone,
            },
            attendees: [{ email: hostemail }],
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: { type: "hangoutsMeet" },
                },
            },
        };

        const res = await calendar.events.insert({
            calendarId: "primary",
            requestBody: event,
            conferenceDataVersion: 1,
        });

        return {
            success: true,
            meetingUrl: res.data.hangoutLink,
            eventId: res.data.id,
            start: (res.data.start as any) || { dateTime: startTime, timeZone },
            end: (res.data.end as any) || { dateTime: endTime, timeZone },
            htmlLink: res.data.htmlLink,
            conferenceData: res.data.conferenceData
        };
    } catch (error) {
        console.error("Error in createMeetEvent:", error);

        const err = error as Error & { code?: string; response?: { status?: number; statusText?: string; data?: unknown } };
        
        let errorMessage = err.message;

        if (err.message.includes("Authorization required") || err.message.includes("authorization")) {
            errorMessage = "Google Calendar authorization is required. Please complete the OAuth flow first.";
        } else if (err.code === 'ENOENT') {
            errorMessage = "Google credentials file not found. Please ensure credentials.json exists.";
        } else if (err.response?.status === 401) {
            errorMessage = "Google authentication failed. Token may be expired or invalid.";
        } else if (err.response?.status === 403) {
            errorMessage = "Permission denied. Please ensure the Google Calendar API is enabled and you have the necessary permissions.";
        } else if (err.response?.status === 404) {
            errorMessage = "Google Calendar not found. Please check the calendar ID.";
        }

        return {
            success: false,
            error: errorMessage,
            originalError: err.message,
            details: err.response?.data || null
        };
    }
}

export {
    createMeetEvent,
    getAuthUrl,
    exchangeCodeForTokens,
    authorize,
    loadSavedCredentials,
    saveCredentials,
    getOAuthClient,
};