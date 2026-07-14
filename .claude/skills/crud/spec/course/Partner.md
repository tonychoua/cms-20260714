# 功能規格：Partner（合作夥伴）

> 由 `/crud` 依 `promotion.sql` 之 `Partner` 資料表結構產生。
> （`SUB_SYSTEM=course`，但課程領域各表實際定義於 `promotion.sql`；此為結構來源。）

## 摘要

| 項目 | 內容 |
| --- | --- |
| 主鍵 | `pkid` `smallint` **IDENTITY(1,1)**（C# `short`） |
| 外鍵（出站） | 無 |
| 必填欄位 | `Name`、`AppKey`、`NameOnPartnerMenu`、`NameOnCourseDetailPage`、`DisplayOrder` |
| N-N 關聯 | 無（見下方說明：`PartnerCourseGroup` 為帶負載之子實體，非純連結表） |
| 入站參照（Primary-Foreign） | `Course`、`Certification`、`PartnerCourseGroup` 皆以 `Partner_pkid` 參照本表 |
| 查詢篩選 | keyword（LIKE） |
| 預設排序 | `ORDER BY DisplayOrder ASC, pkid ASC` |

## 顯示名稱

| 項目 | 顯示名稱 |
| --- | --- |
| 資料表 | 合作夥伴 Partner |
| `pkid` | 夥伴代碼 |
| `Name` | 名稱 |
| `AppKey` | 應用金鑰 (AppKey) |
| `NameOnPartnerMenu` | 夥伴選單顯示名稱 |
| `NameOnCourseDetailPage` | 課程詳情頁顯示名稱 |
| `DisplayOrder` | 顯示順序 |
| `ImageFilename` | 圖片檔名 |

## 資料表結構

| 欄位 | 型別 | 可空 | 說明 |
| --- | --- | --- | --- |
| `pkid` | `smallint` IDENTITY | NOT NULL | **主鍵，自動遞增**（C# `short`），寫入 DTO 排除 |
| `Name` | `nvarchar(50)` | NOT NULL | 必填 |
| `AppKey` | `varchar(10)` | NOT NULL | 必填（無 UNIQUE 約束，不強制唯一） |
| `NameOnPartnerMenu` | `nvarchar(200)` | NOT NULL | 必填 |
| `NameOnCourseDetailPage` | `nvarchar(50)` | NOT NULL | 必填 |
| `DisplayOrder` | `int` | NOT NULL | 必填，顯示排序用 |
| `ImageFilename` | `varchar(50)` | NULL | 選填（C# `string?`） |

- 主鍵：`pkid`（`PK_Partner`）
- 外鍵（出站）：無 → 無 Foreign-Primary 導覽連結
- 特殊型別：無 `nchar` / `date` / `time` 欄位，故不需 `RTRIM()` 或 Dapper 型別處理器

## 必填 vs 選填

- 必填（NOT NULL，排除 IDENTITY PK）：`Name`、`AppKey`、`NameOnPartnerMenu`、`NameOnCourseDetailPage`、`DisplayOrder`
- 選填（nullable）：`ImageFilename`

## 入站參照（Primary-Foreign Links）

以下資料表以 FK 參照 `Partner.pkid`：

| 子資料表 | 欄位 | 約束 | 對應中文 |
| --- | --- | --- | --- |
| `Course` | `Partner_pkid` | `FK_Course_Partner` | 對應課程 |
| `Certification` | `Partner_pkid` | `FK_Certification_Partner` | 對應認證 |
| `PartnerCourseGroup` | `Partner_pkid` | `FK_PartnerCourseGroup_Partner` | 對應夥伴課程群組 |

> **決策**：`Course`、`Certification`、`PartnerCourseGroup` 功能尚未建置（本專案目前僅有 AppRole、PublishStatus）。
> 沿用 PublishStatus 慣例，詳情頁**暫不加入**子實體導覽按鈕；待對應功能建立後再補上
> `/courses?partnerPkid=`、`/certifications?partnerPkid=`、`/partner-course-groups?partnerPkid=` 連結。

## N-N 關聯

**無（N/A）。**

`PartnerCourseGroup` 連接 `Partner` ↔ `CourseGroup`，但它並非純連結表——具有自身
`pkid` IDENTITY 與負載欄位 `DisplayOrder`、`Description`。若以 delete-then-reinsert 的多選
N-N 處理，將**遺失負載資料**。故視為 Partner 的獨立子實體（見上方入站參照），
不在 Partner 表單以多選控制項管理。

## 查詢篩選（`POST /api/partners/query`）

- `keyword`：對 `Name`、`AppKey`、`NameOnPartnerMenu`、`NameOnCourseDetailPage` 做 LIKE（`OR` 串接）
- 無 FK 篩選（無出站外鍵）、無布林篩選（無 `bit` 欄位）、無日期範圍（無日期欄位）

## 預設排序

`ORDER BY DisplayOrder ASC, pkid ASC`（本表有 `DisplayOrder`，優先採用）

## Lookup 端點

因 `Course` / `Certification` / `PartnerCourseGroup` 未來表單需以本表為下拉來源，新增精簡 lookup：

| 路由 | 狀態 | 回傳 |
| --- | --- | --- |
| `GET /api/lookups/partners` | 新增 | `[{ pkid, name }]`，`ORDER BY DisplayOrder ASC, Name ASC` |

## API 端點（`api/partners`）

