/**
 * Room and Team PIN Real-time Sync Manager
 * Supports 4, 6, or 8 teams (4 Tổ, 6 Tổ, 8 Tổ)
 * Provides individual PIN codes for each team and millisecond-precision buzzer synchronization.
 */
class RoomManager {
    constructor() {
        this.roomCode = this.generateRoomCode();
        this.teamCount = 4; // default: 4 teams / 4 tổ
        this.namingScheme = 'to'; // 'to' (Tổ 1, 2, 3...) or 'animal' (Rồng Đỏ, Đại Bàng...)
        this.teams = [];
        this.connectedStudents = []; // { id, name, teamId, joinedAt }
        this.currentBuzzerWinner = null;
        this.buzzerActive = false;
        this.currentQuestionData = null;
        this.channel = null;

        this.initTeams();
        this.initBroadcast();
    }

    generateRoomCode() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    initTeams() {
        const teamPresets = [
            { id: 1, toName: "Tổ 1", animalName: "Đội Rồng Đỏ", pin: "1111", color: "from-red-500 to-rose-600", border: "border-red-500", text: "text-red-600", bg: "bg-red-500", lightBg: "bg-red-50", badge: "border-red-200 text-red-700", icon: "fa-dragon", score: 0 },
            { id: 2, toName: "Tổ 2", animalName: "Đội Đại Bàng Xanh", pin: "2222", color: "from-blue-500 to-cyan-600", border: "border-blue-500", text: "text-blue-600", bg: "bg-blue-500", lightBg: "bg-blue-50", badge: "border-blue-200 text-blue-700", icon: "fa-crow", score: 0 },
            { id: 3, toName: "Tổ 3", animalName: "Đội Hổ Vàng", pin: "3333", color: "from-amber-400 to-yellow-500", border: "border-amber-500", text: "text-amber-600", bg: "bg-amber-500", lightBg: "bg-amber-50", badge: "border-amber-200 text-amber-700", icon: "fa-paw", score: 0 },
            { id: 4, toName: "Tổ 4", animalName: "Đội Sư Tử Tím", pin: "4444", color: "from-purple-500 to-indigo-600", border: "border-purple-500", text: "text-purple-600", bg: "bg-purple-500", lightBg: "bg-purple-50", badge: "border-purple-200 text-purple-700", icon: "fa-shield-cat", score: 0 },
            { id: 5, toName: "Tổ 5", animalName: "Đội Sói Bạc", pin: "5555", color: "from-cyan-500 to-teal-600", border: "border-cyan-500", text: "text-cyan-600", bg: "bg-cyan-500", lightBg: "bg-cyan-50", badge: "border-cyan-200 text-cyan-700", icon: "fa-dog", score: 0 },
            { id: 6, toName: "Tổ 6", animalName: "Đội Gấu Xanh Lá", pin: "6666", color: "from-emerald-500 to-green-600", border: "border-emerald-500", text: "text-emerald-600", bg: "bg-emerald-500", lightBg: "bg-emerald-50", badge: "border-emerald-200 text-emerald-700", icon: "fa-leaf", score: 0 },
            { id: 7, toName: "Tổ 7", animalName: "Đội Phượng Hoàng Lửa", pin: "7777", color: "from-orange-500 to-amber-600", border: "border-orange-500", text: "text-orange-600", bg: "bg-orange-500", lightBg: "bg-orange-50", badge: "border-orange-200 text-orange-700", icon: "fa-fire", score: 0 },
            { id: 8, toName: "Tổ 8", animalName: "Đội Cá Voi Indigo", pin: "8888", color: "from-indigo-500 to-violet-600", border: "border-indigo-500", text: "text-indigo-600", bg: "bg-indigo-500", lightBg: "bg-indigo-50", badge: "border-indigo-200 text-indigo-700", icon: "fa-fish", score: 0 }
        ];

        this.teams = teamPresets.slice(0, this.teamCount).map(t => ({
            ...t,
            name: this.namingScheme === 'to' ? `${t.toName} (${t.animalName.replace('Đội ', '')})` : t.animalName
        }));

        // Sync with global classManager teams if available
        if (window.classManager) {
            window.classManager.teams = this.teams;
        }
    }

    setTeamConfiguration(count, namingScheme) {
        this.teamCount = parseInt(count) || 4;
        if (namingScheme) this.namingScheme = namingScheme;
        this.initTeams();
        this.broadcastState();
        if (window.soundFX) window.soundFX.playClick();
    }

