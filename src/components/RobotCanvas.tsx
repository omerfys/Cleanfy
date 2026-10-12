import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { FileItem, RobotState } from '../types';
import { CATEGORY_COLORS } from '../services/categorization';

interface RobotCanvasProps {
  files: FileItem[];
  robotState: RobotState;
  activeFileId?: string | null;
  cleanedFileIds?: Set<string>;
  onFileCollision?: (file: FileItem) => void;
  isOverlay?: boolean;
  viewMode?: 'clone' | 'transparent';
  zoneTargets?: Record<string, { x: number; y: number }>;
  activeZoneHighlight?: { x: number; y: number; width: number; height: number; label: string } | null;
  filePositionsRef?: React.MutableRefObject<Record<string, { x: number; y: number }>>;
}

interface DustMote {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number; opacity: number;
}

function splitDesktopLabel(name: string): [string, string | null] {
  if (name.length <= 11) return [name, null];
  
  const words = name.split(' ');
  if (words.length > 1) {
    let line1 = words[0];
    let i = 1;
    while (i < words.length && (line1 + ' ' + words[i]).length <= 13) {
      line1 += ' ' + words[i];
      i++;
    }
    if (i < words.length) {
      let line2 = words.slice(i).join(' ');
      if (line2.length > 13) {
        line2 = line2.slice(0, 11) + '..';
      }
      return [line1, line2];
    }
    return [line1, null];
  }

  const l1 = name.slice(0, 10);
  const rem = name.slice(10);
  const l2 = rem.length > 10 ? rem.slice(0, 8) + '..' : rem;
  return [l1, l2];
}

