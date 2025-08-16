// API configuration
const API_CONFIG = {
    ESPN_LEADERBOARD: 'https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard',
    RANKINGS_FILE: 'rankings_data.json'
};

let allPlayers = new Map();
let currentTournamentData = null;
let rankingsData = null;

function initApp() {
    console.log('Initializing app...');
    setupTabNavigation();
    loadAllData();
    setupModal();
    setupSearch();
    setupRefreshButton();
    setupScrollHeader();
    
    // Initialize team leaderboard on page load
    if (typeof teamLeaderboard !== 'undefined') {
        teamLeaderboard.init();
    }
}

function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const targetTab = button.dataset.tab;
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Load team leaderboard when tab is clicked
            if (targetTab === 'teamLeaderboard' && typeof teamLeaderboard !== 'undefined') {
                await teamLeaderboard.init();
            }
        });
    });
}

async function loadAllData() {
    console.log('Loading all data...');
    
    // Load both in parallel
    await Promise.all([
        loadLeaderboard(),
        loadRankingsFromFile()
    ]);
}

async function loadRankingsFromFile() {
    try {
        console.log('Loading rankings from file...');
        const response = await fetch(API_CONFIG.RANKINGS_FILE);
        
        if (!response.ok) {
            throw new Error(`Failed to load rankings file: ${response.status}`);
        }
        
        rankingsData = await response.json();
        console.log('Rankings loaded:', rankingsData.timestamp || 'No timestamp');
        
        // Display all rankings
        displayWorldRankings();
        displayDataGolfRankings();
        displayFedExRankings();
        
    } catch (error) {
        console.error('Error loading rankings file:', error);
        console.log('Using tournament data as fallback');
        
        // Use tournament data as fallback
        if (currentTournamentData) {
            extractRankingsFromLeaderboard();
        }
    }
}

function displayWorldRankings() {
    if (!rankingsData || !rankingsData.owgr) {
        document.getElementById('worldRankings').innerHTML = '<div class="loading">No World Golf Rankings available</div>';
        return;
    }
    
    const rankings = rankingsData.owgr.map(player => ({
        rank: player.rank,
        name: player.player,
        points: player.points,
        country: player.country || ''
    }));
    
    displayRanking('worldRankings', rankings, 'points', 'pts');
    
    // Store in allPlayers map
    rankings.forEach(player => {
        allPlayers.set(player.name, {
            ...allPlayers.get(player.name),
            worldRank: player.rank,
            worldPoints: player.points,
            country: player.country
        });
    });
}

function displayDataGolfRankings() {
    if (!rankingsData || !rankingsData.datagolf) {
        document.getElementById('dataGolfRankings').innerHTML = '<div class="loading">No Data Golf Rankings available</div>';
        return;
    }
    
    const rankings = rankingsData.datagolf.map(player => ({
        rank: player.rank,
        name: player.player,
        rating: player.rating,
        tour: player.tour || 'PGA'
    }));
    
    displayRanking('dataGolfRankings', rankings, 'rating', 'SG');
    
    // Store in allPlayers map
    rankings.forEach(player => {
        allPlayers.set(player.name, {
            ...allPlayers.get(player.name),
            dataGolfRank: player.rank,
            dataGolfRating: player.rating,
            tour: player.tour
        });
    });
}

function displayFedExRankings() {
    if (!rankingsData || !rankingsData.fedex) {
        document.getElementById('fedexRankings').innerHTML = '<div class="loading">No FedEx Cup Rankings available</div>';
        return;
    }
    
    const rankings = rankingsData.fedex.map(player => ({
        rank: player.rank,
        name: player.player,
        points: player.points,
        earnings: player.earnings || ''
    }));
    
    displayRanking('fedexRankings', rankings, 'points', 'pts');
    
    // Store in allPlayers map
    rankings.forEach(player => {
        allPlayers.set(player.name, {
            ...allPlayers.get(player.name),
            fedexRank: player.rank,
            fedexPoints: player.points,
            earnings: player.earnings
        });
    });
}

