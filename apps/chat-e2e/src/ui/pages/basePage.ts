import config from '../../../config/chat.playwright.config';
import { keys } from '../keyboard';

import { API, Attachment, Import } from '@/src/testData';
import { BucketUtil } from '@/src/utils';
import { Page } from '@playwright/test';
import * as fs from 'node:fs';
import path from 'path';
import { Download } from 'playwright-chromium';

export interface UploadDownloadData {
  path: string;
  dataType?: 'download' | 'upload';
}

const apiTimeout = 35000;
export const responseThrottlingTimeout = 2500;

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateToBaseUrl() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async navigateToUrl(url: string) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async openHomePage(
    options?: {
      iconsToBeLoaded?: (string | undefined)[];
      setEntitiesEnvVars?: boolean;
    },
    url?: string,
  ) {
    await this.waitForApiResponsesReceived(
      () => (url ? this.navigateToUrl(url) : this.navigateToBaseUrl()),
      options,
    );
  }

  async waitForIconLoaded<T>(method: () => Promise<T>, iconUrl: string) {
    const iconResponse = this.page.waitForResponse((response) =>
      response.url().includes(iconUrl),
    );
    const result = await method();
    await iconResponse;
    return result;
  }

  async waitForApiResponsesReceived(
    method: () => Promise<void>,
    options?: {
      iconsToBeLoaded?: (string | undefined)[];
      setEntitiesEnvVars?: boolean;
    },
  ) {
    await this.page.route('**', async (route) => route.continue());
    const responses = [];
    const responseBodies = new Map<string, string>();
    const hostsArray = options?.setEntitiesEnvVars
      ? [API.modelsHost, API.addonsHost, API.sessionHost, API.bucketHost]
      : [
          API.bucketHost,
          API.installedDeploymentsHost(),
          API.multipleListingHost(),
        ];
    for (const host of hostsArray) {
      const resp = this.page.waitForResponse(
        (response) =>
          response.url().includes(host) && response.status() === 200,
        { timeout: apiTimeout },
      );
      responses.push(resp);
    }
    if (options?.iconsToBeLoaded) {
      for (const iconHost of options.iconsToBeLoaded) {
        const resp = this.page.waitForResponse(
          (response) =>
            response.url().includes(iconHost!) && response.status() === 200,
          { timeout: apiTimeout },
        );
        responses.push(resp);
      }
    }
    await method();

    for (const resp of responses) {
      const resolvedResp = await resp;
      if (hostsArray) {
        let body;
        try {
          body = await resolvedResp.text();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(
            'Response body not available for call: ',
            resolvedResp.url(),
          );
          throw new Error();
        }
        const host = resolvedResp.url();
        const baseURL = config.use?.baseURL;
        const overlayDomain = process.env.NEXT_PUBLIC_OVERLAY_HOST;
        const apiHost = host
          .replaceAll(baseURL!, '')
          .replaceAll(overlayDomain!, '');
        responseBodies.set(apiHost, body!);
      }
    }
    await this.unRouteAllResponses();
    return responseBodies;
  }

  async throttleAPIResponse(url: string, timeout?: number) {
    await this.page.route(url, async (route) => {
      await new Promise((f) =>
        setTimeout(f, timeout ?? responseThrottlingTimeout),
      );
      await route.continue();
    });
  }

  async unRouteAllResponses() {
    await this.page.unrouteAll({ behavior: 'ignoreErrors' });
  }

  async reloadPage() {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  async bringPageToFront() {
    await this.page.bringToFront();
  }

  async getNewPage<T>(method: () => Promise<T>) {
    let newBrowserTab;
    try {
      [newBrowserTab] = await Promise.all([
        this.page.waitForEvent('popup'),
        method(),
      ]);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Browser page is not loaded: ' + (e as Error).message);
      throw new Error();
    }
    await newBrowserTab?.bringToFront();
    return newBrowserTab;
  }

  async acceptBrowserDialog(message: string) {
    this.page.once('dialog', (dialog) => dialog.accept(message));
  }

  async downloadData<T>(
    method: () => Promise<T>,
    filename?: string,
  ): Promise<UploadDownloadData> {
    const downloadedData = await this.downloadMultipleData(method, 1, filename);
    return downloadedData[0];
  }

  async downloadMultipleData<T>(
    method: () => Promise<T>,
    expectedDownloadsCount: number,
    filename?: string[] | string,
    timeoutMs = 30000,
  ): Promise<UploadDownloadData[]> {
    const downloadedData: UploadDownloadData[] = [];
    const pendingDownloads = new Map<
      string,
      { download: Download; completed: boolean }
    >();
    let downloadCount = 0;

    const receivedDownloads = new Promise<void>((fulfill, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            `Timeout waiting for ${expectedDownloadsCount} downloads. Received ${downloadCount}`,
          ),
        );
      }, timeoutMs);

      const handleDownload = async (download: Download) => {
        try {
          const filenamePath = filename
            ? typeof filename === 'string'
              ? filename
              : filename[downloadCount]
            : download.suggestedFilename();

          const filePath = path.join(Import.exportPath, filenamePath);
          pendingDownloads.set(filenamePath, { download, completed: false });

          await download.saveAs(filePath);
          const fileExists = await fs.promises
            .access(filePath)
            .then(() => true)
            .catch(() => false);

          if (!fileExists) {
            throw new Error(`File ${filenamePath} failed to download`);
          }

          downloadCount++;
          pendingDownloads.get(filenamePath)!.completed = true;
          downloadedData.push({ path: filePath, dataType: 'download' });

          if (downloadCount === expectedDownloadsCount) {
            clearTimeout(timeoutId);
            cleanup();
            fulfill();
          }
        } catch (error) {
          clearTimeout(timeoutId);
          cleanup();
          reject(error);
        }
      };

      const cleanup = () => {
        this.page.removeListener('download', handleDownload);
      };

      this.page.on('download', handleDownload);
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await method();
      await receivedDownloads;
      return downloadedData;
    } catch (error) {
      await Promise.all(
        downloadedData.map((data) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          fs.promises.unlink(data.path).catch(() => {}),
        ),
      );
      throw new Error(`Download failed:`);
    }
  }

  public async uploadData<T>(
    uploadData: UploadDownloadData,
    method: () => Promise<T>,
  ) {
    let directory;
    const dataType = uploadData.dataType;
    switch (dataType) {
      case 'download':
        directory = '';
        break;
      case 'upload':
        directory = Attachment.attachmentPath;
        break;
      default:
        directory = Import.importPath;
    }
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await method();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(directory, uploadData.path));
  }

  public async copyWithKeyboard() {
    await this.page.keyboard.press(keys.ctrlPlusA);
    await this.page.keyboard.press(keys.ctrlPlusC);
  }

  public async pasteFromClipboard() {
    await this.page.keyboard.press(keys.ctrlPlusV);
  }

  public async copyToClipboard(text: string) {
    await this.page.evaluate(
      (text) => navigator.clipboard.writeText(text),
      text,
    );
  }

  public async mockChatImageResponse(
    modelId: string,
    imageName: string,
    options?: { isOverlay: boolean },
  ) {
    await this.page.route(
      options?.isOverlay
        ? `${process.env.NEXT_PUBLIC_OVERLAY_HOST}${API.chatHost}`
        : API.chatHost,
      async (route) => {
        await route.fulfill({
          status: 200,
          body: `{"responseId":"0dea98ff-1e66-4294-8542-457890e5f8c0"}\u0000{"role":"assistant"}\u0000{"custom_content":{"attachments":[{"index":0,"type":"image/jpg","title":"Image","url":"${API.importFilePath(BucketUtil.getBucket(), modelId)}/${imageName}"}]}}\u0000{"content":" "}\u0000{}\u0000`,
        });
      },
    );
  }

  public async mockChatTextResponse(
    responseBody: string,
    options?: { isOverlay: boolean },
  ) {
    await this.page.route(
      options?.isOverlay
        ? `${process.env.NEXT_PUBLIC_OVERLAY_HOST}${API.chatHost}`
        : API.chatHost,
      async (route) => {
        await route.fulfill({
          status: 200,
          body: responseBody,
        });
      },
    );
  }
}
