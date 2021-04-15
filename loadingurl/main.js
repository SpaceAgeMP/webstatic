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
    
    loadFromAPI(url => url.replace('__STEAMID__', steamId).replace('__SERVERNAME__', serverName));
}

function loadFactionScoreboard(factionData, playerData) {
    const factionName = (playerData && playerData.faction_name) || DEFAULT_PLAYER.faction_name;
    formatScoreboard(factionData, 6, 0, factionData.length, (d) => d.faction_name == factionName);
}
registerAPILoader(loadFactionScoreboard, ['/v2/factions', '/v2/players/__STEAMID__']);

function loadScoreboard(scoreboardData) {
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

function loadPlayerData(playerData) {
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

function loadServerData(serverData) {
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
