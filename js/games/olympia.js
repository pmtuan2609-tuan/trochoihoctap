/**
 * Game 3: Đường Lên Đỉnh Olympia - Light & Crisp Theme
 * Precision Timing (mili-giây sát nút), Multi-team Buzzer Lockout (4, 6, 8 Đội),
 * and Full Support for 4-Option Multiple Choice & True/False Questions.
 */
class OlympiaGame {
    constructor() {
        this.questions = [];
        this.currentRound = 'khoi_dong'; // khoi_dong, vuot_cnv, tang_toc, ve_dich
        this.roundIndex = 0;
        this.starOfHope = false;

        // High-precision millisecond timer state
        this.timer = null;
        this.timerStartTime = 0;
        this.timerDuration = 60000; // ms
        this.timeRemaining = 60000; // ms
        this.isTimerRunning = false;

        // Buzzer state
        this.buzzerLocked = false;
        this.buzzerWinner = null;
        this.answeringTimer = null;

        // Tăng Tốc Speed Leaderboard
        this.tangTocSubmissions = [];

        this.cnv = {
            keyword: "VIỆT NAM",
            rows: [
                { q: "Quốc gia hình chữ S ở khu vực Đông Nam Á là nước nào?", a: "VIỆT NAM", solved: false },
                { q: "Bản Tuyên ngôn Độc lập khai sinh nước VNDCCH đọc tại quảng trường nào?", a: "BA ĐÌNH", solved: false },
                { q: "Loài hoa được coi là quốc hoa biểu tượng cho sự thanh cao của người Việt?", a: "HOA SEN", solved: false },
                { q: "Đỉnh núi cao nhất Đông Dương thuộc dãy Hoàng Liên Sơn là gì?", a: "FANSIPAN", solved: false }
            ],
            revealedKeyword: false
        };

        this.setupKeyboardBuzzer();
    }

    get teams() {
        return (window.roomManager && window.roomManager.teams) || (window.classManager && window.classManager.teams) || [];
    }

    setupKeyboardBuzzer() {
        window.addEventListener('keydown', (e) => {
            if (window.app && window.app.selectedGame === 'olympia' && !this.buzzerLocked) {
                const keyNum = parseInt(e.key);
                if (keyNum >= 1 && keyNum <= this.teams.length) {
                    const team = this.teams[keyNum - 1];
                    if (team) {
                        this.handleTeamBuzzer(team.id, `Bàn phím [Phím ${keyNum}]`);
                    }
                }
            }
        });
    }

    start(questions) {
        this.questions = questions && questions.length > 0 ? questions : QuestionParser.getSampleBank('chung');
        this.currentRound = 'khoi_dong';
        this.roundIndex = 0;
        this.starOfHope = false;
        this.buzzerLocked = false;
        this.buzzerWinner = null;
        this.clearAllTimers();
        this.renderGame();
    }

