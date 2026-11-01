# 할 일 / 문자 패치 안내

- 기존 파일은 상대 경로 그대로 덮어씁니다. 삭제 파일은 없습니다.
- 홈 3페이지에서 할 일과 메시지 앱을 엽니다. 메시지는 기존 `messages` 앱 ID를 사용합니다.
- 할 일 JSON: `content/todos/all.json`, `ep01.json`, `ep02.json`, `ep03.json`. 형식: `{ "todos": [{ "id": "t01", "title": "세차하기", "category": "개인", "dueDate": "2026-04-30", "completed": false, "memo": "" }] }`. EP02는 같은 ID의 변경 필드만 적으면 상속합니다.
- 문자 JSON: 기존 `content/messages/ep01.json`, `ep02.json`의 `smsThreads` 배열. 대화방은 `{ "id": "sms-example-delivery", "unknownNumber": "CJ대한통운", "unreadCount": 1, "messages": [{ "id": "고유ID", "from": "them", "text": "내용", "sentAt": "2026-05-01T09:10" }] }`. 기존 대화방 ID가 같으면 메시지가 누적됩니다.
- 할 일 브라우저 저장 키: `virtual-phone:todos:v1`(EP01), `virtual-phone:todos:v1:episode:ep02`(EP02). 변경과 삭제 ID만 저장합니다.
- 문자 읽음 키: `virtual-phone:sms-read:v1` 및 에피소드별 접미사. JSON 원본은 변경되지 않습니다.
- 기존 EP01 메시지 중 2026년 10월에 작성된 항목은 원본 보존 원칙에 따라 수정하지 않았습니다.
- 현재 ZIP에 `lib/`, `package.json`, `tsconfig.json`이 없어 빌드 및 타입 검사는 실행하지 못했습니다.
