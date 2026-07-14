import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CourseGroupList } from './course-group-list';
import { CourseGroupService } from '../course-group.service';
import { CourseGroup } from '@core/models/course-group.model';

const GROUPS: CourseGroup[] = [
  { pkid: 2, description: '進階課程' },
  { pkid: 1, description: '初階課程' },
];

describe('CourseGroupList', () => {
  let fixture: ComponentFixture<CourseGroupList>;
  let component: CourseGroupList;
  let service: jasmine.SpyObj<CourseGroupService>;
  let confirm: jasmine.SpyObj<ConfirmationService>;

  beforeEach(async () => {
    sessionStorage.clear();
    service = jasmine.createSpyObj<CourseGroupService>('CourseGroupService', ['query', 'delete']);
    service.query.and.returnValue(of(GROUPS));
    service.delete.and.returnValue(of(void 0));

    confirm = jasmine.createSpyObj<ConfirmationService>('ConfirmationService', ['confirm']);

    await TestBed.configureTestingModule({
      imports: [CourseGroupList],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        MessageService,
        { provide: CourseGroupService, useValue: service },
        { provide: ConfirmationService, useValue: confirm },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseGroupList);
    component = fixture.componentInstance;
  });

  it('loads groups on init', () => {
    fixture.detectChanges();
    expect(service.query).toHaveBeenCalledTimes(1);
    expect(component.groups().length).toBe(2);
  });

  it('applyFilters persists filters to sessionStorage and reloads', () => {
    fixture.detectChanges();
    component.filters = { keyword: '進階' };
    component.applyFilters();

    expect(JSON.parse(sessionStorage.getItem('course-group-list-filters')!).keyword).toBe('進階');
    expect(service.query).toHaveBeenCalledTimes(2);
    expect(component.drawerVisible()).toBeFalse();
  });

  it('clearFilters resets filters and removes saved state', () => {
    sessionStorage.setItem('course-group-list-filters', JSON.stringify({ keyword: 'x' }));
    fixture.detectChanges();
    component.clearFilters();

    expect(component.filters.keyword).toBeNull();
    expect(sessionStorage.getItem('course-group-list-filters')).toBeNull();
  });

  it('remove confirms then deletes and reloads', () => {
    confirm.confirm.and.callFake((opts) => {
      opts.accept?.();
      return confirm;
    });
    fixture.detectChanges();

    component.remove(GROUPS[0]);

    expect(confirm.confirm).toHaveBeenCalled();
    expect(service.delete).toHaveBeenCalledWith(2);
    expect(service.query).toHaveBeenCalledTimes(2);
  });

  it('navigates to the edit route', () => {
    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate');
    fixture.detectChanges();

    component.edit(GROUPS[1]);

    expect(spy).toHaveBeenCalledWith(['/course-groups', 1, 'edit']);
  });
});
