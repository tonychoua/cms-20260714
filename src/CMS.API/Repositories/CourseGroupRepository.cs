using CMS.API.Data;
using CMS.API.Models;
using Dapper;

namespace CMS.API.Repositories;

public class CourseGroupRepository : ICourseGroupRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public CourseGroupRepository(IDbConnectionFactory connectionFactory)
        => _connectionFactory = connectionFactory;

    private const string SelectColumns = "pkid AS Pkid, Description";

    private const string OrderBy = "ORDER BY pkid DESC";

    public async Task<IEnumerable<CourseGroup>> GetAllAsync()
    {
        using var db = _connectionFactory.Create();
        var sql = $"SELECT {SelectColumns} FROM CourseGroup {OrderBy}";
        return await db.QueryAsync<CourseGroup>(sql);
    }

    public async Task<IEnumerable<CourseGroup>> QueryAsync(CourseGroupQuery query)
    {
        using var db = _connectionFactory.Create();
        var sql = $@"
SELECT {SelectColumns}
FROM CourseGroup
WHERE (@Keyword IS NULL OR Description LIKE '%' + @Keyword + '%')
{OrderBy}";
        return await db.QueryAsync<CourseGroup>(sql, new
        {
            Keyword = string.IsNullOrWhiteSpace(query.Keyword) ? null : query.Keyword.Trim()
        });
    }

    public async Task<CourseGroup?> GetByIdAsync(short pkid)
    {
        using var db = _connectionFactory.Create();
        var sql = $"SELECT {SelectColumns} FROM CourseGroup WHERE pkid = @pkid";
        return await db.QuerySingleOrDefaultAsync<CourseGroup>(sql, new { pkid });
    }

    public async Task<CourseGroup> CreateAsync(CourseGroupRequest request)
    {
        using var db = _connectionFactory.Create();
        const string sql = @"
INSERT INTO CourseGroup (Description)
VALUES (@Description);
SELECT CAST(SCOPE_IDENTITY() AS smallint);";
        var pkid = await db.ExecuteScalarAsync<short>(sql, request);

        return new CourseGroup
        {
            Pkid = pkid,
            Description = request.Description
        };
    }

    public async Task<bool> UpdateAsync(CourseGroupRequest request)
    {
        using var db = _connectionFactory.Create();
        const string sql = @"
UPDATE CourseGroup
SET Description = @Description
WHERE pkid = @Pkid;";
        var affected = await db.ExecuteAsync(sql, request);
        return affected > 0;
    }

    public async Task<bool> DeleteAsync(short pkid)
    {
        using var db = _connectionFactory.Create();
        var affected = await db.ExecuteAsync("DELETE FROM CourseGroup WHERE pkid = @pkid", new { pkid });
        return affected > 0;
    }

    public async Task<bool> ExistsAsync(short pkid)
    {
        using var db = _connectionFactory.Create();
        var count = await db.ExecuteScalarAsync<int>(
            "SELECT COUNT(1) FROM CourseGroup WHERE pkid = @pkid", new { pkid });
        return count > 0;
    }
}
