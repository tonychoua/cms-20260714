import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { AppRoleService } from '../app-role.service';
import { AppRole, AppUserLookup } from '@core/models/app-role.model';

@Component({
  selector: 'app-role-detail',
  imports: [ButtonModule, TagModule],
  templateUrl: './app-role-detail.html',
  styleUrl: './app-role-detail.scss',
})
export class AppRoleDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(AppRoleService);
  private readonly messages = inject(MessageService);

  readonly role = signal<AppRole | null>(null);
  readonly userLabels = signal<string[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    forkJoin({
      role: this.service.getById(id),
      users: this.service.getAppUsers(),
    }).subscribe({
      next: ({ role, users }) => {
        this.role.set(role);
        this.userLabels.set(this.mapUserLabels(role.userIds, users));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: '錯誤', detail: '載入角色失敗' });
      },
    });
  }

  edit(): void {
    const role = this.role();
    if (role) {
      this.router.navigate(['/app-roles', role.roleId, 'edit']);
    }
  }

  back(): void {
    this.router.navigate(['/app-roles']);
  }

  private mapUserLabels(userIds: string[], users: AppUserLookup[]): string[] {
    const byId = new Map(users.map((u) => [u.userId, u.userName]));
    return userIds.map((id) => {
      const name = byId.get(id);
      return name ? `${name} (${id})` : id;
    });
  }
}
