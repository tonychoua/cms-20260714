import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { PublishStatusService } from './publish-status.service';
import { environment } from '@env';
import { PublishStatus, PublishStatusRequest } from '@core/models/publish-status.model';

describe('PublishStatusService', () => {
  let service: PublishStatusService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/publish-statuses`;

  const sampleRequest: PublishStatusRequest = {
    pkid: 5,
    description: '審核中',
    isDraft: true,
    isPublished: false,
    isDiscontinued: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PublishStatusService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PublishStatusService);
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
    service.query({ keyword: '發佈', isPublished: true }).subscribe();
    const req = httpMock.expectOne(`${base}/query`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.keyword).toBe('發佈');
    expect(req.request.body.isPublished).toBeTrue();
    req.flush([]);
  });

  it('getById GETs by numeric pkid', () => {
    service.getById(2).subscribe();
    const req = httpMock.expectOne(`${base}/2`);
    expect(req.request.method).toBe('GET');
    req.flush({} as PublishStatus);
  });

  it('create POSTs to the base URL', () => {
    service.create(sampleRequest).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.pkid).toBe(5);
    req.flush({} as PublishStatus);
  });

  it('update PUTs to the base URL (pkid in body)', () => {
    service.update(sampleRequest).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.pkid).toBe(5);
    req.flush(null);
  });

  it('delete DELETEs by numeric pkid', () => {
    service.delete(3).subscribe();
    const req = httpMock.expectOne(`${base}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
