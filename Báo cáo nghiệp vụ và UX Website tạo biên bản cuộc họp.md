# Báo cáo nghiệp vụ và UX: Website tạo biên bản cuộc họp

Tài liệu bối cảnh để xây dựng sản phẩm. Phiên bản 1.0, ngày 13/11/2026.

## 1. Mục đích và cách dùng tài liệu

Tài liệu này gom ba thứ để làm nền cho việc thiết kế và lập trình: (1) khung pháp lý và chuẩn trình bày biên bản tại Việt Nam, (2) phân loại biên bản kèm cấu trúc và thành phần của từng loại, (3) đặc tả UI/UX. Phần nào có căn cứ pháp luật thì ghi rõ điều luật để đối chiếu. Phần nào là đề xuất thiết kế thì ghi là đề xuất.

Lưu ý: nội dung pháp lý ở đây phục vụ thiết kế sản phẩm, không thay thế tư vấn pháp lý. Luật Doanh nghiệp đã có sửa đổi sau 2020, nên trước khi phát hành mẫu pháp lý cần đối chiếu văn bản hiện hành hoặc hỏi luật sư.

**Nguyên tắc thiết kế cốt lõi (đề xuất):** biên bản là một *tập các khối (block) có quy tắc*, không phải một văn bản tự do. Mỗi loại biên bản chỉ là một mẫu (template) quy định: dùng những khối nào, khối nào bắt buộc, ràng buộc gì. Cách làm này cho phép thêm loại biên bản mới mà không viết lại hệ thống.

## 2. Khung pháp lý và chuẩn trình bày

### 2.1. Biên bản thông thường (nội bộ, đối ngoại)

- Pháp luật Việt Nam không quy định một biểu mẫu cố định cho biên bản cuộc họp công ty. Tuy vậy, cách trình bày nên theo Nghị định 30/2020/NĐ-CP về công tác văn thư (ban hành 05/03/2020, còn hiệu lực).
- Thành phần thể thức thường có: Quốc hiệu và Tiêu ngữ, tên cơ quan/tổ chức, số và ký hiệu, địa danh và ngày tháng, tên loại văn bản và trích yếu, nội dung, chữ ký, nơi nhận.
- Quy định trình bày của Nghị định 30: khổ A4; lề trên và dưới 20 đến 25 mm, lề trái 30 đến 35 mm, lề phải 15 đến 20 mm; phông Times New Roman, bộ mã Unicode theo TCVN 6909:2001, màu đen.
- Phần "Nơi nhận" gồm hai phần theo hướng dẫn của Nghị định 30 (nơi nhận để xử lý và nơi nhận để biết/lưu).
- Tính năng xuất tài liệu của website nên có chế độ "Theo Nghị định 30" và chế độ "Tự do" (kiểu hiện đại, không quốc hiệu).

### 2.2. Biên bản có giá trị pháp lý theo Luật Doanh nghiệp 2020

| Loại | Căn cứ | Điểm cần phản ánh trong hệ thống |
| --- | --- | --- |
| Họp Đại hội đồng cổ đông (công ty cổ phần) | Điều 150 | Phải ghi biên bản, có thể kèm ghi âm hoặc lưu điện tử. Có thông tin doanh nghiệp, thời gian, địa điểm, chương trình, chủ tọa, thư ký, tổng số cổ đông và số phiếu dự họp, kết quả biểu quyết từng vấn đề, tỷ lệ thông qua. Biên bản lập bằng tiếng Việt, có thể thêm tiếng nước ngoài. |
| Họp Hội đồng quản trị | Điều 158 | Nội dung chủ yếu gồm thông tin công ty, thời gian địa điểm, mục đích chương trình, người dự họp và cách thức dự họp, ý kiến từng thành viên, kết quả biểu quyết (tán thành, không tán thành, không có ý kiến), vấn đề đã thông qua, chữ ký chủ tọa và người ghi biên bản. Biên bản và tài liệu họp lưu tại trụ sở chính. |
| Họp Hội đồng thành viên (công ty TNHH hai thành viên trở lên) | Điều 60 | Phải ghi biên bản, có thể ghi âm hoặc lưu điện tử. |

Các điểm pháp lý đáng đưa vào quy tắc của hệ thống:

