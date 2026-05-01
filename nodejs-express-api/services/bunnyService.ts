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
}

interface VideoMetadata {
  Guid: string;
  Length: number;
  ContentType: string;
  [key: string]: unknown;
}

const storageZone = BunnyStorageSDK.zone.connect_with_accesskey(
  BunnyStorageSDK.regions.StorageRegion.Falkenstein,
  process.env.BUNNY_STORAGE_ZONE || 'tutorconnect-videos-bunny',
  process.env.BUNNY_SECRET_KEY || ''
);

const apiKey = process.env.BUNNY_API_KEY || 'd14fe46f-d0f5-45c7-b90dd58bf1e0-d37b-4134';
const libraryId = process.env.BUNNY_VIDEO_LIBRARY_ID || '644183';
const streamBaseUrl = process.env.BUNNY_STREAM_BASE_URL || 'https://video.bunnycdn.com';
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

  deleteVideo(videoId?: string, storagePath?: string) {
    const p: Promise<any>[] = [];
    if (videoId) p.push(this.deleteFromStream(videoId));
    if (storagePath) p.push(this.deleteFromStorage(storagePath).then(() => true));
    return Promise.all(p);
  },

  deleteFromStream(videoId: string) {
    return makeStreamRequest('DELETE', `/library/${libraryId}/videos/${videoId}`).then(() => true).catch(() => false);
  },

  logAccess(log: any) {
    console.log('Access log:', log);
  },
};
