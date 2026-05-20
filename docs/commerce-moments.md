# Commerce Moments

ClipDee's core IP — the 7 moment types the classifier detects in Thai Live
Commerce streams. Defined in `apps/ai/app/prompts/commerce_moments.py`.

| Type | คำอธิบาย | Triggers | Weight |
|------|----------|----------|--------|
| `CF` | ลูกค้ายืนยันการสั่งซื้อ | "กดเลข 1", "จองค่ะ", "CF", "ตะกร้าเปิด" | 1.0 |
| `PRODUCT_SHOWCASE` | โชว์/อธิบายสินค้า | "ตัวนี้นะคะ", "เห็นไหมว่า" | 1.0 |
| `CUSTOMER_QA` | ตอบคำถามลูกค้า | "ลูกค้าถามว่า", "พี่...ถามมา" | 0.9 |
| `PRICE_PROMO` | เปิดราคา/โปรโมชั่น | "ลดเหลือ", "พิเศษ", "แถม" | 0.85 |
| `URGENCY` | สร้างความเร่งด่วน | "เหลือ X ตัว", "หมดเขต" | 0.85 |
| `STORYTELLING` | เล่าเรื่องสินค้า | "ที่มาของ", "ตอนแรก..." | 0.7 |
| `REACTION_PEAK` | หัวเราะ ตกใจ ดราม่า | audio/comment spike | 0.7 |

## ClipDee Score

```
Score = 0.30 × moment_type_weight
      + 0.25 × comment_density_score
      + 0.20 × audio_energy_score
      + 0.15 × visual_change_score
      + 0.10 × speaker_clarity_score

Range 0-100 · Threshold ≥ 65 = auto-clip candidate
```

See `apps/ai/app/services/moment_classifier.py` for the implementation (Phase 4.2).
