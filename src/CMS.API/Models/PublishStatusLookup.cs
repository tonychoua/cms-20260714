namespace CMS.API.Models;

/// <summary>Slim lookup row for the PublishStatus dropdown (e.g. the Course ↔ PublishStatus FK).</summary>
public class PublishStatusLookup
{
    public byte Pkid { get; set; }
    public string Description { get; set; } = string.Empty;
}