// Fallback function if JSON file doesn't load
function extractRankingsFromLeaderboard() {
    if (!currentTournamentData) return;
    
    const competitors = currentTournamentData?.competitions?.[0]?.competitors || [];
    const byPosition = [...competitors]
        .filter(c => c.status?.position?.id)
        .sort((a, b) => a.status.position.id - b.status.position.id);
    
    // Create fallback rankings from tournament data
    const fallbackRankings = byPosition.slice(0, 30).map((comp, index) => ({
        rank: index + 1,
        name: comp.athlete?.displayName || 'Unknown',
        points: 'N/A',
        playerId: comp.athlete?.id
    }));
    
    displayRanking('worldRankings', fallbackRankings, 'points', '');
    displayRanking('dataGolfRankings', fallbackRankings, 'points', '');
    displayRanking('fedexRankings', fallbackRankings, 'points', '');
}

async function loadLeaderboard() {
    const container = document.getElementById('tournamentLeaderboard');
    container.innerHTML = '<div class="loading">Loading live tournament leaderboard...</div>';
    
    try {
        console.log('Fetching live leaderboard from ESPN API...');
        const response = await fetch(API_CONFIG.ESPN_LEADERBOARD);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Live leaderboard data received:', data);
        
        if (data && data.events && data.events[0]) {
            const event = data.events[0];
            currentTournamentData = event;
            
            // Store tournament name (no longer updating header since it's now "Leaderboard")
            // document.getElementById('tournamentName').textContent = event.name || 'Tournament';
            
            if (event.competitions && event.competitions[0]) {
                const competition = event.competitions[0];
                const status = competition.status;
                const round = status?.period || 1;
                const statusText = status?.type?.completed ? 'Final' : `Round ${round}`;
                
                // Update leaderboard section title with current round
                const leaderboardTitle = document.getElementById('leaderboardTitle');
                if (leaderboardTitle) {
                    // Always show the specific round number
                    const roundText = status?.type?.completed ? 'Final' : `Round ${round}`;
                    leaderboardTitle.textContent = `Leaderboard - ${roundText}`;
                }
                
                // Display leaderboard
                const competitors = competition.competitors || [];
                displayLeaderboard(competitors);
                
                // Store player tournament data
                competitors.forEach(comp => {
                    if (comp.athlete) {
                        const playerData = allPlayers.get(comp.athlete.displayName) || {};
                        allPlayers.set(comp.athlete.displayName, {
                            ...playerData,
                            id: comp.athlete.id,
                            name: comp.athlete.displayName,
                            position: comp.status?.position?.displayName,
                            score: comp.score?.displayValue,
                            thru: comp.status?.thru || comp.status?.startHole || 'F',
                            currentTournament: event.name
                        });
                    }
                });
            }
        } else {
            throw new Error('No tournament data in response');
        }
    } catch (error) {
        console.error('Error loading live leaderboard:', error);
        container.innerHTML = `<div class="loading">Error loading live tournament data: ${error.message}</div>`;
    }
}

function displayRanking(containerId, rankings, scoreType, scoreLabel) {
    const container = document.getElementById(containerId);
    
    console.log(`Displaying ${rankings?.length || 0} players in ${containerId}`);
    
    if (!rankings || rankings.length === 0) {
        container.innerHTML = '<div class="loading">No ranking data available</div>';
        return;
    }
    
    container.innerHTML = '';
    rankings.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        const scoreDisplay = scoreLabel ? `${player[scoreType]} ${scoreLabel}` : player[scoreType];
        playerCard.innerHTML = `
            <span class="player-rank">#${player.rank}</span>
            <span class="player-name">${player.name}</span>
            <span class="player-score">${scoreDisplay}</span>
        `;
        playerCard.addEventListener('click', () => showPlayerDetails(player.name, player.playerId));
        container.appendChild(playerCard);
    });
}

