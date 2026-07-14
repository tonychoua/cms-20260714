import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PartnerDetail } from './partner-detail';
import { PartnerService } from '../partner.service';
import { Partner } from '@core/models/partner.model';

const PARTNER: Partner = {
  pkid: 2,
  name: '鴻海',
  appKey: 'foxconn',
  nameOnPartnerMenu: '鴻海精密',
  nameOnCourseDetailPage: '鴻海',
  displayOrder: 2,
  imageFilename: null,
};

describe('PartnerDetail', () => {
  let fixture: ComponentFixture<PartnerDetail>;
  let component: PartnerDetail;
  let service: jasmine.SpyObj<PartnerService>;

  beforeEach(() => {
    service = jasmine.createSpyObj<PartnerService>('PartnerService', ['getById']);
    service.getById.and.returnValue(of(PARTNER));

    TestBed.configureTestingModule({
      imports: [PartnerDetail],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        MessageService,
        { provide: PartnerService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '2' }) } },
        },
      ],
    });

    fixture = TestBed.createComponent(PartnerDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the partner by numeric id from the route', () => {
    expect(service.getById).toHaveBeenCalledWith(2);
    expect(component.partner()?.name).toBe('鴻海');
  });

  it('navigates to the edit route', () => {
    const router = TestBed.inject(Router);
    const nav = spyOn(router, 'navigate');
    component.edit();
    expect(nav).toHaveBeenCalledWith(['/partners', 2, 'edit']);
  });
});
