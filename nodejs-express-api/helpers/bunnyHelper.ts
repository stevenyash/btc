/**
 * Bunny Helper - Reduces boilerplate for Bunny.net integration
 * Provides common patterns for URL generation, token handling, and error management
 */

import crypto from 'crypto';
import bunnyService from '../services/bunnyService.js';
import bunnyConfig from '../config/bunny.js';

// Type definitions
interface TokenOptions {
  expiresIn?: number;
  tokenPath?: string;
  ignoreParams?: boolean;
  userIp?: string;
  [key: string]: any;
}

interface SecureVideoUrlResult {
  url: string | null;
  hlsUrl: string | null;
  token: string | null;
  expiresAt: number | null;
}

interface UploadOptions {
  title?: string;
  description?: string;
  [key: string]: any;
}

interface UploadResult {
  success: boolean;
  data: any;
}

interface DeletionResult {
  success: boolean;
  data: {
    streamDeleted?: boolean;
  };
  error?: string;
}

interface ApiResponse {
  response: {
    success: boolean;
    data?: any;
    error?: string;
  };
  statusCode: number;
}

interface ValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
}

interface SecureStorageUrlResult {
  url: string | null;
  token: string | null;
  expiresAt: number | null;
}

export default class BunnyHelper {
  /**
   * Generate secure video URL with token (HLS or regular)
   * @param videoId - Bunny video ID
   * @param options - Token options
   * @param isHls - Whether to generate HLS URL
   * @returns Contains url, hlsUrl, and token info
   */
    static getSecureVideoUrl(
      videoId: string | null | undefined,
      options: TokenOptions = {},
      isHls: boolean = false
    ): SecureVideoUrlResult {
      if (!videoId) {
        return { url: null, hlsUrl: null, token: null, expiresAt: null };
      }

      // Default options for HLS streaming
      const defaultOptions: Partial<TokenOptions> = {
        expiresIn: options.expiresIn || 3600,
        tokenPath: isHls ? `/${videoId}/` : undefined,
        ignoreParams: isHls,
        userIp: options.userIp || undefined
      };

      // Merge options, prioritizing user-provided ones
      const tokenOptions: TokenOptions = { ...defaultOptions, ...options };

      // Remove undefined values
      Object.keys(tokenOptions).forEach(key =>
        tokenOptions[key] === undefined && delete tokenOptions[key]
      );

      try {
        if (isHls) {
          // Use directory-scoped token for HLS (covers master playlist, sub-playlists, and segments)
          const expiresIn = tokenOptions.expiresIn || 3600;
          const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

          if (!bunnyConfig.pullZoneSecurityKey) {
            console.warn(`[BunnyHelper] No security key configured for HLS video ${videoId}. Falling back to unsecured URL.`);
            const baseUrl = bunnyService.getStreamUrl(videoId);
            return {
              url: `${baseUrl}/playlist.m3u8`,
              hlsUrl: `${baseUrl}/playlist.m3u8`,
              token: null,
              expiresAt: null
            };
          }

          // Directory-scoped token: signed with /videoId/ and token_path parameter
          const directoryPath = `/${videoId}/`;
          const tokenQuery = bunnyService.generateAdvancedToken(directoryPath, {
            expiresIn,
            tokenPath: directoryPath,
          });

          if (!tokenQuery) {
            console.warn(`[BunnyHelper] Token generation failed for HLS video ${videoId}. Falling back to unsecured URL.`);
            const baseUrl = bunnyService.getStreamUrl(videoId);
            return {
              url: `${baseUrl}/playlist.m3u8`,
              hlsUrl: `${baseUrl}/playlist.m3u8`,
              token: null,
              expiresAt: null
            };
          }

          const baseUrl = bunnyService.getStreamUrl(videoId);
          const url = `${baseUrl}/playlist.m3u8?${tokenQuery}`;

          console.log(`[BunnyHelper] Generated HLS directory token URL for video ${videoId}: ${url.substring(0, 140)}...`);

          const params = new URLSearchParams(tokenQuery);
          return {
            url,
            hlsUrl: url,
            token: params.get('token') || '',
            expiresAt: expiresAt * 1000
          };
        } else {
          // Generate advanced token (query string format)
          const tokenQuery = bunnyService.generateAdvancedToken(
            `/${videoId}`,
            tokenOptions
          );

          // If token generation failed (returns null), log a clear warning and return unsecured URL
          if (!tokenQuery) {
            console.warn(`[BunnyHelper] Secure token generation failed for video ${videoId}. Falling back to unsecured URL. Check BUNNY_PULL_ZONE_SECURITY_KEY configuration.`);
            const baseUrl = bunnyService.getStreamUrl(videoId);
            return {
              url: baseUrl,
              hlsUrl: `${baseUrl}/playlist.m3u8`,
              token: null,
              expiresAt: null
            };
          }

          const baseUrl = bunnyService.getStreamUrl(videoId);
          const expiresAt = Date.now() + ((tokenOptions.expiresIn as number) * 1000);

          // For non-HLS (MP4), use query-based token
          const separator = baseUrl.includes('?') ? '&' : '?';
          const url = `${baseUrl}${separator}${tokenQuery}`;
          // Extract just token value for return
          const params = new URLSearchParams(tokenQuery);
          return {
            url,
            hlsUrl: null,
            token: params.get('token'),
            expiresAt
          };
        }
      } catch (error) {
        console.error('Error generating Bunny secure URL:', error);
        // Fallback to unsecured URL if token generation fails
        const baseUrl = bunnyService.getStreamUrl(videoId);
        return {
          url: isHls ? `${baseUrl}/playlist.m3u8` : baseUrl,
          hlsUrl: isHls ? `${baseUrl}/playlist.m3u8` : `${baseUrl}/playlist.m3u8`,
          token: null,
          expiresAt: null
        };
      }
    }