function displayLeaderboard(competitors) {
    const container = document.getElementById('tournamentLeaderboard');
    
    if (!competitors || competitors.length === 0) {
        container.innerHTML = '<div class="loading">No leaderboard data available</div>';
        return;
    }
    
    container.innerHTML = '';
    
    // Sort by position (best to worst - lowest position number first)
    const sortedCompetitors = competitors
        .filter(c => c.status?.position?.id)
        .sort((a, b) => a.status.position.id - b.status.position.id);
    
    // Display all sorted competitors (leaders first)
    sortedCompetitors.forEach(competitor => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        
        const position = competitor.status?.position?.displayName || '-';
        const name = competitor.athlete?.displayName || 'Unknown';
        
        // Get the score - prioritize linescores for accurate to-par
        let score = 'E';
        
        // Check linescores first for current round score
        if (competitor.linescores && competitor.linescores.length > 0) {
            // Get total score to par by summing all rounds
            let totalToPar = 0;
            let hasScore = false;
            
            competitor.linescores.forEach(round => {
                if (round.displayValue) {
                    const roundScore = round.displayValue;
                    if (roundScore === 'E') {
                        // Even par, add 0
                    } else if (roundScore.startsWith('+')) {
                        totalToPar += parseInt(roundScore.substring(1));
                        hasScore = true;
                    } else if (roundScore.startsWith('-')) {
                        totalToPar -= parseInt(roundScore.substring(1));
                        hasScore = true;
                    } else if (!isNaN(parseInt(roundScore))) {
                        // If it's just a number, assume it's strokes over par
                        totalToPar += parseInt(roundScore);
                        hasScore = true;
                    }
                }
            });
            
            if (hasScore || totalToPar !== 0) {
                if (totalToPar > 0) {
                    score = `+${totalToPar}`;
                } else if (totalToPar < 0) {
                    score = `${totalToPar}`;
                } else {
                    score = 'E';
                }
            }
        }
        
        // Fallback to score object
        if (score === 'E' && competitor.score) {
            score = competitor.score.displayValue || 'E';
        }
        
        // Handle status detail as another fallback
        if (score === 'E' && competitor.status?.detail) {
            const match = competitor.status.detail.match(/([+-]?\d+|E)/);
            if (match) {
                score = match[1];
            }
        }
        
        // Format thru/holes played and score display
        let thru = competitor.status?.thru;
        let displayText = '';
        
        // Check if player is in pre-round state (hasn't started yet)
        const isPreRound = competitor.status?.type?.state === 'pre';
        const hasStarted = thru && thru > 0;
        
        // Handle pre-round state (show tee time before they start)
        if (isPreRound || (thru === 0 && competitor.status?.teeTime)) {
            const teeTime = competitor.status?.teeTime;
            if (teeTime) {
                try {
                    const teeDate = new Date(teeTime);
                    // Simple time formatting without timezone
                    const hours = teeDate.getHours();
                    const minutes = teeDate.getMinutes();
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours % 12 || 12;
                    const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
                    displayText = `${score} (${displayHours}:${displayMinutes} ${ampm})`;
                } catch (e) {
                    console.error('Error formatting tee time:', e);
                    displayText = `${score} (Scheduled)`;
                }
            } else {
                displayText = `${score} (Scheduled)`;
            }
        }
        // Active player - show score with holes completed
        else if (hasStarted && thru !== 18) {
            displayText = `${score} (${thru})`;
        }
        // Finished round
        else if (thru === 18 || competitor.status?.type?.completed) {
            displayText = `${score} (F)`;
        }
        // Default case - probably finished from previous rounds
        else {
            displayText = `${score} (F)`;
        }
        
        row.innerHTML = `
            <div class="position">${position}</div>
            <div class="golfer-name">${name}</div>
            <div class="score">${displayText}</div>
        `;
        
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => showPlayerDetails(name, competitor.athlete?.id));
        
        container.appendChild(row);
    });
}

