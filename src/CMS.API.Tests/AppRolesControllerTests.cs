using CMS.API.Controllers;
using CMS.API.Models;
using CMS.API.Tests.Fakes;
using Microsoft.AspNetCore.Mvc;

namespace CMS.API.Tests;

public class AppRolesControllerTests
{
    private static AppRole Role(string id, string name, int level, params string[] users) => new()
    {
        RoleId = id,
        RoleName = name,
        PermissionLevel = level,
        Description = $"{name} desc",
        UserIds = users.ToList()
    };

    private static (AppRolesController controller, FakeAppRoleRepository repo) NewSut(params AppRole[] seed)
    {
        var repo = new FakeAppRoleRepository(seed);
        return (new AppRolesController(repo), repo);
    }

    // ---------- List ----------

    [Fact]
    public async Task GetAll_returns_all_roles_sorted_by_permission_level()
    {
        var (controller, _) = NewSut(
            Role("Editor", "Editor", 50),
            Role("Admin", "Administrator", 1),
            Role("Viewer", "Viewer", 100));

        var result = await controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var roles = Assert.IsAssignableFrom<IEnumerable<AppRole>>(ok.Value).ToList();
        Assert.Equal(3, roles.Count);
        Assert.Equal(new[] { "Admin", "Editor", "Viewer" }, roles.Select(r => r.RoleId));
    }

    // ---------- Query / filter ----------

    [Fact]
    public async Task Query_filters_by_keyword_on_roleid_and_rolename()
    {
        var (controller, _) = NewSut(
            Role("Admin", "Administrator", 1),
            Role("Editor", "Content Editor", 50),
            Role("Viewer", "Viewer", 100));

        var result = await controller.Query(new AppRoleQuery { Keyword = "admin" });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var roles = Assert.IsAssignableFrom<IEnumerable<AppRole>>(ok.Value).ToList();
        Assert.Single(roles);
        Assert.Equal("Admin", roles[0].RoleId);
    }

    [Fact]
    public async Task Query_filters_by_permission_level_exact()
    {
        var (controller, _) = NewSut(
            Role("Admin", "Administrator", 1),
            Role("Editor", "Editor", 50),
            Role("Author", "Author", 50));

        var result = await controller.Query(new AppRoleQuery { PermissionLevel = 50 });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var roles = Assert.IsAssignableFrom<IEnumerable<AppRole>>(ok.Value).ToList();
        Assert.Equal(2, roles.Count);
        Assert.All(roles, r => Assert.Equal(50, r.PermissionLevel));
    }

    [Fact]
    public async Task Query_with_empty_filter_returns_everything()
    {
        var (controller, _) = NewSut(
            Role("Admin", "Administrator", 1),
            Role("Editor", "Editor", 50));

        var result = await controller.Query(new AppRoleQuery());

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var roles = Assert.IsAssignableFrom<IEnumerable<AppRole>>(ok.Value).ToList();
        Assert.Equal(2, roles.Count);
    }

    // ---------- View ----------

    [Fact]
    public async Task GetById_returns_role_with_assigned_users()
    {
        var (controller, _) = NewSut(Role("Admin", "Administrator", 1, "helen", "miles"));

        var result = await controller.GetById("Admin");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var role = Assert.IsType<AppRole>(ok.Value);
        Assert.Equal("Administrator", role.RoleName);
        Assert.Equal(new[] { "helen", "miles" }, role.UserIds);
    }

    [Fact]
    public async Task GetById_returns_404_when_missing()
    {
        var (controller, _) = NewSut(Role("Admin", "Administrator", 1));

        var result = await controller.GetById("Nope");

        Assert.IsType<NotFoundResult>(result.Result);
    }

    // ---------- Add ----------

    [Fact]
    public async Task Create_persists_role_and_returns_201()
    {
        var (controller, repo) = NewSut();
        var request = new AppRoleRequest
        {
            RoleId = "Editor",
            RoleName = "Content Editor",
            PermissionLevel = 50,
            Description = "編輯者",
            UserIds = ["helen"]
        };

        var result = await controller.Create(request);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var role = Assert.IsType<AppRole>(created.Value);
        Assert.Equal("Editor", role.RoleId);
        Assert.Equal(nameof(AppRolesController.GetById), created.ActionName);
        Assert.Equal(1, repo.Count);
    }

    [Fact]
    public async Task Create_returns_409_when_roleid_already_exists()
    {
        var (controller, _) = NewSut(Role("Admin", "Administrator", 1));

        var result = await controller.Create(new AppRoleRequest
        {
            RoleId = "Admin",
            RoleName = "Dup",
            PermissionLevel = 1
        });

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Fact]
    public async Task Create_returns_400_when_roleid_blank()
    {
        var (controller, _) = NewSut();

        var result = await controller.Create(new AppRoleRequest { RoleId = "  ", RoleName = "x" });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    // ---------- Edit ----------

    [Fact]
    public async Task Update_modifies_role_and_returns_204()
    {
        var (controller, repo) = NewSut(Role("Admin", "Administrator", 1, "helen"));

        var result = await controller.Update(new AppRoleRequest
        {
            RoleId = "Admin",
            RoleName = "Super Admin",
            PermissionLevel = 0,
            Description = "系統管理員",
            UserIds = ["helen", "miles"]
        });

        Assert.IsType<NoContentResult>(result);
        var updated = await repo.GetByIdAsync("Admin");
        Assert.Equal("Super Admin", updated!.RoleName);
        Assert.Equal(0, updated.PermissionLevel);
        Assert.Equal(new[] { "helen", "miles" }, updated.UserIds);
    }

    [Fact]
    public async Task Update_returns_404_when_role_missing()
    {
        var (controller, _) = NewSut();

        var result = await controller.Update(new AppRoleRequest { RoleId = "Ghost", RoleName = "x" });

        Assert.IsType<NotFoundResult>(result);
    }

    // ---------- Delete ----------

    [Fact]
    public async Task Delete_removes_role_and_returns_204()
    {
        var (controller, repo) = NewSut(Role("Temp", "Temp", 100));

        var result = await controller.Delete("Temp");

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(0, repo.Count);
    }

    [Fact]
    public async Task Delete_returns_404_when_role_missing()
    {
        var (controller, _) = NewSut();

        var result = await controller.Delete("Ghost");

        Assert.IsType<NotFoundResult>(result);
    }
}
