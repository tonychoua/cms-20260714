import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PartnerForm } from './partner-form';
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

function configure(routeId: string | null) {
  const service = jasmine.createSpyObj<PartnerService>('PartnerService', [
    'getById',
    'create',
    'update',
  ]);
  service.getById.and.returnValue(of(PARTNER));
  service.create.and.returnValue(of({ ...PARTNER, pkid: 7 }));
  service.update.and.returnValue(of(void 0));

  TestBed.configureTestingModule({
    imports: [PartnerForm],
    providers: [
      provideRouter([]),
      provideNoopAnimations(),
      MessageService,
      { provide: PartnerService, useValue: service },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap(routeId ? { id: routeId } : {}) } },
      },
    ],
  });
  return service;
}

describe('PartnerForm', () => {
  describe('add mode', () => {
    let fixture: ComponentFixture<PartnerForm>;
    let component: PartnerForm;
    let service: jasmine.SpyObj<PartnerService>;

    beforeEach(() => {
      service = configure(null);
      fixture = TestBed.createComponent(PartnerForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('starts in add mode (pkid not loaded)', () => {
      expect(component.isEdit()).toBeFalse();
      expect(component.form.controls.pkid.value).toBeNull();
    });

    it('does not submit when required fields are missing', () => {
      component.save();
      expect(service.create).not.toHaveBeenCalled();
    });

    it('creates a partner and navigates to the server-generated detail page', () => {
      const router = TestBed.inject(Router);
      const nav = spyOn(router, 'navigate');
      component.form.patchValue({
        name: '新夥伴',
        appKey: 'newkey',
        nameOnPartnerMenu: '新夥伴選單',
        nameOnCourseDetailPage: '新夥伴課程',
        displayOrder: 3,
      });

      component.save();

      expect(service.create).toHaveBeenCalled();
      const arg = service.create.calls.mostRecent().args[0];
      expect(arg.name).toBe('新夥伴');
      expect(arg.appKey).toBe('newkey');
      expect(nav).toHaveBeenCalledWith(['/partners', 7]);
    });
  });

  describe('edit mode', () => {
    let fixture: ComponentFixture<PartnerForm>;
    let component: PartnerForm;
    let service: jasmine.SpyObj<PartnerService>;

    beforeEach(() => {
      service = configure('2');
      fixture = TestBed.createComponent(PartnerForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('loads the partner and disables the pkid field', () => {
      expect(component.isEdit()).toBeTrue();
      expect(service.getById).toHaveBeenCalledWith(2);
      expect(component.form.controls.name.value).toBe('鴻海');
      expect(component.form.controls.pkid.disabled).toBeTrue();
    });

    it('updates the partner (pkid still present via getRawValue) and navigates', () => {
      const router = TestBed.inject(Router);
      const nav = spyOn(router, 'navigate');
      component.form.patchValue({ name: '鴻海科技', displayOrder: 9 });

      component.save();

      expect(service.update).toHaveBeenCalled();
      const arg = service.update.calls.mostRecent().args[0];
      expect(arg.pkid).toBe(2);
      expect(arg.name).toBe('鴻海科技');
      expect(arg.displayOrder).toBe(9);
      expect(nav).toHaveBeenCalledWith(['/partners', 2]);
    });
  });
});
