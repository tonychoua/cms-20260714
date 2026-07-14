using CMS.API.Models;
using CMS.API.Repositories;

namespace CMS.API.Tests.Fakes;

/// <summary>
/// In-memory <see cref="IAppRoleRepository"/> used to exercise the controller without a live
/// SQL Server. QueryAsync mirrors the SQL WHERE clause (keyword LIKE, exact PermissionLevel).
/// </summary>
public class FakeAppRoleRepository : IAppRoleRepository
{
    private readonly Dictionary<string, AppRole> _roles = new(StringComparer.OrdinalIgnoreCase);
    private int _nextPkid = 1;

    public FakeAppRoleRepository(params AppRole[] seed)
    {
        foreach (var role in seed)
        {
            role.Pkid = _nextPkid++;
            _roles[role.RoleId] = role;
        }
    }

    public int Count => _roles.Count;

    public Task<IEnumerable<AppRole>> GetAllAsync()
        => Task.FromResult(Ordered(_roles.Values));

    public Task<IEnumerable<AppRole>> QueryAsync(AppRoleQuery query)
    {
        IEnumerable<AppRole> result = _roles.Values;

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var kw = query.Keyword.Trim();
            result = result.Where(r =>
                r.RoleId.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                r.RoleName.Contains(kw, StringComparison.OrdinalIgnoreCase));
        }

        if (query.PermissionLevel is int level)
            result = result.Where(r => r.PermissionLevel == level);

        return Task.FromResult(Ordered(result));
    }

    public Task<AppRole?> GetByIdAsync(string roleId)
        => Task.FromResult(_roles.TryGetValue(roleId, out var role) ? Clone(role) : null);

    public Task<AppRole> CreateAsync(AppRoleRequest request)
    {
        var role = new AppRole
        {
            Pkid = _nextPkid++,
            RoleId = request.RoleId,
            RoleName = request.RoleName,
            PermissionLevel = request.PermissionLevel,
            Description = request.Description,
            UserIds = request.UserIds.Distinct().ToList()
        };
        _roles[role.RoleId] = role;
        return Task.FromResult(Clone(role));
    }

    public Task<bool> UpdateAsync(AppRoleRequest request)
    {
        if (!_roles.TryGetValue(request.RoleId, out var role))
            return Task.FromResult(false);

        role.RoleName = request.RoleName;
        role.PermissionLevel = request.PermissionLevel;
        role.Description = request.Description;
        role.UserIds = request.UserIds.Distinct().ToList();
        return Task.FromResult(true);
    }

    public Task<bool> DeleteAsync(string roleId)
        => Task.FromResult(_roles.Remove(roleId));

    public Task<bool> ExistsAsync(string roleId)
        => Task.FromResult(_roles.ContainsKey(roleId));

    private static IEnumerable<AppRole> Ordered(IEnumerable<AppRole> roles)
        => roles.OrderBy(r => r.PermissionLevel).ThenBy(r => r.RoleId, StringComparer.OrdinalIgnoreCase)
                .Select(Clone).ToList();

    private static AppRole Clone(AppRole r) => new()
    {
        Pkid = r.Pkid,
        RoleId = r.RoleId,
        RoleName = r.RoleName,
        PermissionLevel = r.PermissionLevel,
        Description = r.Description,
        UserIds = [.. r.UserIds]
    };
}
