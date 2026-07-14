import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService } from 'primeng/api';
import { AppRoleService } from '../app-role.service';
import { AppRoleRequest } from '@core/models/app-role.model';

interface UserOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-role-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    MultiSelectModule,
  ],
  templateUrl: './app-role-form.html',
  styleUrl: './app-role-form.scss',
})
export class AppRoleForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(AppRoleService);
  private readonly messages = inject(MessageService);

  readonly isEdit = signal(false);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly userOptions = signal<UserOption[]>([]);

  readonly form = this.fb.group({
    roleId: ['', [Validators.required, Validators.maxLength(200)]],
    roleName: ['', [Validators.required, Validators.maxLength(200)]],
    permissionLevel: [100 as number | null, [Validators.required]],
    description: ['' as string | null, [Validators.maxLength(400)]],
    userIds: [[] as string[]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit.set(!!id);

    forkJoin({
      users: this.service.getAppUsers(),
      role: id ? this.service.getById(id) : of(null),
    }).subscribe({
      next: ({ users, role }) => {
        this.userOptions.set(
          users.map((u) => ({ value: u.userId, label: `${u.userName} (${u.userId})` })),
        );
        if (role) {
          this.form.patchValue({
            roleId: role.roleId,
            roleName: role.roleName,
            permissionLevel: role.permissionLevel,
            description: role.description ?? '',
            userIds: role.userIds,
          });
          // RoleId is the primary key and immutable in edit mode.
          this.form.controls.roleId.disable();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: '錯誤', detail: '載入表單資料失敗' });
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messages.add({ severity: 'warn', summary: '請檢查欄位', detail: '尚有必填欄位未完成' });
      return;
    }

    const raw = this.form.getRawValue();
    const request: AppRoleRequest = {
      roleId: raw.roleId!,
      roleName: raw.roleName!,
      permissionLevel: raw.permissionLevel!,
      description: raw.description || null,
      userIds: raw.userIds ?? [],
    };

    this.saving.set(true);
    const op: Observable<unknown> = this.isEdit()
      ? this.service.update(request)
      : this.service.create(request);
    op.subscribe({
      next: () => {
        this.saving.set(false);
        this.messages.add({ severity: 'success', summary: '成功', detail: '角色已儲存' });
        this.router.navigate(['/app-roles', request.roleId]);
      },
      error: (err: { status?: number }) => {
        this.saving.set(false);
        const detail = err?.status === 409 ? '角色代碼已存在' : '儲存失敗';
        this.messages.add({ severity: 'error', summary: '錯誤', detail });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/app-roles']);
  }

  invalid(control: string): boolean {
    const c = this.form.get(control);
    return !!c && c.invalid && (c.dirty || c.touched);
  }
}
