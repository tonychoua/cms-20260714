import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PartnerList } from './partner-list';
import { PartnerService } from '../partner.service';
import { Partner } from '@core/models/partner.model';

const PARTNERS: Partner[] = [
  {
    pkid: 1,
    name: '台積電',
    appKey: 'tsmc',
    nameOnPartnerMenu: '台積電',
    nameOnCourseDetailPage: '台積電',
    displayOrder: 1,
    imageFilename: null,
  },
  {
    pkid: 2,
    name: '鴻海',
    appKey: 'foxconn',
    nameOnPartnerMenu: '鴻海精密',
    nameOnCourseDetailPage: '鴻海',
    displayOrder: 2,
    imageFilename: null,
  },
];

describe('PartnerList', () => {
  let fixture: ComponentFixture<PartnerList>;
  let component: PartnerList;
  let service: jasmine.SpyObj<PartnerService>;
  let confirm: jasmine.SpyObj<ConfirmationService>;

  beforeEach(async () => {
    sessionStorage.clear();
    service = jasmine.createSpyObj<PartnerService>('PartnerService', ['query', 'delete']);
    service.query.and.returnValue(of(PARTNERS));
    service.delete.and.returnValue(of(void 0));

    confirm = jasmine.createSpyObj<ConfirmationService>('ConfirmationService', ['confirm']);

    await TestBed.configureTestingModule({
      imports: [PartnerList],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        MessageService,
        { provide: PartnerService, useValue: service },
        { provide: ConfirmationService, useValue: confirm },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerList);
    component = fixture.componentInstance;
  });

  it('loads partners on init', () => {
    fixture.detectChanges();
    expect(service.query).toHaveBeenCalledTimes(1);
    expect(component.partners().length).toBe(2);
  });

  it('applyFilters persists filters to sessionStorage and reloads', () => {
    fixture.detectChanges();
    component.filters = { keyword: '鴻海' };
    component.applyFilters();

    const saved = JSON.parse(sessionStorage.getItem('partner-list-filters')!);
    expect(saved.keyword).toBe('鴻海');
    expect(service.query).toHaveBeenCalledTimes(2);
    expect(component.drawerVisible()).toBeFalse();
  });

  it('clearFilters resets filters and removes saved state', () => {
    sessionStorage.setItem('partner-list-filters', JSON.stringify({ keyword: 'x' }));
    fixture.detectChanges();
    component.clearFilters();

    expect(component.filters.keyword).toBeNull();
    expect(sessionStorage.getItem('partner-list-filters')).toBeNull();
  });

  it('remove confirms then deletes and reloads', () => {
    confirm.confirm.and.callFake((opts) => {
      opts.accept?.();
      return confirm;
    });
    fixture.detectChanges();

    component.remove(PARTNERS[0]);

    expect(confirm.confirm).toHaveBeenCalled();
    expect(service.delete).toHaveBeenCalledWith(1);
    expect(service.query).toHaveBeenCalledTimes(2);
  });

  it('navigates to the edit route by pkid', () => {
    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate');
    fixture.detectChanges();

    component.edit(PARTNERS[1]);

    expect(spy).toHaveBeenCalledWith(['/partners', 2, 'edit']);
  });
});
