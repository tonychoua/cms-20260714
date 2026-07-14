using CMS.API.Controllers;
using CMS.API.Models;
using CMS.API.Tests.Fakes;
using Microsoft.AspNetCore.Mvc;

namespace CMS.API.Tests;

public class PublishStatusesControllerTests
{
    private static PublishStatus Status(
        byte pkid, string description, bool isDraft = false, bool isPublished = false, bool isDiscontinued = false) => new()
    {
        Pkid = pkid,
        Description = description,
        IsDraft = isDraft,
        IsPublished = isPublished,
        IsDiscontinued = isDiscontinued
    };

    private static (PublishStatusesController controller, FakePublishStatusRepository repo) NewSut(params PublishStatus[] seed)
    {
        var repo = new FakePublishStatusRepository(seed);
        return (new PublishStatusesController(repo), repo);
    }

    // ---------- List ----------

    [Fact]
    public async Task GetAll_returns_all_rows_sorted_by_pkid()
    {
        var (controller, _) = NewSut(
            Status(3, "已停用", isDiscontinued: true),
            Status(1, "草稿", isDraft: true),
            Status(2, "已發佈", isPublished: true));

        var result = await controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var rows = Assert.IsAssignableFrom<IEnumerable<PublishStatus>>(ok.Value).ToList();
        Assert.Equal(new byte[] { 1, 2, 3 }, rows.Select(r => r.Pkid));
    }

    // ---------- Query / filter ----------

    [Fact]
    public async Task Query_filters_by_keyword_on_description()
    {
        var (controller, _) = NewSut(
            Status(1, "草稿", isDraft: true),
            Status(2, "已發佈", isPublished: true));

        var result = await controller.Query(new PublishStatusQuery { Keyword = "發佈" });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var rows = Assert.IsAssignableFrom<IEnumerable<PublishStatus>>(ok.Value).ToList();
        Assert.Single(rows);
        Assert.Equal((byte)2, rows[0].Pkid);
    }

    [Fact]
    public async Task Query_filters_by_boolean_flag()
    {
        var (controller, _) = NewSut(
            Status(1, "草稿", isDraft: true),
            Status(2, "已發佈", isPublished: true),
            Status(3, "已停用", isDiscontinued: true));

        var result = await controller.Query(new PublishStatusQuery { IsPublished = true });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var rows = Assert.IsAssignableFrom<IEnumerable<PublishStatus>>(ok.Value).ToList();
        Assert.Single(rows);
        Assert.All(rows, r => Assert.True(r.IsPublished));
    }

    [Fact]
    public async Task Query_with_empty_filter_returns_everything()
    {
        var (controller, _) = NewSut(
            Status(1, "草稿", isDraft: true),
            Status(2, "已發佈", isPublished: true));

        var result = await controller.Query(new PublishStatusQuery());

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var rows = Assert.IsAssignableFrom<IEnumerable<PublishStatus>>(ok.Value).ToList();
        Assert.Equal(2, rows.Count);
    }

    // ---------- View ----------

    [Fact]
    public async Task GetById_returns_row()
    {
        var (controller, _) = NewSut(Status(2, "已發佈", isPublished: true));

        var result = await controller.GetById(2);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var row = Assert.IsType<PublishStatus>(ok.Value);
        Assert.Equal("已發佈", row.Description);
        Assert.True(row.IsPublished);
    }

    [Fact]
    public async Task GetById_returns_404_when_missing()
    {
        var (controller, _) = NewSut(Status(1, "草稿", isDraft: true));

        var result = await controller.GetById(99);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    // ---------- Add ----------

    [Fact]
    public async Task Create_persists_row_and_returns_201()
    {
        var (controller, repo) = NewSut();
        var request = new PublishStatusRequest
        {
            Pkid = 5,
            Description = "審核中",
            IsDraft = true
        };

        var result = await controller.Create(request);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var row = Assert.IsType<PublishStatus>(created.Value);
        Assert.Equal((byte)5, row.Pkid);
        Assert.Equal(nameof(PublishStatusesController.GetById), created.ActionName);
        Assert.Equal(1, repo.Count);
    }

    [Fact]
    public async Task Create_returns_409_when_pkid_already_exists()
    {
        var (controller, _) = NewSut(Status(1, "草稿", isDraft: true));

        var result = await controller.Create(new PublishStatusRequest { Pkid = 1, Description = "重複" });

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Fact]
    public async Task Create_returns_400_when_description_blank()
    {
        var (controller, _) = NewSut();

        var result = await controller.Create(new PublishStatusRequest { Pkid = 1, Description = "  " });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    // ---------- Edit ----------

    [Fact]
    public async Task Update_modifies_row_and_returns_204()
    {
        var (controller, repo) = NewSut(Status(1, "草稿", isDraft: true));

        var result = await controller.Update(new PublishStatusRequest
        {
            Pkid = 1,
            Description = "已發佈",
            IsDraft = false,
            IsPublished = true
        });

        Assert.IsType<NoContentResult>(result);
        var updated = await repo.GetByIdAsync(1);
        Assert.Equal("已發佈", updated!.Description);
        Assert.True(updated.IsPublished);
        Assert.False(updated.IsDraft);
    }

    [Fact]
    public async Task Update_returns_404_when_row_missing()
    {
        var (controller, _) = NewSut();

        var result = await controller.Update(new PublishStatusRequest { Pkid = 9, Description = "x" });

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Update_returns_400_when_description_blank()
    {
        var (controller, _) = NewSut(Status(1, "草稿", isDraft: true));

        var result = await controller.Update(new PublishStatusRequest { Pkid = 1, Description = "" });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ---------- Delete ----------

    [Fact]
    public async Task Delete_removes_row_and_returns_204()
    {
        var (controller, repo) = NewSut(Status(1, "草稿", isDraft: true));

        var result = await controller.Delete(1);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(0, repo.Count);
    }

    [Fact]
    public async Task Delete_returns_404_when_row_missing()
    {
        var (controller, _) = NewSut();

        var result = await controller.Delete(9);

        Assert.IsType<NotFoundResult>(result);
    }
}
