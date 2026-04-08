# File Uploader

A Node.js file uploader app built with Express, Prisma ORM, Passport.js, and Cloudinary. Built as part of [The Odin Project](https://www.theodinproject.com/lessons/nodejs-file-uploader) curriculum.

## Features

- Register and login with username/password
- Create and delete folders
- Upload files to Cloudinary
- View file details and download files
- Share folders via expiring links
- Sessions persisted in PostgreSQL via Prisma

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL + Prisma ORM v7
- **Auth:** Passport.js (local strategy) + express-session
- **Storage:** Cloudinary
- **Views:** EJS

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd file-uploader
npm install
```

### 2. Create a `.env` file

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/file_uploader"
SESSION_SECRET="your-secret-here"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 3. Set up the database

```bash
npx prisma migrate dev --name init
```

### 4. Start the server

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## Known Issues & Fixes (Prisma v7)

The Odin Project lesson was written for an older version of Prisma. Prisma v7 introduced several breaking changes. Here's what broke and how to fix it.

### 1. `url` no longer supported in `schema.prisma`

**Error:** `The datasource property 'url' is no longer supported in schema files.`

**Fix:** Remove `url` from the `datasource` block in `schema.prisma` and move it to `prisma.config.js` in the project root:

```js
// prisma.config.js
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL },
});
```

### 2. `PrismaClient` requires a driver adapter

**Error:** `PrismaClient needs to be constructed with a non-empty, valid PrismaClientOptions`

**Fix:** Install `@prisma/adapter-pg` and pass it to the client:

```bash
npm install @prisma/adapter-pg
```

```js
// lib/prisma.js
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export { prisma };
```

### 3. Generator must use `engineType: "client"` and custom output

**Fix:** Update `schema.prisma` generator block:

```prisma
generator client {
  provider   = "prisma-client-js"
  output     = "../generated/prisma"
  engineType = "client"
}
```

Then regenerate:

```bash
npx prisma generate
```

### 4. `prisma.config.js` must be in the project root

Not inside the `prisma/` folder — it must sit next to `package.json`.

### 5. Cloudinary uploads returning 401

**Cause:** Cloudinary's default upload preset is set to `Signed`, making uploaded files private.

**Fix:**
- Go to Cloudinary Dashboard → Settings → Upload → Upload Presets
- Edit `ml_default` and change Signing Mode to `Unsigned`
- Go to Settings → Security and make sure PDF is not in the restricted file types list

### 6. `dotenv` must be imported in `app.js`

Without this, `process.env` variables are undefined and sessions/Cloudinary fail silently.

```js
import 'dotenv/config'; // must be first line
import express from 'express';
```