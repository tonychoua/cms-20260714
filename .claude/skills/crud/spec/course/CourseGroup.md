# 功能規格：CourseGroup（課程群組）

> 由 `/crud` 依 `promotion.sql` 之 `CourseGroup` 資料表結構產生。
> （`SUB_SYSTEM=course`，但課程領域各表實際定義於 `promotion.sql`；此為結構來源。）

## 摘要

| 項目 | 內容 |
| --- | --- |
| 主鍵 | `pkid` `smallint` **IDENTITY(1,1)**（C# `short`） |
| 外鍵（出站） | 無 |
| 必填欄位 | `Description` |
| N-N 關聯 | 無（`PartnerCourseGroup` 為帶負載之子實體，非純連結表——見下方說明） |
| 入站參照（Primary-Foreign） | `Course`、`PartnerCourseGroup` 皆以 `CourseGroup_pkid` 參照本表 |
| 查詢篩選 | keyword（LIKE `Description`） |
| 預設排序 | `ORDER BY pkid DESC` |

## 顯示名稱

| 項目 | 顯示名稱 |
| --- | --- |
| 資料表 | 課程群組 CourseGroup |
| `pkid` | 群組代碼 |
| `Description` | 群組說明 |

## 資料表結構

| 欄位 | 型別 | 可空 | 說明 |
| --- | --- | --- | --- |
| `pkid` | `smallint` IDENTITY | NOT NULL | **主鍵，自動遞增**（C# `short`），寫入 DTO 排除 |
| `Description` | `nvarchar(100)` | NOT NULL | 必填 |

- 主鍵：`pkid`（`PK_CourseGroup`）
- 外鍵（出站）：無 → 無 Foreign-Primary 導覽連結
- 特殊型別：無 `nchar` / `date` / `time` 欄位，故不需 `RTRIM()` 或 Dapper 型別處理器

## 必填 vs 選填

- 必填（NOT NULL，排除 IDENTITY PK）：`Description`
- 選填（nullable）：無

## 入站參照（Primary-Foreign Links）

以下資料表以 FK 參照 `CourseGroup.pkid`：

| 子資料表 | 欄位 | 可空 | 約束 | 對應中文 |
| --- | --- | --- | --- | --- |
| `Course` | `CourseGroup_pkid` | NULL | `FK_Course_CourseGroup` | 對應課程 |
| `PartnerCourseGroup` | `CourseGroup_pkid` | NOT NULL | `FK_PartnerCourseGroup_CourseGroup` | 對應夥伴課程群組 |

> **決策**：`Course`、`PartnerCourseGroup` 功能尚未建置。沿用 PublishStatus / Partner 慣例，
> 詳情頁**暫不加入**子實體導覽按鈕；待對應功能建立後再補上
> `/courses?courseGroupPkid=`、`/partner-course-groups?courseGroupPkid=` 連結。

## N-N 關聯

**無（N/A）。**

`PartnerCourseGroup` 連接 `Partner` ↔ `CourseGroup`，但它並非純連結表——具有自身
`pkid` IDENTITY 與負載欄位 `DisplayOrder`、`Description`。若以 delete-then-reinsert 的多選
N-N 處理，將**遺失負載資料**。故視為獨立子實體（見上方入站參照），不在 CourseGroup 表單以
多選控制項管理。

## 查詢篩選（`POST /api/course-groups/query`）

- `keyword`：對 `Description` 做 LIKE
- 無 FK 篩選（無出站外鍵）、無布林篩選（無 `bit` 欄位）、無日期範圍（無日期欄位）

## 預設排序

`ORDER BY pkid DESC`（無 `DisplayOrder` 或日期欄位；`pkid` 為 IDENTITY，採慣例次選 `pkid DESC` 顯示最新在前）

## Lookup 端點

因 `Course` / `PartnerCourseGroup` 未來表單需以本表為下拉來源，新增精簡 lookup：

| 路由 | 狀態 | 回傳 |
| --- | --- | --- |
| `GET /api/lookups/course-groups` | 新增 | `[{ pkid, description }]`，`ORDER BY Description ASC` |

## API 端點（`api/course-groups`）

| 方法 | 路由 | 說明 |
| --- | --- | --- |
| GET | `/api/course-groups` | 全部（依預設排序） |
| POST | `/api/course-groups/query` | 篩選查詢（body：`CourseGroupQuery`） |
| GET | `/api/course-groups/{id}` | 依 pkid 取單筆（`id` 為 `short`；找不到回 404） |
| POST | `/api/course-groups` | 新增（pkid 由 IDENTITY 產生，回 201 + 新物件） |
| PUT | `/api/course-groups` | 更新（pkid 取自 body；找不到回 404） |
| DELETE | `/api/course-groups/{id}` | 刪除（回 204；找不到回 404） |

