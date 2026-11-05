# 🎮 EduPlay - Đấu Trường Trò Chơi Học Tập Tương Tác

Trang web trò chơi học tập tương tác toàn diện dành cho giáo viên và học sinh, hỗ trợ tải lên file câu hỏi **Word (.docx)** và danh sách lớp **Excel (.xlsx)** để tổ chức các trò chơi ôn tập sinh động trên lớp bằng máy chiếu / màn hình TV thông minh.

---

## 🌟 1. Các Trò Chơi Học Tập Có Sẵn

1. **Ai Là Triệu Phú (Who Wants to Be a Millionaire)**
   - Hệ thống 15 câu hỏi trắc nghiệm với thang tiền thưởng 200.000 VNĐ -> 150.000.000 VNĐ (tương ứng mốc điểm thưởng).
   - 4 Quyền trợ giúp sống còn:
     - `50:50`: Máy tính tự động loại bỏ 2 phương án sai.
     - `Hỏi ý kiến cả lớp`: Khảo sát biểu đồ cột trực quan tỉ lệ phần trăm các bạn học sinh trong lớp.
     - `Gọi cố vấn / Thầy cô`: Nhận lời khuyên gợi ý từ chuyên gia / giáo viên chủ nhiệm.
     - `Đổi câu hỏi`: Đổi sang câu hỏi khác mà không mất chuỗi thắng.
   - Đồng hồ đếm ngược 30 giây, hiệu ứng âm thanh hồi hộp và pháo hoa ăn mừng.

2. **Đào Vàng Tri Thức (Gold Miner)**
   - Khung cảnh mỏ quặng dưới lòng đất sinh động với nhiều loại quặng: *Cục Vàng Khổng Lồ, Thỏi Vàng Hoàng Kim, Kim Cương Xanh, Hồng Ngọc Lửa, Túi Bí Ẩn*.
   - Học sinh / đội thi click chọn hoặc bốc trúng quặng -> màn hình hiển thị câu hỏi thử thách.
   - Trả lời đúng: Kéo quặng thành công, cộng điểm/vàng cho đội thi và bắn pháo hoa.
   - Trả lời sai: Nổ thuốc nổ hoặc đứt dây tời quặng, chuyển lượt cho đội đối thủ.

3. **Đường Lên Đỉnh Olympia**
   - **Vòng 1: Khởi Động**: Đồng hồ 60 giây đếm ngược nhanh, học sinh trả lời liên tục nhiều câu hỏi nhất có thể (+10 điểm/câu).
   - **Vòng 2: Vượt Chướng Ngại Vật**: 4 hàng ngang gợi ý kèm số lượng chữ cái, nút chuông bấm giành quyền giải từ khóa chính (+40 điểm).
   - **Vòng 3: Tăng Tốc**: 4 câu hỏi với thời gian giảm dần (30s, 20s, 20s, 10s) và phân bậc điểm số 40 - 30 - 20 - 10.
   - **Vòng 4: Về Đích**: Lựa chọn gói câu hỏi và tính năng **Ngôi Sao Hy Vọng** (x2 điểm khi đúng, bị trừ điểm khi sai và đội khác được bấm chuông cướp điểm).

4. **Vòng Quay May Mắn (Lucky Wheel)**
   - Bánh xe quay sinh động trên nền Canvas với hiệu ứng âm thanh tạch tạch theo từng nan quạt.
   - 2 chế độ:
     - Quay gọi tên học sinh ngẫu nhiên từ danh sách lớp lên bảng trả lời.
     - Quay tặng quà, tặng điểm thưởng hoặc các hình phạt vui nhộn.

5. **Hộp Quà Bí Mật (Mystery Boxes)**
   - Các hộp quà 3D rực rỡ sắc màu ẩn chứa phần thưởng bất ngờ: *Điểm 10 kiểm tra miệng, Một tràng pháo tay, Thẻ miễn bài tập về nhà, x2 điểm lượt sau*.

---

## 📂 2. Hướng Dẫn Định Dạng File Cho Giáo Viên

