import axios from 'axios';

const MOBILESASA_CONFIG = {
  baseURL: 'https://api.mobilesasa.com/v1',
  authToken: 'Bearer PWd8Q9kHAAzUMFUHLzj1qnV2Kn6IF7UoPVjduIKCKUBzUlRhpkgc6l0LPczl',
  senderID: 'BITSTUTOR'
};

const COMMON_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: MOBILESASA_CONFIG.authToken
};

export interface SmsResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export async function sendSms(Msisdn: string, msg: string): Promise<SmsResponse> {
  const url = `${MOBILESASA_CONFIG.baseURL}/send/message`;
  const payload = {
    senderID: MOBILESASA_CONFIG.senderID,
    message: msg,
    phone: Msisdn
  };

  try {
    const response = await axios.post(url, payload, { headers: COMMON_HEADERS });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending SMS:', (error as any).response?.data || (error as Error).message);
    throw error;
  }
}

export async function getBalance(): Promise<SmsResponse> {
  const url = `${MOBILESASA_CONFIG.baseURL}/get-balance`;

  try {
    const response = await axios.get(url, { headers: COMMON_HEADERS });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting balance:', (error as any).response?.data || (error as Error).message);
    throw error;
  }
}