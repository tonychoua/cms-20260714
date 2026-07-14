using CMS.API.Models;
using CMS.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CMS.API.Controllers;

[ApiController]
[Route("api/lookups")]
[Produces("application/json")]
public class LookupsController : ControllerBase
{
    private readonly ILookupRepository _repository;

    public LookupsController(ILookupRepository repository) => _repository = repository;

    /// <summary>Slim AppUser list for the role ↔ user multi-select.</summary>
    [HttpGet("app-users")]
    public async Task<ActionResult<IEnumerable<AppUserLookup>>> GetAppUsers()
        => Ok(await _repository.GetAppUsersAsync());

    /// <summary>Slim CourseGroup list for FK dropdowns (Course / PartnerCourseGroup).</summary>
    [HttpGet("course-groups")]
    public async Task<ActionResult<IEnumerable<CourseGroupLookup>>> GetCourseGroups()
        => Ok(await _repository.GetCourseGroupsAsync());

    /// <summary>Slim PublishStatus list for FK dropdowns (e.g. Course).</summary>
    [HttpGet("publish-statuses")]
    public async Task<ActionResult<IEnumerable<PublishStatusLookup>>> GetPublishStatuses()
        => Ok(await _repository.GetPublishStatusesAsync());

    /// <summary>Slim Partner list for FK dropdowns (e.g. Course, Certification).</summary>
    [HttpGet("partners")]
    public async Task<ActionResult<IEnumerable<PartnerLookup>>> GetPartners()
        => Ok(await _repository.GetPartnersAsync());
}
