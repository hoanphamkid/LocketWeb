# Đánh giá locketlam cho Locket Studio

Ngày kiểm tra: 16/11/2026. Mã nguồn được kiểm tra tại commit `1cc48f80a3ad59e1ecbecacbd5358af6f03b55b5` (version 1.0.2).

## Kết luận

Repo có triển khai luồng đăng ảnh lên máy chủ Locket thật, phù hợp về chức năng với yêu cầu đăng ảnh từ web và xem trong ứng dụng Locket. Tuy nhiên chưa thể xác nhận đăng thành công đầu cuối vì chưa thử bằng phiên tài khoản Locket hợp lệ. Bản gốc cần sửa xử lý lỗi và xác nhận kết quả trước khi đưa vào website.

Đây là thư viện Python, không phải một máy chủ HTTP có sẵn để điền URL vào VITE_API_URL. Backend hiện tại của Locket Studio là Node.js; có thể tham khảo giao thức từ repo hoặc xây thêm dịch vụ Python. Không cần đổi frontend sang Python.

## Kiểm tra thực tế qua mạng

- Gửi đúng yêu cầu đăng nhập của SDK một lần bằng địa chỉ thử nghiệm thuộc tên miền dành riêng `example.invalid`: Firebase trả HTTP 400, `EMAIL_NOT_FOUND`; SDK phát sinh `AuthenticationError`. Điều này xác nhận endpoint và cấu hình Firebase được chấp nhận đủ để xử lý yêu cầu, chưa xác nhận đăng nhập thành công.
- Gọi endpoint đọc `getLatestMomentV2` không có thông tin đăng nhập: HTTP 200, nhưng nội dung là `result.status=401`, `errors=["Please sign in"]`. Máy chủ có phản hồi; HTTP 200 không đồng nghĩa thao tác thành công.
- Không đăng bài, gửi ảnh hay sử dụng tài khoản người dùng thật trong quá trình kiểm tra.

## Luồng chức năng trong mã nguồn

1. `SessionManager.login` đăng nhập email/mật khẩu qua Firebase Auth.
2. `MomentsModule.upload_image` chuyển ảnh sang WebP, khởi tạo resumable upload trong bucket `locket-img`, tải nội dung ảnh và tạo URL ảnh.
3. `MomentsModule.post` gọi `postMomentV2`. Với `is_private=False`, không chỉ định recipients, payload đặt `sent_to_all=True` để gửi cho tất cả bạn bè.

## Các lỗi đã tái hiện bằng phản hồi giả lập

| Trường hợp | Hành vi quan sát được | Ảnh hưởng khi tích hợp |
| --- | --- | --- |
| HTTP 403 có nội dung `error` từ Locket | `post_api` trả đối tượng lỗi, `moments.post` tiếp tục trả nó mà không ném exception | Web kiểm tra không có exception có thể báo thành công sai |
| Mất kết nối/timeout | Trả `{"error": ...}` và đi qua `moments.post` mà không ném exception | Có cùng nguy cơ báo thành công sai |
| HTTP 200 với `data={}`, không có mã bài đăng | `moments.post` trả `{}` bình thường | Cần yêu cầu mã bài đăng hợp lệ trước khi báo thành công |
| Storage trả HTTP 200 nhưng thiếu `downloadTokens` | SDK dùng UUID tự tạo làm token URL, không xác minh với Storage | URL có thể không truy cập được; cần đọc metadata hoặc báo lỗi |

Đây là kiểm tra hành vi mã nguồn bằng mock, không phải bằng chứng Locket đang trả những lỗi này với một tài khoản hợp lệ.

## Các điểm cần lưu ý khi tích hợp

