# 哈特导航（前端原型）

一个以 UI/UX 为核心的个性化导航页原型，支持主题色切换、三种布局、分类/书签管理、分享只读页、Supabase 登录注册、搜索引擎切换与站内检索。

## 运行

```bash
python3 -m http.server 5173
# 浏览器打开 http://localhost:5173
```

## Supabase Auth 已接入
- URL：`https://mmifbnecjietsiaoeyqq.supabase.co`
- Publishable Key：`sb_publishable_VWxPtJtSTs8cHLstsNIMsA_z_0raT-Z`
- 登录方式：邮箱 OTP / 手机 OTP（验证码）

> 手机号请使用 E.164 格式（如 `+8613812345678`）。

## 文件说明
- `index.html`：页面结构与交互容器。
- `styles.css`：视觉系统（玻璃拟态、动态背景、响应式、布局模式）。
- `app.js`：核心业务逻辑（数据模型、渲染、搜索、分享、Supabase Auth）。
- `docs/solution.md`：设计说明、移动适配说明、数据库设计（dh_前缀）、技术方案。

