import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PublishStatusList } from './publish-status-list';
import { PublishStatusService } from '../publish-status.service';
import { PublishStatus } from '@core/models/publish-status.model';

const STATUSES: PublishStatus[] = [
  { pkid: 1, description: '草稿', isDraft: true, isPublished: false, isDiscontinued: false },
  { pkid: 2, description: '已發佈', isDraft: false, isPublished: true, isDiscontinued: false },
];

describe('PublishStatusList', () => {
  let fixture: ComponentFixture<PublishStatusList>;
  let component: PublishStatusList;
  let service: jasmine.SpyObj<PublishStatusService>;
  let confirm: jasmine.SpyObj<ConfirmationService>;

  beforeEach(async () => {
    sessionStorage.clear();
    service = jasmine.createSpyObj<PublishStatusService>('PublishStatusService', ['query', 'delete']);
    service.query.and.returnValue(of(STATUSES));
    service.delete.and.returnValue(of(void 0));

    confirm = jasmine.createSpyObj<ConfirmationService>('ConfirmationService', ['confirm']);

    await TestBed.configureTestingModule({
      imports: [PublishStatusList],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        MessageService,
        { provide: PublishStatusService, useValue: service },
        { provide: ConfirmationService, useValue: confirm },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PublishStatusList);
    component = fixture.componentInstance;
  });

  it('loads statuses on init', () => {
    fixture.detectChanges();
    expect(service.query).toHaveBeenCalledTimes(1);
    expect(component.statuses().length).toBe(2);
  });

  it('applyFilters persists filters to sessionStorage and reloads', () => {
    fixture.detectChanges();
    component.filters = { keyword: '發佈', isDraft: null, isPublished: true, isDiscontinued: null };
    component.applyFilters();

    const saved = JSON.parse(sessionStorage.getItem('publish-status-list-filters')!);
    expect(saved.keyword).toBe('發佈');
    expect(saved.isPublished).toBeTrue();
    expect(service.query).toHaveBeenCalledTimes(2);
    expect(component.drawerVisible()).toBeFalse();
  });

  it('clearFilters resets filters and removes saved state', () => {
    sessionStorage.setItem('publish-status-list-filters', JSON.stringify({ keyword: 'x' }));
    fixture.detectChanges();
    component.clearFilters();

    expect(component.filters.keyword).toBeNull();
    expect(component.filters.isPublished).toBeNull();
    expect(sessionStorage.getItem('publish-status-list-filters')).toBeNull();
  });

  it('remove confirms then deletes and reloads', () => {
    confirm.confirm.and.callFake((opts) => {
      opts.accept?.();
      return confirm;
    });
    fixture.detectChanges();

    component.remove(STATUSES[0]);

    expect(confirm.confirm).toHaveBeenCalled();
    expect(service.delete).toHaveBeenCalledWith(1);
    expect(service.query).toHaveBeenCalledTimes(2);
  });

  it('navigates to the edit route by pkid', () => {
    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate');
    fixture.detectChanges();

    component.edit(STATUSES[1]);

    expect(spy).toHaveBeenCalledWith(['/publish-statuses', 2, 'edit']);
  });
});
