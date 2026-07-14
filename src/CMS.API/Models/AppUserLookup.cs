namespace CMS.API.Models;

/// <summary>Slim lookup row for the AppUser multi-select (role ↔ user assignment).</summary>
public class AppUserLookup
{
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
}
