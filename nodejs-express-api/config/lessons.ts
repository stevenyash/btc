export interface LessonsConfig {
  s3: {
    maxRetries: number;
    retryDelay: number;
  };
  session: {
    defaultDuration: number;
    maxDuration: number;
  };
  rateLimit: {
    stream: {
      windowMs: number;
      max: number;
    };
    general: {
      windowMs: number;
      max: number;
    };
    upload: {
      windowMs: number;
      max: number;
    };
  };
  upload: {
    maxFileSize: number;
    allowedMimeTypes: string[];
  };
}

const lessonsConfig: LessonsConfig = {
  s3: {
    maxRetries: 3,
    retryDelay: 2000,
  },
  session: {
    defaultDuration: 3600,
    maxDuration: 86400,
  },
  rateLimit: {
    stream: {
      windowMs: 15 * 60 * 1000,
      max: 50,
    },
    general: {
      windowMs: 15 * 60 * 1000,
      max: 200,
    },
    upload: {
      windowMs: 60 * 60 * 1000,
      max: 10,
    },
  },
  upload: {
    maxFileSize: 500 * 1024 * 1024,
    allowedMimeTypes: [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'image/jpeg',
      'image/png',
      'image/gif',
    ],
  },
};

export default lessonsConfig;