async function showPlayerDetails(playerName, playerId) {
    const modal = document.getElementById('playerModal');
    const modalPlayerName = document.getElementById('modalPlayerName');
    const modalPlayerDetails = document.getElementById('modalPlayerDetails');
    const recentResults = document.getElementById('recentResults');
    
    modalPlayerName.textContent = playerName;
    
    // Get player info from all sources
    const playerInfo = allPlayers.get(playerName) || {};
    
    let detailsHTML = '';
    
    // Show current tournament info FIRST
    if (currentTournamentData) {
        const competitor = currentTournamentData.competitions[0].competitors.find(
            c => c.athlete?.id === playerId || c.athlete?.displayName === playerName
        );
        
        if (competitor) {
            detailsHTML += '<h4>Current Tournament</h4>';
            detailsHTML += `<strong>${currentTournamentData.name || 'Tournament'}</strong><br>`;
            detailsHTML += `<strong>Position:</strong> ${competitor.status?.position?.displayName || '-'}<br>`;
            
            if (competitor.linescores && competitor.linescores.length > 0) {
                detailsHTML += '<div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 8px;">';
                
                let totalStrokes = 0;
                let totalToPar = 0;
                let completedRounds = 0;
                
                // Process each round
                competitor.linescores.forEach((round, index) => {
                    // Check if this is a scheduled/pre-round (no value yet)
                    if (!round.value || round.value === '--') {
                        const roundNumber = index + 1;
                        const currentPeriod = competitor.status?.period || 1;
                        
                        // Show scheduled round if it matches current period
                        if (roundNumber === currentPeriod && competitor.status?.type?.state === 'pre') {
                            const teeTime = competitor.status?.teeTime;
                            if (teeTime) {
                                try {
                                    const teeDate = new Date(teeTime);
                                    // Simple time formatting without timezone
                                    const hours = teeDate.getHours();
                                    const minutes = teeDate.getMinutes();
                                    const ampm = hours >= 12 ? 'PM' : 'AM';
                                    const displayHours = hours % 12 || 12;
                                    const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
                                    const timeString = `${displayHours}:${displayMinutes} ${ampm}`;
                                    detailsHTML += `<div style="padding: 5px 0; color: #006747; font-weight: 600;">`;
                                    detailsHTML += `Round ${roundNumber}: Scheduled - Tee time ${timeString}`;
                                    detailsHTML += `</div>`;
                                } catch (e) {
                                    console.error('Error formatting modal tee time:', e);
                                    detailsHTML += `<div style="padding: 5px 0; color: #006747; font-weight: 600;">`;
                                    detailsHTML += `Round ${roundNumber}: Scheduled`;
                                    detailsHTML += `</div>`;
                                }
                            }
                        }
                        return; // Skip processing if no value
                    }
                    
                    const strokes = parseInt(round.value) || 0;
                    
                    // Check if this is the current/active round
                    const isLastRoundWithData = index === competitor.linescores.filter(r => r.value && r.value !== '--').length - 1;
                    const isActiveRound = isLastRoundWithData && 
                                        competitor.status?.thru && 
                                        competitor.status.thru !== 'F' &&
                                        competitor.status.thru !== '18' &&
                                        competitor.status.thru !== 0;
                    
                    if (isActiveRound) {
                        // Active round - show current score and holes completed
                        totalStrokes += strokes;
                        let holesCompleted = competitor.status.thru || '-';
                        // Convert "18" to "F"
                        if (holesCompleted === '18' || holesCompleted === 18) {
                            holesCompleted = 'F';
                        }
                        const roundToPar = round.displayValue || 'E';
                        detailsHTML += `<div style="padding: 5px 0; color: #006747; font-weight: 600;">`;
                        detailsHTML += `Round ${index + 1}: ${strokes} strokes (${roundToPar}) - ${holesCompleted === 'F' ? 'F' : `Thru ${holesCompleted}`}`;
                        detailsHTML += `</div>`;
                    } else if (strokes > 0) {
                        // Completed round
                        totalStrokes += strokes;
                        completedRounds++;
                        const roundToPar = round.displayValue || 'E';
                        detailsHTML += `<div style="padding: 5px 0;">`;
                        detailsHTML += `Round ${index + 1}: ${strokes} strokes (${roundToPar}) - F`;
                        detailsHTML += `</div>`;
                    }
                    
                    // Calculate total to par
                    if (round.displayValue) {
                        const roundScore = round.displayValue;
                        if (roundScore === 'E') {
                            // Even par
                        } else if (roundScore.startsWith('+')) {
                            totalToPar += parseInt(roundScore.substring(1));
                        } else if (roundScore.startsWith('-')) {
                            totalToPar -= parseInt(roundScore.substring(1));
                        }
                    }
                });
                
                // Show tournament totals
                if (totalStrokes > 0) {
                    detailsHTML += '<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; font-weight: 600;">';
                    let totalScore = 'E';
                    if (totalToPar > 0) {
                        totalScore = `+${totalToPar}`;
                    } else if (totalToPar < 0) {
                        totalScore = `${totalToPar}`;
                    }
                    detailsHTML += `<strong>Tournament Total:</strong> ${totalStrokes} strokes (${totalScore})`;
                    detailsHTML += '</div>';
                }
                
                detailsHTML += '</div>';
            }
            
            detailsHTML += '<br>';
        }
    }
    
    // Then show rankings
    detailsHTML += '<h4>Rankings</h4>';
    
    if (playerInfo.worldRank) {
        detailsHTML += `<strong>World Golf Ranking:</strong> #${playerInfo.worldRank}`;
        if (playerInfo.worldPoints && playerInfo.worldPoints !== 'N/A') {
            detailsHTML += ` (${playerInfo.worldPoints} pts)`;
        }
        if (playerInfo.country) {
            detailsHTML += ` - ${playerInfo.country}`;
        }
        detailsHTML += '<br>';
    }
    
    if (playerInfo.dataGolfRank) {
        detailsHTML += `<strong>Data Golf Ranking:</strong> #${playerInfo.dataGolfRank}`;
        if (playerInfo.dataGolfRating) {
            detailsHTML += ` (${playerInfo.dataGolfRating} SG)`;
        }
        if (playerInfo.tour) {
            detailsHTML += ` - ${playerInfo.tour} Tour`;
        }
        detailsHTML += '<br>';
    }
    
    if (playerInfo.fedexRank) {
        detailsHTML += `<strong>FedEx Cup Ranking:</strong> #${playerInfo.fedexRank}`;
        if (playerInfo.fedexPoints) {
            detailsHTML += ` (${playerInfo.fedexPoints} pts)`;
        }
        if (playerInfo.earnings) {
            detailsHTML += ` - ${playerInfo.earnings}`;
        }
        detailsHTML += '<br>';
    }
    
    modalPlayerDetails.innerHTML = detailsHTML || 'Player information not available';
    
    // Clear the recent results section since we're showing tournament info at the top now
    recentResults.innerHTML = '';
    
    modal.style.display = 'block';
}

