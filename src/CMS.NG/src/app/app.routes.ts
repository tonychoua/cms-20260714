import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'app-roles', pathMatch: 'full' },
  {
    path: 'app-roles',
    loadComponent: () =>
      import('@features/app-roles/app-role-list/app-role-list').then((m) => m.AppRoleList),
  },
  {
    path: 'app-roles/new',
    loadComponent: () =>
      import('@features/app-roles/app-role-form/app-role-form').then((m) => m.AppRoleForm),
  },
  {
    path: 'app-roles/:id',
    loadComponent: () =>
      import('@features/app-roles/app-role-detail/app-role-detail').then((m) => m.AppRoleDetail),
  },
  {
    path: 'app-roles/:id/edit',
    loadComponent: () =>
      import('@features/app-roles/app-role-form/app-role-form').then((m) => m.AppRoleForm),
  },
  {
    path: 'course-groups',
    loadComponent: () =>
      import('@features/course-groups/course-group-list/course-group-list').then(
        (m) => m.CourseGroupList,
      ),
  },
  {
    path: 'course-groups/new',
    loadComponent: () =>
      import('@features/course-groups/course-group-form/course-group-form').then(
        (m) => m.CourseGroupForm,
      ),
  },
  {
    path: 'course-groups/:id',
    loadComponent: () =>
      import('@features/course-groups/course-group-detail/course-group-detail').then(
        (m) => m.CourseGroupDetail,
      ),
  },
  {
    path: 'course-groups/:id/edit',
    loadComponent: () =>
      import('@features/course-groups/course-group-form/course-group-form').then(
        (m) => m.CourseGroupForm,
      ),
  },
  { path: '**', redirectTo: 'app-roles' },
];
