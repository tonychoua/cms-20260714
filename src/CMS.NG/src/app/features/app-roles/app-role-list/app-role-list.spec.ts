import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AppRoleList } from './app-role-list';
import { AppRoleService } from '../app-role.service';
import { AppRole } from '@core/models/app-role.model';

const ROLES: AppRole[] = [
  { pkid: 1, roleId: 'Admin', roleName: 'Administrator', permissionLevel: 1, description: '系統管理員', userIds: [] },
  { pkid: 2, roleId: 'Editor', roleName: 'Editor', permissionLevel: 50, description: null, userIds: [] },
];

describe('AppRoleList', () => {
  let fixture: ComponentFixture<AppRoleList>;
  let component: AppRoleList;
  let service: jasmine.SpyObj<AppRoleService>;
  let confirm: jasmine.SpyObj<ConfirmationService>;

  beforeEach(async () => {
    sessionStorage.clear();
    service = jasmine.createSpyObj<AppRoleService>('AppRoleService', ['query', 'delete']);
    service.query.and.returnValue(of(ROLES));
    service.delete.and.returnValue(of(void 0));

    confirm = jasmine.createSpyObj<ConfirmationService>('ConfirmationService', ['confirm']);

    await TestBed.configureTestingModule({
      imports: [AppRoleList],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        MessageService,
        { provide: AppRoleService, useValue: service },
        { provide: ConfirmationService, useValue: confirm },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppRoleList);
    component = fixture.componentInstance;
  });

  it('loads roles on init', () => {
    fixture.detectChanges();
    expect(service.query).toHaveBeenCalledTimes(1);
    expect(component.roles().length).toBe(2);
  });

  it('applyFilters persists filters to sessionStorage and reloads', () => {
    fixture.detectChanges();
    component.filters = { keyword: 'admin', permissionLevel: null };
    component.applyFilters();

    expect(JSON.parse(sessionStorage.getItem('app-role-list-filters')!).keyword).toBe('admin');
    expect(service.query).toHaveBeenCalledTimes(2);
    expect(component.drawerVisible()).toBeFalse();
  });

  it('clearFilters resets filters and removes saved state', () => {
    sessionStorage.setItem('app-role-list-filters', JSON.stringify({ keyword: 'x' }));
    fixture.detectChanges();
    component.clearFilters();

    expect(component.filters.keyword).toBeNull();
    expect(sessionStorage.getItem('app-role-list-filters')).toBeNull();
  });

  it('remove confirms then deletes and reloads', () => {
    confirm.confirm.and.callFake((opts) => {
      opts.accept?.();
      return confirm;
    });
    fixture.detectChanges();

    component.remove(ROLES[0]);

    expect(confirm.confirm).toHaveBeenCalled();
    expect(service.delete).toHaveBeenCalledWith('Admin');
    expect(service.query).toHaveBeenCalledTimes(2);
  });

  it('navigates to the edit route', () => {
    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate');
    fixture.detectChanges();

    component.edit(ROLES[1]);

    expect(spy).toHaveBeenCalledWith(['/app-roles', 'Editor', 'edit']);
  });
});
