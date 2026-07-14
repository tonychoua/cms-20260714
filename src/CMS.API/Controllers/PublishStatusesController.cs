using CMS.API.Models;
using CMS.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CMS.API.Controllers;

[ApiController]
[Route("api/publish-statuses")]
[Produces("application/json")]
public class PublishStatusesController : ControllerBase
{
    private readonly IPublishStatusRepository _repository;

    public PublishStatusesController(IPublishStatusRepository repository) => _repository = repository;

    /// <summary>List all publish statuses.</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PublishStatus>>> GetAll()
        => Ok(await _repository.GetAllAsync());

    /// <summary>Filtered search (keyword, boolean flags).</summary>
    [HttpPost("query")]
    public async Task<ActionResult<IEnumerable<PublishStatus>>> Query([FromBody] PublishStatusQuery query)
        => Ok(await _repository.QueryAsync(query ?? new PublishStatusQuery()));

    /// <summary>Get a single publish status by pkid.</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<PublishStatus>> GetById(byte id)
    {
        var status = await _repository.GetByIdAsync(id);
        return status is null ? NotFound() : Ok(status);
    }

    /// <summary>Create a publish status (pkid is supplied by the caller).</summary>
    [HttpPost]
    public async Task<ActionResult<PublishStatus>> Create([FromBody] PublishStatusRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Description))
            return BadRequest("Description is required.");
        if (await _repository.ExistsAsync(request.Pkid))
            return Conflict($"PublishStatus '{request.Pkid}' already exists.");

        var created = await _repository.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Pkid }, created);
    }

    /// <summary>Update a publish status (pkid taken from the body).</summary>
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] PublishStatusRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Description))
            return BadRequest("Description is required.");
        if (!await _repository.ExistsAsync(request.Pkid))
            return NotFound();

        await _repository.UpdateAsync(request);
        return NoContent();
    }

    /// <summary>Delete a publish status by pkid.</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(byte id)
        => await _repository.DeleteAsync(id) ? NoContent() : NotFound();
}
