# Mahalle Marketi – Paramı Sayıyorum!

Telimen Eğitim için Türkçe, tek oyunculu bir alışveriş macerası. Çocuk evde alışveriş listesini ve parasını alır, markete yürür, ürünleri bulur, kasadan geçirir, ödeme yapar ve poşetini eve getirir.

## Hemen oyna

ZIP paketini çıkartıp **OYNA.html** dosyasını tarayıcıda açın. Proje klasöründe aynı oyun **dist/index.html** yolundadır. Akıllı tahtaya veya USB belleğe bu tek dosyayı kopyalayabilirsiniz. Görseller, yazı tipi, oyun kodu ve müzikler dosyanın içindedir. Kurulum veya internet bağlantısı gerekmez.

**Oyuna Başla** ilk alışverişi açar. Menüde çocuğun portresine dokunarak iki görünümden birini seçebilirsiniz. Sağ üstteki hoparlör bütün sesleri açıp kapatır. **Tam Ekran** oyun alanını büyütür.

## Sınıfta kullanım

- **İlk Alışverişim** seviyesinde anne 1–2 çeşit ürün ister ve tam para verir. Liste markette açık kalır.
- **Alışveriş Ustası** seviyesinde 2–4 çeşit ürün ve fazladan para bulunur. Öğrenci toplamı veren herhangi bir banknot kombinasyonunu kullanabilir.
- **Para Üstü Ustası** seviyesinde 3–5 çeşit ürün istenir. Öğrenci fazla ödeme yapar ve para üstünü oluşturur. Öğretmen, kasiyerin sunduğu parayı kontrol etme çalışmasını da seçebilir.

Bir ürüne, sonra sepete dokunun. Kasada ve poşetlemede de aynı iki dokunuş kullanılır. Ürünü doğrudan hedefe sürüklemek de mümkündür. Sepetteki eksi işareti ürünü rafa bırakır. Ödemeyi onaylamadan önce sağdaki seçili paraya dokunmak onu geri alır. Aynı kupürden çok sayıda olduğunda **×** adedi gösterir. Her dokunuş bir fiziksel parayı taşır.

Tab ve Shift+Tab düğmeler arasında ilerler. Enter veya Boşluk seçim yapar. **F** tam ekranı, **Esc** duraklatma menüsünü veya açık pencerenin kapanmasını sağlar. Yürüyüşleri geçmek mümkündür. Görevlerde süre sınırı yoktur.

## Öğretmen ayarları

| Bölüm | Değiştirilebilenler |
| --- | --- |
| Görev | Seviye, ürün çeşidi sayısı, toplamın alt ve üst sınırı, aynı üründen iki adet ve görev sırası |
| Ürünler | 18 ürünün seçimi ve tam lira cinsinden öğretim fiyatları |
| Para | Tam ödeme, kombinasyon, iki para üstü etkinliği, altı banknot ile 1 ve 5 TL madeni paralar |
| Destek | Büyük metin ve ürünler, sade görünüm, dokunma, görünür liste, azaltılmış hareket, ipucu düzeyi, deneme sayısı, toplama ve para üstü desteği, ses |
| Sonuçlar | Son alışverişin özeti ve bu sekmedeki son 30 tamamlanmış görevin metin olarak indirilmesi |

“Ürün çeşidi” farklı ürün sayısıdır. Adet seçeneği açıkken bir çeşitten bir veya iki tane istenebilir. **Adım adım daha çok ürün**, otomatik çeşit sayısını tamamlanan görevlerle seviyenin üst sınırına doğru artırır. Seviye seçimi önerilen görev kurallarını yükler. Ardından diğer alanları özelleştirebilirsiniz.

**35 TL örneğini kurmak için** ilk seviyede 2 ürün çeşidi seçin. Alt ve üst sınırı 35 TL yapın. Ürünler arasında süt (30 TL), ekmek (5 TL) ve yoğurt (20 TL) kalsın. 5, 10, 20 ve 50 TL banknotları açık olsun. Böylece istek süt ve ekmek, çeldirici yoğurt olur. Tam para çalışmasında cüzdanda 20 + 10 + 5 TL bulunur. Para üstü çalışmasında anne 50 TL verir ve öğrenci 15 TL alır.

