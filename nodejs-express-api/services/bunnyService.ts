import crypto from 'crypto';
import fs from 'fs';
import bunnyConfig from '../config/bunny.js';

// Interface definitions
export interface StreamVideo {
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

export interface CreateVideoResponse {
  guid: string;
  title: string;
  [key: string]: any;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  page: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface VideoListResponse extends PaginatedResponse<StreamVideo> {
  items: StreamVideo[];
  videos: StreamVideo[];
}

export interface CollectionListResponse extends PaginatedResponse<any> {
  items: any[];
  collections: any[];
}

export interface VideoMetadata {
  Guid: string;
  Length: number;
  ContentType: string;
  [key: string]: unknown;
}

export interface VideoMetadataStream {
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

export interface CaptionsOptions {
  srclang: string;
  label: string;
  language: string;
}

export interface VideoStatistics {
  videoId: string;
  views: Array<{ date: string; count: number }>;
  watchTime: Array<{ date: string; seconds: number }>;
  countries: Array<{ country: string; views: number }>;
  totalViews: number;
  totalWatchTime: number;
}

export interface SecurityConfig {
  defaultExpiry: number;
  maxPlaysPerToken: number;
  tokenCleanupInterval: number;
}

export interface VideoTokenData {
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

// Core API helper
async function bunnyApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${bunnyConfig.streamBaseUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      AccessKey: bunnyConfig.apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bunny API error (${response.status}): ${errorText}`);
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}

// Helper functions
export function mapStatus(status: number): 'pending' | 'processing' | 'completed' | 'failed' {
  switch (status) {
    case 0: return 'completed';
    case 1: return 'pending';
    case 2: return 'processing';
    case 3: return 'completed';
    case 4: return 'failed';
    default: return 'failed';
  }
}

export function getStreamUrl(videoId: string): string {
  return `${bunnyConfig.pullZoneBaseUrl}/${videoId}`;
}

export function getThumbnailUrl(videoId: string, thumbnailIndex = 0): string {
  return `${bunnyConfig.pullZoneBaseUrl}/${videoId}/thumbnail/${thumbnailIndex}`;
}

/**
 * Generate advanced token for secure video URLs
 * Uses HMAC-SHA256 as per Bunny CDN specification:
 * token = "HS256-" + Base64URL(HMAC-SHA256(security_key, signature_path + expires + signing_data + user_ip))
 */
export function generateAdvancedToken(urlPath: string, options: Record<string, any> = {}) {
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
  // signing_data is the query string with & separators, not a flat blob
  const encodedQueryString = sortedKeys.map(k => `${k}=${hashQueryParams[k]}`).join('&');

  // Bunny token algorithm: HMAC-SHA256(security_key, signature_path + expires + user_ip + query_string)
  const userIp = options.userIp || '';
  const message = signaturePath + expirationTime + userIp + encodedQueryString;
  const hmac = crypto.createHmac('sha256', bunnyConfig.pullZoneSecurityKey).update(message).digest();
  const token = hmac.toString('base64').replace(/\n/g, '').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const urlParams = new URLSearchParams();
  urlParams.append('token', `HS256-${token}`);
  urlParams.append('expires', expirationTime.toString());
  Object.keys(hashQueryParams).forEach(k => urlParams.append(k, hashQueryParams[k]));
  return urlParams.toString();
}

/**
 * ==================== LIBRARY OPERATIONS ====================
 */

export async function getLibraryList(page = '1', perPage = '100', search?: string, includeAccessKey = false): Promise<PaginatedResponse> {
  try {
    const params = new URLSearchParams({ page, perPage, includeAccessKey: String(includeAccessKey) });
    if (search) params.set('search', search);
    return await bunnyApiRequest<PaginatedResponse>(`/library?${params.toString()}`);
  } catch (error: any) {
    console.error('Error fetching library list:', error);
    throw new Error(`Bunny Stream API error: ${error.message}`);
  }
}

export async function getSingleLibrary(libraryId: string, includeAccessKey = false) {
  try {
    return await bunnyApiRequest(`/library/${libraryId}?includeAccessKey=${includeAccessKey}`);
  } catch (error: any) {
    console.error(`Error fetching library ${libraryId}:`, error);
    throw new Error(`Failed to get library: ${error.message}`);
  }
}

export async function createLibrary(name: string, regions: string[] = ['A']) {
  try {
    return await bunnyApiRequest('/library', {
      method: 'POST',
      body: JSON.stringify({ name, regions }),
    });
  } catch (error: any) {
    console.error(`Error creating library ${name}:`, error);
    throw new Error(`Failed to create library: ${error.message}`);
  }
}

export async function updateLibrary(libraryId: string, updates: Record<string, any>) {
  try {
    return await bunnyApiRequest(`/library/${libraryId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch (error: any) {
    console.error(`Error updating library ${libraryId}:`, error);
    throw new Error(`Failed to update library: ${error.message}`);
  }
}

export async function deleteLibrary(libraryId: string) {
  try {
    return await bunnyApiRequest(`/library/${libraryId}`, { method: 'DELETE' });
  } catch (error: any) {
    console.error(`Error deleting library ${libraryId}:`, error);
    throw new Error(`Failed to delete library: ${error.message}`);
  }
}

export async function getLanguages() {
  try {
    return await bunnyApiRequest('/languages');
  } catch (error: any) {
    console.error('Error fetching languages:', error);
    throw new Error(`Failed to get languages: ${error.message}`);
  }
}

/**
 * ==================== COLLECTION OPERATIONS ====================
 */

export async function getStreamCollections(page = '1', perPage = '100', search?: string, orderBy = 'date'): Promise<CollectionListResponse> {
  try {
    const params = new URLSearchParams({ page, perPage, orderBy });
    if (search) params.set('search', search);
    return await bunnyApiRequest<CollectionListResponse>(`/library/${bunnyConfig.libraryId}/collections?${params.toString()}`);
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    throw new Error(`Failed to get collections: ${error.message}`);
  }
}

export async function getSingleCollection(collectionId: string) {
  try {
    return await bunnyApiRequest(`/library/${bunnyConfig.libraryId}/collections/${collectionId}`);
  } catch (error: any) {
    console.error(`Error fetching collection ${collectionId}:`, error);
    throw new Error(`Failed to get collection: ${error.message}`);
  }
}

export async function createCollection(name: string) {
  try {
    return await bunnyApiRequest(`/library/${bunnyConfig.libraryId}/collections`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  } catch (error: any) {
    console.error(`Error creating collection ${name}:`, error);
    throw new Error(`Failed to create collection: ${error.message}`);
  }
}

export async function updateCollection(collectionId: string, name: string) {
  try {
    return await bunnyApiRequest(`/library/${bunnyConfig.libraryId}/collections/${collectionId}`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  } catch (error: any) {
    console.error(`Error updating collection ${collectionId}:`, error);
    throw new Error(`Failed to update collection: ${error.message}`);
  }
}

export async function deleteCollection(collectionId: string) {
  try {
    return await bunnyApiRequest(`/library/${bunnyConfig.libraryId}/collections/${collectionId}`, {
      method: 'DELETE',
    });
  } catch (error: any) {
    console.error(`Error deleting collection ${collectionId}:`, error);
    throw new Error(`Failed to delete collection: ${error.message}`);
  }
}

/**
 * ==================== VIDEO OPERATIONS ====================
 */

export async function getStreamVideo(videoId: string): Promise<StreamVideo> {
  try {
    const video = await bunnyApiRequest<Record<string, any>>(
      `/library/${bunnyConfig.libraryId}/videos/${videoId}`
    );
    const status = mapStatus(video.status);
    if (status === 'failed') {
      const err: any = new Error(`Video has failed status (${video.status})`);
      err.statusCode = video.status;
      throw err;
    }
    return {
      guid: video.guid,
      title: video.title || 'Untitled',
      status,
      videoUrl: getStreamUrl(videoId),
      thumbnailUrl: getThumbnailUrl(videoId),
      description: video.description,
      collectionId: video.collectionId,
      duration: video.length,
      encodeProgress: video.encodeProgress,
    };
  } catch (error: any) {
    console.error(`Error fetching video ${videoId}:`, error);
    throw error;
  }
}

export async function getStreamVideos(page = 1, itemsPerPage = 100, search?: string, collectionId?: string, orderBy?: string): Promise<VideoListResponse> {
  try {
    const params = new URLSearchParams({ page: String(page), itemsPerPage: String(itemsPerPage) });
    if (search) params.set('search', search);
    if (collectionId) params.set('collection', collectionId);
    if (orderBy) params.set('orderBy', orderBy);
    return await bunnyApiRequest<VideoListResponse>(`/library/${bunnyConfig.libraryId}/videos?${params.toString()}`);
  } catch (error: any) {
    console.error('Error fetching videos:', error);
    throw new Error(`Failed to get videos: ${error.message}`);
  }
}

export async function getVideo(videoId: string): Promise<StreamVideo> {
  try {
    const video = await bunnyApiRequest<Record<string, any>>(
      `/library/${bunnyConfig.libraryId}/videos/${videoId}`
    );
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
  } catch (error: any) {
    console.error(`Error getting video ${videoId}:`, error);
    throw error;
  }
}

export async function createVideo(title: string, collectionId?: string, thumbnailTime?: string): Promise<CreateVideoResponse> {
  try {
    return await bunnyApiRequest<CreateVideoResponse>(`/library/${bunnyConfig.libraryId}/videos`, {
      method: 'POST',
      body: JSON.stringify({ title, collectionId, thumbnailTime }),
    });
  } catch (error: any) {
    console.error(`Error creating video ${title}:`, error);
    throw new Error(`Failed to create video: ${error.message}`);
  }
}

export async function updateVideo(
  videoId: string,
  title?: string,
  collectionId?: string,
  chapters?: Array<{ title: string; start: number; end: number }>,
  moments?: Array<{ label: string; timestamp: number }>,
  metaTags?: Array<{ property: string; value: string }>
) {
  try {
    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (collectionId !== undefined) updates.collectionId = collectionId;
    if (chapters) updates.chapters = chapters;
    if (moments) updates.moments = moments;
    if (metaTags) updates.metaTags = metaTags;

    return await bunnyApiRequest(`/library/${bunnyConfig.libraryId}/videos/${videoId}`, {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  } catch (error: any) {
    console.error(`Error updating video ${videoId}:`, error);
    throw new Error(`Failed to update video: ${error.message}`);
  }
}

export async function fetchVideo(
  url: string,
  collectionId?: string,
  thumbnailTime?: string,
  headers?: string[]
) {
  try {
    return await bunnyApiRequest(`/library/${bunnyConfig.libraryId}/videos/fetch`, {
      method: 'POST',
      body: JSON.stringify({
        url,
        headers: headers || [],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    } as RequestInit);
  } catch (error: any) {
    console.error('Error fetching video from URL:', error);
    throw new Error(`Failed to fetch video: ${error.message}`);
  }
}

/**
 * Upload video file from filesystem
 */
export async function uploadVideo(filePath: string, options: { title?: string; description?: string } = {}): Promise<StreamVideo> {
  try {
    const fileBuffer = fs.readFileSync(filePath);

    // Step 1: Create the video entry
    const video = await createVideo(options.title || 'Untitled Video');
    const videoId = video.guid;

    // Step 2: Upload the video file using PUT
    const uploadUrl = `${bunnyConfig.streamBaseUrl}/library/${bunnyConfig.libraryId}/videos/${videoId}`;
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        AccessKey: bunnyConfig.apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer,
    });

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
  } catch (error: any) {
    console.error('Error uploading video:', error);
    throw error;
  }
}

export async function uploadToStream(filePath: string, options: { title?: string; description?: string } = {}) {
  return uploadVideo(filePath, options);
}

export async function deleteFromStream(videoId: string) {
  try {
    await bunnyApiRequest(`/library/${bunnyConfig.libraryId}/videos/${videoId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error: any) {
    console.error(`Error deleting video ${videoId}:`, error);
    return false;
  }
}

export async function deleteFromStorage(storagePath: string) {
  try {
    const url = `${bunnyConfig.storageBaseUrl}/${bunnyConfig.storageZoneId}/${encodeURIComponent(storagePath)}`;
    await fetch(url, {
      method: 'DELETE',
      headers: {
        AccessKey: bunnyConfig.apiKey,
        Accept: 'application/json',
      },
    });
    return true;
  } catch (error: any) {
    console.error(`Error deleting storage ${storagePath}:`, error);
    return false;
  }
}

export async function deleteVideo(videoId: string) {
  return deleteFromStream(videoId);
}

export function logAccess(log: any) {
  console.log('Access log:', log);
}

/**
 * ==================== VIDEO DETAILS ====================
 */

export async function addCaptions(
  videoId: string,
  options: CaptionsOptions,
  captionFile: string
): Promise<boolean> {
  try {
    const captionContent = fs.readFileSync(captionFile);
    const url = `${bunnyConfig.streamBaseUrl}/library/${bunnyConfig.libraryId}/videos/${videoId}/captions/${options.srclang}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        AccessKey: bunnyConfig.apiKey,
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

export async function getVideoStatistics(
  videoId: string,
  options?: { dateFrom?: string; dateTo?: string; hourly?: boolean }
): Promise<VideoStatistics> {
  try {
    const params = new URLSearchParams();
    if (options?.dateFrom) params.set('dateFrom', options.dateFrom);
    if (options?.dateTo) params.set('dateTo', options.dateTo);
    if (options?.hourly) params.set('hourly', String(options.hourly));
    const query = params.toString();
    return await bunnyApiRequest(`/library/${bunnyConfig.libraryId}/videos/${videoId}/statistics${query ? `?${query}` : ''}`);
  } catch (error: any) {
    console.error(`Error fetching statistics for video ${videoId}:`, error);
    throw new Error(`Failed to get statistics: ${error.message}`);
  }
}

export async function transcribeVideo(videoId: string): Promise<boolean> {
  try {
    await bunnyApiRequest(`/library/${bunnyConfig.libraryId}/videos/${videoId}/transcribe`, {
      method: 'POST',
    });
    return true;
  } catch (error) {
    console.error('Error transcribing video:', error);
    return false;
  }
}

export async function setThumbnail(videoId: string, thumbnailFile: string): Promise<boolean> {
  try {
    const thumbnailContent = fs.readFileSync(thumbnailFile);
    const url = `${bunnyConfig.streamBaseUrl}/library/${bunnyConfig.libraryId}/videos/${videoId}/thumbnail`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        AccessKey: bunnyConfig.apiKey,
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

/**
 * ==================== URL GENERATION ====================
 */

export function getHlsManifestUrl(videoId: string): string {
  return `${bunnyConfig.pullZoneBaseUrl}/${videoId}/playlist.m3u8`;
}

export function getMp4Url(videoId: string, resolution?: string): string {
  const res = resolution ? `/${resolution}` : '';
  return `${bunnyConfig.pullZoneBaseUrl}/${videoId}${res}.mp4`;
}

export function getVideoUrl(videoId: string): string {
  return `${bunnyConfig.pullZoneBaseUrl}/${videoId}`;
}

export function getPublicUrl(storagePath: string): string {
  return `${bunnyConfig.pullZoneBaseUrl}/${storagePath}`;
}

/**
 * ==================== WATERMARK OPERATIONS ====================
 */

export async function addWatermark(libraryId: string) {
  try {
    return await updateLibrary(libraryId, { EnabledWatermark: true });
  } catch (error: any) {
    console.error(`Error adding watermark to library ${libraryId}:`, error);
    throw new Error(`Failed to add watermark: ${error.message}`);
  }
}

export async function removeWatermark(libraryId: string) {
  try {
    return await updateLibrary(libraryId, { EnabledWatermark: false });
  } catch (error: any) {
    console.error(`Error removing watermark from library ${libraryId}:`, error);
    throw new Error(`Failed to remove watermark: ${error.message}`);
  }
}

/**
 * ==================== REFERER OPERATIONS ====================
 */

export async function addAllowedReferer(hostname: string) {
  try {
    return await bunnyApiRequest(`/library/${bunnyConfig.libraryId}/allowedReferers`, {
      method: 'POST',
      body: JSON.stringify({ Value: hostname }),
    });
  } catch (error: any) {
    console.error(`Error adding allowed referer ${hostname}:`, error);
    throw new Error(`Failed to add allowed referer: ${error.message}`);
  }
}

export async function removeAllowedReferer(hostname: string) {
  try {
    return await bunnyApiRequest(`/library/${bunnyConfig.libraryId}/allowedReferers/${encodeURIComponent(hostname)}`, {
      method: 'DELETE',
    });
  } catch (error: any) {
    console.error(`Error removing allowed referer ${hostname}:`, error);
    throw new Error(`Failed to remove allowed referer: ${error.message}`);
  }
}

export async function addBlockedReferer(hostname: string) {
  try {
    return await bunnyApiRequest(`/library/${bunnyConfig.libraryId}/blockedReferers`, {
      method: 'POST',
      body: JSON.stringify({ Value: hostname }),
    });
  } catch (error: any) {
    console.error(`Error adding blocked referer ${hostname}:`, error);
    throw new Error(`Failed to add blocked referer: ${error.message}`);
  }
}

export async function removeBlockedReferer(hostname: string) {
  try {
    return await bunnyApiRequest(`/library/${bunnyConfig.libraryId}/blockedReferers/${encodeURIComponent(hostname)}`, {
      method: 'DELETE',
    });
  } catch (error: any) {
    console.error(`Error removing blocked referer ${hostname}:`, error);
    throw new Error(`Failed to remove blocked referer: ${error.message}`);
  }
}

/**
 * ==================== TUS UPLOAD OPERATIONS ====================
 * Note: TUS uploads require tus-js-client. Install with: npm install tus
 */

export interface TusUploadOptions {
  file: File | Buffer | ReadableStream;
  videoId: string;
  expirationTime: number;
  title?: string;
  collectionId?: string;
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export async function createTUSUpload(options: TusUploadOptions) {
  try {
    const { default: tus } = await import('tus');

    const hashString = bunnyConfig.libraryId + bunnyConfig.apiKey + options.expirationTime + options.videoId;
    const hash = crypto.createHash('sha256').update(hashString).digest('hex');

    const upload = new tus.Upload(options.file as any, {
      endpoint: `${bunnyConfig.streamBaseUrl.replace('/library', '')}/tusupload`,
      retryDelays: [0, 3000, 5000, 10000, 20000, 60000, 60000],
      headers: {
        AuthorizationSignature: hash,
        AuthorizationExpire: String(options.expirationTime),
        VideoId: options.videoId,
        LibraryId: bunnyConfig.libraryId,
      },
      metadata: {
        filetype: 'video/mp4',
        title: options.title || '',
        collection: options.collectionId || '',
      },
      onError: options.onError || ((error: Error) => console.error('TUS upload error:', error)),
      onProgress: options.onProgress,
      onSuccess: options.onSuccess,
    });

    const previousUploads = await upload.findPreviousUploads();
    if (previousUploads.length > 0) {
      upload.resumeFromPreviousUpload(previousUploads[0]);
    }

    upload.start();
    return upload;
  } catch (error: any) {
    console.error('Error creating TUS upload:', error);
    throw new Error(`Failed to create TUS upload: ${error.message}. Install tus-js-client: npm install tus`);
  }
}

// Default export
export default {
  // Library
  getLibraryList,
  getSingleLibrary,
  createLibrary,
  updateLibrary,
  deleteLibrary,
  getLanguages,

  // Collections
  getStreamCollections,
  getSingleCollection,
  createCollection,
  updateCollection,
  deleteCollection,

  // Videos
  getStreamVideo,
  getStreamVideos,
  getVideo,
  createVideo,
  updateVideo,
  fetchVideo,
  uploadVideo,
  uploadToStream,
  deleteFromStream,
  deleteFromStorage,
  deleteVideo,
  addCaptions,
  setThumbnail,
  getVideoStatistics,
  transcribeVideo,

  // URLs
  getStreamUrl,
  getThumbnailUrl,
  getHlsManifestUrl,
  getMp4Url,
  getVideoUrl,
  getPublicUrl,

  // Token generation
  generateAdvancedToken,

  // Watermark
  addWatermark,
  removeWatermark,

  // Referer
  addAllowedReferer,
  removeAllowedReferer,
  addBlockedReferer,
  removeBlockedReferer,

  // TUS Upload
  createTUSUpload,

  // Legacy
  assignVideoToCollection: (videoId: string, collectionId: string | null) =>
    updateVideo(videoId, undefined, collectionId),

  logAccess,
};
