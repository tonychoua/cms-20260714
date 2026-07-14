using CMS.API.Models;
using CMS.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CMS.API.Controllers;

[ApiController]
[Route("api/partners")]
[Produces("application/json")]
public class PartnersController : ControllerBase
{
    private readonly IPartnerRepository _repository;

    public PartnersController(IPartnerRepository repository) => _repository = repository;

    /// <summary>List all partners (ordered by DisplayOrder).</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Partner>>> GetAll()
        => Ok(await _repository.GetAllAsync());

    /// <summary>Filtered search (keyword LIKE on the name/key columns).</summary>
    [HttpPost("query")]
    public async Task<ActionResult<IEnumerable<Partner>>> Query([FromBody] PartnerQuery query)
        => Ok(await _repository.QueryAsync(query ?? new PartnerQuery()));

    /// <summary>Get a single partner by pkid.</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Partner>> GetById(short id)
    {
        var partner = await _repository.GetByIdAsync(id);
        return partner is null ? NotFound() : Ok(partner);
    }

    /// <summary>Create a partner (pkid is IDENTITY-generated).</summary>
    [HttpPost]
    public async Task<ActionResult<Partner>> Create([FromBody] PartnerRequest request)
    {
        if (!IsValid(request, out var error))
            return BadRequest(error);

        var created = await _repository.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Pkid }, created);
    }

    /// <summary>Update a partner (pkid taken from the body).</summary>
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] PartnerRequest request)
    {
        if (!IsValid(request, out var error))
            return BadRequest(error);
        if (!await _repository.ExistsAsync(request.Pkid))
            return NotFound();

        await _repository.UpdateAsync(request);
        return NoContent();
    }

    /// <summary>Delete a partner by pkid.</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(short id)
        => await _repository.DeleteAsync(id) ? NoContent() : NotFound();

    private static bool IsValid(PartnerRequest request, out string error)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            error = "Name is required.";
        else if (string.IsNullOrWhiteSpace(request.AppKey))
            error = "AppKey is required.";
        else if (string.IsNullOrWhiteSpace(request.NameOnPartnerMenu))
            error = "NameOnPartnerMenu is required.";
        else if (string.IsNullOrWhiteSpace(request.NameOnCourseDetailPage))
            error = "NameOnCourseDetailPage is required.";
        else
            error = string.Empty;

        return error.Length == 0;
    }
}