- Chủ tọa và người ghi biên bản chịu trách nhiệm về tính trung thực và chính xác của nội dung biên bản. Hệ thống nên hiển thị nhắc nhở này ở bước ký duyệt.
- Nếu chủ tọa hoặc thư ký từ chối ký, biên bản vẫn có thể có hiệu lực khi đủ nội dung theo luật và có chữ ký của những người còn lại, nhưng phải ghi rõ việc từ chối ký. Hệ thống cần trường "từ chối ký" kèm lý do.
- Cổ đông phổ thông có quyền xem, tra cứu, trích lục hoặc sao chụp biên bản họp ĐHĐCĐ. Hệ thống cần chức năng "trích lục" có kiểm soát.
- Thời hạn lưu trữ: các nguồn thứ cấp nêu mức lưu tối thiểu khác nhau theo loại biên bản. Hãy để thời hạn lưu là cấu hình theo từng loại, và xác nhận lại với pháp chế trước khi đặt giá trị mặc định.
- Tỷ lệ thông qua nghị quyết (ví dụ ngưỡng phần trăm phiếu tán thành) do luật và điều lệ quy định, thay đổi theo vấn đề. Hệ thống để ngưỡng là tham số của từng nghị quyết, không cố định cứng trong code.

## 3. Phân loại biên bản

### 3.1. Bảng phân loại tổng quan

| Nhóm | Loại biên bản | Mục tiêu chính | Mức chặt chẽ |
| --- | --- | --- | --- |
| A. Nội bộ | Họp giao ban; họp phòng ban; họp toàn công ty; họp chuyên đề/xử lý sự cố | Thống nhất và giao việc | Trung bình |
| B. Pháp lý doanh nghiệp | ĐHĐCĐ; HĐQT; Hội đồng thành viên; họp chủ sở hữu | Bằng chứng pháp lý của quyết định | Rất cao |
| C. Dự án/phần mềm | Kickoff; họp yêu cầu; sprint planning; sprint review; retrospective; bug triage; CCB; post-mortem | Chốt phạm vi, rủi ro, cải tiến | Trung bình đến cao |
| D. Đối ngoại | Họp giữa hai công ty; họp khách hàng; đàm phán; họp nhà thầu | Ghi nhận cam kết của hai bên | Cao |
| E. Đoàn thể, cộng đồng | Họp lớp, họp phụ huynh, họp cư dân, họp tổ chức | Thông báo và biểu quyết đơn giản | Thấp |

Ghi chú: các biên bản bàn giao, nghiệm thu, vi phạm hành chính là loại biên bản khác (ghi nhận sự việc, không phải cuộc họp). Nên xếp vào giai đoạn mở rộng sau, vì có mô hình ký hai bên và danh mục hạng mục riêng.

### 3.2. Hai trục phân loại nên dùng trong hệ thống

1. **Trục mục đích:** thông tin, giải quyết vấn đề, ra quyết định, rà soát/cải tiến.
2. **Trục hiệu lực:** nội bộ (không bắt buộc ký) hay pháp lý (bắt buộc có chủ tọa, thư ký, biểu quyết, lưu trữ dài hạn).

Mỗi mẫu gắn với một vị trí trên hai trục này, từ đó hệ thống tự suy ra khối bắt buộc.

## 4. Thư viện khối (block) dùng chung

| Khối | Nội dung | Ghi chú |
| --- | --- | --- |
| Tiêu đề thể thức | Quốc hiệu, tiêu ngữ, tên tổ chức, số ký hiệu, địa danh, ngày | Chỉ bật ở chế độ Nghị định 30 |
| Thông tin cuộc họp | Tên, loại, thời gian bắt đầu và kết thúc, địa điểm hoặc link, hình thức (trực tiếp, trực tuyến, kết hợp) | Bắt buộc ở mọi loại |
| Thành phần tham dự | Người dự, vai trò, trạng thái (có mặt, vắng có phép, vắng không phép, đến muộn, về sớm, ủy quyền) | Bắt buộc |
| Chủ tọa và thư ký | Mỗi cuộc họp ít nhất một người mỗi vai | Bắt buộc ở nhóm B, D |
| Chương trình nghị sự | Danh sách vấn đề, thứ tự, thời lượng, người trình bày | Bắt buộc |
| Diễn biến thảo luận | Ý kiến theo từng vấn đề, gắn người phát biểu, phân loại ý kiến | Bắt buộc ở nhóm A, B, C, D |
| Biểu quyết | Phương thức, số phiếu tán thành, không tán thành, không ý kiến, không hợp lệ, tỷ lệ | Bắt buộc ở nhóm B |
| Kết luận và quyết nghị | Thống nhất, chưa thống nhất, hoãn; bảo lưu ý kiến | Bắt buộc |
| Action items | Việc, người chủ trì, người phối hợp, người duyệt, hạn, sản phẩm đầu ra, ưu tiên | Bắt buộc ở nhóm A, C, D |
| Rủi ro và vấn đề tồn đọng | Mô tả, mức độ, người theo dõi | Tùy chọn, nổi bật ở nhóm C |
| Cam kết của các bên | Bên A, bên B, nghĩa vụ, thời hạn | Bắt buộc ở nhóm D |
| Tài liệu đính kèm | Tệp, liên kết, tài liệu họp | Tùy chọn |
| Cuộc họp tiếp theo | Thời gian dự kiến, nội dung | Tùy chọn |
| Chữ ký | Chủ tọa, thư ký, các bên; hình thức ký (ký tay, ký số, xác nhận điện tử) | Quy tắc theo loại |
| Nơi nhận / phân phối | Danh sách nhận bản chính thức | Tùy chọn |

