import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

interface NavItem {
  label: string;
  sublabel?: string;
  icon: string;
  route: string;
}

interface NavGroup {
  label: string;
  sublabel?: string;
  icon: string;
  items: NavItem[];
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastModule, ConfirmDialogModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('CMS');

  // Sidebar navigation. New feature groups/items are added here.
  protected readonly navGroups: NavGroup[] = [
    {
      label: '系統管理',
      sublabel: 'Admin',
      icon: 'pi pi-cog',
      items: [{ label: '角色', sublabel: 'AppRole', icon: 'pi pi-users', route: '/app-roles' }],
    },
    {
      label: '課程管理',
      sublabel: 'Course',
      icon: 'pi pi-book',
      items: [
        {
          label: '課程群組',
          sublabel: 'CourseGroup',
          icon: 'pi pi-sitemap',
          route: '/course-groups',
        },
      ],
    },
  ];
}
