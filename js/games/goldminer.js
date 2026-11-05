/**
 * Game 2: Đào Vàng Tri Thức (Gold Miner Educational Game)
 */
class GoldMinerGame {
    constructor() {
        this.questions = [];
        this.currentQIndex = 0;
        this.score = 0;
        this.selectedNugget = null;
        this.activeQuestion = null;
        this.timer = null;
        this.timeLeft = 25;
        this.targetScore = 1000;
        this.currentTeamIdx = 0;

        // Gold nuggets pool
        this.nuggets = [];
    }

    start(questions) {
        this.questions = questions && questions.length > 0 ? questions : QuestionParser.getSampleBank('chung');
        this.score = 0;
        this.currentQIndex = 0;
        this.currentTeamIdx = 0;

        this.generateNuggets();
        this.renderGame();
    }

    generateNuggets() {
        const types = [
            { type: 'big_gold', name: 'Cục Vàng Khổng Lồ', value: 250, size: 'w-24 h-24', icon: 'fa-cubes-stacked', color: 'text-amber-400 bg-amber-500/20 border-amber-400' },
            { type: 'gold', name: 'Thỏi Vàng Hoàng Kim', value: 150, size: 'w-20 h-20', icon: 'fa-coins', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-400' },
            { type: 'diamond', name: 'Kim Cương Xanh', value: 300, size: 'w-16 h-16', icon: 'fa-gem', color: 'text-cyan-300 bg-cyan-500/20 border-cyan-300 animate-pulse' },
            { type: 'mystery', name: 'Túi Bí Ẩn May Mắn', value: 200, size: 'w-18 h-18', icon: 'fa-sack-dollar', color: 'text-purple-400 bg-purple-500/20 border-purple-400' },
            { type: 'ruby', name: 'Hồng Ngọc Lửa', value: 200, size: 'w-16 h-16', icon: 'fa-ring', color: 'text-rose-400 bg-rose-500/20 border-rose-400' }
        ];

        this.nuggets = [];
        const count = Math.min(this.questions.length, 12);
        for (let i = 0; i < count; i++) {
            const t = types[i % types.length];
            this.nuggets.push({
                id: i,
                questionIndex: i,
                name: t.name,
                value: t.value,
                size: t.size,
                icon: t.icon,
                color: t.color,
                mined: false
            });
        }
    }

    renderGame() {
        const container = document.getElementById('game-stage');
        if (!container) return;

        const currentTeam = window.classManager.teams[this.currentTeamIdx];

        container.innerHTML = `
            <div class="relative w-full max-w-6xl mx-auto flex flex-col gap-6 p-4">
                <!-- Top HUD Bar -->
                <div class="bg-slate-900/90 backdrop-blur border border-amber-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/20">
                            <i class="fa-solid fa-person-digging"></i>
                        </div>
                        <div>
                            <div class="text-xs font-semibold text-amber-400 uppercase tracking-wider">Trò chơi Đào Vàng Tri Thức</div>
                            <div class="text-lg font-bold text-white flex items-center gap-2">
                                Lượt chơi: <span id="gold-team-name" class="${currentTeam ? currentTeam.text : 'text-amber-400'} font-black">${currentTeam ? currentTeam.name : 'Cả Lớp'}</span>
                                <button onclick="window.goldMinerGame.nextTeamTurn()" title="Chuyển lượt đội tiếp theo" class="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/40">
                                    <i class="fa-solid fa-rotate mr-1"></i>Đổi đội
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Score Counter -->
                    <div class="flex items-center gap-6">
                        <div class="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-3">
                            <i class="fa-solid fa-coins text-amber-400 text-xl"></i>
                            <div>
                                <div class="text-[10px] uppercase font-bold text-slate-400">Tổng Vàng Đào Được</div>
                                <div id="gold-total-score" class="text-2xl font-black text-amber-400 font-mono">${this.score} $</div>
                            </div>
                        </div>
                    </div>

                    <!-- Teams Mini-Scoreboard -->
                    <div class="flex items-center gap-2">
                        ${window.classManager.teams.map((t, idx) => `
                            <div class="px-3 py-1.5 rounded-xl bg-slate-800/80 border ${idx === this.currentTeamIdx ? t.border + ' ring-2 ring-amber-400' : 'border-slate-700'} text-xs font-bold flex flex-col items-center">
                                <span class="${t.text}">${t.name.split(' ')[1] || t.name}</span>
                                <span class="text-white font-mono text-sm">${t.score}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Underground Minefield Scene -->
                <div class="relative bg-gradient-to-b from-amber-950/80 via-stone-900 to-stone-950 border-2 border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl min-h-[460px] flex flex-col justify-between overflow-hidden">
                    <!-- Surface ground line with Miner -->
                    <div class="flex items-center justify-between border-b-2 border-amber-700/60 pb-3 mb-4">
                        <div class="flex items-center gap-3 text-amber-300 font-semibold text-sm">
                            <i class="fa-solid fa-mountain-sun text-emerald-400 text-lg"></i>
                            <span>Khu vực mỏ quặng tri thức</span>
                        </div>
                        <div class="flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-400/30 text-amber-300 text-xs">
                            <i class="fa-solid fa-hand-pointer animate-bounce mr-1"></i> Click vào thỏi vàng hoặc kim cương để đào!
                        </div>
                    </div>

                    <!-- Mining Grid (Nuggets in ground) -->
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 items-center justify-items-center py-6" id="gold-nuggets-grid">
                        ${this.renderNuggetsGrid()}
                    </div>

                    <!-- Bottom Controls -->
                    <div class="flex items-center justify-between pt-4 border-t border-slate-800">
                        <button onclick="window.app.showGameSelection()" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 flex items-center gap-2">
                            <i class="fa-solid fa-arrow-left"></i> Quay lại
                        </button>
                        <button onclick="window.goldMinerGame.start(window.goldMinerGame.questions)" class="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40 flex items-center gap-2">
                            <i class="fa-solid fa-rotate-right"></i> Đặt lại bãi quặng
                        </button>
                    </div>
                </div>
            </div>

            <!-- Question Modal Popup when Gold is Clicked -->
            <div id="gold-modal-overlay" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 hidden flex items-center justify-center p-4">
                <div class="bg-slate-900 border-2 border-amber-400 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative animate-scale-up" id="gold-modal-body">
                    <!-- Loaded dynamically on nugget click -->
                </div>
            </div>
        `;
    }

    renderNuggetsGrid() {
        return this.nuggets.map(nugget => {
            if (nugget.mined) {
                return `
                    <div class="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-700/60 flex items-center justify-center text-slate-600 font-mono text-xs opacity-40">
                        <i class="fa-solid fa-check"></i> Đã đào
                    </div>
                `;
            }
            return `
                <button onclick="window.goldMinerGame.openNugget(${nugget.id})"
                    class="group relative flex flex-col items-center justify-center p-4 rounded-3xl border-2 ${nugget.color} shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer">
                    <span class="absolute -top-3 px-2 py-0.5 rounded-full bg-slate-900 border ${nugget.color} text-[11px] font-black font-mono">
                        +${nugget.value} $
                    </span>
                    <i class="fa-solid ${nugget.icon} text-3xl md:text-4xl my-2 group-hover:rotate-12 transition-transform"></i>
                    <span class="text-xs font-bold text-white text-center line-clamp-1">${nugget.name}</span>
                </button>
            `;
        }).join('');
    }

    nextTeamTurn() {
        this.currentTeamIdx = (this.currentTeamIdx + 1) % window.classManager.teams.length;
        this.renderGame();
        window.soundFX.playClick();
    }

    openNugget(nuggetId) {
        const nugget = this.nuggets.find(n => n.id === nuggetId);
        if (!nugget || nugget.mined) return;

        this.selectedNugget = nugget;
        const qIndex = nugget.questionIndex % this.questions.length;
        const q = this.questions[qIndex];
        this.activeQuestion = q;

        window.soundFX.playGoldGrab();

        const currentTeam = window.classManager.teams[this.currentTeamIdx];
        const modal = document.getElementById('gold-modal-overlay');
        const modalBody = document.getElementById('gold-modal-body');

        if (!modal || !modalBody) return;

        this.timeLeft = 25;
        this.startTimer();

        modalBody.innerHTML = `
            <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl ${nugget.color} border flex items-center justify-center text-lg">
                        <i class="fa-solid ${nugget.icon}"></i>
                    </div>
                    <div>
                        <div class="text-xs text-amber-400 font-bold uppercase">${nugget.name} (+${nugget.value} $)</div>
                        <div class="text-sm font-semibold text-white">Đội đang trả lời: <span class="${currentTeam ? currentTeam.text : 'text-amber-400'}">${currentTeam ? currentTeam.name : 'Lớp học'}</span></div>
                    </div>
                </div>
                <!-- Countdown -->
                <div class="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                    <i class="fa-solid fa-stopwatch text-amber-400"></i>
                    <span id="gold-timer" class="font-mono font-bold text-lg text-amber-400">${this.timeLeft}s</span>
                </div>
            </div>

            <!-- Question -->
            <div class="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 mb-5 text-center">
                <div class="text-xs text-cyan-400 font-bold uppercase mb-2">Câu hỏi thử thách</div>
                <h3 class="text-lg md:text-xl font-bold text-white leading-relaxed" id="gold-q-text">
                    ${q.question}
                </h3>
            </div>

            <!-- Options Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3" id="gold-options-container">
                ${['A', 'B', 'C', 'D'].map(l => `
                    <button onclick="window.goldMinerGame.checkAnswer('${l}')" id="gold-opt-${l}"
                        class="p-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border-2 border-slate-700 hover:border-amber-400 text-left transition flex items-center gap-3">
                        <span class="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 font-black flex items-center justify-center text-sm border border-amber-400/40">
                            ${l}
                        </span>
                        <span class="text-white font-medium text-sm md:text-base flex-1">
                            ${q.options[l] || ''}
                        </span>
                    </button>
                `).join('')}
            </div>

            <!-- Explanation & Feedback -->
            <div id="gold-feedback" class="hidden mt-4 p-4 rounded-2xl"></div>
        `;

        modal.classList.remove('hidden');

        // Render math with KaTeX if present
        if (window.renderMathInElement) {
            window.renderMathInElement(modalBody, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ]
            });
        }
    }

    startTimer() {
        this.clearTimer();
        this.timer = setInterval(() => {
            this.timeLeft--;
            const timerElem = document.getElementById('gold-timer');
            if (timerElem) timerElem.textContent = `${this.timeLeft}s`;

            if (this.timeLeft <= 5 && this.timeLeft > 0) {
                window.soundFX.playWarningTick();
            }

            if (this.timeLeft <= 0) {
                this.clearTimer();
                this.checkAnswer(null, true);
            }
        }, 1000);
    }

    clearTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    checkAnswer(letter, isTimeOut = false) {
        this.clearTimer();
        const q = this.activeQuestion;
        const nugget = this.selectedNugget;
        const isCorrect = letter === q.answer;
        const feedback = document.getElementById('gold-feedback');
        const currentTeam = window.classManager.teams[this.currentTeamIdx];

        // Disable all option buttons
        ['A', 'B', 'C', 'D'].forEach(l => {
            const btn = document.getElementById(`gold-opt-${l}`);
            if (btn) btn.classList.add('pointer-events-none');
        });

        const correctBtn = document.getElementById(`gold-opt-${q.answer}`);
        if (correctBtn) {
            correctBtn.classList.remove('bg-slate-800', 'border-slate-700');
            correctBtn.classList.add('bg-emerald-600', 'border-emerald-400', 'text-white');
        }

        if (isCorrect) {
            // Correct answer!
            window.soundFX.playCorrect();
            if (window.confetti) {
                window.confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
            }

            nugget.mined = true;
            this.score += nugget.value;
            if (currentTeam) {
                window.classManager.addScoreToTeam(currentTeam.id, nugget.value);
            }

            if (feedback) {
                feedback.className = "mt-4 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-center";
                feedback.innerHTML = `
                    <div class="font-black text-lg text-emerald-300 mb-1">
                        <i class="fa-solid fa-circle-check mr-1"></i> CHÍNH XÁC! KÉO ĐƯỢC VÀNG LÊN!
                    </div>
                    <p class="text-sm">+${nugget.value} $ đã cộng vào điểm của <strong>${currentTeam ? currentTeam.name : 'đội'}</strong>!</p>
                    <button onclick="window.goldMinerGame.closeModalAndRefresh()" class="mt-3 px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition">
                        Tiếp tục đào quặng
                    </button>
                `;
                feedback.classList.remove('hidden');
            }
        } else {
            // Wrong or timeout
            window.soundFX.playExplosion();
            if (letter) {
                const wrongBtn = document.getElementById(`gold-opt-${letter}`);
                if (wrongBtn) {
                    wrongBtn.classList.remove('bg-slate-800', 'border-slate-700');
                    wrongBtn.classList.add('bg-rose-600', 'border-rose-400', 'text-white');
                }
            }

            if (feedback) {
                feedback.className = "mt-4 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-center";
                feedback.innerHTML = `
                    <div class="font-black text-lg text-rose-300 mb-1">
                        <i class="fa-solid fa-bomb mr-1"></i> ${isTimeOut ? 'HẾT GIỜ!' : 'SAI RỒI! MẮC DÂY TỜI!'}
                    </div>
                    <p class="text-sm">Đáp án đúng là: <strong>${q.answer}. ${q.options[q.answer]}</strong></p>
                    <button onclick="window.goldMinerGame.closeModalAndRefresh()" class="mt-3 px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-600 transition">
                        Đổi lượt đội tiếp
                    </button>
                `;
                feedback.classList.remove('hidden');
            }
        }
    }

    closeModalAndRefresh() {
        const modal = document.getElementById('gold-modal-overlay');
        if (modal) modal.classList.add('hidden');

        // Check if all nuggets mined
        const remain = this.nuggets.filter(n => !n.mined);
        if (remain.length === 0) {
            this.showVictory();
        } else {
            this.nextTeamTurn();
        }
    }

    showVictory() {
        window.soundFX.playFanfare();
        if (window.confetti) {
            window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
        }
        const modal = document.getElementById('gold-modal-overlay');
        const modalBody = document.getElementById('gold-modal-body');
        if (modal && modalBody) {
            modalBody.innerHTML = `
                <div class="text-center py-4">
                    <div class="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 mx-auto flex items-center justify-center text-amber-400 text-4xl mb-4 animate-bounce">
                        <i class="fa-solid fa-trophy"></i>
                    </div>
                    <h2 class="text-3xl font-black text-amber-400 mb-2">ĐÃ ĐÀO HẾT MỎ QUẶNG!</h2>
                    <p class="text-slate-300 mb-4">Tổng số quặng vàng thu hoạch được: <strong class="text-white font-mono text-xl">${this.score} $</strong></p>
                    <div class="grid grid-cols-2 gap-3 mb-6">
                        ${window.classManager.teams.map(t => `
                            <div class="p-3 rounded-2xl bg-slate-800/80 border ${t.border} text-center">
                                <div class="text-xs font-bold ${t.text}">${t.name}</div>
                                <div class="text-xl font-black text-white font-mono mt-1">${t.score} $</div>
                            </div>
                        `).join('')}
                    </div>
                    <button onclick="window.app.showGameSelection()" class="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg">
                        Trở về màn hình chính
                    </button>
                </div>
            `;
            modal.classList.remove('hidden');
        }
    }
}

window.goldMinerGame = new GoldMinerGame();
