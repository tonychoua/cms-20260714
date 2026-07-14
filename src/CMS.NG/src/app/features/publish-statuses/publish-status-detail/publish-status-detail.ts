import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { PublishStatusService } from '../publish-status.service';
import { PublishStatus } from '@core/models/publish-status.model';

@Component({
  selector: 'publish-status-detail',
  imports: [ButtonModule, TagModule],
  templateUrl: './publish-status-detail.html',
  styleUrl: './publish-status-detail.scss',
})
export class PublishStatusDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(PublishStatusService);
  private readonly messages = inject(MessageService);

  readonly status = signal<PublishStatus | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: (status) => {
        this.status.set(status);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: '錯誤', detail: '載入發佈狀態失敗' });
      },
    });
  }

  edit(): void {
    const status = this.status();
    if (status) {
      this.router.navigate(['/publish-statuses', status.pkid, 'edit']);
    }
  }

  back(): void {
    this.router.navigate(['/publish-statuses']);
  }
}
