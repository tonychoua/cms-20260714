using CMS.API.Models;
using CMS.API.Repositories;

namespace CMS.API.Tests.Fakes;

/// <summary>
/// In-memory <see cref="IPublishStatusRepository"/> used to exercise the controller without a live
/// SQL Server. QueryAsync mirrors the SQL WHERE clause (keyword LIKE on Description, exact bool flags).
/// </summary>
public class FakePublishStatusRepository : IPublishStatusRepository
{
    private readonly Dictionary<byte, PublishStatus> _rows = new();

    public FakePublishStatusRepository(params PublishStatus[] seed)
    {
        foreach (var row in seed)
            _rows[row.Pkid] = row;
    }

    public int Count => _rows.Count;

    public Task<IEnumerable<PublishStatus>> GetAllAsync()
        => Task.FromResult(Ordered(_rows.Values));

    public Task<IEnumerable<PublishStatus>> QueryAsync(PublishStatusQuery query)
    {
        IEnumerable<PublishStatus> result = _rows.Values;

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var kw = query.Keyword.Trim();
            result = result.Where(r =>
                r.Description.Contains(kw, StringComparison.OrdinalIgnoreCase));
        }

        if (query.IsDraft is bool draft)
            result = result.Where(r => r.IsDraft == draft);
        if (query.IsPublished is bool published)
            result = result.Where(r => r.IsPublished == published);
        if (query.IsDiscontinued is bool discontinued)
            result = result.Where(r => r.IsDiscontinued == discontinued);

        return Task.FromResult(Ordered(result));
    }

    public Task<PublishStatus?> GetByIdAsync(byte pkid)
        => Task.FromResult(_rows.TryGetValue(pkid, out var row) ? Clone(row) : null);

    public Task<PublishStatus> CreateAsync(PublishStatusRequest request)
    {
        var row = FromRequest(request);
        _rows[row.Pkid] = row;
        return Task.FromResult(Clone(row));
    }

    public Task<bool> UpdateAsync(PublishStatusRequest request)
    {
        if (!_rows.TryGetValue(request.Pkid, out var row))
            return Task.FromResult(false);

        row.Description = request.Description;
        row.IsDraft = request.IsDraft;
        row.IsPublished = request.IsPublished;
        row.IsDiscontinued = request.IsDiscontinued;
        return Task.FromResult(true);
    }

    public Task<bool> DeleteAsync(byte pkid)
        => Task.FromResult(_rows.Remove(pkid));

    public Task<bool> ExistsAsync(byte pkid)
        => Task.FromResult(_rows.ContainsKey(pkid));

    private static IEnumerable<PublishStatus> Ordered(IEnumerable<PublishStatus> rows)
        => rows.OrderBy(r => r.Pkid).Select(Clone).ToList();

    private static PublishStatus FromRequest(PublishStatusRequest r) => new()
    {
        Pkid = r.Pkid,
        Description = r.Description,
        IsDraft = r.IsDraft,
        IsPublished = r.IsPublished,
        IsDiscontinued = r.IsDiscontinued
    };

    private static PublishStatus Clone(PublishStatus r) => new()
    {
        Pkid = r.Pkid,
        Description = r.Description,
        IsDraft = r.IsDraft,
        IsPublished = r.IsPublished,
        IsDiscontinued = r.IsDiscontinued
    };
}
