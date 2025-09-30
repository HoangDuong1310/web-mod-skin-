applyTo: '**'
---
# 🧠 Project-Wide AI Rules (MCP-Orchestrated, Error-Resilient, Root-Cause-First)

## 🎯 Phạm vi & Mục tiêu
Áp dụng cho mọi tệp trong repo. Mục tiêu: đồng nhất, an toàn thay đổi, dễ bảo trì, đầu ra production-ready.

## ⚙️ MCP & Vai trò
- thinking: Lập kế hoạch, chẩn đoán nguyên nhân (root cause), ra quyết định.
- serena: Quét/đọc/tìm ngữ cảnh, symbols, pattern, lịch sử tương tự, vùng gần nơi sửa.
- memory: Bộ nhớ quy ước và trạng thái: naming, structure, style, work-journal, gotchas, con trỏ tiến trình.

Ghi nhớ: Mọi tác vụ chạy theo chu trình có trạng thái: Plan → Change → Validate → Observe → Decide → Continue.

---

## 🔗 Orchestration Contract (có trạng thái)

0) Khởi tạo phiên (1 lần/phiên)
- memory.load các khóa: naming-conventions, folder-structure, style-rules, gotchas, work-journal:current.
- Nếu thiếu bối cảnh, dùng serena.scan để dựng lại, sau đó memory.save bổ sung.

1) Plan (thinking.plan)
- Lập kế hoạch ngắn với: plan_id, steps[], step_cursor = 0, assumptions.
- Lưu vào memory.save với ttl = session.

2) Change (thay đổi nhỏ, atomic)
- Thực hiện change_set 1 mục tiêu duy nhất.
- Ghi journal: plan_id, step_cursor, change_set {files, symbols, rationale}.

3) Validate (kiểm tra tối thiểu)
- Thứ tự: type/lint/build nhanh → unit hoặc targeted tests → sample run.
- Lưu commands và outputs_digest rút gọn vào memory.

4) Observe → nếu LỖI, kích hoạt RERP (Runtime Error Recovery Protocol)
4.1) Freeze state
- Thu thập git diff --name-only, trích log/stack 20–40 dòng.
- Tạo error_fingerprint = hash(message + top_frames + changed_files).
- Lưu vào memory: plan_id, step_cursor, error_fingerprint, diff_summary, log_excerpt.

4.2) Classify & Locate
- Phân loại lỗi: Build/Type/Lint | Runtime | Test Assertion | Integration/IO/Path/Env.
- serena.locate(symbol|file|import) và đối chiếu với naming/structure trong memory.

4.3) Form Hypothesis (thinking)
- Ghi 1–2 giả thuyết tối giản, tránh shotgun debugging.

4.4) RCFP — Root-Cause-First Protocol (bắt buộc trước khi sửa)
- Mở rộng điều tra có hệ thống (breadth-first) trước khi chạm code:
  • serena.scan quanh callsite và các đường biên tích hợp: adapters, config, env.
  • So khớp pattern đặt tên và path với memory.naming-conventions và folder-structure.
  • Kiểm tra thay đổi gần đây bằng git blame hoặc git log -p trên file nghi vấn.
  • So sánh trước và sau thay đổi gần nhất (diff_summary).
  • Tạo repro tối thiểu (input nhỏ nhất gây lỗi) và ghi vào journal.
  • Nếu nghi hồi quy, cân nhắc git bisect nhanh trong phạm vi hẹp.
- Xây chuỗi nhân-quả: symptom → code path → invariant bị vi phạm.
- Bằng chứng độc lập kép (cần ít nhất 2 mục):
  • Stack/trace khớp code path và tham chiếu symbol/import đúng file.
  • Repro tối thiểu ổn định (lặp lại được) trỏ đến cùng nhánh logic.
  • Xác định invariant hoặc contract bị phá vỡ (nullability, shape, type, pre/post-condition).
  • Commit gần nhất có thay đổi đúng vị trí liên quan.
- MEG — Minimum Evidence Gate (cổng bằng chứng tối thiểu):
  • Không được patch cho đến khi đạt ít nhất một trong ba điều kiện:
    1) Xác định dòng hoặc khối cụ thể gây lỗi, hoặc config/env sai; hoặc
    2) Có repro tối thiểu với mapping rõ ràng tới code path; hoặc
    3) Chỉ ra invariant bị phá vỡ và nơi thiết lập/sử dụng.
- Ghi vào memory: root_cause, evidence, rejected_hypotheses, repro_cmd.

4.5) Micro-Patch & Re-validate
- Vá tối thiểu vào nguyên nhân, không mở rộng phạm vi.
- Chạy lại đúng repro đã ghi.
- Nếu còn fail: tăng retry_count[error_fingerprint].
  • ≤ 2 lần: lặp lại các bước 4.2 → 4.4, mở rộng quét gần callsite.
  • > 2 lần: escalate → quét toàn module và đặt 1 câu hỏi cụ thể nếu thiếu biến ngoài repo.

