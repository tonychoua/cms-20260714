import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PublishStatusDetail } from './publish-status-detail';
import { PublishStatusService } from '../publish-status.service';
import { PublishStatus } from '@core/models/publish-status.model';

const STATUS: PublishStatus = {
  pkid: 2,
  description: '已發佈',
  isDraft: false,
  isPublished: true,
  isDiscontinued: false,
};

describe('PublishStatusDetail', () => {
  let fixture: ComponentFixture<PublishStatusDetail>;
  let component: PublishStatusDetail;
  let service: jasmine.SpyObj<PublishStatusService>;

  beforeEach(() => {
    service = jasmine.createSpyObj<PublishStatusService>('PublishStatusService', ['getById']);
    service.getById.and.returnValue(of(STATUS));

    TestBed.configureTestingModule({
      imports: [PublishStatusDetail],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        MessageService,
        { provide: PublishStatusService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '2' }) } },
        },
      ],
    });

    fixture = TestBed.createComponent(PublishStatusDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the status by numeric id from the route', () => {
    expect(service.getById).toHaveBeenCalledWith(2);
    expect(component.status()?.description).toBe('已發佈');
  });

  it('navigates to the edit route', () => {
    const router = TestBed.inject(Router);
    const nav = spyOn(router, 'navigate');
    component.edit();
    expect(nav).toHaveBeenCalledWith(['/publish-statuses', 2, 'edit']);
  });
});
