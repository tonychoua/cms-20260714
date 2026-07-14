using CMS.API.Models;
using CMS.API.Repositories;

namespace CMS.API.Tests.Fakes;

/// <summary>
/// In-memory <see cref="ICourseGroupRepository"/> used to exercise the controller without a live
/// SQL Server. QueryAsync mirrors the SQL WHERE clause (keyword LIKE on Description).
/// </summary>
public class FakeCourseGroupRepository : ICourseGroupRepository
{
    private readonly Dictionary<short, CourseGroup> _groups = new();
    private short _nextPkid = 1;

    public FakeCourseGroupRepository(params CourseGroup[] seed)
    {
        foreach (var group in seed)
        {
            if (group.Pkid == 0) group.Pkid = _nextPkid;
            _nextPkid = (short)(Math.Max(_nextPkid, group.Pkid) + 1);
            _groups[group.Pkid] = group;
        }
    }

    public int Count => _groups.Count;

    public Task<IEnumerable<CourseGroup>> GetAllAsync()
        => Task.FromResult(Ordered(_groups.Values));

    public Task<IEnumerable<CourseGroup>> QueryAsync(CourseGroupQuery query)
    {
        IEnumerable<CourseGroup> result = _groups.Values;

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var kw = query.Keyword.Trim();
            result = result.Where(g =>
                g.Description.Contains(kw, StringComparison.OrdinalIgnoreCase));
        }

        return Task.FromResult(Ordered(result));
    }

    public Task<CourseGroup?> GetByIdAsync(short pkid)
        => Task.FromResult(_groups.TryGetValue(pkid, out var group) ? Clone(group) : null);

    public Task<CourseGroup> CreateAsync(CourseGroupRequest request)
    {
        var group = new CourseGroup
        {
            Pkid = _nextPkid++,
            Description = request.Description
        };
        _groups[group.Pkid] = group;
        return Task.FromResult(Clone(group));
    }

    public Task<bool> UpdateAsync(CourseGroupRequest request)
    {
        if (!_groups.TryGetValue(request.Pkid, out var group))
            return Task.FromResult(false);

        group.Description = request.Description;
        return Task.FromResult(true);
    }

    public Task<bool> DeleteAsync(short pkid)
        => Task.FromResult(_groups.Remove(pkid));

    public Task<bool> ExistsAsync(short pkid)
        => Task.FromResult(_groups.ContainsKey(pkid));

    private static IEnumerable<CourseGroup> Ordered(IEnumerable<CourseGroup> groups)
        => groups.OrderByDescending(g => g.Pkid).Select(Clone).ToList();

    private static CourseGroup Clone(CourseGroup g) => new()
    {
        Pkid = g.Pkid,
        Description = g.Description
    };
}
