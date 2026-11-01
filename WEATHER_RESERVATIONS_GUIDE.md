# 날씨 / 캐치테이블 데이터 안내

## 적용
패치 ZIP을 `C:\sunjay`에 상대 경로 그대로 덮어씁니다. 기존 JSON은 `content/messages/ep02.json`의 예약 확인 예시 문자 1건만 수정합니다.

## 날씨
- 경로: `content/weather/all.json`, `ep01.json`, `ep02.json`, `ep03.json`
- `all.json`의 `cities`: `{ "id": "gangneung", "name": "강릉" }`
- `forecasts` 항목: `id`, `cityId`, `date`(YYYY-MM-DD), `condition`, `low`, `high`, `precipitation`, `hourly` (`time` HH:mm, `temperature`, `precipitation`), `sample`.
- `sample: true`는 실제 관측·예보가 아닌 창작 예시입니다. 예시 수치는 사실값이 아닙니다.
- ep01 예보는 EP02에서도 누적 표시되고, ep02에서 추가 예보를 넣을 수 있습니다. 같은 `id`는 최신 에피소드 값으로 대체됩니다.

## 캐치테이블
- 경로: `content/reservations/all.json`, `ep01.json`, `ep02.json`, `ep03.json`
- `reservations` 항목: `id`, `restaurantName`, `date`, `time`, `partySize`, `address`, `status`, `notice`, `confirmationMessageId`, `sample`.
- `confirmationMessageId`는 `content/messages/ep02.json`의 SMS `messages[].id`와 연결하기 위한 식별자입니다. 현재는 표시용 데이터 연결이며 문자 화면으로 이동하는 기능은 없습니다.
- 현재 식당명/주소는 확정되지 않은 예시이므로 실제 설정을 정한 뒤 두 JSON을 동일하게 수정하세요.
- EP01에서는 미래의 예약 확정 내역을 확인할 수 있고, EP02에서는 같은 예약이 유지됩니다. EP02에서 예약을 추가하거나 같은 ID로 덮어쓸 수 있습니다.

## 참고
- 새 앱은 기존 홈 화면 3페이지에서 실행되는 오버레이입니다. 독립 앱 레지스트리 등록이나 시스템 뒤로 가기 연동은 포함하지 않았습니다.
- `lib/`, `package.json`, `tsconfig.json`이 첨부 ZIP에 없어 타입 검사와 Next.js 빌드를 실행하지 못했습니다.
