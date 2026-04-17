# StudyBuddies Ultra Pro - Birlikte Çalışma Platformu

Bu proje, iki kişinin eş zamanlı olarak ders çalışmasını, birbirlerinin ilerlemesini takip etmesini ve ortak bir çalışma alanı oluşturmasını sağlayan profesyonel bir web uygulamasıdır. 

Uygulama, modern web standartları (React, Node.js, PostgreSQL) ve Docker altyapısı ile sunucu tarafında %100 stabilite hedefleyerek inşa edilmiştir.

## 🚀 Projenin Amacı ve İşlevleri
Uygulama, sadece bir kronometre olmanın ötesinde, iki kullanıcı arasında tam bir senkronizasyon ve motivasyon kanalı oluşturur.

### Temel Özellikler:
- **Canlı Ders Takibi:** 2 kullanıcı için milisaniyelik hassasiyetle senkronize kronometreler.
- **Mola Sistemi:** Bir kişi mola aldığında diğerinin ekranında durumun anlık olarak yansıması.
- **Paylaşımlı Todo Listesi:** Seans boyunca bitirilmesi gereken görevlerin ortak takibi.
- **Dahili Sohbet (Chat):** Çalışma sırasında motivasyonel mesajlaşma alanı.
- **Giriş ve Güvenlik:** İsim ve dinamik avatar seçimi ile oda şifreleme.
- **Veri Kalıcılığı:** Sunucu resetlense bile PostgreSQL üzerinde saklanan veriler sayesinde seans kaldığı yerden devam eder.

## 🛠 Teknik Mimari
Proje, kurumsal seviyede bir "Monorepo" yapısına sahiptir:

- **Frontend:** React (Vite) + Tailwind CSS + Framer Motion (Animasyonlar).
- **Backend:** Node.js + Express + Socket.io.
- **Database:** PostgreSQL (Veri kalıcılığı ve performans için).
- **Altyapı:** Docker & Docker Compose (Saniyeler içinde yayınlama kolaylığı).

## 🐳 Docker ile Kurulum (Canlı Yayın)
Projenin kendi sunucunuzda (VPS) çalışması için Docker kurulu olması yeterlidir.

1.  **Dizine gidin:** `cd study-buddies`
2.  **Sistemi Ayağa Kaldırın:**
    ```bash
    docker-compose up -d
    ```
3.  **Bitti!** Uygulamanız otomatik olarak veritabanını kuracak ve yayına başlayacaktır.

## 📁 Dosya Yapısı ve Görevleri
- `/frontend`: Kullanıcı arayüzü ve Socket.io istemci mantığı.
- `/backend`: Sunucu tarafı etkinlik yönetimi ve API'ler.
- `/prisma`: Veritabanı şeması ve migration dosyaları.
- `docker-compose.yml`: Frontend, Backend ve DB arasındaki orkestrasyon.

---
*Bu proje Muhammed İkbal AKGÜNDOĞDU için yüksek performanslı ve "Sweet" temalı bir ders çalışma ortamı sağlamak amacıyla geliştirilmektedir.*
