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
import { CourseGroupService } from '../course-group.service';
import { CourseGroup, CourseGroupQuery } from '@core/models/course-group.model';

const FILTERS_KEY = 'course-group-list-filters';
const SORT_KEY = 'course-group-list-sort';
const PAGE_KEY = 'course-group-list-page';

@Component({
  selector: 'course-group-list',
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DrawerModule,
    TooltipModule,
  ],
  templateUrl: './course-group-list.html',
  styleUrl: './course-group-list.scss',
})
export class CourseGroupList implements OnInit {
  private readonly service = inject(CourseGroupService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  readonly groups = signal<CourseGroup[]>([]);
  readonly loading = signal(false);
  readonly drawerVisible = signal(false);

  filters: CourseGroupQuery = { keyword: null };
  sortState: { field: string; order: number } = { field: 'pkid', order: -1 };
  pageState: { first: number; rows: number } = { first: 0, rows: 10 };

  ngOnInit(): void {
    this.restoreState();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.query(this.filters).subscribe({
      next: (data) => {
        this.groups.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: '錯誤', detail: '載入課程群組清單失敗' });
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
    this.router.navigate(['/course-groups/new']);
  }

  view(group: CourseGroup): void {
    this.router.navigate(['/course-groups', group.pkid]);
  }

  edit(group: CourseGroup): void {
    this.router.navigate(['/course-groups', group.pkid, 'edit']);
  }

  remove(group: CourseGroup): void {
    this.confirm.confirm({
      header: '刪除確認',
      message: `確定要刪除群組代碼 <b>${group.pkid}</b>「${group.description}」？`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '刪除',
      rejectLabel: '取消',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(group.pkid).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: '成功', detail: '課程群組已刪除' });
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
