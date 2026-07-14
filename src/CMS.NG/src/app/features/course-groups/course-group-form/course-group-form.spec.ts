import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CourseGroupForm } from './course-group-form';
import { CourseGroupService } from '../course-group.service';
import { CourseGroup } from '@core/models/course-group.model';

const GROUP: CourseGroup = { pkid: 3, description: '進階課程' };

function configure(routeId: string | null) {
  const service = jasmine.createSpyObj<CourseGroupService>('CourseGroupService', [
    'getById',
    'create',
    'update',
  ]);
  service.getById.and.returnValue(of(GROUP));
  service.create.and.returnValue(of({ pkid: 9, description: '新群組' }));
  service.update.and.returnValue(of(void 0));

  TestBed.configureTestingModule({
    imports: [CourseGroupForm],
    providers: [
      provideRouter([]),
      provideNoopAnimations(),
      MessageService,
      { provide: CourseGroupService, useValue: service },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap(routeId ? { id: routeId } : {}) } },
      },
    ],
  });
  return service;
}

describe('CourseGroupForm', () => {
  describe('add mode', () => {
    let fixture: ComponentFixture<CourseGroupForm>;
    let component: CourseGroupForm;
    let service: jasmine.SpyObj<CourseGroupService>;

    beforeEach(() => {
      service = configure(null);
      fixture = TestBed.createComponent(CourseGroupForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('starts in add mode', () => {
      expect(component.isEdit()).toBeFalse();
      expect(component.form.controls.description.value).toBe('');
    });

    it('does not submit when required fields are missing', () => {
      component.save();
      expect(service.create).not.toHaveBeenCalled();
    });

    it('creates a group and navigates to its detail page (using returned pkid)', () => {
      const router = TestBed.inject(Router);
      const nav = spyOn(router, 'navigate');
      component.form.patchValue({ description: '新群組' });

      component.save();

      expect(service.create).toHaveBeenCalled();
      const arg = service.create.calls.mostRecent().args[0];
      expect(arg.description).toBe('新群組');
      expect(nav).toHaveBeenCalledWith(['/course-groups', 9]);
    });
  });

  describe('edit mode', () => {
    let fixture: ComponentFixture<CourseGroupForm>;
    let component: CourseGroupForm;
    let service: jasmine.SpyObj<CourseGroupService>;

    beforeEach(() => {
      service = configure('3');
      fixture = TestBed.createComponent(CourseGroupForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('loads the group by id', () => {
      expect(component.isEdit()).toBeTrue();
      expect(service.getById).toHaveBeenCalledWith(3);
      expect(component.form.controls.description.value).toBe('進階課程');
    });

    it('updates the group (pkid preserved) and navigates', () => {
      const router = TestBed.inject(Router);
      const nav = spyOn(router, 'navigate');
      component.form.patchValue({ description: '進階課程 (改)' });

      component.save();

      expect(service.update).toHaveBeenCalled();
      const arg = service.update.calls.mostRecent().args[0];
      expect(arg.pkid).toBe(3);
      expect(arg.description).toBe('進階課程 (改)');
      expect(nav).toHaveBeenCalledWith(['/course-groups', 3]);
    });
  });
});
