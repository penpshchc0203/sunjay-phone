# 에피소드별 현재 상태 오버라이드

기존 `content/<app>/all.json`, `ep01.json`, `ep02.json`, `ep03.json`은 그대로 유지됩니다. 누적 메시지·사진·통화·주문·브라우저 기록은 기존 로더에서 합쳐집니다.

## 현재 상태 변경

`content/episodes/state/ep02.json`에 **바뀌는 필드만** 작성합니다. EP03은 EP01→EP02→EP03 오버라이드를 순서대로 상속합니다. EP01로 돌아가면 EP02 오버라이드는 적용되지 않습니다.

예시 (실제 파일은 `{}`로 비워 둠):

```json
{
  "contacts": [{"id":"sunwoo","name":"내 애인","favorite":true,"avatar":"images/profile/sunwoo.jpg"}],
  "kakaoProfiles": [{"contactId":"sunwoo","statusMessage":"♡"}],
  "kakaoAvatars": {"sunwoo":"images/profile/sunwoo.jpg"},
  "kakaoRooms": [{"id":"kakao-user","pinned":true,"muted":false}],
  "instagramProfile": {"bio":"강릉 여행 중"},
  "instagramAccounts": [{"id":"jake_k","displayName":"재윤"}],
  "notes": [{"id":"note-todo","title":"여행 준비","pinned":true}],
  "alarms": [{"id":"alarm-002","enabled":false}]
}
```

배경화면은 `content/episodes/settings/ep02.json`에 아래처럼 작성합니다. `ep01`과 `ep03`도 각각 독립 설정 가능합니다. 미지정 시 기존 디자인 기본값을 사용합니다.

```json
{"lockWallpaper":"images/wallpaper/lock.jpg","homeWallpaper":"images/photos/photo-ep02-80twvm9o.jpg"}
```

주의: `kakaoRooms`의 동일 ID 메시지는 기존 누적 병합을 유지합니다. 상태 파일에서는 채팅방 설정만 수정하고 `messages`는 넣지 마세요. 배열의 요소는 ID 기준으로 병합하며, `kakaoProfiles`는 `contactId`를 기준으로 병합합니다. 인스타그램 게시물/DM 및 메모의 새 기록은 기존 앱 JSON을 사용하세요.

## 브라우저 저장 상태

기존 `episodeStorageKey`는 EP01에서 기존 키를 유지하고 EP02/EP03에는 `:episode:ep02`, `:episode:ep03`을 붙입니다. 따라서 에피소드별 사용자 수정은 독립적이며, JSON만 수정해도 이전에 브라우저에서 저장한 메모/알람 수정값이 우선할 수 있습니다. 테스트 시 개발자 도구 Application → Local Storage에서 **해당 앱과 해당 에피소드 키만** 제거하세요. 삭제하면 그 에피소드에서 브라우저로 수정한 내용이 사라집니다.

## 검증 범위

제공된 ZIP에는 `package.json`, `tsconfig.json`, `lib/`가 없어 타입 검사 및 Next.js 빌드를 실행할 수 없습니다. 원본 프로젝트에 패치를 적용한 뒤 `npm run build`를 실행하고 EP01→EP02→EP01, EP03 상속을 확인하세요.
