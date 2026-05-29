# PlantLog

PlantLog는 개인용 식물 물주기 기록 웹앱입니다. MVP는 모바일 중심 Next.js App Router 구조로 구성되어 있으며, Supabase Auth/Database/Storage 연결을 전제로 합니다.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth / PostgreSQL / Storage
- Vercel 배포 대응

## Local Setup

```bash
npm install
npm run dev
```

Supabase 연결 시 `.env.example`을 참고해 아래 값을 설정합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Supabase

초기 테이블과 RLS 정책은 `supabase/schema.sql`에 있습니다. MVP는 모든 데이터를 본인만 볼 수 있는 private policy로 시작합니다.

### Kakao Login

Supabase Auth에서 Kakao provider를 켜고, Kakao Developers의 Redirect URI에 Supabase callback URL을 등록합니다.

```text
https://iisiwlpzncuzgryvdwcx.supabase.co/auth/v1/callback
```

Vercel 프로덕션 앱으로 돌아오려면 Supabase Auth URL Configuration의 Site URL을 아래 주소로 맞춥니다.

```text
https://plantlog-sigma.vercel.app
```

## Push Notifications

Vercel Hobby 배포를 유지하기 위해 Vercel Cron은 사용하지 않습니다. 외부 스케줄러가 5분마다 아래 URL을 호출하게 설정합니다.

```text
GET https://plantlog-sigma.vercel.app/api/notifications/send
Authorization: Bearer <CRON_SECRET>
```

Supabase에는 `supabase/add-notification-sent-date.sql`을 한 번 적용해 사용자별 하루 1회 중복 전송을 막는 컬럼을 추가합니다.

## MVP Coverage

- 홈: 오늘 물줄 식물, 곧 물줄 식물, 오래 확인하지 않은 식물
- 빠른 물주기 기록 바텀시트
- snooze 바텀시트
- 월간 캘린더: 실제 기록과 예정 물주기 구분
- 날짜 바텀시트와 같은 날짜 연속 기록 추가 흐름
- 식물 목록, 식물 등록 폼, 식물 상세
- 식물 상세 탭: 리스트, 캘린더, 앨범
- 기록 상세 바텀시트
- 로그인/마이페이지 기본 화면
- Supabase 클라이언트와 DB 스키마

현재 화면은 Supabase 환경변수 없이도 UX를 확인할 수 있도록 샘플 데이터를 사용합니다. 다음 단계는 샘플 데이터 호출부를 Supabase query/server action으로 교체하는 것입니다.
