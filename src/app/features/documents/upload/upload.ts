import { Component, ViewChild, inject, signal } from '@angular/core';
import { FileUpload, FileUploadHandlerEvent, FileUploadModule } from 'primeng/fileupload';
import { MessageModule } from 'primeng/message';
import { parseMpStatement } from '../../../core/parsers/mp-statement-parser';
import { StatementsService } from '../../../core/services/statements.service';

interface UploadResult {
  fileName: string;
  status: 'success' | 'error';
  detail: string;
}

@Component({
  selector: 'app-upload',
  imports: [FileUploadModule, MessageModule],
  templateUrl: './upload.html',
})
export class Upload {
  private readonly statementsService = inject(StatementsService);

  @ViewChild(FileUpload) fileUpload?: FileUpload;

  readonly uploading = signal(false);
  readonly results = signal<UploadResult[]>([]);

  /** Clears stale results when the user starts a new selection. */
  onSelect(): void {
    this.results.set([]);
  }

  async onConfirmUpload(event: FileUploadHandlerEvent): Promise<void> {
    this.uploading.set(true);
    const outcomes: UploadResult[] = [];

    for (const file of event.files) {
      try {
        if (!file.name.toLowerCase().endsWith('.csv')) {
          throw new Error('Solo se admiten archivos .csv.');
        }
        const text = await file.text();
        const statement = parseMpStatement(text);
        await this.statementsService.uploadStatement(file.name, statement);
        outcomes.push({
          fileName: file.name,
          status: 'success',
          detail: `${statement.transactions.length} movimientos cargados.`,
        });
      } catch (err) {
        outcomes.push({
          fileName: file.name,
          status: 'error',
          detail: err instanceof Error ? err.message : 'Ocurrió un error inesperado.',
        });
      }
    }

    this.results.set(outcomes);
    this.uploading.set(false);
    this.fileUpload?.clear();
  }
}
