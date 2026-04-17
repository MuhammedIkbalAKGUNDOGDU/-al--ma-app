# StudyBuddies Ultra Pro - Birlikte Çalışma Platformu

Bu proje, iki kişinin eş zamanlı olarak ders çalışmasını, birbirlerinin ilerlemesini takip etmesini ve ortak bir çalışma alanı oluşturmasını sağlayan profesyonel bir web uygulamasıdır. 

Uygulama, modern web standartları (React, Node.js, PostgreSQL) ve Docker altyapısı ile %100 stabilite hedefleyerek inşa edilmiştir.

## 🚀 Projenin Amacı ve İşlevleri
Uygulama, sadece bir kronometre olmanın ötesinde, iki kullanıcı arasında tam bir senkronizasyon ve motivasyon kanalı oluşturur.

### Temel Özellikler:
- **Canlı Ders Takibi:** Gerçek zamanlı senkronize kronometreler.
- **Mola Sistemi:** Anlık durum güncellemeleri.
- **Paylaşımlı Todo Listesi:** Ortak görev yönetimi.
- **Dahili Sohbet (Chat):** Motivasyonel mesajlaşma alanı.
- **Responsive Tasarım:** Mobil, tablet ve masaüstü uyumlu premium arayüz.
- **Veri Kalıcılığı:** PostgreSQL ile kalıcı oturum yönetimi.

## 🛠 Teknik Mimari
- **Frontend:** React (Vite) + Tailwind CSS + Framer Motion.
- **Backend:** Node.js + Express + Socket.io + Prisma.
- **Database:** PostgreSQL.
- **Altyapı:** Docker & Docker Compose.

## 🐳 Docker ile Kurulum
Sistemi saniyeler içinde ayağa kaldırmak için:

1.  **Dizine gidin:** `cd study-buddies`
2.  **Sistemi Ayağa Kaldırın:**
    ```bash
    make docker-up
    ```
3.  **Bitti!** Uygulamanıza `http://localhost:8080` adresinden erişebilirsiniz.

## 📁 Dosya Yapısı
- `/frontend`: React kullanıcı arayüzü.
- `/backend`: API ve Socket.io sunucusu.
- `/backend/prisma`: Veritabanı şeması.
- `docker-compose.yml`: Sistem orkestrasyonu.

---
*Bu proje Muhammed İkbal AKGÜNDOĞDU için yüksek performanslı ve "Sweet" temalı bir ders çalışma ortamı sağlamak amacıyla modernize edilmiştir.*
