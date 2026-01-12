"use client";
import React, { useEffect, useRef } from 'react';

interface LiquidBackgroundProps {
  evaporation?: number; // 0 to 1
  scrollOffset?: number; // Current scroll position for parallax
}

const LiquidBackground: React.FC<LiquidBackgroundProps> = ({ evaporation = 0, scrollOffset = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ evaporation, scrollOffset });

  useEffect(() => {
    stateRef.current = { evaporation, scrollOffset };
  }, [evaporation, scrollOffset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision highp float;
      uniform float u_time;
      uniform float u_evaporation;
      uniform float u_scroll;
      uniform vec2 u_resolution;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        float ratio = u_resolution.x / u_resolution.y;
        vec2 p = (uv - 0.5) * 1.6;
        p.x *= ratio;

        p.y += u_scroll * 0.4;

        float t = u_time * 0.12;
        
        // Fluid structure
        float n1 = snoise(vec3(p * 0.4, t));
        float n2 = snoise(vec3(p * 0.9 + n1 * 1.2, t * 0.7));
        float f = n2 * 0.5 + 0.5;

        // Smooth out for evaporation
        float smoothEvap = smoothstep(0.0, 1.0, u_evaporation);
        float visibleF = mix(f, 0.0, smoothEvap * 1.4);

        // Gradient Colors inspired by the photo:
        // Vibrant Magenta/Pink
        vec3 col1 = vec3(1.0, 0.05, 0.55); 
        // Bright Blue
        vec3 col2 = vec3(0.1, 0.4, 1.0);
        // Soft Purple/White Highlight
        vec3 col3 = vec3(0.9, 0.7, 1.0);
        // Deep Background Blue/Black
        vec3 col4 = vec3(0.02, 0.02, 0.1);

        // Map colors based on noise and screen position to create that split-gradient look
        float colorMix = snoise(vec3(p * 0.2, t * 0.1)) * 0.5 + 0.5;
        vec3 fluidBase = mix(col1, col2, colorMix + uv.y * 0.3);
        
        // Final color composition
        vec3 color = mix(col4, fluidBase, visibleF);
        
        // Specular and light peaks
        float spec = pow(visibleF, 8.0);
        color = mix(color, col3, spec * 0.6);
        
        // Final glowing highlights
        color += pow(visibleF, 14.0) * 0.4;

        // Desaturate slightly as it evaporates for a "dying ember" feel
        color = mix(color, vec3(length(color) * 0.2), smoothEvap * 0.8);

        // Global mask
        color *= (1.0 - smoothstep(0.98, 1.0, u_evaporation));

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vertexShaderSource));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const evapLoc = gl.getUniformLocation(program, 'u_evaporation');
    const scrollLoc = gl.getUniformLocation(program, 'u_scroll');
    const resLoc = gl.getUniformLocation(program, 'u_resolution');

    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        gl.viewport(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    };
    window.addEventListener('resize', resize);
    resize();

    let frame: number;
    const render = (time: number) => {
      gl.uniform1f(timeLoc, time * 0.001);
      gl.uniform1f(evapLoc, stateRef.current.evaporation);
      gl.uniform1f(scrollLoc, stateRef.current.scrollOffset);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full block bg-black" />;
};

export default LiquidBackground;

