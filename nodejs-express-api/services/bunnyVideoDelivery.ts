import * as BunnyStorageSDK from "@bunny.net/storage-sdk";
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface VideoTokenData {
  videoKey: string;
  userId: string;
  expiresAt: number;
  maxPlays: number;
  plays: number;
  ip?: string;
  userAgent?: string;
  tokenId: string;
  createdAt: string;
  lastAccessed?: string;
  lastAccessFrom?: string;
}

interface VideoMetadata {
  Guid: string;
  UserId: string;
  LastChanged: string;
  DateCreated: string;
  StorageZoneName: string;
  Path: string;
  ObjectName: string;
  Length: number;
  StorageZoneId: number;
  IsDirectory: boolean;
  ServerId: number;
  Checksum: string;
  ReplicatedZones: string;
  ContentType: string;
  data: () => Promise<{
    stream: ReadableStream<Uint8Array>;
    response: Response;
    length?: number;
  }>;
}

interface SecurityConfig {
  defaultExpiry: number;
  maxPlaysPerToken: number;
  tokenCleanupInterval: number;
}

interface VideoAccessLog {
  videoKey: string;
  userId: string;
  lessonId: string;
  action: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  tokenId?: string;
  [key: string]: unknown;
}

class BunnyVideoDelivery {
  private storageZone: BunnyStorageSDK.StorageZone.StorageZone;
  private pullZoneBaseUrl: string;
  private tokenStore: Map<string, VideoTokenData>;
  private accessLogs: VideoAccessLog[];
  private securityConfig: SecurityConfig;

  constructor() {
    this.storageZone = BunnyStorageSDK.zone.connect_with_accesskey(
      BunnyStorageSDK.regions.StorageRegion.Falkenstein,
      process.env.BUNNY_STORAGE_ZONE || 'tutorconnect-videos-bunny',
      process.env.BUNNY_SECRET_KEY || ''
    );
    
    this.pullZoneBaseUrl = (process.env.BUNNY_PULL_ZONE || 'https://your-pullzone.b-cdn.net').replace(/\/$/, '');
    this.tokenStore = new Map();
    this.accessLogs = [];
    
    this.securityConfig = {
      defaultExpiry: 7200,
      maxPlaysPerToken: 3,
      tokenCleanupInterval: 3600000,
    };

    this.startCleanupSchedulers();
  }

  private startCleanupSchedulers(): void {
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

  generatePublicUrl(key: string): string {
    return `${this.pullZoneBaseUrl}/${key}`;
  }

  generateSecureUrl(
    s3Key: string,
    userId: string,
    lessonId: string,
    options: {
      expiresIn?: number;
      ipAddress?: string | null;
      userAgent?: string | null;
      maxPlays?: number;
      disableDownload?: boolean;
    } = {}
  ): {
    signedUrl: string;
    tokenId: string;
    expiresAt: number;
    security: {
      ipRestricted: boolean;
      userAgentRestricted: boolean;
      maxPlays: number;
      disableDownload: boolean;
    };
  } {
    const {
      expiresIn = this.securityConfig.defaultExpiry,
      ipAddress = null,
      userAgent = null,
      maxPlays = this.securityConfig.maxPlaysPerToken,
      disableDownload = true
    } = options;

    const tokenId = this.generateVideoAccessToken(s3Key, userId, {
      expiresIn,
      maxPlays,
      ipRestriction: ipAddress,
      userAgentRestriction: userAgent
    });

    const expiresAt = Date.now() + (expiresIn * 1000);
    const publicUrl = this.generatePublicUrl(s3Key);
    
    const separator = publicUrl.includes('?') ? '&' : '?';
    const signedUrl = `${publicUrl}${separator}token=${tokenId}`;

    return {
      signedUrl,
      tokenId,
      expiresAt,
      security: {
        ipRestricted: !!ipAddress,
        userAgentRestricted: !!userAgent,
        maxPlays,
        disableDownload
      }
    };
  }

  private generateVideoAccessToken(
    videoKey: string,
    userId: string,
    options: {
      expiresIn?: number;
      maxPlays?: number;
      ipRestriction?: string | null;
      userAgentRestriction?: string | null;
    } = {}
  ): string {
    const {
      expiresIn = this.securityConfig.defaultExpiry,
      maxPlays = this.securityConfig.maxPlaysPerToken,
      ipRestriction = null,
      userAgentRestriction = null
    } = options;

    const tokenId = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + (expiresIn * 1000);

    const tokenData: VideoTokenData = {
      videoKey,
      userId,
      expiresAt,
      maxPlays,
      plays: 0,
      tokenId,
      createdAt: new Date().toISOString()
    };

    if (ipRestriction) tokenData.ip = ipRestriction;
    if (userAgentRestriction) tokenData.userAgent = userAgentRestriction;

    this.tokenStore.set(tokenId, tokenData);
    return tokenId;
  }

  validateToken(tokenId: string, ip?: string, userAgent?: string): VideoTokenData | null {
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

    if (tokenData.userAgent && tokenData.userAgent !== userAgent) {
      return null;
    }

    tokenData.plays++;
    tokenData.lastAccessed = new Date().toISOString();
    tokenData.lastAccessFrom = ip;

    return tokenData;
  }

  async listFiles(path: string): Promise<any[]> {
    return await BunnyStorageSDK.file.list(this.storageZone, path);
  }

  async getFileMetadata(path: string): Promise<VideoMetadata> {
    return await BunnyStorageSDK.file.get(this.storageZone, path) as VideoMetadata;
  }

  async uploadVideo(
    filePath: string,
    fileName: string,
    options: {
      contentType?: string;
      title?: string;
      description?: string;
      visibility?: string;
    } = {}
  ): Promise<{
    key: string;
    url: string;
    size: number;
  }> {
    const fileBuffer = fs.readFileSync(filePath);
    const uint8Array = new Uint8Array(fileBuffer);
    
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(uint8Array);
        controller.close();
      }
    });

    const success = await BunnyStorageSDK.file.upload(this.storageZone, fileName, stream, {
      contentType: options.contentType || 'video/mp4'
    });

    if (!success) {
      throw new Error('Failed to upload video to Bunny Storage');
    }

    return {
      key: fileName,
      url: this.generatePublicUrl(fileName),
      size: fileBuffer.length
    };
  }

  async deleteVideo(key: string): Promise<boolean> {
    return await BunnyStorageSDK.file.remove(this.storageZone, key);
  }

  async downloadVideo(key: string): Promise<{
    stream: ReadableStream<Uint8Array>;
    response: Response;
    length?: number;
  }> {
    return await BunnyStorageSDK.file.download(this.storageZone, key);
  }

  logVideoAccess(log: VideoAccessLog): void {
    this.accessLogs.push(log);
  }

  getPublicHLSManifestUrl(outputPrefix: string): string {
    return `${this.pullZoneBaseUrl}/${outputPrefix}/hls/master.m3u8`;
  }

  getPublicMP4Url(key: string): string {
    return this.generatePublicUrl(key);
  }
}

export default new BunnyVideoDelivery();
