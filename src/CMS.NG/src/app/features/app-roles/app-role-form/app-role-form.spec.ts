import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AppRoleForm } from './app-role-form';
import { AppRoleService } from '../app-role.service';
import { AppRole, AppUserLookup } from '@core/models/app-role.model';

const USERS: AppUserLookup[] = [
  { userId: 'helen', userName: 'helen' },
  { userId: 'miles', userName: 'Miles Sun' },
];

const ADMIN: AppRole = {
  pkid: 1,
  roleId: 'Admin',
  roleName: 'Administrator',
  permissionLevel: 1,
  description: '系統管理員',
  userIds: ['helen'],
};

function configure(routeId: string | null) {
  const service = jasmine.createSpyObj<AppRoleService>('AppRoleService', [
    'getAppUsers',
    'getById',
    'create',
    'update',
  ]);
  service.getAppUsers.and.returnValue(of(USERS));
  service.getById.and.returnValue(of(ADMIN));
  service.create.and.returnValue(of(ADMIN));
  service.update.and.returnValue(of(void 0));

  TestBed.configureTestingModule({
    imports: [AppRoleForm],
    providers: [
      provideRouter([]),
      provideNoopAnimations(),
      MessageService,
      { provide: AppRoleService, useValue: service },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap(routeId ? { id: routeId } : {}) } },
      },
    ],
  });
  return service;
}

describe('AppRoleForm', () => {
  describe('add mode', () => {
    let fixture: ComponentFixture<AppRoleForm>;
    let component: AppRoleForm;
    let service: jasmine.SpyObj<AppRoleService>;

    beforeEach(() => {
      service = configure(null);
      fixture = TestBed.createComponent(AppRoleForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('starts in add mode with permissionLevel defaulted to 100', () => {
      expect(component.isEdit()).toBeFalse();
      expect(component.form.controls.permissionLevel.value).toBe(100);
      expect(component.form.controls.roleId.enabled).toBeTrue();
    });

    it('populates user options', () => {
      expect(component.userOptions().length).toBe(2);
      expect(component.userOptions()[1].label).toBe('Miles Sun (miles)');
    });

    it('does not submit when required fields are missing', () => {
      component.save();
      expect(service.create).not.toHaveBeenCalled();
    });

    it('creates a role and navigates to its detail page', () => {
      const router = TestBed.inject(Router);
      const nav = spyOn(router, 'navigate');
      component.form.patchValue({ roleId: 'Editor', roleName: 'Editor', permissionLevel: 50 });

      component.save();

      expect(service.create).toHaveBeenCalled();
      const arg = service.create.calls.mostRecent().args[0];
      expect(arg.roleId).toBe('Editor');
      expect(nav).toHaveBeenCalledWith(['/app-roles', 'Editor']);
    });
  });

  describe('edit mode', () => {
    let fixture: ComponentFixture<AppRoleForm>;
    let component: AppRoleForm;
    let service: jasmine.SpyObj<AppRoleService>;

    beforeEach(() => {
      service = configure('Admin');
      fixture = TestBed.createComponent(AppRoleForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('loads the role and disables the RoleId field', () => {
      expect(component.isEdit()).toBeTrue();
      expect(service.getById).toHaveBeenCalledWith('Admin');
      expect(component.form.controls.roleName.value).toBe('Administrator');
      expect(component.form.controls.roleId.disabled).toBeTrue();
      expect(component.form.controls.userIds.value).toEqual(['helen']);
    });

    it('updates the role (RoleId still present via getRawValue) and navigates', () => {
      const router = TestBed.inject(Router);
      const nav = spyOn(router, 'navigate');
      component.form.patchValue({ roleName: 'Super Admin' });

      component.save();

      expect(service.update).toHaveBeenCalled();
      const arg = service.update.calls.mostRecent().args[0];
      expect(arg.roleId).toBe('Admin');
      expect(arg.roleName).toBe('Super Admin');
      expect(nav).toHaveBeenCalledWith(['/app-roles', 'Admin']);
    });
  });
});
