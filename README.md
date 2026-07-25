![Cover Image](https://github.com/sunrin-today/.github/blob/assets/cover.png)

# Sunrin Today

Sunrin Internet High School Lunch Service API (Elysia + Bun + Prisma 7)

<br>

## Requirements

- [Bun](https://bun.sh) 1.3+
- PostgreSQL
- Redis

## Setup

```sh
git clone https://github.com/sunrin-today/api
cd api
cp .env.example .env
bun install
bun run db:generate
```

## Development

```sh
bun run dev
```

## Database

```sh
bun run db:migrate   # local
bun run db:deploy    # production
bun run db:studio
```

## Cache

Meal reads are cached in Redis with short TTLs (today ≤15m, aggregates 5m, past ≤6h).  
Writes bump a cache version so old keys expire naturally — every key always has a TTL.

## Docker

```sh
docker build . -t ghcr.io/sunrin-today/api
docker run --env-file .env -p 3000:3000 ghcr.io/sunrin-today/api
```

## Contributing

1. Clone this repository.
2. Create a new branch.
3. Commit your code and push those commits to your own repository.
4. Create a pull request.

## License

[MIT](https://github.com/sunrin-today/api/blob/main/LICENSE)
