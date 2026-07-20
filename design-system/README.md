# SOC Tracker UI Kit

SOC Tracker'daki koyu, Linear.app esintili arayüzün taşınabilir hâli. Bu
klasördeki dosyaları herhangi bir yeni veya mevcut projeye kopyalayıp aynı
görünümü elde edebilirsiniz — teknoloji yığınından bağımsız.

## İçerik

| Dosya | Ne işe yarar |
|---|---|
| `soc-ui.css` | Tüm tasarım sistemi — renk/köşe/font token'ları (`:root` değişkenleri) + reset + component class'ları (buton, form, tablo, rozet, modal, KPI kartı, sidebar/nav vb.) |
| `soc-ui.js` | Framework'ten bağımsız, saf DOM tabanlı davranış yardımcıları: sekme geçişi, modal aç/kapat, sürüklenebilir tablo kolonları, panoya kopyala, sidebar-taşmasına takılmayan açılır kutu konumlama |
| `style-guide.html` | Hiçbir backend'e ihtiyaç duymayan, tarayıcıda doğrudan açılabilen canlı bileşen kataloğu — hem dokümantasyon hem kopyala-yapıştır kaynağı |

`style-guide.html`'i doğrudan çift tıklayıp tarayıcıda açabilirsiniz (build
adımı yok, dış bağımlılık yok — tek font ihtiyacı Inter, o da sistemde
yoksa `system-ui`'a düşer).

## Nasıl uygulanır

### A) Yeni bir proje

1. `soc-ui.css` ve `soc-ui.js`'i projenize kopyalayın (örn. `static/`
   veya `public/` altına).
2. Sayfanıza ekleyin:
   ```html
   <link rel="stylesheet" href="soc-ui.css"/>
   <script src="soc-ui.js"></script>
   ```
3. `style-guide.html`'i açıp ihtiyacınız olan bileşenin HTML'ini kopyalayın
   — class isimleri birebir aynı kalınca görünüm de birebir aynı olur.
4. Sayfa iskeletiniz `.app > .sidebar + .main-content > .page-content`
   deseniyle kurulursa (bkz. `style-guide.html`), sidebar/nav/sekme
   davranışı `initTabNav()` ile otomatik gelir.

### B) Mevcut bir projeyi buna geçirmek

Sıfırdan yazmak yerine **kademeli** ilerleyin — aksi halde tek seferde çok
şey kırılır:

1. Önce sadece **token'ları** (renk/köşe/font `:root` değişkenleri) alıp
   mevcut CSS'inizin üstüne ekleyin. Bu tek başına hiçbir şeyi bozmaz
   (henüz kimse bu değişkenleri kullanmıyor).
2. Yeni yazdığınız her ekran/bileşen için soc-ui class'larını kullanın
   (`.btn`, `.form-input`, `.table`, `.badge` vb.) — eskisiyle yeni birlikte
   yaşayabilir.
3. Mevcut ekranları tek tek, düşük riskli olandan başlayarak class
   isimlerini değiştirerek geçirin. Her ekrandan sonra görsel olarak
   kontrol edin (bu projede yaptığımız gibi: değişiklik → tarayıcıda
   ekran görüntüsü → onay).
4. En son, artık kullanılmayan eski CSS kurallarını silin.

### C) Farklı bir framework kullanıyorsanız (React/Vue vb.)

`soc-ui.css` doğrudan çalışır — class isimlerini component'lerinizin
`className`/`class` özelliğine verin, aynı görünümü alırsınız
(`<button className="btn btn-primary">Kaydet</button>` gibi).

`soc-ui.js`'teki fonksiyonları birebir kopyalamayın — framework'ünüzün
kendi state yönetimiyle **aynı mantığı** yeniden kurun:
- `initTabNav` → aktif sekmeyi component state'inde tutan bir sekme
  component'i.
- `openModal`/`closeModal` → `isOpen` state'i olan bir `<Modal>`
  component'i (görünüm yine `.modal-overlay`/`.modal` class'ları).
- `makeColumnsResizable` → bir `useResizableColumns` hook'u; mantık
  (mousedown/mousemove/mouseup, min/max genişlik clamp) aynı kalır.
- `copyFromAttr` → `navigator.clipboard.writeText` + kısa süreli state
  ("Kopyalandı" gösterip 1.5sn sonra eski hâline dönen).

## Token'ları markanıza göre değiştirmek

`soc-ui.css`'in en üstündeki `:root` bloğu tek değişim noktası. Örneğin
accent rengini değiştirmek isterseniz sadece şunu güncelleyin:
```css
--accent:       #5E6AD2;   /* ana vurgu rengi */
--accent-hover: #6B77DC;   /* hover hâli */
--accent-subtle:rgba(94,106,210,0.12);  /* rozet/tag arka planı */
```
Geri kalan her component bu değişkenlere referans verdiği için tek yerden
tüm uygulamanın vurgu rengi değişir.

## CORE vs DOMAIN bölümleri

`soc-ui.css` içinde iki tür blok var:
- **CORE** — herhangi bir iç-araç/dashboard projesinde işinize yarayacak
  genel class'lar (buton, form, tablo, modal, KPI kartı, iş listesi paneli,
  trend kartı, rozet vb.).
- **DOMAIN** — SOC Tracker'a özgü örnekler (MITRE/IOC etiketleri, audit
  rozetleri, onay-seviyesi/tier rozetleri, sıklık rozetleri). Bunlar yeni
  bir projede muhtemelen işinize yaramaz — silin veya kendi domain
  kavramlarınıza göre yeniden adlandırıp `.badge-*` setinden türetin.

## Not: Bu tema koyu-mod'a özel

Şu an açık/koyu tema geçişi (light mode) desteklenmiyor — sadece tek,
sabit koyu tema var. Açık tema isterseniz `:root` değişkenlerinin bir
`[data-theme="light"]` override seti eklemeniz gerekir; bu SOC Tracker'da
henüz yapılmadı.
