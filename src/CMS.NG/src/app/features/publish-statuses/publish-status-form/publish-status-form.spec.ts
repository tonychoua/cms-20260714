import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PublishStatusForm } from './publish-status-form';
import { PublishStatusService } from '../publish-status.service';
import { PublishStatus } from '@core/models/publish-status.model';

const STATUS: PublishStatus = {
  pkid: 2,
  description: '已發佈',
  isDraft: false,
  isPublished: true,
  isDiscontinued: false,
};

function configure(routeId: string | null) {
  const service = jasmine.createSpyObj<PublishStatusService>('PublishStatusService', [
    'getById',
    'create',
    'update',
  ]);
  service.getById.and.returnValue(of(STATUS));
  service.create.and.returnValue(of(STATUS));
  service.update.and.returnValue(of(void 0));

  TestBed.configureTestingModule({
    imports: [PublishStatusForm],
    providers: [
      provideRouter([]),
      provideNoopAnimations(),
      MessageService,
      { provide: PublishStatusService, useValue: service },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap(routeId ? { id: routeId } : {}) } },
      },
    ],
  });
  return service;
}

describe('PublishStatusForm', () => {
  describe('add mode', () => {
    let fixture: ComponentFixture<PublishStatusForm>;
    let component: PublishStatusForm;
    let service: jasmine.SpyObj<PublishStatusService>;

    beforeEach(() => {
      service = configure(null);
      fixture = TestBed.createComponent(PublishStatusForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('starts in add mode with an editable pkid', () => {
      expect(component.isEdit()).toBeFalse();
      expect(component.form.controls.pkid.enabled).toBeTrue();
    });

    it('does not submit when required fields are missing', () => {
      component.save();
      expect(service.create).not.toHaveBeenCalled();
    });

    it('creates a status and navigates to its detail page', () => {
      const router = TestBed.inject(Router);
      const nav = spyOn(router, 'navigate');
      component.form.patchValue({ pkid: 5, description: '審核中', isDraft: true });

      component.save();

      expect(service.create).toHaveBeenCalled();
      const arg = service.create.calls.mostRecent().args[0];
      expect(arg.pkid).toBe(5);
      expect(arg.description).toBe('審核中');
      expect(nav).toHaveBeenCalledWith(['/publish-statuses', 5]);
    });
  });

  describe('edit mode', () => {
    let fixture: ComponentFixture<PublishStatusForm>;
    let component: PublishStatusForm;
    let service: jasmine.SpyObj<PublishStatusService>;

    beforeEach(() => {
      service = configure('2');
      fixture = TestBed.createComponent(PublishStatusForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('loads the status and disables the pkid field', () => {
      expect(component.isEdit()).toBeTrue();
      expect(service.getById).toHaveBeenCalledWith(2);
      expect(component.form.controls.description.value).toBe('已發佈');
      expect(component.form.controls.pkid.disabled).toBeTrue();
      expect(component.form.controls.isPublished.value).toBeTrue();
    });

    it('updates the status (pkid still present via getRawValue) and navigates', () => {
      const router = TestBed.inject(Router);
      const nav = spyOn(router, 'navigate');
      component.form.patchValue({ description: '已下架', isPublished: false, isDiscontinued: true });

      component.save();

      expect(service.update).toHaveBeenCalled();
      const arg = service.update.calls.mostRecent().args[0];
      expect(arg.pkid).toBe(2);
      expect(arg.description).toBe('已下架');
      expect(arg.isDiscontinued).toBeTrue();
      expect(nav).toHaveBeenCalledWith(['/publish-statuses', 2]);
    });
  });
});