## 5. Cấu trúc chi tiết từng loại

### A1. Biên bản họp giao ban

- **Mục đích:** cập nhật tiến độ ngắn, chỉ ra việc tồn đọng.
- **Khối:** thông tin cuộc họp, thành phần, báo cáo theo đơn vị (đã làm, đang làm, vướng mắc), kết luận của chủ trì, action items.
- **Đặc thù:** nhiều cuộc họp lặp định kỳ. Tự động mang sang các việc chưa xong từ kỳ trước. Mẫu báo cáo theo đơn vị nên là bảng.
- **Ký:** chủ trì và thư ký (không bắt buộc ở bản nội bộ).

### A2. Biên bản họp phòng ban và họp toàn công ty

- **Khối:** thông tin, thành phần, chương trình, thảo luận, kết luận, action items.
- **Đặc thù:** họp toàn công ty cần thống kê tham dự theo phòng ban và mục "thông báo chung".

### A3. Biên bản họp chuyên đề và xử lý sự cố

- **Mục đích:** giải quyết một vấn đề cụ thể.
- **Khối:** mô tả vấn đề và phạm vi, mốc thời gian sự cố, nguyên nhân (giả thuyết và xác nhận), phương án đã cân nhắc kèm ưu và nhược, phương án được chọn, action items, tiêu chí đóng sự cố.
- **Đặc thù:** bám đúng mô hình "Vấn đề, luồng ý kiến, người hành động" mà bạn mô tả.

### B1. Biên bản họp Đại hội đồng cổ đông

- **Khối bắt buộc:** thông tin doanh nghiệp (tên, địa chỉ trụ sở, mã số doanh nghiệp), thời gian và địa điểm, chương trình và nội dung, chủ tọa và thư ký, tổng số cổ đông và số phiếu biểu quyết của cổ đông dự họp, tóm tắt diễn biến và ý kiến, kết quả biểu quyết từng vấn đề, các vấn đề đã được thông qua và tỷ lệ phiếu, chữ ký chủ tọa và thư ký.
- **Đặc thù:** điều kiện tiến hành họp (tỷ lệ số phiếu dự họp tối thiểu theo luật và điều lệ), ủy quyền dự họp, bầu dồn phiếu khi bầu thành viên HĐQT, danh sách cổ đông đính kèm.
- **Quy tắc:** biên bản hoàn thành và thông qua trước khi bế mạc; ngoài ra có thể kèm file ghi âm.

### B2. Biên bản họp Hội đồng quản trị

- **Khối bắt buộc:** thông tin công ty, thời gian và địa điểm, mục đích, chương trình và nội dung, danh sách thành viên dự họp hoặc người đại diện ủy quyền kèm cách thức dự họp, các vấn đề thảo luận, tóm tắt ý kiến từng thành viên theo diễn biến, kết quả biểu quyết (tán thành, không tán thành, không ý kiến), vấn đề được thông qua, chữ ký chủ tọa và người ghi biên bản.
- **Đặc thù:** kiểm tra túc số, ghi nhận từ chối ký, chuyển biên bản cho các thành viên trong thời hạn quy định của điều lệ, lưu tại trụ sở chính.

### B3. Biên bản họp Hội đồng thành viên (TNHH)

- Cấu trúc tương tự B2 nhưng đơn vị biểu quyết là tỷ lệ vốn góp. Trường "tỷ lệ vốn góp" của từng thành viên bắt buộc.

### C1. Họp khởi động dự án (kickoff)

- **Khối:** mục tiêu và phạm vi, các bên liên quan và vai trò (RACI), mốc thời gian chính, rủi ro ban đầu, giả định và ràng buộc, quy tắc làm việc, action items.

### C2. Họp thu thập yêu cầu

- **Khối:** danh sách yêu cầu được nêu (mã, mô tả, người đề xuất, mức ưu tiên), câu hỏi mở, quyết định về phạm vi, yêu cầu bị loại và lý do.
- **Đặc thù:** liên kết yêu cầu với mã tài liệu đặc tả để truy vết.

