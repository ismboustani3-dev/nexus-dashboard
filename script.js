// State Management
let projects = [];
let servers = [];
let teamNames = { team1: 'Team 1', team2: 'Team 2' };

function loadData() {
    try {
        const savedProjects = localStorage.getItem('nexus_projects');
        projects = savedProjects ? JSON.parse(savedProjects) : [];
        
        const savedServers = localStorage.getItem('nexus_servers');
        servers = savedServers ? JSON.parse(savedServers) : [];

        const savedTeams = localStorage.getItem('nexus_teams');
        if (savedTeams) teamNames = JSON.parse(savedTeams);
    } catch (e) {
        console.error('Data load error', e);
    }
}
loadData();

// DOM Elements
const projectGrid = document.getElementById('projectGrid');
const userStatsList = document.getElementById('userStatsList');
const projectForm = document.getElementById('projectForm');
const serverForm = document.getElementById('serverForm');
const modalOverlay = document.getElementById('modalOverlay');
const serverModalOverlay = document.getElementById('serverModalOverlay');
const addProjectBtn = document.getElementById('addProjectBtn');
const totalProjectsEl = document.getElementById('totalProjects');
const totalUsersEl = document.getElementById('totalUsers');
const totalServersEl = document.getElementById('totalServers');
const team1ServerTable = document.getElementById('team1ServerTable');
const team2ServerTable = document.getElementById('team2ServerTable');

// View Switching
window.switchView = function(viewName, element) {
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    element.classList.add('active');
    document.querySelectorAll('.view').forEach(view => view.style.display = 'none');
    document.getElementById(viewName + 'View').style.display = 'block';
};

// Global Actions - Projects
window.deleteProject = function(id) {
    if (confirm('Delete this project?')) {
        projects = projects.filter(p => p.id !== id);
        saveAndRefresh();
    }
};

window.deleteUser = function(owner) {
    if (confirm(`Delete user "${owner}" and all projects?`)) {
        projects = projects.filter(p => p.owner !== owner);
        saveAndRefresh();
    }
};

window.editProject = function(id) {
    const project = projects.find(p => p.id === id);
    if (project) {
        document.getElementById('modalTitle').textContent = 'Edit Project';
        document.getElementById('projectId').value = project.id;
        document.getElementById('ownerName').value = project.owner;
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectLink').value = project.link;
        document.getElementById('username').value = project.username;
        document.getElementById('password').value = project.password;
        if (modalOverlay) modalOverlay.style.display = 'flex';
    }
};

window.togglePassword = function(id, password) {
    const passEl = document.getElementById('pass-' + id);
    if (passEl) passEl.textContent = passEl.textContent === '••••••••' ? password : '••••••••';
};

// Global Actions - Servers
window.openServerModal = function() {
    document.getElementById('serverModalTitle').textContent = 'Add New Server';
    serverForm.reset();
    document.getElementById('serverId').value = '';
    if (serverModalOverlay) serverModalOverlay.style.display = 'flex';
};

window.closeServerModal = function() {
    if (serverModalOverlay) serverModalOverlay.style.display = 'none';
};

window.deleteServer = function(id) {
    if (confirm('Delete this server?')) {
        servers = servers.filter(s => s.id !== id);
        saveAndRefresh();
    }
};

window.editServer = function(id) {
    const srv = servers.find(s => s.id === id);
    if (srv) {
        document.getElementById('serverModalTitle').textContent = 'Edit Server';
        document.getElementById('serverId').value = srv.id;
        document.getElementById('serverName').value = srv.name;
        document.getElementById('mainIP').value = srv.ip;
        document.getElementById('entryDate').value = srv.entry;
        document.getElementById('cancelDate').value = srv.cancel;
        document.getElementById('provider').value = srv.provider;
        document.getElementById('nbrIP').value = srv.nbrIP;
        document.getElementById('serverTeam').value = srv.team;
        if (serverModalOverlay) serverModalOverlay.style.display = 'flex';
    }
};

// Edit Team Name
window.editTeamName = function(teamKey) {
    const newName = prompt(`Enter new name for ${teamNames[teamKey]}:`, teamNames[teamKey]);
    if (newName && newName.trim() !== "") {
        teamNames[teamKey] = newName.trim();
        saveAndRefresh();
    }
};

window.clearAllData = function() {
    if (confirm('RESET ALL DATA? This cannot be undone.')) {
        projects = [];
        servers = [];
        saveAndRefresh();
    }
};

