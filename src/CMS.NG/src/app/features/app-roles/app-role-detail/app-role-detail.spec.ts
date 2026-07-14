import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AppRoleDetail } from './app-role-detail';
import { AppRoleService } from '../app-role.service';
import { AppRole, AppUserLookup } from '@core/models/app-role.model';

const USERS: AppUserLookup[] = [
  { userId: 'helen', userName: 'helen' },
  { userId: 'miles', userName: 'Miles Sun' },
];

const ROLE: AppRole = {
  pkid: 1,
  roleId: 'Admin',
  roleName: 'Administrator',
  permissionLevel: 1,
  description: '系統管理員',
  userIds: ['helen', 'miles'],
};

describe('AppRoleDetail', () => {
  let fixture: ComponentFixture<AppRoleDetail>;
  let component: AppRoleDetail;
  let service: jasmine.SpyObj<AppRoleService>;

  beforeEach(() => {
    service = jasmine.createSpyObj<AppRoleService>('AppRoleService', ['getById', 'getAppUsers']);
    service.getById.and.returnValue(of(ROLE));
    service.getAppUsers.and.returnValue(of(USERS));

    TestBed.configureTestingModule({
      imports: [AppRoleDetail],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        MessageService,
        { provide: AppRoleService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'Admin' }) } },
        },
      ],
    });

    fixture = TestBed.createComponent(AppRoleDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the role by id from the route', () => {
    expect(service.getById).toHaveBeenCalledWith('Admin');
    expect(component.role()?.roleName).toBe('Administrator');
  });

  it('maps assigned userIds to "userName (userId)" labels', () => {
    expect(component.userLabels()).toEqual(['helen (helen)', 'Miles Sun (miles)']);
  });

  it('navigates to the edit route', () => {
    const router = TestBed.inject(Router);
    const nav = spyOn(router, 'navigate');
    component.edit();
    expect(nav).toHaveBeenCalledWith(['/app-roles', 'Admin', 'edit']);
  });
});
