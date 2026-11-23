# Mahalle Marketi doğrulama notları

**23 Kasım 2026 · Windows · Node.js 24.11.1 · Playwright 1.58.2**

## Sayısal kontroller

`npm test` yedi test grubunu çalıştırır. Bunlardan biri sabit bir rastgelelik tohumu kullanarak üç seviyeye yayılmış **3.000 alışveriş görevi** üretir. Her görevin ürün adedi, ürün çeşitliliği, raf içeriği, fiyatları, toplam sınırları, fiziksel para kimlikleri ve ilgili ödeme çözümü kontrol edilir.

- Süt 30 TL ve ekmek 5 TL. Kasada 35 TL oluşur. 20, 10 ve 5 TL ile ödeme sonrasında bakiye doğru kalır.
- Yoğurdun yanlış seçilmesi, fazla adet, sepetten geri bırakma, eksik okutma, aynı ürünü tekrar okutma ve ödeme öncesi ilerleme denemeleri.
- Orta seviyede aynı tutarı veren alternatif banknot seçimleri, fazla ödeme ve parayı geri alma.
- 50 TL karşılığında 15 TL para üstü. 10 ve 5 TL seçimi, yanlış tutarı düzeltme, doğru ve yanlış kasiyer önerilerinin her iki dalı.
- Yalnız 20 ve 50 TL açıkken 60 TL'nin üç adet 20 TL ile kurulması. Çözümsüz öğretmen ayarlarının kayıttan önce reddedilmesi.
- 1 ve 5 TL madeni paralar, iki adet aynı ürün, büyük para yığınlarında fiziksel paraların ayrı kalması, kademeli görev sırası ve yardım düzeyine göre ödül.

## Derlenmiş dosyada baştan sona oynanan senaryolar

| Tarayıcı motoru | Görünüm | Tamamlanan işlem |
| --- | --- | --- |
| Chromium 145.0.7632.6 | 1366 × 768 | Ağ kapalı ve dosya doğrudan açıkken sabit 35 TL görevi, fareyle sürükleme, klavye, tam ödeme, eve dönüş ve ödül |
| Chromium | 1920 × 1080 | Tahta boyutunda dokunmatik sürükleme, sepete ve kasaya taşıma, banknotlara dokunma, kombinasyon ve poşetleme |
| Chromium | 390 × 844 | Telefon, büyük metin ve görseller, para üstü oluşturma |
| Chromium | 820 × 1180 | Tablet, kasiyerin para üstü önerisini kontrol etme |
| Firefox 146.0.1 | 1366 × 768 | Sabit 35 TL görevi, 50 TL ile ödeme, 15 TL para üstü, teslim ve ödül |
| WebKit 26.0 | 1366 × 768 | Sabit 35 TL görevi, teslim ve ödül |
| WebKit | 375 × 812 | Dokunmatik telefon görünümü, tam tutarı seçme, teslim ve ödül |

Bu yedi oynanışta öğretmen ayarları ekrandan kaydedildi ve sayfa yenilendikten sonra kullanıldı. Testler ürün ve para seçimini gerçek arayüz kontrollerinden yaptı. Durum okuma işlevi yalnızca ekrandaki sonucun doğruluğunu karşılaştırmak için kullanıldı. Çıkartma kazanımı, yeni görev, duraklatma, ana menüye dönüş, öğretmen özeti ve sonuç dosyasının indirilmesi de denetlendi. Tarayıcı hata kayıtları, başarısız ağ istekleri ve harici kaynak istekleri denetlendi.

## Erişilebilirlik, ses ve gömme

- 320 px genişlikte öğretmen paneli ve market, 740 × 360 yatay görünüm, tam ekran geçişi ve temel klavye işlemleri.
- Azaltılmış hareket, yalnız dokunma, sade görünüm, üç basamaklı ipucu ve sessiz tam oynanış.
- Web Audio'nun ses üretmeye başlaması, duraklatma ve sekme görünürlüğü olaylarında sesin durması ve geri dönmesi.
- Türkçe ses bulunmayan ortam ve yazıyla zamanlanan ağız hareketi. Konuşma başlangıç, bitiş, gecikmiş bitiş ve hata olayları kontrollü bir konuşma sentezi ile ayrıca sınandı.
- Tarayıcı depolamaya izin vermediğinde ayarların açık sayfada uygulanması ve oyunun devam etmesi.
- Üç tarayıcı motorunda doğrudan yerel HTML açılışı ve farklı kökenden gelen bir iframe'in yükseklik mesajıyla boyutlanması.

Her çalıştırmanın ekran görüntüleri ve yedi oynanışın tutarları **output/playwright** altında oluşur. Rastgele görevlerde tutarlar koşular arasında değişebilir. Tekrar çalıştırma komutları [kullanım rehberindedir](README.md).

## Cihazda doğrulanacak noktalar

Tahta, telefon ve tablet senaryoları tarayıcı emülasyonuyla çalıştırıldı. Hedef okulun fiziksel akıllı tahtasındaki dokunmatik sürücü, gerçek iPhone/iPad üzerindeki Safari ve cihazın kurulu Türkçe sesinin işitilebilirliği sınıfta kontrol edilmelidir. Squarespace kabulü için ayrıca gerçek barındırma adresi, çerçeve izinleri ve sitenin ziyaretçi görünümü gerekir.
