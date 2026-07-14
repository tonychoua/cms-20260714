import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { PublishStatusService } from '../publish-status.service';
import { PublishStatusRequest } from '@core/models/publish-status.model';

@Component({
  selector: 'publish-status-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
  ],
  templateUrl: './publish-status-form.html',
  styleUrl: './publish-status-form.scss',
})
export class PublishStatusForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(PublishStatusService);
  private readonly messages = inject(MessageService);

  readonly isEdit = signal(false);
  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    pkid: [
      null as number | null,
      [Validators.required, Validators.min(0), Validators.max(255)],
    ],
    description: ['', [Validators.required, Validators.maxLength(50)]],
    isDraft: [false],
    isPublished: [false],
    isDiscontinued: [false],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit.set(!!id);

    if (id) {
      this.service.getById(Number(id)).subscribe({
        next: (status) => {
          this.form.patchValue({
            pkid: status.pkid,
            description: status.description,
            isDraft: status.isDraft,
            isPublished: status.isPublished,
            isDiscontinued: status.isDiscontinued,
          });
          // pkid is the primary key and immutable in edit mode.
          this.form.controls.pkid.disable();
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.messages.add({ severity: 'error', summary: '錯誤', detail: '載入表單資料失敗' });
        },
      });
    } else {
      this.loading.set(false);
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messages.add({ severity: 'warn', summary: '請檢查欄位', detail: '尚有必填欄位未完成' });
      return;
    }

    const raw = this.form.getRawValue();
    const request: PublishStatusRequest = {
      pkid: raw.pkid!,
      description: raw.description!,
      isDraft: raw.isDraft ?? false,
      isPublished: raw.isPublished ?? false,
      isDiscontinued: raw.isDiscontinued ?? false,
    };

    this.saving.set(true);
    const op: Observable<unknown> = this.isEdit()
      ? this.service.update(request)
      : this.service.create(request);
    op.subscribe({
      next: () => {
        this.saving.set(false);
        this.messages.add({ severity: 'success', summary: '成功', detail: '發佈狀態已儲存' });
        this.router.navigate(['/publish-statuses', request.pkid]);
      },
      error: (err: { status?: number }) => {
        this.saving.set(false);
        const detail = err?.status === 409 ? '狀態代碼已存在' : '儲存失敗';
        this.messages.add({ severity: 'error', summary: '錯誤', detail });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/publish-statuses']);
  }

  invalid(control: string): boolean {
    const c = this.form.get(control);
    return !!c && c.invalid && (c.dirty || c.touched);
  }
}
