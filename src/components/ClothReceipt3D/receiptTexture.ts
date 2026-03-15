// ClothReceipt3D — 2D Canvas texture generation and WebGL shaders

import { createCanvasElement } from "@/utils/createCanvasElement";
import type { ReceiptEvent } from './receiptEventData.ts';

export function createReceiptTexture(event: ReceiptEvent, logoImg?: HTMLImageElement): HTMLCanvasElement {
    const texCanvas = createCanvasElement({
        width: 1024,
        height: 2048,
    });
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

    // Title
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
    ctx.fillText('\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━', W / 2, 270);

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

export const VS_SOURCE = `
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

export const FS_SOURCE = `
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
