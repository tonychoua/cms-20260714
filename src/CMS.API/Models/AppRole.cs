namespace CMS.API.Models;

/// <summary>Response model for the AppRole table. Logical primary key is <see cref="RoleId"/>.</summary>
public class AppRole
{
    public int Pkid { get; set; }
    public string RoleId { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public int PermissionLevel { get; set; }
    public string? Description { get; set; }

    /// <summary>Users assigned to this role (N-N via AppUserRole). Populated on GET by id.</summary>
    public List<string> UserIds { get; set; } = [];
}
