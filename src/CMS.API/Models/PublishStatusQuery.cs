namespace CMS.API.Models;

/// <summary>Search DTO for POST /api/publish-statuses/query.</summary>
public class PublishStatusQuery
{
    /// <summary>LIKE match on Description.</summary>
    public string? Keyword { get; set; }

    /// <summary>Exact match on IsDraft (null = ignore).</summary>
    public bool? IsDraft { get; set; }

    /// <summary>Exact match on IsPublished (null = ignore).</summary>
    public bool? IsPublished { get; set; }

    /// <summary>Exact match on IsDiscontinued (null = ignore).</summary>
    public bool? IsDiscontinued { get; set; }
}