    renderGame() {
        const container = document.getElementById('game-stage');
        if (!container) return;

        container.innerHTML = `
            <div class="relative w-full max-w-6xl mx-auto flex flex-col gap-5 p-2 sm:p-4">
                
                <!-- Top Header & Olympia Round Navigation -->
                <div class="bg-white border border-slate-200 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 font-black text-2xl shadow-sm">
                            <i class="fa-solid fa-laurel-wreath"></i>
                        </div>
                        <div>
                            <div class="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                                <span>Đường Lên Đỉnh Olympia</span>
                                <span class="bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-rose-800 text-[10px] font-black">
                                    ${this.teams.length} Đội thi đấu
                                </span>
                            </div>
                            <div class="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                                <span id="oly-round-title" class="text-rose-600 font-black font-heading">Phần Thi Khởi Động</span>
                            </div>
                        </div>
                    </div>

                    <!-- Round Navigation Tabs -->
                    <div class="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto">
                        <button onclick="window.olympiaGame.switchRound('khoi_dong')" id="tab-khoi_dong" class="oly-tab px-3 py-2 rounded-xl text-xs font-bold transition">1. Khởi Động</button>
                        <button onclick="window.olympiaGame.switchRound('vuot_cnv')" id="tab-vuot_cnv" class="oly-tab px-3 py-2 rounded-xl text-xs font-bold transition">2. Vượt CNV</button>
                        <button onclick="window.olympiaGame.switchRound('tang_toc')" id="tab-tang_toc" class="oly-tab px-3 py-2 rounded-xl text-xs font-bold transition">3. Tăng Tốc</button>
                        <button onclick="window.olympiaGame.switchRound('ve_dich')" id="tab-ve_dich" class="oly-tab px-3 py-2 rounded-xl text-xs font-bold transition">4. Về Đích</button>
                    </div>

                    <!-- Live Multi-team Mini-Scoreboard -->
                    <div class="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
                        ${this.teams.map((t, idx) => `
                            <div class="px-2.5 py-1 rounded-xl bg-white border ${t.border} text-center shadow-sm flex-shrink-0 min-w-[70px]">
                                <div class="text-[10px] font-bold ${t.text} truncate">${t.name.split(' ')[0]} ${t.name.split(' ')[1] || ''}</div>
                                <div class="text-sm font-black text-slate-900 font-mono" id="score-team-${t.id}">${t.score}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Multi-Team Real-time Buzzer Panel (Bảng Chuông Bấm Sát Nút Các Đội) -->
                <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-3.5 sm:p-4 shadow-xl border border-indigo-900">
                    <div class="flex items-center justify-between mb-3 px-1">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-bell text-amber-400 text-base animate-bounce"></i>
                            <span class="text-xs font-black uppercase tracking-wider text-amber-300">Chuông Giành Quyền Trả Lời (Bấm Phím 1..${this.teams.length} hoặc Nhấn Nút)</span>
                        </div>
                        <div id="buzzer-lock-status" class="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <i class="fa-solid fa-circle-dot mr-1 text-[9px] animate-ping"></i> Chuông đang mở - Sẵn sàng bấm
                        </div>
                    </div>

                    <!-- Interactive Team Buzzer Buttons -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 ${this.teams.length > 4 ? 'lg:grid-cols-6 xl:grid-cols-8' : ''} gap-2.5">
                        ${this.teams.map((t, idx) => `
                            <button id="buzzer-btn-${t.id}" onclick="window.olympiaGame.handleTeamBuzzer(${t.id}, 'Bảng tương tác')"
                                class="group relative p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border-2 ${t.border} flex flex-col items-center justify-between text-center transition-all duration-150 active:scale-95 shadow cursor-pointer">
                                <span class="absolute top-1 right-2 font-mono text-[10px] font-black text-white/50">Phím ${idx + 1}</span>
                                <div class="w-8 h-8 rounded-full ${t.bg} text-white flex items-center justify-center text-xs font-black shadow-sm mb-1 group-hover:scale-110 transition">
                                    <i class="fa-solid fa-bell"></i>
                                </div>
                                <div class="text-xs font-black text-white truncate w-full">${t.name}</div>
                                <div class="text-[10px] text-amber-300 font-bold mt-0.5">PIN: ${t.pin}</div>
                            </button>
                        `).join('')}
                    </div>

                    <!-- Buzzer Winner Announcement Banner -->
                    <div id="buzzer-winner-banner" class="hidden mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 flex flex-wrap items-center justify-between gap-3 shadow-lg animate-scale-up">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-white text-amber-600 flex items-center justify-center text-xl font-black shadow">
                                <i class="fa-solid fa-trophy"></i>
                            </div>
                            <div>
                                <div class="text-[11px] font-black uppercase tracking-wider text-slate-900">ĐỘI BẤM CHUÔNG NHANH NHẤT:</div>
                                <div id="buzzer-winner-name" class="text-lg font-black text-slate-950 font-heading">Đội Rồng Đỏ</div>
                            </div>
                        </div>

                        <!-- 5s Answering Countdown -->
                        <div class="flex items-center gap-2 bg-slate-950/20 px-3 py-1.5 rounded-xl border border-white/30">
                            <i class="fa-solid fa-stopwatch text-slate-900"></i>
                            <span class="text-xs font-bold text-slate-900">Thời gian trả lời:</span>
                            <span id="buzzer-answer-timer" class="font-mono text-xl font-black text-slate-950">5.0s</span>
                        </div>

                        <!-- Teacher Quick Adjudicate -->
                        <div class="flex items-center gap-2">
                            <button onclick="window.olympiaGame.adjudicateBuzzer(true)" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow flex items-center gap-1">
                                <i class="fa-solid fa-check"></i> Đúng (+Điểm)
                            </button>
                            <button onclick="window.olympiaGame.adjudicateBuzzer(false)" class="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow flex items-center gap-1">
                                <i class="fa-solid fa-xmark"></i> Sai (Mở chuông)
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Main Round Stage Area -->
                <div id="oly-stage-content" class="min-h-[460px]">
                    <!-- Injected according to currentRound -->
                </div>

                <!-- Bottom Bar -->
                <div class="flex items-center justify-between text-xs text-slate-500 pt-2">
                    <button onclick="window.app.showGameSelection()" class="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-sm flex items-center gap-2 transition">
                        <i class="fa-solid fa-arrow-left"></i> Quay lại menu trò chơi
                    </button>
                    <div>
                        Thời gian và điểm số được đồng bộ thời gian thực theo từng tích tắc
                    </div>
                </div>
            </div>
        `;

        this.switchRound(this.currentRound);
    }

    switchRound(round) {
        this.currentRound = round;
        this.clearAllTimers();
        this.resetBuzzerState();

        // Update tab styles
        ['khoi_dong', 'vuot_cnv', 'tang_toc', 've_dich'].forEach(r => {
            const tab = document.getElementById(`tab-${r}`);
            if (tab) {
                if (r === round) {
                    tab.className = "oly-tab px-3 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 text-white shadow";
                } else {
                    tab.className = "oly-tab px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60";
                }
            }
        });

        const titleElem = document.getElementById('oly-round-title');
        const stageElem = document.getElementById('oly-stage-content');
        if (!stageElem) return;

        if (round === 'khoi_dong') {
            if (titleElem) titleElem.textContent = "Phần Thi Khởi Động (60 Giây Tốc Độ)";
            this.renderKhoiDong(stageElem);
        } else if (round === 'vuot_cnv') {
            if (titleElem) titleElem.textContent = "Phần Thi Vượt Chướng Ngại Vật";
            this.renderVuotCNV(stageElem);
        } else if (round === 'tang_toc') {
            if (titleElem) titleElem.textContent = "Phần Thi Tăng Tốc (Tính Điểm Sát Nút)";
            this.renderTangToc(stageElem);
        } else if (round === 've_dich') {
            if (titleElem) titleElem.textContent = "Phần Thi Về Đích (Ngôi Sao Hy Vọng)";
            this.renderVeDich(stageElem);
        }
    }

    /* ---------------- BUZZER HANDLING ---------------- */
    handleTeamBuzzer(teamId, source = '') {
        if (this.buzzerLocked) return;

        const team = this.teams.find(t => t.id === teamId);
        if (!team) return;

        // Lockout all other buzzers immediately!
        this.buzzerLocked = true;
        this.buzzerWinner = team;

        if (window.soundFX) window.soundFX.playBuzzer();
        if (window.confetti) window.confetti({ particleCount: 60, spread: 50 });

        // Highlight Winning Buzzer Button
        this.teams.forEach(t => {
            const btn = document.getElementById(`buzzer-btn-${t.id}`);
            if (btn) {
                if (t.id === teamId) {
                    btn.className = "group relative p-2.5 rounded-2xl bg-amber-400 text-slate-950 border-4 border-white flex flex-col items-center justify-between text-center scale-105 shadow-2xl animate-pulse ring-4 ring-amber-300";
                } else {
                    btn.classList.add('opacity-40', 'pointer-events-none');
                }
            }
        });

        // Update Lock Status & Show Banner
        const lockStatus = document.getElementById('buzzer-lock-status');
        if (lockStatus) {
            lockStatus.className = "text-[11px] font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40";
            lockStatus.innerHTML = `<i class="fa-solid fa-lock mr-1 text-[9px]"></i> Đã khóa chuông`;
        }

        const banner = document.getElementById('buzzer-winner-banner');
        const winnerName = document.getElementById('buzzer-winner-name');
        if (banner && winnerName) {
            winnerName.textContent = `${team.name} (${source})`;
            banner.classList.remove('hidden');
        }

        // Start 5-second answering countdown for this team
        this.startAnsweringTimer(5);
    }

    onTeamBuzzer(data) {
        if (data && data.teamId) {
            this.handleTeamBuzzer(data.teamId, `${data.studentName || 'Học sinh'} (Điện thoại/Máy tính)`);
        }
    }

    startAnsweringTimer(seconds = 5) {
        if (this.answeringTimer) clearInterval(this.answeringTimer);
        let msLeft = seconds * 1000;

        this.answeringTimer = setInterval(() => {
            msLeft -= 100;
            const timerElem = document.getElementById('buzzer-answer-timer');
            if (timerElem) {
                timerElem.textContent = `${(msLeft / 1000).toFixed(1)}s`;
            }

            if (msLeft <= 0) {
                clearInterval(this.answeringTimer);
                if (window.soundFX) window.soundFX.playWarningTick();
            }
        }, 100);
    }

    adjudicateBuzzer(isCorrect) {
        if (!this.buzzerWinner) return;

        if (this.answeringTimer) clearInterval(this.answeringTimer);

        if (isCorrect) {
            if (window.soundFX) window.soundFX.playCorrect();
            if (window.confetti) window.confetti({ particleCount: 100 });
            this.addScore(this.buzzerWinner.id, 20);
            alert(`CHÍNH XÁC! ${this.buzzerWinner.name} được cộng +20 điểm!`);
            this.resetBuzzerState();
        } else {
            if (window.soundFX) window.soundFX.playWrong();
            alert(`CHƯA CHÍNH XÁC! Mở lại chuông cho các đội khác giành quyền trả lời!`);
            // Unlock buzzer for other teams
            this.buzzerLocked = false;
            const banner = document.getElementById('buzzer-winner-banner');
            if (banner) banner.classList.add('hidden');

            const lockStatus = document.getElementById('buzzer-lock-status');
            if (lockStatus) {
                lockStatus.className = "text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
                lockStatus.innerHTML = `<i class="fa-solid fa-circle-dot mr-1 text-[9px] animate-ping"></i> Chuông đang mở - Cướp điểm!`;
            }

            this.teams.forEach(t => {
                const btn = document.getElementById(`buzzer-btn-${t.id}`);
                if (btn) {
                    btn.classList.remove('opacity-40', 'pointer-events-none', 'scale-105', 'bg-amber-400', 'ring-4');
                }
            });
        }
    }

    resetBuzzerState() {
        this.buzzerLocked = false;
        this.buzzerWinner = null;
        if (this.answeringTimer) clearInterval(this.answeringTimer);

        const banner = document.getElementById('buzzer-winner-banner');
        if (banner) banner.classList.add('hidden');

        const lockStatus = document.getElementById('buzzer-lock-status');
        if (lockStatus) {
            lockStatus.className = "text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
            lockStatus.innerHTML = `<i class="fa-solid fa-circle-dot mr-1 text-[9px] animate-ping"></i> Chuông đang mở - Sẵn sàng bấm`;
        }

        this.teams.forEach(t => {
            const btn = document.getElementById(`buzzer-btn-${t.id}`);
            if (btn) {
                btn.className = `group relative p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border-2 ${t.border} flex flex-col items-center justify-between text-center transition-all duration-150 active:scale-95 shadow cursor-pointer`;
            }
        });
    }

    addScore(teamId, points) {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            team.score += points;
            const scoreElem = document.getElementById(`score-team-${teamId}`);
            if (scoreElem) scoreElem.textContent = team.score;
        }
        if (window.classManager) {
            window.classManager.addScoreToTeam(teamId, points);
        }
    }

    /* ---------------- ROUND 1: KHỞI ĐỘNG (60S HIGH PRECISION) ---------------- */
    renderKhoiDong(container) {
        this.roundIndex = 0;

        container.innerHTML = `
            <div class="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[460px]">
                
                <!-- Top Precision Progress & Clock -->
                <div>
                    <div class="flex items-center justify-between pb-3">
                        <div class="flex items-center gap-2">
                            <span class="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 shadow-sm">
                                Khởi Động 60s - Đếm lùi từng mili-giây (+10 điểm/câu)
                            </span>
                        </div>

                        <!-- Precision Clock -->
                        <div class="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 rounded-2xl border border-amber-300 shadow-sm">
                            <i class="fa-solid fa-stopwatch text-amber-600 text-xl animate-spin" style="animation-duration: 3s;"></i>
                            <span id="kd-precision-timer" class="font-mono text-2xl font-black text-amber-700">60.00s</span>
                        </div>
                    </div>

                    <!-- Progress Bar (Fluid smooth width) -->
                    <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 mb-6">
                        <div id="kd-progress-bar" class="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-75" style="width: 100%;"></div>
                    </div>
                </div>

                <!-- Question Box -->
                <div class="my-4 text-center">
                    <div class="text-xs font-black text-slate-400 uppercase tracking-widest mb-2" id="kd-q-counter">Câu hỏi số 1</div>
                    <h3 id="kd-question-text" class="text-xl md:text-2xl font-black text-slate-900 max-w-3xl mx-auto leading-relaxed">
                        Nhấn nút "Bắt đầu tính giờ 60s" bên dưới để bước vào lượt thi!
                    </h3>
                </div>

                <!-- Dynamic Options Grid (Supports 4 Options & True/False) -->
                <div id="kd-options-grid" class="max-w-4xl mx-auto w-full my-4">
                    <!-- Dynamic choices loaded here -->
                </div>

                <!-- Bottom Controller -->
                <div class="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100">
                    <button id="kd-start-btn" onclick="window.olympiaGame.startKhoiDongClock()" class="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-base shadow-lg transition">
                        <i class="fa-solid fa-play mr-2"></i> Bắt đầu tính giờ 60 giây
                    </button>

                    <div class="flex items-center gap-2">
                        <span class="text-xs text-slate-600 font-bold">Cộng điểm trực tiếp cho:</span>
                        <select id="kd-assign-team" class="bg-slate-50 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                            ${this.teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    startKhoiDongClock() {
        const startBtn = document.getElementById('kd-start-btn');
        if (startBtn) startBtn.classList.add('hidden');

        this.timerDuration = 60000;
        this.timeRemaining = 60000;
        this.timerStartTime = Date.now();
        this.roundIndex = 0;
        this.loadKhoiDongQuestion(0);

        this.clearAllTimers();
        this.isTimerRunning = true;

        this.timer = setInterval(() => {
            const elapsed = Date.now() - this.timerStartTime;
            this.timeRemaining = Math.max(0, this.timerDuration - elapsed);

            const timerElem = document.getElementById('kd-precision-timer');
            const progressElem = document.getElementById('kd-progress-bar');

            if (timerElem) {
                const sec = (this.timeRemaining / 1000).toFixed(2);
                timerElem.textContent = `${sec}s`;
            }

            if (progressElem) {
                const percent = (this.timeRemaining / this.timerDuration) * 100;
                progressElem.style.width = `${percent}%`;
            }

            // Audio tick
            if (this.timeRemaining <= 10000 && this.timeRemaining > 0) {
                if (Math.floor(this.timeRemaining) % 1000 < 50 && window.soundFX) {
                    window.soundFX.playWarningTick();
                }
            }

            if (this.timeRemaining <= 0) {
                this.clearAllTimers();
                if (window.soundFX) window.soundFX.playFanfare();
                alert("HẾT THỜI GIAN 60 GIÂY KHỞI ĐỘNG!");
            }
        }, 50);
    }