function setupModal() {
    const modal = document.getElementById('playerModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function setupSearch() {
    // Rankings search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const playerCards = document.querySelectorAll('.player-card');
            
            // Auto-expand all tables when searching
            if (searchTerm.length > 0) {
                expandAllRankingTables();
            } else {
                // Collapse all tables when search is cleared
                collapseAllRankingTables();
            }
            
            playerCards.forEach(card => {
                const playerName = card.querySelector('.player-name').textContent.toLowerCase();
                if (playerName.includes(searchTerm)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Toggle clear button
            toggleClearButton('searchInput');
        });
    }
    
    // Tournament leaderboard search
    const tournamentSearch = document.getElementById('tournamentSearchInput');
    if (tournamentSearch) {
        tournamentSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            // Auto-expand sections when searching
            if (searchTerm.length > 0) {
                expandAllTournamentSections();
            } else {
                collapseAllTournamentSections();
            }
            
            // Search in tournament leaderboard
            const leaderboardRows = document.querySelectorAll('.leaderboard-row');
            leaderboardRows.forEach(row => {
                const playerName = row.querySelector('.golfer-name');
                if (playerName) {
                    const name = playerName.textContent.toLowerCase();
                    if (name.includes(searchTerm)) {
                        row.style.display = 'grid';
                    } else {
                        row.style.display = 'none';
                    }
                }
            });
            
            // Search in team leaderboard  
            filterTeamsByPlayer(searchTerm);
            
            // Toggle clear button
            toggleClearButton('tournamentSearchInput');
        });
    }
}

function setupRefreshButton() {
    // Refresh button now in header - no longer needed here
}

// Auto-refresh leaderboard every 60 seconds during tournaments
setInterval(() => {
    if (document.getElementById('leaderboard').classList.contains('active')) {
        console.log('Auto-refreshing live leaderboard...');
        loadLeaderboard();
    }
}, 60000);

// Clear search function
window.clearSearch = function(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value = '';
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
        
        // Hide clear button
        const clearBtn = input.nextElementSibling;
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
        
        // Collapse all tables when search is cleared
        if (inputId === 'searchInput') {
            collapseAllRankingTables();
        } else if (inputId === 'tournamentSearchInput') {
            collapseAllTournamentSections();
        }
    }
};

// Toggle clear button visibility
window.toggleClearButton = function(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        const clearBtn = input.nextElementSibling;
        if (clearBtn) {
            clearBtn.style.display = input.value ? 'block' : 'none';
        }
    }
};

// Toggle individual ranking table
window.toggleRankingTable = function(rankingType) {
    const rankingDiv = document.querySelector(`.ranking-type[data-ranking="${rankingType}"]`);
    if (rankingDiv) {
        rankingDiv.classList.toggle('collapsed');
    }
};

