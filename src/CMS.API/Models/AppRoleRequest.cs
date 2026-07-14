namespace CMS.API.Models;

/// <summary>Write DTO for creating/updating an AppRole. RoleId identifies the row (string PK).</summary>
public class AppRoleRequest
{
    public string RoleId { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public int PermissionLevel { get; set; } = 100;
    public string? Description { get; set; }

    /// <summary>Selected users for the AppUserRole junction.</summary>
    public List<string> UserIds { get; set; } = [];
}