Kullanılabilir ürün, adet, tutar ve kupürlerle çözülebilen bir görev bulunamazsa ayar ekranı hangi kısıtların değiştirilebileceğini gösterir. İpucu, önce bir hatırlatma sunar, sonraki istekte ilgili nesneyi vurgular ve en yüksek düzeyde hareketi örnekler. Her tamamlanan alışveriş bir çıkartma ve 1–3 yıldız kazandırır. Yıldız hesabında tamamlama ve ipucu kullanımı dikkate alınır.

## Ses ve kayıt

Oyun altı özgün sahne müziğini ve kısa efektleri Web Audio ile üretir. Müzik ilk etkileşimle açılır. Konuşmalar sırasında ses seviyesi azalır. Duraklatıldığında veya sekme arka plana geçtiğinde müzik durur.

Seslendirme cihazdaki Türkçe konuşma sentezini kullanır. Kullanılabilir Türkçe ses bulunmadığında konuşma balonları ve kısa ağız animasyonu akışı sürdürür. Ses kapalı olarak tüm oyun tamamlanabilir.

Ayarlar ve karakter görünümü tarayıcının yerel depolamasında, tamamlanan görev sayısı, sonuçlar ve çıkartmalar aynı sekmenin oturum depolamasında tutulur. Çocuk adı istenmez. Oyun analiz veya öğrenci kaydı gönderen bir servis kullanmaz. Depolama kapalıysa açık sayfada oynamak mümkündür. Yeni bir sekme veya başka bir tarayıcı ayrı bir oturum açabilir.

## Geliştirme

Node.js 22.18 veya sonrasında proje klasöründe çalıştırın. ZIP paketi kullanıyorsanız kaynak proje **kaynak** klasöründedir.

```sh
npm ci
npm run dev
```

Derleme ve matematik kontrolleri için aşağıdaki komutları kullanın.

```sh
npm test
npm run build
```

Tarayıcı testleri derlenmiş dosyayı geçici bir yerel HTTP adresinde, dosya olarak ve bir iframe içinde açar.

```sh
npx playwright install chromium
npm run test:browser
```

Üç tarayıcı motorunu birlikte çalıştırmak için PowerShell'de aşağıdaki komutları kullanın.

```powershell
npx playwright install chromium firefox webkit
$env:GAME_BROWSERS = 'chromium,firefox,webkit'
npm run test:browser
```

Ekran görüntüleri ve son başarılı tarayıcı koşusunun sayısal özeti **output/playwright** klasörüne yazılır.

## Proje yapısı

| Konum | Sorumluluk |
| --- | --- |
| src/catalog.ts, src/settings.ts | Ürünler, kupürler, seviyeler, öğretmen ayarları ve oturum sonuçları |
| src/quest.ts, src/money.ts | Kurallara uygun liste seçimi, sayısal fiyatlar, sınırlı kupürlerle ödeme ve para üstü |
| src/game.ts | Sepet, okutma, ödeme, poşetleme ve izin verilen sahne geçişleri |
| src/world.ts, src/art.ts | Canvas 2D sahneleri, karakter pozları ve animasyonlar |
| src/audio.ts | Sahne müziği, efektler, Türkçe konuşma ve ağız hareketlerinin zamanlaması |
| src/screens.ts, src/dialogs.ts, src/main.ts | Erişilebilir ekranlar, öğretmen paneli ve giriş kontrolleri |
| art, scripts | Özgün resimler, atlaslar, yazı tipi lisansı, yeniden çizim ve derleme betikleri |
| tests | Sayısal kurallar, tarayıcıda gerçek kullanıcı işlemleri ve uçtan uca senaryolar |

Karakter ve nesne atlaslarını yeniden üretmek için isteğe bağlı olarak Python ile Pillow kurup `python scripts/draw_cast.py` çalıştırın. Normal oyun ve web derlemesi için Python gerekmez. Sahne üretim istekleri **art/SAHNELER.md** dosyasındadır.

Squarespace kurulumu için [ayrı entegrasyon rehberini](SQUARESPACE.md), doğrulama kapsamı için [test notlarını](TESTLER.md) açın.
