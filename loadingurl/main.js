'use strict';

const sid64BaseBI = BigInt('76561197960265728');
const twoBI = BigInt('2');

let playerDataLoadedPromiseResolve = undefined;
let playerDataLoadedPromise = undefined;
let factionName = undefined;
let steamId = undefined;

const factionToLongTable = {
    freelancer: 'Freelancers',
    ice: 'I.C.E.',
    legion: 'The Legion',
    miners: 'Major Miners',
    corporation: 'The Corporation',
    alliance: 'The Alliance',
};

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

function formatScoreboard(sb, gb, minI, maxI, checkIsUs) {
    const scoreboardContainer = document.getElementById('scoreboards');

    for (let i = minI; i < maxI; i++) {
        const place = i + 1;
        const placeData = sb[i];

        const rowCode = `grid-row: ${place - minI}`;

        if (checkIsUs(placeData)) {
            const sbThisIsYou = document.createElement('div');
            sbThisIsYou.style = `grid-column: ${gb}; ${rowCode};`;
            sbThisIsYou.classList.add('scoreboard-indicator');
            const sbThisIsYouImg = document.createElement('img');
            sbThisIsYouImg.src = 'you-indicator.gif';
            sbThisIsYou.appendChild(sbThisIsYouImg);
            scoreboardContainer.appendChild(sbThisIsYou);
        }

        const sbElement = document.createElement('div');
        sbElement.classList.add(`factionbg-${placeData.faction_name}`);
        sbElement.classList.add('scoreboard');
        sbElement.style = `grid-column: ${gb + 1} / ${gb + 5}; ${rowCode}`;
        scoreboardContainer.appendChild(sbElement);

        const sbPlace = document.createElement('div');
        sbPlace.classList.add('scoreboard-right');
        sbPlace.classList.add(`factiontext-${placeData.faction_name}`);
        sbPlace.innerText = `${place}.`;
        sbPlace.style = `grid-column: ${gb + 1}; ${rowCode}`;
        scoreboardContainer.appendChild(sbPlace);
        
        const sbName = document.createElement('div');
        sbName.classList.add('scoreboard-left');
        sbName.classList.add(`factiontext-${placeData.faction_name}`);
        sbName.innerText = placeData.name || factionToLongTable[placeData.faction_name] || placeData.faction_name || 'N/A';
        sbName.style = `grid-column: ${gb + 2}; ${rowCode}`;
        scoreboardContainer.appendChild(sbName);
        
        const sbScore = document.createElement('div');
        sbScore.classList.add('scoreboard-right');
        sbScore.classList.add(`factiontext-${placeData.faction_name}`);
        sbScore.innerText = addCommasToInt(placeData.score);
        sbScore.style = `grid-column: ${gb + 3}; ${rowCode}`;
        scoreboardContainer.appendChild(sbScore);
        
        if (placeData.playtime) {
            const sbPlaytime = document.createElement('div');
            sbPlaytime.classList.add('scoreboard-left');
            sbPlaytime.classList.add(`factiontext-${placeData.faction_name}`);
            sbPlaytime.innerText = formatTime(placeData.playtime);
            sbPlaytime.style = `grid-column: ${gb + 4}; ${rowCode}`;
            scoreboardContainer.appendChild(sbPlaytime);
        }
    }
}

function GameDetails(servername, _serverurl, mapname, maxplayers, steamid64, gamemode, _volume, _language) {
    populateIfExists('servername', servername);
    populateIfExists('mapname', mapname);
    populateIfExists('maxplayers', maxplayers);
    populateIfExists('gamemode', gamemode);

    const sid64BI = BigInt(steamid64) - sid64BaseBI;
    steamId = `STEAM_0:${sid64BI % twoBI}:${sid64BI / twoBI}`;
    populateIfExists('steamid', steamId);

    playerDataLoadedPromise = new Promise((resolve) => {
        playerDataLoadedPromiseResolve = resolve;
        loadFromAPI().catch(e => console.error('loadFromAPI', e));
    });
}

async function aggregateLoad(urls) {
    let allData = {};
    try {
        const allDataRes = await fetch(`https://api.spaceage.mp/cdn/aggregate?${urls.map(u => `run=${encodeURIComponent(u)}`).join('&')}`);
        if (allData.status === 200) {
            allData = await allDataRes.json();
        }
    } catch (e) {
        console.error('aggregate', e);
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

async function loadFromAPI() {
    const allData = await aggregateLoad([
        `/v2/players/${steamId}`,
        '/v2/players',
        '/v2/factions',
    ]);
    loadPlayerData(allData[`/v2/players/${steamId}`]).catch(e => console.error('loadPlayerData', e));
    loadScoreboard(allData['/v2/players']).catch(e => console.error('loadScoreboard', e));
    loadFactionScoreboard(allData['/v2/factions']).catch(e => console.error('loadFactionScoreboard', e));
}

async function loadFactionScoreboard(factionData) {
    factionData = (await factionData).data;

    await playerDataLoadedPromise;

    formatScoreboard(factionData, 6, 0, factionData.length, (d) => d.faction_name == factionName);
}

async function loadScoreboard(scoreboardData) {
    scoreboardData = (await scoreboardData).data;

    let ourI = -1;
    for (let i = 0; i < scoreboardData.length; i++) {
        const placePlayer = scoreboardData[i];
        if (placePlayer.steamid === steamId) {
            ourI = i;
            break;
        }
    }

    let minI = ourI - 5;
    if (minI < 0) {
        minI = 0;
    }
    let maxI = minI + 11;
    if (maxI > scoreboardData.length) {
        maxI = scoreboardData.length;
        minI = maxI - 11;
    }
    formatScoreboard(scoreboardData, 1, minI, maxI, (d) => d.steamid == steamId);
}

async function loadPlayerData(playerData) {
    playerData = (await playerData).data;

    if (!playerData || !playerData.name) {
        playerData = {
            faction_name: 'freelancer',
            name: 'User',
            score: 0,
            credits: 0,
            playtime: 0,
        };
    }

    factionName = playerData.faction_name;

    playerDataLoadedPromiseResolve();

    populateIfExists('name', playerData.name, true);
    populateIfExists('score', addCommasToInt(playerData.score));
    populateIfExists('credits', addCommasToInt(playerData.credits));
    populateIfExists('playtime', formatTime(playerData.playtime));

    document.getElementById('playerData').style.display = '';
}

function SetFilesTotal(total) { }
function DownloadingFile(fileName) { }
function SetStatusChanged(status) { }
function SetFilesNeeded(needed) { }

function loaded() {
    if (document.location.protocol === 'file:') {
        GameDetails("A", "B", "C", 64, "76561197971055508", "D", 1, "en");
    }
}
