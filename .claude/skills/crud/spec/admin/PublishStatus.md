# 功能規格：PublishStatus（發佈狀態）

> 由 `/crud` 依 `auth.sql` / `promotion.sql` 之 `PublishStatus` 資料表結構產生。

## 顯示名稱

| 項目 | 顯示名稱 |
| --- | --- |
| 資料表 | 發佈狀態 PublishStatus |
| `pkid` | 狀態代碼 |
| `Description` | 狀態說明 |
| `IsDraft` | 草稿 |
| `IsPublished` | 已發佈 |
| `IsDiscontinued` | 已停用 |

## 資料表結構

| 欄位 | 型別 | 可空 | 說明 |
| --- | --- | --- | --- |
| `pkid` | `tinyint` | NOT NULL | **主鍵，非 IDENTITY —— 由使用者手動指定**（C# `byte`） |
| `Description` | `nvarchar(50)` | NOT NULL | 必填 |
| `IsDraft` | `bit` | NOT NULL | 布林 |
| `IsPublished` | `bit` | NOT NULL | 布林 |
| `IsDiscontinued` | `bit` | NOT NULL | 布林 |

- 主鍵：`pkid`（`PK_PublishingStatus`）
- 外鍵（出站）：無
- 外鍵（入站 / Primary-Foreign）：`Course.PublishStatus_pkid` → `PublishStatus.pkid`
  （`FK_Course_PublishStatus`）。Course 功能尚未建置，故詳情頁不加導覽按鈕。
- N-N：無

## 必填 vs 選填

- 必填：`pkid`（PK）、`Description`
- 其餘布林欄位皆 NOT NULL，預設 `false`

## 查詢篩選

- `keyword`：對 `Description` 做 LIKE
- `isDraft`：三態布林（全部 / 是 / 否）
- `isPublished`：三態布林
- `isDiscontinued`：三態布林

## 預設排序

`ORDER BY pkid ASC`（無 DisplayOrder 或日期欄位；此為小型查找表）

## API 端點（`api/publish-statuses`）

| 方法 | 路由 | 說明 |
| --- | --- | --- |
| GET | `/api/publish-statuses` | 全部 |
| POST | `/api/publish-statuses/query` | 篩選查詢 |
| GET | `/api/publish-statuses/{id}` | 依 pkid 取單筆（`id` 為數值 byte，無 `:int` 約束以維持一致性） |
| POST | `/api/publish-statuses` | 新增（pkid 由 body 指定；已存在回 409） |
| PUT | `/api/publish-statuses` | 更新（pkid 取自 body） |
| DELETE | `/api/publish-statuses/{id}` | 刪除 |

Lookup（步驟 13 —— 因 Course 參照本表）：
- GET `/api/lookups/publish-statuses` → `[{ pkid, description }]`

## 後端模型

- `PublishStatus.cs`：`byte Pkid`、`string Description`、`bool IsDraft/IsPublished/IsDiscontinued`
- `PublishStatusRequest.cs`：同上欄位（寫入 DTO）
- `PublishStatusQuery.cs`：`string? Keyword`、`bool? IsDraft/IsPublished/IsDiscontinued`
- `PublishStatusLookup.cs`：`byte Pkid`、`string Description`

## Dapper SQL 模式

- SELECT 欄位常數：`pkid AS Pkid, Description, IsDraft, IsPublished, IsDiscontinued`
- INSERT 明確帶入 `pkid`（**不使用 SCOPE_IDENTITY**，因非 identity）
- UPDATE / DELETE 以 `pkid` 為條件；無交易（無 N-N 或多列原子寫入需求）

## 前端

- 路由：`/publish-statuses`、`/publish-statuses/new`、`/publish-statuses/:id`、`/publish-statuses/:id/edit`
- Model 介面：`PublishStatus` / `PublishStatusRequest` / `PublishStatusQuery`
- Service：PK 為數值，`getById`/`delete` 直接內插（不需 `encodeURIComponent`）
- List：欄位 = 狀態代碼 / 狀態說明 / 草稿 / 已發佈 / 已停用 / 操作；布林以 `p-tag` 呈現；
  篩選抽屜含 keyword + 三個 `p-select` 三態；預設排序 pkid ASC
- Detail：卡片顯示各欄位，布林以 `p-tag`（是/否）呈現
- Form：Reactive Forms；`pkid` 用 `p-inputNumber`（編輯模式停用）；`Description` 用 `pInputText`；
  三個布林用 `p-checkbox [binary]`；sticky 工具列（沿用 AppRole 樣式）
- Sidebar：加入既有「系統管理 / Admin」群組，項目「發佈狀態 / PublishStatus」

## 側邊欄放置

既有群組 `系統管理`（sublabel `Admin`）新增一項，`icon: pi pi-flag`，`route: /publish-statuses`。

## 測試

- 後端 xUnit：`PublishStatusesControllerTests` + `FakePublishStatusRepository`
  （list / query 篩選 / get-by-id 找到+404 / create 201+409+400 / update 204+404 / delete 204+404）
- 前端：`publish-status.service.spec.ts`（各方法 URL/verb）、list/detail/form 三個元件 spec

## 建立 / 修改檔案清單

**後端（CMS.API）**
- 新增：`Models/PublishStatus.cs`、`Models/PublishStatusRequest.cs`、`Models/PublishStatusQuery.cs`、`Models/PublishStatusLookup.cs`
- 新增：`Repositories/IPublishStatusRepository.cs`、`Repositories/PublishStatusRepository.cs`
- 新增：`Controllers/PublishStatusesController.cs`
- 修改：`Program.cs`（註冊 repo）、`Controllers/LookupsController.cs`、`Repositories/ILookupRepository.cs`、`Repositories/LookupRepository.cs`

**後端測試（CMS.API.Tests）**
- 新增：`Fakes/FakePublishStatusRepository.cs`、`PublishStatusesControllerTests.cs`

**前端（CMS.NG）**
- 新增：`core/models/publish-status.model.ts`
- 新增：`features/publish-statuses/publish-status.service.ts` (+ `.spec.ts`)
- 新增：`features/publish-statuses/publish-status-list/*`（ts/html/scss/spec）
- 新增：`features/publish-statuses/publish-status-detail/*`
- 新增：`features/publish-statuses/publish-status-form/*`
- 修改：`app.routes.ts`、`app.ts`（側邊欄）
