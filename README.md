# Locket Studio

Repository này chứa giao diện React của Locket Studio. Backend Node.js nằm tại [hoanphamkid/lockethh-backend](https://github.com/hoanphamkid/lockethh-backend). Trong workspace phát triển, hai thư mục tương ứng là `locket-studio` và `backend`.

Luồng đăng nhập và đăng ảnh/video từ [locketlam 1.0.2](https://github.com/leanhminh2104/locketlam) đã được chuyển sang **JavaScript/Node.js**, cùng ngôn ngữ với dự án hiện tại. Không cần cài hoặc chạy Python. Phạm vi tích hợp là đăng nhập, làm mới token, đăng ảnh/video kèm chú thích và lựa chọn người xem.

Backend sử dụng metadata và payload ảnh theo SDK, đồng thời sửa các nhánh xử lý lỗi: không xem HTTP 200 là thành công nếu nội dung báo lỗi, không tạo token tải ảnh giả, và chỉ báo đăng thành công khi Locket trả về mã bài đăng. Xem [thông tin bản quyền](https://github.com/hoanphamkid/lockethh-backend/blob/main/THIRD_PARTY_NOTICES.md).

## Chạy trên máy

Mở hai terminal:

```powershell
cd D:\LocketWeb\backend
npm install
npm run dev
```

```powershell
cd D:\LocketWeb\locket-studio
npm install
npm run dev
```

Mở địa chỉ Vite in ra (thường là `http://localhost:5173`). Vite chuyển `/api` sang `http://localhost:5000` nên không cần tạo `.env` frontend. Nếu thay cổng backend, sửa proxy trong `locket-studio/vite.config.js` hoặc cấu hình `VITE_API_URL`. Dùng cùng hostname cho frontend/backend để cookie hoạt động.

Studio có thêm link cấu hình Shadowrocket tại `/locket.conf` (alias `/api/config/locket.conf`). Khi deploy, đặt `PUBLIC_ORIGIN=https://ten-mien-cua-ban` để metadata trong file trỏ đúng URL HTTPS. File này chỉ là cấu hình định tuyến an toàn cho các miền Locket/Firebase; không chứa token, mật khẩu hay script mở khóa Premium.

1. Bấm **Kết nối Locket** ở đầu giao diện.
2. Đăng nhập bằng email hoặc số điện thoại kèm mã quốc gia và mật khẩu của tài khoản Locket trên điện thoại. Ví dụ số Việt Nam `0901234567` được nhập là `+84901234567`. Nếu quên mật khẩu, đặt lại trong ứng dụng Locket.
3. Chọn/chụp ảnh, nhập chú thích rồi bấm gửi. Ảnh được chia sẻ tới **tất cả bạn bè Locket**.
4. Chỉ khi Locket trả về mã bài đăng, web mới báo thành công. Mở ứng dụng Locket để kiểm tra ảnh thực tế.

## Giới hạn và xác thực

- Đây là tích hợp **API không chính thức**; Locket có thể thay đổi hoặc chặn truy cập từ web/App Check. Ứng dụng sẽ báo lỗi khi bị từ chối, không giả lập đăng thành công và không vượt qua App Check.
- Nếu có App Check token được cấp hợp lệ, có thể cấu hình `LOCKET_APPCHECK_TOKEN` trong `.env` backend. Các header mô tả thiết bị không thay thế App Check; backend không tự sinh token xác minh.
- Chưa kiểm chứng đăng ảnh với tài khoản thật trong môi trường phát triển vì chưa có tài khoản người dùng. Các kiểm thử tự động giả lập phản hồi Locket để kiểm tra hợp đồng API và các trường hợp lỗi.
- Hỗ trợ JPEG, PNG, WebP và video MP4/MOV/WebM tối đa 20 MB mỗi tệp, chú thích 120 ký tự. Video quay trực tiếp trên web (thường là WebM) được backend chuyển sang MP4 trước khi tải lên bucket video của Locket, kèm thumbnail. Backend xoay ảnh theo EXIF, cắt giữa thành hình vuông 1020 × 1020 và chuyển sang WebP. Caption preset được gửi cùng màu gradient và độ mờ nền để hiển thị đúng dạng pill trên Locket.
- Tệp vượt dung lượng được chặn ngay khi chọn từ album và có thông báo nổi trên mọi kích thước màn hình. Backend cũng trả lỗi HTTP 413 kèm giới hạn tương ứng nếu nhận tệp quá lớn.
- Hồ sơ, số bạn bè, kỷ niệm và cuộc trò chuyện được tải từ Locket sau khi đăng nhập. Chưa đăng nhập sẽ hiện lời mời đăng nhập; lỗi tải dữ liệu được phân biệt với danh sách rỗng hoặc tài khoản có 0 bạn bè. Các số liệu mẫu về chuỗi ngày, Gold và ngày gia nhập đã được bỏ. Liên kết/QR chỉ được tạo khi Locket cung cấp username.
- Trang **Kỷ niệm** gọi `/api/social/memories` riêng: backend dùng UID của phiên đăng nhập trong `users`, đọc cursor do Locket trả về và lọc lại tác giả để chỉ trả kỷ niệm của tài khoản đó. Feed bạn bè nằm ở **Lịch sử**. Tham khảo [payload chọn người dùng của SDK](https://github.com/PunGrumpy/locket-sdk/blob/main/packages/locket-api/src/modules/moments.ts). Web chỉ hiển thị kỷ niệm Locket trả về, không dựng ô trống, không ghép ảnh/video trên máy vào danh sách, không xem số đã tải là tổng toàn bộ kho tài khoản.
- Kỷ niệm được nhóm theo ngày đăng thật với múi giờ Việt Nam; thiếu ngày sẽ vào nhóm riêng. Bấm mỗi ô mở đúng ảnh lớn hoặc video có điều khiển, kèm chú thích và ngày đăng. Lỗi tải nội dung có thông báo và nút thử lại. Sau khi đổi tài khoản, phản hồi tải lại của tài khoản cũ bị bỏ qua.
- Công tắc **Huy hiệu Locket Gold** gửi `badge: "locket_gold"` khi bật và `badge: null` khi tắt tới `changeProfileInfo`, sau đó đọc lại `fetchUserV2`. Huy hiệu trái tim vàng cạnh tên chỉ thay đổi khi hồ sơ Locket xác nhận đúng giá trị; thiếu trạng thái sẽ vô hiệu hóa công tắc, bị từ chối hoặc chưa xác nhận sẽ hiện lỗi. Giao thức tham khảo: [trường badge trong hồ sơ](https://github.com/PunGrumpy/locket-sdk#fetchuseruseruid) và [payload changeProfileInfo](https://github.com/Aedotris/locket#ngày-3-khám-phá-những-bí-mật-của-api). Đây là tùy chọn hiển thị huy hiệu, không phải thay đổi gói thuê bao.
- Khi deploy frontend, chạy `npm run build` và cấu hình hosting phục vụ thư mục `dist`. Trên Vercel, `vercel.json` chuyển `/api/*` tới backend Render; trình duyệt gọi API cùng tên miền để cookie phiên không bị chặn như cookie bên thứ ba. Cấu hình `VITE_API_URL` cũ được bỏ qua trên `*.vercel.app`. Với hosting khác, cấu hình reverse proxy `/api` hoặc đặt `VITE_API_URL` khi cần kết nối trực tiếp.
- Lịch sử trên máy là ảnh/video đã chụp hoặc chọn; không phải lịch sử bài đăng đồng bộ từ Locket.
- Mật khẩu chỉ dùng trong yêu cầu đăng nhập, không ghi vào file/database/log. Token Locket chỉ giữ trong RAM backend; trình duyệt nhận cookie phiên `HttpOnly` (production dùng `Secure`). Sau đăng nhập, web đọc lại `/auth/session` trước khi báo đã kết nối. Phiên hết hạn sau 12 giờ, khi ngắt kết nối hoặc khi backend khởi động lại.
- Lỗi không có quyền xem hồ sơ/kỷ niệm không đăng xuất tài khoản. Yêu cầu đọc gặp token hết hạn được làm mới một lần; chỉ `SESSION_EXPIRED` hoặc `SESSION_REQUIRED` mới yêu cầu kết nối lại. Không tự gửi lại thao tác đăng bài hay sửa hồ sơ. Tham khảo [cookie bên thứ ba trên Safari](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/) và [proxy API bằng Vercel rewrites](https://vercel.com/docs/rewrites).
- Đường đăng ảnh chỉ chấp nhận phiên Locket hợp lệ, không dùng tài khoản Firebase/demo của website. Không cần `FIREBASE_SERVICE_ACCOUNT` để đăng lên Locket.
- Khi triển khai production, phục vụ frontend và `/api` cùng origin qua HTTPS, đặt `NODE_ENV=production`, cấu hình `FRONTEND_URL` theo URL frontend. Vite proxy chỉ phục vụ lúc phát triển. Với nhiều tiến trình backend cần thay kho phiên trong RAM bằng kho phiên dùng chung.

## Kiểm tra

```powershell
cd D:\LocketWeb\backend
npm test
cd D:\LocketWeb\locket-studio
npm run build
```

Tham khảo giao thức: [locketlam — nguồn chuyển sang JavaScript](https://github.com/leanhminh2104/locketlam), [SDK Locket cộng đồng](https://github.com/PunGrumpy/locket-sdk), [triển khai luồng đăng ảnh](https://github.com/vanhdzai208-spec/locket-gold). Khôi phục mật khẩu: [Locket Help Center](https://help.locket.com/en/articles/14294367-i-forgot-my-password).
