namespace CMS.API.Models;

/// <summary>Response model for the CourseGroup table. Primary key is <see cref="Pkid"/> (smallint IDENTITY).</summary>
public class CourseGroup
{
    public short Pkid { get; set; }
    public string Description { get; set; } = string.Empty;
}
