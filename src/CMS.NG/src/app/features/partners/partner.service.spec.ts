import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { PartnerService } from './partner.service';
import { environment } from '@env';
import { Partner, PartnerRequest } from '@core/models/partner.model';

describe('PartnerService', () => {
  let service: PartnerService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/partners`;

  const sampleRequest: PartnerRequest = {
    pkid: 5,
    name: '鴻海',
    appKey: 'foxconn',
    nameOnPartnerMenu: '鴻海精密',
    nameOnCourseDetailPage: '鴻海',
    displayOrder: 1,
    imageFilename: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PartnerService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerService);
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
    service.query({ keyword: '鴻海' }).subscribe();
    const req = httpMock.expectOne(`${base}/query`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.keyword).toBe('鴻海');
    req.flush([]);
  });

  it('getById GETs by numeric pkid', () => {
    service.getById(2).subscribe();
    const req = httpMock.expectOne(`${base}/2`);
    expect(req.request.method).toBe('GET');
    req.flush({} as Partner);
  });

  it('create POSTs to the base URL', () => {
    service.create(sampleRequest).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('鴻海');
    req.flush({} as Partner);
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