4.6) Resume
- Khi đã xanh, không reset kế hoạch. Tăng step_cursor + 1.
- Lưu vào memory: resumed_from (error_fingerprint), fix_summary, new_gotchas, repro_cmd.
- Blast radius check nhanh: grep callsite tương tự, chạy smoke nhỏ.

5) Checkpoint & Tiếp tục
- Mỗi bước xanh tạo checkpoint gồm: files_hash, key_exports, tests_passed.
- Mất ngữ cảnh → memory.load(work-journal:current) để tiếp tục đúng step_cursor.

---

## 📐 Naming
- Bắt buộc theo quy ước hiện có, không tự nghĩ pattern.
- Trước khi tạo tên mới: memory.load(naming-conventions) và serena.locate mẫu tương tự.
- Nếu không tìm thấy pattern, chọn mẫu gần nhất đang dùng và ghi rõ lý do vào memory.

## 🎨 Style & Tài nguyên
- Không inline style trừ khi project rule cho phép (CSS Modules, styled-X, v.v.).
- Đặt tệp đúng vị trí:
  • Styles → styles, css, scss
  • Icons → assets/icons
  • Images → assets/images
  • Helpers → utils hoặc helpers

## 🧩 Separation of Concerns
- Một trách nhiệm trên một tệp (UI vs logic vs helpers).
- Tách helpers khi có lặp hoặc dùng đa mục đích.
- Không trộn styling, logic, utilities nếu không theo component-style pattern rõ ràng.

## 📁 Cấu trúc thư mục
- Tôn trọng cấu trúc hiện có; không tạo hay di chuyển thư mục nếu không có yêu cầu rõ.
- File mới đặt cạnh file tương tự (mirror cấu trúc sẵn có).

## 🧠 Quy trình giải quyết
- Hiểu yêu cầu và ràng buộc từ memory và serena.
- Phân rã nhỏ, ít rủi ro, có điểm dừng an toàn và rollback.
- Chỉ triển khai khi kế hoạch rõ.

## ⚙️ Chất lượng & Tối ưu
- Code sạch, gọn, dễ đọc; tránh duplication, nesting sâu, dead code.
- Ưu tiên maintainability; tối ưu runtime nếu có tác động đáng kể.

## 🧱 Code Style
- Tên mô tả, semantic; tuân thủ formatter/linter của repo.
- Hàm và component nhỏ, modular; comment tập trung vào lý do (why).
- TODO phải cụ thể; theo dõi trong memory.save(followups).

## 🔒 Bảo mật
- Không log hoặc lưu secrets/PII vào memory.
- Dùng env hoặc secret manager theo chuẩn của repo.

## 🧪 Validation – Thứ tự
- Type/lint/build nhanh → Unit/targeted tests → Sample run/preview.
- Log dài được hash và lưu fingerprint để tránh rò rỉ.

## 🧷 Quy tắc Atomicity
- Một patch chỉ có một mục tiêu; không refactor rộng trong lúc fix lỗi.
- Trước patch mới: git diff phải sạch hoặc commit nhỏ đã xanh.
- Refactor lớn tạo plan phụ sau khi hoàn thành plan chính.

---

## 🧾 Memory Schema (gợi ý dạng khóa)
- naming-conventions
- style-rules
- folder-structure
- gotchas (danh sách pattern → fix → ví dụ)
- work-journal: lưu plan_id, step_cursor, steps, cùng entries gồm:
  • step, change_set, commands, outputs_digest
  • error_fingerprint, diff_summary, log_excerpt, fix_summary
  • root_cause, evidence, rejected_hypotheses, repro_cmd

## ✅ Done Checklist
- Có plan_id và step_cursor trong memory.
- Đạt MEG (cổng bằng chứng tối thiểu) trước khi patch.
- Mọi lỗi có error_fingerprint, diff_summary, fix_summary, repro_cmd.
- Retry theo fingerprint ≤ 2 trước khi escalate.
- Sửa xong phải Resume kế hoạch (không reset) và chạy blast radius check.
- Các gotchas mới đã memory.save để tránh tái phạm.

---

## ⏱️ Quick Pseudo-Calls (dạng một dòng, tuỳ SDK)
- memory.load([...]); thinking.plan(...); memory.save({plan_id, steps, step_cursor:0}, {ttl: "session"})
- Khi đổi: memory.save({plan_id, step_cursor, change_set:{files, symbols, rationale}})
- Validate: memory.save({plan_id, step_cursor, commands:["pnpm -w build"], outputs_digest: hash(out)})
- Lỗi: memory.save({plan_id, step_cursor, error_fingerprint, diff_summary, log_excerpt}); serena.locate(...); thinking.diagnose(...)
- RCFP: serena.scan({near: callsite, boundaries:["adapters","config","env"]}); tạo repro tối thiểu; kiểm tra MEG
- Resume: memory.save({plan_id, resumed_from: error_fingerprint, fix_summary, new_gotchas, repro_cmd})
