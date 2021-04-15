'use strict';

let steamId = undefined;
let serverName = undefined;

function GameDetails(serverNameRaw, _serverURL, mapName, maxPlayers, steamId64, gameMode, _volume, _language) {
    const m = serverNameRaw.match(/SpaceAge \[(.+)\]/);
    if (m && m[1]) {
        serverName = m[1];
    } else {
        serverName = serverNameRaw;
    }

    populateIfExists('servername', serverName);
    populateIfExists('mapname', mapName);
    populateIfExists('maxplayers', maxPlayers);
    populateIfExists('gamemode', gameMode);

    const sid64BI = BigInt(steamId64) - sid64BaseBI;
    steamId = `STEAM_0:${sid64BI % twoBI}:${sid64BI / twoBI}`;
    populateIfExists('steamid', steamId);

    loadFromAPI().catch(e => console.error('loadFromAPI', e));
}

function parseURLVars(url) {
    return url
        .replace('__STEAMID__', steamId)
        .replace('__SERVERNAME__', serverName);
}

async function aggregateLoad(urls) {
    let allData = {};
    try {
        const allDataRes = await fetch(`https://api.spaceage.mp/cdn/aggregate?${urls.sort().map(u => `run=${encodeURIComponent(u)}`).join('&')}`);
        if (allDataRes.status === 200) {
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
async function loadFromAPI() {
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

function registerAPILoader(func, urls, dependencies=[]) {
    APILoaders.push({
        func,
        urls,
        dependencies,
    });
}

async function loadFactionScoreboard(factionData, playerData) {
    const factionName = (playerData && playerData.faction_name) || DEFAULT_PLAYER.faction_name;
    formatScoreboard(factionData, 6, 0, factionData.length, (d) => d.faction_name == factionName);
}
registerAPILoader(loadFactionScoreboard, ['/v2/factions', '/v2/players/__STEAMID__']);

async function loadScoreboard(scoreboardData) {
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
registerAPILoader(loadScoreboard, ['/v2/players']);

async function loadPlayerData(playerData) {
    if (!playerData || !playerData.name) {
        playerData = DEFAULT_PLAYER;
    }

    populateIfExists('name', playerData.name, playerData.faction_name);
    populateIfExists('score', addCommasToInt(playerData.score));
    populateIfExists('credits', addCommasToInt(playerData.credits));
    populateIfExists('playtime', formatTime(playerData.playtime));

    document.getElementById('playerData').style.display = '';
}
registerAPILoader(loadPlayerData, ['/v2/players/__STEAMID__']);

async function loadServerData(serverData) {
    if (!serverData) {
        return;
    }

    populateIfExists('players', serverData.players.length);
}
registerAPILoader(loadServerData, ['/v2/servers/__SERVERNAME__']);

function SetFilesTotal(total) { }
function DownloadingFile(fileName) { }
function SetStatusChanged(status) { }
function SetFilesNeeded(needed) { }

function loaded() {
    if (document.location.protocol === 'file:') {
        GameDetails('SpaceAge [Betelgeuse]', 'https://static.spaceage.mp/loadingurl/', 'sb_gooniverse_v4', 16, '76561197971055508', 'spaceage', 1, 'en');
    }
}
