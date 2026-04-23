import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';
import mimetype from 'mime-types';

const publicDir = process.env.APP_PUBLIC_DIR || 'assets';
const tempDir = process.env.UPLOAD_TEMP_DIR || 'uploads/temp/';

// Upload configuration by fieldname
const uploadConfigs: Record<string, any> = {
  importdata: {
    filenameType: 'timestamp',
    extensions: 'csv',
    limit: '10',
    maxFileSize: '3',
    returnFullpath: false,
    filenamePrefix: '',
    uploadDir: 'uploads/files/',
  },
  image: {
    filenameType: 'random',
    extensions: 'jpg,png,gif,jpeg',
    limit: '1',
    maxFileSize: process.env.UPLOAD_MAX_FILE_SIZE || '5000',
    returnFullpath: false,
    filenamePrefix: '',
    uploadDir: 'uploads/files',
    imageResize: [
      { name: 'small', width: 100, height: 100, mode: 'cover' },
      { name: 'medium', width: 480, height: 480, mode: 'inside' },
      { name: 'large', width: 1024, height: 760, mode: 'inside' },
    ],
  },
  thumbnail_url: {
    filenameType: 'random',
    extensions: 'jpg,png,gif,jpeg',
    limit: '1',
    maxFileSize: '3',
    returnFullpath: false,
    filenamePrefix: '',
    uploadDir: 'uploads/files/thumbnails',
    imageResize: [
      { name: 'small', width: 100, height: 100, mode: 'cover' },
      { name: 'medium', width: 480, height: 480, mode: 'inside' },
      { name: 'large', width: 1024, height: 760, mode: 'inside' },
    ],
  },
  video: {
    filenameType: 'random',
    extensions: 'mp4,mov,avi,mkv,webm',
    limit: '1',
    maxFileSize: process.env.UPLOAD_MAX_FILE_SIZE || '5000',
    returnFullpath: false,
    filenamePrefix: 'video_',
    uploadDir: 'uploads/videos',
  },
  file: {
    filenameType: 'original',
    extensions: 'mp3,mp4,webm,wav,avi,mpg,mpeg',
    limit: '1',
    maxFileSize: process.env.UPLOAD_MAX_FILE_SIZE || '5000',
    returnFullpath: false,
    filenamePrefix: '',
    uploadDir: 'uploads/files/videos',
  },
};

interface FileInfo {
  filepath: string | null;
  fileurl: string | null;
  filename: string | null;
  filetype: string | null;
  filesize: string | null;
  fileext: string | null;
}

interface UploadSettings {
  uploadDir?: string;
  returnFullpath?: boolean;
  imageResize?: Array<{ name: string; width?: number; height?: number; mode?: string }>;
  filenameType?: string;
  filenamePrefix?: string;
  extensions?: string;
  maxFileSize?: string;
  maxFiles?: number;
}

interface FileObject {
  originalname: string;
  fieldname: string;
}

class FileUploader {
  uploadSettings: UploadSettings = {};

  moveUploadedFiles(tempFilePaths: string | string[], fieldname: string): FileInfo {
    console.log("moveUploadedFiles", tempFilePaths, fieldname);

    let fileInfo: FileInfo = {
      filepath: null,
      fileurl: null,
      filename: null,
      filetype: null,
      filesize: null,
      fileext: null
    };

    if (tempFilePaths && fieldname) {
      this.uploadSettings = uploadConfigs[fieldname] || {};
      console.log("uploadSettings", this.uploadSettings);

      let arrFiles: string[] = [];

      if (Array.isArray(tempFilePaths)) {
        arrFiles = tempFilePaths;
      } else {
        arrFiles = tempFilePaths.toString().split(",");
      }

      if (arrFiles.length) {
        let uploadedFilePaths: Array<{ filepath: string; fileurl: string }> = [];

        arrFiles.forEach(file => {
          if (file.indexOf(tempDir) > -1) {
            let tmpFile = path.join(publicDir, file);
            if (fs.existsSync(tmpFile)) {
              const filePathDetail = this.moveFile(tmpFile);
              uploadedFilePaths.push(filePathDetail);
            }
          } else {
            const filePathDetail = { fileurl: file, filepath: file };
            uploadedFilePaths.push(filePathDetail);
          }
        });

        if (this.uploadSettings.returnFullpath) {
          fileInfo.filepath = uploadedFilePaths.map(v => v.fileurl).join(",");
        } else {
          fileInfo.filepath = uploadedFilePaths.map(v => v.filepath).join(",");
        }

        if (uploadedFilePaths.length) {
          const filepath = uploadedFilePaths[0].filepath;
          let fileFullName = path.join(publicDir, filepath);
          if (fs.existsSync(fileFullName)) {
            fileInfo.filesize = String(fs.statSync(fileFullName).size);
            fileInfo.filename = path.basename(fileFullName) || '';
            fileInfo.filetype = mimetype.contentType(fileFullName) || '';
            fileInfo.fileext = mimetype.extension(fileInfo.filetype) || '';
          }
        }
      }
    }

    return fileInfo;
  }

