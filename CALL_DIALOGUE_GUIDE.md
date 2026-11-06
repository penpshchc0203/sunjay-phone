# 통화 대사 / 이벤트 설정

## 통화 대사 JSON

`content/calls/dialogues/ep02.json`의 `dialogues` 배열에 추가합니다.

```json
{
  "id": "call-example",
  "callId": "call-56",
  "contactId": "sunwoo",
  "lines": [
    {"from":"other","text":"여보세요?"},
    {"from":"me","text":"어, 선우야."}
  ]
}
```

- `callId`: 기존 `content/calls/ep02.json`의 통화 ID. 기록 상세에서 전화 아이콘을 누르면 재현합니다.
- `eventId`: 이벤트로 들어오는 전화에 연결할 경우 `content/events/ep02.json`의 이벤트 `id`를 지정합니다.
- `from`: `me`는 종성, `other`는 상대방입니다.
- `lines`: 화면을 누를 때마다 한 줄씩 나타납니다.
- 실제 음성 통화/녹음은 없습니다.

## 전화 이벤트

`content/events/ep02.json`에 이미 등록된 `test-phone`을 그대로 사용합니다.

```json
{
  "id":"test-phone",
  "enabled":true,
  "repeat":"once",
  "trigger":{"type":"kakao.send","roomId":"kakao-user","keyword":"선우야 전화좀"},
  "actions":[{"type":"phone.incoming","contactId":"sunwoo","displayName":"선우♡"}]
}
```

선우 채팅방에서 `선우야 전화좀` 전송 → 2.5초 후 전화 화면 → 받기/거절하기.
받으면 `eventId: "test-phone"`인 대화가 진행됩니다. 받기/거절 결과는 에피소드별 `virtual-phone:events:v1:ep02`에 저장되고, 전화 앱 최근 기록에 나타납니다. 통화 기록은 원본 JSON에 직접 추가되지 않습니다.

`app.open` 등 기존 공통 트리거도 `phone.incoming` 액션과 결합할 수 있습니다. 특정 콘텐츠 열람 트리거는 해당 콘텐츠 화면에서 `dispatchEvent`를 호출하도록 연결해야 합니다.

## 재테스트

선우 카카오톡 채팅방의 휴지통을 사용하면 이 채팅방에서 발생한 이벤트 실행 기록과 해당 전화 결과가 초기화됩니다. 다른 에피소드 데이터는 영향을 받지 않습니다.

## 주의

전화 기록 재현은 `callId`가 있는 기록만 가능합니다. 대사 없는 기록의 전화 버튼은 기존 안내 동작을 유지합니다. EP01/EP03에 대사를 넣으려면 `content/calls/dialogues/epXX.json` 파일을 추가하고 `index.ts`에 등록하세요.
