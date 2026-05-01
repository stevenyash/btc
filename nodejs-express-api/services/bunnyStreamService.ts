import crypto from 'crypto';
import path from 'path';

interface VideoMetadata {
  guid: string;
  title: string;
  description?: string;
  dateUploaded: string;
  views: number;
  length: number;
  status: number;
  thumbnailCount: number;
  encodeProgress: number;
  storageSize: number;
  captions?: Array<{ srclang: string; label: string; url: string }>;
}

interface StreamVideo {
  guid: string;
  title: string;
  description?: string;
  collectionId?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  videoUrl?: string;
  duration?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  encodeProgress?: number;
}

interface CaptionsOptions {
  srclang: string;
  label: string;
  language: string;
}

interface VideoStatistics {
  videoId: string;
  views: Array<{ date: string; count: number }>;
  watchTime: Array<{ date: string; seconds: number }>;
  countries: Array<{ country: string; views: number }>;
  totalViews: number;
  totalWatchTime: number;
}

interface SecurityConfig {
  defaultExpiry: number;
  maxPlaysPerToken: number;
  tokenCleanupInterval: number;
}

interface VideoTokenData {
  videoId: string;
  userId: string;
  expiresAt: number;
  maxPlays: number;
  plays: number;
  ip?: string;
  userAgent?: string;
  tokenId: string;
  createdAt: string;
  lastAccessed?: string;
}

export class BunnyStreamService {
   private apiKey: string;
   private libraryId: string;
   private baseUrl: string;
   private pullZoneBaseUrl: string;
   private tokenStore: Map<string, VideoTokenData>;
   private securityConfig: SecurityConfig;

   constructor() {
     this.apiKey = process.env.BUNNY_API_KEY || 'd14fe46f-d0f5-45c7-b90dd58bf1e0-d37b-4134';
     this.libraryId = process.env.BUNNY_VIDEO_LIBRARY_ID || '644183';
     this.baseUrl = process.env.BUNNY_STREAM_BASE_URL || 'https://video.bunnycdn.com';
     this.pullZoneBaseUrl = (process.env.BUNNY_PULL_ZONE || 'https://vz-8217e52e-f0d.b-cdn.net').replace(/\/$/, '');
     
     this.tokenStore = new Map();
     this.securityConfig = {
       defaultExpiry: 7200,
       maxPlaysPerToken: 3,
       tokenCleanupInterval: 3600000,
     };

     this.startCleanupScheduler();
   }

   private startCleanupScheduler(): void {
     setInterval(() => {
       this.cleanupExpiredTokens();
     }, this.securityConfig.tokenCleanupInterval);
   }

