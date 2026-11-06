# 카카오톡 자동 답장 / 인스타그램 스토리 반응

## 설치
ZIP 내 파일을 `C:\sunjay`에 프로젝트 상대 경로 그대로 덮어씁니다. 기존 원본 JSON 메시지/스토리/게시물은 삭제하지 않습니다.

## 카카오톡 예시 (EP02)
`content/events/ep02.json`에 `auto-what`, `auto-miss`, `auto-selfie`가 있습니다.
- `선우 뭐해?` → `나 형 생각중 ㅎㅎ`
- `보고싶다` → `나두나두 ㅠㅠ`
- `셀카보내줘` → `/sunjay-phone/images/profile/toridoinsta.jpg` 및 `요기요기! ㅎㅎ`
- 공백, 문장부호를 제거하고 소문자화하여 부분 일치합니다. 예: `보고 싶다!`도 일치합니다.
- 1.4~2.3초 지연 뒤 자동 답장을 표시합니다. 답장은 같은 트리거 실행 ID로 한 번만 기록됩니다.
- `repeat: "always"`는 **서로 다른 전송 메시지**마다 반응한다는 뜻입니다. 1회성 이벤트는 `"once"`를 사용하세요.
- 채팅방 휴지통은 해당 방의 입력 메시지와 트리거 기록을 초기화합니다.

### 자동 답장 JSON
```json
{
  "id": "auto-example",
  "enabled": true,
  "repeat": "always",
  "trigger": {"type":"kakao.send","roomId":"kakao-user","keyword":"안녕"},
  "actions": [{"type":"kakao.reply","roomId":"kakao-user","from":"user","text":"안녕하세요","image":"/sunjay-phone/images/example.jpg"}]
}
```
`image`는 선택 사항입니다. 기존 `content/kakao/*.json`의 원본 스토리 메시지는 수정하지 않습니다.

## 인스타그램 스토리 테스트 (EP02)
인스타그램 홈 상단 `+ 스토리`를 누릅니다. 이미지 경로(예: `/sunjay-phone/images/profile/toridoinsta.jpg`)를 넣고 문구에 `선우반응테스트`를 입력한 후 업로드합니다. 1.4~2.3초 후 선우의 좋아요 표시, `story-reply-sunwoo` DM, 알림이 생성됩니다. DM 목록에서 선우 대화를 열 수 있습니다. 이미지 경로는 정적 배포된 실제 파일을 지정하세요.

### 스토리 반응 JSON
```json
{
 "id":"story-example","enabled":true,"repeat":"always",
 "trigger":{"type":"instagram.story.upload","keyword":"선우반응테스트"},
 "actions":[
  {"type":"instagram.story.like","storyId":"$trigger","accountId":"torido0624"},
  {"type":"instagram.dm","threadId":"story-reply-sunwoo","accountId":"torido0624","from":"torido0624","text":"형 스토리 봤어요 ㅎㅎ"},
  {"type":"notification","appId":"instagram","title":"인스타그램","body":"선우님이 스토리를 좋아하고 답장했습니다.","targetId":"story-reply-sunwoo"}
 ]
}
```
`$trigger`는 업로드된 스토리 ID를 의미합니다.

## 에피소드별 관리 / 저장
- 이벤트 설정: `content/events/ep01.json`, `ep02.json`, `ep02-1.json`, `ep02-2.json`, `ep02-3.json`, `ep03.json`.
- 이벤트 실행·답장 노출·알림 읽음/삭제: `virtual-phone:events:v1:<episodeId>`.
- 사용자 카톡 메시지: `virtual-phone:kakao-sent:v1:<episodeId>:<roomId>`.
- 업로드한 스토리: `virtual-phone:instagram-uploaded-stories:v1:<episodeId>`.
- 직접 보낸 인스타그램 DM: `virtual-phone:instagram-reader-dms:v1:<episodeId>`.
- `ep02-1`, `ep02-2`, `ep02-3`의 이벤트 JSON은 준비되어 있으나, 현재 업로드 ZIP의 `content/episodes/index.ts`에는 EP01·EP02·EP03만 등록되어 있습니다. 별도 에피소드로 선택하려면 기존 에피소드 등록 작업이 필요합니다.
- 기존의 정적 알림은 별도 `virtual-phone:notifications:v1` 저장 키를 계속 사용합니다.

## 주의
첨부 프로젝트 ZIP에 `package.json`, `tsconfig.json` 및 `lib/phone` 원본이 없어 전체 타입 검사와 Next.js 빌드를 실행하지 못했습니다. 추가된 `lib/phone/event-types.ts`는 현재 이벤트 코드에 필요한 타입 정의를 포함합니다. 프로젝트에 같은 경로의 최신 타입 정의가 이미 있다면 덮어쓰기 전에 차이를 확인하세요.
