function initBeeAnimation() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }
    const existingContainer = document.querySelector(".bee-container");
    if (existingContainer) {
        existingContainer.remove();
    }
    const styleId = "bee-animation-styles";
    if (!document.getElementById(styleId)) {
        const styleSheet = document.createElement("style");
        styleSheet.id = styleId;
        styleSheet.textContent = `
            @keyframes flutterLeft {
                0% { transform: rotate(-60deg) scaleX(1); }
                50% { transform: rotate(-30deg) scaleX(0.4); opacity: 0.6; }
                100% { transform: rotate(-60deg) scaleX(1); }
            }
            @keyframes flutterRight {
                0% { transform: rotate(60deg) scaleX(1); }
                50% { transform: rotate(30deg) scaleX(0.4); opacity: 0.6; }
                100% { transform: rotate(60deg) scaleX(1); }
            }
            .bee-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                overflow: hidden;
                pointer-events: none;
                z-index: 10;
                contain: layout style paint;
            }
            .flying-bee {
                will-change: transform;
                position: absolute;
                top: 0;
                left: 0;
                width: 55px;
                height: 55px;
                transform: translateZ(0);
                backface-visibility: hidden;
                perspective: 1000px;
                filter: drop-shadow(0 3px 6px rgba(0,0,0,0.25));
            }
            .flying-bee svg {
                width: 100%;
                height: 100%;
            }
            .wing-left {
                transform-origin: 32px 45px;
                animation: flutterLeft 0.06s infinite ease-in-out;
            }
            .wing-right {
                transform-origin: 68px 45px;
                animation: flutterRight 0.06s infinite ease-in-out;
            }
        `;
        document.head.appendChild(styleSheet);
    }
    const container = document.createElement("div");
    container.className = "bee-container";
    container.setAttribute("aria-hidden", "true");
    const beeSvgContent = `
        <svg viewBox="0 0 100 100" width="100%" height="100%">
            <g transform="rotate(90 50 50)">
                <ellipse class="wing-left" cx="32" cy="45" rx="12" ry="20" fill="rgba(255,255,255,0.85)" />
                <ellipse class="wing-right" cx="68" cy="45" rx="12" ry="20" fill="rgba(255,255,255,0.85)" />
                <path d="M44 22 Q38 12 32 15" stroke="#111" stroke-width="2.5" fill="none" stroke-linecap="round" />
                <path d="M56 22 Q62 12 68 15" stroke="#111" stroke-width="2.5" fill="none" stroke-linecap="round" />
                <circle cx="50" cy="24" r="9" fill="#111111" />
                <circle cx="47" cy="23" r="1.5" fill="#FAFF00" />
                <circle cx="53" cy="23" r="1.5" fill="#FAFF00" />
                <ellipse cx="50" cy="40" rx="14" ry="12" fill="#222" />
                <path d="M 37 45 Q 50 38 63 45 L 58 82 Q 50 88 42 82 Z" fill="#111111" />
                <path d="M39 54 L61 54" stroke="#FAFF00" stroke-width="5" stroke-linecap="round" />
                <path d="M41 65 L59 65" stroke="#FAFF00" stroke-width="5" stroke-linecap="round" />
                <path d="M44 76 L56 76" stroke="#FAFF00" stroke-width="4" stroke-linecap="round" />
            </g>
        </svg>
    `;
    let bees = [];
    const totalBees = 8;
    function resetBee(bee, currentBees = []) {
        let attempts = 0;
        let validY = false;
        while (!validY && attempts < 10) {
            bee.baseY = Math.random() * (window.innerHeight - 250) + 120;
            validY = true;
            for (let other of currentBees) {
                if (other !== bee && Math.abs(other.baseY - bee.baseY) < 70) {
                    validY = false;
                    break;
                }
            }
            attempts++;
        }
        bee.speed = 2.4 + Math.random() * 0.9;
        bee.vy = (Math.random() - 0.5) * 0.6;
        bee.wanderTimer = Math.random() * 80;
        bee.phase = Math.random() * Math.PI * 2;
        bee.x = -300 - (Math.random() * 600);
        bee.currentY = bee.baseY;
    }
    function setupBees() {
        container.innerHTML = "";
        bees = []; 
        const spacingWindow = window.innerWidth + 900;
        for (let i = 0; i < totalBees; i++) {
            const div = document.createElement("div");
            div.className = "flying-bee";
            div.innerHTML = beeSvgContent;
            container.appendChild(div);
            const bee = { element: div };
            resetBee(bee, bees);
            bee.x = -200 - (i * (spacingWindow / totalBees)) - (Math.random() * 100);
            bee.currentY = bee.baseY;
            bees.push(bee);
        }
    }
    setupBees();
    document.body.appendChild(container);
    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            setupBees();
        }, 150);
    });
    let animationId = null;
    let isAnimating = true;
    function animate() {
        if (!isAnimating) return;
        const innerWidth = window.innerWidth;
        const innerHeight = window.innerHeight;
        bees.forEach((bee) => {
            bee.x += bee.speed;
            bee.wanderTimer++;
            if (bee.wanderTimer > 50 + Math.random() * 50) {
                bee.vy = (Math.random() - 0.5) * 0.8;
                bee.wanderTimer = 0;
            }
            bee.baseY += bee.vy;
            const minY = 80;
            const maxY = innerHeight - 150;
            if (bee.baseY < minY) {
                bee.baseY = minY;
                bee.vy = Math.abs(bee.vy);
            } else if (bee.baseY > maxY) {
                bee.baseY = maxY;
                bee.vy = -Math.abs(bee.vy);
            }
            let buzzJitter = Math.sin(bee.x * 0.06 + bee.phase) * 5;
            let desiredY = bee.baseY + buzzJitter;
            const verticalDelta = desiredY - bee.currentY;
            bee.currentY += verticalDelta * 0.08;
            bee.angle = verticalDelta * 1.2;
            if (bee.x > innerWidth + 150) {
                resetBee(bee, bees);
            }
            bee.element.style.transform = `translate3d(${bee.x}px, ${bee.currentY}px, 0) rotate(${bee.angle}deg)`;
        });
        animationId = requestAnimationFrame(animate);
    }
    const handleVisibilityChange = () => {
        if (document.hidden) {
            isAnimating = false;
            if (animationId) cancelAnimationFrame(animationId);
        } else {
            isAnimating = true;
            animationId = requestAnimationFrame(animate);
        }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    animationId = requestAnimationFrame(animate);
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBeeAnimation);
} else {
    initBeeAnimation();
}