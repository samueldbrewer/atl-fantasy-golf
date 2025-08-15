// Team Leaderboard Module
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
            // Fallback to embedded sheet or manual entry
            return [];
        }
    }
    
    // Parse the League Center sheet structure
    parseTeamData(sheetData) {
        this.teams = [];
        
        // Debug: Log first few rows to understand structure
        console.log('Sheet data sample:', sheetData.slice(0, 5));
        
        // League Center layout: Teams are in specific positions
        // Based on the data structure observed
        const teamPositions = [
            // Row 1 teams (Championship League)
            { row: 1, cols: [6, 11, 16, 20] },  // Steve's Nightmare, Pinky Ring, etc.
            { row: 12, cols: [1, 6, 11, 16] },  // Team Mamba, WWW, Early 2000s, Perspective
            { row: 23, cols: [1, 6, 11, 16] },  // Cresthill, Consistency, Fleetwood, Invertebrate
            { row: 34, cols: [1, 6, 11, 16] }   // Tomorrow's, Oak Room, MAGA, Bad News
        ];
        
        // Parse teams based on actual sheet structure
        // Row 1: Steve's Nightmare, Pinky Ring
        // Row 12: Team Mamba, WWW, Early 2000s, Perspective  
        // Row 23: Cresthill, Consistency, Fleetwood, Invertebrate
        // Row 34: Tomorrow's, Oak Room, MAGA, Bad News
        
        const teamRows = [
            { row: 1, teams: [
                { col: 6, name: "Steve's Nightmare" },
                { col: 11, name: "Pinky Ring SZN" }
            ]},
            { row: 12, teams: [
                { col: 1, name: "Team Mamba" },
                { col: 6, name: "Waiver Wire Wednesdays" },
                { col: 11, name: "Team Early 2000's" },
                { col: 16, name: "Team Perspective" }
            ]},
            { row: 23, teams: [
                { col: 1, name: "ČRĖSTHIŁL Co." },
                { col: 6, name: "Team Consistency" },
                { col: 11, name: "Fleetwood maX" },
                { col: 16, name: "Team Invertebrate" }
            ]},
            { row: 34, teams: [
                { col: 1, name: "Tomorrow's Golf Team" },
                { col: 6, name: "Oak Room's Revenge" },
                { col: 11, name: "Team MAGA" },
                { col: 16, name: "Bad News Beavs" }
            ]}
        ];
        
        teamRows.forEach(section => {
            section.teams.forEach(teamInfo => {
                const baseRow = section.row;
                const baseCol = teamInfo.col;
                
                // Get team header info
                const teamName = sheetData[baseRow]?.[baseCol] || teamInfo.name;
                const position = sheetData[baseRow]?.[baseCol + 2] || '';
                const league = sheetData[baseRow]?.[baseCol + 3] || 'CL';
                
                const team = {
                    name: teamName,
                    position: position,
                    league: league,
                    activePlayers: [],
                    benchPlayers: [],
                    imageUrl: null
                };
                
                // Parse 6 player rows after team header
                for (let i = 0; i < 6; i++) {
                    const playerRow = baseRow + i + 1;
                    
                    // Check for image
                    const imageCell = sheetData[playerRow]?.[baseCol];
                    const hasImage = imageCell && typeof imageCell === 'object' && imageCell.valueType === 'IMAGE';
                    
                    // Get player data
                    const playerName = hasImage ? 
                        sheetData[playerRow]?.[baseCol + 1] : // If image, name is next column
                        sheetData[playerRow]?.[baseCol];       // Otherwise name is first column
                    
                    const colOffset = hasImage ? 1 : 0;
                    
                    const player = {
                        name: playerName || '',
                        position: sheetData[playerRow]?.[baseCol + colOffset + 1] || '-',
                        score: sheetData[playerRow]?.[baseCol + colOffset + 2] || '-',
                        status: sheetData[playerRow]?.[baseCol + colOffset + 3] || '-',
                        hasImage: hasImage
                    };
                    
                    // Skip empty slots
                    if (!player.name || player.name === '-' || player.name === '') continue;
                    
                    // First 3 are active, rest are bench
                    if (i < 3) {
                        team.activePlayers.push(player);
                    } else {
                        team.benchPlayers.push(player);
                    }
                }
                
                if (team.activePlayers.length > 0) {
                    this.teams.push(team);
                }
            });
        })
        
        console.log(`Parsed ${this.teams.length} teams from League Center`);
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
                            const position = comp.status?.position?.id || 999; // 999 for no position
                            const displayPosition = comp.status?.position?.displayName || 'MC';
                            const score = comp.score?.displayValue || '-';
                            
                            this.playerPositions.set(name, {
                                position: position,
                                displayPosition: displayPosition,
                                score: score,
                                thru: comp.status?.thru || 'F'
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
    
    // Calculate team score based on active players
    calculateTeamScore(team) {
        let totalPosition = 0;
        let activeCount = 0;
        
        team.activePlayers.forEach(player => {
            const liveData = this.playerPositions?.get(player.name);
            
            if (liveData && liveData.position !== 999) {
                totalPosition += liveData.position;
                activeCount++;
                
                // Update player with live data
                player.livePosition = liveData.displayPosition;
                player.liveScore = liveData.score;
                player.liveThru = liveData.thru;
                player.numericPosition = liveData.position;
            } else {
                // Player not in tournament or missed cut
                player.livePosition = 'MC';
                player.liveScore = '-';
                player.numericPosition = 999;
            }
        });
        
        // Calculate average position (lower is better)
        if (activeCount > 0) {
            team.averagePosition = totalPosition / activeCount;
        } else {
            team.averagePosition = 999; // No active players in tournament
        }
        
        team.activeInTournament = activeCount;
        return team.averagePosition;
    }
    
    // Sort teams by average position
    sortTeamsByScore() {
        // Calculate scores for all teams
        this.teams.forEach(team => {
            this.calculateTeamScore(team);
        });
        
        // Sort by average position (lower is better)
        this.teams.sort((a, b) => a.averagePosition - b.averagePosition);
        
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
                <div class="leaderboard-header">
                    <h2>${this.tournamentData?.name || 'Tournament'} - Team Leaderboard</h2>
                    <p class="tournament-info">Ranking based on average position of active players (Top 3)</p>
                </div>
                <div class="team-list">
        `;
        
        this.teams.forEach(team => {
            const leagueClass = team.league === 'CL' ? 'championship' : 'relegation';
            const avgPos = team.averagePosition === 999 ? 'N/A' : team.averagePosition.toFixed(1);
            
            html += `
                <div class="team-card ${leagueClass}">
                    <div class="team-header">
                        <div class="team-rank">#${team.currentRank}</div>
                        <div class="team-info">
                            <h3 class="team-name">${team.name}</h3>
                            <div class="team-stats">
                                <span class="league-badge ${leagueClass}">${team.league}</span>
                                <span class="avg-position">Avg Pos: ${avgPos}</span>
                                <span class="active-count">${team.activeInTournament}/3 Active</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="players-section">
                        <div class="active-players">
                            <h4>Active Roster</h4>
                            <div class="player-list">
            `;
            
            // Show active players
            team.activePlayers.forEach(player => {
                const posClass = player.numericPosition <= 10 ? 'top-10' : 
                                player.numericPosition <= 25 ? 'top-25' : 
                                player.numericPosition === 999 ? 'missed-cut' : '';
                
                html += `
                    <div class="player-row ${posClass}">
                        ${player.hasImage ? '<span class="player-image">📷</span>' : ''}
                        <span class="player-name">${player.name}</span>
                        <span class="player-position">${player.livePosition || player.position}</span>
                        <span class="player-score">${player.liveScore || player.score}</span>
                        ${player.liveThru ? `<span class="player-thru">${player.liveThru}</span>` : ''}
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
            
            // Show bench players
            team.benchPlayers.forEach(player => {
                const liveData = this.playerPositions?.get(player.name);
                const position = liveData?.displayPosition || player.position;
                const score = liveData?.score || player.score;
                
                html += `
                    <div class="player-row bench">
                        ${player.hasImage ? '<span class="player-image">📷</span>' : ''}
                        <span class="player-name">${player.name}</span>
                        <span class="player-position">${position}</span>
                        <span class="player-score">${score}</span>
                    </div>
                `;
            });
            
            html += `
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
                <div class="leaderboard-footer">
                    <button onclick="teamLeaderboard.refresh()" class="refresh-btn">🔄 Refresh</button>
                    <p class="last-updated">Last updated: ${new Date().toLocaleTimeString()}</p>
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

// Auto-refresh every 60 seconds during tournament
setInterval(() => {
    if (document.getElementById('teamLeaderboard')?.parentElement?.classList.contains('active')) {
        teamLeaderboard.refresh();
    }
}, 60000);