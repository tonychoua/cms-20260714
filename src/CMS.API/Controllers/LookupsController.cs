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
}
