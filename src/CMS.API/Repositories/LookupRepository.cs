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

    public async Task<IEnumerable<PublishStatusLookup>> GetPublishStatusesAsync()
    {
        using var db = _connectionFactory.Create();
        return await db.QueryAsync<PublishStatusLookup>(
            "SELECT pkid AS Pkid, Description FROM PublishStatus ORDER BY pkid");
    }

    public async Task<IEnumerable<PartnerLookup>> GetPartnersAsync()
    {
        using var db = _connectionFactory.Create();
        return await db.QueryAsync<PartnerLookup>(
            "SELECT pkid AS Pkid, Name FROM Partner ORDER BY DisplayOrder, Name");
    }
}
