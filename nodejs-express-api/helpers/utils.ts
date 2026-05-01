import moment from "moment";
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { WriteStream } from 'fs';

interface Utils {
  basePath: string;
  writeToLog: (content: string, prefix?: string) => void;
  startsWith: (val: string | number, prefix: string) => boolean;
  isDigits: (val: string) => boolean;
  isNumeric: (n: any) => boolean;
  formatValidationError: (errors: Array<{param: string; msg: string}>) => string[];
  sanitizeInput: (obj: any) => any;
  randomColor: () => string;
  arrRandomColor: (len: number) => string[];
  randomHex: (limit?: number) => string;
  randomStr: (limit?: number, context?: string) => string;
  randomChars: (limit?: number, context?: string) => string;
  randomNum: (length?: number) => string;
  uuid: () => string;
  humanDate: (strdate: string) => string;
  humanDatetime: (strdate: string) => string;
  simpleDatetime: (strdate: string) => string;
  humanTime: (strdate: string) => string;
  relativeDate: (strdate: string) => string;
  sqlToJsDate: (sqlDate: string) => Date;
  strTruncate: (str: string, length: number, join?: string) => string;
  toCurrency: (amount: number, currency?: string) => string;
  strLower: (value?: string) => string;
  strUpper: (value?: string) => string;
  strUcfirst: (value?: string) => string;
  strTitle: (value?: string) => string;
  approximate: (value: number, places?: number) => string;
  toLocale: (value: number) => string;
  dateNow: () => string;
  dateTimeNow: () => string;
  timeNow: () => string;
  timestamp: () => number;
  usercodeHash: (usercodeText: string, hashType?: string) => string;
  usercodeVerify: (usercodeText: string, usercodeHash: string, hashType?: string) => boolean;
  excelAutoWidth: (worksheet: any, minimalWidth?: number) => void;
  asString: (value: string | string[] | undefined | null) => string;
}

