'use strict';

const sid64BaseBI = BigInt('76561197960265728');
const twoBI = BigInt('2');

const DEFAULT_PLAYER = {
    faction_name: 'freelancer',
    name: 'User',
    score: 0,
    credits: 0,
    playtime: 0,
};

const factionToLongTable = {
    freelancer: 'Freelancers',
    ice: 'I.C.E.',
    legion: 'The Legion',
    miners: 'Major Miners',
    corporation: 'The Corporation',
    alliance: 'The Alliance',
};

function populateIfExists(id, data, factionName) {
    const ele = document.getElementById(id);
    if (ele) {
        if (data !== undefined) {
            ele.innerText = data;
        }
        if (factionName) {
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

function formatScoreboard(sb, gb, minI, maxI, checkIsUs) {
    const scoreboardContainer = document.getElementById('scoreboards');
    
    if (checkIsUs) {
        gb++;
    }

    for (let i = minI; i < maxI; i++) {
        const place = i + 1;
        const placeData = sb[i];

        const rowCode = `grid-row: ${place - minI}`;

        if (checkIsUs && checkIsUs(placeData)) {
            const sbThisIsYou = document.createElement('div');
            sbThisIsYou.style = `grid-column: ${gb - 1}; ${rowCode};`;
            sbThisIsYou.classList.add('scoreboard-indicator');
            const sbThisIsYouImg = document.createElement('img');
            sbThisIsYouImg.src = 'you-indicator.gif';
            sbThisIsYou.appendChild(sbThisIsYouImg);
            scoreboardContainer.appendChild(sbThisIsYou);
        }

        const sbElement = document.createElement('div');
        sbElement.classList.add(`factionbg-${placeData.faction_name}`);
        sbElement.classList.add('scoreboard');
        sbElement.style = `grid-column: ${gb} / ${gb + 4}; ${rowCode}`;
        scoreboardContainer.appendChild(sbElement);

        const sbPlace = document.createElement('div');
        sbPlace.classList.add('scoreboard-right');
        sbPlace.classList.add(`factiontext-${placeData.faction_name}`);
        sbPlace.innerText = `${place}.`;
        sbPlace.style = `grid-column: ${gb}; ${rowCode}`;
        scoreboardContainer.appendChild(sbPlace);
        
        const sbName = document.createElement('div');
        sbName.classList.add('scoreboard-left');
        sbName.classList.add(`factiontext-${placeData.faction_name}`);
        sbName.innerText = placeData.name || factionToLongTable[placeData.faction_name] || placeData.faction_name || 'N/A';
        sbName.style = `grid-column: ${gb + 1}; ${rowCode}`;
        scoreboardContainer.appendChild(sbName);
        
        const sbScore = document.createElement('div');
        sbScore.classList.add('scoreboard-right');
        sbScore.classList.add(`factiontext-${placeData.faction_name}`);
        sbScore.innerText = addCommasToInt(placeData.score);
        sbScore.style = `grid-column: ${gb + 2}; ${rowCode}`;
        scoreboardContainer.appendChild(sbScore);
        
        if (placeData.playtime) {
            const sbPlaytime = document.createElement('div');
            sbPlaytime.classList.add('scoreboard-left');
            sbPlaytime.classList.add(`factiontext-${placeData.faction_name}`);
            sbPlaytime.innerText = formatTime(placeData.playtime);
            sbPlaytime.style = `grid-column: ${gb + 3}; ${rowCode}`;
            scoreboardContainer.appendChild(sbPlaytime);
        }
    }
}