  moveFile(filePath: string): { filepath: string; fileurl: string } {
    let fileName = path.basename(filePath);
    let newFile = path.join(publicDir, (this.uploadSettings.uploadDir || ''), fileName);
    fs.renameSync(filePath, newFile);

    if (this.isImage(newFile)) {
      this.resizeImage(newFile);
    }

    let filepath = path.join(this.uploadSettings.uploadDir || '', fileName);
    filepath = filepath.replace(/\\/g, "/");

    let fileurl = (process.env.APP_URL || 'http://localhost:8060') + filepath;
    return { filepath, fileurl };
  }

  isImage(file: string): boolean {
    const imgExtensions = ["jpg", "png", "gif", "jpeg"];
    let fileExt = path.extname(file).substr(1).toLowerCase();
    return imgExtensions.includes(fileExt);
  }

  resizeImage(filePath: string): void {
    let resizeSettings = this.uploadSettings.imageResize || [];

    resizeSettings.forEach(resize => {
      let fileName = path.basename(filePath);
      var uploadDir = this.uploadSettings.uploadDir || '';
      let newFileDir = path.join(publicDir, uploadDir, resize.name);

      if (!fs.existsSync(newFileDir)) {
        fs.mkdirSync(newFileDir, { recursive: true });
      }

      let newFileName = path.join(newFileDir, fileName);
      let mode = resize.mode || "cover";

      let size: any = { fit: mode };

      if (resize.width) {
        size['width'] = resize.width;
      }
      if (resize.height) {
        size['height'] = resize.height;
      }

      sharp(filePath).resize(size).toFile(newFileName).then(function (newFileInfo) {
        // Success
      }).catch(function (err) {
        console.error("Image Resize Error occured", err);
      });
    });
  }

  async deleteRecordFiles(filePath: string, fieldname: string): Promise<void> {
    try {
      let filesToBeDeleted = filePath.split(",");
      let imgThumbDirs = ["small", "medium", "large"];
      let uploadSettings = uploadConfigs[fieldname];

      if (uploadSettings && uploadSettings.imageResize) {
        imgThumbDirs = uploadSettings.imageResize.map((a: any) => a.name);
      }

      let imgExts = ["jpg", "png", "jpeg"];

      filesToBeDeleted.forEach(async (file) => {
        let fullPath = "assets/" + file;
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          let fileExt = path.extname(fullPath).substr(1).toLowerCase();
          if (imgExts.includes(fileExt)) {
            imgThumbDirs.forEach(async (thumbDir) => {
              let paths = fullPath.split("/");
              let lastpath = paths.length - 1;
              paths.splice(lastpath, 0, thumbDir);
              let thumbFullPath = paths.join("/");
              if (fs.existsSync(thumbFullPath)) {
                fs.unlinkSync(thumbFullPath);
              }
            });
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  }

  removeTempFile(tempFilePath: string): void {
    const tmpDir = (config as any).upload.tempDir;
    const filename = path.basename(tempFilePath);
    let fullname = path.join(publicDir, tmpDir, filename);
    if (fs.existsSync(fullname)) {
      fs.unlinkSync(fullname);
    }
  }

  getFileName(file: FileObject): string {
    let newFilename = "";
    const filenameType = this.uploadSettings.filenameType || 'random';

    if (filenameType == 'date') {
      newFilename = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/\:/g, '-');
    } else if (filenameType == 'timestamp') {
      const ticks = Number(new Date());
      newFilename = Math.floor(ticks / 1000).toString();
    } else if (filenameType == 'original') {
      newFilename = path.parse(file.originalname).name;
    } else {
      newFilename = crypto.randomBytes(16).toString("hex");
    }

    const filenamePrefix = this.uploadSettings.filenamePrefix || '';
    const fileExt = path.extname(file.originalname).substring(1).toLowerCase();
    newFilename = `${filenamePrefix}${newFilename}.${fileExt}`;
    return newFilename;
  }

  isAllowedExt(file: FileObject): boolean {
    if (this.uploadSettings.extensions) {
      const fileExt = path.extname(file.originalname).substring(1).toLowerCase();
      const allowed = this.uploadSettings.extensions.replace(/\s/g, '').split(',');
      return allowed.includes(fileExt);
    }
    return true;
  }

  upload(fieldName: string): any {
    this.uploadSettings = (config as any).upload[fieldName];

    const storage = multer.diskStorage({
      destination: (req, file, callback) => {
        const dir = path.join(publicDir, tempDir);
        callback(null, dir);
      },
      filename: (req, file, callback) => {
        const newFilename = this.getFileName(file);
        callback(null, newFilename);
      }
    });

    const upload = multer({
      storage: storage,
      fileFilter: (req, file, callback) => {
        if (!this.isAllowedExt(file)) {
          return callback(new Error('file extension not allowed'));
        }
        callback(null, true);
      },
      limits: {
        fileSize: Number(this.uploadSettings.maxFileSize) * 1024 * 1024,
        files: Number(this.uploadSettings.maxFiles)
      }
    });

    return upload;
  }
}

const uploader = new FileUploader();
export default uploader;