// Team Leaderboard Module - Fixed Version
// Combines Google Sheets team data with ESPN live tournament positions

class TeamLeaderboard {
    constructor() {
        this.teams = [];
        this.tournamentData = null;
        this.leagueData = null;
    }
    
    // Load team data from Google Sheets
    async loadTeamData() {
        try {
            console.log('Loading team data from Google Sheets...');
            const data = await sheetsAPI.readAll('League Center');
            this.parseTeamData(data);
            return this.teams;
        } catch (error) {
            console.error('Error loading team data:', error);
            return [];
        }
    }
    
    // Parse the League Center sheet structure
    parseTeamData(sheetData) {
        this.teams = [];
        
        // Debug logging
        console.log('Parsing sheet data, total rows:', sheetData.length);
        
        // Helper function to parse a single team
        const parseTeam = (row, col) => {
            // Get team name and info from header row
            const teamName = sheetData[row]?.[col];
            const position = sheetData[row]?.[col + 2];  
            const league = sheetData[row]?.[col + 3];
            
            // Skip if no team name
            if (!teamName || teamName === '') return null;
            
            console.log(`Parsing team: ${teamName} at row ${row}, col ${col}`);
            
            const team = {
                name: teamName,
                position: position || '',
                league: league || 'CL',
                activePlayers: [],
                benchPlayers: [],
                imageUrl: null
            };
            
            // Parse the next 9 rows for roster spots (should be max 9 slots per team)
            let rosterSpots = [];
            for (let i = 1; i <= 9; i++) {
                const playerRow = row + i;
                if (!sheetData[playerRow]) continue;
                
                // Look for player data or empty slot marker
                let playerName = '';
                let playerPos = '-';
                let playerScore = '-';
                let hasImage = false;
                let isEmptySlot = false;
                
                // Check if there's an image first
                const imageCell = sheetData[playerRow][col];
                const nextCell = sheetData[playerRow][col + 1];
                
                if (imageCell && typeof imageCell === 'object' && imageCell.valueType === 'IMAGE') {
                    // Image in first column, player name in next
                    hasImage = true;
                    playerName = nextCell || '';
                    playerPos = sheetData[playerRow][col + 2] || '-';
                    playerScore = sheetData[playerRow][col + 3] || '-';
                } else if (nextCell && typeof nextCell === 'object' && nextCell.valueType === 'IMAGE') {
                    // Sometimes image is in second column
                    hasImage = true;
                    playerName = sheetData[playerRow][col + 2] || '';
                    playerPos = sheetData[playerRow][col + 3] || '-';
                    playerScore = sheetData[playerRow][col + 4] || '-';
                } else {
                    // No image, look for player name or empty slot
                    // Check if this is an empty roster slot (marked with just "-")
                    const firstCol = sheetData[playerRow][col];
                    const secondCol = sheetData[playerRow][col + 1];
                    
                    if (firstCol === '-' || secondCol === '-') {
                        // This is an empty roster slot
                        isEmptySlot = true;
                        rosterSpots.push({ empty: true });
                        console.log(`  Found empty roster slot at position ${rosterSpots.length}`);
                        continue;
                    }
                    
                    // Try to find player name
                    for (let j = 0; j <= 2; j++) {
                        const cellValue = sheetData[playerRow][col + j];
                        if (cellValue && cellValue !== '' && cellValue !== '-' && 
                            typeof cellValue === 'string' && cellValue.length > 2) {
                            playerName = cellValue;
                            playerPos = sheetData[playerRow][col + j + 1] || '-';
                            playerScore = sheetData[playerRow][col + j + 2] || '-';
                            break;
                        }
                    }
                }
                
                // Skip if no valid player name found and not an empty slot
                if (!playerName || playerName === '' || playerName.length < 3 || !isNaN(playerName)) {
                    continue;
                }
                
                // Stop parsing if we hit what looks like another team name
                // Team names are typically longer and in the same columns as the original team
                const possibleTeamName = sheetData[playerRow][col];
                if (possibleTeamName && typeof possibleTeamName === 'string' && 
                    possibleTeamName.length > 10 && 
                    (possibleTeamName.includes('Team') || possibleTeamName.includes('SZN') || 
                     possibleTeamName.includes('Co.') || possibleTeamName.includes('Revenge'))) {
                    console.log(`  Stopping parse - found next team: ${possibleTeamName}`);
                    break;
                }
                
                // Convert numeric scores to string format
                if (typeof playerScore === 'number') {
                    playerScore = playerScore > 0 ? `+${playerScore}` : `${playerScore}`;
                }
                
                const player = {
                    name: playerName,
                    position: playerPos,
                    score: playerScore,
                    status: '-',
                    hasImage: hasImage,
                    empty: false
                };
                
                console.log(`  Found player: ${playerName} (${playerPos}, ${playerScore}) at position ${rosterSpots.length + 1}`);
                rosterSpots.push(player);
            }
            
            // Now assign players to active/bench based on roster position
            // First 3 slots are active roster, remaining slots are bench
            let activeCount = 0;
            let benchCount = 0;
            
            for (let i = 0; i < rosterSpots.length; i++) {
                const slot = rosterSpots[i];
                
                if (i < 3) {
                    // First 3 positions are active roster
                    if (!slot.empty) {
                        team.activePlayers.push(slot);
                        activeCount++;
                    }
                } else {
                    // Positions 4+ are bench (can be up to 6 bench players)
                    if (!slot.empty) {
                        team.benchPlayers.push(slot);
                        benchCount++;
                    }
                }
            }
            
            console.log(`  Active: ${team.activePlayers.length}, Bench: ${team.benchPlayers.length}`);
            return team;
        };
        
        // Parse teams at known positions
        // Row 1: Two teams at columns 6 and 11
        if (sheetData[1]) {
            const t1 = parseTeam(1, 6);   // Steve's Nightmare
            const t2 = parseTeam(1, 11);  // Pinky Ring SZN
            if (t1) this.teams.push(t1);
            if (t2) this.teams.push(t2);
        }
        
        // Row 12: Four teams 
        if (sheetData[12]) {
            const t3 = parseTeam(12, 1);   // Team Mamba
            const t4 = parseTeam(12, 6);   // Waiver Wire Wednesdays
            const t5 = parseTeam(12, 11);  // Team Early 2000's
            const t6 = parseTeam(12, 16);  // Team Perspective
            if (t3) this.teams.push(t3);
            if (t4) this.teams.push(t4);
            if (t5) this.teams.push(t5);
            if (t6) this.teams.push(t6);
        }
        
        // Row 23: Four teams
        if (sheetData[23]) {
            const t7 = parseTeam(23, 1);   // ČRĖSTHIŁL Co.
            const t8 = parseTeam(23, 6);   // Team Consistency
            const t9 = parseTeam(23, 11);  // Fleetwood maX
            const t10 = parseTeam(23, 16); // Team Invertebrate
            if (t7) this.teams.push(t7);
            if (t8) this.teams.push(t8);
            if (t9) this.teams.push(t9);
            if (t10) this.teams.push(t10);
        }
        
        // Row 34: Four teams (Relegation League)
        if (sheetData[34]) {
            const t11 = parseTeam(34, 1);  // Tomorrow's Golf Team
            const t12 = parseTeam(34, 6);  // Oak Room's Revenge
            const t13 = parseTeam(34, 11); // Team MAGA
            const t14 = parseTeam(34, 16); // Bad News Beavs
            if (t11) this.teams.push(t11);
            if (t12) this.teams.push(t12);
            if (t13) this.teams.push(t13);
            if (t14) this.teams.push(t14);
        }
        
        console.log(`Parsed ${this.teams.length} teams from League Center`);
        this.teams.forEach(team => {
            console.log(`${team.name}: ${team.activePlayers.length} active, ${team.benchPlayers.length} bench`);
        });
    }
    