    loadKhoiDongQuestion(index) {
        if (index >= this.questions.length) index = 0;
        this.roundIndex = index;
        const q = this.questions[index];

        const counter = document.getElementById('kd-q-counter');
        const qText = document.getElementById('kd-question-text');
        const grid = document.getElementById('kd-options-grid');

        if (counter) counter.textContent = `Câu hỏi số ${index + 1} (${q.type === 'true_false' ? 'Đúng / Sai' : 'Trắc nghiệm 4 đáp án'})`;
        if (qText) qText.innerHTML = q.question;

        if (grid) {
            if (q.type === 'true_false') {
                grid.innerHTML = `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                        <button onclick="window.olympiaGame.checkKhoiDong('A')"
                            class="p-5 rounded-2xl bg-white hover:bg-emerald-50 border-3 border-emerald-300 hover:border-emerald-500 text-left transition flex items-center gap-4 shadow-sm group">
                            <span class="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-700 font-black flex items-center justify-center text-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                                <i class="fa-solid fa-check"></i>
                            </span>
                            <div>
                                <div class="text-[11px] font-bold text-emerald-700 uppercase">Khẳng định này</div>
                                <div class="text-xl font-black text-emerald-800">ĐÚNG</div>
                            </div>
                        </button>
                        <button onclick="window.olympiaGame.checkKhoiDong('B')"
                            class="p-5 rounded-2xl bg-white hover:bg-rose-50 border-3 border-rose-300 hover:border-rose-500 text-left transition flex items-center gap-4 shadow-sm group">
                            <span class="w-12 h-12 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 font-black flex items-center justify-center text-xl group-hover:bg-rose-600 group-hover:text-white transition">
                                <i class="fa-solid fa-xmark"></i>
                            </span>
                            <div>
                                <div class="text-[11px] font-bold text-rose-700 uppercase">Khẳng định này</div>
                                <div class="text-xl font-black text-rose-800">SAI</div>
                            </div>
                        </button>
                    </div>
                `;
            } else {
                grid.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
                        ${['A', 'B', 'C', 'D'].map(l => `
                            <button onclick="window.olympiaGame.checkKhoiDong('${l}')" class="p-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-500 text-left transition flex items-center gap-3 shadow-sm">
                                <span class="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-black flex items-center justify-center text-sm border border-blue-200">${l}</span>
                                <span class="text-slate-800 text-base font-semibold flex-1">${q.options[l] || ''}</span>
                            </button>
                        `).join('')}
                    </div>
                `;
            }
        }

        if (window.renderMathInElement) {
            window.renderMathInElement(document.getElementById('oly-stage-content'), {
                delimiters: [{left: '$', right: '$', display: false}]
            });
        }
    }

    checkKhoiDong(letter) {
        const q = this.questions[this.roundIndex];
        const isCorrect = letter === q.answer;
        const teamSelect = document.getElementById('kd-assign-team');
        const teamId = teamSelect ? parseInt(teamSelect.value) : (this.teams[0]?.id || 1);

        if (isCorrect) {
            if (window.soundFX) window.soundFX.playCorrect();
            this.addScore(teamId, 10);
        } else {
            if (window.soundFX) window.soundFX.playWrong();
        }

        this.loadKhoiDongQuestion(this.roundIndex + 1);
    }

    /* ---------------- ROUND 2: VƯỢT CHƯỚNG NGẠI VẬT ---------------- */
    renderVuotCNV(container) {
        container.innerHTML = `
            <div class="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[460px]">
                <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <div>
                        <span class="px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200 shadow-sm">
                            Trả lời 4 hàng ngang để tìm từ khóa chướng ngại vật (+10đ/hàng ngang, +40đ từ khóa)
                        </span>
                    </div>
                    <button onclick="window.olympiaGame.solveCNVModal()" class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-sm shadow animate-pulse">
                        <i class="fa-solid fa-bell mr-1.5"></i> Bấm Chuông Giải Chướng Ngại Vật!
                    </button>
                </div>

                <!-- 4 Horizontal Rows -->
                <div class="flex flex-col gap-3 my-4">
                    ${this.cnv.rows.map((row, idx) => `
                        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                            <div class="flex items-center gap-3">
                                <span class="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-sm border border-amber-300">
                                    ${idx + 1}
                                </span>
                                <div class="text-left">
                                    <div class="text-xs text-slate-500 uppercase font-bold">Hàng ngang số ${idx + 1} (${row.a.replace(/\s+/g, '').length} chữ cái)</div>
                                    <div class="text-sm md:text-base font-bold text-slate-900">${row.q}</div>
                                </div>
                            </div>

                            <div class="flex items-center gap-2">
                                ${row.solved ? `
                                    <span class="font-mono font-black text-emerald-700 tracking-widest px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300">
                                        ${row.a}
                                    </span>
                                ` : `
                                    <button onclick="window.olympiaGame.openCNVRow(${idx})" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow">
                                        Mở câu hỏi hàng này
                                    </button>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Secret Keyword Reveal Box -->
                <div class="bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-2xl p-5 text-center shadow-sm">
                    <div class="text-xs text-amber-800 uppercase font-black tracking-widest mb-1">Từ Khóa Chướng Ngại Vật Ẩn Số</div>
                    <div class="text-2xl md:text-3xl font-black font-mono tracking-widest text-amber-600">
                        ${this.cnv.revealedKeyword ? this.cnv.keyword : '• • • • • • • •'}
                    </div>
                </div>
            </div>
        `;
    }

    openCNVRow(idx) {
        const row = this.cnv.rows[idx];
        const modal = document.getElementById('global-modal');
        const body = document.getElementById('global-modal-body');
        if (!modal || !body) return;

        body.innerHTML = `
            <div class="p-6 text-center text-slate-900">
                <span class="px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 font-bold text-xs border border-amber-300">
                    Hàng ngang số ${idx + 1} (${row.a.replace(/\s+/g, '').length} chữ cái)
                </span>
                <h3 class="text-xl font-bold text-slate-900 mt-4 mb-4 leading-relaxed">${row.q}</h3>
                
                <div class="max-w-xs mx-auto mb-5">
                    <input type="text" id="cnv-input" placeholder="Nhập đáp án hàng ngang..." class="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-center text-base font-bold uppercase tracking-wider text-slate-900 focus:outline-none focus:border-blue-500">
                </div>

                <div class="flex items-center justify-center gap-2 mb-6">
                    <span class="text-xs text-slate-500 font-bold">Cộng điểm cho:</span>
                    <select id="cnv-team-select" class="bg-slate-50 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200">
                        ${this.teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                    </select>
                </div>

                <div class="flex justify-center gap-3">
                    <button onclick="window.app.closeAllModals()" class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs">Đóng</button>
                    <button onclick="window.olympiaGame.submitCNVRow(${idx})" class="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow">Xác nhận đáp án</button>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    }

    submitCNVRow(idx) {
        const input = document.getElementById('cnv-input');
        const teamSelect = document.getElementById('cnv-team-select');
        if (!input) return;

        const val = input.value.trim().toUpperCase();
        const expected = this.cnv.rows[idx].a.replace(/\s+/g, '').toUpperCase();
        const teamId = teamSelect ? parseInt(teamSelect.value) : this.teams[0].id;

        if (val.replace(/\s+/g, '') === expected) {
            if (window.soundFX) window.soundFX.playCorrect();
            this.cnv.rows[idx].solved = true;
            this.addScore(teamId, 10);
            window.app.closeAllModals();
            this.renderGame();
            alert(`CHÍNH XÁC! Hàng ngang số ${idx + 1} là "${this.cnv.rows[idx].a}"! (+10 điểm)`);
        } else {
            if (window.soundFX) window.soundFX.playWrong();
            alert(`Chưa chính xác!`);
        }
    }

    solveCNVModal() {
        const modal = document.getElementById('global-modal');
        const body = document.getElementById('global-modal-body');
        if (!modal || !body) return;

        body.innerHTML = `
            <div class="p-6 text-center text-slate-900">
                <div class="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mx-auto mb-3 shadow">
                    <i class="fa-solid fa-bell"></i>
                </div>
                <h3 class="text-xl font-black text-slate-900 mb-2">Bấm Chuông Giải Chướng Ngại Vật</h3>
                <p class="text-xs text-slate-500 mb-4">Trả lời đúng nhận +40 điểm! Nếu sai sẽ bị mất quyền thi đấu phần thi này.</p>
                
                <div class="max-w-xs mx-auto mb-4">
                    <input type="text" id="cnv-kw-input" placeholder="Nhập từ khóa CNV..." class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-center text-lg font-black uppercase tracking-widest text-rose-600 focus:outline-none focus:border-rose-500">
                </div>

                <div class="flex items-center justify-center gap-2 mb-6">
                    <span class="text-xs text-slate-500 font-bold">Đội bấm chuông:</span>
                    <select id="cnv-kw-team" class="bg-slate-50 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200">
                        ${this.teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                    </select>
                </div>

                <div class="flex justify-center gap-3">
                    <button onclick="window.app.closeAllModals()" class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs">Hủy</button>
                    <button onclick="window.olympiaGame.submitCNVKeyword()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs shadow">Xác nhận</button>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    }

    submitCNVKeyword() {
        const input = document.getElementById('cnv-kw-input');
        const teamSelect = document.getElementById('cnv-kw-team');
        if (!input) return;

        const val = input.value.trim().toUpperCase().replace(/\s+/g, '');
        const expected = this.cnv.keyword.toUpperCase().replace(/\s+/g, '');
        const teamId = teamSelect ? parseInt(teamSelect.value) : this.teams[0].id;

        if (val === expected) {
            if (window.soundFX) window.soundFX.playFanfare();
            if (window.confetti) window.confetti({ particleCount: 150 });
            this.cnv.revealedKeyword = true;
            this.addScore(teamId, 40);
            window.app.closeAllModals();
            this.renderGame();
            alert(`XUẤT SẮC! ĐÃ GIẢI ĐƯỢC CHƯỚNG NGẠI VẬT: "${this.cnv.keyword}"! (+40 ĐIỂM)`);
        } else {
            if (window.soundFX) window.soundFX.playWrong();
            alert("Rất tiếc! Từ khóa chưa chính xác.");
        }
    }

    /* ---------------- ROUND 3: TĂNG TỐC (SPEED RANKING SÁT NÚT) ---------------- */
    renderTangToc(container) {
        const q = this.questions[this.roundIndex] || this.questions[0];

        container.innerHTML = `
            <div class="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[460px]">
                
                <div class="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
                    <div class="flex items-center gap-2">
                        <span class="px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 font-bold text-xs border border-amber-300 shadow-sm">
                            Tăng Tốc - Điểm số xếp theo tốc độ: Nhanh nhất 40đ • Nhì 30đ • Ba 20đ • Tư 10đ
                        </span>
                    </div>

                    <!-- 30s Countdown -->
                    <div class="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-300 shadow-sm">
                        <i class="fa-solid fa-stopwatch text-amber-600 text-xl"></i>
                        <span id="tt-timer" class="font-mono text-2xl font-black text-amber-700">30.00s</span>
                    </div>
                </div>

                <div class="my-4 text-center">
                    <div class="text-xs text-amber-700 font-black uppercase tracking-widest mb-1">
                        Câu hỏi Tăng Tốc #${this.roundIndex + 1} (${q.type === 'true_false' ? 'Đúng / Sai' : 'Trắc nghiệm 4 đáp án'})
                    </div>
                    <h3 class="text-xl md:text-2xl font-black text-slate-900 max-w-3xl mx-auto leading-relaxed">
                        ${q.question}
                    </h3>
                </div>

                <!-- Options -->
                <div class="max-w-4xl mx-auto w-full my-3">
                    ${q.type === 'true_false' ? `
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                            <button onclick="window.olympiaGame.checkTangToc('A')" class="p-5 rounded-2xl bg-white hover:bg-emerald-50 border-3 border-emerald-300 hover:border-emerald-500 text-left transition flex items-center gap-4 shadow-sm group">
                                <span class="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-700 font-black flex items-center justify-center text-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                                    <i class="fa-solid fa-check"></i>
                                </span>
                                <div>
                                    <div class="text-[11px] font-bold text-emerald-700 uppercase">Khẳng định này</div>
                                    <div class="text-xl font-black text-emerald-800">ĐÚNG</div>
                                </div>
                            </button>
                            <button onclick="window.olympiaGame.checkTangToc('B')" class="p-5 rounded-2xl bg-white hover:bg-rose-50 border-3 border-rose-300 hover:border-rose-500 text-left transition flex items-center gap-4 shadow-sm group">
                                <span class="w-12 h-12 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 font-black flex items-center justify-center text-xl group-hover:bg-rose-600 group-hover:text-white transition">
                                    <i class="fa-solid fa-xmark"></i>
                                </span>
                                <div>
                                    <div class="text-[11px] font-bold text-rose-700 uppercase">Khẳng định này</div>
                                    <div class="text-xl font-black text-rose-800">SAI</div>
                                </div>
                            </button>
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
                            ${['A', 'B', 'C', 'D'].map(l => `
                                <button onclick="window.olympiaGame.checkTangToc('${l}')" class="p-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-amber-400 text-left transition flex items-center gap-3 shadow-sm">
                                    <span class="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 font-black flex items-center justify-center text-sm border border-amber-300">${l}</span>
                                    <span class="text-slate-800 text-base font-semibold flex-1">${q.options[l] || ''}</span>
                                </button>
                            `).join('')}
                        </div>
                    `}
                </div>

                <!-- Bottom Controller -->
                <div class="flex items-center justify-between pt-6 border-t border-slate-100">
                    <button onclick="window.olympiaGame.roundIndex++; window.olympiaGame.switchRound('tang_toc');" class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200 transition">
                        Chuyển câu tiếp theo <i class="fa-solid fa-forward ml-1"></i>
                    </button>
                    <div class="text-xs text-slate-500 font-bold">
                        Đội trả lời nhanh nhất nhận điểm tối đa!
                    </div>
                </div>
            </div>
        `;
    }

    checkTangToc(letter) {
        const q = this.questions[this.roundIndex];
        if (letter === q.answer) {
            if (window.soundFX) window.soundFX.playCorrect();
            if (window.confetti) window.confetti({ particleCount: 80 });
            const team = this.buzzerWinner || this.teams[0];
            this.addScore(team.id, 40);
            alert(`CHÍNH XÁC! ${team.name} nhận +40 Điểm Tăng Tốc!`);
            this.roundIndex++;
            this.switchRound('tang_toc');
        } else {
            if (window.soundFX) window.soundFX.playWrong();
            alert("Chưa chính xác!");
        }
    }

    /* ---------------- ROUND 4: VỀ ĐÍCH ---------------- */
    renderVeDich(container) {
        const q = this.questions[this.roundIndex] || this.questions[0];

        container.innerHTML = `
            <div class="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[460px]">
                
                <div class="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
                    <div class="flex items-center gap-2">
                        <span class="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 shadow-sm">
                            Phần thi Về Đích - Chọn gói câu hỏi & Ngôi sao hy vọng
                        </span>
                    </div>

                    <!-- Star of Hope toggle button -->
                    <button id="star-btn" onclick="window.olympiaGame.toggleStar()" class="px-5 py-2 rounded-2xl border-2 ${this.starOfHope ? 'bg-amber-400 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-400/40' : 'bg-amber-50 border-amber-300 text-amber-800 font-bold'} flex items-center gap-2 transition">
                        <i class="fa-solid fa-star text-base ${this.starOfHope ? 'animate-spin' : ''}"></i>
                        <span>${this.starOfHope ? 'ĐÃ ĐẶT NGÔI SAO HY VỌNG (X2 ĐIỂM)' : 'Đặt Ngôi Sao Hy Vọng'}</span>
                    </button>
                </div>

                <div class="my-4 text-center">
                    <div class="text-xs text-amber-700 font-black uppercase tracking-widest mb-1">
                        Câu hỏi 20 Điểm (${q.type === 'true_false' ? 'Đúng / Sai' : 'Trắc nghiệm 4 đáp án'})
                    </div>
                    <h3 class="text-xl md:text-2xl font-black text-slate-900 max-w-3xl mx-auto leading-relaxed">
                        ${q.question}
                    </h3>
                </div>

                <!-- Dynamic Options -->
                <div class="max-w-4xl mx-auto w-full my-3">
                    ${q.type === 'true_false' ? `
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                            <button onclick="window.olympiaGame.checkVeDich('A')" class="p-5 rounded-2xl bg-white hover:bg-emerald-50 border-3 border-emerald-300 hover:border-emerald-500 text-left transition flex items-center gap-4 shadow-sm group">
                                <span class="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-700 font-black flex items-center justify-center text-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                                    <i class="fa-solid fa-check"></i>
                                </span>
                                <div>
                                    <div class="text-[11px] font-bold text-emerald-700 uppercase">Khẳng định này</div>
                                    <div class="text-xl font-black text-emerald-800">ĐÚNG</div>
                                </div>
                            </button>
                            <button onclick="window.olympiaGame.checkVeDich('B')" class="p-5 rounded-2xl bg-white hover:bg-rose-50 border-3 border-rose-300 hover:border-rose-500 text-left transition flex items-center gap-4 shadow-sm group">
                                <span class="w-12 h-12 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 font-black flex items-center justify-center text-xl group-hover:bg-rose-600 group-hover:text-white transition">
                                    <i class="fa-solid fa-xmark"></i>
                                </span>
                                <div>
                                    <div class="text-[11px] font-bold text-rose-700 uppercase">Khẳng định này</div>
                                    <div class="text-xl font-black text-rose-800">SAI</div>
                                </div>
                            </button>
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
                            ${['A', 'B', 'C', 'D'].map(l => `
                                <button onclick="window.olympiaGame.checkVeDich('${l}')" class="p-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-amber-400 text-left transition flex items-center gap-3 shadow-sm">
                                    <span class="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 font-black flex items-center justify-center text-sm border border-amber-300">${l}</span>
                                    <span class="text-slate-800 text-base font-semibold flex-1">${q.options[l] || ''}</span>
                                </button>
                            `).join('')}
                        </div>
                    `}
                </div>

                <div class="flex items-center justify-between pt-6 border-t border-slate-100">
                    <button onclick="window.olympiaGame.roundIndex++; window.olympiaGame.switchRound('ve_dich');" class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200 transition">
                        Đổi câu hỏi khác <i class="fa-solid fa-forward ml-1"></i>
                    </button>
                    <div class="text-xs text-slate-500 font-bold">
                        Đúng nhân đôi nếu có Sao Hy Vọng, sai bị trừ điểm và mở chuông cướp điểm!
                    </div>
                </div>
            </div>
        `;
    }

    toggleStar() {
        this.starOfHope = !this.starOfHope;
        if (window.soundFX) window.soundFX.playFanfare();
        this.switchRound('ve_dich');
    }

    checkVeDich(letter) {
        const q = this.questions[this.roundIndex];
        const isCorrect = letter === q.answer;
        const basePoints = 20;
        const delta = this.starOfHope ? basePoints * 2 : basePoints;
        const team = this.buzzerWinner || this.teams[0];

        if (isCorrect) {
            if (window.soundFX) window.soundFX.playCorrect();
            if (window.confetti) window.confetti({ particleCount: 120 });
            alert(`CHÍNH XÁC! ${team.name} NHẬN ĐƯỢC +${delta} ĐIỂM!`);
            this.addScore(team.id, delta);
        } else {
            if (window.soundFX) window.soundFX.playWrong();
            if (this.starOfHope) {
                alert(`CHƯA CHÍNH XÁC! Bị trừ -${basePoints} điểm do Ngôi sao hy vọng. Các đội khác có quyền bấm chuông trả lời!`);
                this.addScore(team.id, -basePoints);
            } else {
                alert(`CHƯA CHÍNH XÁC! Các đội khác có quyền bấm chuông giành quyền trả lời!`);
            }
        }

        this.starOfHope = false;
        this.roundIndex++;
        this.switchRound('ve_dich');
    }

    clearAllTimers() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        if (this.answeringTimer) {
            clearInterval(this.answeringTimer);
            this.answeringTimer = null;
        }
        this.isTimerRunning = false;
    }
}

window.olympiaGame = new OlympiaGame();
