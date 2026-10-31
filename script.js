document.addEventListener("DOMContentLoaded", () => {
    // Kursor "me"
    const cursor = document.createElement("div");
    cursor.className = "cursor-tooltip";
    cursor.innerText = "me";
    document.body.appendChild(cursor);
    document.addEventListener("mousemove", (e) => {
        cursor.style.left = e.clientX + "px";
        cursor.style.top = e.clientY + "px";
    });

    // Generate 92 Reasons otomatis
    const reasonsGrid = document.getElementById("reasonsGrid");
    if (reasonsGrid) {
        const reasons = [
            "The way you make kids happy", "The way you give what I need", "The way you hug me",
            "The way you care for me", "The way you root for me", "The way to make me laugh",
            "The way you make me feel handsome", "The way you compliments me", "The way how you spent time with me",
            "The way you handle things", "The way you surpass your problems", "How you so excited to see me",
            "How you miss me", "How you feed me", "Giving me strength", "Advising me",
            "Helping me", "Understands me", "Patience with me", "The way we gossiping together",
            "The way you scolding me", "The way you make me blush", "Embarrasing me", "Your discipline",
            "Being sleepy head", "The way you texts me", "The way how confident you are", "Your determination",
            "The way you listens to me", "The way you teach me", "The way you being real", "The way you holds me",
            "The way you care for our relationship", "The way you treat your family", "The way makeups",
            "The way admires me", "Giving me reasons to live", "Giving me hopes", "The way you believe me",
            "The way you boost my confident", "The way you comfort me", "The way you talking about our future",
            "The way you want to be my wife", "The way you cook", "The way you smile", "The way you sleep",
            "The way you say my name", "The way you hold my hand", "The way you look at me", "The way you kiss me"
        ];

        for (let i = 1; i <= 92; i++) {
            const text = reasons[(i - 1) % reasons.length];
            const card = document.createElement("div");
            card.className = "reason-card";
            card.innerHTML = `<strong>Reason ${i}:</strong> ${text}`;
            reasonsGrid.appendChild(card);
        }
    }
});