- 路由 `{id}` 為數值，維持與 PublishStatus / Partner 一致（不加 `:int` 約束）
- 無 auth 例外標註

## 後端模型

- `CourseGroup.cs`：`short Pkid`、`string Description`
- `CourseGroupRequest.cs`：`string Description`（**排除 `Pkid`**，新增時）；更新時 body 內含 `Pkid`。
  `Description` 加 `[Required]` + `[MaxLength(100)]`
- `CourseGroupQuery.cs`：`string? Keyword`
- `CourseGroupLookup.cs`：`short Pkid`、`string Description`

## Dapper SQL 模式

- SELECT 欄位常數：`pkid AS Pkid, Description`
- `GetAllAsync` / `QueryAsync`：`ORDER BY pkid DESC`；query 以
  `(@Keyword IS NULL OR Description LIKE @kw)`
- INSERT：寫入 `Description`；結尾 `SELECT CAST(SCOPE_IDENTITY() AS smallint)` 取回新 pkid
- UPDATE / DELETE：以 `pkid` 為條件
- 無交易、無 N-N（單表寫入）
- 注入 `RowAuditWriter`，於 INSERT / UPDATE / DELETE 後記錄異動

## 前端

- 路由：`/course-groups`、`/course-groups/new`、`/course-groups/:id`、`/course-groups/:id/edit`（`/new` 置於 `/:id` 之前）
- Model 介面：`CourseGroup` / `CourseGroupRequest` / `CourseGroupQuery`（`core/models/course-group.model.ts`）
- Service：PK 為數值，`getById`/`delete` 直接內插（不需 `encodeURIComponent`）
- List：欄位 = 群組代碼 / 群組說明 / 操作；篩選抽屜僅含 keyword 文字框；預設排序 pkid DESC；
  session 鍵 `course-group-list-filters` / `course-group-list-sort` / `course-group-list-page`
- Detail：卡片顯示各欄位；`RowAuditBadgeComponent` 置於工具列 `#start`
- Form：Reactive Forms；`Description` 用 `pInputText`（必填）；
  sticky `p-toolbar`（沿用 AppRole 樣式）；工具列 `#start` 放 `RowAuditBadgeComponent`
- 刪除確認：`確定要刪除群組代碼 <b>${item.pkid}</b>「${item.description}」？`

## 側邊欄放置

既有或新增群組 `課程管理`（sublabel `Course`），項目
「課程群組 / CourseGroup」，`icon: pi pi-sitemap`，`route: /course-groups`。

## 測試

- 後端 xUnit：`CourseGroupsControllerTests` + `FakeCourseGroupRepository`
  （list / query 篩選 keyword / get-by-id 找到+404 / create 201 / update 204+404 / delete 204+404 / 必填缺漏回 400）
- 前端：`course-group.service.spec.ts`（各方法 URL/verb）、list/detail/form 三個元件 spec

## 建立 / 修改檔案清單

**後端（CMS.API）**
- 新增：`Models/CourseGroup.cs`、`Models/CourseGroupRequest.cs`、`Models/CourseGroupQuery.cs`、`Models/CourseGroupLookup.cs`
- 新增：`Repositories/ICourseGroupRepository.cs`、`Repositories/CourseGroupRepository.cs`
- 新增：`Controllers/CourseGroupsController.cs`
- 修改：`Program.cs`（註冊 repo）、`Controllers/LookupsController.cs`、`Repositories/ILookupRepository.cs`、`Repositories/LookupRepository.cs`（course-groups lookup）

**後端測試（CMS.API.Tests）**
- 新增：`Fakes/FakeCourseGroupRepository.cs`、`CourseGroupsControllerTests.cs`

**前端（CMS.NG）**
- 新增：`core/models/course-group.model.ts`
- 新增：`features/course-groups/course-group.service.ts`（+ `.spec.ts`）
- 新增：`features/course-groups/course-group-list/*`（ts/html/scss/spec）
- 新增：`features/course-groups/course-group-detail/*`
- 新增：`features/course-groups/course-group-form/*`
- 修改：`app.routes.ts`、`app.ts`（側邊欄「課程管理 Course」群組）
