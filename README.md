# vuducnam.dev

Trang cá nhân của Vũ Đức Nam, kể dưới dạng một câu chuyện 6 chương: **Hành trình ngọn lửa**.
Static site, hai ngôn ngữ, không database, không CMS. Cảnh 3D vẽ bằng three.js, chữ là HTML thật.

- `https://vuducnam.dev/` — tiếng Việt
- `https://vuducnam.dev/en/` — English

| Chương | Cảnh 3D |
| --- | --- |
| Mở đầu | Đốm than bay trong bóng tối |
| 1 · Tia lửa | Một đốm sáng, vài tia bắn lên |
| 2 · Ngọn lửa | Hạt tụ thành ngọn lửa |
| 3 · Lò rèn | Ba khối xoay: hộp, vòng xuyến, bát diện |
| 4 · Ngọn đuốc | Đuốc ở trung tâm, nối ra mạng nút |
| 5 · Cách tổ chức | Năm ngọn lửa nhỏ |
| 6 · Còn gì để cháy? | Một ngọn lửa lớn |

## Sửa nội dung

| File | Nội dung |
| --- | --- |
| `content/vi.yml` | Bản tiếng Việt |
| `content/en.yml` | Bản tiếng Anh |
| `content/site.yml` | Dùng chung: domain, email, GitHub |

Sửa file (trên GitHub web hoặc local) → commit lên `main` → Cloudflare Pages tự build và phát hành.

Mỗi chương trong `chapters` có `name` và `title`, cộng các mục tùy chọn: `body`, `chips`, `roles`, `principles`, `aside`, `contact`.
Cảnh 3D gắn với chương theo thứ tự, nên phải giữ đúng 6 chương; build sẽ báo lỗi nếu số chương khác.

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
src/story.js    cảnh 3D (three.js r128, đóng gói kèm site)
public/         favicon, _headers
build.mjs       content + src -> dist/
```

Build sinh ra `index.html`, `en/index.html`, `404.html`, `sitemap.xml` (có hreflang), `robots.txt`, và CSS/JS có hash để cache lâu dài.
Không có WebGL hoặc tắt JavaScript thì trang vẫn đọc được đầy đủ, chỉ không có cảnh 3D. Người dùng bật "giảm chuyển động" sẽ thấy cảnh chạy chậm và không xoáy khi chuyển chương.

## Cloudflare Pages

| Thiết lập | Giá trị |
| --- | --- |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `main` |
| Node version | lấy từ `.node-version` (22) |

Custom domain: `vuducnam.dev`. Nên bật thêm **Email Routing** (`hello@vuducnam.dev` → Gmail) và **Email Address Obfuscation**.
