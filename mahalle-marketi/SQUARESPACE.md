# Squarespace sayfasına Mahalle Marketi ekleme

Önce **dist/index.html** dosyasını kendi bilgisayarınızda açıp bir alışveriş oynayın. ZIP paketinde aynı dosya **OYNA.html** adıyla yer alır. Sunucuya yüklerken adını **index.html** olarak kullanın. Web sitesinde kullanmak için oyuna ait bir HTTPS adresi gerekir.

## 1. Oyunu barındırın

Yayın kararı verdiğinizde, seçtiğiniz statik HTTPS barındırıcısında bir klasör oluşturup **dist/index.html** dosyasını o klasöre yükleyin. Sunucunun dosyayı `text/html; charset=utf-8` ile sunduğunu ve oyun adresinin ayrı bir sekmede açıldığını kontrol edin. Aşağıdaki örnekteki `https://oyun.example/mahalle-marketi/` adresinin geçtiği iki yeri kendi oyun adresinizle değiştirin.

Barındırıcınız siteler arası gömmeyi kısıtlıyorsa, oyun yanıtının `Content-Security-Policy` başlığındaki `frame-ancestors` kuralına gerçek Squarespace sayfanızın kökenini ekleyin. Örneğin özel alan adları `https://www.telimenegitim.com` ve `https://telimenegitim.com` olabilir. Kullanacağınız önizleme alan adını da gerekiyorsa ekleyin. Başka kökenden gömmeyi engelleyen bir `X-Frame-Options` başlığı varsa oyun dosyasına özgü ayarı barındırıcıda düzenleyin.

## 2. Squarespace düzenleyicisinde kod bloğu ekleyin

Oyun sayfasını düzenleyin. İstenen bölümde **Add Block → Code** seçin. Bloğun türünü **HTML** yapın ve **Display Source** seçeneğini kapalı tutun. Squarespace, iframe ve JavaScript desteğini güncel Core, Plus ve Advanced planlarında, ayrıca bazı eski planlarda sunar. [Squarespace kod bloğu kılavuzu](https://support.squarespace.com/hc/en-us/articles/206543167-Add-custom-code-to-a-page-with-code-blocks) · [Planlara göre özellikler](https://support.squarespace.com/hc/en-us/articles/115015517328-Premium-features)

## 3. Oyun çerçevesini ekleyin

Aşağıdaki bloğu yapıştırın. Çerçeve, oyun sahnesi ve telefon yönü değiştiğinde kendi yüksekliğini ayarlar. Boyut mesajında yalnızca oyun alanının yüksekliği bulunur.

```html
<iframe
  id="mahalle-marketi-oyunu"
  src="https://oyun.example/mahalle-marketi/"
  title="Mahalle Marketi – Paramı Sayıyorum!"
  allow="fullscreen; autoplay"
  allowfullscreen
  referrerpolicy="strict-origin-when-cross-origin"
  style="display:block;width:100%;max-width:100%;height:740px;border:0;background:#173e35">
</iframe>
<p>
  <a href="https://oyun.example/mahalle-marketi/" target="_blank" rel="noopener">
    Oyunu ayrı sekmede aç
  </a>
</p>
<script>
(() => {
  const frame = document.getElementById("mahalle-marketi-oyunu");
  const gameOrigin = new URL(frame.src).origin;
  window.addEventListener("message", event => {
    const data = event.data;
    if (event.origin !== gameOrigin || event.source !== frame.contentWindow) return;
    if (data?.type !== "mahalle-marketi-height" || !Number.isFinite(data.height)) return;
    frame.style.height = Math.max(320, Math.min(4096, Math.ceil(data.height))) + "px";
  });
  const measure = () => frame.contentWindow.postMessage({type:"mahalle-marketi-measure"}, gameOrigin);
  frame.addEventListener("load", measure);
  measure();
})();
</script>
```

## 4. Sayfada deneyin

Önizlemede önce **Oyuna Başla** ile sesi etkinleştirin. Telefondan bir ürüne ve sepete dokunun. Tahtada **Tam Ekran** düğmesini ve poşetlemeyi deneyin. Büyük yazıyla beş ürünlük bir liste açarak sayfa yüksekliğini kontrol edin. Editörde gömülü kod devre dışı görünüyorsa ziyaretçi önizlemesini kullanın. Tam ekran izni vermeyen cihazlarda çerçevenin altındaki ayrı sekme bağlantısı kullanılabilir.

Öğretmen ayarları tarayıcıya aittir. Gömülü sayfa ve ayrı sekme, tarayıcının depolama tercihleri nedeniyle farklı ayarlarla açılabilir. Bir güncellemede aynı HTTPS adresindeki oyun dosyasını yeni derlemeyle değiştirmek yeterlidir.
