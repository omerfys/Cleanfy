import { describe, it, expect } from 'vitest';
import {
  matchFilesByCustomRequest,
  computeMultiZoneArrangement,
  ZONE_COLOR_THEMES,
  CustomZone,
} from '../services/zoneOrganizer';
import { FileItem } from '../types';

describe('Çoklu Alan (Multi-Zone) Düzenleme Testleri', () => {
  const mockFiles: FileItem[] = [
    {
      id: 'f-valorant',
      name: 'Valorant.lnk',
      extension: '.lnk',
      currentPath: 'C:\\Users\\Desktop\\Valorant.lnk',
      targetPath: 'C:\\Users\\Desktop\\Kısayollar\\Valorant.lnk',
      targetRelativePath: 'Kısayollar',
      category: 'Kısayollar',
      sizeBytes: 1024,
      sizeFormatted: '1 KB',
      isFolder: false,
    },
    {
      id: 'f-steam-game',
      name: 'Counter-Strike 2.url',
      extension: '.url',
      currentPath: 'C:\\Users\\Desktop\\Counter-Strike 2.url',
      targetPath: 'C:\\Users\\Desktop\\Kısayollar\\Counter-Strike 2.url',
      targetRelativePath: 'Kısayollar',
      category: 'Kısayollar',
      sizeBytes: 512,
      sizeFormatted: '512 B',
      isFolder: false,
    },
    {
      id: 'f-folder-proje',
      name: 'Cleanfy Project',
      extension: '',
      currentPath: 'C:\\Users\\Desktop\\Cleanfy Project',
      targetPath: 'C:\\Users\\Desktop\\Cleanfy Project',
      targetRelativePath: 'Cleanfy Project',
      category: 'Klasörler',
      sizeBytes: 0,
      sizeFormatted: '0 B',
      isFolder: true,
    },
    {
      id: 'f-folder-docs',
      name: 'Evraklar',
      extension: '',
      currentPath: 'C:\\Users\\Desktop\\Evraklar',
      targetPath: 'C:\\Users\\Desktop\\Evraklar',
      targetRelativePath: 'Evraklar',
      category: 'Klasörler',
      sizeBytes: 0,
      sizeFormatted: '0 B',
      isFolder: true,
    },
    {
      id: 'f-archive',
      name: 'yedek.zip',
      extension: '.zip',
      currentPath: 'C:\\Users\\Desktop\\yedek.zip',
      targetPath: 'C:\\Users\\Desktop\\Arşivler\\yedek.zip',
      targetRelativePath: 'Arşivler',
      category: 'Arşivler',
      sizeBytes: 2048,
      sizeFormatted: '2 KB',
      isFolder: false,
    },
    {
      id: 'f-doc',
      name: 'rapor.pdf',
      extension: '.pdf',
      currentPath: 'C:\\Users\\Desktop\\rapor.pdf',
      targetPath: 'C:\\Users\\Desktop\\Belgeler\\rapor.pdf',
      targetRelativePath: 'Belgeler',
      category: 'Belgeler',
      sizeBytes: 4096,
      sizeFormatted: '4 KB',
      isFolder: false,
    },
  ];

  it('Doğal dil istekleriyle eşleşen dosyaları doğru filtrelemeli', () => {
    const games = matchFilesByCustomRequest(mockFiles, 'buraya sadece oyunları koy');
    expect(games.matched.map(f => f.id)).toContain('f-valorant');
    expect(games.matched.map(f => f.id)).toContain('f-steam-game');
    expect(games.matched.length).toBe(2);

    const folders = matchFilesByCustomRequest(mockFiles, 'buraya sadece klasörleri koy');
    expect(folders.matched.map(f => f.id)).toContain('f-folder-proje');
    expect(folders.matched.map(f => f.id)).toContain('f-folder-docs');
    expect(folders.matched.length).toBe(2);

    const archives = matchFilesByCustomRequest(mockFiles, 'buraya sadece arşivleri koy');
    expect(archives.matched.map(f => f.id)).toContain('f-archive');
    expect(archives.matched.length).toBe(1);
  });

  it('Birden fazla alanı çakışmadan farklı renkler ve ızgaralar ile yerleştirmeli', () => {
    const zone1: CustomZone = {
      id: 'z-games',
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      prompt: 'buraya sadece oyunları koy',
      label: '🎮 Sadece Oyunlar',
      colorIndex: 0,
      colorTheme: ZONE_COLOR_THEMES[0],
      matchedCount: 0,
      matchedFileIds: [],
    };

    const zone2: CustomZone = {
      id: 'z-folders',
      x: 600,
      y: 100,
      width: 400,
      height: 300,
      prompt: 'buraya sadece klasörleri koy',
      label: '📁 Sadece Klasörler',
      colorIndex: 1,
      colorTheme: ZONE_COLOR_THEMES[1],
      matchedCount: 0,
      matchedFileIds: [],
    };

    const currentPositions = {
      'f-valorant': { x: 50, y: 50 },
      'f-steam-game': { x: 60, y: 60 },
      'f-folder-proje': { x: 70, y: 70 },
      'f-folder-docs': { x: 80, y: 80 },
      'f-archive': { x: 90, y: 90 },
      'f-doc': { x: 200, y: 200 }, // zone 1'in içinde ama oyun değil -> tahliye edilmeli
    };

    const { targets, zonesWithCounts } = computeMultiZoneArrangement(
      mockFiles,
      [zone1, zone2],
      currentPositions,
      1920,
      1080
    );

    // Zone 1 için oyunlar yerleşti
    expect(targets['f-valorant']).toBeDefined();
    expect(targets['f-valorant'].zoneId).toBe('z-games');
    expect(targets['f-valorant'].colorTheme?.id).toBe(ZONE_COLOR_THEMES[0].id);
    expect(targets['f-valorant'].x).toBeGreaterThanOrEqual(100);
    expect(targets['f-valorant'].x).toBeLessThanOrEqual(500);

    // Zone 2 için klasörler yerleşti
    expect(targets['f-folder-proje']).toBeDefined();
    expect(targets['f-folder-proje'].zoneId).toBe('z-folders');
    expect(targets['f-folder-proje'].colorTheme?.id).toBe(ZONE_COLOR_THEMES[1].id);
    expect(targets['f-folder-proje'].x).toBeGreaterThanOrEqual(600);
    expect(targets['f-folder-proje'].x).toBeLessThanOrEqual(1000);

    // zone1 içinde kalan ama eşleşmeyen dosya (f-doc) tahliye edilmiş olmalı
    expect(targets['f-doc']).toBeDefined();
    expect(targets['f-doc'].zoneId).toBeUndefined(); // Tahliye edilenler bir bölgeye ait değildir
    // Tahliye edilen nokta zone1 veya zone2 içinde olmamalı
    const docX = targets['f-doc'].x;
    const docY = targets['f-doc'].y;
    const inZ1 = docX >= 100 - 20 && docX <= 500 + 20 && docY >= 100 - 20 && docY <= 400 + 20;
    const inZ2 = docX >= 600 - 20 && docX <= 1000 + 20 && docY >= 100 - 20 && docY <= 400 + 20;
    expect(inZ1 || inZ2).toBe(false);

    // zonesWithCounts doğrulaması
    expect(zonesWithCounts[0].matchedCount).toBe(2);
    expect(zonesWithCounts[1].matchedCount).toBe(2);
  });
});
