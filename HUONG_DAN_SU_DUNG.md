# Hướng dẫn sử dụng SalaryMM

## Mục lục
1. [Giới thiệu](#giới-thiệu)
2. [Cài đặt và Khởi chạy](#cài-đặt-và-khởi-chạy)
3. [Đăng nhập](#đăng-nhập)
4. [Phân quyền](#phân-quyền)
5. [Các module chức năng](#các-module-chức-năng)
6. [Quy trình nghiệp vụ](#quy-trình-nghiệp-vụ)
7. [Công thức tính lương](#công-thức-tính-lương)

---

## Giới thiệu

SalaryMM là hệ thống quản lý lương nhân viên dành cho doanh nghiệp Việt Nam. Hệ thống hỗ trợ:
- Quản lý thông tin nhân viên, phòng ban, chức vụ
- Quản lý phụ cấp và thưởng
- Tính lương tự động theo quy định Việt Nam
- Xuất báo cáo bảng lương

---

## Cài đặt và Khởi chạy

### Yêu cầu hệ thống
- Node.js 18+
- PostgreSQL 16
- Docker (tùy chọn)

### Các bước cài đặt

```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi động PostgreSQL (nếu dùng Docker)
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5433:5432 -d postgres:16

# 3. Tạo file .env
cp .env.example .env

# 4. Cấu hình database trong .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/salarymm"

# 5. Tạo database schema
npm run db:push

# 6. Tạo dữ liệu mẫu
npm run db:seed

# 7. Khởi chạy ứng dụng
npm run dev
```

Truy cập: http://localhost:3000

---

## Đăng nhập

### Tài khoản mặc định

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | admin@salarymm.com | admin123 |
| Nhân viên | nv001@salarymm.com | employee123 |

### Đổi mật khẩu
Liên hệ Admin để đổi mật khẩu.

---

## Phân quyền

### Admin
- Truy cập toàn bộ hệ thống
- Quản lý nhân viên, phòng ban, chức vụ
- Quản lý phụ cấp, thưởng
- Tính lương và xuất báo cáo
- Cấu hình hệ thống

### Nhân viên (Employee)
- Xem Dashboard cá nhân
- Xem phiếu lương của mình
- Không thể truy cập các module quản lý

---

## Các module chức năng

### 1. Dashboard
**Đường dẫn:** `/dashboard`

Hiển thị tổng quan:
- Tổng số nhân viên (đang làm/nghỉ việc)
- Tổng quỹ lương hàng tháng
- Số lượng phòng ban
- Thưởng chờ duyệt
- Biểu đồ nhân viên theo phòng ban
- Danh sách nhân viên mới

### 2. Quản lý Nhân viên
**Đường dẫn:** `/dashboard/employees`

#### Danh sách nhân viên
- Tìm kiếm theo mã, tên, email
- Lọc theo phòng ban, trạng thái
- Phân trang

#### Thêm nhân viên mới
1. Click **"Thêm nhân viên"**
2. Điền thông tin:
   - Mã nhân viên (bắt buộc, duy nhất)
   - Họ tên, Email
   - Số điện thoại, CCCD/CMND
   - Ngày sinh, Ngày bắt đầu làm việc
   - Phòng ban, Chức vụ
   - Thông tin ngân hàng
   - Lương cơ bản
3. Tùy chọn tạo tài khoản đăng nhập
4. Click **"Thêm mới"**

#### Chi tiết nhân viên
Click icon **👁 (Eye)** để xem chi tiết:
- Thông tin cá nhân
- Cấu trúc lương hiện tại
- Danh sách phụ cấp
- Lịch sử thưởng

### 3. Quản lý Phòng ban
**Đường dẫn:** `/dashboard/departments`

- Thêm/Sửa/Xóa phòng ban
- Mỗi phòng ban có mã riêng (VD: IT, HR, SALES)
- Mô tả phòng ban (tùy chọn)

### 4. Quản lý Chức vụ
**Đường dẫn:** `/dashboard/positions`

- Thêm/Sửa/Xóa chức vụ
- Thiết lập mức lương cơ bản theo chức vụ
- Cấp bậc chức vụ (level)

### 5. Quản lý Phụ cấp
**Đường dẫn:** `/dashboard/allowances`

#### Các loại phụ cấp
- Phụ cấp ăn trưa
- Phụ cấp xăng xe
- Phụ cấp điện thoại
- Phụ cấp nhà ở
- Phụ cấp trách nhiệm
- Phụ cấp độc hại
- Phụ cấp khác

#### Thao tác
- Thêm phụ cấp cho nhân viên
- Bật/Tắt trạng thái phụ cấp (click vào badge)
- Sửa/Xóa phụ cấp

### 6. Quản lý Thưởng
**Đường dẫn:** `/dashboard/bonuses`

#### Các loại thưởng
- Thưởng hàng tháng
- Thưởng quý
- Thưởng năm
- Thưởng Tết
- Thưởng dự án
- Thưởng hiệu suất
- Thưởng khác

#### Quy trình duyệt thưởng
1. **Tạo đề xuất thưởng** → Trạng thái: `Chờ duyệt`
2. **Duyệt thưởng** → Click "Duyệt" → Trạng thái: `Đã duyệt`
3. **Từ chối** → Click "Từ chối" → Trạng thái: `Từ chối`

> **Lưu ý:** Chỉ thưởng có trạng thái "Đã duyệt" mới được tính vào lương.

### 7. Bảng lương
**Đường dẫn:** `/dashboard/payroll`

#### Tính lương tháng
1. Click **"Tính lương tháng"**
2. Chọn tháng và năm
3. Click **"Tính lương"**
4. Hệ thống tự động tính cho tất cả nhân viên đang hoạt động

#### Trạng thái bảng lương
- **Nháp (DRAFT):** Vừa tính xong, có thể xóa
- **Đã xác nhận (CONFIRMED):** Đã xác nhận, nhân viên có thể xem
- **Đã thanh toán (PAID):** Đã chi lương

#### Các thao tác
- **Xem chi tiết:** Click icon Eye
- **Xác nhận:** Từ Nháp → Đã xác nhận
- **Đánh dấu thanh toán:** Từ Đã xác nhận → Đã thanh toán
- **Xác nhận tất cả:** Xác nhận hàng loạt các bảng lương Nháp
- **Xuất Excel:** Tải file CSV bảng lương

### 8. Phiếu lương
**Đường dẫn:** `/dashboard/payslips`

Quản lý tất cả phiếu lương đã xác nhận/thanh toán.

### 9. Phiếu lương của tôi (Nhân viên)
**Đường dẫn:** `/dashboard/my-payslips`

- Nhân viên tự xem phiếu lương của mình
- Lọc theo năm
- Xem chi tiết và in phiếu lương

### 10. Cài đặt
**Đường dẫn:** `/dashboard/settings`

- Thông tin công ty
- Tỷ lệ bảo hiểm (chỉ xem)
- Biểu thuế TNCN (chỉ xem)
- Thông tin hệ thống

---

## Quy trình nghiệp vụ

### Quy trình tính lương hàng tháng

```
1. Cập nhật thông tin nhân viên
   ↓
2. Cập nhật phụ cấp (nếu có thay đổi)
   ↓
3. Tạo và duyệt thưởng (nếu có)
   ↓
4. Tính lương tháng
   ↓
5. Kiểm tra bảng lương
   ↓
6. Xác nhận bảng lương
   ↓
7. Xuất báo cáo / Chi lương
   ↓
8. Đánh dấu đã thanh toán
```

### Quy trình thêm nhân viên mới

```
1. Tạo phòng ban (nếu chưa có)
   ↓
2. Tạo chức vụ (nếu chưa có)
   ↓
3. Thêm nhân viên với thông tin đầy đủ
   ↓
4. Thiết lập lương cơ bản
   ↓
5. Thêm các khoản phụ cấp
   ↓
6. Tạo tài khoản đăng nhập (tùy chọn)
```

---

## Công thức tính lương

### Tổng thu nhập (Gross)
```
Gross = Lương cơ bản + Tổng phụ cấp + Tổng thưởng (đã duyệt)
```

### Các khoản khấu trừ bảo hiểm (Người lao động)

| Loại | Tỷ lệ | Ghi chú |
|------|-------|---------|
| BHXH | 8% | Tối đa 46.8 triệu VND |
| BHYT | 1.5% | Tối đa 46.8 triệu VND |
| BHTN | 1% | Tối đa 46.8 triệu VND |

```
Tổng bảo hiểm = Lương cơ bản × 10.5%
(Tối đa: 46,800,000 × 10.5% = 4,914,000 VND)
```

### Thuế thu nhập cá nhân (TNCN)

#### Giảm trừ
- Giảm trừ bản thân: 11,000,000 VND/tháng
- Giảm trừ người phụ thuộc: 4,400,000 VND/người/tháng

#### Thu nhập chịu thuế
```
Thu nhập chịu thuế = Gross - Tổng bảo hiểm - Giảm trừ bản thân - Giảm trừ người phụ thuộc
```

#### Biểu thuế lũy tiến

| Bậc | Thu nhập chịu thuế/tháng | Thuế suất |
|-----|--------------------------|-----------|
| 1 | Đến 5 triệu | 5% |
| 2 | 5 - 10 triệu | 10% |
| 3 | 10 - 18 triệu | 15% |
| 4 | 18 - 32 triệu | 20% |
| 5 | 32 - 52 triệu | 25% |
| 6 | 52 - 80 triệu | 30% |
| 7 | Trên 80 triệu | 35% |

### Lương thực nhận (Net)
```
Net = Gross - Tổng bảo hiểm - Thuế TNCN
```

### Ví dụ tính lương

**Thông tin:**
- Lương cơ bản: 20,000,000 VND
- Phụ cấp: 2,000,000 VND
- Thưởng: 1,000,000 VND
- Không có người phụ thuộc

**Tính toán:**
```
1. Gross = 20,000,000 + 2,000,000 + 1,000,000 = 23,000,000 VND

2. Bảo hiểm:
   - BHXH = 20,000,000 × 8% = 1,600,000
   - BHYT = 20,000,000 × 1.5% = 300,000
   - BHTN = 20,000,000 × 1% = 200,000
   - Tổng = 2,100,000 VND

3. Thu nhập chịu thuế = 23,000,000 - 2,100,000 - 11,000,000 = 9,900,000 VND

4. Thuế TNCN:
   - 5,000,000 × 5% = 250,000
   - 4,900,000 × 10% = 490,000
   - Tổng thuế = 740,000 VND

5. Tổng khấu trừ = 2,100,000 + 740,000 = 2,840,000 VND

6. Net = 23,000,000 - 2,840,000 = 20,160,000 VND
```

---

## Hỗ trợ

Nếu gặp vấn đề, vui lòng liên hệ:
- Email: support@salarymm.com
- Hotline: 1900-xxxx

---

*Cập nhật lần cuối: Tháng 2/2026*
