using CMS.API.Data;
using CMS.API.Models;
using Dapper;

namespace CMS.API.Repositories;

public class LookupRepository : ILookupRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public LookupRepository(IDbConnectionFactory connectionFactory)
        => _connectionFactory = connectionFactory;

    public async Task<IEnumerable<AppUserLookup>> GetAppUsersAsync()
    {
        using var db = _connectionFactory.Create();
        return await db.QueryAsync<AppUserLookup>(
            "SELECT UserId, UserName FROM AppUser ORDER BY UserName");
    }

    public async Task<IEnumerable<CourseGroupLookup>> GetCourseGroupsAsync()
    {
        using var db = _connectionFactory.Create();
        return await db.QueryAsync<CourseGroupLookup>(
            "SELECT pkid AS Pkid, Description FROM CourseGroup ORDER BY Description");
    }
}