    // Get live tournament data from ESPN
    async loadTournamentData() {
        try {
            const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard');
            const data = await response.json();
            
            if (data?.events?.[0]) {
                this.tournamentData = data.events[0];
                const competition = this.tournamentData.competitions?.[0];
                
                if (competition) {
                    // Create a map of player positions from ESPN data
                    this.playerPositions = new Map();
                    
                    competition.competitors.forEach(comp => {
                        if (comp.athlete) {
                            const name = comp.athlete.displayName;
                            // Ensure position is always a number
                            const position = parseInt(comp.status?.position?.id) || 999;
                            const displayPosition = comp.status?.position?.displayName || 'MC';
                            const score = comp.score?.displayValue || '-';
                            
                            // Format thru/holes played
                            let thru = comp.status?.thru || 'F';
                            
                            // Handle pre-round state (show tee time)
                            if (thru === 0 && comp.status?.type?.state === 'pre') {
                                const teeTime = comp.status?.teeTime;
                                if (teeTime) {
                                    const teeDate = new Date(teeTime);
                                    const timeString = teeDate.toLocaleTimeString('en-US', { 
                                        hour: 'numeric', 
                                        minute: '2-digit',
                                        timeZone: 'America/New_York'
                                    });
                                    thru = timeString;
                                } else {
                                    thru = 'Sched';
                                }
                            }
                            // Convert "18" to "F" for finished rounds
                            else if (thru === '18' || thru === 18) {
                                thru = 'F';
                            }
                            
                            this.playerPositions.set(name, {
                                position: position,
                                displayPosition: displayPosition,
                                score: score,
                                thru: thru
                            });
                        }
                    });
                    
                    console.log(`Loaded positions for ${this.playerPositions.size} players`);
                }
            }
        } catch (error) {
            console.error('Error loading tournament data:', error);
        }
    }
    