### C3. Sprint planning, sprint review, retrospective

- **Planning:** mục tiêu sprint, các hạng mục chọn vào sprint, năng lực đội.
- **Review:** hạng mục đã hoàn thành, phản hồi của các bên, thay đổi backlog.
- **Retrospective:** ba cột "tốt, chưa tốt, cải tiến", bình chọn, action items cải tiến (gắn người và hạn), theo dõi việc cải tiến sprint trước đã làm chưa.
- **Đặc thù:** họp daily thường không cần biên bản đầy đủ; chỉ ghi vướng mắc.

### C4. Họp phân loại lỗi (bug triage) và hội đồng kiểm soát thay đổi (CCB)

- **Bug triage:** bảng lỗi, mức độ nghiêm trọng, độ ưu tiên, người nhận, quyết định (sửa, hoãn, từ chối, không tái hiện).
- **CCB:** yêu cầu thay đổi, đánh giá tác động (phạm vi, thời gian, chi phí, rủi ro), quyết định phê duyệt, biểu quyết.

### C5. Họp rút kinh nghiệm sau sự cố (post-mortem)

- **Khối:** tóm tắt, tác động, dòng thời gian, nguyên nhân gốc, điều làm tốt, điều cần cải thiện, action items phòng ngừa.
- **Quy tắc văn hóa:** không quy lỗi cá nhân (blameless). Giao diện không nên có trường "người có lỗi".

### D1. Biên bản họp giữa hai công ty / họp khách hàng

- **Khối:** thông tin hai bên (tên pháp nhân, địa chỉ, người đại diện, chức vụ), nội dung thỏa thuận, cam kết của từng bên, hạn thực hiện, điều khoản chưa thống nhất, chữ ký hai bên.
- **Quy tắc:** mỗi bên có ít nhất một người ký; có chế độ "bản song ngữ".

### D2. Biên bản đàm phán / ghi nhớ

- **Khối:** mỗi điều khoản kèm trạng thái (đã thống nhất, còn tranh luận, bên A đề xuất, bên B đề xuất), lịch sử đề xuất, các điểm cần xin ý kiến cấp trên.
- **Đặc thù:** giao diện so sánh hai cột A và B.

### E1. Họp đoàn thể và cộng đồng (họp lớp, phụ huynh, cư dân)

- **Khối:** thông tin, danh sách tham dự (có thể điểm danh nhanh bằng mã QR), nội dung, biểu quyết đơn giản, kết luận.
- **Đặc thù:** người dùng không chuyên, giao diện tối giản, mẫu chọn sẵn.

## 6. Quy tắc nghiệp vụ chung

### 6.1. Vòng đời biên bản

`Nháp → Chờ duyệt → Đã duyệt (khóa) → Đã phát hành → Lưu trữ`

Nhánh phụ: `Chờ duyệt → Trả lại (có lý do) → Nháp`; `Đã duyệt → Sửa đổi → Phiên bản mới`.

- Chỉ thư ký sửa ở trạng thái Nháp.
- Gửi duyệt khi đủ khối bắt buộc theo mẫu và không còn lỗi chặn (xem 6.3).
- Chỉ chủ tọa duyệt hoặc trả lại. Trả lại phải có lý do.
- Bản đã duyệt bị khóa. Muốn sửa phải tạo phiên bản mới, giữ bản cũ, ghi lý do và người sửa.
- Với nhóm B: bước "từ chối ký" là một lựa chọn hợp lệ, có lý do bắt buộc.

### 6.2. Phân quyền theo vai trò trong từng cuộc họp

| Hành động | Chủ tọa | Thư ký | Thành viên | Khách mời | Admin |
| --- | --- | --- | --- | --- | --- |
| Tạo cuộc họp | Có | Có | Không | Không | Có |
| Sửa nội dung nháp | Không | Có | Đề xuất | Không | Không |
| Góp ý, bình luận | Có | Có | Có | Không | Không |
| Duyệt, trả lại | Có | Không | Không | Không | Không |
| Xác nhận action của mình | Có | Có | Có | Không | Không |
| Xem biên bản đã duyệt | Có | Có | Có | Theo cấu hình | Có |
| Cấu hình mẫu | Không | Không | Không | Không | Có |

Vai trò gắn theo từng cuộc họp, không gắn cứng vào tài khoản.

### 6.3. Danh sách kiểm tra trước khi gửi duyệt

**Lỗi chặn (không cho gửi):**

