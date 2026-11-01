document.addEventListener("DOMContentLoaded", () => {
    
    // 1. TYPEWRITER EFFECT
    const textArray = ["Web Developer.", "Cybersecurity Enthusiast.", "UI/UX Designer.", "Problem Solver."];
    const typingDelay = 100;
    const erasingDelay = 50;
    const newTextDelay = 2000;
    let textArrayIndex = 0;
    let charIndex = 0;
    const typewriterElement = document.getElementById("typewriter");

    function type() {
        if (charIndex < textArray[textArrayIndex].length) {
            typewriterElement.textContent += textArray[textArrayIndex].charAt(charIndex);
            charIndex++;
            setTimeout(type, typingDelay);
        } else {
            setTimeout(erase, newTextDelay);
        }
    }

    function erase() {
        if (charIndex > 0) {
            typewriterElement.textContent = textArray[textArrayIndex].substring(0, charIndex - 1);
            charIndex--;
            setTimeout(erase, erasingDelay);
        } else {
            textArrayIndex++;
            if (textArrayIndex >= textArray.length) textArrayIndex = 0;
            setTimeout(type, typingDelay + 1100);
        }
    }

    if (textArray.length) setTimeout(type, newTextDelay + 250);

    // 2. SCROLL REVEAL ANIMATION
    const reveals = document.querySelectorAll('.reveal');

    function reveal() {
        for (let i = 0; i < reveals.length; i++) {
            const windowHeight = window.innerHeight;
            const elementTop = reveals[i].getBoundingClientRect().top;
            const elementVisible = 100;

            if (elementTop < windowHeight - elementVisible) {
                reveals[i].classList.add('active');
            }
        }
    }

    window.addEventListener('scroll', reveal);
    reveal(); // Trigger on load
});