    // Calculate team score based on best active player
    calculateTeamScore(team) {
        let bestPosition = 999;
        let bestPlayer = null;
        let activeCount = 0;
        
        console.log(`\nCalculating best for ${team.name}:`);
        console.log(`Active players: ${team.activePlayers.map(p => p.name).join(', ')}`);
        
        team.activePlayers.forEach(player => {
            const liveData = this.playerPositions?.get(player.name);
            
            if (liveData) {
                // Update player with live data
                player.livePosition = liveData.displayPosition;
                player.liveScore = liveData.score;
                player.liveThru = liveData.thru;
                player.numericPosition = liveData.position;
                
                // Count as active if they have a real position
                if (liveData.position !== 999) {
                    activeCount++;
                }
                
                // Track best player (including all with valid positions)
                // Convert positions to numbers for proper comparison
                const numPosition = parseInt(liveData.position);
                const numBestPosition = parseInt(bestPosition);
                
                console.log(`  Comparing ${player.name} at ${numPosition} vs current best ${numBestPosition}`);
                if (numPosition < numBestPosition) {
                    console.log(`  ${numPosition} < ${numBestPosition} is TRUE - NEW BEST!`);
                    bestPosition = numPosition;
                    bestPlayer = player;
                } else {
                    console.log(`  ${numPosition} < ${numBestPosition} is FALSE`);
                }
            } else {
                // Player not found in tournament data
                // Try to parse position from sheet data if available
                const sheetPos = player.position;
                if (sheetPos && sheetPos !== '-' && sheetPos !== 'MC') {
                    // Parse position like "T6", "1", "T23" etc
                    const numMatch = sheetPos.match(/\d+/);
                    if (numMatch) {
                        const pos = parseInt(numMatch[0]);
                        player.numericPosition = pos;
                        player.livePosition = sheetPos;
                        player.liveScore = player.score || '-';
                        
                        if (pos < bestPosition) {
                            bestPosition = pos;
                            bestPlayer = player;
                            console.log(`Best from sheet data for ${team.name}: ${player.name} at ${sheetPos}`);
                        }
                        
                        if (pos !== 999) {
                            activeCount++;
                        }
                    } else {
                        player.livePosition = 'MC';
                        player.liveScore = '-';
                        player.numericPosition = 999;
                    }
                } else {
                    player.livePosition = 'MC';
                    player.liveScore = '-';
                    player.numericPosition = 999;
                }
            }
        });
        
        // Update bench players with live data too
        team.benchPlayers.forEach(player => {
            const liveData = this.playerPositions?.get(player.name);
            if (liveData) {
                player.livePosition = liveData.displayPosition;
                player.liveScore = liveData.score;
                player.liveThru = liveData.thru;
                player.numericPosition = liveData.position;
            } else {
                // Try to use sheet data for bench players too
                const sheetPos = player.position;
                if (sheetPos && sheetPos !== '-' && sheetPos !== 'MC') {
                    const numMatch = sheetPos.match(/\d+/);
                    if (numMatch) {
                        const pos = parseInt(numMatch[0]);
                        player.numericPosition = pos;
                        player.livePosition = sheetPos;
                        player.liveScore = player.score || '-';
                    } else {
                        player.livePosition = 'MC';
                        player.liveScore = '-';
                        player.numericPosition = 999;
                    }
                } else {
                    player.livePosition = 'MC';
                    player.liveScore = '-';
                    player.numericPosition = 999;
                }
            }
        });
        
        // Team score is best active player's position
        team.bestPosition = bestPosition;
        team.bestPlayer = bestPlayer;
        team.activeInTournament = activeCount;
        
        console.log(`Final best for ${team.name}: ${bestPlayer?.name || 'none'} at position ${bestPosition}`);
        
        return team.bestPosition;
    }
    
