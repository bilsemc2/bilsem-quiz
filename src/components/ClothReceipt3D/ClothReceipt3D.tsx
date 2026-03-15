// ClothReceipt3D — Main React component with WebGL cloth simulation

import React, { useRef, useEffect, useCallback } from 'react';
import { getTodayEvent } from './receiptEventData.ts';
import { createReceiptTexture, VS_SOURCE, FS_SOURCE } from './receiptTexture.ts';

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

        const event = getTodayEvent();
        const texCanvas = createReceiptTexture(event);

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texCanvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

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

        let time = 0;
        function render() {
            time += 0.016;

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

        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animRef.current);
            canvas.removeEventListener('pointerdown', onPointerDown);
            canvas.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
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
                Fişi tut ve sürükle \✋
            </p>
        </div>
    );
};

export default ClothReceipt3D;
