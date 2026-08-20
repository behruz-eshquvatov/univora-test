# DTM Test — API Endpoints (Postman uchun)

**Base URL (production):** `https://dtm-test.onrender.com`
**Base URL (local):** `http://127.0.0.1:8000`

---

## 🔐 Account (`/api/`)

Asosiy routing: `path("api/", include("account.urls"))` → `account/urls.py`

`account` ilovasida `google_auth.py`, `views.py`, `manager.py` fayllari mavjud — bu odatda Google orqali autentifikatsiya va foydalanuvchi profilini boshqarish uchun ishlatiladi. Aniq yo'l nomlarini `account/urls.py`dagi `urlpatterns` ro'yxatidan olishingiz mumkin (unda faqat bitta `include` bo'lsa, demak barcha yo'llar shu faylning o'zida yozilgan bo'lishi kerak — `path(...)` qatorlarini tekshiring).

**Eng tez yechim:** Production saytida Swagger orqali aniq yo'llarni ko'ring:
👉 `https://dtm-test.onrender.com/swagger/`

U yerda `account` (yoki `auth`) tegi ostida barcha login/register/google endpointlari to'liq parametrlari bilan chiqadi — frontend dasturchisi ham aynan shu yerdan foydalansa hech qanday chalkashlik bo'lmaydi.

---

## 💳 Billing (`/billing/`)

| Method | URL | Tavsif |
|---|---|---|
| GET | `/billing/plan/` | Barcha tariflar ro'yxati |
| POST | `/billing/plan/` | Yangi tarif yaratish (admin) |
| GET | `/billing/plan/<id>/` | Bitta tarif ma'lumoti |
| PUT/PATCH | `/billing/plan/<id>/` | Tarifni yangilash (admin) |
| DELETE | `/billing/plan/<id>/` | Tarifni soft-delete qilish (admin) |
| GET | `/billing/subscriptions/` | Obunalar ro'yxati |
| GET | `/billing/subscriptions/current/` | Joriy foydalanuvchi obunasi |
| POST | `/billing/subscriptions/<id>/cancel/` | Obunani bekor qilish |
| GET | `/billing/payments/` | To'lovlar ro'yxati |
| POST | `/billing/payments/` | Yangi to'lov yaratish |
| POST | `/billing/payments/<id>/approve/` | To'lovni tasdiqlash |
| POST | `/billing/payments/<id>/reject/` | To'lovni rad etish |

---

## 📚 Catalog (`/catalog/`)

| Method | URL | Tavsif |
|---|---|---|
| GET | `/catalog/subjects/` | Fanlar ro'yxati |
| POST | `/catalog/subjects/` | Yangi fan yaratish |
| GET | `/catalog/subjects/<id>/` | Bitta fan |
| GET | `/catalog/topics/` | Mavzular ro'yxati |
| POST | `/catalog/topics/` | Yangi mavzu yaratish |
| GET | `/catalog/topics/<id>/` | Bitta mavzu |
| GET | `/catalog/questions/` | Savollar ro'yxati |
| POST | `/catalog/questions/` | Yangi savol yaratish |
| GET | `/catalog/questions/<id>/` | Bitta savol |

---

## 📈 Progress (`/progress/`)

| Method | URL | Tavsif |
|---|---|---|
| GET | `/progress/reviews/` | Takrorlash kartalari ro'yxati |
| GET | `/progress/reviews/today/` | Bugungi takrorlashlar |
| POST | `/progress/reviews/<id>/submit/` | Javobni yuborish |
| GET | `/progress/streak/` | Streak (ketma-ket kunlar) holati |
| POST | `/progress/streak/freeze/` | Streak'ni muzlatish |
| GET | `/progress/xp/transactions/` | XP tranzaksiyalari |
| GET | `/progress/xp/summary/` | XP umumiy statistikasi |
| GET | `/progress/leaderboard/weekly/` | Haftalik reyting jadvali |

---

## 📝 Testengine (`/testengine/`)

| Method | URL | Tavsif |
|---|---|---|
| GET | `/testengine/sessions/` | Test sessiyalari ro'yxati |
| POST | `/testengine/sessions/` | Yangi test sessiyasi boshlash |
| GET | `/testengine/sessions/<id>/` | Bitta sessiya ma'lumoti |
| GET | `/testengine/sessions/<id>/next-question/` | Keyingi savolni olish |
| POST | `/testengine/sessions/<id>/finish` | Sessiyani yakunlash |
| POST | `/testengine/sessions/<id>/sync/` | Sessiyani sinxronlash |
| GET | `/testengine/sessions/<session_id>/answers/` | Javoblar ro'yxati |
| POST | `/testengine/sessions/<session_id>/answers/` | Javob yuborish |
| GET | `/testengine/sessions/<session_id>/answers/<answer_id>/` | Bitta javob |
| POST | `/testengine/sessions/<session_id>/answers/bulk/` | Ko'plab javoblarni birdan yuborish |
| GET | `/testengine/results/` | Natijalar ro'yxati |
| GET | `/testengine/results/<id>/` | Bitta natija |
| GET | `/testengine/results/my-results/` | Mening natijalarim |

---

## 🛠️ Boshqa

| URL | Tavsif |
|---|---|
| `/admin/` | Django admin panel |
| `/swagger/` | Swagger UI (API hujjatlari) |
| `/redoc/` | ReDoc UI (API hujjatlari) |
| `/swagger.json` yoki `.yaml` | OpenAPI schema |
| `/google-test/` | Google Test View |

---

## ⚠️ Eslatma
- `account/urls.py` faylining ichidagi aniq yo'llar ko'rinmadi. Uni yuborsangiz, ro'yxatni to'liq qilib beraman.
- Ko'p endpointlar autentifikatsiya talab qiladi — Postman'da Authorization header (Bearer token yoki Session) qo'shishni unutmang.
- `/swagger/` orqali brauzerda barcha endpointlarni interaktiv ravishda ko'rish va sinash mumkin — bu eng ishonchli manba, chunki avtomatik generatsiya qilinadi.
