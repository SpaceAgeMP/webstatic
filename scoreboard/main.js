'use strict';

const factionToLongTable = {
    freelancer: 'Freelancers',
    starfleet: 'Star Fleet',
    legion: 'The Legion',
    miners: 'Major Miners',
    corporation: 'The Corporation',
    alliance: 'The Alliance',
};

let factionMode = false;

function populateIfExists(id, data, addFaction) {
    const ele = document.getElementById(id);
    if (ele) {
        if (data !== undefined) {
            ele.innerText = data;
        }
        if (addFaction && factionName) {
            ele.classList.add(`faction-${factionName}`);
        }
    }
}

function twoDigitInt(num) {
    if (num < 10) {
        return `0${num}`;
    }
    return num;
}

function formatTime(time) {
    const seconds = time % 60;
	const minutes = Math.floor(time / 60) % 60;
    const hours = Math.floor(time / 3600) % 24;
    const days = Math.floor(time / 86400);

    const resTime = `${hours}:${twoDigitInt(minutes)}:${twoDigitInt(seconds)}`;

    if (days === 1) {
        return `1 day ${resTime}`;
    } else if (days > 1) {
        return `${days} days ${resTime}`;
    }

    return resTime;
}

function addCommasToInt(num) {
    return Number(num).toLocaleString();
}

function formatScoreboard(sb, gb, minI, maxI) {
    const scoreboardContainer = document.getElementById('scoreboards-single');

    for (let i = minI; i < maxI; i++) {
        const place = i + 1;
        const placeData = sb[i];

        const rowCode = `grid-row: ${place - minI}`;

        const sbElement = document.createElement('div');
        sbElement.classList.add(`factionbg-${placeData.faction_name}`);
        sbElement.classList.add('scoreboard');
        sbElement.style = `grid-column: ${gb} / ${gb + 4}; ${rowCode}`;
        scoreboardContainer.appendChild(sbElement);

        const sbPlace = document.createElement('div');
        sbPlace.classList.add('scoreboard-right');
        sbPlace.innerText = `${place}.`;
        sbPlace.style = `grid-column: ${gb}; ${rowCode}`;
        scoreboardContainer.appendChild(sbPlace);
        
        const sbName = document.createElement('div');
        sbName.classList.add('scoreboard-left');
        sbName.innerText = placeData.name || factionToLongTable[placeData.faction_name] || placeData.faction_name || 'N/A';
        sbName.style = `grid-column: ${gb + 1}; ${rowCode}`;
        scoreboardContainer.appendChild(sbName);
        
        const sbScore = document.createElement('div');
        sbScore.classList.add('scoreboard-right');
        sbScore.innerText = addCommasToInt(placeData.score);
        sbScore.style = `grid-column: ${gb + 2}; ${rowCode}`;
        scoreboardContainer.appendChild(sbScore);
        
        if (placeData.playtime) {
            const sbPlaytime = document.createElement('div');
            sbPlaytime.classList.add('scoreboard-left');
            sbPlaytime.innerText = formatTime(placeData.playtime);
            sbPlaytime.style = `grid-column: ${gb + 3}; ${rowCode}`;
            scoreboardContainer.appendChild(sbPlaytime);
        }
    }
}

async function loadFromAPI() {
    if (factionMode) {
        loadFactionScoreboard().catch(e => console.error('loadFactionScoreboard', e));
    } else {
        loadScoreboard().catch(e => console.error('loadScoreboard', e));
    }
}

async function loadFactionScoreboard() {
    const factionRes = await fetch('https://api.spaceage.mp/v2/factions');
    const factionData = await factionRes.json();

    formatScoreboard(factionData, 1, 0, factionData.length);
}

async function loadScoreboard() {
    const scoreboardRes = await fetch('https://api.spaceage.mp/v2/players');
    const scoreboardData = await scoreboardRes.json();

    formatScoreboard(scoreboardData, 1, 0, scoreboardData.length);
}

function loaded(factions) {
    factionMode = factions;
    loadFromAPI();
}