- Thiếu chủ tọa hoặc thư ký ở loại bắt buộc.
- Thời gian kết thúc không sau thời gian bắt đầu.
- Vấn đề nghị sự chưa có kết luận nào (nếu không chọn "hoãn" hoặc "chưa thống nhất" kèm lý do).
- Action item thiếu chủ trì, hạn hoặc sản phẩm đầu ra.
- Số phiếu biểu quyết vượt số người có quyền biểu quyết, hoặc tổng các loại phiếu không khớp.
- Hạn của action đặt trước ngày họp.

**Cảnh báo (cho gửi nhưng nhắc):**

- Không đủ túc số.
- Người tham dự trùng lịch với cuộc họp khác.
- Ý kiến chưa được phân loại.
- Action có chủ trì là người không có trong danh sách tham dự.
- Một người nhận quá nhiều action trong cùng một hạn.

### 6.4. Action items

- Đúng một người chủ trì (Owner). Có thể có nhiều người phối hợp (Supporter) và một người duyệt (Approver).
- Trạng thái: Chưa bắt đầu, Đang làm, Bị chặn, Chờ duyệt, Hoàn thành, Hủy.
- Tự đánh dấu "Trễ hạn" khi quá hạn. Nhắc trước hạn 3 ngày và 1 ngày (cấu hình được).
- Dời hạn phải có lý do và lưu lịch sử.
- Việc chưa xong tự động mang sang cuộc họp lặp kế tiếp. Đây là cách các công cụ như Fellow giữ trách nhiệm giải trình giữa các cuộc họp.
- Quan hệ phụ thuộc (việc B chỉ bắt đầu khi việc A xong): để giai đoạn sau.

### 6.4b. Biểu quyết

- Phương thức: giơ tay, phiếu kín, điện tử, lấy ý kiến bằng văn bản.
- Trường: số tán thành, không tán thành, không ý kiến, không hợp lệ; tỷ lệ tự tính trên mẫu số cấu hình được (số người dự, tổng phiếu có quyền).
- Ngưỡng thông qua là tham số của từng nghị quyết.
- Trường hợp hòa phiếu: cấu hình quy tắc xử lý (chủ tọa có phiếu quyết định hoặc hoãn).

### 6.5. Tình huống biên cần xử lý

- Chủ tọa vắng giữa chừng: chuyển quyền chủ tọa, ghi vào biên bản.
- Thư ký đồng thời phát biểu nhiều: cho phép ủy quyền ghi tạm.
- Người được giao việc nghỉ việc hoặc bị khóa tài khoản: chuyển việc, báo người duyệt.
- Họp lặp: sao chép chương trình, mang sang việc tồn.
- Sửa biên bản sau khi đã có người xác nhận: các xác nhận cũ bị vô hiệu và thông báo lại.
- Họp bất thành (không đủ túc số): lưu thành loại "biên bản họp không thành", không phải biên bản nghị quyết.

## 7. Mô hình dữ liệu (đề xuất)

| Thực thể | Trường chính |
| --- | --- |
| Organization | tên, mã số, địa chỉ, cấu hình lưu trữ |
| User | họ tên, email, đơn vị, chức danh |
| Template | loại, nhóm (A đến E), danh sách khối, cờ bắt buộc, quy tắc kiểm tra, cấu hình xuất |
| Meeting | tiêu đề, loại, thời gian, địa điểm, hình thức, trạng thái, chuỗi họp lặp |
| Participant | meeting, user, vai trò, trạng thái tham dự, người được ủy quyền, quyền biểu quyết, tỷ lệ vốn hoặc số phiếu |
| AgendaItem | meeting, thứ tự, tiêu đề, mô tả, thời lượng |
| Opinion | agenda item, người phát biểu, nội dung, phân loại, thời điểm |
| Decision | agenda item, nội dung, trạng thái, ngưỡng thông qua, kết quả |
| Vote | decision, phương thức, số phiếu theo loại, danh sách phiếu (nếu công khai) |
| ActionItem | decision, mô tả, owner, supporters, approver, hạn, đầu ra, ưu tiên, trạng thái |
| Risk, Requirement, Defect (loại C) | thực thể chuyên biệt gắn với cuộc họp |
| Minutes | meeting, phiên bản, trạng thái, người duyệt, thời điểm, mã băm nội dung |
| Signature | minutes, người ký, vai trò, hình thức, thời điểm, từ chối và lý do |
| Attachment | meeting hoặc minutes, tên tệp, loại, kích thước |
| Comment | gắn vào khối, người, nội dung, trạng thái đã xử lý |
| AuditLog | đối tượng, hành động, giá trị cũ và mới, người, thời điểm |
| Notification | người nhận, loại, nội dung, đã đọc |

