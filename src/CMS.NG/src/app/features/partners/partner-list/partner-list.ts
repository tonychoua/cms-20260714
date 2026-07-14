import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule, TablePageEvent } from 'primeng/table';
import { SortEvent } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DrawerModule } from 'primeng/drawer';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PartnerService } from '../partner.service';
import { Partner, PartnerQuery } from '@core/models/partner.model';

const FILTERS_KEY = 'partner-list-filters';
const SORT_KEY = 'partner-list-sort';
const PAGE_KEY = 'partner-list-page';

@Component({
  selector: 'partner-list',
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DrawerModule,
    TooltipModule,
  ],
  templateUrl: './partner-list.html',
  styleUrl: './partner-list.scss',
})
export class PartnerList implements OnInit {
  private readonly service = inject(PartnerService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  readonly partners = signal<Partner[]>([]);
  readonly loading = signal(false);
  readonly drawerVisible = signal(false);

  filters: PartnerQuery = { keyword: null };
  sortState: { field: string; order: number } = { field: 'displayOrder', order: 1 };
  pageState: { first: number; rows: number } = { first: 0, rows: 10 };

  ngOnInit(): void {
    this.restoreState();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.query(this.filters).subscribe({
      next: (data) => {
        this.partners.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: '錯誤', detail: '載入合作夥伴清單失敗' });
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
    this.filters = { keyword: null };
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
    this.router.navigate(['/partners/new']);
  }

  view(partner: Partner): void {
    this.router.navigate(['/partners', partner.pkid]);
  }

  edit(partner: Partner): void {
    this.router.navigate(['/partners', partner.pkid, 'edit']);
  }

  remove(partner: Partner): void {
    this.confirm.confirm({
      header: '刪除確認',
      message: `確定要刪除夥伴代碼 <b>${partner.pkid}</b>「${partner.name}」？`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '刪除',
      rejectLabel: '取消',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(partner.pkid).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: '成功', detail: '合作夥伴已刪除' });
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
