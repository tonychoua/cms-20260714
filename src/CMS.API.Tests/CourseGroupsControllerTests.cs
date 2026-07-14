using CMS.API.Controllers;
using CMS.API.Models;
using CMS.API.Tests.Fakes;
using Microsoft.AspNetCore.Mvc;

namespace CMS.API.Tests;

public class CourseGroupsControllerTests
{
    private static CourseGroup Group(short pkid, string description) => new()
    {
        Pkid = pkid,
        Description = description
    };

    private static (CourseGroupsController controller, FakeCourseGroupRepository repo) NewSut(params CourseGroup[] seed)
    {
        var repo = new FakeCourseGroupRepository(seed);
        return (new CourseGroupsController(repo), repo);
    }

    // ---------- List ----------

    [Fact]
    public async Task GetAll_returns_all_groups_sorted_by_pkid_desc()
    {
        var (controller, _) = NewSut(
            Group(1, "初階"),
            Group(2, "進階"),
            Group(3, "認證"));

        var result = await controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var groups = Assert.IsAssignableFrom<IEnumerable<CourseGroup>>(ok.Value).ToList();
        Assert.Equal(3, groups.Count);
        Assert.Equal(new short[] { 3, 2, 1 }, groups.Select(g => g.Pkid));
    }

    // ---------- Query / filter ----------

    [Fact]
    public async Task Query_filters_by_keyword_on_description()
    {
        var (controller, _) = NewSut(
            Group(1, "初階課程"),
            Group(2, "進階課程"),
            Group(3, "認證班"));

        var result = await controller.Query(new CourseGroupQuery { Keyword = "進階" });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var groups = Assert.IsAssignableFrom<IEnumerable<CourseGroup>>(ok.Value).ToList();
        Assert.Single(groups);
        Assert.Equal((short)2, groups[0].Pkid);
    }

    [Fact]
    public async Task Query_with_empty_filter_returns_everything()
    {
        var (controller, _) = NewSut(
            Group(1, "初階"),
            Group(2, "進階"));

        var result = await controller.Query(new CourseGroupQuery());

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var groups = Assert.IsAssignableFrom<IEnumerable<CourseGroup>>(ok.Value).ToList();
        Assert.Equal(2, groups.Count);
    }

    // ---------- View ----------

    [Fact]
    public async Task GetById_returns_group()
    {
        var (controller, _) = NewSut(Group(5, "認證班"));

        var result = await controller.GetById(5);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var group = Assert.IsType<CourseGroup>(ok.Value);
        Assert.Equal("認證班", group.Description);
    }

    [Fact]
    public async Task GetById_returns_404_when_missing()
    {
        var (controller, _) = NewSut(Group(1, "初階"));

        var result = await controller.GetById(99);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    // ---------- Add ----------

    [Fact]
    public async Task Create_persists_group_and_returns_201()
    {
        var (controller, repo) = NewSut();

        var result = await controller.Create(new CourseGroupRequest { Description = "新群組" });

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var group = Assert.IsType<CourseGroup>(created.Value);
        Assert.Equal("新群組", group.Description);
        Assert.Equal(nameof(CourseGroupsController.GetById), created.ActionName);
        Assert.Equal(1, repo.Count);
    }

    [Fact]
    public async Task Create_returns_400_when_description_blank()
    {
        var (controller, _) = NewSut();

        var result = await controller.Create(new CourseGroupRequest { Description = "  " });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    // ---------- Edit ----------

    [Fact]
    public async Task Update_modifies_group_and_returns_204()
    {
        var (controller, repo) = NewSut(Group(1, "舊名稱"));

        var result = await controller.Update(new CourseGroupRequest { Pkid = 1, Description = "新名稱" });

        Assert.IsType<NoContentResult>(result);
        var updated = await repo.GetByIdAsync(1);
        Assert.Equal("新名稱", updated!.Description);
    }

    [Fact]
    public async Task Update_returns_404_when_group_missing()
    {
        var (controller, _) = NewSut();

        var result = await controller.Update(new CourseGroupRequest { Pkid = 99, Description = "x" });

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Update_returns_400_when_description_blank()
    {
        var (controller, _) = NewSut(Group(1, "初階"));

        var result = await controller.Update(new CourseGroupRequest { Pkid = 1, Description = "" });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ---------- Delete ----------

    [Fact]
    public async Task Delete_removes_group_and_returns_204()
    {
        var (controller, repo) = NewSut(Group(1, "暫存"));

        var result = await controller.Delete(1);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(0, repo.Count);
    }

    [Fact]
    public async Task Delete_returns_404_when_group_missing()
    {
        var (controller, _) = NewSut();

        var result = await controller.Delete(99);

        Assert.IsType<NotFoundResult>(result);
    }
}
