using CMS.API.Models;
using CMS.API.Repositories;

namespace CMS.API.Tests.Fakes;

/// <summary>
/// In-memory <see cref="IPartnerRepository"/> used to exercise the controller without a live
/// SQL Server. QueryAsync mirrors the SQL WHERE clause (keyword LIKE across the four name/key columns);
/// CreateAsync mimics the IDENTITY pkid by assigning the next available value.
/// </summary>
public class FakePartnerRepository : IPartnerRepository
{
    private readonly Dictionary<short, Partner> _rows = new();
    private short _nextPkid = 1;

    public FakePartnerRepository(params Partner[] seed)
    {
        foreach (var row in seed)
        {
            _rows[row.Pkid] = row;
            if (row.Pkid >= _nextPkid)
                _nextPkid = (short)(row.Pkid + 1);
        }
    }

    public int Count => _rows.Count;

    public Task<IEnumerable<Partner>> GetAllAsync()
        => Task.FromResult(Ordered(_rows.Values));

    public Task<IEnumerable<Partner>> QueryAsync(PartnerQuery query)
    {
        IEnumerable<Partner> result = _rows.Values;

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var kw = query.Keyword.Trim();
            result = result.Where(r =>
                r.Name.Contains(kw, StringComparison.OrdinalIgnoreCase)
                || r.AppKey.Contains(kw, StringComparison.OrdinalIgnoreCase)
                || r.NameOnPartnerMenu.Contains(kw, StringComparison.OrdinalIgnoreCase)
                || r.NameOnCourseDetailPage.Contains(kw, StringComparison.OrdinalIgnoreCase));
        }

        return Task.FromResult(Ordered(result));
    }

    public Task<Partner?> GetByIdAsync(short pkid)
        => Task.FromResult(_rows.TryGetValue(pkid, out var row) ? Clone(row) : null);

    public Task<Partner> CreateAsync(PartnerRequest request)
    {
        var row = FromRequest(request);
        row.Pkid = _nextPkid++;
        _rows[row.Pkid] = row;
        return Task.FromResult(Clone(row));
    }

    public Task<bool> UpdateAsync(PartnerRequest request)
    {
        if (!_rows.TryGetValue(request.Pkid, out var row))
            return Task.FromResult(false);

        row.Name = request.Name;
        row.AppKey = request.AppKey;
        row.NameOnPartnerMenu = request.NameOnPartnerMenu;
        row.NameOnCourseDetailPage = request.NameOnCourseDetailPage;
        row.DisplayOrder = request.DisplayOrder;
        row.ImageFilename = request.ImageFilename;
        return Task.FromResult(true);
    }

    public Task<bool> DeleteAsync(short pkid)
        => Task.FromResult(_rows.Remove(pkid));

    public Task<bool> ExistsAsync(short pkid)
        => Task.FromResult(_rows.ContainsKey(pkid));

    private static IEnumerable<Partner> Ordered(IEnumerable<Partner> rows)
        => rows.OrderBy(r => r.DisplayOrder).ThenBy(r => r.Pkid).Select(Clone).ToList();

    private static Partner FromRequest(PartnerRequest r) => new()
    {
        Pkid = r.Pkid,
        Name = r.Name,
        AppKey = r.AppKey,
        NameOnPartnerMenu = r.NameOnPartnerMenu,
        NameOnCourseDetailPage = r.NameOnCourseDetailPage,
        DisplayOrder = r.DisplayOrder,
        ImageFilename = r.ImageFilename
    };

    private static Partner Clone(Partner r) => new()
    {
        Pkid = r.Pkid,
        Name = r.Name,
        AppKey = r.AppKey,
        NameOnPartnerMenu = r.NameOnPartnerMenu,
        NameOnCourseDetailPage = r.NameOnCourseDetailPage,
        DisplayOrder = r.DisplayOrder,
        ImageFilename = r.ImageFilename
    };
}
