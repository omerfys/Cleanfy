import { describe, it, expect } from 'vitest';
// @ts-ignore
const { categorizeFile, CATEGORIES, SUBCATEGORIES } = require('../../electron/categorization.cjs');

describe('Türkçe Akıllı Kategorilendirme Motoru Testleri', () => {
  it('Görselleri doğru Türkçe kategoriye ayırmalı', () => {
    const jpg = categorizeFile('tatil_fotografi.jpg');
    expect(jpg.category).toBe(CATEGORIES.PHOTOS);
    expect(jpg.targetRelativePath).toBe('Fotoğraflar ve Görseller');

    const png = categorizeFile('ekran_goruntusu.PNG');
    expect(png.category).toBe(CATEGORIES.PHOTOS);

    const webp = categorizeFile('banner.webp');
    expect(webp.category).toBe(CATEGORIES.PHOTOS);
  });

  it('Videoları doğru Türkçe kategoriye ayırmalı', () => {
    const mp4 = categorizeFile('ders_kaydi.mp4');
    expect(mp4.category).toBe(CATEGORIES.VIDEOS);
    expect(mp4.targetRelativePath).toBe('Videolar');

    const mkv = categorizeFile('film.mkv');
    expect(mkv.category).toBe(CATEGORIES.VIDEOS);
  });

  it('Müzik ve sesleri doğru kategoriye ayırmalı', () => {
    const mp3 = categorizeFile('sarki.mp3');
    expect(mp3.category).toBe(CATEGORIES.MUSIC);
    expect(mp3.targetRelativePath).toBe('Müzikler ve Sesler');

    const flac = categorizeFile('album.flac');
    expect(flac.category).toBe(CATEGORIES.MUSIC);
  });

  it('Belgeleri doğru alt kategorilerle ayırmalı', () => {
    const pdf = categorizeFile('fatura_ocak.pdf');
    expect(pdf.category).toBe(CATEGORIES.DOCUMENTS);
    expect(pdf.subcategory).toBe(SUBCATEGORIES.DOC_PDF);
    expect(pdf.targetRelativePath).toBe('Belgeler\\PDF Belgeleri');

    const docx = categorizeFile('sozlesme.docx');
    expect(docx.category).toBe(CATEGORIES.DOCUMENTS);
    expect(docx.subcategory).toBe(SUBCATEGORIES.DOC_WORD);
    expect(docx.targetRelativePath).toBe('Belgeler\\Word Belgeleri');

    const xlsx = categorizeFile('butce_2026.xlsx');
    expect(xlsx.category).toBe(CATEGORIES.DOCUMENTS);
    expect(xlsx.subcategory).toBe(SUBCATEGORIES.DOC_SHEETS);
    expect(xlsx.targetRelativePath).toBe('Belgeler\\Tablolar ve Hesaplamalar');

    const txt = categorizeFile('notlar.txt');
    expect(txt.category).toBe(CATEGORIES.DOCUMENTS);
    expect(txt.subcategory).toBe(SUBCATEGORIES.DOC_TEXT);
    expect(txt.targetRelativePath).toBe('Belgeler\\Metin Dosyaları');
  });

  it('Yazılım ve kod projelerini doğru alt kategorilerle ayırmalı', () => {
    const py = categorizeFile('veri_analizi.py');
    expect(py.category).toBe(CATEGORIES.CODE);
    expect(py.subcategory).toBe(SUBCATEGORIES.CODE_PYTHON);
    expect(py.targetRelativePath).toBe('Yazılım ve Kod Projeleri\\Python Projeleri');

    const ts = categorizeFile('app.tsx');
    expect(ts.category).toBe(CATEGORIES.CODE);
    expect(ts.subcategory).toBe(SUBCATEGORIES.CODE_WEB);
    expect(ts.targetRelativePath).toBe('Yazılım ve Kod Projeleri\\Web Projeleri');

    const java = categorizeFile('Sunucu.java');
    expect(java.category).toBe(CATEGORIES.CODE);
    expect(java.subcategory).toBe(SUBCATEGORIES.CODE_JAVA);
    expect(java.targetRelativePath).toBe('Yazılım ve Kod Projeleri\\Java Projeleri');

    const cpp = categorizeFile('main.cpp');
    expect(cpp.category).toBe(CATEGORIES.CODE);
    expect(cpp.subcategory).toBe(SUBCATEGORIES.CODE_OTHER);
  });

  it('Kurulum ve arşiv dosyalarını doğru kategorilere ayırmalı', () => {
    const exe = categorizeFile('setup_v2.exe');
    expect(exe.category).toBe(CATEGORIES.SOFTWARE);

    const zip = categorizeFile('arsiv.zip');
    expect(zip.category).toBe(CATEGORIES.ARCHIVES);

    const rar = categorizeFile('yedek.7z');
    expect(rar.category).toBe(CATEGORIES.ARCHIVES);
  });

  it('Oyun kısayolları için sezgisel tespiti doğru yapmalı', () => {
    const steamGame = categorizeFile('Steam - Witcher 3.lnk');
    expect(steamGame.category).toBe(CATEGORIES.GAMES);

    const valorant = categorizeFile('Riot Games - Valorant.lnk');
    expect(valorant.category).toBe(CATEGORIES.GAMES);

    const normalApp = categorizeFile('Visual Studio Code.lnk');
    expect(normalApp.category).toBe(CATEGORIES.SOFTWARE);
  });

  it('Bilinmeyen veya uzantısız dosyaları güvenle inceleme/diğer klasörüne yönlendirmeli', () => {
    const noExt = categorizeFile('BilinmeyenDosya');
    expect(noExt.category).toBe(CATEGORIES.TEMP);

    const weirdExt = categorizeFile('veri.xyz123');
    expect(weirdExt.category).toBe(CATEGORIES.OTHER);
  });
});
