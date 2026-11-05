/**
 * Game 2: Đào Vàng Tri Thức (Gold Miner) - Light & Crisp Theme
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
            { type: 'big_gold', name: 'Cục Vàng Khổng Lồ', value: 250, icon: 'fa-cubes-stacked', color: 'text-amber-600 bg-amber-50 border-amber-300' },
            { type: 'gold', name: 'Thỏi Vàng Hoàng Kim', value: 150, icon: 'fa-coins', color: 'text-yellow-600 bg-yellow-50 border-yellow-300' },
            { type: 'diamond', name: 'Kim Cương Xanh', value: 300, icon: 'fa-gem', color: 'text-cyan-600 bg-cyan-50 border-cyan-300' },
            { type: 'mystery', name: 'Túi Bí Ẩn May Mắn', value: 200, icon: 'fa-sack-dollar', color: 'text-purple-600 bg-purple-50 border-purple-300' },
            { type: 'ruby', name: 'Hồng Ngọc Lửa', value: 200, icon: 'fa-ring', color: 'text-rose-600 bg-rose-50 border-rose-300' }
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
                <!-- Top HUD Bar (Crisp White) -->
                <div class="bg-white border border-slate-200 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 font-black text-2xl shadow-sm">
                            <i class="fa-solid fa-person-digging"></i>
                        </div>
                        <div>
                            <div class="text-xs font-bold text-amber-800 uppercase tracking-wider">Trò chơi Đào Vàng Tri Thức</div>
                            <div class="text-lg font-black text-slate-900 flex items-center gap-2">
                                Lượt chơi: <span id="gold-team-name" class="${currentTeam ? currentTeam.text : 'text-amber-600'} font-black">${currentTeam ? currentTeam.name : 'Cả Lớp'}</span>
                                <button onclick="window.goldMinerGame.nextTeamTurn()" title="Chuyển lượt đội tiếp theo" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg border border-slate-200 transition">
                                    <i class="fa-solid fa-rotate mr-1 text-amber-600"></i>Đổi đội
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Score Counter -->
                    <div class="flex items-center gap-6">
                        <div class="bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200 flex items-center gap-3 shadow-sm">
                            <i class="fa-solid fa-coins text-amber-500 text-2xl"></i>
                            <div>
                                <div class="text-[10px] uppercase font-bold text-slate-500">Tổng Vàng Đào Được</div>
                                <div id="gold-total-score" class="text-2xl font-black text-amber-700 font-mono">${this.score} $</div>
                            </div>
                        </div>
                    </div>

                    <!-- Teams Mini-Scoreboard -->
                    <div class="flex items-center gap-2">
                        ${window.classManager.teams.map((t, idx) => `
                            <div class="px-3 py-1.5 rounded-xl bg-white border ${idx === this.currentTeamIdx ? 'border-amber-500 ring-2 ring-amber-400 bg-amber-50/50' : 'border-slate-200'} text-xs font-bold flex flex-col items-center shadow-sm">
                                <span class="${t.text}">${t.name.split(' ')[1] || t.name}</span>
                                <span class="text-slate-900 font-mono text-sm font-black">${t.score}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Sunny Underground Minefield Scene (Bright Sand Palette) -->
                <div class="relative bg-gradient-to-b from-amber-50/80 via-orange-50/40 to-amber-100/60 border-2 border-amber-300 rounded-3xl p-6 md:p-8 shadow-sm min-h-[460px] flex flex-col justify-between overflow-hidden">
                    <!-- Surface ground line with Miner -->
                    <div class="flex items-center justify-between border-b-2 border-amber-200 pb-3 mb-4">
                        <div class="flex items-center gap-2 text-amber-900 font-bold text-sm">
                            <i class="fa-solid fa-mountain-sun text-emerald-600 text-lg"></i>
                            <span>Bãi quặng tri thức lớp học</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white px-3.5 py-1 rounded-full border border-amber-300 text-amber-800 text-xs font-bold shadow-sm">
                            <i class="fa-solid fa-hand-pointer text-amber-500 animate-bounce mr-1"></i> Nhấn vào thỏi vàng hoặc kim cương để đào!
                        </div>
                    </div>

                    <!-- Mining Grid (Nuggets in ground) -->
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 items-center justify-items-center py-6" id="gold-nuggets-grid">
                        ${this.renderNuggetsGrid()}
                    </div>

                    <!-- Bottom Controls -->
                    <div class="flex items-center justify-between pt-4 border-t border-amber-200">
                        <button onclick="window.app.showGameSelection()" class="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-sm flex items-center gap-2 transition">
                            <i class="fa-solid fa-arrow-left"></i> Quay lại menu
                        </button>
                        <button onclick="window.goldMinerGame.start(window.goldMinerGame.questions)" class="px-5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold border border-amber-300 shadow-sm flex items-center gap-2 transition">
                            <i class="fa-solid fa-rotate-right"></i> Đặt lại bãi quặng
                        </button>
                    </div>
                </div>
            </div>

            <!-- Question Modal Popup when Gold is Clicked -->
            <div id="gold-modal-overlay" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
                <div class="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative animate-scale-up text-slate-900" id="gold-modal-body">
                    <!-- Loaded dynamically on nugget click -->
                </div>
            </div>
        `;
    }

    renderNuggetsGrid() {
        return this.nuggets.map(nugget => {
            if (nugget.mined) {
                return `
                    <div class="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-300 bg-white/50 flex flex-col items-center justify-center text-slate-400 font-bold text-xs opacity-60">
                        <i class="fa-solid fa-check text-emerald-500 text-lg mb-1"></i> Đã đào
                    </div>
                `;
            }
            return `
                <button onclick="window.goldMinerGame.openNugget(${nugget.id})"
                    class="group relative flex flex-col items-center justify-center p-5 w-24 h-24 rounded-3xl bg-white border-2 ${nugget.color} shadow-sm hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer">
                    <span class="absolute -top-3 px-2 py-0.5 rounded-full bg-white border ${nugget.color} text-[11px] font-black font-mono shadow-sm">
                        +${nugget.value} $
                    </span>
                    <i class="fa-solid ${nugget.icon} text-3xl md:text-4xl my-1 group-hover:rotate-12 transition-transform"></i>
                    <span class="text-[10px] font-black text-slate-700 text-center line-clamp-1 mt-1">${nugget.name}</span>
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
            <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl ${nugget.color} border flex items-center justify-center text-lg shadow-sm">
                        <i class="fa-solid ${nugget.icon}"></i>
                    </div>
                    <div>
                        <div class="text-xs text-amber-700 font-black uppercase">${nugget.name} (+${nugget.value} $)</div>
                        <div class="text-sm font-bold text-slate-800">Đội đang trả lời: <span class="${currentTeam ? currentTeam.text : 'text-amber-600'} font-black">${currentTeam ? currentTeam.name : 'Lớp học'}</span></div>
                    </div>
                </div>
                <!-- Countdown -->
                <div class="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 shadow-sm">
                    <i class="fa-solid fa-stopwatch text-amber-600"></i>
                    <span id="gold-timer" class="font-mono font-black text-lg text-amber-700">${this.timeLeft}s</span>
                </div>
            </div>

            <!-- Question -->
            <div class="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 mb-5 text-center">
                <div class="text-xs text-blue-700 font-black uppercase mb-1">Câu hỏi thử thách</div>
                <h3 class="text-lg md:text-xl font-bold text-slate-900 leading-relaxed" id="gold-q-text">
                    ${q.question}
                </h3>
            </div>

            <!-- Options Grid -->
            ${q.type === 'true_false' ? `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" id="gold-options-container">
                    <button onclick="window.goldMinerGame.checkAnswer('A')" id="gold-opt-A"
                        class="p-5 rounded-2xl bg-white hover:bg-emerald-50 border-2 border-emerald-300 hover:border-emerald-500 text-left transition flex items-center gap-4 shadow-sm group">
                        <span class="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-700 font-black flex items-center justify-center text-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                            <i class="fa-solid fa-check"></i>
                        </span>
                        <div>
                            <div class="text-[11px] font-bold text-emerald-700 uppercase">Khẳng định này</div>
                            <div class="text-xl font-black text-emerald-800">ĐÚNG</div>
                        </div>
                    </button>
                    <button onclick="window.goldMinerGame.checkAnswer('B')" id="gold-opt-B"
                        class="p-5 rounded-2xl bg-white hover:bg-rose-50 border-2 border-rose-300 hover:border-rose-500 text-left transition flex items-center gap-4 shadow-sm group">
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
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3" id="gold-options-container">
                    ${['A', 'B', 'C', 'D'].map(l => `
                        <button onclick="window.goldMinerGame.checkAnswer('${l}')" id="gold-opt-${l}"
                            class="p-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-amber-400 text-left transition flex items-center gap-3 shadow-sm">
                            <span class="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 font-black flex items-center justify-center text-sm border border-amber-300">
                                ${l}
                            </span>
                            <span class="text-slate-800 font-semibold text-sm md:text-base flex-1">
                                ${q.options[l] || ''}
                            </span>
                        </button>
                    `).join('')}
                </div>
            `}

            <!-- Explanation & Feedback -->
            <div id="gold-feedback" class="hidden mt-4 p-4 rounded-2xl shadow-sm"></div>
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
            correctBtn.classList.remove('bg-white', 'border-slate-200');
            correctBtn.classList.add('bg-emerald-500', 'border-emerald-600', 'text-white');
            const badge = correctBtn.querySelector('span');
            if (badge) badge.className = 'w-9 h-9 rounded-xl bg-white text-emerald-800 font-black flex items-center justify-center text-sm';
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
                feedback.className = "mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-center";
                feedback.innerHTML = `
                    <div class="font-black text-lg text-emerald-700 mb-1">
                        <i class="fa-solid fa-circle-check mr-1"></i> CHÍNH XÁC! KÉO ĐƯỢC VÀNG LÊN!
                    </div>
                    <p class="text-sm">+${nugget.value} $ đã cộng vào điểm của <strong>${currentTeam ? currentTeam.name : 'đội'}</strong>!</p>
                    <button onclick="window.goldMinerGame.closeModalAndRefresh()" class="mt-3 px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition shadow">
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
                    wrongBtn.classList.remove('bg-white', 'border-slate-200');
                    wrongBtn.classList.add('bg-rose-500', 'border-rose-600', 'text-white');
                }
            }

            if (feedback) {
                feedback.className = "mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-center";
                feedback.innerHTML = `
                    <div class="font-black text-lg text-rose-700 mb-1">
                        <i class="fa-solid fa-bomb mr-1"></i> ${isTimeOut ? 'HẾT GIỜ!' : 'SAI RỒI! MẮC DÂY TỜI!'}
                    </div>
                    <p class="text-sm">Đáp án đúng là: <strong>${q.answer}. ${q.options[q.answer]}</strong></p>
                    <button onclick="window.goldMinerGame.closeModalAndRefresh()" class="mt-3 px-6 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300 transition">
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
                    <div class="w-20 h-20 rounded-full bg-amber-100 border-2 border-amber-400 mx-auto flex items-center justify-center text-amber-600 text-4xl mb-4 animate-bounce">
                        <i class="fa-solid fa-trophy"></i>
                    </div>
                    <h2 class="text-3xl font-black text-amber-700 mb-2">ĐÃ ĐÀO HẾT MỎ QUẶNG!</h2>
                    <p class="text-slate-600 mb-4">Tổng số quặng vàng thu hoạch được: <strong class="text-amber-800 font-mono text-xl">${this.score} $</strong></p>
                    <div class="grid grid-cols-2 gap-3 mb-6">
                        ${window.classManager.teams.map(t => `
                            <div class="p-3 rounded-2xl bg-white border ${t.border} text-center shadow-sm">
                                <div class="text-xs font-bold ${t.text}">${t.name}</div>
                                <div class="text-xl font-black text-slate-900 font-mono mt-1">${t.score} $</div>
                            </div>
                        `).join('')}
                    </div>
                    <button onclick="window.app.showGameSelection()" class="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-lg shadow transition">
                        Trở về màn hình chính
                    </button>
                </div>
            `;
            modal.classList.remove('hidden');
        }
    }
}

window.goldMinerGame = new GoldMinerGame();
