# Web AR Shirt

Ứng dụng web AR dùng React, Vite, Three.js và MindAR để nhận diện hình in trên áo, sau đó phát animation/video chồng lên marker bằng camera của thiết bị.

## Tính năng

- Trang bắt đầu đơn giản với nút `Start Scan`.
- Trang scan camera tại route `/scan`.
- Nhận diện target MindAR từ file `.mind`.
- Hiển thị animation video lên trên hình in áo.
- Chạy local bằng HTTPS để trình duyệt cho phép truy cập camera.

## Công nghệ sử dụng

- React 19
- Vite 7
- TypeScript
- MindAR
- Three.js
- Vite basic SSL plugin

## Yêu cầu môi trường

- Node.js phiên bản mới, khuyến nghị Node 20 trở lên.
- npm.
- Thiết bị có camera nếu muốn test AR thật.
- Trình duyệt hỗ trợ WebGL và camera API.

## Cài đặt

```bash
npm install
```

## Chạy môi trường dev

```bash
npm run dev
```

Vite sẽ chạy server local bằng HTTPS. Mở URL mà terminal hiển thị, thường có dạng:

```text
https://localhost:5173
```

Nếu test trên điện thoại, hãy mở URL mạng LAN do Vite hiển thị. Camera thường chỉ hoạt động trên HTTPS hoặc localhost.

## Build production

```bash
npm run build
```

Kết quả build nằm trong thư mục `dist/`.

## Xem thử bản build

```bash
npm run preview
```

## Cấu trúc thư mục chính

```text
public/
  animations/        Video hoặc animation dùng làm AR overlay
  targets/           File target .mind của MindAR
src/
  ar/                Component xử lý MindAR và Three.js
  config/            Cấu hình target AR
  pages/             Các màn hình Home và Scan
  styles/            CSS toàn cục
```

## Cấu hình target AR

File cấu hình chính nằm ở:

```text
src/config/arTargets.ts
```

Ví dụ target hiện tại:

```ts
{
  id: 'shirt-01',
  targetSrc: '/targets/shirt-01.mind',
  animationSrc: '/animations/shirt-01.mp4',
  animationType: 'video',
  targetIndex: 0,
  overlayWidth: 1,
  overlayHeight: 1.25
}
```

Khi muốn thay hình nhận diện hoặc animation:

1. Thêm file `.mind` vào `public/targets/`.
2. Thêm video hoặc animation vào `public/animations/`.
3. Cập nhật `src/config/arTargets.ts`.

## Ghi chú khi phát triển

- Không commit `node_modules/` hoặc `dist/`; các thư mục này đã được bỏ qua trong `.gitignore`.
- File `.mind` cần được tạo đúng từ hình marker bằng công cụ của MindAR.
- Nếu camera không mở được, hãy kiểm tra quyền camera của trình duyệt và đảm bảo app đang chạy trên HTTPS.

## Scripts

```bash
npm run dev      # chạy môi trường phát triển
npm run build    # build production
npm run preview  # xem thử bản build
```
