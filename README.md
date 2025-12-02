# TrueMoney Wallet Red Envelope Distribution System (Multi-Event)

ระบบแจกซอง TrueMoney Wallet แบบสุ่มและเข้าคิวอัตโนมัติ รองรับการจัดกิจกรรมหลายรายการพร้อมกัน (Multi-Event) พร้อมระบบจัดการหลังบ้าน (Admin)

## คุณสมบัติเด่น (Features)

*   **Multi-Event Support**: สร้างกิจกรรมแจกซองได้หลายรายการพร้อมกัน
*   **Two Event Types**:
    1.  **Queue System (Original)**: ระบบคิวอัจฉริยะสำหรับแจกซอง TrueMoney Wallet ป้องกันการแย่งกันกด (Concurrency Safe)
    2.  **URL Distribution (New)**: ระบบแจก URL (เช่น บัตรเติมเงิน) แบบไม่ต้องเข้าคิว กรอกรหัสถูกรับลิงก์ทันที
*   **Automatic Link Shortener**: ระบบย่อลิงก์อัตโนมัติสำหรับกิจกรรมแบบ URL ช่วยปกปิดลิงก์ต้นฉบับ
*   **Real-time Queue**: แสดงลำดับคิวและเวลาที่ต้องรอแบบเรียลไทม์ (สำหรับกิจกรรมแบบคิว)
*   **Admin Panel**: หน้าจัดการสำหรับสร้างกิจกรรม กำหนดเวลาเริ่ม-จบ
*   **Security**: ระบบตรวจสอบ IP สำหรับหน้า Admin (เปิด/ปิดได้)

## สิ่งที่ต้องมี (Prerequisites)

*   [Node.js](https://nodejs.org/) (v14 ขึ้นไป)
*   [MongoDB](https://www.mongodb.com/) (ต้องรันไว้ที่ Port 27017 หรือตามที่กำหนดใน .env)

## การติดตั้ง (Installation)

1.  Clone โปรเจกต์หรือดาวน์โหลดไฟล์
2.  เปิด Terminal แล้วรันคำสั่งเพื่อติดตั้ง Dependencies:
    ```bash
    npm install
    ```
3.  สร้างไฟล์ `.env` โดยดูตัวอย่างจาก `.env.example`:
    ```bash
    cp .env.example .env
    ```
4.  แก้ไขไฟล์ `.env` เพื่อตั้งค่า:
    *   `MONGO_URI`: ลิงก์เชื่อมต่อ MongoDB
    *   `PORT`: พอร์ตของเซิร์ฟเวอร์ (Default: 3000)
    *   `ADMIN_IPS`: รายชื่อ IP ที่อนุญาตให้เข้าหน้า Admin (คั่นด้วยเครื่องหมายจุลภาค)
    *   `ADMIN_CHECK_IP`: ตั้งเป็น `true` เพื่อเปิดใช้งานการตรวจสอบ IP (ถ้าไม่ตั้งหรือเป็น `false` จะเข้าได้ทุก IP)

## การใช้งาน (Usage)

1.  **เริ่มรันเซิร์ฟเวอร์**:
    ```bash
    npm start
    ```
    หรือโหมด Development:
    ```bash
    npm run dev
    ```

2.  **สร้างกิจกรรม (Admin)**:

    *   **แบบแจกซอง TrueMoney (มีคิว)**:
        *   ไปที่: `http://localhost:3000/createtw`
        *   กรอกข้อมูลและลิงก์ซอง TrueMoney
        *   ได้ลิงก์รูปแบบ: `/event/xxxxxx`

    *   **แบบแจก URL/บัตรเติมเงิน (ไม่มีคิว)**:
        *   ไปที่: `http://localhost:3000/createtwurl`
        *   กรอกข้อมูลและลิงก์รางวัล (ระบบจะย่อลิงก์ให้อัตโนมัติ)
        *   ได้ลิงก์รูปแบบ: `/eventurl/xxxxxx`

3.  **หน้ากิจกรรม (User)**:
    *   ผู้ใช้เข้าลิงก์กิจกรรมที่ได้
    *   รอนับถอยหลัง (ถ้ามี)
    *   กรอกรหัสรับรางวัล
    *   **แบบคิว**: เข้าคิวรอรับเงินเข้า Wallet
    *   **แบบ URL**: รับลิงก์รางวัลทันที (คลิกเพื่อไปที่ลิงก์ต้นฉบับ)

## โครงสร้างโปรเจกต์ (Project Structure)

*   `server.js`: จุดเริ่มต้นของเซิร์ฟเวอร์
*   `routes/api.js`: จัดการ API Endpoints ทั้งหมด
*   `models/`: เก็บ Schema ของ Database (Event, EventUrl, Queue, Claim, ShortLink)
*   `public/`: ไฟล์หน้าเว็บ (HTML, CSS, JS)
*   `middleware/`: ฟังก์ชันตรวจสอบความปลอดภัย (checkIp.js)

## เครื่องมือช่วยเหลือ (Utility Scripts)

*   `node clear_all.js`: ล้างข้อมูลคิวและประวัติการรับรางวัลทั้งหมด (ใช้ระวัง!)

---
Developed by MacEZ
