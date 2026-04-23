import * as BunnyStorageSDK from "@bunny.net/storage-sdk";
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

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
  id: string;
  key: string;
  url: string;
  secureUrl?: string | null;
  size?: number;
  title: string;
  description?: string;
  collection?: string;
  security?: {
    level: string;
    visibility: string;
    requiresAuth: boolean;
  };
  metadata?: Record<string, string>;
  contentType?: string;
  lastModified?: Date;
  etag?: string;
}

interface SecurityConfig {
  defaultExpiry: number;
  maxPlaysPerToken: number;
  tokenCleanupInterval: number;
  cacheTTL: number;
  maxCacheSize: number;
  maxLogSize: number;
  batchFlushSize: number;
  batchFlushInterval: number;
}

interface CacheItem<T> {
  value: T;
  expiry: number;
  createdAt: number;
  accessCount: number;
  lastAccessed?: number;
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

interface SecurityEvent {
  eventType: string;
  timestamp: string;
  [key: string]: unknown;
}

class BunnyStorageService {
  private storageZone: BunnyStorageSDK.StorageZone.StorageZone;
  private pullZoneBaseUrl: string;
  private tokenStore: Map<string, VideoTokenData>;
  private localCache: Map<string, CacheItem<unknown>>;
  private accessLogs: VideoAccessLog[];
  private securityEvents: SecurityEvent[];
  private videoMetadataCache: Map<string, unknown>;
  private cacheStats: { hits: number; misses: number; sets: number };
  private securityConfig: SecurityConfig;

  constructor() {
    this.storageZone = BunnyStorageSDK.zone.connect_with_accesskey(
      BunnyStorageSDK.regions.StorageRegion.Falkenstein,
      process.env.BUNNY_STORAGE_ZONE || 'tutorconnect-videos-bunny',
      process.env.BUNNY_SECRET_KEY || ''
    );
    
    this.pullZoneBaseUrl = (process.env.BUNNY_PULL_ZONE || 'https://your-pullzone.b-cdn.net').replace(/\/$/, '');
    
    this.tokenStore = new Map();
    this.localCache = new Map();
    this.accessLogs = [];
    this.securityEvents = [];
    this.videoMetadataCache = new Map();
    this.cacheStats = { hits: 0, misses: 0, sets: 0 };
    
    this.securityConfig = {
      defaultExpiry: 7200,
      maxPlaysPerToken: 3,
      tokenCleanupInterval: 3600000,
      cacheTTL: 300000,
      maxCacheSize: 1000,
      maxLogSize: 10000,
      batchFlushSize: 100,
      batchFlushInterval: 300000
    };
    
    this.startCleanupSchedulers();
  }

  private startCleanupSchedulers(): void {
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, this.securityConfig.tokenCleanupInterval);

    setInterval(() => {
      this.cleanupExpiredCache();
    }, 600000);

    setInterval(() => {
      this.flushLogs();
    }, this.securityConfig.batchFlushInterval);
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

  private cleanupExpiredCache(): void {
    const now = Date.now();
    let removed = 0;
    for (const [key, item] of this.localCache.entries()) {
      if (item.expiry < now) {
        this.localCache.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      console.log(`Cleaned up ${removed} expired cache items`);
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.accessLogs.length === 0 && this.securityEvents.length === 0) return;

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const logPath = `security/logs/${timestamp}.json`;
      
      const logData = {
        accessLogs: this.accessLogs.slice(0, this.securityConfig.batchFlushSize),
        securityEvents: this.securityEvents.slice(0, this.securityConfig.batchFlushSize),
        flushedAt: new Date().toISOString()
      };

      await this.uploadJson(logPath, logData);
      
      this.accessLogs = this.accessLogs.slice(this.securityConfig.batchFlushSize);
      this.securityEvents = this.securityEvents.slice(this.securityConfig.batchFlushSize);
      
      console.log(`Flushed logs to ${logPath}`);
    } catch (err) {
      console.error('Failed to flush logs:', err);
    }
  }

  private async uploadJson(key: string, data: unknown): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    const encoder = new TextEncoder();
    const bytes = encoder.encode(json);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      }
    });

    await BunnyStorageSDK.file.upload(this.storageZone, key, stream, {
      contentType: 'application/json'
    });
  }

  private setCache(key: string, value: unknown, ttl = this.securityConfig.cacheTTL): void {
    if (this.localCache.size >= this.securityConfig.maxCacheSize) {
      const firstKey = this.localCache.keys().next().value;
      if (firstKey) this.localCache.delete(firstKey);
    }
    
    this.localCache.set(key, {
      value,
      expiry: Date.now() + ttl,
      createdAt: Date.now(),
      accessCount: 0
    });
    
    this.cacheStats.sets++;
  }

  private getCache(key: string): unknown | null {
    const item = this.localCache.get(key);
    if (!item) {
      this.cacheStats.misses++;
      return null;
    }
    
    if (item.expiry < Date.now()) {
      this.localCache.delete(key);
      this.cacheStats.misses++;
      return null;
    }
    
    item.accessCount++;
    item.lastAccessed = Date.now();
    this.cacheStats.hits++;
    return item.value;
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

  async listFiles(path: string): Promise<any[]> {
    const cacheKey = `list:${path}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached as any[];

    const list = await BunnyStorageSDK.file.list(this.storageZone, path);
    this.setCache(cacheKey, list);
    return list;
  }

  async getFileMetadata(path: string): Promise<any> {
    const cacheKey = `metadata:${path}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const metadata = await BunnyStorageSDK.file.get(this.storageZone, path);
    this.setCache(cacheKey, metadata);
    return metadata;
  }

  async uploadFile(
    key: string,
    stream: ReadableStream<Uint8Array>,
    options?: { sha256Checksum?: string; contentType?: string }
  ): Promise<boolean> {
    return await BunnyStorageSDK.file.upload(this.storageZone, key, stream, options);
  }

  async downloadFile(key: string): Promise<{
    stream: ReadableStream<Uint8Array>;
    response: Response;
    length?: number;
  }> {
    return await BunnyStorageSDK.file.download(this.storageZone, key);
  }

  async deleteFile(key: string): Promise<boolean> {
    return await BunnyStorageSDK.file.remove(this.storageZone, key);
  }

  async deleteDirectory(key: string): Promise<boolean> {
    return await BunnyStorageSDK.file.removeDirectory(this.storageZone, key);
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

  logVideoAccess(log: VideoAccessLog): void {
    if (this.accessLogs.length >= this.securityConfig.maxLogSize) {
      this.accessLogs = this.accessLogs.slice(-this.securityConfig.maxLogSize / 2);
    }
    this.accessLogs.push(log);
  }

  logSecurityEvent(event: SecurityEvent): void {
    if (this.securityEvents.length >= this.securityConfig.maxLogSize) {
      this.securityEvents = this.securityEvents.slice(-this.securityConfig.maxLogSize / 2);
    }
    this.securityEvents.push(event);
  }

  clearCache(): void {
    this.localCache.clear();
    this.tokenStore.clear();
    this.accessLogs = [];
    this.securityEvents = [];
    this.videoMetadataCache.clear();
    this.cacheStats = { hits: 0, misses: 0, sets: 0 };
    console.log('All local storage cleared');
  }

  getCacheStats(): { hits: number; misses: number; sets: number } {
    return { ...this.cacheStats };
  }
}

export default new BunnyStorageService();