const utils: Utils = {
  basePath: '',

  writeToLog(content: string, prefix = ''): void {
    try {
      const todaysDate = new Date().toISOString().slice(0, 10);
      const logFile = fs.createWriteStream(`${utils.basePath}/logs/${prefix}${todaysDate}.log`, { flags: 'a' });
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      logFile.write(`${now} -> ${content}\n`);
    } catch (e) { }
  },

  startsWith(val: string | number, prefix: string): boolean {
    return val.toString().slice(0, prefix.toString().length) == prefix;
  },

  isDigits(val: string): boolean {
    return /^\d+$/.test(val);
  },

  isNumeric(n: any): boolean {
    return !isNaN(parseFloat(n)) && isFinite(n);
  },

  formatValidationError(errors: Array<{param: string; msg: string}>): string[] {
    const errorMsgs: string[] = [];
    errors.forEach(item => errorMsgs.push(item.param + ": " + item.msg));
    return errorMsgs;
  },

  sanitizeInput(obj: any): any {
    const self = this;
    Object.keys(obj).forEach(key => {
      if (Array.isArray(obj[key])) {
        obj[key].map((o: any) => {
          if (typeof o === 'object') {
            self.sanitizeInput(o);
          }
        });
      } else if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
        if (obj[key] === '') {
          obj[key] = null;
        }
      } else if (typeof obj[key] === 'object') {
        self.sanitizeInput(obj[key]);
      }
    });
    return obj;
  },

  randomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  },

  arrRandomColor(len: number): string[] {
    const colors: string[] = [];
    for (let i = 0; i < len; i++) {
      colors.push(this.randomColor());
    }
    return colors;
  },

  randomHex(limit = 16): string {
    return crypto.randomBytes(limit).toString("hex");
  },

  randomStr(limit = 12, context = 'abcdefghijklmnopqrstuvwxyz1234567890'): string {
    let text = '';
    for (let i = 0; i < limit; i++) {
      text += context.charAt(Math.floor(Math.random() * context.length));
    }
    return text;
  },

  randomChars(limit = 12, context = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*_+-='): string {
    let text = '';
    for (let i = 0; i < limit; i++) {
      text += context.charAt(Math.floor(Math.random() * context.length));
    }
    return text;
  },

  randomNum(length = 6): string {
    const randomNum = (Math.pow(10, length).toString().slice(length - 1) + Math.floor((Math.random() * Math.pow(10, length)) + 1).toString()).slice(-length);
    return randomNum;
  },

  uuid(): string {
    const dt = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (dt + Math.random() * 16) % 16 | 0;
      const newDt = Math.floor(dt / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
  },

  humanDate(strdate: string): string {
    return moment(strdate).format('ll');
  },

  humanDatetime(strdate: string): string {
    return moment(strdate).format('llll');
  },

  simpleDatetime(strdate: string): string {
    return moment(strdate).format('MMM Do h:mm');
  },

  humanTime(strdate: string): string {
    return moment(strdate).format('LT');
  },

  relativeDate(strdate: string): string {
    return moment(strdate).fromNow();
  },

  sqlToJsDate(sqlDate: string): Date {
    const sqlDateArr1 = sqlDate.split("-");
    const sYear = sqlDateArr1[0];
    const sMonth = (Number(sqlDateArr1[1]) - 1).toString();
    const sqlDateArr2 = sqlDateArr1[2].split(" ");
    const sDay = sqlDateArr2[0];
    const sqlDateArr3 = sqlDateArr2[1].split(":");
    const sHour = sqlDateArr3[0];
    const sMinute = sqlDateArr3[1];
    const sqlDateArr4 = sqlDateArr3[2].split(".");
    const sSecond = sqlDateArr4[0];
    const sMillisecond = sqlDateArr4[1];
    return new Date(Number(sYear), Number(sMonth), Number(sDay), Number(sHour), Number(sMinute), Number(sSecond), Number(sMillisecond));
  },

  strTruncate(str: string, length: number, join = '...'): string {
    const dots = str.length > length ? join : '';
    return str.substring(0, length) + dots;
  },

  toCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency }).format(amount);
  },

  strLower(value = ''): string {
    return value.toLowerCase();
  },

  strUpper(value = ''): string {
    return value.toUpperCase();
  },

  strUcfirst(value = ''): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  },

  strTitle(value = ''): string {
    return value.replace(
      /\w\S*/g,
      function (txt: string) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  },

  approximate(value: number, places = 2): string {
    return value.toFixed(places);
  },

  toLocale(value: number): string {
    return value.toLocaleString();
  },

  dateNow(): string {
    return moment().format('YYYY-MM-DD');
  },

  dateTimeNow(): string {
    return moment().format('YYYY-MM-DD HH:mm:ss');
  },

  timeNow(): string {
    return moment().format('HH:mm:ss');
  },

  timestamp(): number {
    return Math.floor(new Date().getTime() / 1000);
  },

  asString(value: string | string[] | undefined | null): string {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value[0] || '';
    return value;
  },

  usercodeHash(usercodeText: string, hashType = 'bcrypt'): string {
    if (hashType === 'bcrypt') {
      return bcrypt.hashSync(usercodeText, 10);
    }
    return crypto.createHash('sha256').update(usercodeText).digest('hex');
  },

  usercodeVerify(usercodeText: string, usercodeHash: string, hashType = 'bcrypt'): boolean {
    if (hashType === 'bcrypt') {
      return bcrypt.compareSync(usercodeText, usercodeHash);
    }
    const hash = crypto.createHash('sha256').update(usercodeText).digest('hex');
    return hash === usercodeHash;
  },

  excelAutoWidth(worksheet: any, minimalWidth = 10): void {
    if (!worksheet || !worksheet.columns) return;
    worksheet.columns.forEach((column: any) => {
      if (column.key) {
        column.width = Math.max(minimalWidth, (column.key.length || minimalWidth));
      }
    });
  }
}

export default utils;