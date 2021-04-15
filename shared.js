'use strict';

const sid64BaseBI = BigInt('76561197960265728');
const twoBI = BigInt('2');

let steamId = undefined;
let serverName = undefined;

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

function parseURLVars(url) {
    return url
        .replace('__STEAMID__', steamId)
        .replace('__SERVERNAME__', serverName);
}

async function aggregateLoad(urls) {
    let allData = {};
    if (urls.length > 1) {
        try {
            const allDataRes = await fetch(`https://api.spaceage.mp/cdn/aggregate?${urls.sort().map(u => `run=${encodeURIComponent(u)}`).join('&')}`);
            if (allDataRes.status === 200) {
                allData = await allDataRes.json();
            }
        } catch (e) {
            console.error('aggregate', e);
        }
    }

    for (const url of urls) {
        if (allData[url]) {
            continue;
        }
        allData[url] = fetch(`https://api.spaceage.mp${url}`).then(async res => {
            return {
                data: await res.json(),
                status: res.status,
            };
        });
    }

    return allData;
}

async function extractData(data) {
    const res = await data;
    if (res.status !== 200) {
        return undefined;
    }
    return res.data;
}

async function callLoader(loader, allData) {
    const callArgs = loader._urls.map(url => allData[url]);
    for (const idx in callArgs) {
        callArgs[idx] = await extractData(callArgs[idx]);
    }
    await loader.func.apply(null, callArgs);
}

const APILoaders = [];
async function _loadFromAPI() {
    const urls = new Set();
    for (const loader of APILoaders) {
        loader._urls = loader.urls.map(parseURLVars);
        urls.add(...loader._urls);
    }
    const allData = await aggregateLoad([...urls]);
    for (const loader of APILoaders) {
        callLoader(loader, allData).catch(e => console.error(loader.func.name, e));
    }
}

function loadFromAPI() {
    _loadFromAPI().catch(e => console.error('loadFromAPI', e));
}

function registerAPILoader(func, urls, dependencies=[]) {
    APILoaders.push({
        func,
        urls,
        dependencies,
    });
}
