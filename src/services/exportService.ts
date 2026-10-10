import { ReportItem, CleaningStats } from '../types';

export function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToJson(items: ReportItem[], stats: CleaningStats, desktopPath: string) {
  const data = {
    baslik: 'Cleanfy - Masaüstü Temizlik Raporu',
    tarih: new Date().toLocaleString('tr-TR'),
    masaustuKonumu: desktopPath,
    ozet: {
      toplamTaranan: stats.totalScanned,
      basariylaTasinan: stats.moved,
      atlanan: stats.skipped,
      hatali: stats.failed,
      olusturulanKlasorler: stats.createdFolders,
      guvenlikNotu: 'Hiçbir dosya silinmemiştir. Dosya içerikleri korunmuştur.',
    },
    dosyalar: items,
  };
  const jsonString = JSON.stringify(data, null, 2);
  downloadFile(jsonString, `Cleanfy_Temizlik_Raporu_${Date.now()}.json`, 'application/json');
}

export function exportToCsv(items: ReportItem[]) {
  // UTF-8 BOM ekliyoruz ki Excel Türkçe karakterleri (ş, ğ, ç, ı, ö, ü) düzgün göstersin
  let csv = '\uFEFF';
  csv += 'Dosya Adı;Uzantı;Boyut;Eski Konum;Yeni Konum;Kategori;İşlem Durumu;Zaman;Hata / Açıklama\r\n';

  for (const item of items) {
    const row = [
      `"${item.fileName.replace(/"/g, '""')}"`,
      `"${item.extension}"`,
      `"${item.sizeFormatted}"`,
      `"${item.oldPath.replace(/"/g, '""')}"`,
      `"${item.newPath.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.status}"`,
      `"${item.timestamp}"`,
      `"${(item.errorExplanation || '').replace(/"/g, '""')}"`,
    ];
    csv += row.join(';') + '\r\n';
  }

  downloadFile(csv, `Cleanfy_Temizlik_Raporu_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
}

export function exportToHtml(items: ReportItem[], stats: CleaningStats, desktopPath: string) {
  const rows = items.map(item => `
    <tr>
      <td class="name"><strong>${escapeHtml(item.fileName)}</strong></td>
      <td><span class="badge badge-ext">${escapeHtml(item.extension.toUpperCase() || 'YOK')}</span></td>
      <td>${escapeHtml(item.sizeFormatted)}</td>
      <td class="path">${escapeHtml(item.oldPath)}</td>
      <td class="path">${escapeHtml(item.newPath)}</td>
      <td><span class="badge badge-cat">${escapeHtml(item.category)}</span></td>
      <td><span class="badge badge-status ${item.status === 'Başarılı' ? 'status-ok' : item.status === 'Atlandı' ? 'status-skip' : 'status-err'}">${escapeHtml(item.status)}</span></td>
      <td class="date">${escapeHtml(new Date(item.timestamp).toLocaleString('tr-TR'))}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Cleanfy - Masaüstü Temizlik Raporu</title>
  <style>
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #f1f5f9;
      margin: 0;
      padding: 30px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    .header {
      background: #1e293b;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #334155;
      margin-bottom: 24px;
    }
    h1 {
      margin: 0 0 10px 0;
      color: #38bdf8;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .meta {
      color: #94a3b8;
      font-size: 14px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #1e293b;
      padding: 18px;
      border-radius: 10px;
      border: 1px solid #334155;
    }
    .stat-val {
      font-size: 28px;
      font-weight: bold;
      color: #38bdf8;
    }
    .stat-lbl {
      color: #94a3b8;
      font-size: 13px;
      margin-top: 4px;
    }
    .badge-secure {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid rgba(16, 185, 129, 0.4);
      margin-bottom: 24px;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #334155;
      font-size: 13px;
    }
    th {
      background: #0f172a;
      padding: 14px 12px;
      text-align: left;
      color: #cbd5e1;
      border-bottom: 2px solid #334155;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #334155;
    }
    tr:hover {
      background: rgba(51, 65, 85, 0.4);
    }
    .name { color: #f8fafc; }
    .path { font-family: monospace; font-size: 11px; color: #94a3b8; word-break: break-all; }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-ext { background: #334155; color: #38bdf8; }
    .badge-cat { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
    .badge-status { font-weight: bold; }
    .status-ok { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .status-skip { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .status-err { background: rgba(239, 68, 68, 0.2); color: #f87171; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Cleanfy - Masaüstü Temizlik Raporu</h1>
      <div class="meta">
        <div><strong>Masaüstü Dizini:</strong> ${escapeHtml(desktopPath)}</div>
        <div><strong>Rapor Tarihi:</strong> ${new Date().toLocaleString('tr-TR')}</div>
      </div>
    </div>

    <div class="badge-secure">
      🛡️ <strong>Güvenlik Garantisi:</strong> Hiçbir dosya silinmemiştir. Hiçbir dosyanın içeriği veya uzantısı değiştirilmemiştir. Dosyalar sadece masaüstü içindeki Türkçe kategorilere düzenlenmiştir.
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val">${stats.totalScanned}</div>
        <div class="stat-lbl">Taranan Dosya</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #34d399;">${stats.moved}</div>
        <div class="stat-lbl">Başarıyla Taşınan</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #fbbf24;">${stats.skipped}</div>
        <div class="stat-lbl">Atlanan Dosya</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #f87171;">${stats.failed}</div>
        <div class="stat-lbl">Hatalı İşlem</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${stats.createdFolders.length}</div>
        <div class="stat-lbl">Oluşturulan Klasör</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Dosya Adı</th>
          <th>Uzantı</th>
          <th>Boyut</th>
          <th>Eski Konum</th>
          <th>Yeni Konum</th>
          <th>Kategori</th>
          <th>Durum</th>
          <th>Zaman</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  downloadFile(html, `Cleanfy_Temizlik_Raporu_${Date.now()}.html`, 'text/html;charset=utf-8;');
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
