import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AppRoleService } from './app-role.service';
import { environment } from '@env';
import { AppRole, AppRoleRequest } from '@core/models/app-role.model';

describe('AppRoleService', () => {
  let service: AppRoleService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/app-roles`;

  const sampleRequest: AppRoleRequest = {
    roleId: 'Editor',
    roleName: 'Content Editor',
    permissionLevel: 50,
    description: '編輯者',
    userIds: ['helen'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppRoleService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AppRoleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll GETs the collection', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('query POSTs the filter body', () => {
    service.query({ keyword: 'admin', permissionLevel: 1 }).subscribe();
    const req = httpMock.expectOne(`${base}/query`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.keyword).toBe('admin');
    expect(req.request.body.permissionLevel).toBe(1);
    req.flush([]);
  });

  it('getById URL-encodes the RoleId', () => {
    service.getById('a b/c').subscribe();
    const req = httpMock.expectOne(`${base}/a%20b%2Fc`);
    expect(req.request.method).toBe('GET');
    req.flush({} as AppRole);
  });

  it('create POSTs to the base URL', () => {
    service.create(sampleRequest).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.roleId).toBe('Editor');
    req.flush({} as AppRole);
  });

  it('update PUTs to the base URL (RoleId in body)', () => {
    service.update(sampleRequest).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.roleId).toBe('Editor');
    req.flush(null);
  });

  it('delete DELETEs by encoded RoleId', () => {
    service.delete('Admin').subscribe();
    const req = httpMock.expectOne(`${base}/Admin`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('getAppUsers GETs the lookup endpoint', () => {
    service.getAppUsers().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/lookups/app-users`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
