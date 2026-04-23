import axios from 'axios';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8060/api/components_data/oauth2callback';

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

interface UserProfile {
  id?: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}

export const generateGoogleOAuthUrl = (): string => {
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=profile email`;
};

export const exchangeCodeForTokens = async (code: string): Promise<TokenResponse> => {
  const response = await axios.post<TokenResponse>('https://oauth2.googleapis.com/token', {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  return response.data;
};

export const fetchUserProfile = async (accessToken: string): Promise<UserProfile> => {
  const response = await axios.get<UserProfile>('https://www.googleapis.com/oauth2/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.data;
};