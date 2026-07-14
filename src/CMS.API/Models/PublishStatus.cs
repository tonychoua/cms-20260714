namespace CMS.API.Models;

/// <summary>
/// Response model for the PublishStatus lookup table. Primary key is <see cref="Pkid"/>
/// (a <c>tinyint</c> that is user-assigned, NOT an IDENTITY column).
/// </summary>
public class PublishStatus
{
    public byte Pkid { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsDraft { get; set; }
    public bool IsPublished { get; set; }
    public bool IsDiscontinued { get; set; }
}
