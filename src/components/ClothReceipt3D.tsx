import React, { useRef, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════
// Dinamik Etkinlik Sistemi
// ═══════════════════════════════════════════════
interface ReceiptEvent {
    title: string;
    emoji: string;
    subtitle: string;
    items: { name: string; price: string }[];
    footer: string;
    accentColor: string;
    decorations: string[]; // Emoji decorations to scatter
}

function getTodayEvent(): ReceiptEvent {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const year = now.getFullYear();

    // Ramazan & Kurban Bayramı tarihleri (Hicri takvime göre her yıl ~11 gün kayar)
    const islamicHolidays: Record<number, { ramazan: [number, number, number, number]; kurban: [number, number, number, number] }> = {
        2025: { ramazan: [3, 30, 4, 1], kurban: [6, 6, 6, 9] },
        2026: { ramazan: [3, 20, 3, 22], kurban: [5, 27, 5, 30] },
        2027: { ramazan: [3, 9, 3, 11], kurban: [5, 16, 5, 18] },
        2028: { ramazan: [2, 27, 2, 29], kurban: [5, 4, 5, 6] },
    };

    const holidays = islamicHolidays[year];
    if (holidays) {
        // Tarih aralığı kontrolü (ay geçişlerini de destekler)
        const inRange = (m: number, d: number, m1: number, d1: number, m2: number, d2: number) => {
            if (m1 === m2) return m === m1 && d >= d1 && d <= d2;
            if (m === m1) return d >= d1;
            if (m === m2) return d <= d2;
            return m > m1 && m < m2;
        };

        const [rM1, rD1, rM2, rD2] = holidays.ramazan;
        if (inRange(month, day, rM1, rD1, rM2, rD2)) {
            return {
                title: 'RAMAZAN BAYRAMI',
                emoji: '�',
                subtitle: 'Bayramınız Mübarek Olsun!',
                accentColor: '#059669',
                items: [],
                footer: 'Huzur, sevgi ve bereket dolu bir bayram!',
                decorations: ['�', '⭐', '🕌', '✨', '🤲', '💚', '🌟', '�'],
            };
        }
        const [kM1, kD1, kM2, kD2] = holidays.kurban;
        if (inRange(month, day, kM1, kD1, kM2, kD2)) {
            return {
                title: 'KURBAN BAYRAMI',
                emoji: '🌙',
                subtitle: 'Bayramınız Mübarek Olsun!',
                accentColor: '#0d9488',
                items: [],
                footer: 'Paylaşmanın ve birliğin bayramı!',
                decorations: ['🌙', '⭐', '�', '✨', '🤲', '💙', '🌟', '�'],
            };
        }
    }

    // 8 Mart - Dünya Kadınlar Günü
    if (month === 3 && day === 8) {
        return {
            title: '8 MART',
            emoji: '💜',
            subtitle: 'Dünya Kadınlar Günü',
            accentColor: '#9333ea',
            items: [],
            footer: 'Kadınlar her yerde, her zaman güçlü! �',
            decorations: ['💜', '🌸', '�', '💐', '💕', '🦋', '✨', '🌺'],
        };
    }

    // 23 Nisan - Ulusal Egemenlik ve Çocuk Bayramı
    if (month === 4 && day === 23) {
        return {
            title: '23 NİSAN',
            emoji: '🇹🇷',
            subtitle: 'Çocuk Bayramı Kutlu Olsun!',
            accentColor: '#dc2626',
            items: [],
            footer: 'Egemenlik kayıtsız şartsız milletindir!',
            decorations: ['🎈', '🎉', '🎊', '�', '�', '🎀', '⭐', '🎵'],
        };
    }

    // 19 Mayıs - Gençlik ve Spor Bayramı
    if (month === 5 && day === 19) {
        return {
            title: '19 MAYIS',
            emoji: '�🇷',
            subtitle: 'Gençlik ve Spor Bayramı',
            accentColor: '#dc2626',
            items: [],
            footer: 'Gençliğe hitabe ile ilham al!',
            decorations: ['🔥', '⚡', '💪', '�', '�', '🌟', '🚀', '�'],
        };
    }

    // 15 Temmuz - Demokrasi ve Milli Birlik Günü
    if (month === 7 && day === 15) {
        return {
            title: '15 TEMMUZ',
            emoji: '🇹🇷',
            subtitle: 'Demokrasi ve Milli Birlik Günü',
            accentColor: '#dc2626',
            items: [],
            footer: 'Milletin iradesine saygı!',
            decorations: ['🇹🇷', '✊', '�️', '⭐', '🔥', '�', '✨', '🏛️'],
        };
    }

    // 30 Ağustos - Zafer Bayramı
    if (month === 8 && day === 30) {
        return {
            title: '30 AĞUSTOS',
            emoji: '🇹🇷',
            subtitle: 'Zafer Bayramı Kutlu Olsun!',
            accentColor: '#dc2626',
            items: [],
            footer: 'Ordular, ilk hedefiniz Akdenizdir, ileri!',
            decorations: ['🇹🇷', '⚔️', '🏅', '🦅', '🔥', '⭐', '✨', '🎖️'],
        };
    }

    // 29 Ekim - Cumhuriyet Bayramı
    if (month === 10 && day === 29) {
        return {
            title: '29 EKİM',
            emoji: '🇹🇷',
            subtitle: 'Cumhuriyet Bayramı Kutlu Olsun!',
            accentColor: '#dc2626',
            items: [],
            footer: 'Cumhuriyet ilelebet payidar kalacaktır!',
            decorations: ['🇹🇷', '⭐', '🏛️', '🎉', '🎊', '🕊️', '🔥', '✨'],
        };
    }

    // 10 Kasım - Atatürk'ü Anma Günü
    if (month === 11 && day === 10) {
        return {
            title: '10 KASIM',
            emoji: '🖤',
            subtitle: "Atatürk'ü Anıyoruz",
            accentColor: '#1a1a2e',
            items: [],
            footer: 'Hayatta en hakiki mürşit ilimdir.',
            decorations: ['🖤', '📚', '🕯️', '🌹', '🎓', '✨'],
        };
    }

    // 1 Ocak - Yeni Yıl
    if (month === 1 && day === 1) {
        return {
            title: 'YENİ YIL',
            emoji: '🎉',
            subtitle: 'Mutlu Yıllar!',
            accentColor: '#f59e0b',
            items: [],
            footer: 'Yeni yılınız kutlu olsun! 🥳',
            decorations: ['🎉', '🎊', '🥂', '🎆', '🎇', '✨', '🌟', '🎁'],
        };
    }

    // 14 Şubat - Sevgililer Günü
    if (month === 2 && day === 14) {
        return {
            title: 'SEVGİLİLER GÜNÜ',
            emoji: '❤️',
            subtitle: '14 Şubat',
            accentColor: '#e11d48',
            items: [],
            footer: 'Sevgi her şeyin başıdır! 💖',
            decorations: ['❤️', '💕', '💝', '💗', '🌹', '💐', '😍', '✨'],
        };
    }

    // Varsayılan — BilsemC2 tanıtım fişi
    return {
        title: 'BİLSEMC2',
        emoji: '🧠',
        subtitle: 'Çocuğunuzun Geleceği ile Oynayın',
        accentColor: '#7e30e1',
        items: [
            { name: 'Zeka Oyunları', price: '57+' },
            { name: 'Sınav Simülasyonu', price: '25 mod' },
            { name: 'Müzik Atölyesi', price: '🎵' },
            { name: 'Resim Atölyesi', price: '🎨' },
            { name: 'Genel Yetenek', price: '💡' },
        ],
        footer: 'bilsemc2.com • Beynini Kullan!',
        decorations: ['🧠', '⭐', '🎮', '💡', '🚀', '✨', '🎯', '🏆'],
    };
}

// ═══════════════════════════════════════════════
// Texture Oluşturma (2D Canvas)
// ═══════════════════════════════════════════════
function createReceiptTexture(event: ReceiptEvent, logoImg?: HTMLImageElement): HTMLCanvasElement {
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 1024;
    texCanvas.height = 2048;
    const ctx = texCanvas.getContext('2d')!;

    ctx.scale(2, 2);
    const W = 512;
    const H = 1024;

    // Paper background
    ctx.fillStyle = '#f8f8f4';
    ctx.fillRect(0, 0, W, H);

    // Subtle paper grain
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 2000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#666';
        ctx.fillRect(
            Math.random() * W,
            Math.random() * H,
            Math.random() * 2,
            Math.random() * 2
        );
    }
    ctx.globalAlpha = 1;

    // Accent stripe at top
    ctx.fillStyle = event.accentColor;
    ctx.fillRect(0, 0, W, 14);

    // Logo or emoji
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        const logoSize = 200;
        ctx.drawImage(logoImg, W / 2 - logoSize / 2, 18, logoSize, logoSize);
    } else {
        ctx.font = '48px serif';
        ctx.textAlign = 'center';
        ctx.fillText(event.emoji, W / 2, 80);
    }

    // Title — büyük ve dikkat çekici
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 44px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(event.title, W / 2, 250);

    // Subtitle
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = event.accentColor;
    ctx.fillText(event.subtitle, W / 2, 290);

    // Divider
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ccc';
    ctx.fillText('━━━━━━━━━━━━━━━━━━━━━━━━', W / 2, 270);

    // Banner area
    ctx.fillStyle = event.accentColor;
    ctx.fillRect(30, 300, W - 60, 70);

    // Banner label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⭐ BİLSEMC2 ⭐', W / 2, 345);

    // Footer
    ctx.fillStyle = '#555';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(event.footer, W / 2, 430);

    // URL
    ctx.fillStyle = '#aaa';
    ctx.font = '16px monospace';
    ctx.fillText('bilsemc2.com', W / 2, 465);

    // Scattered decorations
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.5;
    const decoPositions = [
        { x: 60, y: 500 }, { x: 180, y: 510 }, { x: 320, y: 495 },
        { x: 440, y: 505 }, { x: 100, y: 560 }, { x: 260, y: 570 },
        { x: 400, y: 555 }, { x: 50, y: 620 }, { x: 200, y: 630 },
        { x: 350, y: 615 }, { x: 460, y: 625 }, { x: 130, y: 680 },
        { x: 300, y: 690 }, { x: 430, y: 675 }, { x: 80, y: 740 },
        { x: 240, y: 750 }, { x: 380, y: 735 }, { x: 160, y: 800 },
        { x: 340, y: 810 }, { x: 460, y: 795 },
    ];
    decoPositions.forEach((pos, i) => {
        const emoji = event.decorations[i % event.decorations.length];
        ctx.font = `${20 + (i % 3) * 8}px serif`;
        ctx.globalAlpha = 0.3 + (i % 4) * 0.1;
        ctx.fillText(emoji, pos.x, pos.y);
    });
    ctx.globalAlpha = 1;

    // Bottom accent stripe
    ctx.fillStyle = event.accentColor;
    ctx.fillRect(0, H - 14, W, 14);

    // Zigzag cut at bottom
    ctx.fillStyle = '#f8f8f4';
    for (let x = 0; x < W; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, H);
        ctx.lineTo(x + 8, H - 12);
        ctx.lineTo(x + 16, H);
        ctx.fill();
    }

    return texCanvas;
}

