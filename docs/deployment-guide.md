# Huong Dan Deploy Du An FortifyKitchen - Phuong An 1

Tai lieu nay huong dan chi tiet cach trien khai (deploy) he thong FortifyKitchen len moi truong Production theo Phuong an 1 (giai phap Cloud serverless va PaaS toi uu hieu nang va chi phi).

Moi truong trien khai:
- Frontend (customer-web & admin-dashboard): Deployed on Vercel
- Backend (api - NestJS): Deployed on Railway (hoac Render)
- Database: PostgreSQL hosted on Neon (hoac Supabase)

---

## Phan 1: Cau Hinh Co So Du Lieu (Neon Postgres)

Du an hien tai dang su dung Neon Postgres. Day la co so du lieu Serverless ho tro tu dong co gian va dong bang khi khong co truy van.

1. Dang nhap vao Neon Console va tao mot Project moi.
2. Sao chep chuoi ket noi Postgres Connection String (nen chon phien ban su dung PgBouncer neu co de toi uu hoa so luong connection pool).
   Vi du: `postgres://[user]:[password]@[host]/neondb?sslmode=require`
3. Chuan bi tai khoan va Database thuc te. Khong nen dung chung database chay local dev de tranh ghi de du lieu cua nhau.

---

## Phan 2: Trien Khai Backend API (NestJS tren Railway)

Railway la mot nen tang PaaS rat manh me, tu dong build tu monorepo su dung pnpm workspaces.

### Buoc 1: Lien ket Repository
1. Dang nhap vao Railway.app bang tai khoan GitHub cua ban.
2. Tao mot Project moi tren Railway, chon "Deploy from GitHub repo".
3. Chon repository cua he thong `fortifykitchen`.

### Buoc 2: Cau hinh duong dan va Build command
Trong phan settings cua service tren Railway, can thiet lap cac thong so build cho app NestJS:
- Root Directory: Thiet lap la thu muc goc cua monorepo (vi tri co chua file `pnpm-workspace.yaml`).
- Build Command: Chay lenh build cho ca package database va app backend API:
  ```bash
  pnpm install && pnpm --filter @fortifykitchen/database db:generate && pnpm --filter @fortifykitchen/database build && pnpm --filter api build
  ```
- Start Command: Chay NestJS API o che do production:
  ```bash
  pnpm --filter api start:prod
  ```

### Buoc 3: Khai bao Bien Moi Truong (Environment Variables)
Ban can them day du cac bien moi truong sau vao tab Variables tren Railway:
- `NODE_ENV`: `production`
- `PORT`: `4000` (hoac de trong de Railway tu dong gan)
- `DATABASE_URL`: Dien chuoi ket noi Neon Postgres lay tu Phan 1
- `JWT_SECRET`: Nhap mot chuoi random dai bao mat de ky JWT Token
- `BETTER_AUTH_SECRET`: Nhap chuoi ky tu bao mat dung cho thu vien Auth
- `BETTER_AUTH_URL`: Dien URL backend thuc te cua ban tren Railway (vi du: `https://api-production.up.railway.app`)

Sau khi nhap day du cac bien, Railway se tu dong trigger mot dot deploy moi. Neu hoan thanh, ban se nhan duoc mot URL public de truy cap vao API (vi du: `https://fortifykitchen-api.up.railway.app`).

---

## Phan 3: Trien Khai Frontend Clients (Vercel)

Chung ta se deploy hai ung dung Frontend Next.js (`customer-web` va `admin-dashboard`) rieng biet tren Vercel de co hieu nang Edge Caching tot nhat.

### Ung dung 1: Trang dat hang cua khach hang (customer-web)

1. Dang nhap vao Vercel.com bang tai khoan GitHub.
2. Chon "Add New" -> "Project" -> Import repository cua `fortifykitchen`.
3. Trong bang cau hinh du an, thiet lap nhu sau:
   - Project Name: `fortifykitchen-customer`
   - Framework Preset: Chon **Next.js**
   - Root Directory: Nhap `apps/customer-web`
4. Mo rong phan **Build and Development Settings**:
   - Build Command: `cd ../.. && pnpm build --filter=customer-web`
   - Install Command: `cd ../.. && pnpm install`
5. Nhap cac bien moi truong (Environment Variables):
   - `NEXT_PUBLIC_API_URL`: Dien dia chi URL public cua NestJS API da deploy tren Railway tai Phan 2 (vi du: `https://fortifykitchen-api.up.railway.app`).
6. An **Deploy**. Vercel se tu dong chay va tao ra trang web public cho ban.

### Ung dung 2: Trang quan ly cua Admin (admin-dashboard)

Tuyen trinh deploy admin-dashboard hoan toan giong nhu tren, chi khac cac thong so ten va bien moi truong:

1. Import lai repository `fortifykitchen` mot lan nua.
2. Thiet lap cau hinh:
   - Project Name: `fortifykitchen-admin`
   - Framework Preset: Chon **Next.js**
   - Root Directory: Nhap `apps/admin-dashboard`
3. Cau hinh **Build and Development Settings**:
   - Build Command: `cd ../.. && pnpm build --filter=admin-dashboard`
   - Install Command: `cd ../.. && pnpm install`
4. Nhap cac bien moi truong (Environment Variables):
   - `NEXT_PUBLIC_API_URL`: Dien dia chi URL public cua NestJS API tuong tu nhu tren.
5. An **Deploy**.

---

## Phan 4: Dong Bo Hoa Va Seed Du Lieu Database Ban Dau

Khi deploy len moi truong production lan dau tien, database trong Neon se hoan toan trong. Ban can day cau truc cac bang va seed du lieu cac mon an thoi diem ban dau de website hoat dong:

1. Tai may local cua ban, dam bao bien `DATABASE_URL` trong file `.env` duoc doi tam thoi sang **ConnectionString cua database Production tren Neon**.
2. Run command de push he thong bang vao Neon:
   ```bash
   pnpm --filter @fortifykitchen/database db:push
   ```
3. Run command de nap du lieu mau (Seed data) nhu cac mon an, danh muc va account admin mac dinh:
   ```bash
   pnpm --filter @fortifykitchen/database db:seed
   ```
4. Sau khi chay thanh cong, hay chuyen lai file `.env` o local ve URL cua Local Database de khong lam anh huong den Production.

---

## Phan 5: Cac Luu Y Quan Trong Khi Van Hanh

### 1. Cau Hinh CORS
Khi backend API deploy tren Railway va frontends chay tren Vercel, trinh duyet se khoa truy van neu khong cau hinh CORS hop le.
- Dam bao trong ma nguon cua backend (`apps/api/src/main.ts`), cac origin cua ca hai trang web Vercel (customer web va admin dashboard) deu da duoc them vao danh sach cho phep.

### 2. EPERM tren moi truong local Windows
Khi ban update thay doi Prisma schema o local va gap loi engine bi lock boi Node server dang chay, hay nho tat tat ca dev terminal truoc khi chay `pnpm db:push`. Tren moi truong production Vercel/Railway, loi nay se khong bao gio xay ra vi cac instance chay rieng biet va duoc build co lap.
