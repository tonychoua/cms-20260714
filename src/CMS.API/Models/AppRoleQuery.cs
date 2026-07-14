namespace CMS.API.Models;

/// <summary>Search DTO for POST /api/app-roles/query.</summary>
public class AppRoleQuery
{
    /// <summary>LIKE match on RoleId and RoleName.</summary>
    public string? Keyword { get; set; }

    /// <summary>Exact match on PermissionLevel.</summary>
    public int? PermissionLevel { get; set; }
}
