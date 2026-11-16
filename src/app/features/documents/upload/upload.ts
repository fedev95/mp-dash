import { Component, ViewChild, inject, signal } from '@angular/core';
import { FileUpload, FileUploadHandlerEvent, FileUploadModule } from 'primeng/fileupload';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { parseMpStatement } from '../../../core/parsers/mp-statement-parser';
import { StatementsService } from '../../../core/services/statements.service';
import { StatementRecord } from '../../../core/models/account-statement.model';
import { formatPeriod } from '../../../core/utils/format-period';
import { DEMO_MODE, SAMPLE_STATEMENTS } from '../../../core/utils/demo';

/** A statement is stored as a single Firestore document, which is capped at 1 MiB. */
const MAX_FILE_SIZE_BYTES = 500 * 1024;
/**
 * ~180 bytes per stored transaction keeps the document well under 1 MiB, leaving room for
 * categories and notes. firestore.rules allows up to 5000 as a hard backstop.
 */
const MAX_TRANSACTIONS = 3000;

interface UploadResult {
  fileName: string;
  status: 'success' | 'error';
  detail: string;
}

@Component({
  selector: 'app-upload',
  imports: [FileUploadModule, MessageModule, CardModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './upload.html',
})
export class Upload {
  private readonly statementsService = inject(StatementsService);
  private readonly confirmationService = inject(ConfirmationService);

  @ViewChild(FileUpload) fileUpload?: FileUpload;

  readonly demoMode = DEMO_MODE;
  readonly sampleStatements = SAMPLE_STATEMENTS;
  readonly maxFileSize = MAX_FILE_SIZE_BYTES;
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
        if (file.size > MAX_FILE_SIZE_BYTES) {
          throw new Error('El archivo supera el tamaño máximo de 500 KB.');
        }
        const text = await file.text();
        const statement = parseMpStatement(text);
        if (statement.transactions.length > MAX_TRANSACTIONS) {
          throw new Error(`El resumen tiene más de ${MAX_TRANSACTIONS} movimientos.`);
        }

        const duplicate = await this.statementsService.findExistingForPeriod(
          statement.transactions[0]?.releaseDate ?? null,
        );
        if (duplicate) {
          const replace = await this.confirmReplace(duplicate);
          if (!replace) {
            outcomes.push({
              fileName: file.name,
              status: 'error',
              detail: `Carga cancelada: ya existe un resumen para ${formatPeriod(duplicate.periodStart)}.`,
            });
            continue;
          }
          await this.statementsService.deleteStatement(duplicate.id);
        }

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

  private confirmReplace(existing: StatementRecord): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmationService.confirm({
        header: 'Reemplazar resumen',
        message: `Ya existe un resumen cargado para ${formatPeriod(existing.periodStart)}. ¿Querés reemplazarlo por este archivo?`,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Reemplazar',
        rejectLabel: 'Cancelar',
        accept: () => resolve(true),
        reject: () => resolve(false),
      });
    });
  }
}
