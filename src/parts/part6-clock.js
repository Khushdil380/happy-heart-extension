// src/parts/part6-clock.js

export function initClock() {
    const clockElement = document.getElementById('part6-clock');
    if (!clockElement) {
        console.error('Clock element not found!');
        return;
    }

    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateString = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        clockElement.innerHTML = `
            <div class="time">${timeString}</div>
            <div class="date">${dateString}</div>
        `;
    }

    updateClock(); // Initial display
    setInterval(updateClock, 1000); // Update every second
}


