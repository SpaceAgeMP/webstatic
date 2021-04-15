'use strict';

function loadFactionScoreboard(factionData) {
    formatScoreboard(factionData, 1, 0, factionData.length);
}

function loadScoreboard(scoreboardData) {
    formatScoreboard(scoreboardData, 1, 0, scoreboardData.length);
}

function loaded(factions) {
    if (factions) {
        registerAPILoader(loadFactionScoreboard, ['/v2/factions']);
    } else {
        registerAPILoader(loadScoreboard, ['/v2/players']);
    }
    loadFromAPI();
}
