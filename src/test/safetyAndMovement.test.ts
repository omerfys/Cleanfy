import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// @ts-ignore
const { safelyMoveFile, revertMoveHistory, calculateSha256 } = require('../../electron/desktopService.cjs');

describe('Güvenlik ve Dosya Taşıma Testleri', () => {
  let testDesktopDir: string;

  beforeEach(() => {
    // İzole test masaüstü ortamı oluştur
    testDesktopDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cleanfy_test_desktop_'));
  });

  afterEach(() => {
    // Test dizinini temizle
    if (fs.existsSync(testDesktopDir)) {
      fs.rmSync(testDesktopDir, { recursive: true, force: true });
    }
  });

  it('Dosya taşındığında SHA-256 özeti değişmemeli ve içerik %100 korunmalı', async () => {
    const fileName = 'onemli_belge.txt';
    const filePath = path.join(testDesktopDir, fileName);
    const content = 'Bu belge çok önemlidir ve içeriği asla değiştirilemez. 12345! ŞĞİÖÜ';
    fs.writeFileSync(filePath, content, 'utf-8');

    const originalHash = calculateSha256(filePath);
    expect(originalHash).toBeTruthy();

    const fileItem = {
      id: 'f1',
      name: fileName,
      sizeBytes: Buffer.byteLength(content, 'utf-8'),
      currentPath: filePath,
      category: 'Belgeler',
      targetRelativePath: 'Belgeler\\Metin Dosyaları',
    };

    const result = await safelyMoveFile(testDesktopDir, fileItem);

    expect(result.status).toBe('Başarılı');
    expect(fs.existsSync(result.destinationPath)).toBe(true);
    expect(fs.existsSync(filePath)).toBe(false); // Eski konumdan güvenle taşındı

    // İçerik ve Hash Doğrulaması
    const destContent = fs.readFileSync(result.destinationPath, 'utf-8');
    expect(destContent).toBe(content);
    expect(result.destSha256).toBe(originalHash);
  });

  it('Hedefte aynı isimli dosya varsa üzerine yazmamalı, güvenli numara eklemeli', async () => {
    const targetDir = path.join(testDesktopDir, 'Fotoğraflar ve Görseller');
    fs.mkdirSync(targetDir, { recursive: true });

    // Hedefte zaten bir foto.jpg var
    const existingTargetPath = path.join(targetDir, 'foto.jpg');
    fs.writeFileSync(existingTargetPath, 'Orijinal hedef dosya', 'utf-8');

    // Masaüstünde aynı isimli yeni bir dosya var
    const sourceFilePath = path.join(testDesktopDir, 'foto.jpg');
    fs.writeFileSync(sourceFilePath, 'Masaüstündeki yeni foto dosyası', 'utf-8');

    const fileItem = {
      id: 'f2',
      name: 'foto.jpg',
      sizeBytes: Buffer.byteLength('Masaüstündeki yeni foto dosyası', 'utf-8'),
      currentPath: sourceFilePath,
      category: 'Fotoğraflar ve Görseller',
      targetRelativePath: 'Fotoğraflar ve Görseller',
    };

    const result = await safelyMoveFile(testDesktopDir, fileItem);

    expect(result.status).toBe('Başarılı');
    // Var olan dosya korunmuş olmalı
    expect(fs.readFileSync(existingTargetPath, 'utf-8')).toBe('Orijinal hedef dosya');
    // Yeni taşınan dosya foto (1).jpg olarak güvenle yerleşmiş olmalı
    expect(path.basename(result.destinationPath)).toBe('foto (1).jpg');
    expect(fs.readFileSync(result.destinationPath, 'utf-8')).toBe('Masaüstündeki yeni foto dosyası');
  });

  it('Hedef dizin masaüstünün dışına çıkmaya çalışırsa güvenlik engeli devreye girmeli', async () => {
    const sourceFilePath = path.join(testDesktopDir, 'zararsiz.txt');
    fs.writeFileSync(sourceFilePath, 'test', 'utf-8');

    const maliciousItem = {
      id: 'f3',
      name: 'zararsiz.txt',
      sizeBytes: 4,
      currentPath: sourceFilePath,
      category: 'Diğer',
      // Dışarı çıkma girişimi: ..\..\Windows
      targetRelativePath: '..\\..\\Disarisi',
    };

    const result = await safelyMoveFile(testDesktopDir, maliciousItem);

    expect(result.status).not.toBe('Başarılı');
    expect(result.errorMessage).toContain('Güvenlik ihlali');
    // Kaynak dosya silinmemiş ve bozulmamış olmalı
    expect(fs.existsSync(sourceFilePath)).toBe(true);
  });

  it('Geri Alma (Undo) işlemi dosyayı eski yerine eksiksiz geri getirmeli', async () => {
    const fileName = 'proje.py';
    const filePath = path.join(testDesktopDir, fileName);
    fs.writeFileSync(filePath, 'print("merhaba robot")', 'utf-8');

    const fileItem = {
      id: 'f4',
      name: fileName,
      sizeBytes: Buffer.byteLength('print("merhaba robot")', 'utf-8'),
      currentPath: filePath,
      category: 'Yazılım ve Kod Projeleri',
      targetRelativePath: 'Yazılım ve Kod Projeleri\\Python Projeleri',
    };

    // Önce taşı
    const moveResult = await safelyMoveFile(testDesktopDir, fileItem);
    expect(moveResult.status).toBe('Başarılı');
    expect(fs.existsSync(moveResult.destinationPath)).toBe(true);

    // Şimdi geri al
    const history = [{
      fileName: fileName,
      originalPath: filePath,
      destinationPath: moveResult.destinationPath,
      category: 'Yazılım ve Kod Projeleri',
    }];

    const undoResults = await revertMoveHistory(testDesktopDir, history);
    expect(undoResults[0].status).toBe('Başarılı');
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('print("merhaba robot")');
  });
});
