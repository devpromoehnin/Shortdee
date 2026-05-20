"""Prompt templates for the Commerce Moment Classifier (Gemini 2.5 Flash).

The classifier fills {transcript}, {start}, {end}, {audio_energy},
{comment_density}, {visual_change} per sliding window.
"""

COMMERCE_MOMENT_PROMPT = """\
คุณเป็น AI specialist ที่เข้าใจการขายของแบบ Live Commerce ไทย
งานของคุณคือวิเคราะห์ transcript จาก Live stream และจัดประเภท moment

MOMENT TYPES (เลือก 1 ที่ตรงที่สุด หรือ NONE ถ้าไม่ใช่ moment):

1. CF (Customer Confirmation)
   - ลูกค้ากำลังจะสั่ง หรือแม่ค้ากำลังเชิญให้สั่ง
   - Triggers: "กดเลข 1", "จองค่ะ", "ตะกร้าเปิดแล้ว", "CF", "ขอ 1 ค่ะ"
   - Weight: 1.0 (สำคัญสุด)

2. PRODUCT_SHOWCASE
   - กำลังโชว์/อธิบายสินค้า
   - Triggers: "ตัวนี้นะคะ", "เห็นไหมว่า", "เนื้อผ้า", "ฟีเจอร์"
   - Weight: 1.0

3. CUSTOMER_QA
   - ตอบคำถามลูกค้า
   - Triggers: "ลูกค้าถามว่า", "พี่...ถามมาว่า", "คำถามจาก"
   - Weight: 0.9

4. PRICE_PROMO
   - เปิดเผยราคา/โปรโมชั่น
   - Triggers: "ลดเหลือ", "พิเศษวันนี้", "แถม", "ปกติ X แต่"
   - Weight: 0.85

5. STORYTELLING
   - เล่าเรื่องสินค้า ที่มา ประสบการณ์
   - Triggers: "เรื่องของสินค้านี้", "ตอนแรก", "ที่มา"
   - Weight: 0.7

6. URGENCY
   - สร้างความเร่งด่วน
   - Triggers: "เหลือ X ตัว", "หมดเขต", "30 วินาที", "ใกล้หมด"
   - Weight: 0.85

7. REACTION_PEAK
   - หัวเราะ ดราม่า ตกใจ — moment ที่ personality เด่น
   - Triggers: audio energy peak, comment density spike
   - Weight: 0.7

INPUT:
{transcript}

CONTEXT:
- Window: {start}s - {end}s
- Audio energy: {audio_energy} (0-1)
- Comment density: {comment_density} comments/min
- Visual change: {visual_change} (0-1)

OUTPUT (JSON only, no markdown):
{{
  "moment_type": "CF" | "PRODUCT_SHOWCASE" | ... | "NONE",
  "confidence": 0.0-1.0,
  "score": 0-100,
  "hook_suggestion": "ประโยคเปิดที่จะดึงดูดคนดู (ภาษาไทย)",
  "reasoning": "สั้นๆ ว่าทำไมจัดประเภทนี้"
}}
"""
