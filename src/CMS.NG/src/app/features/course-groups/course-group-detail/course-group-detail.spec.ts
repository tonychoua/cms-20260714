import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CourseGroupDetail } from './course-group-detail';
import { CourseGroupService } from '../course-group.service';
import { CourseGroup } from '@core/models/course-group.model';

const GROUP: CourseGroup = { pkid: 5, description: '認證班' };

describe('CourseGroupDetail', () => {
  let fixture: ComponentFixture<CourseGroupDetail>;
  let component: CourseGroupDetail;
  let service: jasmine.SpyObj<CourseGroupService>;

  beforeEach(() => {
    service = jasmine.createSpyObj<CourseGroupService>('CourseGroupService', ['getById']);
    service.getById.and.returnValue(of(GROUP));

    TestBed.configureTestingModule({
      imports: [CourseGroupDetail],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        MessageService,
        { provide: CourseGroupService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '5' }) } },
        },
      ],
    });

    fixture = TestBed.createComponent(CourseGroupDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the group by id from the route', () => {
    expect(service.getById).toHaveBeenCalledWith(5);
    expect(component.group()?.description).toBe('認證班');
  });

  it('navigates to the edit route', () => {
    const router = TestBed.inject(Router);
    const nav = spyOn(router, 'navigate');
    component.edit();
    expect(nav).toHaveBeenCalledWith(['/course-groups', 5, 'edit']);
  });
});
