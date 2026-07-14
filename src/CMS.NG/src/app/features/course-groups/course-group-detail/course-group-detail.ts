import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { CourseGroupService } from '../course-group.service';
import { CourseGroup } from '@core/models/course-group.model';

@Component({
  selector: 'course-group-detail',
  imports: [ButtonModule],
  templateUrl: './course-group-detail.html',
  styleUrl: './course-group-detail.scss',
})
export class CourseGroupDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(CourseGroupService);
  private readonly messages = inject(MessageService);

  readonly group = signal<CourseGroup | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: (group) => {
        this.group.set(group);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: '錯誤', detail: '載入課程群組失敗' });
      },
    });
  }

  edit(): void {
    const group = this.group();
    if (group) {
      this.router.navigate(['/course-groups', group.pkid, 'edit']);
    }
  }

  back(): void {
    this.router.navigate(['/course-groups']);
  }
}
