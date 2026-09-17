![Cover Image](https://raw.githubusercontent.com/sunrin-today/.github/assets/banner_rounded.png)

# Sunrin Today Official API

선린인터넷고등학교 급식 API입니다. (Elysia + Bun + Prisma 7)

전체 구조는 [선린투데이 아키텍처](https://github.com/sunrin-today/.github#아키텍처)를 보면 됩니다.

[https://api.sunrin.kr](https://api.sunrin.kr) · [docs](https://api.sunrin.kr/docs)

## 설치

[Bun](https://bun.sh) 1.3+, PostgreSQL, Redis

```sh
git clone https://github.com/sunrin-today/api.git
cd api
cp .env.example .env
bun install
bun run db:generate
bun run db:migrate
```

## 사용

쓰기는 `X-API-Key`가 필요합니다.

```sh
bun run dev
bun run db:deploy
bun run db:studio
```

## 라이선스

[BSD-2-Clause](LICENSE)