// ═══════════════════════════════════════════════
// WebGL Shaders
// ═══════════════════════════════════════════════
const VS_SOURCE = `
  attribute vec3 a_pos;
  attribute vec3 a_norm;
  attribute vec2 a_uv;
  uniform mat4 u_proj;
  uniform mat4 u_view;
  varying vec3 v_norm;
  varying vec2 v_uv;
  void main() {
    v_norm = a_norm;
    v_uv = a_uv;
    gl_Position = u_proj * u_view * vec4(a_pos, 1.0);
  }
`;

const FS_SOURCE = `
  precision mediump float;
  varying vec3 v_norm;
  varying vec2 v_uv;
  uniform sampler2D u_tex;
  void main() {
    vec3 norm = normalize(v_norm);
    if (!gl_FrontFacing) norm = -norm;
    
    vec3 lightDir1 = normalize(vec3(0.4, 0.8, 0.6));
    vec3 lightDir2 = normalize(vec3(-0.5, -0.2, 0.8));
    
    float diff1 = max(dot(norm, lightDir1), 0.0);
    float diff2 = max(dot(norm, lightDir2), 0.0);
    float ambient = 0.55;
    
    vec4 texColor = texture2D(u_tex, v_uv);
    vec3 finalColor = texColor.rgb * (ambient + diff1 * 0.4 + diff2 * 0.2);
    
    gl_FragColor = vec4(finalColor, texColor.a);
  }
`;