### A. File Bài Tập & Câu Hỏi Word (`.docx`)
Hệ thống sử dụng thư viện **Mammoth.js** chạy trực tiếp trên trình duyệt để đọc và phân tích tự động:
- **Định dạng chuẩn:**
  ```text
  Câu 1: Thủ đô của nước Việt Nam là gì?
  A. Hà Nội
  B. TP. Hồ Chí Minh
  C. Đà Nẵng
  D. Hải Phòng
  Đáp án: A
  Lời giải: Hà Nội là thủ đô của Việt Nam từ năm 1976.
  ```
- **Hỗ trợ công thức Toán học (LaTeX / MathJax / KaTeX):**
  - Viết công thức trong cặp dấu `$`: `$c^2 = a^2 + b^2$`, `$\Delta = b^2 - 4ac$`, `$\frac{a}{b}$`.
- **Phân loại độ khó:**
  - Có thể thêm thẻ `[Dễ]`, `[Trung bình]`, `[Khó]`, `[VD]`, `[VDC]` ở đầu câu hỏi để hệ thống tự động phân loại.

*(Có sẵn file mẫu tại thư mục `samples/Mau_Bo_Cau_Hoi_On_Tap.docx`)*

### B. File Danh Sách Lớp Excel (`.xlsx`, `.xls`, `.csv`)
Hệ thống sử dụng **SheetJS** tự động phát hiện các cột:
- **Cột bắt buộc:** `STT`, `Họ và tên` (hoặc `Tên học sinh`).
- **Cột tùy chọn:** `Lớp`, `Ghi chú`.
- **Hệ thống tự động:**
  - Chia đều học sinh vào **4 Đội thi đấu**: *Đội Rồng Đỏ, Đội Đại Bàng Xanh, Đội Hổ Vàng, Đội Sư Tử Tím*.
  - Theo dõi điểm số theo thời gian thực.
  - Cho phép **Xuất file Excel kết quả** sau buổi học để lưu điểm số.

*(Có sẵn file mẫu tại thư mục `samples/Mau_Danh_Sach_Lop_10A1.xlsx`)*

---

## 🚀 3. Hướng Dẫn Đưa Lên GitHub & Kết Nối Vercel.app

Toàn bộ ứng dụng là Web tĩnh thuần (HTML5, Tailwind CSS, JavaScript ES6) với các thư viện nạp qua CDN chính thức, **không cần cài đặt server hay build phức tạp**, tải trang cực nhanh và chạy trơn tru 100% trên Vercel.

### Bước 1: Khởi tạo Git và đẩy lên GitHub
Mở Terminal tại thư mục này và chạy các lệnh:
```bash
git init
git add .
git commit -m "Khoi tao web tro choi hoc tap EduPlay"
git branch -M main
git remote add origin https://github.com/<tai-khoan-cua-ban>/<ten-repository>.git
git push -u origin main
```

### Bước 2: Kết nối với Vercel
1. Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub.
2. Nhấn nút **"Add New..."** -> Chọn **"Project"**.
3. Chọn Repository vừa tạo ở Bước 1.
4. Giữ nguyên cấu hình mặc định (Framework Preset: **Other**, Root Directory: `./`).
5. Nhấn **"Deploy"**.
6. Sau khoảng 20 giây, bạn sẽ nhận được đường dẫn website có dạng: `https://ten-du-an.vercel.app` để trình chiếu trên lớp học bất cứ lúc nào!

---

## 🛠 4. Tính Năng Kỹ Thuật Nổi Bật

- **Âm thanh tổng hợp Web Audio API:** Tạo âm thanh chính xác (tiếng chuông đúng, còi sai, đồng hồ đếm ngược, pháo hoa ăn mừng, quay bánh xe, căng thẳng) hoàn toàn bằng thuật toán âm thanh, không phụ thuộc vào file MP3 bên ngoài nên không lo bị lỗi 404 hay mạng chập chờn.
- **Trình chiếu máy chiếu / Smartboard:** Nút phóng to toàn màn hình (Fullscreen) tương thích tối đa với màn hình cảm ứng tương tác và máy chiếu lớp học.
- **Bảo mật và riêng tư:** Dữ liệu file Word và Excel được đọc và xử lý 100% trực tiếp trong trình duyệt của giáo viên (Client-side), không truyền dữ liệu học sinh lên bất kỳ máy chủ bên ngoài nào.