  /**
   * Generate secure URL for storage-based videos (S3 or Bunny Storage)
   * @param storagePath - Storage path (e.g., s3_key or storage_path from database)
   * @param options - Token options
   * @returns Contains url and token info
   */
  static getSecureStorageUrl(
    storagePath: string | null | undefined,
    options: TokenOptions = {}
  ): SecureStorageUrlResult {
    if (!storagePath) {
      return { url: null, token: null, expiresAt: null };
    }

    const expiresIn = options.expiresIn || 3600;
    const expirationTime = Math.floor(Date.now() / 1000) + expiresIn;

    // For storage paths, we use the same token generation approach
    // The storagePath is typically the file path in the pull zone
    const tokenQuery = bunnyService.generateAdvancedToken(`/${storagePath}`, {
      ...options,
      tokenPath: `/${storagePath}`,
    });

    if (!tokenQuery) {
      console.warn(`[BunnyHelper] Secure token generation failed for storage ${storagePath}. Falling back to unsecured URL.`);
      return {
        url: `${bunnyConfig.pullZoneBaseUrl}/${storagePath}`,
        token: null,
        expiresAt: null
      };
    }

    const baseUrl = `${bunnyConfig.pullZoneBaseUrl}/${storagePath}`;
    const separator = baseUrl.includes('?') ? '&' : '?';
    const url = `${baseUrl}${separator}${tokenQuery}`;

    const params = new URLSearchParams(tokenQuery);
    return {
      url,
      token: params.get('token'),
      expiresAt: Date.now() + (expiresIn * 1000)
    };
  }

  /**
   * Handle video upload with automatic cleanup and response formatting
   * @param filePath - Local file path to upload
   * @param options - Upload options (title, useStream, etc.)
   * @param cleanupCallback - Function to call for cleanup after upload
   * @returns Upload result
   */
  static async handleVideoUpload(
    filePath: string, 
    options: UploadOptions = {}, 
    cleanupCallback: ((filePath: string) => Promise<void>) | null = null
  ): Promise<UploadResult> {
    try {
      const uploadResult = await bunnyService.uploadVideo(filePath, options);
      
      // Execute cleanup callback if provided
      if (cleanupCallback && typeof cleanupCallback === 'function') {
        await cleanupCallback(filePath);
      }
      
      return {
        success: true,
        data: uploadResult
      };
    } catch (error) {
      console.error('Error in Bunny video upload:', error);
      throw error;
    }
  }

/**
    * Handle video deletion (both Stream and Storage)
    * @param videoId - Bunny video ID
    * @param storagePath - Bunny storage path
    * @returns Deletion result
    */
  static async handleVideoDeletion(
    videoId: string | null = null, 
    storagePath: string | null = null
  ): Promise<DeletionResult> {
    try {
      const results: { streamDeleted?: boolean; storageDeleted?: boolean } = {};
      
      if (videoId) {
        results.streamDeleted = await bunnyService.deleteFromStream(videoId);
      }
      
      if (storagePath) {
        results.storageDeleted = await bunnyService.deleteFromStorage(storagePath);
      }
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Error in Bunny video deletion:', error);
      // Don't throw - we want to continue even if deletion fails partially
      return {
        success: false,
        error: (error as Error).message,
        data: {}
      };
    }
  }

  /**
   * Create standardized Bunny API response
   * @param success - Success status
   * @param data - Response data
   * @param error - Error message if failed
   * @param statusCode - HTTP status code
   * @returns Formatted response object
   */
  static createResponse(
    success: boolean, 
    data: any = null, 
    error: string | null = null, 
    statusCode: number = 200
  ): ApiResponse {
    const response: { success: boolean; data?: any; error?: string } = {
      success
    };
    
    if (success) {
      response.data = data;
    } else {
      response.error = error || 'Unknown error';
    }
    
    return { response, statusCode };
  }

  /**
   * Validate Bunny configuration
   * @returns Validation result
   */
  static validateConfig(): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    if (!bunnyConfig.apiKey) {
      issues.push('BUNNY_API_KEY is not configured');
    }

    if (!bunnyConfig.libraryId) {
      issues.push('BUNNY_VIDEO_LIBRARY_ID is not configured');
    }

    if (!bunnyConfig.pullZoneSecurityKey) {
      warnings.push('BUNNY_PULL_ZONE_SECURITY_KEY is not set - secure video URLs will not work');
    }

    if (bunnyConfig.pullZoneBaseUrl === 'https://vz-8217e52e-f0d.b-cdn.net') {
      warnings.push('Using default pull zone URL - consider setting BUNNY_PULL_ZONE_BASE_URL to your actual zone');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings
    };
  }
}