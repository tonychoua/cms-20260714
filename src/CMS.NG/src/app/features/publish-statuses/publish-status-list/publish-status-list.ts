import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule, TablePageEvent } from 'primeng/table';
import { SortEvent } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DrawerModule } from 'primeng/drawer';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PublishStatusService } from '../publish-status.service';
import { PublishStatus, PublishStatusQuery } from '@core/models/publish-status.model';

const FILTERS_KEY = 'publish-status-list-filters';
const SORT_KEY = 'publish-status-list-sort';
const PAGE_KEY = 'publish-status-list-page';

interface TriState {
  label: string;
  value: boolean | null;
}

@Component({
  selector: 'publish-status-list',
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    DrawerModule,
    TooltipModule,
  ],
  templateUrl: './publish-status-list.html',
  styleUrl: './publish-status-list.scss',
})
export class PublishStatusList implements OnInit {
  private readonly service = inject(PublishStatusService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  readonly statuses = signal<PublishStatus[]>([]);
  readonly loading = signal(false);
  readonly drawerVisible = signal(false);

  readonly triStateOptions: TriState[] = [
    { label: '全部', value: null },
    { label: '是', value: true },
    { label: '否', value: false },
  ];

  filters: PublishStatusQuery = {
    keyword: null,
    isDraft: null,
    isPublished: null,
    isDiscontinued: null,
  };
  sortState: { field: string; order: number } = { field: 'pkid', order: 1 };
  pageState: { first: number; rows: number } = { first: 0, rows: 10 };

  ngOnInit(): void {
    this.restoreState();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.query(this.filters).subscribe({
      next: (data) => {
        this.statuses.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: '錯誤', detail: '載入發佈狀態清單失敗' });
      },
    });
  }

  applyFilters(): void {
    sessionStorage.setItem(FILTERS_KEY, JSON.stringify(this.filters));
    this.pageState.first = 0;
    this.persistPage();
    this.drawerVisible.set(false);
    this.load();
  }

  clearFilters(): void {
    this.filters = { keyword: null, isDraft: null, isPublished: null, isDiscontinued: null };
    sessionStorage.removeItem(FILTERS_KEY);
    this.pageState.first = 0;
    this.persistPage();
    this.load();
  }

  onSort(event: SortEvent): void {
    this.sortState = { field: event.field as string, order: event.order ?? 1 };
    sessionStorage.setItem(SORT_KEY, JSON.stringify(this.sortState));
  }

  onPage(event: TablePageEvent): void {
    this.pageState = { first: event.first, rows: event.rows };
    this.persistPage();
  }

  add(): void {
    this.router.navigate(['/publish-statuses/new']);
  }

  view(status: PublishStatus): void {
    this.router.navigate(['/publish-statuses', status.pkid]);
  }

  edit(status: PublishStatus): void {
    this.router.navigate(['/publish-statuses', status.pkid, 'edit']);
  }

  remove(status: PublishStatus): void {
    this.confirm.confirm({
      header: '刪除確認',
      message: `確定要刪除發佈狀態 <b>${status.pkid}</b>「${status.description}」？`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '刪除',
      rejectLabel: '取消',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(status.pkid).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: '成功', detail: '發佈狀態已刪除' });
            this.load();
          },
          error: () =>
            this.messages.add({ severity: 'error', summary: '錯誤', detail: '刪除失敗' }),
        });
      },
    });
  }

  private restoreState(): void {
    const filters = sessionStorage.getItem(FILTERS_KEY);
    if (filters) {
      try {
        this.filters = JSON.parse(filters);
      } catch {
        /* ignore malformed state */
      }
    }
    const sort = sessionStorage.getItem(SORT_KEY);
    if (sort) {
      try {
        this.sortState = JSON.parse(sort);
      } catch {
        /* ignore */
      }
    }
    const page = sessionStorage.getItem(PAGE_KEY);
    if (page) {
      try {
        this.pageState = JSON.parse(page);
      } catch {
        /* ignore */
      }
    }
  }

  private persistPage(): void {
    sessionStorage.setItem(PAGE_KEY, JSON.stringify(this.pageState));
  }
}
