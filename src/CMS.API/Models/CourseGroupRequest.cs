using System.ComponentModel.DataAnnotations;

namespace CMS.API.Models;

/// <summary>Write DTO for creating/updating a CourseGroup. Pkid identifies the row on update (IDENTITY PK).</summary>
public class CourseGroupRequest
{
    /// <summary>Ignored on create (IDENTITY generates it); required on update.</summary>
    public short Pkid { get; set; }

    [Required]
    [MaxLength(100)]
    public string Description { get; set; } = string.Empty;
}
