import { describe, expect, it, jest } from '@jest/globals';
import crypto from 'crypto';

jest.mock('../config/bunny.js', () => ({
  __esModule: true,
  default: {
    apiKey: 'test-api-key',
    libraryId: '12345',
    streamBaseUrl: 'https://video.bunnycdn.com',
    streamTokenAuthKey: 'test-stream-token-key',
    defaultTokenExpiry: 3600,
  },
}), { virtual: true });

import bunnyService, { mapStatus } from './bunnyService.js';

const statusCases: [number, ReturnType<typeof mapStatus>][] = [
  [0, 'pending'],
  [1, 'pending'],
  [2, 'processing'],
  [3, 'processing'],
  [4, 'completed'],
  [5, 'failed'],
  [6, 'failed'],
  [7, 'processing'],
  [8, 'completed'],
];

describe('mapStatus', () => {
  it.each(statusCases)('maps Bunny status %i to %s', (status, expected) => {
    expect(mapStatus(status)).toBe(expected);
  });

  it('treats unknown status codes as failed', () => {
    expect(mapStatus(99)).toBe('failed');
  });
});

describe('getVideoPlayData', () => {
  it('requests playback data with a signed Stream token', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        isPlayable: true,
        isPlaylistPlayable: true,
        tokenAuthEnabled: true,
        videoPlaylistUrl: 'https://video.example/video/playlist.m3u8',
      }), { status: 200 })
    );

    try {
      const result = await bunnyService.getVideoPlayData('video-guid', 600);
      const request = fetchMock.mock.calls[0][0];
      const requestUrl = new URL(
        request instanceof Request ? request.url : String(request),
        'https://video.bunnycdn.com'
      );
      const expires = requestUrl.searchParams.get('expires');
      const expectedToken = crypto
        .createHash('sha256')
        .update(`test-stream-token-keyvideo-guid${expires}`)
        .digest('hex');

      expect(requestUrl.pathname).toBe('/library/12345/videos/video-guid/play');
      expect(requestUrl.searchParams.get('token')).toBe(expectedToken);
      expect(result.isPlaylistPlayable).toBe(true);
    } finally {
      fetchMock.mockRestore();
    }
  });
});