| 方法 | 路由 | 說明 |
| --- | --- | --- |
| GET | `/api/partners` | 全部（依預設排序） |
| POST | `/api/partners/query` | 篩選查詢（body：`PartnerQuery`） |
| GET | `/api/partners/{id}` | 依 pkid 取單筆（`id` 為 `short`；找不到回 404） |
| POST | `/api/partners` | 新增（pkid 由 IDENTITY 產生，回 201 + 新物件） |
| PUT | `/api/partners` | 更新（pkid 取自 body；找不到回 404） |
| DELETE | `/api/partners/{id}` | 刪除（回 204；找不到回 404） |

- 路由 `{id}` 為數值，維持與 PublishStatus 一致（不加 `:int` 約束）
- 無 auth 例外標註

## 後端模型

- `Partner.cs`：`short Pkid`、`string Name`、`string AppKey`、`string NameOnPartnerMenu`、
  `string NameOnCourseDetailPage`、`int DisplayOrder`、`string? ImageFilename`
- `PartnerRequest.cs`：同上但**排除 `Pkid`**（新增時）；更新時 body 內含 `Pkid`。
  必填欄位加 `[Required]`；字串加 `[MaxLength]`（50 / 10 / 200 / 50 / 50）
- `PartnerQuery.cs`：`string? Keyword`
- `PartnerLookup.cs`：`short Pkid`、`string Name`

## Dapper SQL 模式

- SELECT 欄位常數：
  `pkid AS Pkid, Name, AppKey, NameOnPartnerMenu, NameOnCourseDetailPage, DisplayOrder, ImageFilename`
- `GetAllAsync` / `QueryAsync`：`ORDER BY DisplayOrder ASC, pkid ASC`；query 以
  `(@Keyword IS NULL OR Name LIKE @kw OR AppKey LIKE @kw OR NameOnPartnerMenu LIKE @kw OR NameOnCourseDetailPage LIKE @kw)`
- INSERT：寫入 `Name, AppKey, NameOnPartnerMenu, NameOnCourseDetailPage, DisplayOrder, ImageFilename`；
  結尾 `SELECT CAST(SCOPE_IDENTITY() AS smallint)` 取回新 pkid
- UPDATE / DELETE：以 `pkid` 為條件
- 無交易、無 N-N（單表寫入）
- 注入 `RowAuditWriter`，於 INSERT / UPDATE / DELETE 後記錄異動

## 前端

- 路由：`/partners`、`/partners/new`、`/partners/:id`、`/partners/:id/edit`（`/new` 置於 `/:id` 之前）
- Model 介面：`Partner` / `PartnerRequest` / `PartnerQuery`（`core/models/partner.model.ts`）
- Service：PK 為數值，`getById`/`delete` 直接內插（不需 `encodeURIComponent`）
- List：欄位 = 夥伴代碼 / 名稱 / 應用金鑰 / 夥伴選單顯示名稱 / 顯示順序 / 操作；
  篩選抽屜僅含 keyword 文字框；預設排序 DisplayOrder ASC；
  session 鍵 `partner-list-filters` / `partner-list-sort` / `partner-list-page`
- Detail：卡片顯示各欄位；`RowAuditBadgeComponent` 置於工具列 `#start`
- Form：Reactive Forms；`Name`/`AppKey`/`NameOnPartnerMenu`/`NameOnCourseDetailPage` 用 `pInputText`；
  `DisplayOrder` 用 `p-inputNumber`；`ImageFilename` 用 `pInputText`（選填）；
  sticky `p-toolbar`（沿用 AppRole 樣式）；工具列 `#start` 放 `RowAuditBadgeComponent`
- 刪除確認：`確定要刪除夥伴代碼 <b>${item.pkid}</b>「${item.name}」？`

## 側邊欄放置

新增群組 `課程管理`（sublabel `Course`，若不存在則建立），項目
「合作夥伴 / Partner」，`icon: pi pi-users`，`route: /partners`。

## 測試

- 後端 xUnit：`PartnersControllerTests` + `FakePartnerRepository`
  （list / query 篩選 keyword / get-by-id 找到+404 / create 201 / update 204+404 / delete 204+404 / 必填缺漏回 400）
- 前端：`partner.service.spec.ts`（各方法 URL/verb）、list/detail/form 三個元件 spec

## 建立 / 修改檔案清單

**後端（CMS.API）**
- 新增：`Models/Partner.cs`、`Models/PartnerRequest.cs`、`Models/PartnerQuery.cs`、`Models/PartnerLookup.cs`
- 新增：`Repositories/IPartnerRepository.cs`、`Repositories/PartnerRepository.cs`
- 新增：`Controllers/PartnersController.cs`
- 修改：`Program.cs`（註冊 repo）、`Controllers/LookupsController.cs`、`Repositories/ILookupRepository.cs`、`Repositories/LookupRepository.cs`（partners lookup）

**後端測試（CMS.API.Tests）**
- 新增：`Fakes/FakePartnerRepository.cs`、`PartnersControllerTests.cs`

**前端（CMS.NG）**
- 新增：`core/models/partner.model.ts`
- 新增：`features/partners/partner.service.ts`（+ `.spec.ts`）
- 新增：`features/partners/partner-list/*`（ts/html/scss/spec）
- 新增：`features/partners/partner-detail/*`
- 新增：`features/partners/partner-form/*`
- 修改：`app.routes.ts`、`app.ts`（側邊欄新增「課程管理 Course」群組）