Gợi ý: lưu nội dung biên bản dạng JSON theo khối để mỗi khối kiểm tra độc lập, đồng thời lưu bản dựng (PDF) khi phát hành.

## 8. Đặc tả UI/UX

### 8.1. Người dùng và nhu cầu

| Persona | Nhu cầu | Điều gây khó chịu |
| --- | --- | --- |
| Thư ký/người ghi | Ghi nhanh, không bỏ sót, dựng biên bản đẹp | Vừa nghe vừa gõ, định dạng mất thời gian |
| Chủ tọa | Xem kết luận rõ, duyệt nhanh | Biên bản dài, lan man |
| Thành viên | Biết mình được giao gì và hạn nào | Không thấy việc của mình sau họp |
| Quản lý/pháp chế | Tra cứu, bằng chứng, lưu trữ | Không biết phiên bản nào là chính thức |

### 8.2. Hành trình chính

1. **Chuẩn bị:** chọn mẫu, mời người dự, soạn chương trình (kéo thả).
2. **Trong họp (chế độ ghi trực tiếp):** điểm danh, ghi ý kiến theo vấn đề, chốt kết luận, tạo action.
3. **Sau họp:** rà soát, gửi duyệt, chủ tọa duyệt, phát hành, nhắc việc.
4. **Theo dõi:** bảng việc, nhắc hạn, mang sang cuộc họp sau.

### 8.3. Danh sách màn hình

| # | Màn hình | Thành phần chính |
| --- | --- | --- |
| 1 | Trang chủ | Cuộc họp sắp tới, biên bản chờ tôi, việc của tôi sắp đến hạn, truy cập nhanh "Tạo cuộc họp" |
| 2 | Tạo cuộc họp | Chọn mẫu theo nhóm, thông tin, người dự, chương trình, đính kèm, gửi lời mời |
| 3 | Chi tiết cuộc họp | Thông tin, người dự, chương trình, tài liệu, trạng thái biên bản |
| 4 | Chế độ ghi trực tiếp | Bố cục ba vùng (xem 8.4), đồng hồ họp, ghi nhanh |
| 5 | Soạn và rà soát biên bản | Khối theo thứ tự, danh sách kiểm tra bên cạnh, bình luận |
| 6 | Duyệt và ký | Bản xem trước, tóm tắt kết luận, duyệt, trả lại, ký |
| 7 | Bảng việc (Action board) | Danh sách và kanban, lọc theo người, cuộc họp, hạn |
| 8 | Kho biên bản | Tìm kiếm, lọc, xem phiên bản, trích lục |
| 9 | Quản lý mẫu (Admin) | Trình dựng mẫu: thêm khối, đặt bắt buộc, quy tắc |
| 10 | Cài đặt | Thông báo, tích hợp, lưu trữ, định dạng xuất |

### 8.4. Chế độ ghi trực tiếp (màn hình quan trọng nhất)

Bố cục ba vùng trên máy tính:

- **Trái – Chương trình:** danh sách vấn đề, vấn đề đang bàn được tô sáng, đồng hồ thời lượng từng vấn đề, nút chuyển nhanh.
- **Giữa – Vùng ghi:** nhập ý kiến theo dòng. Mỗi dòng có người phát biểu và nhãn phân loại.
- **Phải – Kết luận và hành động:** khung kết luận cho vấn đề hiện tại, danh sách action vừa tạo, tình trạng biểu quyết.

**Ghi nhanh bằng ký tự đặc biệt (đề xuất):**

| Gõ | Tác dụng |
| --- | --- |
| `@tên` | Chọn người phát biểu hoặc người được giao |
| `/ykien`, `/phanbien`, `/dexuat` | Đổi nhãn ý kiến |
| `/qd` | Tạo quyết nghị |
| `/viec` | Tạo action item từ dòng hiện tại |
| `!thứ sáu`, `!20/11` | Đặt hạn (nhận dạng ngày bằng tiếng Việt) |
| `/bq` | Mở biểu quyết |

Phím tắt: chuyển vấn đề, tạo action, mở kết luận, bắt đầu hoặc dừng đồng hồ. Tự lưu liên tục, báo trạng thái "Đã lưu".

**Gợi ý thông minh (giai đoạn sau):** đề xuất tóm tắt kết luận từ ý kiến, nhận diện action từ câu như "anh A sẽ gửi báo giá trước thứ sáu". Luôn để người ghi xác nhận trước khi đưa vào biên bản.

### 8.5. Danh sách kiểm tra và xem trước

