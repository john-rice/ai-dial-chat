import { Observable, catchError, filter, map, of, throwError } from 'rxjs';

import { FileService } from '@/src/utils/app/data/file-service';
import { ApiUtils } from '@/src/utils/server/api';

import { HTTPMethod } from '@/src/types/http';

interface Result {
  success?: boolean;
  error?: string;
  percent?: number;
}

export class TextFileService {
  public static getFileContent(path: string): Observable<string> {
    return ApiUtils.requestText(path).pipe(
      catchError((error) => {
        console.error(`Failed to get text content from: ${path}`);
        return throwError(() => new Error(error.message));
      }),
    );
  }

  public static updateContent({
    relativePath,
    fileName,
    content,
    contentType,
    bucket,
  }: {
    relativePath: string;
    fileName: string;
    content: string;
    contentType: string;
    bucket?: string;
  }): Observable<Result> {
    const formData = new FormData();
    formData.append(
      'attachments',
      new Blob([content], { type: contentType }),
      fileName,
    );

    return FileService.sendFile(
      formData,
      relativePath,
      fileName,
      HTTPMethod.PUT,
      bucket,
    ).pipe(
      filter(
        ({ result, percent }) =>
          typeof result !== 'undefined' || typeof percent !== 'undefined',
      ),
      map(({ result, percent }) => {
        if (result) {
          return { success: true };
        }

        return { percent };
      }),
      catchError((error) => {
        console.error(`Failed to save file ${fileName}`, error);
        return of({ success: false, error: `Failed save file ${fileName}` });
      }),
    );
  }
}
