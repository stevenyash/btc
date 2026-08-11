/**
 * BunnyHelper Test Suite
 * Tests for BunnyCDN Token Authentication Helper
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type { StreamVideo } from '../services/bunnyService.js';

jest.mock('../services/bunnyService.js', () => ({
  default: {
    uploadVideo: jest.fn(),
    deleteFromStream: jest.fn(),
    deleteFromStorage: jest.fn(),
    generateAdvancedToken: jest.fn(),
    getStreamUrl: jest.fn(),
    getPublicUrl: jest.fn(),
  },
}));

// Mock the db module
jest.mock('../models/db', () => ({
  LessonAccessLogs: {
    create: jest.fn()
  }
}));

import BunnyHelper from './bunnyHelper.js';
import bunnyService from '../services/bunnyService.js';

const mockUploadVideo = bunnyService.uploadVideo as jest.MockedFunction<() => Promise<StreamVideo>>;
const mockDeleteFromStream = bunnyService.deleteFromStream as jest.MockedFunction<() => Promise<boolean>>;
const mockDeleteFromStorage = bunnyService.deleteFromStorage as jest.MockedFunction<() => Promise<boolean>>;
const mockGenerateAdvancedToken = bunnyService.generateAdvancedToken as jest.MockedFunction<() => string>;
const mockGetStreamUrl = bunnyService.getStreamUrl as jest.MockedFunction<() => string>;
const mockGetPublicUrl = bunnyService.getPublicUrl as jest.MockedFunction<() => string>;

describe('BunnyHelper', () => {
  beforeEach(() => {
    mockGenerateAdvancedToken.mockReturnValue('token=testtoken&expires=1234567890');
    mockGetStreamUrl.mockReturnValue('https://vz-8217e52e-f0d.b-cdn.net/test123');
    mockGetPublicUrl.mockReturnValue('https://vz-8217e52e-f0d.b-cdn.net/videos/test.mp4');
    jest.clearAllMocks();
  });

  describe('getSecureVideoUrl', () => {
    it('should return null for null videoId', () => {
      const result = BunnyHelper.getSecureVideoUrl(null, {}, false);
      expect(result).toEqual({
        url: null,
        hlsUrl: null,
        token: null,
        expiresAt: null
      });
    });

    it('should return null for undefined videoId', () => {
      const result = BunnyHelper.getSecureVideoUrl(undefined, {}, false);
      expect(result).toEqual({
        url: null,
        hlsUrl: null,
        token: null,
        expiresAt: null
      });
    });

    it('should return null for empty string videoId', () => {
      const result = BunnyHelper.getSecureVideoUrl('', {}, false);
      expect(result).toEqual({
        url: null,
        hlsUrl: null,
        token: null,
        expiresAt: null
      });
    });

    it('should generate secure URL for regular video', () => {
      const mockToken = 'token=testtoken&expires=1234567890';
      mockGenerateAdvancedToken.mockReturnValue(mockToken);
      
      const result = BunnyHelper.getSecureVideoUrl('test123', { expiresIn: 3600 }, false);
      
      expect(mockGenerateAdvancedToken).toHaveBeenCalledWith(
        '/test123',
        { expiresIn: 3600, ignoreParams: false }
      );
      expect(mockGetStreamUrl).toHaveBeenCalledWith('test123');
      expect(result.url).toBe('https://vz-8217e52e-f0d.b-cdn.net/test123?token=testtoken&expires=1234567890');
      expect(result.hlsUrl).toBe('https://vz-8217e52e-f0d.b-cdn.net/test123/playlist.m3u8?token=testtoken&expires=1234567890');
      expect(result.token).toBe(mockToken);
      expect(result.expiresAt).toBeGreaterThan(Date.now());
    });
    
    it('should generate secure HLS URL with tokenPath', () => {
      const mockToken = 'token=testtoken&expires=1234567890';
      mockGenerateAdvancedToken.mockReturnValue(mockToken);
      
      const result = BunnyHelper.getSecureVideoUrl('test123', { expiresIn: 7200, userIp: '192.168.1.1' }, true);
      
      expect(mockGenerateAdvancedToken).toHaveBeenCalledWith(
        '/test123/playlist.m3u8',
        { expiresIn: 7200, tokenPath: '/test123/', ignoreParams: true, userIp: '192.168.1.1' }
      );
      expect(result.url).toBe('https://vz-8217e52e-f0d.b-cdn.net/test123/playlist.m3u8?token=testtoken&expires=1234567890');
      expect(result.hlsUrl).toBe('https://vz-8217e52e-f0d.b-cdn.net/test123/playlist.m3u8?token=testtoken&expires=1234567890');
    });
    
    it('should handle additional parameters in token generation', () => {
      const mockToken = 'token=testtoken&expires=1234567890&customParam=value';
      mockGenerateAdvancedToken.mockReturnValue(mockToken);
      
      const result = BunnyHelper.getSecureVideoUrl('test123', { 
        expiresIn: 3600,
        additionalParams: { customParam: 'value' }
      }, false);
      
      expect(mockGenerateAdvancedToken).toHaveBeenCalledWith(
        '/test123',
        { 
          expiresIn: 3600,
          additionalParams: { customParam: 'value' },
          ignoreParams: false
        }
      );
      expect(result.url).toBe('https://vz-8217e52e-f0d.b-cdn.net/test123?token=testtoken&expires=1234567890&customParam=value');
    });

    it('should fallback to unsecured URL when token generation fails', () => {
      mockGenerateAdvancedToken.mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      const result = BunnyHelper.getSecureVideoUrl('test123', { expiresIn: 3600 }, false);

      expect(result.url).toBe('https://vz-8217e52e-f0d.b-cdn.net/test123');
      expect(result.hlsUrl).toBe('https://vz-8217e52e-f0d.b-cdn.net/test123/playlist.m3u8');
      expect(result.token).toBeNull();
      expect(result.expiresAt).toBeNull();
    });

    it('should use default expiresIn when not provided', () => {
      const mockToken = 'token=testtoken&expires=1234567890';
      mockGenerateAdvancedToken.mockReturnValue(mockToken);
      
      const result = BunnyHelper.getSecureVideoUrl('test123', {}, false);
      
      expect(mockGenerateAdvancedToken).toHaveBeenCalledWith(
        '/test123',
        { expiresIn: 3600, ignoreParams: false }
      );
    });
  });

  describe('getSecureStorageUrl', () => {
    it('should return null for null storagePath', () => {
      const result = BunnyHelper.getSecureStorageUrl(null, {});
      expect(result).toEqual({
        url: null,
        token: null,
        expiresAt: null
      });
    });

    it('should return null for undefined storagePath', () => {
      const result = BunnyHelper.getSecureStorageUrl(undefined, {});
      expect(result).toEqual({
        url: null,
        token: null,
        expiresAt: null
      });
    });

    it('should return null for empty string storagePath', () => {
      const result = BunnyHelper.getSecureStorageUrl('', {});
      expect(result).toEqual({
        url: null,
        token: null,
        expiresAt: null
      });
    });

    it('should generate secure storage URL', () => {
      const mockToken = 'token=HS256-testtoken&expires=1234567890';
      mockGenerateAdvancedToken.mockReturnValue(mockToken);

      const result = BunnyHelper.getSecureStorageUrl('videos/test.mp4', { expiresIn: 1800 });

      expect(mockGenerateAdvancedToken).toHaveBeenCalledWith(
        '/videos/test.mp4',
        { expiresIn: 1800 }
      );
      expect(mockGetPublicUrl).toHaveBeenCalledWith('videos/test.mp4');
      expect(result.url).toBe('https://vz-8217e52e-f0d.b-cdn.net/videos/test.mp4?token=HS256-testtoken&expires=1234567890');
      expect(result.token).toBe(mockToken);
      expect(result.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should use default expiresIn when not provided', () => {
      const mockToken = 'token=HS256-testtoken&expires=1234567890';
      mockGenerateAdvancedToken.mockReturnValue(mockToken);

      BunnyHelper.getSecureStorageUrl('videos/test.mp4', {});

      expect(mockGenerateAdvancedToken).toHaveBeenCalledWith(
        '/videos/test.mp4',
        { expiresIn: 3600 }
      );
    });

    it('should fallback to unsecured URL when token generation fails', () => {
      mockGenerateAdvancedToken.mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      const result = BunnyHelper.getSecureStorageUrl('videos/test.mp4', { expiresIn: 3600 });

      expect(result.url).toBe('https://vz-8217e52e-f0d.b-cdn.net/videos/test.mp4');
      expect(result.token).toBeNull();
      expect(result.expiresAt).toBeNull();
    });

  });

  describe('handleVideoUpload', () => {
    it('should handle successful video upload', async () => {
      const mockUploadResult: StreamVideo = {
        guid: 'vid123',
        title: 'Test Video',
        status: 'processing',
        videoUrl: 'https://example.com/video.mp4',
      };
      
      mockUploadVideo.mockResolvedValueOnce(mockUploadResult);

      const cleanupCallback = ((filePath: string) => Promise.resolve()) as unknown as ((filePath: string) => Promise<void>) | null;
      const result = await BunnyHelper.handleVideoUpload(
        '/tmp/test.mp4',
        { title: 'Test Video', useStream: true },
        cleanupCallback
      );

      expect(mockUploadVideo).toHaveBeenCalledWith('/tmp/test.mp4', {
        title: 'Test Video',
        useStream: true
      });
      expect(result).toEqual({
        success: true,
        data: mockUploadResult
      });
    });

    it('should handle video upload without cleanup callback', async () => {
      const mockUploadResult: StreamVideo = {
        guid: 'vid123',
        title: 'Test Video',
        status: 'processing',
        videoUrl: 'https://example.com/video.mp4',
      };
      
      mockUploadVideo.mockResolvedValueOnce(mockUploadResult);

      const result = await BunnyHelper.handleVideoUpload(
        '/tmp/test.mp4',
        { title: 'Test Video', useStream: true }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUploadResult);
    });

    it('should throw error when upload fails', async () => {
      mockUploadVideo.mockRejectedValueOnce(new Error('Upload failed'));

      await expect(BunnyHelper.handleVideoUpload('/tmp/test.mp4', {}))
        .rejects
        .toThrow('Upload failed');
    });
  });

  describe('handleVideoDeletion', () => {
    it('should delete video from stream', async () => {
      mockDeleteFromStream.mockResolvedValueOnce(true);

      const result = await BunnyHelper.handleVideoDeletion('vid123', null);

      expect(mockDeleteFromStream).toHaveBeenCalledWith('vid123');
      expect(result).toEqual({
        success: true,
        data: { streamDeleted: true }
      });
    });

    it('should delete video from storage', async () => {
      mockDeleteFromStorage.mockResolvedValueOnce(true);

      const result = await BunnyHelper.handleVideoDeletion(null, 'videos/test.mp4');

      expect(mockDeleteFromStorage).toHaveBeenCalledWith('videos/test.mp4');
      expect(result).toEqual({
        success: true,
        data: { storageDeleted: true }
      });
    });

    it('should delete video from both stream and storage', async () => {
      mockDeleteFromStream.mockResolvedValueOnce(true);
      mockDeleteFromStorage.mockResolvedValueOnce(true);

      const result = await BunnyHelper.handleVideoDeletion('vid123', 'videos/test.mp4');

      expect(mockDeleteFromStream).toHaveBeenCalledWith('vid123');
      expect(mockDeleteFromStorage).toHaveBeenCalledWith('videos/test.mp4');
      expect(result).toEqual({
        success: true,
        data: { streamDeleted: true, storageDeleted: true }
      });
    });

    it('should handle partial deletion failure', async () => {
      mockDeleteFromStream.mockRejectedValueOnce(new Error('Delete failed'));
      mockDeleteFromStorage.mockResolvedValueOnce(true);

      const result = await BunnyHelper.handleVideoDeletion('vid123', 'videos/test.mp4');

      expect(result.success).toBe(false);
      expect(result.data).toEqual({});
      expect(result.error).toBeDefined();
    });
  });

  describe('createResponse', () => {
    it('should create success response', () => {
      const result = BunnyHelper.createResponse(true, { id: 123 }, null, 200);
      
      expect(result).toEqual({
        response: {
          success: true,
          data: { id: 123 }
        },
        statusCode: 200
      });
    });

    it('should create error response', () => {
      const result = BunnyHelper.createResponse(false, null, 'Error message', 400);
      
      expect(result).toEqual({
        response: {
          success: false,
          error: 'Error message'
        },
        statusCode: 400
      });
    });

    it('should use default status code', () => {
      const result = BunnyHelper.createResponse(true, { id: 123 });
      
      expect(result.statusCode).toBe(200);
    });

    it('should use default error message', () => {
      const result = BunnyHelper.createResponse(false);
      
      expect(result.response.error).toBe('Unknown error');
    });
  });

  describe('validateConfig', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return valid when all required config is present', () => {
      process.env.BUNNY_API_KEY = 'test-key';
      process.env.BUNNY_VIDEO_LIBRARY_ID = 'test-library';
      process.env.BUNNY_PULL_ZONE_BASE_URL = 'https://custom.b-cdn.net';
      process.env.BUNNY_PULL_ZONE_SECURITY_KEY = 'test-security-key';

      const result = BunnyHelper.validateConfig();

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should return invalid when BUNNY_API_KEY is missing', () => {
      process.env.BUNNY_API_KEY = '';
      process.env.BUNNY_VIDEO_LIBRARY_ID = 'test-library';

      const result = BunnyHelper.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('BUNNY_API_KEY is not configured');
    });

    it('should return invalid when BUNNY_VIDEO_LIBRARY_ID is missing', () => {
      process.env.BUNNY_API_KEY = 'test-key';
      process.env.BUNNY_VIDEO_LIBRARY_ID = '';

      const result = BunnyHelper.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('BUNNY_VIDEO_LIBRARY_ID is not configured');
    });

    it('should return invalid when BUNNY_PULL_ZONE_BASE_URL is missing', () => {
      process.env.BUNNY_API_KEY = 'test-key';
      process.env.BUNNY_VIDEO_LIBRARY_ID = 'test-library';

      const result = BunnyHelper.validateConfig();

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should add warning when BUNNY_PULL_ZONE_SECURITY_KEY is missing', () => {
      process.env.BUNNY_API_KEY = 'test-key';
      process.env.BUNNY_VIDEO_LIBRARY_ID = 'test-library';
      process.env.BUNNY_PULL_ZONE_SECURITY_KEY = '';

      const result = BunnyHelper.validateConfig();

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle multiple missing config values', () => {
      process.env.BUNNY_API_KEY = '';
      process.env.BUNNY_VIDEO_LIBRARY_ID = '';
      process.env.BUNNY_PULL_ZONE_SECURITY_KEY = 'test-key';

      const result = BunnyHelper.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(2);
    });
  });
});