import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { PartnerService } from '../partner.service';
import { PartnerRequest } from '@core/models/partner.model';

@Component({
  selector: 'partner-form',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, InputNumberModule],
  templateUrl: './partner-form.html',
  styleUrl: './partner-form.scss',
})
export class PartnerForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(PartnerService);
  private readonly messages = inject(MessageService);

  readonly isEdit = signal(false);
  readonly loading = signal(true);
  readonly saving = signal(false);

  // pkid is IDENTITY — null in add mode (server-generated), disabled+read-only in edit mode.
  readonly form = this.fb.group({
    pkid: [null as number | null],
    name: ['', [Validators.required, Validators.maxLength(50)]],
    appKey: ['', [Validators.required, Validators.maxLength(10)]],
    nameOnPartnerMenu: ['', [Validators.required, Validators.maxLength(200)]],
    nameOnCourseDetailPage: ['', [Validators.required, Validators.maxLength(50)]],
    displayOrder: [0 as number | null, [Validators.required, Validators.min(0)]],
    imageFilename: [null as string | null, [Validators.maxLength(50)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit.set(!!id);

    if (id) {
      this.service.getById(Number(id)).subscribe({
        next: (partner) => {
          this.form.patchValue({
            pkid: partner.pkid,
            name: partner.name,
            appKey: partner.appKey,
            nameOnPartnerMenu: partner.nameOnPartnerMenu,
            nameOnCourseDetailPage: partner.nameOnCourseDetailPage,
            displayOrder: partner.displayOrder,
            imageFilename: partner.imageFilename,
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
    const request: PartnerRequest = {
      pkid: raw.pkid ?? 0, // ignored by the server on create (IDENTITY)
      name: raw.name!,
      appKey: raw.appKey!,
      nameOnPartnerMenu: raw.nameOnPartnerMenu!,
      nameOnCourseDetailPage: raw.nameOnCourseDetailPage!,
      displayOrder: raw.displayOrder ?? 0,
      imageFilename: raw.imageFilename?.trim() ? raw.imageFilename.trim() : null,
    };

    this.saving.set(true);
    const op: Observable<unknown> = this.isEdit()
      ? this.service.update(request)
      : this.service.create(request);
    op.subscribe({
      next: (result) => {
        this.saving.set(false);
        this.messages.add({ severity: 'success', summary: '成功', detail: '合作夥伴已儲存' });
        // On create the new pkid comes back in the response; on update reuse the body pkid.
        const pkid = this.isEdit() ? request.pkid : (result as { pkid: number }).pkid;
        this.router.navigate(['/partners', pkid]);
      },
      error: () => {
        this.saving.set(false);
        this.messages.add({ severity: 'error', summary: '錯誤', detail: '儲存失敗' });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/partners']);
  }

  invalid(control: string): boolean {
    const c = this.form.get(control);
    return !!c && c.invalid && (c.dirty || c.touched);
  }
}
