using CMS.API.Controllers;
using CMS.API.Models;
using CMS.API.Tests.Fakes;
using Microsoft.AspNetCore.Mvc;

namespace CMS.API.Tests;

public class PartnersControllerTests
{
    private static Partner Make(
        short pkid, string name, string appKey = "key", int displayOrder = 0, string? image = null) => new()
    {
        Pkid = pkid,
        Name = name,
        AppKey = appKey,
        NameOnPartnerMenu = name + " 選單",
        NameOnCourseDetailPage = name + " 課程",
        DisplayOrder = displayOrder,
        ImageFilename = image
    };

    private static PartnerRequest Request(
        short pkid = 0, string name = "夥伴", string appKey = "key", int displayOrder = 0) => new()
    {
        Pkid = pkid,
        Name = name,
        AppKey = appKey,
        NameOnPartnerMenu = name + " 選單",
        NameOnCourseDetailPage = name + " 課程",
        DisplayOrder = displayOrder
    };

    private static (PartnersController controller, FakePartnerRepository repo) NewSut(params Partner[] seed)
    {
        var repo = new FakePartnerRepository(seed);
        return (new PartnersController(repo), repo);
    }

    // ---------- List ----------

    [Fact]
    public async Task GetAll_returns_all_rows_sorted_by_display_order()
    {
        var (controller, _) = NewSut(
            Make(3, "C", displayOrder: 3),
            Make(1, "A", displayOrder: 1),
            Make(2, "B", displayOrder: 2));

        var result = await controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var rows = Assert.IsAssignableFrom<IEnumerable<Partner>>(ok.Value).ToList();
        Assert.Equal(new short[] { 1, 2, 3 }, rows.Select(r => r.Pkid));
    }

    // ---------- Query / filter ----------

    [Fact]
    public async Task Query_filters_by_keyword_across_name_columns()
    {
        var (controller, _) = NewSut(
            Make(1, "台積電"),
            Make(2, "鴻海"));

        var result = await controller.Query(new PartnerQuery { Keyword = "鴻海" });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var rows = Assert.IsAssignableFrom<IEnumerable<Partner>>(ok.Value).ToList();
        Assert.Single(rows);
        Assert.Equal((short)2, rows[0].Pkid);
    }

    [Fact]
    public async Task Query_with_empty_filter_returns_everything()
    {
        var (controller, _) = NewSut(Make(1, "A"), Make(2, "B"));

        var result = await controller.Query(new PartnerQuery());

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var rows = Assert.IsAssignableFrom<IEnumerable<Partner>>(ok.Value).ToList();
        Assert.Equal(2, rows.Count);
    }

    // ---------- View ----------

    [Fact]
    public async Task GetById_returns_row()
    {
        var (controller, _) = NewSut(Make(2, "鴻海"));

        var result = await controller.GetById(2);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var row = Assert.IsType<Partner>(ok.Value);
        Assert.Equal("鴻海", row.Name);
    }

    [Fact]
    public async Task GetById_returns_404_when_missing()
    {
        var (controller, _) = NewSut(Make(1, "A"));

        var result = await controller.GetById(99);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    // ---------- Add ----------

    [Fact]
    public async Task Create_persists_row_and_returns_201_with_generated_pkid()
    {
        var (controller, repo) = NewSut();

        var result = await controller.Create(Request(name: "新夥伴"));

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var row = Assert.IsType<Partner>(created.Value);
        Assert.Equal((short)1, row.Pkid); // IDENTITY-assigned by the fake
        Assert.Equal(nameof(PartnersController.GetById), created.ActionName);
        Assert.Equal(1, repo.Count);
    }

    [Fact]
    public async Task Create_returns_400_when_name_blank()
    {
        var (controller, _) = NewSut();

        var result = await controller.Create(Request(name: "  "));

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Create_returns_400_when_app_key_blank()
    {
        var (controller, _) = NewSut();

        var result = await controller.Create(Request(appKey: ""));

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    // ---------- Edit ----------

    [Fact]
    public async Task Update_modifies_row_and_returns_204()
    {
        var (controller, repo) = NewSut(Make(1, "舊名"));

        var result = await controller.Update(Request(pkid: 1, name: "新名", displayOrder: 5));

        Assert.IsType<NoContentResult>(result);
        var updated = await repo.GetByIdAsync(1);
        Assert.Equal("新名", updated!.Name);
        Assert.Equal(5, updated.DisplayOrder);
    }

    [Fact]
    public async Task Update_returns_404_when_row_missing()
    {
        var (controller, _) = NewSut();

        var result = await controller.Update(Request(pkid: 9, name: "x"));

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Update_returns_400_when_name_blank()
    {
        var (controller, _) = NewSut(Make(1, "A"));

        var result = await controller.Update(Request(pkid: 1, name: ""));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ---------- Delete ----------

    [Fact]
    public async Task Delete_removes_row_and_returns_204()
    {
        var (controller, repo) = NewSut(Make(1, "A"));

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
