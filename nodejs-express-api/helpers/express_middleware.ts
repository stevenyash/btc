import { Response, Request } from 'express';
import { launch, Browser, Page } from 'puppeteer';
import { RecordNotFound, BadRequest, AccessForbbiden, UnauthorizedAccess, ServerError } from "./constants.js";
import writeToDBLog from './auditlog.js';
import sanitizeInput from './sanitizeinput.js';

let browserPage: Page | null = null;

interface CustomResponse extends Response {
  ok: (message: unknown) => Response;
  notFound: (message?: string) => Response;
  badRequest: (message?: string) => Response;
  forbidden: (message?: string) => Response;
  unauthorized: (message?: string) => Response;
  serverError: (message: unknown) => Response;
  generatePdf: (html: string, fileName: string, puppeteerConfig?: unknown, mediaType?: string) => Promise<Response>;
}

interface CustomRequest extends Request {
  formData?: unknown;
  writeToAuditLog?: (record: unknown) => void;
}

export default function expressMiddleware(app: { use: (fn: (req: CustomRequest, res: CustomResponse, next: () => void) => void) => void; response: unknown; request: unknown }) {
  app.use((req: CustomRequest, res: CustomResponse, next: () => void) => {
    if (req.body) {
      req.formData = req.body;
      sanitizeInput(req.body);
    }
    next();
  });

  (app.response as Record<string, unknown>).ok = function (message: unknown) {
    return this.send(message);
  };

  (app.response as Record<string, unknown>).notFound = function (message?: string) {
    message = message || RecordNotFound;
    return this.status(404).send(message);
  };

  (app.response as Record<string, unknown>).badRequest = function (message?: string) {
    message = message || BadRequest;
    return this.status(400).send(message);
  };

  (app.response as Record<string, unknown>).forbidden = function (message?: string) {
    message = message || AccessForbbiden;
    return this.status(403).send(message);
  };

  (app.response as Record<string, unknown>).unauthorized = function (message?: string) {
    message = message || UnauthorizedAccess;
    return this.status(401).send(message);
  };

  (app.response as Record<string, unknown>).serverError = function (message: unknown) {
    console.log("\n\n-------------------------- Exception Stack Trace --------------------------\n\n");
    console.error("Server Request Error", message);
    console.log("\n\n-------------------------- End of Exception Stack Trace --------------------------\n\n");
    return this.status(500).send(ServerError);
  };

  (app.response as Record<string, unknown>).generatePdf = async function (this: CustomResponse, html: string, fileName: string, puppeteerConfig?: unknown, mediaType = 'screen') {
    const browser: Browser = await launch({ headless: true });
    const pages = await browser.pages();

    browserPage = pages.length ? pages[0] : await browser.newPage();

    try {
      await browserPage.setContent(html, { waitUntil: 'domcontentloaded' });
      if (mediaType) {
        await browserPage.emulateMediaType(mediaType);
      }

      const pdf = await browserPage.pdf(puppeteerConfig as object);
      await browserPage.close();
      await browser.close();

      this.attachment(`${fileName}.pdf`);
      this.contentType("application/pdf");
      return this.send(pdf);
    } catch (err) {
      console.error((err as Error).message);
    } finally {
      await browserPage?.close().catch((err) => console.error((err as Error).message));
      await browser?.close().catch((err) => console.error((err as Error).message));
    }

    return this.status(500).send("Error generating pdf..");
  };

  (app.request as Record<string, unknown>).writeToAuditLog = function (this: CustomRequest, record: unknown) {
    writeToDBLog(this as Request, record);
  };
}