- Bảng "Còn thiếu" cố định bên cạnh: mỗi lỗi chặn là một dòng, bấm vào là nhảy đến khối lỗi.
- Thanh tiến độ hoàn thiện biên bản (ví dụ 7 trên 9 mục).
- Xem trước hai chế độ: "Theo Nghị định 30" và "Tự do", có đường kẻ mô phỏng lề.
- So sánh phiên bản dạng diff: dòng thêm màu xanh, dòng xóa màu đỏ, kèm lý do sửa.

### 8.6. Bảng việc (Action board)

- Hai chế độ xem: danh sách và kanban theo trạng thái.
- Bộ lọc nhanh: "Của tôi", "Tôi giao", "Trễ hạn", "Tuần này".
- Thẻ việc có: nội dung, người chủ trì (ảnh đại diện), hạn (đỏ nếu trễ, cam nếu còn dưới ba ngày), cuộc họp gốc (bấm để xem đoạn kết luận liên quan).
- Cập nhật trạng thái bằng một cú bấm, không phải mở trang.

### 8.7. Nguyên tắc UX

1. **Cấu trúc dẫn dắt người ghi.** Mẫu hiện các ô gợi ý ("Vấn đề cần giải quyết", "Ý kiến chính", "Kết luận") để người ghi không phải nhớ cấu trúc.
2. **Phát hiện lỗi sớm, không phạt muộn.** Kiểm tra ngay khi nhập, không đợi đến lúc gửi duyệt.
3. **Một việc một người.** Giao diện không cho gán action cho "tập thể".
4. **Lịch sử luôn nhìn thấy.** Mọi bản đã duyệt có huy hiệu "Đã khóa" và liên kết tới lịch sử.
5. **Giảm nhập liệu lặp.** Họp định kỳ tự điền thành phần, chương trình và việc tồn.
6. **Ngôn ngữ trung tính.** Nhãn và thông báo không đổ lỗi, đặc biệt ở post-mortem.

### 8.8. Vi nội dung (microcopy) mẫu

| Tình huống | Nội dung gợi ý |
| --- | --- |
| Lỗi chặn | "Vấn đề 2 chưa có kết luận. Chọn Thống nhất, Chưa thống nhất hoặc Hoãn." |
| Thiếu chủ trì | "Việc này chưa có người chịu trách nhiệm chính." |
| Gửi duyệt thành công | "Đã gửi cho \[tên chủ tọa\]. Bạn sẽ nhận thông báo khi có phản hồi." |
| Khóa bản | "Bản này đã duyệt và bị khóa. Muốn thay đổi, tạo phiên bản mới." |
| Trạng thái rỗng | "Chưa có cuộc họp nào. Chọn một mẫu để bắt đầu." |
| Nhắc hạn | "Việc \[tên\] đến hạn ngày \[ngày\]. Cập nhật trạng thái?" |

### 8.9. Di động, trực tuyến và ngoại tuyến

- Di động ưu tiên: xem biên bản, xác nhận việc, duyệt, điểm danh bằng mã QR. Ghi dài thì ưu tiên máy tính.
- Ghi ngoại tuyến: lưu cục bộ và đồng bộ khi có mạng, xử lý xung đột theo từng khối.
- Họp trực tuyến: ô dán liên kết, ghi chú thời điểm; nhập bản chép lời từ công cụ khác ở giai đoạn sau.

### 8.10. Khả năng tiếp cận và hiển thị

- Độ tương phản đạt WCAG AA, không chỉ dùng màu để thể hiện trạng thái (thêm biểu tượng và nhãn chữ).
- Điều hướng đầy đủ bằng bàn phím; nhãn cho trình đọc màn hình.
- Hỗ trợ tiếng Việt có dấu đầy đủ ở tìm kiếm (tìm "nghiem thu" vẫn ra "nghiệm thu") và ở xuất PDF (nhúng phông).
- Giao diện sáng và tối; cỡ chữ điều chỉnh được.

## 9. Xuất bản, in ấn và chữ ký

- Xuất PDF và Word, có đánh số trang, số hiệu biên bản, khung chữ ký.
- Mẫu "Theo Nghị định 30": A4, đúng lề, Times New Roman, Unicode, màu đen.
- Hình thức ký: ký tay trên bản in rồi tải lên bản quét; xác nhận điện tử trong hệ thống; ký số (giai đoạn sau, cần tích hợp nhà cung cấp chữ ký số).
- Mỗi bản phát hành có mã xác thực hoặc mã băm để kiểm tra bản có bị sửa không.
- Trích lục: tạo bản trích có dấu thời gian và người yêu cầu, ghi vào nhật ký.

## 10. Đối chuẩn thị trường và định vị