export const RobotCanvas: React.FC<RobotCanvasProps> = ({
  files,
  robotState,
  activeFileId,
  cleanedFileIds,
  viewMode = 'clone',
  zoneTargets,
  activeZoneHighlight,
  filePositionsRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const robotBodyRef = useRef<Matter.Body | null>(null);
  const fileBodiesRef = useRef<Map<string, { body: Matter.Body; item: FileItem }>>(new Map());

  const robotStateRef = useRef<RobotState>(robotState);
  robotStateRef.current = robotState;

  const activeFileIdRef = useRef<string | null | undefined>(activeFileId);
  activeFileIdRef.current = activeFileId;

  const cleanedFileIdsRef = useRef<Set<string> | undefined>(cleanedFileIds);
  cleanedFileIdsRef.current = cleanedFileIds;

  const viewModeRef = useRef<'clone' | 'transparent'>(viewMode);
  viewModeRef.current = viewMode;

  const zoneTargetsRef = useRef<Record<string, { x: number; y: number }> | undefined>(zoneTargets);
  zoneTargetsRef.current = zoneTargets;

  const activeZoneHighlightRef = useRef(activeZoneHighlight);
  activeZoneHighlightRef.current = activeZoneHighlight;

  // Animasyon durumları
  const lidarAngleRef = useRef(0);
  const brushAngleRef = useRef(0);
  const bumperRef = useRef(0);        // 0-1 tampon sıkışma
  const recoilRef = useRef(0);        // geri tepme zamanlayıcı
  const stuckFramesRef = useRef(0);   // takılma tespit sayacı
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const timeRef = useRef(0);          // genel zaman sayacı
  const prevAngleRef = useRef(0);     // yumuşak açı takibi
  const dustRef = useRef<DustMote[]>([]);
  const iconCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const W = container.clientWidth || window.innerWidth || 1920;
    const H = container.clientHeight || window.innerHeight || 1080;
    canvas.width = W;
    canvas.height = H;

    // Masaüstü Duvar Kağıdı
    const wpImg = new Image();
    wpImg.src = './wallpaper.png';
    let wpReady = false;
    wpImg.onload = () => { wpReady = true; };

    // Matter.js Fizik Motoru
    const { Engine, Runner, Bodies, Composite, Events, Body, Vector } = Matter;
    const engine = Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
    engineRef.current = engine;
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    // Duvarlar
    const wt = 60;
    Composite.add(engine.world, [
      Bodies.rectangle(W / 2, -wt / 2, W * 2, wt, { isStatic: true, label: 'wall' }),
      Bodies.rectangle(W / 2, H + wt / 2 - 40, W * 2, wt, { isStatic: true, label: 'wall' }),
      Bodies.rectangle(-wt / 2, H / 2, wt, H * 2, { isStatic: true, label: 'wall' }),
      Bodies.rectangle(W + wt / 2, H / 2, wt, H * 2, { isStatic: true, label: 'wall' }),
    ]);

    // Robot Gövdesi
    const R = 44; // yarıçap
    const robotBody = Bodies.circle(W / 2, H / 2, R, {
      mass: 8, frictionAir: 0.08, friction: 0.15, restitution: 0.4, label: 'robot',
    });
    robotBodyRef.current = robotBody;
    Composite.add(engine.world, robotBody);
    prevAngleRef.current = robotBody.angle;

    // Dosyalar
    const bMap = new Map<string, { body: Matter.Body; item: FileItem }>();
    const activeFiles = files.filter(f => !cleanedFileIds || !cleanedFileIds.has(f.id));

    // Masaüstü Gerçek Düzeni Konumlandırma Fonksiyonu (Screenshot 2 ile birebir eşleşme)
    const getDesktopItemCoords = (itemIndex: number, totalW: number, totalH: number) => {
      const startY = 28;
      const stepY = 102; // 10 satırı tam ekran (28px - 946px) boyunca yayar

      // 1. Sol 8 Sütun (0..79) - Her sütun 10 öğe
      if (itemIndex >= 0 && itemIndex < 80) {
        const col = Math.floor(itemIndex / 10);
        const row = itemIndex % 10;
        return {
          x: 35 + col * 76,
          y: startY + row * stepY,
        };
      }

      // 2. 8. Sütun (Col 8) tekil klasörler
      if (itemIndex === 80) return { x: 35 + 8 * 76, y: startY + 9 * stepY }; // CustomNameplates (alt satır: y=946)
      if (itemIndex === 81) return { x: 35 + 8 * 76, y: startY + 0 * stepY }; // Ben (üst satır: y=28)

      // 3. Üst orta klasörler (Çiçeğin üstü: Satır 0 ve Satır 1)
      if (itemIndex === 90) return { x: 940, y: startY };                 // ok
      if (itemIndex === 92) return { x: 1016, y: startY };                // ompp
      if (itemIndex === 97) return { x: 1140, y: startY };                // arenapvp
      if (itemIndex === 102) return { x: 1216, y: startY };               // ModelEngine
      if (itemIndex === 108) return { x: 1460, y: startY };               // Movify (sağ blok üst)

      if (itemIndex === 91) return { x: 940, y: startY + stepY };         // modelsteal
      if (itemIndex === 93) return { x: 1090, y: startY + stepY };        // omp
      if (itemIndex === 98) return { x: 1166, y: startY + stepY };        // desert_dungeon
      if (itemIndex === 103) return { x: 1242, y: startY + stepY };       // MythicMobs

      // 4. Çiçeğin ortası ve çevresi
      if (itemIndex === 82) return { x: 716, y: startY + 2 * stepY };     // Redis-x64-5.0.14.1.zip
      if (itemIndex === 83) return { x: 716, y: startY + 3 * stepY };     // Redis
      if (itemIndex === 85) return { x: 792, y: startY + 3 * stepY };     // BlokOyun
      if (itemIndex === 88) return { x: 868, y: startY + 3 * stepY };     // Testing - Kopya
      if (itemIndex === 86) return { x: 792, y: startY + 4 * stepY };     // Testing
      if (itemIndex === 94) return { x: 1080, y: startY + 4 * stepY };    // Boomfy
      if (itemIndex === 99) return { x: 1156, y: startY + 4 * stepY };    // Typerfy
      if (itemIndex === 129) return { x: 1232, y: startY + 4 * stepY };   // Cleanfy

      // 5. DATA FEL ve altındaki küme
      if (itemIndex === 95) return { x: 1080, y: startY + 6 * stepY };    // Cosmic Cove _ Ice Boat Track.zip
      if (itemIndex === 100) return { x: 1156, y: startY + 6 * stepY };   // grimstone-volcano.zip
      if (itemIndex === 104) return { x: 1232, y: startY + 6 * stepY };   // cheese-land.zip
      if (itemIndex === 106) return { x: 1308, y: startY + 6 * stepY };   // sky-high-sundae.zip

      if (itemIndex === 96) return { x: 1080, y: startY + 7 * stepY };    // Cosmic-Track
      if (itemIndex === 101) return { x: 1156, y: startY + 7 * stepY };   // Volcano-Track
      if (itemIndex === 105) return { x: 1232, y: startY + 7 * stepY };   // Cheese-Track
      if (itemIndex === 107) return { x: 1308, y: startY + 7 * stepY };   // Skyland-Track

      if (itemIndex === 87) return { x: 776, y: startY + 7 * stepY };     // Hub9.zip
      if (itemIndex === 84) return { x: 700, y: startY + 7 * stepY };     // boat.jem
      if (itemIndex === 89) return { x: 860, y: startY + 7 * stepY };     // osiris.yml

      // 6. Sağ dikey ara sütun (109..114)
      if (itemIndex === 109) return { x: 1460, y: startY + 2 * stepY };   // omerfyhostprojectbackup
      if (itemIndex === 110) return { x: 1460, y: startY + 3 * stepY };   // omerfyhostproject
      if (itemIndex === 111) return { x: 1460, y: startY + 4 * stepY };   // videoreplik.txt
      if (itemIndex === 112) return { x: 1460, y: startY + 5 * stepY };   // BetterChatBubbles
      if (itemIndex === 113) return { x: 1460, y: startY + 7 * stepY };   // BoatRace
      if (itemIndex === 114) return { x: 1460, y: startY + 8 * stepY };   // IBR-Source

      // 7. En sağ oyun ve URL kısayolları (115..130)
      if (itemIndex === 115) return { x: totalW - 170, y: startY };              // Super Battle Golf
      if (itemIndex === 119) return { x: totalW - 94, y: startY };               // Modrinth App
      if (itemIndex === 116) return { x: totalW - 170, y: startY + stepY };      // VALORANT
      if (itemIndex === 120) return { x: totalW - 94, y: startY + stepY };       // Roblox Player
      if (itemIndex === 117) return { x: totalW - 170, y: startY + 2 * stepY };  // HackHub Demo
      if (itemIndex === 121) return { x: totalW - 94, y: startY + 2 * stepY };   // Chivalry 2
      if (itemIndex === 118) return { x: totalW - 170, y: startY + 3 * stepY };  // Aniimo
      if (itemIndex === 122) return { x: totalW - 94, y: startY + 3 * stepY };   // Stardew Valley
      if (itemIndex === 123) return { x: totalW - 94, y: startY + 4 * stepY };   // ROUNDS
      if (itemIndex === 124) return { x: totalW - 94, y: startY + 5 * stepY };   // Goose Goose Duck
      if (itemIndex === 125) return { x: totalW - 94, y: startY + 6 * stepY };   // Pro Soccer Online
      if (itemIndex === 130) return { x: totalW - 170, y: startY + 6 * stepY };  // PremiumVanish.jar
      if (itemIndex === 126) return { x: totalW - 94, y: startY + 7 * stepY };   // PEAK
      if (itemIndex === 127) return { x: totalW - 94, y: startY + 8 * stepY };   // How to Fish
      if (itemIndex === 128) return { x: totalW - 94, y: startY + 9 * stepY };   // Cyberpunk 2077 (En alt satır: y=946)

      // Genel dinamik konumlandırma fallback
      const col = Math.floor(itemIndex / 10);
      const row = itemIndex % 10;
      return {
        x: 35 + col * 76,
        y: startY + row * stepY,
      };
    };

    activeFiles.forEach((file, i) => {
      let initialX: number;
      let initialY: number;

      if (typeof file.screenX === 'number' && typeof file.screenY === 'number') {
        // Windows Shell'den gelen gerçek masaüstü koordinatları (simge hücresinin merkezi: +38px, +45px)
        const scaleX = W / 1920;
        const scaleY = H / 1080;
        initialX = (file.screenX + 38) * scaleX;
        initialY = (file.screenY + 45) * scaleY;
      } else {
        const itemIndex = typeof file.index === 'number' ? file.index : i;
        const pos = getDesktopItemCoords(itemIndex, W, H);
        initialX = pos.x;
        initialY = pos.y;
      }

      const body = Bodies.rectangle(
        Math.min(W - 40, Math.max(30, initialX)),
        Math.min(H - 45, Math.max(28, initialY)),
        68, 74,
        { mass: 1.5, frictionAir: 0.08, friction: 0.15, restitution: 0.4, chamfer: { radius: 8 }, label: `file_${file.id}` }
      );
      bMap.set(file.id, { body, item: file });
      Composite.add(engine.world, body);
    });
    fileBodiesRef.current = bMap;

    // Çarpışma
    Events.on(engine, 'collisionStart', (ev) => {
      ev.pairs.forEach((pair) => {
        const rA = pair.bodyA.label === 'robot', rB = pair.bodyB.label === 'robot';
        if (!rA && !rB) return;
        bumperRef.current = 1.0;
        recoilRef.current = 20;
        const other = rA ? pair.bodyB : pair.bodyA;
        const d = Vector.sub(other.position, robotBody.position);
        const n = Vector.normalise(d);
        Body.applyForce(robotBody, robotBody.position, Vector.mult(n, -0.045));
        if (other.label.startsWith('file_')) {
          Body.applyForce(other, other.position, Vector.mult(n, 0.055));
        }
        if (robotStateRef.current === 'Dolaşma' || robotStateRef.current === 'Bekleme' || robotStateRef.current === 'Tarama') {
          let evade: number;
          if (other.label === 'wall') {
            // Duvara çarptığında ekranın merkezine doğru yönelerek sekme
            const toCenter = Math.atan2(H / 2 - robotBody.position.y, W / 2 - robotBody.position.x);
            evade = toCenter + (Math.random() - 0.5) * 0.7;
          } else {
            evade = robotBody.angle + (Math.random() > 0.5 ? 1 : -1) * (Math.PI * 0.45 + Math.random() * 0.35);
          }
          const dist = 200 + Math.random() * 150;
          targetRef.current = {
            x: Math.max(90, Math.min(W - 90, robotBody.position.x + Math.cos(evade) * dist)),
            y: Math.max(90, Math.min(H - 130, robotBody.position.y + Math.sin(evade) * dist)),
          };
          wanderT = 0;
        }
      });
    });

    // Ana Döngü
    let frameId: number;
    let wanderT = 0;

    const render = () => {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        timeRef.current++;
        const t = timeRef.current;

      // Zemin
      if (viewModeRef.current === 'clone' && wpReady) ctx.drawImage(wpImg, 0, 0, W, H);
      else ctx.clearRect(0, 0, W, H);

      const st = robotStateRef.current;
      const curActiveFileId = activeFileIdRef.current;
      const zh = activeZoneHighlightRef.current;
      wanderT++;

      // ── Aktif Özel Alan Çerçevesi (Selection Box Hedef Gösterimi) ──
      if (zh) {
        ctx.save();
        ctx.fillStyle = 'rgba(6, 182, 212, 0.07)';
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -t * 0.6;
        ctx.beginPath();
        ctx.roundRect(zh.x, zh.y, zh.width, zh.height, 14);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        // Alan etiketi
        ctx.fillStyle = 'rgba(11, 19, 38, 0.85)';
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
        ctx.lineWidth = 1;
        const badgeW = Math.min(zh.width, 190);
        const badgeX = zh.x + 10;
        const badgeY = Math.max(8, zh.y - 26);
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, 22, 8);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.fillStyle = '#67e8f9';
        ctx.textAlign = 'left';
        ctx.fillText(`🎯 ${zh.label}`, badgeX + 8, badgeY + 14);
        ctx.restore();
      }

      // ── Hedef Seçimi (Kesintisiz ve Akıcı Gezinti) ──
      const pickNewWanderTarget = () => {
        wanderT = 0;
        if (zh) {
          // Özel alan düzenlenirken robot o alanın içinde devriye gezsin
          targetRef.current = {
            x: Math.max(70, Math.min(W - 70, zh.x + 30 + Math.random() * Math.max(40, zh.width - 60))),
            y: Math.max(70, Math.min(H - 110, zh.y + 30 + Math.random() * Math.max(40, zh.height - 60))),
          };
          return;
        }
        // En az 160px uzakta bir hedef seç (asla robotun hemen dibine hedef koyma)
        for (let attempt = 0; attempt < 8; attempt++) {
          let candidateX: number;
          let candidateY: number;
          if (bMap.size > 0 && Math.random() > 0.3) {
            const arr = Array.from(bMap.values());
            const pick = arr[Math.floor(Math.random() * arr.length)];
            candidateX = Math.max(90, Math.min(W - 90, pick.body.position.x + (Math.random() - 0.5) * 140));
            candidateY = Math.max(90, Math.min(H - 130, pick.body.position.y + (Math.random() - 0.5) * 140));
          } else {
            candidateX = 100 + Math.random() * (W - 200);
            candidateY = 100 + Math.random() * (H - 220);
          }
          const d = Math.hypot(candidateX - robotBody.position.x, candidateY - robotBody.position.y);
          if (d >= 160 || attempt === 7) {
            targetRef.current = { x: candidateX, y: candidateY };
            break;
          }
        }
      };

      if (zh && wanderT > 70) {
        pickNewWanderTarget();
      } else if (st === 'Dolaşma' || st === 'Bekleme' || st === 'Tarama') {
        if (!targetRef.current || wanderT > 200) {
          pickNewWanderTarget();
        }
      } else if ((st === 'İnceleme' || st === 'Düzenleme' || st === 'Taşıma') && curActiveFileId) {
        const tf = bMap.get(curActiveFileId);
        if (tf) targetRef.current = { x: tf.body.position.x, y: tf.body.position.y };
        else if (!targetRef.current) pickNewWanderTarget();
      } else if (st === 'Geri dönüş') {
        targetRef.current = { x: W / 2, y: H / 2 };
      } else if (!targetRef.current) {
        pickNewWanderTarget();
      }

      // Güvenlik sınır kontrolü: Fizik motorundan dolayı ekran dışına kaymayı kesin engeller
      if (robotBody.position.x < R) Body.setPosition(robotBody, { x: R + 5, y: robotBody.position.y });
      if (robotBody.position.x > W - R) Body.setPosition(robotBody, { x: W - R - 5, y: robotBody.position.y });
      if (robotBody.position.y < R) Body.setPosition(robotBody, { x: robotBody.position.x, y: R + 5 });
      if (robotBody.position.y > H - R - 40) Body.setPosition(robotBody, { x: robotBody.position.x, y: H - R - 45 });

      // ── Kesintisiz Akıcı Hareket Fiziği (Sürekli Devriye & İdeal Hız) ──
      if (targetRef.current) {
        let dx = targetRef.current.x - robotBody.position.x;
        let dy = targetRef.current.y - robotBody.position.y;
        let dist = Math.hypot(dx, dy);

        // Hedefe ulaşıldığında duraksamadan hemen yeni hedefe akıcı geçiş
        if (dist <= 45 && (st === 'Dolaşma' || st === 'Bekleme' || st === 'Tarama' || Boolean(zh))) {
          pickNewWanderTarget();
          if (targetRef.current) {
            dx = targetRef.current.x - robotBody.position.x;
            dy = targetRef.current.y - robotBody.position.y;
            dist = Math.hypot(dx, dy);
          }
        }

        if (dist > 15) {
          const want = Math.atan2(dy, dx);
          let diff = want - robotBody.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;

          // Yumuşak ve çevik yönelme
          const turn = 0.055;
          const na = robotBody.angle + diff * turn;
          Body.setAngle(robotBody, na);

          const align = Math.max(0.2, Math.cos(diff));
          // Kullanıcı isteği: hızını çok az miktarda şuankiden biraz daha fazla hızlandır (0.0016 -> 0.0025)
          const baseForce = st === 'Taşıma' ? 0.0018 : 0.0025;
          const driveForce = baseForce * (0.35 + 0.65 * align);
          Body.applyForce(robotBody, robotBody.position, { x: Math.cos(na) * driveForce, y: Math.sin(na) * driveForce });

          // Hız kontrolü (önceki 1.25'ten çok az daha akıcı 1.70 sınırı)
          const currentSpd = Math.hypot(robotBody.velocity.x, robotBody.velocity.y);
          if (currentSpd > 1.70) {
            Body.setVelocity(robotBody, {
              x: (robotBody.velocity.x / currentSpd) * 1.70,
              y: (robotBody.velocity.y / currentSpd) * 1.70,
            });
          }

          // Takılma Önleyici (Stuck Prevention): Dosyalar veya köşe arasında hız sıfırlandığında anında kurtulma
          if (currentSpd < 0.30 && (st === 'Dolaşma' || st === 'Bekleme' || st === 'Tarama')) {
            stuckFramesRef.current++;
            if (stuckFramesRef.current > 25) {
              stuckFramesRef.current = 0;
              // Köşeden veya engelden kurtulmak için ters/yan açı ve kuvvetli itki
              const evadeAngle = robotBody.angle + (Math.random() > 0.5 ? 1 : -1) * (Math.PI * 0.6 + Math.random() * 0.4);
              targetRef.current = {
                x: Math.max(90, Math.min(W - 90, robotBody.position.x + Math.cos(evadeAngle) * 220)),
                y: Math.max(90, Math.min(H - 120, robotBody.position.y + Math.sin(evadeAngle) * 220)),
              };
              Body.setVelocity(robotBody, {
                x: Math.cos(evadeAngle) * 1.6,
                y: Math.sin(evadeAngle) * 1.6,
              });
              wanderT = 0;
            }
          } else {
            stuckFramesRef.current = Math.max(0, stuckFramesRef.current - 1);
          }
        }
      }

      if (st === 'Tamamlama') {
        Body.setAngle(robotBody, robotBody.angle + 0.025);
      }

      // Sayaçlar (Sakin LiDAR taraması ve fırça dönüşü)
      lidarAngleRef.current += 0.045;
      const spd = Math.hypot(robotBody.velocity.x, robotBody.velocity.y);
      brushAngleRef.current += 0.08 + spd * 0.1;
      if (bumperRef.current > 0) bumperRef.current -= 0.035;
      if (recoilRef.current > 0) recoilRef.current--;

      const rx = robotBody.position.x;
      const ry = robotBody.position.y;
      const ra = robotBody.angle;

      // ── Toz Parçacıkları ──
      if (spd > 0.3 && st !== 'Bekleme' && st !== 'Tamamlama' && Math.random() > 0.5) {
        const behind = ra + Math.PI;
        const spread = (Math.random() - 0.5) * 1.2;
        const d = R + 2 + Math.random() * 6;
        dustRef.current.push({
          x: rx + Math.cos(behind + spread) * d,
          y: ry + Math.sin(behind + spread) * d,
          vx: Math.cos(behind + spread) * (0.3 + Math.random() * 0.5),
          vy: Math.sin(behind + spread) * (0.3 + Math.random() * 0.5),
          life: 0, maxLife: 20 + Math.random() * 15,
          size: 1 + Math.random() * 2, opacity: 0.4 + Math.random() * 0.3,
        });
      }
      // Kutlama parçacıkları
      if (st === 'Tamamlama' && Math.random() > 0.4) {
        const a = Math.random() * Math.PI * 2;
        const v = 1.5 + Math.random() * 3;
        dustRef.current.push({
          x: rx + Math.cos(a) * (R + 3), y: ry + Math.sin(a) * (R + 3),
          vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.8,
          life: 0, maxLife: 30 + Math.random() * 25,
          size: 2 + Math.random() * 2.5, opacity: 1,
        });
      }

      // Parçacık çizimi
      for (let i = dustRef.current.length - 1; i >= 0; i--) {
        const p = dustRef.current[i];
        p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy *= 0.97; p.life++;
        const a = p.opacity * Math.max(0, 1 - p.life / p.maxLife);
        if (a <= 0) { dustRef.current.splice(i, 1); continue; }
        ctx.globalAlpha = a;
        ctx.fillStyle = st === 'Tamamlama' ? (dustRef.current[i] as any).color || '#cbd5e1' : '#cbd5e1';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── Dosya İkonları ──
      const zTargets = zoneTargetsRef.current;
      const cleanedSet = cleanedFileIdsRef.current;

      bMap.forEach(({ body, item }) => {
        if (cleanedSet && cleanedSet.has(item.id)) return;

        // Özel alan hedefi varsa dosyayı hedef yuvaya pürüzsüzce kaydır ve hizalı tut
        let isGlidingToZone = false;
        const zt = zTargets ? zTargets[item.id] : undefined;
        if (zt) {
          const zdx = zt.x - body.position.x;
          const zdy = zt.y - body.position.y;
          const zdist = Math.hypot(zdx, zdy);
          if (zdist > 1.2) {
            isGlidingToZone = zdist > 6;
            const step = Math.min(zdist, Math.max(2.4, zdist * 0.12));
            Body.setPosition(body, {
              x: body.position.x + (zdx / zdist) * step,
              y: body.position.y + (zdy / zdist) * step,
            });
            Body.setVelocity(body, { x: 0, y: 0 });
            Body.setAngle(body, body.angle * 0.8);
            Body.setAngularVelocity(body, 0);
          } else {
            Body.setPosition(body, { x: zt.x, y: zt.y });
            Body.setVelocity(body, { x: 0, y: 0 });
            Body.setAngle(body, 0);
            Body.setAngularVelocity(body, 0);
          }
        }

        if (filePositionsRef && filePositionsRef.current) {
          filePositionsRef.current[item.id] = { x: body.position.x, y: body.position.y };
        }

        const { x, y } = body.position;
        const ang = body.angle;
        const isT = item.id === curActiveFileId;
        const ext = item.extension.toLowerCase();
        const cc = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Diğer Dosyalar'];

        // İlerleme yönündeki ışın teması (robotun gittiği yöndeki dosyalar)
        const dR = Math.hypot(x - rx, y - ry);
        const aR = Math.atan2(y - ry, x - rx);
        let ld = aR - ra;
        while (ld > Math.PI) ld -= Math.PI * 2;
        while (ld < -Math.PI) ld += Math.PI * 2;
        const hit = dR < 145 && Math.abs(ld) < 0.32;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(ang);

        if (isT || isGlidingToZone) {
          ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 14;
          ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
          ctx.strokeRect(-25, -31, 50, 50); ctx.shadowBlur = 0;
        } else if (hit) {
          ctx.strokeStyle = 'rgba(56,189,248,0.6)'; ctx.lineWidth = 1.5;
          ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 8;
          ctx.strokeRect(-25, -31, 50, 50); ctx.shadowBlur = 0;
        }

        let drawn = false;
        if (item.iconDataUrl) {
          let im = iconCacheRef.current.get(item.id);
          if (!im) { im = new Image(); im.src = item.iconDataUrl; iconCacheRef.current.set(item.id, im); }
          if (im.complete && im.naturalWidth > 0 && im.naturalHeight > 0) {
            const scale = 48 / Math.max(im.naturalWidth, im.naturalHeight);
            const dw = Math.round(im.naturalWidth * scale);
            const dh = Math.round(im.naturalHeight * scale);
            ctx.drawImage(im, -Math.round(dw / 2), -6 - Math.round(dh / 2), dw, dh);
            drawn = true;
          }
        }
        if (!drawn) {
          ctx.fillStyle = 'rgba(30,41,59,0.85)';
          ctx.strokeStyle = cc ? cc.glow : '#64748b'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.roundRect(-22, -28, 44, 44, 6); ctx.fill(); ctx.stroke();
          ctx.font = 'bold 9px monospace'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
          ctx.fillText(ext.toUpperCase().slice(0, 4) || 'DOSYA', 0, -6);
        }

        ctx.font = '500 11px "Segoe UI", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        const [line1, line2] = splitDesktopLabel(item.name);
        if (line2) {
          ctx.fillText(line1, 0, 22);
          ctx.fillText(line2, 0, 35);
        } else {
          ctx.fillText(line1, 0, 24);
        }

        if (isT && (st === 'İnceleme' || st === 'Düzenleme' || st === 'Taşıma')) {
          ctx.restore(); ctx.save(); ctx.translate(x, y - 56);
          ctx.fillStyle = 'rgba(15,23,42,0.95)'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.6;
          ctx.shadowColor = 'rgba(6,182,212,0.7)'; ctx.shadowBlur = 12;
          ctx.beginPath(); ctx.roundRect(-82, -14, 164, 28, 8); ctx.fill(); ctx.stroke();
          ctx.font = 'bold 10px "Plus Jakarta Sans",sans-serif'; ctx.fillStyle = '#38bdf8'; ctx.textAlign = 'center';
          ctx.fillText(`📁 ${item.category.slice(0, 22)}`, 0, 4);
        }
        ctx.restore();
      });

      // ══════════════════════════════════════════════════════════
      // 3. GERÇEKÇİ BEYAZ ROBOT SÜPÜRGE (Top-down view)
      // ══════════════════════════════════════════════════════════
      ctx.save();
      ctx.translate(rx, ry);

      // ── GÖLGE ──
      // Yumuşak büyük dış gölge
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.filter = 'blur(14px)';
      ctx.beginPath(); ctx.arc(5, 8, R + 8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Temas gölgesi
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.filter = 'blur(3px)';
      ctx.beginPath(); ctx.arc(1, 3, R + 1, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      ctx.rotate(ra);

      // ── ALT GÖVDE (Koyu gri alt şasi - kenardan görünür) ──
      ctx.fillStyle = '#374151';
      ctx.beginPath(); ctx.arc(0, 0, R + 1.5, 0, Math.PI * 2); ctx.fill();

      // ── TEKERLEKLER (yan taraftan sarkan iki siyah lastik) ──
      ctx.save();
      ctx.fillStyle = '#111827';
      // Sol tekerlek
      ctx.beginPath(); ctx.roundRect(-8, -(R - 2), 16, 10, 3); ctx.fill();
      // Sağ tekerlek
      ctx.beginPath(); ctx.roundRect(-8, (R - 2) - 10, 16, 10, 3); ctx.fill();
      // Tekerlek tırtık çizgileri
      ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 0.8;
      for (let i = -5; i <= 5; i += 2.5) {
        ctx.beginPath(); ctx.moveTo(i, -(R - 2)); ctx.lineTo(i, -(R - 2) + 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i, (R - 2) - 10); ctx.lineTo(i, (R - 2)); ctx.stroke();
      }
      ctx.restore();

      // ── ÖN CASTER TEKERLEĞİ (küçük pivot tekerlek) ──
      ctx.save();
      ctx.fillStyle = '#1f2937';
      ctx.beginPath(); ctx.arc(R - 8, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111827';
      ctx.beginPath(); ctx.arc(R - 8, 0, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // ── ANA BEYAZ GÖVDE (üst kapak) ──
      const bodyGrad = ctx.createRadialGradient(-12, -12, 4, 0, 0, R);
      bodyGrad.addColorStop(0, '#ffffff');
      bodyGrad.addColorStop(0.3, '#fafafa');
      bodyGrad.addColorStop(0.65, '#f3f4f6');
      bodyGrad.addColorStop(0.88, '#e5e7eb');
      bodyGrad.addColorStop(1, '#d1d5db');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();

      // Gövde kenar konturu (ince gümüş çizgi)
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, R - 0.5, 0, Math.PI * 2); ctx.stroke();

      // Sol üst ışık yansıması (specular highlight)
      ctx.save();
      const specGrad = ctx.createRadialGradient(-16, -18, 2, -10, -12, 28);
      specGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
      specGrad.addColorStop(0.4, 'rgba(255,255,255,0.3)');
      specGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = specGrad;
      ctx.beginPath(); ctx.arc(0, 0, R - 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // ── ÖN TAMPON (Bumper) ──
      const bc = Math.max(0, bumperRef.current);
      const bumperSqueeze = bc * 3;
      ctx.save();

      // Tampon yarım daire bandı
      ctx.beginPath();
      ctx.arc(0, 0, R - 0.5 - bumperSqueeze, -1.2, 1.2);
      ctx.strokeStyle = bc > 0.1 ? '#fca5a5' : '#9ca3af';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      // İnce tampon iç çizgisi
      ctx.beginPath();
      ctx.arc(0, 0, R - 3 - bumperSqueeze, -1.15, 1.15);
      ctx.strokeStyle = bc > 0.1 ? '#fecaca' : '#d1d5db';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // ── FIRCALAR (iki adet kompakt yan fırça) ──
      const brushDraw = (bx: number, by: number, dir: number) => {
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(brushAngleRef.current * dir);
        // 3 esnek silikon kol
        for (let a = 0; a < 3; a++) {
          ctx.save();
          ctx.rotate((a * Math.PI * 2) / 3);
          // Kompakt silikon kol
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(4, 2, 10, 1);
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 1.8;
          ctx.lineCap = 'round';
          ctx.stroke();
          // Kıl demetleri
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = 0.8;
          for (let b = -2; b <= 2; b++) {
            ctx.beginPath(); ctx.moveTo(10, 1); ctx.lineTo(14, 1 + b * 1.6); ctx.stroke();
          }
          ctx.restore();
        }
        // Merkez göbek
        const hg = ctx.createRadialGradient(0, 0, 1, 0, 0, 3.5);
        hg.addColorStop(0, '#f9fafb'); hg.addColorStop(1, '#9ca3af');
        ctx.fillStyle = hg;
        ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      };
      brushDraw(R - 10, -20, 1);
      brushDraw(R - 10, 20, -1);

      // ── TOZ HAZNESİ KAPAK DERZİ ──
      ctx.strokeStyle = 'rgba(156,163,175,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, R - 8, 0.5, Math.PI * 2 - 0.5); ctx.stroke();

      // ── DÜĞME PANELİ (3 düğme: spot, power, home) ──
      ctx.save();
      // Panel arka planı
      ctx.beginPath(); ctx.roundRect(6, -12, 22, 24, 5);
      const panelG = ctx.createLinearGradient(6, -12, 28, 12);
      panelG.addColorStop(0, '#f9fafb'); panelG.addColorStop(1, '#e5e7eb');
      ctx.fillStyle = panelG; ctx.fill();
      ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 0.8; ctx.stroke();

      // Power butonu (büyük, ortada)
      const pwCol = st === 'Hata' ? '#ef4444' : st === 'Tamamlama' ? '#10b981' : '#3b82f6';
      ctx.fillStyle = pwCol;
      ctx.shadowColor = pwCol; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(17, 0, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Power sembolü
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(17, 0, 2, -2.3, 2.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(17, -2.5); ctx.lineTo(17, -0.5); ctx.stroke();

      // Spot ve Home düğmeleri (küçük, üst ve alt)
      ctx.fillStyle = '#9ca3af'; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(17, -7, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(17, 7, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // ── LiDAR KULESİ (Minimalist, Gerçekçi Beyaz & Krom Kubbe - Pervane Yok) ──
      ctx.save();
      // Kule gölgesi
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.arc(1, 2, 14, 0, Math.PI * 2); ctx.fill();

      // Kule gövdesi (hafif yükseltilmiş beyaz silindir)
      const tGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 13);
      tGrad.addColorStop(0, '#ffffff');
      tGrad.addColorStop(0.5, '#f3f4f6');
      tGrad.addColorStop(1, '#d1d5db');
      ctx.fillStyle = tGrad;
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();

      // Kule kenar metalik çerçevesi (krom halka)
      const bezelG = ctx.createLinearGradient(-13, -13, 13, 13);
      bezelG.addColorStop(0, '#f9fafb'); bezelG.addColorStop(0.5, '#d1d5db'); bezelG.addColorStop(1, '#6b7280');
      ctx.strokeStyle = bezelG; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.stroke();

      // 360° koyu renkli sensör cam halkası (helikopter pervanesi yok, gerçekçi sensör camı)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, Math.PI * 2); ctx.fill();

      // Kule üst kapak
      const capG = ctx.createRadialGradient(-1, -1, 0.5, 0, 0, 7.5);
      capG.addColorStop(0, '#ffffff'); capG.addColorStop(0.6, '#f3f4f6'); capG.addColorStop(1, '#d1d5db');
      ctx.fillStyle = capG;
      ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(156,163,175,0.4)'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, Math.PI * 2); ctx.stroke();

      // Merkez mikro gösterge noktası
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath(); ctx.arc(0, 0, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // ── İLERLEME YÖNÜNDEKİ IŞIN (Sadece gittiği yöne doğru) ──
      if (st === 'Tarama' || st === 'Dolaşma' || st === 'İnceleme' || st === 'Taşıma') {
        ctx.save();
        // İlerleme yönünde hafif doğal tarama salınımı
        const forwardSweep = Math.sin(t * 0.04) * 0.05;
        ctx.rotate(forwardSweep);

        const ld = 150;
        // Robotun önünden ileriye doğru yayılan yumuşak ışın konisi
        const fG = ctx.createRadialGradient(R - 4, 0, 8, R - 4, 0, ld);
        fG.addColorStop(0, 'rgba(59, 130, 246, 0.40)');
        fG.addColorStop(0.25, 'rgba(56, 189, 248, 0.22)');
        fG.addColorStop(0.65, 'rgba(56, 189, 248, 0.07)');
        fG.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = fG;
        ctx.beginPath();
        ctx.moveTo(R - 4, 0);
        ctx.arc(R - 4, 0, ld, -0.28, 0.28);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // ── DURUM LED'İ (kenar ışık halkası) ──
      ctx.save();
      let ledColor = '#3b82f6';
      let ledGlow = 5;
      const breath = 0.5 + 0.5 * Math.sin(t * 0.04);
      if (st === 'Hata') { ledColor = '#ef4444'; ledGlow = 7; }
      else if (st === 'Tamamlama') { ledColor = '#10b981'; ledGlow = 8 + breath * 5; }
      else if (st === 'Tarama') { ledColor = '#06b6d4'; ledGlow = 7; }
      else if (st === 'Taşıma') { ledColor = '#0ea5e9'; ledGlow = 6; }

      ctx.strokeStyle = ledColor; ctx.lineWidth = 1.5;
      ctx.shadowColor = ledColor; ctx.shadowBlur = ledGlow;
      ctx.globalAlpha = 0.6 + breath * 0.4;
      ctx.beginPath(); ctx.arc(0, 0, R - 5, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      ctx.restore();

      // ── KUTLAMA HALO ──
      if (st === 'Tamamlama') {
        const pulse = 1 + Math.sin(t * 0.06) * 0.15;
        ctx.strokeStyle = 'rgba(16,185,129,0.7)';
        ctx.lineWidth = 3; ctx.shadowColor = '#10b981'; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.arc(0, 0, R * pulse + 8, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.restore(); // Robot bitti
      } catch (err) {
        console.error('RobotCanvas render error:', err);
      } finally {
        frameId = requestAnimationFrame(render);
      }
    };

    frameId = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frameId); Runner.stop(runner); Engine.clear(engine); };
  }, [files]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
