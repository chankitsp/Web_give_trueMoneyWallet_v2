# TrueMoney Wallet Red Envelope Distribution System (Multi-Event)

ระบบแจกซอง TrueMoney Wallet แบบสุ่มและเข้าคิวอัตโนมัติ รองรับการจัดกิจกรรมหลายรายการพร้อมกัน (Multi-Event) พร้อมระบบจัดการหลังบ้าน (Admin)

## คุณสมบัติเด่น (Features)

*   **Multi-Event Support**: สร้างกิจกรรมแจกซองได้หลายรายการพร้อมกัน แต่ละกิจกรรมมีลิงก์แยกกัน (เช่น `/event/abc12345`)
*   **Real-time Queue System**: ระบบคิวอัจฉริยะ แสดงลำดับคิวและเวลาที่ต้องรอแบบเรียลไทม์
*   **Atomic Queue Handling**: ป้องกันการแย่งกันกดรับรางวัลพร้อมกัน (Concurrency Safe)
*   **Server-Side Processing**: ระบบประมวลผลคิวเบื้องหลังอัตโนมัติ แม้ผู้ใช้ปิดหน้าเว็บไปแล้วก็ยังได้รับรางวัลหากถึงคิว
*   **Admin Panel**: หน้าจัดการสำหรับสร้างกิจกรรม กำหนดเวลาเริ่ม-จบ และใส่ลิงก์ซอง
*   **Security**: จำกัดการเข้าถึงหน้า Admin ด้วย IP Address

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

## การใช้งาน (Usage)

1.  **เริ่มรันเซิร์ฟเวอร์**:
    ```bash
    npm start
    ```
    หรือถ้าต้องการโหมด Development (Restart อัตโนมัติเมื่อแก้ไฟล์):
    ```bash
    npm run dev
    ```

2.  **เข้าสู่หน้า Admin** (เพื่อสร้างกิจกรรม):
    *   ไปที่: `http://localhost:3000/admin`
    *   กรอกข้อมูล: เวลาเริ่ม-จบ, รหัสรับรางวัล, และลิงก์ซอง TrueMoney
    *   กด "สร้างลิงก์กิจกรรม"
    *   นำลิงก์ที่ได้ไปแจกผู้ร่วมสนุก

3.  **หน้ากิจกรรม (สำหรับผู้ใช้)**:
    *   ผู้ใช้เข้าลิงก์กิจกรรม (เช่น `http://localhost:3000/event/xxxxxx`)
    *   รอนับถอยหลัง
    *   กรอกเบอร์โทรและรหัสรับรางวัลเพื่อเข้าคิว

## โครงสร้างโปรเจกต์ (Project Structure)

*   `server.js`: จุดเริ่มต้นของเซิร์ฟเวอร์และระบบประมวลผลคิว (Background Worker)
*   `routes/api.js`: จัดการ API Endpoints ทั้งหมด
*   `models/`: เก็บ Schema ของ Database (Event, Queue, Claim, Counter)
*   `public/`: ไฟล์หน้าเว็บ (HTML, CSS, JS)
*   `middleware/`: ฟังก์ชันตรวจสอบความปลอดภัย (เช่น checkIp.js)

## เครื่องมือช่วยเหลือ (Utility Scripts)

*   `node clear_all.js`: ล้างข้อมูลคิวและประวัติการรับรางวัลทั้งหมด (ใช้ระวัง!)
*   `node verify_multi_event.js`: สคริปต์ทดสอบระบบ Multi-Event แบบอัตโนมัติ

---
Developed by MacEZ
