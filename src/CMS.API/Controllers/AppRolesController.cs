using CMS.API.Models;
using CMS.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CMS.API.Controllers;

[ApiController]
[Route("api/app-roles")]
[Produces("application/json")]
public class AppRolesController : ControllerBase
{
    private readonly IAppRoleRepository _repository;

    public AppRolesController(IAppRoleRepository repository) => _repository = repository;

    /// <summary>List all roles.</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppRole>>> GetAll()
        => Ok(await _repository.GetAllAsync());

    /// <summary>Filtered search (keyword, permission level).</summary>
    [HttpPost("query")]
    public async Task<ActionResult<IEnumerable<AppRole>>> Query([FromBody] AppRoleQuery query)
        => Ok(await _repository.QueryAsync(query ?? new AppRoleQuery()));

    /// <summary>Get a single role (with assigned users) by RoleId.</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AppRole>> GetById(string id)
    {
        var role = await _repository.GetByIdAsync(id);
        return role is null ? NotFound() : Ok(role);
    }

    /// <summary>Create a role.</summary>
    [HttpPost]
    public async Task<ActionResult<AppRole>> Create([FromBody] AppRoleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RoleId))
            return BadRequest("RoleId is required.");
        if (string.IsNullOrWhiteSpace(request.RoleName))
            return BadRequest("RoleName is required.");
        if (await _repository.ExistsAsync(request.RoleId))
            return Conflict($"Role '{request.RoleId}' already exists.");

        var created = await _repository.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.RoleId }, created);
    }

    /// <summary>Update a role (RoleId taken from the body).</summary>
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] AppRoleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RoleId))
            return BadRequest("RoleId is required.");
        if (!await _repository.ExistsAsync(request.RoleId))
            return NotFound();

        await _repository.UpdateAsync(request);
        return NoContent();
    }

    /// <summary>Delete a role by RoleId.</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
        => await _repository.DeleteAsync(id) ? NoContent() : NotFound();
}
