/**
 * Bunny Helper - Reduces boilerplate for Bunny.net integration
 * Provides common patterns for URL generation, token handling, and error management
 */

import bunnyService from '../services/bunnyService.js';

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

interface SecureStorageUrlResult {
  url: string | null;
  token: string | null;
  expiresAt: number | null;
}

interface UploadOptions {
  title?: string;
  useStream?: boolean;
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
    storageDeleted?: boolean;
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
        // Generate advanced token (query string format)
        const tokenQuery = bunnyService.generateAdvancedToken(
          isHls ? `/${videoId}/playlist.m3u8` : `/${videoId}`,
          tokenOptions
        );

        // If token generation failed (returns null), log a clear warning and return unsecured URL
        if (!tokenQuery) {
          console.warn(`[BunnyHelper] Secure token generation failed for video ${videoId}. Falling back to unsecured URL. Check BUNNY_PULL_ZONE_SECURITY_KEY configuration.`);
          const baseUrl = bunnyService.getStreamUrl(videoId);
          return {
            url: isHls ? `${baseUrl}/playlist.m3u8` : baseUrl,
            hlsUrl: isHls ? `${baseUrl}/playlist.m3u8` : `${baseUrl}/playlist.m3u8`,
            token: null,
            expiresAt: null
          };
        }

        const baseUrl = bunnyService.getStreamUrl(videoId);
        const expiresAt = Date.now() + ((tokenOptions.expiresIn as number) * 1000);

        if (isHls) {
          // For HLS, use path-based token to ensure variant playlists inherit the token
          // Convert query token "token=...&expires=...&token_path=..." → path segment "bcdn_token=...&expires=...&token_path=..."
          const tokenPathSegment = tokenQuery.replace(/^token=/, 'bcdn_token=');

          // Build base (zone root), e.g., https://vz-xxxx.b-cdn.net
          const baseOrigin = baseUrl.substring(0, baseUrl.lastIndexOf('/'));

          // Final URL: https://zone/bcdn_token=.../videoId/playlist.m3u8
          const url = `${baseOrigin}/${tokenPathSegment}/${videoId}/playlist.m3u8`;
          return {
            url,
            hlsUrl: url,
            token: tokenPathSegment.split('&')[0].split('=')[1] || null, // just the token value
            expiresAt
          };
        } else {
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
    * Generate secure storage URL with token
    * @param storagePath - Bunny storage path
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

    const tokenOptions: TokenOptions = {
      expiresIn: options.expiresIn || 3600,
      ...options
    };

    try {
      const token = bunnyService.generateAdvancedToken(
        `/${storagePath}`,
        tokenOptions
      );

      const baseUrl = bunnyService.getPublicUrl(storagePath);
      const separator = baseUrl.includes('?') ? '&' : '?';
      const tokenParam = token ? `${separator}${token}` : '';
      
      const url = token ? `${baseUrl}${tokenParam}` : baseUrl;

      return {
        url,
        token,
        expiresAt: Date.now() + ((tokenOptions.expiresIn as number) * 1000)
      };
    } catch (error) {
      console.error('Error generating Bunny storage URL:', error);
      // Fallback to unsecured URL
      return {
        url: bunnyService.getPublicUrl(storagePath),
        token: null,
        expiresAt: null
      };
    }
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
    
    if (!process.env.BUNNY_API_KEY) {
      issues.push('BUNNY_API_KEY is not configured');
    }
    
    if (!process.env.BUNNY_VIDEO_LIBRARY_ID) {
      issues.push('BUNNY_VIDEO_LIBRARY_ID is not configured');
    }
    
    if (!process.env.BUNNY_PULL_ZONE) {
      issues.push('BUNNY_PULL_ZONE is not configured');
    }
    
    // Pull zone security key is optional but recommended for secure tokens
    if (!process.env.BUNNY_PULL_ZONE_SECURITY_KEY) {
      issues.push('WARNING: BUNNY_PULL_ZONE_SECURITY_KEY not configured - secure tokens will not work');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      warnings: issues.filter(i => i.startsWith('WARNING:'))
    };
  }
}