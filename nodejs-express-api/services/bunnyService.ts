import * as BunnyStorageSDK from "@bunny.net/storage-sdk";
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import DB from '../models/db.js';

interface StreamVideo {
  guid: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  collectionId?: string;
  previewUrl?: string;
  duration?: number;
  encodeProgress?: number;
}

interface VideoMetadata {
  Guid: string;
  Length: number;
  ContentType: string;
  [key: string]: unknown;
}

interface VideoMetadataStream {
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

const storageZone = BunnyStorageSDK.zone.connect_with_accesskey(
  BunnyStorageSDK.regions.StorageRegion.Falkenstein,
  process.env.BUNNY_STORAGE_ZONE || 'tutorconnect-videos-bunny',
  process.env.BUNNY_SECRET_KEY || ''
);

const apiKey = process.env.BUNNY_API_KEY || '';
const libraryId = process.env.BUNNY_VIDEO_LIBRARY_ID || '';
const streamBaseUrl = (process.env.BUNNY_STREAM_BASE_URL || 'https://video.bunnycdn.com').replace(/\/$/, '');
const pullZoneBaseUrl = (process.env.BUNNY_PULL_ZONE || 'https://vz-8217e52e-f0d.b-cdn.net').replace(/\/$/, '');

function mapStatus(status: number): 'pending' | 'processing' | 'completed' | 'failed' {
  // 0 = available/ready, 1 = pending, 2 = processing, 3 = completed, 4 = failed
  switch (status) {
    case 0: return 'completed';
    case 1: return 'pending';
    case 2: return 'processing';
    case 3: return 'completed';
    case 4: return 'failed';
    default: return 'failed';
  }
}

function getPublicUrl(storagePath: string): string {
  const encodedPath = storagePath.split('/').map(part => encodeURIComponent(part)).join('/');
  return `${pullZoneBaseUrl}/${encodedPath}`;
}

function getStreamUrl(videoId: string): string {
  return `${pullZoneBaseUrl}/${videoId}`;
}

function getThumbnailUrl(videoId: string, thumbnailIndex = 0): string {
  return `${pullZoneBaseUrl}/${videoId}/thumbnail/${thumbnailIndex}`;
}

function makeStreamRequest<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
  const url = `${streamBaseUrl}${endpoint}`;
  const headers: Record<string, string> = { 'AccessKey': apiKey, 'Content-Type': 'application/json' };
  return fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bunny Stream API error: ${response.status} ${errorText}`);
      }
      return await response.json() as T;
    });
}

export default {
  // ==================== STREAM API ====================

  getStreamVideo(videoId: string): Promise<StreamVideo> {
    return makeStreamRequest<Record<string, unknown>>('GET', `/library/${libraryId}/videos/${videoId}`)
      .then((video) => {
        const status = mapStatus(video.status as number);
        if (status === 'failed') {
          const err: any = new Error(`Video has failed status (${video.status})`);
          err.statusCode = video.status;
          throw err;
        }
        return {
          guid: video.guid as string,
          title: video.title as string || 'Untitled',
          status,
          videoUrl: getStreamUrl(videoId),
          thumbnailUrl: getThumbnailUrl(videoId),
        };
      });
  },

  getStreamVideos(page = 1, itemsPerPage = 100) {
    return makeStreamRequest<any>('GET', `/library/${libraryId}/videos?page=${page}&itemsPerPage=${itemsPerPage}`);
  },

  getStreamCollections() {
    return makeStreamRequest<any>('GET', `/library/${libraryId}/collections`);
  },

  createCollection(name: string) {
    return makeStreamRequest('POST', `/library/${libraryId}/collections`, { name });
  },

  updateCollection(guid: string, name: string) {
    return makeStreamRequest('POST', `/library/${libraryId}/collections/${guid}`, { name });
  },

  deleteCollection(guid: string) {
    return makeStreamRequest('DELETE', `/library/${libraryId}/collections/${guid}`);
  },

  assignVideoToCollection(videoId: string, collectionId: string | null) {
    return makeStreamRequest('POST', `/library/${libraryId}/videos/${videoId}`, { collectionId });
  },

  getPublicUrl,
  getThumbnailUrl,

  // ==================== TOKEN/SECURITY ====================

  generateAdvancedToken(urlPath: string, options: any = {}) {
    const pullZoneSecurityKey = process.env.BUNNY_PULL_ZONE_SECURITY_KEY || '';
    if (!pullZoneSecurityKey) {
      console.warn('[BunnyService] Pull Zone Security Key not configured');
      return null;
    }
    const expiresIn = options.expiresIn || 3600;
    const expirationTime = Math.floor(Date.now() / 1000) + expiresIn;
    const signaturePath = options.tokenPath || urlPath;
    
    const hashQueryParams: Record<string, string> = {};
    if (options.countriesAllowed?.length) hashQueryParams.token_countries = options.countriesAllowed.sort().join(',');
    if (options.countriesBlocked?.length) hashQueryParams.token_countries_blocked = options.countriesBlocked.sort().join(',');
    if (options.ignoreParams) hashQueryParams.token_ignore_params = '1';
    if (options.speedLimit) hashQueryParams.limit = options.speedLimit.toString();
    if (options.tokenPath) hashQueryParams.token_path = options.tokenPath;
    Object.entries(options.additionalParams || {}).forEach(([k, v]) => { hashQueryParams[k] = String(v); });

    const sortedKeys = Object.keys(hashQueryParams).sort();
    const encodedQueryString = sortedKeys.map(k => `${k}=${hashQueryParams[k]}`).join('');
    const hashString = pullZoneSecurityKey + signaturePath + expirationTime + (options.userIp || '') + encodedQueryString;
    const hash = crypto.createHash('sha256').update(hashString).digest();
    const token = hash.toString('base64').replace(/\n/g, '').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const urlParams = new URLSearchParams();
    urlParams.append('token', token);
    urlParams.append('expires', expirationTime.toString());
    if (options.tokenPath) urlParams.append('token_path', options.tokenPath);
    Object.keys(hashQueryParams).forEach(k => urlParams.append(k, hashQueryParams[k]));
    return urlParams.toString();
  },

  getStreamUrl,

  // ==================== STORAGE ====================

  uploadToStorage(filePath: string, storagePath: string, contentType = 'video/mp4') {
    const fileBuffer = fs.readFileSync(filePath);
    const uint8Array = new Uint8Array(fileBuffer);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(uint8Array); controller.close(); }
    });
    return BunnyStorageSDK.file.upload(storageZone, storagePath, stream, { contentType }).then((success) => {
      if (!success) throw new Error('Failed to upload to Bunny Storage');
      return { key: storagePath, url: getPublicUrl(storagePath), size: fileBuffer.length };
    });
  },

  deleteFromStorage(storagePath: string) {
    return BunnyStorageSDK.file.remove(storageZone, storagePath).catch((error) => {
      console.error('Error deleting from storage:', error);
      return false;
    });
  },

  getStorageMetadata(storagePath: string) {
    return BunnyStorageSDK.file.get(storageZone, storagePath).then((file) => ({
      Guid: file.guid,
      Length: file.length,
      ContentType: file.contentType,
    } as VideoMetadata));
  },

  listStorageFiles(path: string) {
    return BunnyStorageSDK.file.list(storageZone, path);
  },

  async uploadVideo(
    filePath: string,
    options: { title?: string; useStream?: boolean; storagePath?: string } = {}
  ) {
    if (options.useStream) {
      const stat = fs.statSync(filePath);
      return this.createCollection(options.title || 'Untitled Video').then(async (collection: any) => {
        const video = await this.getStreamVideos().then(() => null).catch(() => null);
        return {
          videoId: (collection as any)?.guid,
          url: getStreamUrl((collection as any)?.guid),
          size: stat.size,
          status: 'processing',
        };
      });
    } else {
      const sp = options.storagePath || `videos/${Date.now()}_${path.basename(filePath)}`;
      return this.uploadToStorage(filePath, sp).then((r) => ({ ...r, status: undefined }));
    }
  },

  // Upload video file to Bunny Stream Library (creates video entry + uploads file)
  uploadToStream(filePath: string, options: { title?: string; description?: string } = {}): Promise<StreamVideo> {
    const fileBuffer = fs.readFileSync(filePath);
    
    // Step 1: Create the video entry in the library
    return makeStreamRequest<{ guid: string }>('POST', `/library/${libraryId}/videos`, {
      title: options.title || 'Untitled Video',
      description: options.description || '',
    }).then((video) => {
      const videoId = video.guid;
      
      // Step 2: Upload the video file using PUT to the video's upload URL
      const uploadUrl = `${streamBaseUrl}/library/${libraryId}/videos/${videoId}`;
      return fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': apiKey,
        },
        body: fileBuffer,
      }).then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to upload video file: ${response.status} ${errorText}`);
        }
        return {
          guid: videoId,
          title: options.title || 'Untitled Video',
          status: 'processing' as const,
          videoUrl: getStreamUrl(videoId),
          thumbnailUrl: getThumbnailUrl(videoId),
        };
      });
    });
  },

  deleteFromStream(videoId: string) {
    return makeStreamRequest('DELETE', `/library/${libraryId}/videos/${videoId}`).then(() => true).catch(() => false);
  },

  deleteVideo(videoId?: string, storagePath?: string) {
    const p: Promise<any>[] = [];
    if (videoId) p.push(this.deleteFromStream(videoId));
    if (storagePath) p.push(this.deleteFromStorage(storagePath).then(() => true));
    return Promise.all(p);
  },

  logAccess(log: any) {
    console.log('Access log:', log);
  },

  // ==================== VIDEO DETAILS ====================
  
  async getVideo(videoId: string): Promise<StreamVideo> {
    const video = await makeStreamRequest<any>('GET', `/library/${libraryId}/videos/${videoId}`);

    return {
      guid: video.guid,
      title: video.title,
      description: video.description,
      status: mapStatus(video.status),
      duration: video.length,
      encodeProgress: video.encodeProgress,
      videoUrl: getStreamUrl(video.guid),
      thumbnailUrl: getThumbnailUrl(video.guid),
    };
  },

  // Add captions to video
  async addCaptions(
    videoId: string,
    options: CaptionsOptions,
    captionFile: string
  ): Promise<boolean> {
    try {
      const captionContent = fs.readFileSync(captionFile);
      
      const url = `${streamBaseUrl}/library/${libraryId}/videos/${videoId}/captions/${options.srclang}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'AccessKey': apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: captionContent,
      });

      return response.ok;
    } catch (error) {
      console.error('Error adding captions:', error);
      return false;
    }
  },

  // Get video statistics
  async getVideoStatistics(
    videoId: string,
    options?: {
      dateFrom?: string;
      dateTo?: string;
      hourly?: boolean;
    }
  ): Promise<VideoStatistics> {
    let endpoint = `/library/${libraryId}/videos/${videoId}/statistics`;
    const params = new URLSearchParams();
    
    if (options?.dateFrom) params.append('dateFrom', options.dateFrom);
    if (options?.dateTo) params.append('dateTo', options.dateTo);
    if (options?.hourly !== undefined) params.append('hourly', String(options.hourly));
    
    const queryString = params.toString();
    if (queryString) endpoint += `?${queryString}`;
  
    return await makeStreamRequest<VideoStatistics>('GET', endpoint);
  },

  // Transcribe video (if supported)
  async transcribeVideo(videoId: string): Promise<boolean> {
    try {
      await makeStreamRequest<void>(
        'POST',
        `/library/${libraryId}/videos/${videoId}/transcribe`
      );
      return true;
    } catch (error) {
      console.error('Error transcribing video:', error);
      return false;
    }
  },

  // Set thumbnail
  async setThumbnail(videoId: string, thumbnailFile: string): Promise<boolean> {
    try {
      const thumbnailContent = fs.readFileSync(thumbnailFile);
      
      const url = `${streamBaseUrl}/library/${libraryId}/videos/${videoId}/thumbnail`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'AccessKey': apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: thumbnailContent,
      });

      return response.ok;
    } catch (error) {
      console.error('Error setting thumbnail:', error);
      return false;
    }
  },

  // Get HLS manifest URL (for multi-resolution streaming)
  getHlsManifestUrl(videoId: string): string {
    return `${pullZoneBaseUrl}/${videoId}/playlist.m3u8`;
  },

  // Get MP4 URL
  getMp4Url(videoId: string, resolution?: string): string {
    const res = resolution ? `/${resolution}` : '';
    return `${pullZoneBaseUrl}/${videoId}${res}.mp4`;
  },

  // Get video URL (auto-detects best format)
  getVideoUrl(videoId: string): string {
    return `${pullZoneBaseUrl}/${videoId}`;
  }
};