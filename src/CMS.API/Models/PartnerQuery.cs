namespace CMS.API.Models;

/// <summary>Search DTO for POST /api/partners/query.</summary>
public class PartnerQuery
{
    /// <summary>LIKE match on Name, AppKey, NameOnPartnerMenu and NameOnCourseDetailPage.</summary>
    public string? Keyword { get; set; }
}
