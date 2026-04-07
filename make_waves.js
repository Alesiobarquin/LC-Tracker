const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const startIdx = code.indexOf('class Particle {');
const endIdx = code.indexOf('const init = () => {', startIdx);

const newParticleClass = "class Particle {\n" +
"      x: number;\n" +
"      y: number;\n" +
"      baseX: number;\n" +
"      baseY: number;\n" +
"      size: number;\n" +
"      baseSize: number;\n" +
"      colorPhase: number;\n" +
"\n" +
"      constructor(x: number, y: number) {\n" +
"        this.baseX = x;\n" +
"        this.baseY = y;\n" +
"        this.x = x;\n" +
"        this.y = y;\n" +
"        this.baseSize = Math.random() * 2 + 1.5;\n" +
"        this.size = this.baseSize;\n" +
"        this.colorPhase = Math.random() * 360;\n" +
"      }\n" +
"\n" +
"      draw() {\n" +
"        if (!ctx) return;\n" +
"        const hue = (Math.sin(this.baseX * 0.005 + time) * 180) + \n" +
"                    (Math.cos(this.baseY * 0.005 - time * 1.5) * 180) + \n" +
"                    (time * 50);\n" +
"        const lightness = 50 + Math.sin(time * 2 + this.baseX * 0.01) * 20;\n" +
"        const alpha = Math.min((this.size / 3) + 0.3, 1);\n" +
"        ctx.fillStyle = `hsla(${Math.abs(hue % 360)}, 100%, ${lightness}%, ${alpha})`;\n" +
"        ctx.beginPath();\n" +
"        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);\n" +
"        ctx.closePath();\n" +
"        ctx.fill();\n" +
"        const dx = mouse.x - this.x;\n" +
"        const dy = mouse.y - this.y;\n" +
"        const distance = Math.sqrt(dx * dx + dy * dy);\n" +
"        if (distance < mouseRadius * 0.7) {\n" +
"            ctx.beginPath();\n" +
"            ctx.strokeStyle = `hsla(${Math.abs((hue + 180) % 360)}, 100%, 65%, ${(mouseRadius * 0.7 - distance) / (mouseRadius * 0.7) * 0.8})`;\n" +
"            ctx.lineWidth = 1.5 + (mouseRadius * 0.7 - distance) * 0.01;\n" +
"            ctx.moveTo(this.x, this.y);\n" +
"            ctx.lineTo(mouse.x, mouse.y);\n" +
"            ctx.stroke();\n" +
"        }\n" +
"      }\n" +
"\n" +
"      update() {\n" +
"        const waveX = Math.sin(this.baseX * 0.008 + time * 1.5) * 40;\n" +
"        const waveY = Math.cos(this.baseY * 0.008 + time * 1.2) * 40;\n" +
"        const wavePulsar = Math.sin(this.baseX * 0.01 + time * 2) * Math.cos(this.baseY * 0.01 - time * 2);\n" +
"        this.baseSize = 2 + wavePulsar * 5;\n" +
"        const dx = mouse.x - this.baseX;\n" +
"        const dy = mouse.y - this.baseY;\n" +
"        const distance = Math.sqrt(dx * dx + dy * dy);\n" +
"        if (distance < mouseRadius) {\n" +
"          const force = (mouseRadius - distance) / mouseRadius;\n" +
"          const targetX = this.baseX + dx * force * pullStrength;\n" +
"          const targetY = this.baseY + dy * force * pullStrength;\n" +
"          this.x += (targetX - this.x) * 0.6;\n" +
"          this.y += (targetY - this.y) * 0.6;\n" +
"          this.size = this.baseSize + (force * 15);\n" +
"        } else {\n" +
"          const driftX = this.baseX + waveX;\n" +
"          const driftY = this.baseY + waveY;\n" +
"          if (this.x !== driftX) this.x -= (this.x - driftX) * returnSpeed;\n" +
"          if (this.y !== driftY) this.y -= (this.y - driftY) * returnSpeed;\n" +
"          this.size = Math.max(this.baseSize, this.size - 0.1);\n" +
"        }\n" +
"        this.draw();\n" +
"      }\n" +
"    }\n\n    ";

code = code.substring(0, startIdx) + newParticleClass + code.substring(endIdx);

const animStart = code.indexOf('const animateParams = () => {');
const animEnd = code.indexOf('};', animStart) + 2;

const newAnim = "const animateParams = () => {\n" +
"      time += 0.015;\n" +
"      ctx.clearRect(0, 0, canvas.width, canvas.height);\n" +
"      particles.forEach(p => p.update());\n" +
"      animationFrameId = requestAnimationFrame(animateParams);\n" +
"    };";

code = code.substring(0, animStart) + newAnim + code.substring(animEnd);

fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log("Waves applied!");