Các công cụ phổ biến cho thấy những tính năng người dùng kỳ vọng: thư viện mẫu nghị sự (Fellow có hơn 500 mẫu), ghi chú cộng tác thời gian thực, tạo và giao action item ngay trong biên bản, nhắc việc tự động, kho lưu trữ tìm kiếm được, các việc chưa xong tự mang sang cuộc họp sau, và tích hợp (Slack, Notion, Asana, lịch, Zoom, Google Meet). Otter và Fireflies mạnh ở chép lời bằng AI; Notion mạnh ở cơ sở dữ liệu và mẫu tùy biến.

**Khoảng trống để định vị (nhận định của tôi, cần kiểm chứng thêm bằng khảo sát người dùng):**

- Mẫu biên bản theo pháp luật Việt Nam (ĐHĐCĐ, HĐQT, HĐTV) kèm kiểm tra bắt buộc nội dung.
- Xuất đúng thể thức Nghị định 30.
- Biểu quyết có tính tỷ lệ theo vốn hoặc số phiếu.
- Giao diện và nhận dạng ngày tháng bằng tiếng Việt.

## 11. Yêu cầu phi chức năng

- **Bảo mật:** kiểm soát truy cập theo cuộc họp, mã hóa khi truyền và khi lưu, nhật ký truy cập biên bản mật.
- **Toàn vẹn:** bản đã duyệt không sửa âm thầm (khóa, mã băm, nhật ký).
- **Đồng thời:** nhiều người cùng ghi cần khóa theo khối hoặc đồng bộ thời gian thực.
- **Hiệu năng:** lưu tự động dưới một giây; mở biên bản dài vẫn mượt.
- **Múi giờ:** lưu UTC, hiển thị theo múi giờ người dùng.
- **Lưu trữ:** thời hạn lưu cấu hình theo loại; xóa mềm, có chính sách tiêu hủy.
- **Sao lưu và khôi phục:** có kế hoạch, thử khôi phục định kỳ.

## 12. Lộ trình đề xuất

| Giai đoạn | Nội dung |
| --- | --- |
| MVP | Mẫu A1, A2, A3, C3 (retrospective), D1; khối cốt lõi; action items; xuất PDF và Word; vòng đời Nháp, Chờ duyệt, Đã duyệt |
| Giai đoạn 2 | Nhóm B (ĐHĐCĐ, HĐQT, HĐTV) với biểu quyết; chữ ký và từ chối ký; kho lưu trữ và trích lục; nhắc việc; kanban |
| Giai đoạn 3 | Mẫu nhóm C đầy đủ; tích hợp lịch, Slack hoặc Zalo, Jira; ghi âm và chép lời; gợi ý AI |
| Giai đoạn 4 | Ký số, nhóm biên bản bàn giao và nghiệm thu, báo cáo phân tích cuộc họp |

## 13. Câu hỏi mở và rủi ro

1. Người dùng đầu tiên là ai (công ty nhỏ, đội phần mềm, doanh nghiệp có HĐQT)? Câu trả lời quyết định thứ tự mẫu làm trước.
2. Có yêu cầu chữ ký số hợp pháp ngay từ đầu không? Nếu có, thời gian và chi phí tăng đáng kể.
3. Dữ liệu biên bản có thể rất nhạy cảm; có cần triển khai tại hệ thống riêng của khách (on-premise) không?
4. Ai chịu trách nhiệm cập nhật mẫu pháp lý khi luật thay đổi?
5. Rủi ro: làm quá rộng. Khuyến nghị bắt đầu với một nhóm người dùng, hoàn thiện luồng "ghi, duyệt, giao việc, theo dõi" trước.

## 14. Nguồn tham khảo

- Nghị định 30/2020/NĐ-CP về công tác văn thư (các bản đăng tại Thư viện Pháp luật, LuatVietnam, Cổng thông tin Chính phủ).
- Luật Doanh nghiệp 2020 (Luật số 59/2020/QH14), Điều 60, 150, 158 và các điều liên quan; tài liệu giải thích của LuatVietnam, Luật Minh Khuê, Luật Hoàng Anh, Thư viện Pháp luật.
- Bài so sánh phần mềm biên bản và quản lý họp: Fellow, ClickUp, eesel.ai, get-alfred.ai, ScreenApp (đã tham khảo năm 2026).
- Các mẫu biên bản và hướng dẫn cách viết: LuatVietnam, Cake.me, Thư viện Pháp luật, MISA.

Lưu ý về nguồn: nhiều bài trên là nội dung của đơn vị cung cấp dịch vụ hoặc blog tổng hợp, chất lượng không đồng đều. Điều khoản luật cần được đối chiếu với bản gốc trước khi dùng cho mẫu có giá trị pháp lý.