// Toggle tournament sections
window.toggleTournamentSection = function(sectionType) {
    const sectionDiv = document.querySelector(`.tournament-section[data-section="${sectionType}"]`);
    if (sectionDiv) {
        sectionDiv.classList.toggle('collapsed');
    }
};

// Expand all ranking tables
function expandAllRankingTables() {
    const rankingTables = document.querySelectorAll('.ranking-type');
    rankingTables.forEach(table => {
        table.classList.remove('collapsed');
    });
}

// Collapse all ranking tables
function collapseAllRankingTables() {
    const rankingTables = document.querySelectorAll('.ranking-type');
    rankingTables.forEach(table => {
        table.classList.add('collapsed');
    });
}

// Expand all tournament sections
function expandAllTournamentSections() {
    const sections = document.querySelectorAll('.tournament-section');
    sections.forEach(section => {
        section.classList.remove('collapsed');
    });
}

// Collapse all tournament sections
function collapseAllTournamentSections() {
    const sections = document.querySelectorAll('.tournament-section');
    sections.forEach(section => {
        section.classList.add('collapsed');
    });
}

// Setup condensing header on scroll
function setupScrollHeader() {
    const header = document.querySelector('header');
    let isCondensed = false;
    let ticking = false;
    
    function updateHeader() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add hysteresis to prevent flickering
        // Condense at 80px, expand at 40px
        if (!isCondensed && scrollTop > 80) {
            header.classList.add('condensed');
            isCondensed = true;
        } else if (isCondensed && scrollTop < 40) {
            header.classList.remove('condensed');
            isCondensed = false;
        }
        
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }, { passive: true });
}

// Refresh all data across the app
window.refreshAllData = async function() {
    const btn = document.querySelector('.header-refresh-btn');
    if (!btn) return;
    
    // Create wrapper for crossfade effect
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 20px; height: 20px;';
    
    const originalIcon = btn.querySelector('svg').cloneNode(true);
    originalIcon.style.cssText = 'position: absolute; top: 0; left: 0; width: 20px; height: 20px; transition: opacity 0.3s ease;';
    
    btn.innerHTML = '';
    btn.appendChild(wrapper);
    wrapper.appendChild(originalIcon);
    
    btn.disabled = true;
    btn.classList.add('spinning');
    
    try {
        // Refresh all data sources in parallel
        await Promise.all([
            loadLeaderboard(),
            loadRankingsFromFile(),
            teamLeaderboard?.refresh()
        ]);
        
        // Show success feedback with crossfade
        if (btn) {
            btn.classList.remove('spinning');
            
            // Create success icon
            const successIcon = document.createElement('div');
            successIcon.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; top: 0; left: 0; width: 20px; height: 20px; opacity: 0; transition: opacity 0.3s ease;"><path d="M5 12l5 5L20 7"/></svg>';
            wrapper.appendChild(successIcon.firstChild);
            
            // Crossfade to success
            originalIcon.style.opacity = '0';
            wrapper.lastChild.style.opacity = '1';
            
            // After delay, crossfade back
            setTimeout(() => {
                wrapper.lastChild.style.opacity = '0';
                originalIcon.style.opacity = '1';
                
                setTimeout(() => {
                    btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
                    btn.disabled = false;
                }, 300);
            }, 1500);
        }
    } catch (error) {
        console.error('Error refreshing data:', error);
        if (btn) {
            btn.classList.remove('spinning');
            
            // Create error icon
            const errorIcon = document.createElement('div');
            errorIcon.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; top: 0; left: 0; width: 20px; height: 20px; opacity: 0; transition: opacity 0.3s ease;"><path d="M6 18L18 6M6 6l12 12"/></svg>';
            wrapper.appendChild(errorIcon.firstChild);
            
            // Crossfade to error
            originalIcon.style.opacity = '0';
            wrapper.lastChild.style.opacity = '1';
            
            // After delay, crossfade back
            setTimeout(() => {
                wrapper.lastChild.style.opacity = '0';
                originalIcon.style.opacity = '1';
                
                setTimeout(() => {
                    btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
                    btn.disabled = false;
                }, 300);
            }, 1500);
        }
    }
};

// Add spin animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);