// ═══════════════════════════════════════════════
// Ana Bileşen
// ═══════════════════════════════════════════════
interface ClothReceipt3DProps {
    className?: string;
}

const ClothReceipt3D: React.FC<ClothReceipt3DProps> = ({ className = '' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const setupWebGL = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
        if (!gl) return;

        // Responsive canvas
        const container = containerRef.current;
        if (!container) return;

        const resizeCanvas = () => {
            const dpr = Math.min(window.devicePixelRatio, 2);
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        resizeCanvas();

        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(container);

        // Shader compilation
        function createShader(type: number, source: string) {
            const s = gl!.createShader(type)!;
            gl!.shaderSource(s, source);
            gl!.compileShader(s);
            return s;
        }

        const program = gl.createProgram()!;
        gl.attachShader(program, createShader(gl.VERTEX_SHADER, VS_SOURCE));
        gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, FS_SOURCE));
        gl.linkProgram(program);
        gl.useProgram(program);

        const aPos = gl.getAttribLocation(program, 'a_pos');
        const aNorm = gl.getAttribLocation(program, 'a_norm');
        const aUv = gl.getAttribLocation(program, 'a_uv');
        const uProj = gl.getUniformLocation(program, 'u_proj');
        const uView = gl.getUniformLocation(program, 'u_view');

        // Texture
        const event = getTodayEvent();
        const texCanvas = createReceiptTexture(event);

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texCanvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Load logo and update texture with it
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
            const updatedTex = createReceiptTexture(event, logoImg);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, updatedTex);
        };
        logoImg.src = '/images/logo2.webp';

        // Physics mesh
        const numX = 20;
        const numY = 40;
        const numParticles = numX * numY;
        const width = 2.4;
        const height = 4.8;

        interface Particle {
            x: number; y: number; z: number;
            ox: number; oy: number; oz: number;
        }

        const particles: Particle[] = [];
        const uvData = new Float32Array(numParticles * 2);
        const posData = new Float32Array(numParticles * 3);
        const normalData = new Float32Array(numParticles * 3);

        for (let y = 0; y < numY; y++) {
            for (let x = 0; x < numX; x++) {
                const px = (x / (numX - 1) - 0.5) * width;
                const py = -(y / (numY - 1)) * height;
                const i = y * numX + x;
                particles.push({ x: px, y: py, z: 0, ox: px, oy: py, oz: 0 });
                uvData[i * 2] = x / (numX - 1);
                uvData[i * 2 + 1] = y / (numY - 1);
            }
        }

        // Constraints
        interface Constraint {
            p1: number; p2: number; rest: number;
        }
        const constraints: Constraint[] = [];

        function addC(i1: number, i2: number) {
            const dx = particles[i2].x - particles[i1].x;
            const dy = particles[i2].y - particles[i1].y;
            const dz = particles[i2].z - particles[i1].z;
            constraints.push({ p1: i1, p2: i2, rest: Math.sqrt(dx * dx + dy * dy + dz * dz) });
        }

        for (let y = 0; y < numY; y++) {
            for (let x = 0; x < numX; x++) {
                const i = y * numX + x;
                if (x < numX - 1) addC(i, i + 1);
                if (y < numY - 1) addC(i, i + numX);
                if (x < numX - 1 && y < numY - 1) {
                    addC(i, i + numX + 1);
                    addC(i + 1, i + numX);
                }
                if (x < numX - 2) addC(i, i + 2);
                if (y < numY - 2) addC(i, i + numX * 2);
            }
        }

        // Index buffer
        const indices: number[] = [];
        for (let y = 0; y < numY - 1; y++) {
            for (let x = 0; x < numX - 1; x++) {
                const i = y * numX + x;
                indices.push(i, i + 1, i + numX);
                indices.push(i + 1, i + numX + 1, i + numX);
            }
        }

        const posBuf = gl.createBuffer();
        const normBuf = gl.createBuffer();

        const uvBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
        gl.bufferData(gl.ARRAY_BUFFER, uvData, gl.STATIC_DRAW);

        const idxBuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        gl.enable(gl.DEPTH_TEST);

        // Matrices
        const projMatrix = new Float32Array(16);
        const viewMatrix = new Float32Array(16);

        function setPerspective(out: Float32Array, fovy: number, aspect: number, near: number, far: number) {
            const f = 1.0 / Math.tan(fovy / 2);
            const nf = 1 / (near - far);
            out.fill(0);
            out[0] = f / aspect;
            out[5] = f;
            out[10] = (far + near) * nf;
            out[11] = -1;
            out[14] = (2 * far * near) * nf;
        }

        function setTranslation(out: Float32Array, x: number, y: number, z: number) {
            out.fill(0);
            out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1;
            out[12] = x; out[13] = y; out[14] = z;
        }

        const camPos = { x: 0, y: -1.8, z: 7.0 };
        const fov = 45 * Math.PI / 180;

        // Interaction
        let grabbedIndex = -1;
        let grabDepth = 0;
        let pointerX = 0;
        let pointerY = 0;

        function getRay() {
            const aspect = canvas!.width / canvas!.height;
            const tanFov = Math.tan(fov / 2);
            const dx = pointerX * aspect * tanFov;
            const dy = pointerY * tanFov;
            const dz = -1;
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
            return {
                origin: { x: camPos.x, y: camPos.y, z: camPos.z },
                dir: { x: dx / len, y: dy / len, z: dz / len },
            };
        }

        function updatePointer(e: PointerEvent) {
            const rect = canvas!.getBoundingClientRect();
            pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointerY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        }

        const onPointerDown = (e: PointerEvent) => {
            updatePointer(e);
            const ray = getRay();
            let minDist = Infinity;
            let bestIdx = -1;

            for (let i = 0; i < numParticles; i++) {
                const p = particles[i];
                const vx = p.x - ray.origin.x;
                const vy = p.y - ray.origin.y;
                const vz = p.z - ray.origin.z;
                const t = vx * ray.dir.x + vy * ray.dir.y + vz * ray.dir.z;
                const px2 = ray.origin.x + ray.dir.x * t;
                const py2 = ray.origin.y + ray.dir.y * t;
                const pz2 = ray.origin.z + ray.dir.z * t;
                const ddx = p.x - px2;
                const ddy = p.y - py2;
                const ddz = p.z - pz2;
                const dist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
                if (dist < minDist && dist < 0.8) {
                    minDist = dist;
                    bestIdx = i;
                    grabDepth = t;
                }
            }
            if (bestIdx !== -1) {
                grabbedIndex = bestIdx;
                canvas!.style.cursor = 'grabbing';
            }
        };

        const onPointerMove = (e: PointerEvent) => {
            updatePointer(e);
            if (grabbedIndex !== -1) {
                const ray = getRay();
                const p = particles[grabbedIndex];
                p.x = ray.origin.x + ray.dir.x * grabDepth;
                p.y = ray.origin.y + ray.dir.y * grabDepth;
                p.z = ray.origin.z + ray.dir.z * grabDepth;
                p.ox = p.x; p.oy = p.y; p.oz = p.z;
            }
        };

        const onPointerUp = () => {
            grabbedIndex = -1;
            if (canvas) canvas.style.cursor = 'grab';
        };

        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);

        // Render loop
        let time = 0;
        function render() {
            time += 0.016;

            // Physics
            const windX = Math.sin(time * 1.5) * 0.001;
            const windZ = Math.cos(time * 1.1) * 0.001;

            for (let i = 0; i < numParticles; i++) {
                if (i < numX || i === grabbedIndex) continue;
                const p = particles[i];
                const vx = (p.x - p.ox) * 0.985;
                const vy = (p.y - p.oy) * 0.985;
                const vz = (p.z - p.oz) * 0.985;
                p.ox = p.x; p.oy = p.y; p.oz = p.z;
                const windFactor = (p.y / -height);
                p.x += vx + windX * windFactor;
                p.y += vy - 0.006;
                p.z += vz + windZ * windFactor;
            }

            // Constraint relaxation
            for (let iter = 0; iter < 12; iter++) {
                for (let i = 0; i < constraints.length; i++) {
                    const c = constraints[i];
                    const p1 = particles[c.p1];
                    const p2 = particles[c.p2];
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dz = p2.z - p1.z;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    const w1 = (c.p1 < numX || c.p1 === grabbedIndex) ? 0 : 1;
                    const w2 = (c.p2 < numX || c.p2 === grabbedIndex) ? 0 : 1;
                    const wSum = w1 + w2;
                    if (wSum > 0) {
                        const diff = (dist - c.rest) / (dist * wSum);
                        const ox = dx * diff;
                        const oy = dy * diff;
                        const oz = dz * diff;
                        if (w1) { p1.x += ox; p1.y += oy; p1.z += oz; }
                        if (w2) { p2.x -= ox; p2.y -= oy; p2.z -= oz; }
                    }
                }
            }

            // Update buffers
            normalData.fill(0);
            for (let i = 0; i < numParticles; i++) {
                const p = particles[i];
                posData[i * 3] = p.x;
                posData[i * 3 + 1] = p.y;
                posData[i * 3 + 2] = p.z;
            }

            for (let i = 0; i < indices.length; i += 3) {
                const i1 = indices[i], i2 = indices[i + 1], i3 = indices[i + 2];
                const v1x = posData[i1 * 3], v1y = posData[i1 * 3 + 1], v1z = posData[i1 * 3 + 2];
                const v2x = posData[i2 * 3], v2y = posData[i2 * 3 + 1], v2z = posData[i2 * 3 + 2];
                const v3x = posData[i3 * 3], v3y = posData[i3 * 3 + 1], v3z = posData[i3 * 3 + 2];
                const dx1 = v2x - v1x, dy1 = v2y - v1y, dz1 = v2z - v1z;
                const dx2 = v3x - v1x, dy2 = v3y - v1y, dz2 = v3z - v1z;
                const nx = dy1 * dz2 - dz1 * dy2;
                const ny = dz1 * dx2 - dx1 * dz2;
                const nz = dx1 * dy2 - dy1 * dx2;
                normalData[i1 * 3] += nx; normalData[i1 * 3 + 1] += ny; normalData[i1 * 3 + 2] += nz;
                normalData[i2 * 3] += nx; normalData[i2 * 3 + 1] += ny; normalData[i2 * 3 + 2] += nz;
                normalData[i3 * 3] += nx; normalData[i3 * 3 + 1] += ny; normalData[i3 * 3 + 2] += nz;
            }

            // Render
            gl!.clearColor(0, 0, 0, 0);
            gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);

            const aspect = canvas!.width / canvas!.height;
            setPerspective(projMatrix, fov, aspect, 0.1, 100.0);
            setTranslation(viewMatrix, -camPos.x, -camPos.y, -camPos.z);

            gl!.uniformMatrix4fv(uProj, false, projMatrix);
            gl!.uniformMatrix4fv(uView, false, viewMatrix);

            gl!.bindBuffer(gl!.ARRAY_BUFFER, posBuf);
            gl!.bufferData(gl!.ARRAY_BUFFER, posData, gl!.DYNAMIC_DRAW);
            gl!.enableVertexAttribArray(aPos);
            gl!.vertexAttribPointer(aPos, 3, gl!.FLOAT, false, 0, 0);

            gl!.bindBuffer(gl!.ARRAY_BUFFER, normBuf);
            gl!.bufferData(gl!.ARRAY_BUFFER, normalData, gl!.DYNAMIC_DRAW);
            gl!.enableVertexAttribArray(aNorm);
            gl!.vertexAttribPointer(aNorm, 3, gl!.FLOAT, false, 0, 0);

            gl!.bindBuffer(gl!.ARRAY_BUFFER, uvBuf);
            gl!.enableVertexAttribArray(aUv);
            gl!.vertexAttribPointer(aUv, 2, gl!.FLOAT, false, 0, 0);

            gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, idxBuf);
            gl!.drawElements(gl!.TRIANGLES, indices.length, gl!.UNSIGNED_SHORT, 0);

            animRef.current = requestAnimationFrame(render);
        }

        animRef.current = requestAnimationFrame(render);

        // Cleanup return
        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animRef.current);
            canvas.removeEventListener('pointerdown', onPointerDown);
            canvas.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
            // Clean up WebGL resources
            gl.deleteProgram(program);
            gl.deleteBuffer(posBuf);
            gl.deleteBuffer(normBuf);
            gl.deleteBuffer(uvBuf);
            gl.deleteBuffer(idxBuf);
            gl.deleteTexture(tex);
        };
    }, []);

    useEffect(() => {
        const cleanup = setupWebGL();
        return cleanup;
    }, [setupWebGL]);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <canvas
                ref={canvasRef}
                className="w-full h-full cursor-grab touch-none"
                style={{ display: 'block' }}
            />
            <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-slate-400 font-semibold pointer-events-none select-none opacity-70">
                Fişi tut ve sürükle ✋
            </p>
        </div>
    );
};

export default ClothReceipt3D;
