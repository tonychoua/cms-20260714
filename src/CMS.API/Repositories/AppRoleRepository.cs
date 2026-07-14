using System.Data;
using CMS.API.Data;
using CMS.API.Models;
using Dapper;

namespace CMS.API.Repositories;

public class AppRoleRepository : IAppRoleRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public AppRoleRepository(IDbConnectionFactory connectionFactory)
        => _connectionFactory = connectionFactory;

    private const string SelectColumns =
        "pkid AS Pkid, RoleId, RoleName, PermissionLevel, Description";

    private const string OrderBy = "ORDER BY PermissionLevel ASC, RoleId ASC";

    public async Task<IEnumerable<AppRole>> GetAllAsync()
    {
        using var db = _connectionFactory.Create();
        var sql = $"SELECT {SelectColumns} FROM AppRole {OrderBy}";
        return await db.QueryAsync<AppRole>(sql);
    }

    public async Task<IEnumerable<AppRole>> QueryAsync(AppRoleQuery query)
    {
        using var db = _connectionFactory.Create();
        var sql = $@"
SELECT {SelectColumns}
FROM AppRole
WHERE (@Keyword IS NULL OR RoleId LIKE '%' + @Keyword + '%' OR RoleName LIKE '%' + @Keyword + '%')
  AND (@PermissionLevel IS NULL OR PermissionLevel = @PermissionLevel)
{OrderBy}";
        return await db.QueryAsync<AppRole>(sql, new
        {
            Keyword = string.IsNullOrWhiteSpace(query.Keyword) ? null : query.Keyword.Trim(),
            query.PermissionLevel
        });
    }

    public async Task<AppRole?> GetByIdAsync(string roleId)
    {
        using var db = _connectionFactory.Create();
        var sql = $"SELECT {SelectColumns} FROM AppRole WHERE RoleId = @roleId";
        var role = await db.QuerySingleOrDefaultAsync<AppRole>(sql, new { roleId });
        if (role is null) return null;

        var userIds = await db.QueryAsync<string>(
            "SELECT UserId FROM AppUserRole WHERE RoleId = @roleId ORDER BY UserId",
            new { roleId });
        role.UserIds = userIds.ToList();
        return role;
    }

    public async Task<AppRole> CreateAsync(AppRoleRequest request)
    {
        using var db = _connectionFactory.Create();
        db.Open();
        using var tx = db.BeginTransaction();

        const string sql = @"
INSERT INTO AppRole (RoleId, RoleName, PermissionLevel, Description)
VALUES (@RoleId, @RoleName, @PermissionLevel, @Description);
SELECT CAST(SCOPE_IDENTITY() AS int);";
        var pkid = await db.ExecuteScalarAsync<int>(sql, request, tx);

        await SyncUsersAsync(db, tx, request.RoleId, request.UserIds);
        tx.Commit();

        return new AppRole
        {
            Pkid = pkid,
            RoleId = request.RoleId,
            RoleName = request.RoleName,
            PermissionLevel = request.PermissionLevel,
            Description = request.Description,
            UserIds = request.UserIds.Distinct().ToList()
        };
    }

    public async Task<bool> UpdateAsync(AppRoleRequest request)
    {
        using var db = _connectionFactory.Create();
        db.Open();
        using var tx = db.BeginTransaction();

        const string sql = @"
UPDATE AppRole
SET RoleName = @RoleName,
    PermissionLevel = @PermissionLevel,
    Description = @Description
WHERE RoleId = @RoleId;";
        var affected = await db.ExecuteAsync(sql, request, tx);

        await SyncUsersAsync(db, tx, request.RoleId, request.UserIds);
        tx.Commit();
        return affected > 0;
    }

    public async Task<bool> DeleteAsync(string roleId)
    {
        using var db = _connectionFactory.Create();
        db.Open();
        using var tx = db.BeginTransaction();

        await db.ExecuteAsync("DELETE FROM AppUserRole WHERE RoleId = @roleId", new { roleId }, tx);
        var affected = await db.ExecuteAsync("DELETE FROM AppRole WHERE RoleId = @roleId", new { roleId }, tx);

        tx.Commit();
        return affected > 0;
    }

    public async Task<bool> ExistsAsync(string roleId)
    {
        using var db = _connectionFactory.Create();
        var count = await db.ExecuteScalarAsync<int>(
            "SELECT COUNT(1) FROM AppRole WHERE RoleId = @roleId", new { roleId });
        return count > 0;
    }

    // N-N sync (AppUserRole): delete-then-reinsert on the same connection/transaction.
    private static async Task SyncUsersAsync(IDbConnection db, IDbTransaction tx, string roleId, List<string> userIds)
    {
        await db.ExecuteAsync("DELETE FROM AppUserRole WHERE RoleId = @roleId", new { roleId }, tx);

        var distinct = userIds.Where(u => !string.IsNullOrWhiteSpace(u)).Distinct().ToList();
        if (distinct.Count == 0) return;

        var rows = distinct.Select(userId => new { UserId = userId, RoleId = roleId });
        await db.ExecuteAsync(
            "INSERT INTO AppUserRole (UserId, RoleId) VALUES (@UserId, @RoleId)", rows, tx);
    }
}
