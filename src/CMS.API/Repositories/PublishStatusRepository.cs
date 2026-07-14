using CMS.API.Data;
using CMS.API.Models;
using Dapper;

namespace CMS.API.Repositories;

public class PublishStatusRepository : IPublishStatusRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public PublishStatusRepository(IDbConnectionFactory connectionFactory)
        => _connectionFactory = connectionFactory;

    private const string SelectColumns =
        "pkid AS Pkid, Description, IsDraft, IsPublished, IsDiscontinued";

    private const string OrderBy = "ORDER BY pkid ASC";

    public async Task<IEnumerable<PublishStatus>> GetAllAsync()
    {
        using var db = _connectionFactory.Create();
        var sql = $"SELECT {SelectColumns} FROM PublishStatus {OrderBy}";
        return await db.QueryAsync<PublishStatus>(sql);
    }

    public async Task<IEnumerable<PublishStatus>> QueryAsync(PublishStatusQuery query)
    {
        using var db = _connectionFactory.Create();
        var sql = $@"
SELECT {SelectColumns}
FROM PublishStatus
WHERE (@Keyword IS NULL OR Description LIKE '%' + @Keyword + '%')
  AND (@IsDraft IS NULL OR IsDraft = @IsDraft)
  AND (@IsPublished IS NULL OR IsPublished = @IsPublished)
  AND (@IsDiscontinued IS NULL OR IsDiscontinued = @IsDiscontinued)
{OrderBy}";
        return await db.QueryAsync<PublishStatus>(sql, new
        {
            Keyword = string.IsNullOrWhiteSpace(query.Keyword) ? null : query.Keyword.Trim(),
            query.IsDraft,
            query.IsPublished,
            query.IsDiscontinued
        });
    }

    public async Task<PublishStatus?> GetByIdAsync(byte pkid)
    {
        using var db = _connectionFactory.Create();
        var sql = $"SELECT {SelectColumns} FROM PublishStatus WHERE pkid = @pkid";
        return await db.QuerySingleOrDefaultAsync<PublishStatus>(sql, new { pkid });
    }

    public async Task<PublishStatus> CreateAsync(PublishStatusRequest request)
    {
        using var db = _connectionFactory.Create();

        // pkid is user-assigned (not IDENTITY) — insert it explicitly, no SCOPE_IDENTITY.
        const string sql = @"
INSERT INTO PublishStatus (pkid, Description, IsDraft, IsPublished, IsDiscontinued)
VALUES (@Pkid, @Description, @IsDraft, @IsPublished, @IsDiscontinued);";
        await db.ExecuteAsync(sql, request);

        return new PublishStatus
        {
            Pkid = request.Pkid,
            Description = request.Description,
            IsDraft = request.IsDraft,
            IsPublished = request.IsPublished,
            IsDiscontinued = request.IsDiscontinued
        };
    }

    public async Task<bool> UpdateAsync(PublishStatusRequest request)
    {
        using var db = _connectionFactory.Create();
        const string sql = @"
UPDATE PublishStatus
SET Description = @Description,
    IsDraft = @IsDraft,
    IsPublished = @IsPublished,
    IsDiscontinued = @IsDiscontinued
WHERE pkid = @Pkid;";
        var affected = await db.ExecuteAsync(sql, request);
        return affected > 0;
    }

    public async Task<bool> DeleteAsync(byte pkid)
    {
        using var db = _connectionFactory.Create();
        var affected = await db.ExecuteAsync(
            "DELETE FROM PublishStatus WHERE pkid = @pkid", new { pkid });
        return affected > 0;
    }

    public async Task<bool> ExistsAsync(byte pkid)
    {
        using var db = _connectionFactory.Create();
        var count = await db.ExecuteScalarAsync<int>(
            "SELECT COUNT(1) FROM PublishStatus WHERE pkid = @pkid", new { pkid });
        return count > 0;
    }
}
