# Ảnh cho game

Thả ảnh vào thư mục này (thư mục đã nằm trong `.gitignore`, ảnh không bị đẩy lên git):

- `face.jpg` — ảnh chụp thẳng mặt chị Ngân, cắt **vuông**, mặt ở giữa, thấy tóc hồng đỏ.
  Dùng làm "đầu to" cho nhân vật. Nếu không có, game tự dùng đầu hoạt hình.
  Chỉnh vùng cắt trong `src/content.js` → `photos.faceCrop`.
- `memory-1.jpg`, `memory-2.jpg`, … — ảnh chung / ảnh kỷ niệm cho thiệp cuối game.
  Khai báo tên file + chú thích trong `src/content.js` → `photos.memories`.

Nên nén ảnh xuống khoảng 1080px cạnh dài để game tải nhanh trên điện thoại.
