# วิธีตั้งค่า Google Apps Script Backend

## ขั้นตอนที่ 1: สร้าง Google Sheet

1. ไปที่ [Google Sheets](https://sheets.google.com) และสร้าง Sheet ใหม่
2. ตั้งชื่อเป็น "ProductivityApp Database"
3. สร้าง Tabs ดังนี้:

### Tab: Projects
| id | name | description | status | priority | folder_id | created_at | updated_at | completed_at | category |
|----|------|-------------|--------|----------|-----------|------------|------------|--------------|----------|

### Tab: Tasks
| id | title | description | project_id | status | priority | due_date | due_time | time_estimate | time_spent | linked_tasks | tags | note_id | is_recurring | recurring_pattern | parent_task_id | created_at | updated_at | completed_at | created_from |
|----|-------|-------------|------------|--------|----------|----------|----------|---------------|------------|--------------|------|---------|--------------|-------------------|----------------|------------|------------|--------------|--------------|

### Tab: Notes
| id | title | content | tags | linked_notes | linked_tasks | project_id | created_at | updated_at |
|----|-------|---------|------|--------------|--------------|------------|------------|------------|

### Tab: Attachments
| id | parent_type | parent_id | file_type | file_name | drive_file_id | drive_url | file_size | uploaded_at | source |
|----|-------------|-----------|-----------|-----------|---------------|-----------|-----------|-------------|--------|

### Tab: Analytics
| date | tasks_created | tasks_completed | total_time_spent | pomodoro_sessions | productive_hours |
|------|---------------|-----------------|------------------|-------------------|------------------|

## ขั้นตอนที่ 2: สร้าง Google Drive Folders

1. ไปที่ [Google Drive](https://drive.google.com)
2. สร้าง Folder หลักชื่อ "ProductivityApp"
3. ภายในสร้าง Folders ย่อย:
   - `Attachments`
   - `Images`
   - `Documents`
   - `Archives`
   - `Backups`
4. คัดลอก Folder ID ของแต่ละ Folder (จาก URL หลัง `/folders/`)

## ขั้นตอนที่ 3: สร้าง Apps Script Project

1. ไปที่ [script.google.com](https://script.google.com)
2. คลิก "New project"
3. ตั้งชื่อเป็น "ProductivityApp API"
4. ลบโค้ดเดิมทั้งหมดและวางโค้ดจากไฟล์ `Code.gs`
5. แก้ไข CONFIG ที่ด้านบนของโค้ด:

```javascript
const CONFIG = {
  SHEET_ID: 'YOUR_SHEET_ID_HERE', // จาก URL ของ Sheet
  FOLDERS: {
    ATTACHMENTS: 'FOLDER_ID',
    IMAGES: 'FOLDER_ID',
    DOCUMENTS: 'FOLDER_ID',
    ARCHIVES: 'FOLDER_ID',
    BACKUPS: 'FOLDER_ID'
  },
  LINE_CHANNEL_ACCESS_TOKEN: '' // เว้นว่างไว้ก่อน
};
```

## ขั้นตอนที่ 4: Deploy เป็น Web App

1. คลิก "Deploy" > "New deployment"
2. เลือก Type: "Web app"
3. ตั้งค่า:
   - Description: "v1"
   - Execute as: "Me"
   - Who has access: "Anyone"
4. คลิก "Deploy"
5. คัดลอก Web App URL

## ขั้นตอนที่ 5: ตั้งค่า Next.js

1. สร้างไฟล์ `.env.local` ใน folder `productivity-app`:

```
NEXT_PUBLIC_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

2. รัน development server:

```bash
npm run dev
```

## ทดสอบ API

เปิด Browser และทดสอบ:

```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=getAllProjects
```

ควรได้ผลลัพธ์เป็น `[]` (array ว่าง)

## ตั้งค่า Automatic Backup (Optional)

1. ใน Apps Script Editor ไปที่ "Triggers" (ไอคอนนาฬิกา)
2. คลิก "+ Add Trigger"
3. ตั้งค่า:
   - Function: `createDailyBackup`
   - Event source: Time-driven
   - Type: Day timer
   - Time: เลือกเวลาที่ต้องการ (เช่น 2-3am)
4. คลิก Save

---

## Troubleshooting

### Error: "Script function not found"
- ตรวจสอบว่าได้ Deploy ใหม่หลังแก้ไขโค้ด

### Error: "Permission denied"
- ตรวจสอบว่า Web app มี access เป็น "Anyone"
- ลอง Deploy ใหม่

### CORS Error
- Google Apps Script รองรับ CORS โดยอัตโนมัติ
- ตรวจสอบว่าใช้ URL ที่ถูกต้อง

### Data ไม่แสดง
- ตรวจสอบ Sheet ID ใน CONFIG
- ตรวจสอบว่า Tab names ตรงกัน
