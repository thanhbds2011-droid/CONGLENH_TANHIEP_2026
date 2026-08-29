# CONGLENH_TANHIEP_2026

## v154 - Performance & Reliability
- Chỉ mục ScriptProperties cho Phòng/Khu và Dashboard; không quét toàn bộ Nhật ký mỗi lần cấp.
- Kiểm tra trùng chỉ tra theo họ tên bằng TextFinder và đọc các dòng phù hợp.
- requestId/idempotency chống tạo PDF lặp khi callback chậm hoặc mất.
- Khóa nút Xuất PDF trong lúc xử lý và tự xác minh trạng thái khi lỗi truyền tải.
- Bỏ thời gian chờ cố định 600 ms khi xuất PDF; chỉ retry khi Drive chưa sẵn sàng.
- Cần chạy khoiTaoChiMucToiUu() một lần sau khi dán Apps Script v154.