   private cleanupExpiredTokens(): void {
     const now = Date.now();
     let removed = 0;
     for (const [tokenId, tokenData] of this.tokenStore.entries()) {
       if (tokenData.expiresAt < now) {
         this.tokenStore.delete(tokenId);
         removed++;
       }
     }
     if (removed > 0) {
       console.log(`Cleaned up ${removed} expired tokens`);
     }
   }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'AccessKey': this.apiKey,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bunny Stream API error: ${response.status} ${errorText}`);
    }

    return await response.json() as T;
  }

  // Upload video to Bunny Stream Library
  async uploadVideo(
    filePath: string,
    options: {
      title?: string;
      description?: string;
      collectionId?: string;
    } = {}
  ): Promise<StreamVideo> {
    const fs = await import('fs');
    const fileBuffer = fs.readFileSync(filePath);
    
    // Create video entry first
    const video = await this.makeRequest<{ guid: string }>(
      'POST',
      `/library/${this.libraryId}/videos`,
      {
        title: options.title || 'Untitled Video',
        description: options.description || '',
        collectionId: options.collectionId || null,
      }
    );

    // Upload the video file
    const uploadUrl = `${this.baseUrl}/library/${this.libraryId}/videos/${video.guid}`;
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': this.apiKey,
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Failed to upload video: ${uploadResponse.status} ${errorText}`);
    }

    return {
      guid: video.guid,
      title: options.title || 'Untitled Video',
      description: options.description,
      collectionId: options.collectionId,
      status: 'processing',
      videoUrl: this.getVideoUrl(video.guid),
      thumbnailUrl: this.getThumbnailUrl(video.guid),
    };
  }

  // Fetch video details
  async getVideo(videoId: string): Promise<StreamVideo> {
    const video = await this.makeRequest<VideoMetadata>(
      'GET',
      `/library/${this.libraryId}/videos/${videoId}`
    );

    return {
      guid: video.guid,
      title: video.title,
      description: video.description,
      status: this.mapStatus(video.status),
      duration: video.length,
      encodeProgress: video.encodeProgress,
      videoUrl: this.getVideoUrl(video.guid),
      thumbnailUrl: this.getThumbnailUrl(video.guid),
    };
  }

  // Delete video from Stream Library
  async deleteVideo(videoId: string): Promise<boolean> {
    try {
      await this.makeRequest<void>(
        'DELETE',
        `/library/${this.libraryId}/videos/${videoId}`
      );
      return true;
    } catch (error) {
      console.error('Error deleting video:', error);
      return false;
    }
  }

  // Add captions to video
  async addCaptions(
    videoId: string,
    options: CaptionsOptions,
    captionFile: string
  ): Promise<boolean> {
    try {
      const fs = await import('fs');
      const captionContent = fs.readFileSync(captionFile);
      
      const url = `${this.baseUrl}/library/${this.libraryId}/videos/${videoId}/captions/${options.srclang}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'AccessKey': this.apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: captionContent,
      });

      return response.ok;
    } catch (error) {
      console.error('Error adding captions:', error);
      return false;
    }
  }

  // Get video statistics
  async getVideoStatistics(
    videoId: string,
    options?: {
      dateFrom?: string;
      dateTo?: string;
      hourly?: boolean;
    }
  ): Promise<VideoStatistics> {
    let endpoint = `/library/${this.libraryId}/videos/${videoId}/statistics`;
    const params = new URLSearchParams();
    
    if (options?.dateFrom) params.append('dateFrom', options.dateFrom);
    if (options?.dateTo) params.append('dateTo', options.dateTo);
    if (options?.hourly !== undefined) params.append('hourly', String(options.hourly));
    
    const queryString = params.toString();
    if (queryString) endpoint += `?${queryString}`;

    return await this.makeRequest<VideoStatistics>('GET', endpoint);
  }

  // Transcribe video (if supported)
  async transcribeVideo(videoId: string): Promise<boolean> {
    try {
      await this.makeRequest<void>(
        'POST',
        `/library/${this.libraryId}/videos/${videoId}/transcribe`
      );
      return true;
    } catch (error) {
      console.error('Error transcribing video:', error);
      return false;
    }
  }

  // Set thumbnail
  async setThumbnail(videoId: string, thumbnailFile: string): Promise<boolean> {
    try {
      const fs = await import('fs');
      const thumbnailContent = fs.readFileSync(thumbnailFile);
      
      const url = `${this.baseUrl}/library/${this.libraryId}/videos/${videoId}/thumbnail`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'AccessKey': this.apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: thumbnailContent,
      });

      return response.ok;
    } catch (error) {
      console.error('Error setting thumbnail:', error);
      return false;
    }
  }

  // Get HLS manifest URL (for multi-resolution streaming)
  getHlsManifestUrl(videoId: string): string {
    return `${this.pullZoneBaseUrl}/${videoId}/playlist.m3u8`;
  }

  // Get MP4 URL
  getMp4Url(videoId: string, resolution?: string): string {
    const res = resolution ? `/${resolution}` : '';
    return `${this.pullZoneBaseUrl}/${videoId}${res}.mp4`;
  }

  // Get video URL (auto-detects best format)
  getVideoUrl(videoId: string): string {
    return `${this.pullZoneBaseUrl}/${videoId}`;
  }

  // Get thumbnail URL
  getThumbnailUrl(videoId: string, thumbnailIndex = 0): string {
    return `${this.pullZoneBaseUrl}/${videoId}/thumbnail/${thumbnailIndex}`;
  }

   // Generate secure token for video access
   generateSecureToken(
     videoId: string,
     userId: string,
     options: {
       expiresIn?: number;
       ipAddress?: string;
       maxPlays?: number;
     } = {}
   ): { tokenId: string; expiresAt: number } {
     const {
       expiresIn = this.securityConfig.defaultExpiry,
       ipAddress,
       maxPlays = this.securityConfig.maxPlaysPerToken,
     } = options;

     const tokenId = crypto.randomBytes(16).toString('hex');
     const expiresAt = Date.now() + expiresIn * 1000;

     const tokenData: VideoTokenData = {
       videoId,
       userId,
       expiresAt,
       maxPlays,
       plays: 0,
       tokenId,
       createdAt: new Date().toISOString(),
     };

     if (ipAddress) tokenData.ip = ipAddress;

     this.tokenStore.set(tokenId, tokenData);
     return { tokenId, expiresAt };
   }

   // Validate token
   validateToken(tokenId: string, ip?: string): VideoTokenData | null {
     const tokenData = this.tokenStore.get(tokenId);
     if (!tokenData) return null;

     if (tokenData.expiresAt < Date.now()) {
       this.tokenStore.delete(tokenId);
       return null;
     }

     if (tokenData.maxPlays > 0 && tokenData.plays >= tokenData.maxPlays) {
       return null;
     }

     if (tokenData.ip && tokenData.ip !== ip) {
       return null;
     }

     tokenData.plays++;
     tokenData.lastAccessed = new Date().toISOString();

     return tokenData;
   }

   // Get secure URL with token
   getSecureVideoUrl(
     videoId: string,
     userId: string,
     options?: {
       expiresIn?: number;
       ipAddress?: string;
       maxPlays?: number;
     }
   ): { url: string; tokenId: string; expiresAt: number } {
     const { tokenId, expiresAt } = this.generateSecureToken(videoId, userId, options);
     
     const separator = this.getVideoUrl(videoId).includes('?') ? '&' : '?';
     const url = `${this.getVideoUrl(videoId)}${separator}token=${tokenId}`;

     return { url, tokenId, expiresAt };
   }

   private mapStatus(statusCode: number): 'pending' | 'processing' | 'completed' | 'failed' {
     switch (statusCode) {
       case 1: return 'pending';
       case 2: return 'processing';
       case 3: return 'completed';
       case 4: return 'failed';
       default: return 'failed'; // Default to failed for unknown status
     }
   }
}

export default new BunnyStreamService();
