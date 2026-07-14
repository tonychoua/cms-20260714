using CMS.API.Data;
using CMS.API.Models;
using Dapper;

namespace CMS.API.Repositories;

public class PartnerRepository : IPartnerRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public PartnerRepository(IDbConnectionFactory connectionFactory)
        => _connectionFactory = connectionFactory;

    private const string SelectColumns =
        "pkid AS Pkid, Name, AppKey, NameOnPartnerMenu, NameOnCourseDetailPage, DisplayOrder, ImageFilename";

    private const string OrderBy = "ORDER BY DisplayOrder ASC, pkid ASC";

    public async Task<IEnumerable<Partner>> GetAllAsync()
    {
        using var db = _connectionFactory.Create();
        var sql = $"SELECT {SelectColumns} FROM Partner {OrderBy}";
        return await db.QueryAsync<Partner>(sql);
    }

    public async Task<IEnumerable<Partner>> QueryAsync(PartnerQuery query)
    {
        using var db = _connectionFactory.Create();
        var sql = $@"
SELECT {SelectColumns}
FROM Partner
WHERE (@Keyword IS NULL
       OR Name LIKE '%' + @Keyword + '%'
       OR AppKey LIKE '%' + @Keyword + '%'
       OR NameOnPartnerMenu LIKE '%' + @Keyword + '%'
       OR NameOnCourseDetailPage LIKE '%' + @Keyword + '%')
{OrderBy}";
        return await db.QueryAsync<Partner>(sql, new
        {
            Keyword = string.IsNullOrWhiteSpace(query.Keyword) ? null : query.Keyword.Trim()
        });
    }

    public async Task<Partner?> GetByIdAsync(short pkid)
    {
        using var db = _connectionFactory.Create();
        var sql = $"SELECT {SelectColumns} FROM Partner WHERE pkid = @pkid";
        return await db.QuerySingleOrDefaultAsync<Partner>(sql, new { pkid });
    }

    public async Task<Partner> CreateAsync(PartnerRequest request)
    {
        using var db = _connectionFactory.Create();

        // pkid is IDENTITY — do not insert it; read the generated value back via SCOPE_IDENTITY.
        const string sql = @"
INSERT INTO Partner (Name, AppKey, NameOnPartnerMenu, NameOnCourseDetailPage, DisplayOrder, ImageFilename)
VALUES (@Name, @AppKey, @NameOnPartnerMenu, @NameOnCourseDetailPage, @DisplayOrder, @ImageFilename);
SELECT CAST(SCOPE_IDENTITY() AS smallint);";
        var newPkid = await db.ExecuteScalarAsync<short>(sql, request);

        return new Partner
        {
            Pkid = newPkid,
            Name = request.Name,
            AppKey = request.AppKey,
            NameOnPartnerMenu = request.NameOnPartnerMenu,
            NameOnCourseDetailPage = request.NameOnCourseDetailPage,
            DisplayOrder = request.DisplayOrder,
            ImageFilename = request.ImageFilename
        };
    }

    public async Task<bool> UpdateAsync(PartnerRequest request)
    {
        using var db = _connectionFactory.Create();
        const string sql = @"
UPDATE Partner
SET Name = @Name,
    AppKey = @AppKey,
    NameOnPartnerMenu = @NameOnPartnerMenu,
    NameOnCourseDetailPage = @NameOnCourseDetailPage,
    DisplayOrder = @DisplayOrder,
    ImageFilename = @ImageFilename
WHERE pkid = @Pkid;";
        var affected = await db.ExecuteAsync(sql, request);
        return affected > 0;
    }

    public async Task<bool> DeleteAsync(short pkid)
    {
        using var db = _connectionFactory.Create();
        var affected = await db.ExecuteAsync(
            "DELETE FROM Partner WHERE pkid = @pkid", new { pkid });
        return affected > 0;
    }

    public async Task<bool> ExistsAsync(short pkid)
    {
        using var db = _connectionFactory.Create();
        var count = await db.ExecuteScalarAsync<int>(
            "SELECT COUNT(1) FROM Partner WHERE pkid = @pkid", new { pkid });
        return count > 0;
    }
}