    // Sort teams by best player position
    sortTeamsByScore() {
        // Calculate scores for all teams
        this.teams.forEach(team => {
            this.calculateTeamScore(team);
        });
        
        // Sort by best position (lower is better)
        this.teams.sort((a, b) => a.bestPosition - b.bestPosition);
        
        // Add rank
        this.teams.forEach((team, index) => {
            team.currentRank = index + 1;
        });
    }
    
    // Render the team leaderboard
    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let html = `
            <div class="team-leaderboard">
                <div class="team-list">
        `;
        
        this.teams.forEach((team, index) => {
            const leagueClass = team.league === 'CL' ? 'championship' : 'relegation';
            const bestPos = team.bestPosition === 999 ? 'MC' : team.bestPlayer?.livePosition || '-';
            const bestPlayerName = team.bestPlayer?.name || 'No active players';
            
            // Get all player names for this team for searching
            const allPlayerNames = [
                ...team.activePlayers.map(p => p.name),
                ...team.benchPlayers.map(p => p.name)
            ].join(' ').toLowerCase();
            
            html += `
                <div class="team-row ${leagueClass}" data-players="${allPlayerNames}">
                    <div class="team-summary" onclick="toggleTeamExpansion(${index})">
                        <div class="team-rank">#${team.currentRank}</div>
                        <div class="team-info">
                            <div class="team-name">${team.name}</div>
                            <div class="team-leader">
                                <span class="leader-position">${bestPos}</span>
                                <span class="leader-name">${bestPlayerName}</span>
                            </div>
                        </div>
                        <div class="expand-icon">▼</div>
                    </div>
                    
                    <div class="team-details" id="team-details-${index}" style="display: none;">
                        <div class="players-section">
                            <div class="active-players">
                                <h4>Active</h4>
                                <div class="player-list">
            `;
            
            // Show active players sorted by position (best to worst)
            const sortedActive = [...team.activePlayers].sort((a, b) => {
                const aPos = a.numericPosition || 999;
                const bPos = b.numericPosition || 999;
                return aPos - bPos;
            });
            
            sortedActive.forEach(player => {
                const posClass = player.numericPosition === 999 ? 'missed-cut' : '';
                
                // Format thru display
                let thruDisplay = '';
                if (player.liveThru) {
                    thruDisplay = player.liveThru === 'F' ? 'F' : player.liveThru;
                }
                
                html += `
                    <div class="player-row ${posClass}" onclick="event.stopPropagation(); showPlayerDetails('${player.name.replace(/'/g, "\\'")}')">
                        <span class="player-name">${player.name}</span>
                        <span class="player-position">${player.livePosition || player.position}</span>
                        <span class="player-score">${player.liveScore || player.score}${thruDisplay ? ` (${thruDisplay})` : ''}</span>
                    </div>
                `;
            });
            
            html += `
                                </div>
                            </div>
                            
                            <div class="bench-players">
                                <h4>Bench</h4>
                                <div class="player-list">
            `;
            
            // Show bench players sorted by position (best to worst)
            if (team.benchPlayers.length > 0) {
                const sortedBench = [...team.benchPlayers].sort((a, b) => {
                    const aPos = a.numericPosition || 999;
                    const bPos = b.numericPosition || 999;
                    return aPos - bPos;
                });
                
                sortedBench.forEach(player => {
                    // Format thru display
                    let thruDisplay = '';
                    if (player.liveThru) {
                        thruDisplay = player.liveThru === 'F' ? 'F' : player.liveThru;
                    }
                    
                    html += `
                        <div class="player-row bench" onclick="event.stopPropagation(); showPlayerDetails('${player.name.replace(/'/g, "\\'")}')">
                            <span class="player-name">${player.name}</span>
                            <span class="player-position">${player.livePosition || player.position}</span>
                            <span class="player-score">${player.liveScore || player.score}${thruDisplay ? ` (${thruDisplay})` : ''}</span>
                        </div>
                    `;
                });
            } else {
                html += '<div class="player-row bench"><span style="color: #999;">No bench players</span></div>';
            }
            
            html += `
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    // Refresh all data
    async refresh() {
        const btn = document.querySelector('.refresh-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '🔄 Loading...';
        }
        
        try {
            // Load both data sources in parallel
            await Promise.all([
                this.loadTeamData(),
                this.loadTournamentData()
            ]);
            
            // Calculate and sort
            this.sortTeamsByScore();
            
            // Re-render
            this.render('teamLeaderboard');
            
        } catch (error) {
            console.error('Error refreshing team leaderboard:', error);
        }
    }
    
    // Initialize and load
    async init() {
        await this.refresh();
    }
}

// Create global instance
const teamLeaderboard = new TeamLeaderboard();

// Toggle team expansion
window.toggleTeamExpansion = function(index) {
    const details = document.getElementById(`team-details-${index}`);
    const row = details.parentElement;
    const icon = row.querySelector('.expand-icon');
    
    if (details.style.display === 'none') {
        details.style.display = 'block';
        icon.textContent = '▲';
        row.classList.add('expanded');
    } else {
        details.style.display = 'none';
        icon.textContent = '▼';
        row.classList.remove('expanded');
    }
};

// Filter teams by player name
window.filterTeamsByPlayer = function(searchTerm) {
    const term = searchTerm.toLowerCase();
    const teamRows = document.querySelectorAll('.team-row');
    
    teamRows.forEach(row => {
        const playerNames = row.getAttribute('data-players') || '';
        if (term === '' || playerNames.includes(term)) {
            row.style.display = 'block';
        } else {
            row.style.display = 'none';
        }
    });
};

// Auto-refresh every 60 seconds during tournament
setInterval(() => {
    if (document.getElementById('teamLeaderboard')?.parentElement?.classList.contains('active')) {
        teamLeaderboard.refresh();
    }
}, 60000);