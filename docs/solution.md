# 哈特导航前端原型方案

## 1) 设计稿说明（文字化）

### A. 网格瀑布流布局（layout=grid）
- 左侧为层级分类轨道，右侧为 3 列卡片化书签区。
- 场景：高效查找，高信息密度。

### B. 分类抽屉式布局（layout=drawer）
- 左侧缩窄为抽屉导航，强调一级分类视觉标签。
- 场景：视觉沉浸、专注浏览。

### C. 极简单列式布局（layout=list）
- 分类切换以胶囊按钮平铺，书签单列展示。
- 场景：移动端快速操作。

### 移动端适配
- 将搜索区改为纵向堆叠，点击区增大。
- 书签卡片从多列切为单列，操作按钮横向分布。
- 分类栏转为横向可滚动。

## 2) 核心交互
- 主题色切换：6 个预设色板 + 持久化。
- 明暗模式切换：dark / light。
- 分类管理：支持一级/二级分类创建（原型用 prompt）。
- 网址管理：新增、编辑、删除，卡片悬停动效。
- 分享功能：导出当前状态到 URL hash，访客进入只读模式。
- 登录功能：已接入 Supabase Auth OTP（邮箱/手机号验证码），支持登录/注册一体化。
- 搜索功能：Google/Bing/百度切换 + 站内书签匹配。

## 3) 数据库表结构设计（Supabase, `dh_` 前缀）

### `dh_users`
| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid pk | 关联 auth.users.id |
| display_name | text | 昵称 |
| theme_mode | text | dark/light |
| theme_color | text | 主题色 |
| layout_mode | text | grid/drawer/list |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

### `dh_categories`
| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid pk | 分类ID |
| user_id | uuid fk | 所属用户 |
| parent_id | uuid nullable | 父分类（null=一级） |
| name | text | 分类名称 |
| icon | text | 分类图标 |
| sort_order | int | 排序 |
| bg_color | text | 背景色 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

### `dh_bookmarks`
| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid pk | 书签ID |
| user_id | uuid fk | 所属用户 |
| category_id | uuid fk | 归属分类 |
| title | text | 显示名称 |
| url | text | 链接 |
| icon_type | text | upload/builtin/fav |
| icon_value | text | 图标内容 |
| note | text | 备注 |
| sort_order | int | 排序 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

### `dh_shares`
| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid pk | 分享ID |
| user_id | uuid fk | 分享人 |
| slug | text unique | 自定义后缀 |
| snapshot | jsonb | 分享快照 |
| is_public | bool | 是否公开 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

## 4) 技术实现建议
- 前端：HTML + CSS + Vanilla JS 原型，后续可平滑迁移到 React/Vue。
- 状态管理：本地 `localStorage` 持久化，认证状态由 Supabase Session 驱动并同步到 UI。
- 性能：
  - 通过 CSS 变量驱动主题，降低重绘成本。
  - 仅针对当前分类渲染卡片。
  - hover 动效尽量使用 `transform` 和 `box-shadow`。
- 安全：分享链接只读，写操作按钮自动禁用。

