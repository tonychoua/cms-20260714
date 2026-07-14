import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { CourseGroupService } from '../course-group.service';
import { CourseGroupRequest } from '@core/models/course-group.model';

@Component({
  selector: 'course-group-form',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule],
  templateUrl: './course-group-form.html',
  styleUrl: './course-group-form.scss',
})
export class CourseGroupForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(CourseGroupService);
  private readonly messages = inject(MessageService);

  readonly isEdit = signal(false);
  readonly loading = signal(true);
  readonly saving = signal(false);

  private pkid = 0;

  readonly form = this.fb.group({
    description: ['', [Validators.required, Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit.set(!!id);

    if (id) {
      this.pkid = Number(id);
      this.service.getById(this.pkid).subscribe({
        next: (group) => {
          this.form.patchValue({ description: group.description });
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
    const request: CourseGroupRequest = {
      pkid: this.pkid,
      description: raw.description!,
    };

    this.saving.set(true);
    const op: Observable<unknown> = this.isEdit()
      ? this.service.update(request)
      : this.service.create(request);
    op.subscribe({
      next: (result) => {
        this.saving.set(false);
        this.messages.add({ severity: 'success', summary: '成功', detail: '課程群組已儲存' });
        const pkid = this.isEdit() ? this.pkid : (result as { pkid: number }).pkid;
        this.router.navigate(['/course-groups', pkid]);
      },
      error: () => {
        this.saving.set(false);
        this.messages.add({ severity: 'error', summary: '錯誤', detail: '儲存失敗' });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/course-groups']);
  }

  invalid(control: string): boolean {
    const c = this.form.get(control);
    return !!c && c.invalid && (c.dirty || c.touched);
  }
}