    initBroadcast() {
        try {
            if (window.BroadcastChannel) {
                this.channel = new BroadcastChannel('edu_game_live_room');
                this.channel.onmessage = (event) => this.handleIncomingMessage(event.data);
            }
        } catch (e) {
            console.warn("BroadcastChannel not supported, fallback to storage", e);
        }

        // Storage event fallback for cross-window communication
        window.addEventListener('storage', (e) => {
            if (e.key === 'edu_game_sync_event' && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue);
                    this.handleIncomingMessage(data);
                } catch(err) {}
            }
        });
    }

    sendMessage(action, payload = {}) {
        const message = {
            action: action,
            roomCode: this.roomCode,
            timestamp: Date.now(),
            ...payload
        };

        if (this.channel) {
            try { this.channel.postMessage(message); } catch(e) {}
        }

        try {
            localStorage.setItem('edu_game_sync_event', JSON.stringify(message));
        } catch(e) {}
    }

    handleIncomingMessage(msg) {
        if (!msg || !msg.action) return;

        switch (msg.action) {
            case 'STUDENT_JOIN':
                this.onStudentJoined(msg);
                break;
            case 'BUZZER_PRESS':
                this.onBuzzerPressed(msg);
                break;
            case 'STUDENT_ANSWER':
                this.onStudentAnswer(msg);
                break;
            case 'TEACHER_STATE':
                this.onTeacherStateReceived(msg);
                break;
        }
    }

    /* ---------------- TEACHER ACTIONS ---------------- */
    broadcastState() {
        this.sendMessage('TEACHER_STATE', {
            teams: this.teams,
            teamCount: this.teamCount,
            buzzerActive: this.buzzerActive,
            questionData: this.currentQuestionData
        });
    }

    openTeamSetupModal() {
        if (window.soundFX) window.soundFX.playClick();
        const modal = document.getElementById('global-modal');
        const body = document.getElementById('global-modal-body');
        if (!modal || !body) return;

        body.innerHTML = `
            <!-- Header (Fixed Top) -->
            <div class="px-5 py-3.5 border-b border-slate-200 flex-shrink-0 flex items-center justify-between bg-white">
                <div>
                    <h3 class="text-base font-black text-slate-900 flex items-center gap-2">
                        <i class="fa-solid fa-users-gear text-purple-600"></i>
                        <span>Cài Đặt Chia Đội & Mã PIN Phòng Học</span>
                    </h3>
                    <p class="text-[11px] text-slate-500">Giáo viên chia 4 đội (4 tổ), 6 đội hoặc 8 đội - Mỗi đội có mã PIN riêng biệt</p>
                </div>
                <button onclick="window.app.closeAllModals()" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition">
                    <i class="fa-solid fa-xmark text-sm"></i>
                </button>
            </div>

            <!-- Body (Scrollable) -->
            <div class="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
                
                <!-- Controls: Select Team Count & Scheme -->
                <div class="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                    <div>
                        <div class="text-xs font-black text-purple-900 mb-1">Số lượng đội thi đấu:</div>
                        <div class="flex items-center gap-2">
                            ${[4, 6, 8].map(num => `
                                <button onclick="window.roomManager.setTeamConfiguration(${num}); window.roomManager.openTeamSetupModal();"
                                    class="px-4 py-2 rounded-xl text-xs font-black transition-all ${this.teamCount === num ? 'bg-purple-600 text-white shadow-md scale-105' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
                                    <i class="fa-solid fa-user-group mr-1.5"></i> ${num} Đội (${num === 4 ? '4 Tổ' : num + ' Tổ'})
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div>
                        <div class="text-xs font-black text-purple-900 mb-1">Cách đặt tên đội:</div>
                        <div class="flex items-center gap-2">
                            <button onclick="window.roomManager.setTeamConfiguration(${this.teamCount}, 'to'); window.roomManager.openTeamSetupModal();"
                                class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${this.namingScheme === 'to' ? 'bg-indigo-600 text-white font-black' : 'bg-white text-slate-700 border border-slate-200'}">
                                Tổ 1, Tổ 2, Tổ 3...
                            </button>
                            <button onclick="window.roomManager.setTeamConfiguration(${this.teamCount}, 'animal'); window.roomManager.openTeamSetupModal();"
                                class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${this.namingScheme === 'animal' ? 'bg-indigo-600 text-white font-black' : 'bg-white text-slate-700 border border-slate-200'}">
                                Tên Mascot (Rồng, Đại Bàng...)
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Guidance Banner for Projector -->
                <div class="flex items-center justify-between text-xs font-bold px-2 text-slate-600">
                    <span>Mã PIN riêng từng đội để HS nhập vào phòng thi đấu:</span>
                    <span class="text-purple-600"><i class="fa-solid fa-chalkboard-user mr-1"></i>Chiếu lên bảng cho học sinh</span>
                </div>

                <!-- Teams & PINs Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="teams-pin-grid">
                    ${this.teams.map((t) => {
                        const members = this.connectedStudents.filter(s => s.teamId === t.id);
                        return `
                            <div class="p-3.5 rounded-2xl bg-white border-2 ${t.border} shadow-sm flex flex-col justify-between hover:shadow-md transition">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-10 h-10 rounded-xl ${t.lightBg} ${t.text} flex items-center justify-center text-lg font-black border ${t.badge}">
                                            <i class="fa-solid ${t.icon}"></i>
                                        </div>
                                        <div>
                                            <div class="text-sm font-black text-slate-900">${t.name}</div>
                                            <div class="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                                                <i class="fa-solid fa-wifi text-emerald-500 text-[9px] animate-pulse"></i>
                                                <span id="team-online-${t.id}">${members.length} HS đã vào</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- PIN Box -->
                                    <div class="text-right">
                                        <div class="text-[10px] font-bold text-slate-500 uppercase">Mã PIN Đội</div>
                                        <div class="font-mono text-xl sm:text-2xl font-black ${t.text} tracking-wider bg-slate-50 px-2.5 py-0.5 rounded-xl border border-slate-200">${t.pin}</div>
                                    </div>
                                </div>

                                <!-- Joined Members Preview -->
                                <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <div class="text-slate-500 text-[11px] truncate max-w-[200px]">
                                        ${members.length > 0 ? members.map(m => m.name).join(', ') : 'Chưa có thành viên nào...'}
                                    </div>
                                    <span class="font-mono font-black text-amber-600 text-xs">${t.score} điểm</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

            </div>

            <!-- Footer (Fixed Bottom) -->
            <div class="px-5 py-3 border-t border-slate-200 flex-shrink-0 flex items-center justify-between bg-slate-50">
                <button onclick="window.roomManager.resetScores()" class="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition">
                    <i class="fa-solid fa-rotate-left mr-1 text-slate-500"></i> Đặt lại điểm số
                </button>
                <div class="flex items-center gap-2">
                    <button onclick="window.roomManager.openStudentJoinModal()" class="px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold text-xs transition border border-purple-200">
                        <i class="fa-solid fa-mobile-screen mr-1"></i> Thử vào với vai trò HS
                    </button>
                    <button onclick="window.app.closeAllModals()" class="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs transition shadow">
                        Hoàn tất & Lưu cài đặt
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    resetScores() {
        this.teams.forEach(t => t.score = 0);
        if (window.classManager) window.classManager.resetScores();
        this.broadcastState();
        this.openTeamSetupModal();
        if (window.soundFX) window.soundFX.playClick();
    }

    /* ---------------- STUDENT JOIN & ARENA ---------------- */
    openStudentJoinModal() {
        if (window.soundFX) window.soundFX.playClick();
        const modal = document.getElementById('global-modal');
        const body = document.getElementById('global-modal-body');
        if (!modal || !body) return;

        body.innerHTML = `
            <div class="p-6 md:p-8 text-center text-slate-900">
                <div class="w-16 h-16 rounded-2xl bg-purple-100 border border-purple-300 mx-auto flex items-center justify-center text-purple-700 text-3xl mb-3 shadow-sm animate-bounce">
                    <i class="fa-solid fa-gamepad"></i>
                </div>
                <h3 class="text-2xl font-black text-slate-900 mb-1 font-heading">Vào Phòng Thi Đấu</h3>
                <p class="text-xs text-slate-500 mb-6">Nhập Mã PIN của Đội/Tổ bạn và Tên của bạn để bắt đầu thi đấu trực tiếp</p>

                <!-- Form -->
                <div class="max-w-sm mx-auto space-y-4 mb-6 text-left">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Mã PIN Đội/Tổ của bạn (4 số):</label>
                        <div class="relative">
                            <input type="text" id="join-pin-input" maxlength="6" placeholder="Ví dụ: 1111, 2222, 3333..."
                                class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-2xl text-center text-2xl font-black tracking-widest text-purple-700 focus:outline-none focus:border-purple-600">
                            <i class="fa-solid fa-key absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        </div>
                        <div class="text-[11px] text-slate-500 mt-1">Gợi ý mã mẫu: ${this.teams.map(t => `${t.name.split(' ')[0]}: <strong>${t.pin}</strong>`).join(', ')}</div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Tên học sinh hoặc người đại diện:</label>
                        <input type="text" id="join-name-input" placeholder="Nhập họ và tên..."
                            class="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-600">
                    </div>
                </div>

                <div class="flex items-center justify-center gap-3">
                    <button onclick="window.app.closeAllModals()" class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition">
                        Hủy
                    </button>
                    <button onclick="window.roomManager.submitStudentJoin()" class="px-7 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm shadow-md transition">
                        <i class="fa-solid fa-right-to-bracket mr-1.5"></i> Vào Thi Đấu
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    submitStudentJoin() {
        const pinInput = document.getElementById('join-pin-input');
        const nameInput = document.getElementById('join-name-input');
        if (!pinInput) return;

        const pin = pinInput.value.trim();
        const name = (nameInput && nameInput.value.trim()) || "Học sinh " + Math.floor(10 + Math.random() * 90);

        const matchedTeam = this.teams.find(t => t.pin === pin);
        if (!matchedTeam) {
            alert(`Mã PIN "${pin}" không đúng! Vui lòng xem mã PIN của đội trên màn hình máy chiếu.`);
            return;
        }

        const student = {
            id: Date.now(),
            name: name,
            teamId: matchedTeam.id,
            joinedAt: Date.now()
        };

        this.connectedStudents.push(student);
        this.sendMessage('STUDENT_JOIN', { student: student, team: matchedTeam });

        if (window.soundFX) window.soundFX.playFanfare();
        if (window.confetti) window.confetti({ particleCount: 80 });

        // Launch Student Interactive Controller View
        this.openStudentControllerView(matchedTeam, name);
    }

    onStudentJoined(msg) {
        if (!msg.student) return;
        const exists = this.connectedStudents.some(s => s.id === msg.student.id);
        if (!exists) {
            this.connectedStudents.push(msg.student);
        }
        // Update online counter if visible
        const countElem = document.getElementById(`team-online-${msg.student.teamId}`);
        if (countElem) {
            const teamMembers = this.connectedStudents.filter(s => s.teamId === msg.student.teamId);
            countElem.textContent = `${teamMembers.length} HS đã vào`;
        }
    }

    /* ---------------- STUDENT BUZZER CONTROLLER ---------------- */
    openStudentControllerView(team, studentName) {
        const modal = document.getElementById('global-modal');
        const body = document.getElementById('global-modal-body');
        if (!modal || !body) return;

        body.innerHTML = `
            <div class="p-5 md:p-8 text-center text-slate-900 flex flex-col items-center">
                <!-- Team Badge -->
                <div class="px-4 py-1.5 rounded-full ${team.lightBg} border ${team.badge} text-xs font-black uppercase tracking-wider mb-2">
                    Bạn thuộc về: <span class="${team.text}">${team.name}</span>
                </div>
                <h3 class="text-xl md:text-2xl font-black text-slate-900 mb-1">Xin chào, ${studentName}!</h3>
                <p class="text-xs text-slate-500 mb-6">Thiết bị của bạn đã kết nối sẵn sàng vào trò chơi của lớp</p>

                <!-- GIANT BUZZER BUTTON -->
                <div class="my-4">
                    <button id="student-buzzer-btn" onclick="window.roomManager.pressBuzzer(${team.id}, '${studentName}')"
                        class="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-rose-500 via-red-500 to-amber-500 border-8 border-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-150 flex flex-col items-center justify-center text-white cursor-pointer group">
                        <i class="fa-solid fa-bell text-5xl sm:text-6xl drop-shadow group-hover:rotate-12 transition-transform"></i>
                        <span class="text-xl sm:text-2xl font-black mt-2 uppercase tracking-widest drop-shadow">BẤM CHUÔNG</span>
                        <span class="text-[10px] font-bold opacity-80 mt-1">Giành quyền trả lời</span>
                    </button>
                </div>

                <!-- Status Feedback Box -->
                <div id="student-buzzer-status" class="w-full max-w-sm mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
                    <i class="fa-solid fa-circle-check text-emerald-500 mr-1.5"></i> Trạng thái: Sẵn sàng bấm chuông
                </div>

                <div class="mt-6 flex gap-2">
                    <button onclick="window.app.closeAllModals()" class="px-6 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200">
                        Đóng cửa sổ
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    pressBuzzer(teamId, studentName = 'Học sinh') {
        const team = this.teams.find(t => t.id === teamId);
        if (!team) return;

        const buzzTime = Date.now();
        this.sendMessage('BUZZER_PRESS', {
            teamId: teamId,
            teamName: team.name,
            studentName: studentName,
            buzzTime: buzzTime
        });

        // Trigger local handler too
        this.onBuzzerPressed({
            teamId: teamId,
            teamName: team.name,
            studentName: studentName,
            buzzTime: buzzTime
        });
    }

    onBuzzerPressed(data) {
        if (window.soundFX) window.soundFX.playBuzzer();

        // Notify Olympia game if active
        if (window.olympiaGame && window.olympiaGame.onTeamBuzzer) {
            window.olympiaGame.onTeamBuzzer(data);
        }

        // Update student view status if open
        const statusElem = document.getElementById('student-buzzer-status');
        if (statusElem) {
            statusElem.className = "w-full max-w-sm mt-4 p-3 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs font-black text-amber-800 animate-bounce";
            statusElem.innerHTML = `<i class="fa-solid fa-bell text-amber-600 mr-1.5"></i> ${data.teamName} ĐÃ BẤM CHUÔNG THÀNH CÔNG!`;
        }
    }
}

window.roomManager = new RoomManager();
