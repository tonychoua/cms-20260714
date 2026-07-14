namespace CMS.API.Models;

/// <summary>
/// Response model for the Partner table (course-domain, defined in <c>promotion.sql</c>).
/// Primary key is <see cref="Pkid"/>, a <c>smallint</c> IDENTITY column.
/// </summary>
public class Partner
{
    public short Pkid { get; set; }
    public string Name { get; set; } = string.Empty;
    public string AppKey { get; set; } = string.Empty;
    public string NameOnPartnerMenu { get; set; } = string.Empty;
    public string NameOnCourseDetailPage { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public string? ImageFilename { get; set; }
}
