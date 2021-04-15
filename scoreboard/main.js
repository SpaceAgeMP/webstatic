'use strict';

let factionMode = false;

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