// Render Functions
function renderProjects(data) {
    if (!projectGrid) return;
    projectGrid.innerHTML = data.length === 0 ? '<div style="grid-column: 1/-1; text-align: center; padding: 5rem;">No projects.</div>' : '';
    const grouped = data.reduce((acc, p) => { (acc[p.owner] = acc[p.owner] || []).push(p); return acc; }, {});
    Object.keys(grouped).forEach(owner => {
        const card = document.createElement('div'); card.className = 'user-card';
        card.innerHTML = `<div class="user-card-header"><div style="display: flex; align-items: center; gap: 1rem; flex-grow: 1;"><div class="avatar">${owner.charAt(0).toUpperCase()}</div><h3>${owner}</h3></div><button class="action-btn btn-delete" onclick="deleteUser('${owner}')"><i data-lucide="user-minus" size="18"></i></button></div>
            <div class="project-list">${grouped[owner].map(p => `
            <div class="project-item">
                <div class="project-item-header"><span class="project-item-name">${p.name}</span></div>
                <a href="${p.link}" target="_blank" class="project-item-link">${p.link}</a>
                <div class="project-item-meta"><div class="project-item-auth">User: <code>${p.username}</code><br>Pass: <span id="pass-${p.id}">••••••••</span> <button class="action-btn" onclick="togglePassword('${p.id}', '${p.password}')" style="width:20px;height:20px"><i data-lucide="eye" size="10"></i></button></div>
                <div class="project-item-actions"><button class="action-btn" onclick="editProject('${p.id}')"><i data-lucide="edit-2" size="14"></i></button><button class="action-btn btn-delete" onclick="deleteProject('${p.id}')"><i data-lucide="trash-2" size="14"></i></button></div></div>
            </div>`).join('')}</div>`;
        projectGrid.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

function renderServers() {
    if (!team1ServerTable || !team2ServerTable) return;
    team1ServerTable.innerHTML = ''; team2ServerTable.innerHTML = '';
    
    // Update headers
    document.getElementById('team1Title').textContent = teamNames.team1;
    document.getElementById('team2Title').textContent = teamNames.team2;

    servers.forEach(srv => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><span class="server-name">${srv.name}</span></td><td><code>${srv.ip}</code></td><td><div class="date-info">In: ${srv.entry}</div><div class="date-info" style="color:var(--danger-color)">Out: ${srv.cancel||'-'}</div></td><td>${srv.provider}</td><td><strong>${srv.nbrIP}</strong></td>
            <td><div class="project-item-actions"><button class="action-btn" onclick="editServer('${srv.id}')"><i data-lucide="edit-2" size="12"></i></button><button class="action-btn btn-delete" onclick="deleteServer('${srv.id}')"><i data-lucide="trash-2" size="12"></i></button></div></td>`;
        if (srv.team === '1') team1ServerTable.appendChild(tr); else team2ServerTable.appendChild(tr);
    });
    if (window.lucide) lucide.createIcons();
}

function updateStats() {
    if (totalProjectsEl) totalProjectsEl.textContent = projects.length;
    if (totalUsersEl) totalUsersEl.textContent = new Set(projects.map(p => p.owner)).size;
    if (totalServersEl) totalServersEl.textContent = servers.length;
    if (userStatsList) {
        const grouped = projects.reduce((acc, p) => { (acc[p.owner] = acc[p.owner] || []).push(p); return acc; }, {});
        userStatsList.innerHTML = Object.keys(grouped).map(owner => `<div class="user-stat-item"><div class="user-stat-info"><div class="avatar" style="width:32px;height:32px;font-size:0.75rem">${owner.charAt(0).toUpperCase()}</div><span>${owner}</span></div><div class="user-stat-count">${grouped[owner].length} Projets</div></div>`).join('') || '<p>No data.</p>';
    }
}

function saveAndRefresh() {
    localStorage.setItem('nexus_projects', JSON.stringify(projects));
    localStorage.setItem('nexus_servers', JSON.stringify(servers));
    localStorage.setItem('nexus_teams', JSON.stringify(teamNames));
    renderProjects(projects);
    renderServers();
    updateStats();
}

// Form Listeners
if (projectForm) projectForm.addEventListener('submit', (e) => {
    e.preventDefault(); const id = document.getElementById('projectId').value || Date.now().toString();
    const pData = { id, owner: document.getElementById('ownerName').value, name: document.getElementById('projectName').value, link: document.getElementById('projectLink').value, username: document.getElementById('username').value, password: document.getElementById('password').value };
    const idx = projects.findIndex(p => p.id === id); if (idx > -1) projects[idx] = pData; else projects.push(pData);
    saveAndRefresh(); modalOverlay.style.display = 'none';
});

if (serverForm) serverForm.addEventListener('submit', (e) => {
    e.preventDefault(); const id = document.getElementById('serverId').value || Date.now().toString();
    const sData = { id, name: document.getElementById('serverName').value, ip: document.getElementById('mainIP').value, entry: document.getElementById('entryDate').value, cancel: document.getElementById('cancelDate').value, provider: document.getElementById('provider').value, nbrIP: document.getElementById('nbrIP').value, team: document.getElementById('serverTeam').value };
    const idx = servers.findIndex(s => s.id === id); if (idx > -1) servers[idx] = sData; else servers.push(sData);
    saveAndRefresh(); closeServerModal();
});

document.addEventListener('DOMContentLoaded', () => {
    renderProjects(projects); renderServers(); updateStats();
});
