# 이벤트 시스템 (1단계)

## 파일 구성
- `content/events/ep01.json`, `ep02.json`, `ep02-1.json`, `ep02-2.json`, `ep02-3.json`, `ep03.json`: 회차별 이벤트
- `content/events/index.ts`: 이벤트 파일 등록
- `lib/phone/event-types.ts`: TypeScript 스키마
- `components/phone/event-provider.tsx`: 조건 검사, 실행 기록, 중복 방지, localStorage
- `components/phone/event-banner.tsx`: 알림 및 수신 전화 **미리보기 UI**

## JSON 예시
```json
{
  "events": [{
    "id": "example-kakao",
    "enabled": true,
    "repeat": "once",
    "trigger": {"type":"kakao.send","roomId":"kakao-user","keyword":"이벤트테스트"},
    "actions": [
      {"type":"kakao.reply","roomId":"kakao-user","from":"user","text":"형 저도 보고 싶었어요 ㅎㅎ"},
      {"type":"notification","appId":"kakao","title":"선우♡","body":"형 저도 보고 싶었어요 ㅎㅎ","targetId":"kakao-user"}
    ]
  }]
}
```
`repeat`: `once`(회차당 한 번) 또는 `always`(서로 다른 triggerId마다 반복). 동일 triggerId는 반복되지 않습니다. `enabled:false`는 실행하지 않습니다.

## 테스트
1. EP02 선우 카카오톡 방에서 `이벤트테스트`를 전송하면 답장과 배너가 표시됩니다.
2. 다른 테스트: 이벤트 제공자의 `dispatchEvent({type:'action',name:'test.incoming-call',triggerId:'test-1'})`을 호출하면 전화 팝업 미리보기가 나타납니다.
3. `test.repeat`는 triggerId를 바꿔 호출하면 반복됩니다.
4. 실행 결과는 `virtual-phone:events:v1:ep02`에 저장됩니다. EP02-1 등은 별도 키를 사용합니다.
5. 같은 에피소드에서 테스트를 다시 하려면 **해당 에피소드 이벤트 키만** 지우세요. 기존 메시지/다른 앱 저장 내용은 유지됩니다.

## 연동 방법
```tsx
const {dispatchEvent,executions} = usePhoneEvents()
dispatchEvent({type:'instagram.story.upload',keyword:'테스트 스토리',triggerId:storyId})
```
`triggerId`는 실제 동작의 고유 ID를 사용하세요. 카카오톡 보내기와 앱 열기는 연결했습니다. 인스타 스토리 업로드 등 다른 액션은 향후 해당 앱에서 위 한 줄로 연결할 수 있습니다.

`executions`에는 실행 시각과 모든 액션이 보존됩니다. 카카오톡은 이벤트 답장을 이 공통 기록에서 읽고, 알림 센터는 이벤트 알림을 읽습니다. 인스타 DM과 전화 통화 기록에 실제 데이터를 추가하는 것은 **아직 연결하지 않았습니다**. 전화 배너는 시연용이며 수락/거절은 닫기만 수행합니다. UI는 첨부 이미지의 형태를 참고했습니다.

## 주의
- `ep02-1` 등 JSON은 준비했지만 실제 회차 선택 목록에 없는 회차는 별도 등록이 필요합니다.
- `always` 이벤트는 각 동작마다 다른 triggerId를 전달해야 반복됩니다.
- JSON 이벤트 ID는 회차 내에서 유일해야 합니다.
- 이벤트는 브라우저 클라이언트에서만 실행하며 기존 JSON은 수정하지 않습니다.