- API công khai của SDK đang có `login(email, password)`; chưa có luồng đăng nhập số điện thoại tương đương backend hiện tại.
- `DeviceProfile` chỉ đính kèm App Check token nếu được cung cấp. Những header mô tả iPhone không chứng minh có xác thực App Check hợp lệ, nên không thể bảo đảm mọi yêu cầu đều được Locket chấp nhận.
- Mặc định token được lưu dạng JSON chưa mã hóa trong file phiên. Với website nhiều người dùng phải tách riêng phiên từng người và bảo vệ thông tin này; có thể dùng `session_path=None` để tắt lưu file.
- Nhiều yêu cầu HTTP không đặt timeout; cần thêm giới hạn chờ cho máy chủ web.
- Bộ test đi kèm: 6 bài, 3 báo đạt, 2 thất bại, 1 lỗi. Các bài thất bại/lỗi do thiếu video mẫu trong repo. Bài thumbnail báo đạt nhưng không thực hiện kiểm tra khi không có file. Bộ test này chưa chứng minh đăng ảnh thật thành công.

## Đề xuất cho dự án này

Giữ backend Node.js hiện tại, đối chiếu metadata và payload ảnh với repo này nếu cần điều chỉnh. Để xác nhận yêu cầu cuối cùng, cần đăng nhập trực tiếp trên giao diện bằng tài khoản Locket của chủ tài khoản, đăng một ảnh, nhận mã bài đăng từ Locket và kiểm tra ảnh trong ứng dụng. Mật khẩu không cần gửi vào cuộc trò chuyện.

## Phần đã chuyển sang JavaScript trong dự án

Sau đánh giá, luồng ảnh của locketlam đã được đưa vào backend Node.js hiện có, trong `backend/src/services/locket.service.js` và `backend/src/services/locket-device.js`:

- Đăng nhập email theo Firebase Auth REST v1, làm mới token bằng form encoding; giữ hỗ trợ đăng nhập số điện thoại của dự án.
- Giữ metadata thiết bị nhất quán trong phiên, sử dụng cấu trúc analytics, Storage headers và chú thích theo SDK.
- Tải ảnh WebP qua resumable upload. Dùng download token từ phản hồi hoàn tất hoặc đọc metadata, không dùng UUID thay token chưa xác nhận.
- Kiểm tra lỗi HTTP và lỗi bên trong JSON, giới hạn thời gian chờ, kiểm tra địa chỉ tải ảnh, yêu cầu mã bài đăng hợp lệ trước khi báo thành công.
- Giữ token trên backend, không đưa thông tin đăng nhập Locket vào frontend.

Kiểm chứng bản chuyển: 17 kiểm thử backend đạt; frontend build đạt; trình duyệt kiểm tra đăng nhập, giữ ảnh khi gửi lỗi, xác nhận mã bài đăng, đăng xuất, định dạng/kích thước ảnh và giao diện di động đạt. Đăng nhập thử bằng Node.js với địa chỉ không tồn tại thuộc `example.invalid` nhận lỗi xác thực đúng. Chưa đăng ảnh đầu cuối bằng tài khoản thật.

Thông tin giấy phép MIT của nguồn được giữ trong `backend/THIRD_PARTY_NOTICES.md`.

## Nguồn

- [Đăng nhập và lưu phiên](https://github.com/leanhminh2104/locketlam/blob/1cc48f80a3ad59e1ecbecacbd5358af6f03b55b5/locketlam/session.py)
- [Xử lý HTTP API](https://github.com/leanhminh2104/locketlam/blob/1cc48f80a3ad59e1ecbecacbd5358af6f03b55b5/locketlam/client.py#L89-L130)
- [Upload ảnh và đăng bài](https://github.com/leanhminh2104/locketlam/blob/1cc48f80a3ad59e1ecbecacbd5358af6f03b55b5/locketlam/modules/moments.py#L405-L488)
- [Payload postMomentV2 và xác nhận kết quả](https://github.com/leanhminh2104/locketlam/blob/1cc48f80a3ad59e1ecbecacbd5358af6f03b55b5/locketlam/modules/moments.py#L1010-L1048)
- [Cấu hình App Check](https://github.com/leanhminh2104/locketlam/blob/1cc48f80a3ad59e1ecbecacbd5358af6f03b55b5/locketlam/device.py#L93-L105)
