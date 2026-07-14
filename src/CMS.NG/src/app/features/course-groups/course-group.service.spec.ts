import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { CourseGroupService } from './course-group.service';
import { environment } from '@env';
import { CourseGroup, CourseGroupRequest } from '@core/models/course-group.model';

describe('CourseGroupService', () => {
  let service: CourseGroupService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/course-groups`;

  const sampleRequest: CourseGroupRequest = {
    pkid: 1,
    description: '進階課程',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CourseGroupService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CourseGroupService);
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
    service.query({ keyword: '進階' }).subscribe();
    const req = httpMock.expectOne(`${base}/query`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.keyword).toBe('進階');
    req.flush([]);
  });

  it('getById GETs by pkid', () => {
    service.getById(5).subscribe();
    const req = httpMock.expectOne(`${base}/5`);
    expect(req.request.method).toBe('GET');
    req.flush({} as CourseGroup);
  });

  it('create POSTs to the base URL', () => {
    service.create(sampleRequest).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.description).toBe('進階課程');
    req.flush({} as CourseGroup);
  });

  it('update PUTs to the base URL (pkid in body)', () => {
    service.update(sampleRequest).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.pkid).toBe(1);
    req.flush(null);
  });

  it('delete DELETEs by pkid', () => {
    service.delete(3).subscribe();
    const req = httpMock.expectOne(`${base}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
