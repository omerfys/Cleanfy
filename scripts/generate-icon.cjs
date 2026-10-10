const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
    webPreferences: {
      offscreen: true,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0; background:transparent;">
  <canvas id="c"></canvas>
  <script>
    function drawRobot(size) {
      const canvas = document.getElementById('c');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, size, size);

      // Antialiasing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const scale = size / 256;
      ctx.save();
      ctx.scale(scale, scale);

      const cx = 128;
      const cy = 128;
      const R = 84; // Robot ana gövde yarıçapı
      const ra = -Math.PI / 2; // Yukarı bakan ikon duruşu

      ctx.translate(cx, cy);

      // 1. Yumuşak Zemin Gölgesi
      ctx.save();
      const shadowGrad = ctx.createRadialGradient(4, 12, R * 0.4, 4, 12, R + 24);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.40)');
      shadowGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.18)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.arc(4, 12, R + 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Robotu yönüne döndür
      ctx.rotate(ra);

      // 2. Alt Gövde / Şasi (Koyu antrasit şasi)
      ctx.fillStyle = '#2d3748';
      ctx.beginPath();
      ctx.arc(0, 0, R + 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Yan Tekerlekler (Siyah kauçuk lastikler ve tırtıklar)
      ctx.save();
      ctx.fillStyle = '#0f172a';
      // Sol tekerlek
      ctx.beginPath();
      ctx.roundRect(-20, -(R + 5), 40, 16, 4);
      ctx.fill();
      // Sağ tekerlek
      ctx.beginPath();
      ctx.roundRect(-20, R - 11, 40, 16, 4);
      ctx.fill();
      // Lastik tırtıkları
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.4;
      for (let i = -16; i <= 16; i += 4) {
        ctx.beginPath();
        ctx.moveTo(i, -(R + 5));
        ctx.lineTo(i, -(R - 11));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(i, R - 11);
        ctx.lineTo(i, R + 5);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Ön Pivot Tekerlek (Caster wheel)
      ctx.save();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(R - 14, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(R - 14, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 5. İki Adet Ön Yan Temizleme Fırçası (Dönen silikon kollar & fırça kılları)
      const drawBrush = (bx, by, rot) => {
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(rot);
        for (let a = 0; a < 3; a++) {
          ctx.save();
          ctx.rotate((a * Math.PI * 2) / 3);
          // Silikon kol
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(10, 6, 24, 3);
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3.6;
          ctx.lineCap = 'round';
          ctx.stroke();
          // Kıl demetleri
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.6;
          for (let b = -3; b <= 3; b++) {
            ctx.beginPath();
            ctx.moveTo(24, 3);
            ctx.lineTo(34, 3 + b * 3.2);
            ctx.stroke();
          }
          ctx.restore();
        }
        // Fırça göbeği
        const hg = ctx.createRadialGradient(0, 0, 1, 0, 0, 7);
        hg.addColorStop(0, '#ffffff');
        hg.addColorStop(0.7, '#e2e8f0');
        hg.addColorStop(1, '#64748b');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawBrush(R - 10, -48, 0.5);
      drawBrush(R - 10, 48, -0.5);

      // 6. Ana Beyaz Gövde (Robot üst kapağı, pürüzsüz degrade)
      const bodyGrad = ctx.createRadialGradient(-26, -26, 10, 0, 0, R);
      bodyGrad.addColorStop(0, '#ffffff');
      bodyGrad.addColorStop(0.25, '#fafafa');
      bodyGrad.addColorStop(0.65, '#f1f5f9');
      bodyGrad.addColorStop(0.88, '#e2e8f0');
      bodyGrad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fill();

      // Gövde dış gümüş çerçeve çizgisi
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, R - 1, 0, Math.PI * 2);
      ctx.stroke();

      // Üst parlak ışık yansıması (Glossy / Specular Highlight)
      ctx.save();
      const specGrad = ctx.createRadialGradient(-36, -38, 6, -22, -26, 60);
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.90)');
      specGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.30)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = specGrad;
      ctx.beginPath();
      ctx.arc(0, 0, R - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 7. Ön Tampon (Bumper & Kızılötesi Sensör Şeridi)
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, R - 1, -1.25, 1.25);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      // İç tampon derzi
      ctx.beginPath();
      ctx.arc(0, 0, R - 5.5, -1.2, 1.2);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 8. Toz Haznesi Arka Kapak Derzi
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, R - 14, 0.55, Math.PI * 2 - 0.55);
      ctx.stroke();
      ctx.restore();

      // 9. Düğme Paneli (Ön Bölümde - Geniş & Dokunmatik Butonlar)
      ctx.save();
      const panelX = 38;
      const panelY = 0;
      ctx.beginPath();
      ctx.roundRect(panelX - 10, -22, 28, 44, 9);
      const panelG = ctx.createLinearGradient(panelX - 10, -22, panelX + 18, 22);
      panelG.addColorStop(0, '#ffffff');
      panelG.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = panelG;
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Ortadaki Güç Butonu (Canlı Cyan Neon Halka & Güç Simgesi)
      const pwX = panelX + 4;
      const pwY = 0;
      // Cyan Glow
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(pwX, pwY, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // İç cyan buton
      ctx.fillStyle = '#0891b2';
      ctx.beginPath();
      ctx.arc(pwX, pwY, 6.8, 0, Math.PI * 2);
      ctx.fill();

      // Beyaz güç simgesi
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(pwX, pwY, 3.8, -2.4, 2.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pwX, pwY - 4.6);
      ctx.lineTo(pwX, pwY - 1.0);
      ctx.stroke();

      // Spot ve Home Düğmeleri
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(pwX, -13, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pwX, 13, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 10. LiDAR Lazer Kulesi (Merkezi İkonik Kubbe - Hafif Arkada (x=-10), Tam Daire)
      ctx.save();
      const lx = -12;
      const ly = 0;

      // Kule dış gölgesi
      ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
      ctx.beginPath();
      ctx.arc(lx + 2, ly + 4, 26, 0, Math.PI * 2);
      ctx.fill();

      // Kule alt gövdesi (hafif yükseltilmiş beyaz silindir)
      const tGrad = ctx.createRadialGradient(lx - 6, ly - 6, 2, lx, ly, 25);
      tGrad.addColorStop(0, '#ffffff');
      tGrad.addColorStop(0.4, '#f8fafc');
      tGrad.addColorStop(0.8, '#e2e8f0');
      tGrad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = tGrad;
      ctx.beginPath();
      ctx.arc(lx, ly, 25, 0, Math.PI * 2);
      ctx.fill();

      // Krom Metalik Çerçeve Halkası
      const bezelG = ctx.createLinearGradient(lx - 25, ly - 25, lx + 25, ly + 25);
      bezelG.addColorStop(0, '#ffffff');
      bezelG.addColorStop(0.28, '#cbd5e1');
      bezelG.addColorStop(0.72, '#64748b');
      bezelG.addColorStop(1, '#cbd5e1');
      ctx.strokeStyle = bezelG;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(lx, ly, 25, 0, Math.PI * 2);
      ctx.stroke();

      // 360° LiDAR Sensör Camı (Koyu cam bant)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(lx, ly, 19, 0, Math.PI * 2);
      ctx.fill();

      // Kule Üst Metal/Beyaz Kapağı
      const capG = ctx.createRadialGradient(lx - 2, ly - 2, 1, lx, ly, 15);
      capG.addColorStop(0, '#ffffff');
      capG.addColorStop(0.5, '#f1f5f9');
      capG.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = capG;
      ctx.beginPath();
      ctx.arc(lx, ly, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(lx, ly, 15, 0, Math.PI * 2);
      ctx.stroke();

      // Merkez Cyan Lazer İndikatörü (Glow)
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(lx, ly, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore(); // Ana transformu kapat

      return canvas.toDataURL('image/png');
    }
  </script>
</body>
</html>
  `;

  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

  const sizes = [256, 128, 64, 48, 32, 16];
  const pngBuffers = [];

  for (const s of sizes) {
    const dataUrl = await win.webContents.executeJavaScript(`drawRobot(${s})`);
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    const buf = Buffer.from(base64, 'base64');
    pngBuffers.push({ width: s, height: s, buffer: buf });
  }

  // Çıktı klasörlerini hazırla
  const buildDir = path.join(__dirname, '../build');
  const publicDir = path.join(__dirname, '../public');
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  // 1. 256x256 PNG olarak kaydet
  const png256 = pngBuffers[0].buffer;
  fs.writeFileSync(path.join(buildDir, 'icon.png'), png256);
  fs.writeFileSync(path.join(publicDir, 'icon.png'), png256);

  // 2. Çoklu çözünürlüklü Windows ICO Dosyası Üret (256, 128, 64, 48, 32, 16)
  const count = pngBuffers.length;
  const headerSize = 6;
  const entrySize = 16;
  const dirSize = headerSize + count * entrySize;

  let totalSize = dirSize;
  for (const item of pngBuffers) {
    totalSize += item.buffer.length;
  }

  const icoBuf = Buffer.alloc(totalSize);

  // ICO Başlığı
  icoBuf.writeUInt16LE(0, 0); // Reserved
  icoBuf.writeUInt16LE(1, 2); // 1 = ICO
  icoBuf.writeUInt16LE(count, 4); // Resim sayısı

  let currentOffset = dirSize;
  for (let i = 0; i < count; i++) {
    const item = pngBuffers[i];
    const entryOffset = headerSize + i * entrySize;

    icoBuf.writeUInt8(item.width >= 256 ? 0 : item.width, entryOffset + 0);
    icoBuf.writeUInt8(item.height >= 256 ? 0 : item.height, entryOffset + 1);
    icoBuf.writeUInt8(0, entryOffset + 2); // Renk paleti
    icoBuf.writeUInt8(0, entryOffset + 3); // Reserved
    icoBuf.writeUInt16LE(1, entryOffset + 4); // Renk düzlemleri
    icoBuf.writeUInt16LE(32, entryOffset + 6); // Bit derinliği (32-bit RGBA)
    icoBuf.writeUInt32LE(item.buffer.length, entryOffset + 8); // PNG boyutu
    icoBuf.writeUInt32LE(currentOffset, entryOffset + 12); // Dosya içi ofset

    item.buffer.copy(icoBuf, currentOffset);
    currentOffset += item.buffer.length;
  }

  fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuf);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);

  console.log('Cleanfy Robot Süpürge uygulama ikonları başarıyla üretildi:');
  console.log('- build/icon.png (256x256)');
  console.log('- build/icon.ico (256, 128, 64, 48, 32, 16)');
  console.log('- public/icon.png');
  console.log('- public/favicon.ico');

  app.quit();
});
