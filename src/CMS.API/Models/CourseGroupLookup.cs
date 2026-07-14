namespace CMS.API.Models;

/// <summary>Slim lookup row for the CourseGroup dropdown (FK target for Course / PartnerCourseGroup).</summary>
public class CourseGroupLookup
{
    public short Pkid { get; set; }
    public string Description { get; set; } = string.Empty;
}
