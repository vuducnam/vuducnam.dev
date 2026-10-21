# vuducnam.dev

Trang cá nhân của Vũ Đức Nam. Static site, hai ngôn ngữ, không database, không CMS.

- `https://vuducnam.dev/` — tiếng Việt
- `https://vuducnam.dev/en/` — English

## Sửa nội dung

Toàn bộ chữ trên trang nằm trong `content/`:

| File | Nội dung |
| --- | --- |
| `content/vi.yml` | Bản tiếng Việt |
| `content/en.yml` | Bản tiếng Anh |
| `content/site.yml` | Dùng chung: domain, email, GitHub, link công ty |

Sửa file (trên GitHub web hoặc local) → commit lên `main` → Cloudflare Pages tự build và phát hành sau khoảng một phút. Mở Pull Request thì có preview URL riêng để xem trước.

Hai file `vi.yml` và `en.yml` phải có cùng cấu trúc khóa. Build sẽ báo lỗi nếu thiếu một mục lớn.

## Chạy local

```bash
npm install
npm run build      # tạo dist/
npm run preview    # build rồi mở server tĩnh
```

## Cấu trúc

```
content/        nội dung (YAML)
src/render.mjs  template HTML
src/styles.css  giao diện
public/         favicon, _headers (copy nguyên vào dist/)
build.mjs       content + src -> dist/
```

Build sinh ra `index.html`, `en/index.html`, `404.html`, `sitemap.xml` (có hreflang), `robots.txt` và file CSS có hash để cache lâu dài.

## Cloudflare Pages

Workers & Pages → Create → Pages → Connect to Git → chọn repo này:

| Thiết lập | Giá trị |
| --- | --- |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `main` |
| Node version | lấy từ `.node-version` (22) |

Sau đó vào **Custom domains** → thêm `vuducnam.dev`.

Nên bật thêm:

- **Email Routing**: tạo `hello@vuducnam.dev` → chuyển tiếp về Gmail.
- **Scrape Shield → Email Address Obfuscation**: giấu địa chỉ email khỏi bot thu thập.
