/**
 * Game 3: Đường Lên Đỉnh Olympia - Light & Crisp Theme
 */
class OlympiaGame {
    constructor() {
        this.questions = [];
        this.currentRound = 'khoi_dong'; // khoi_dong, vuot_cnv, tang_toc, ve_dich
        this.roundIndex = 0;
        this.timer = null;
        this.timeLeft = 60;
        this.currentTeamIdx = 0;
        this.starOfHope = false;

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
    }

    start(questions) {
        this.questions = questions && questions.length > 0 ? questions : QuestionParser.getSampleBank('chung');
        this.currentRound = 'khoi_dong';
        this.roundIndex = 0;
        this.starOfHope = false;
        this.renderGame();
    }

    renderGame() {
        const container = document.getElementById('game-stage');
        if (!container) return;

        container.innerHTML = `
            <div class="relative w-full max-w-6xl mx-auto flex flex-col gap-6 p-4">
                <!-- Top Header & Olympia Round Navigation (Clean White) -->
                <div class="bg-white border border-slate-200 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 font-black text-2xl shadow-sm">
                            <i class="fa-solid fa-laurel-wreath"></i>
                        </div>
                        <div>
                            <div class="text-xs font-bold text-rose-700 uppercase tracking-wider">Đường Lên Đỉnh Olympia</div>
                            <div class="text-lg font-black text-slate-900 flex items-center gap-2">
                                Vòng thi: <span id="oly-round-title" class="text-rose-600 font-black">Khởi Động</span>
                            </div>
                        </div>
                    </div>

                    <!-- Round Navigation Tabs -->
                    <div class="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                        <button onclick="window.olympiaGame.switchRound('khoi_dong')" id="tab-khoi_dong" class="oly-tab px-3.5 py-2 rounded-xl text-xs font-bold transition">1. Khởi Động</button>
                        <button onclick="window.olympiaGame.switchRound('vuot_cnv')" id="tab-vuot_cnv" class="oly-tab px-3.5 py-2 rounded-xl text-xs font-bold transition">2. Vượt CNV</button>
                        <button onclick="window.olympiaGame.switchRound('tang_toc')" id="tab-tang_toc" class="oly-tab px-3.5 py-2 rounded-xl text-xs font-bold transition">3. Tăng Tốc</button>
                        <button onclick="window.olympiaGame.switchRound('ve_dich')" id="tab-ve_dich" class="oly-tab px-3.5 py-2 rounded-xl text-xs font-bold transition">4. Về Đích</button>
                    </div>

                    <!-- Scoreboard -->
                    <div class="flex items-center gap-2">
                        ${window.classManager.teams.map(t => `
                            <div class="px-3 py-1.5 rounded-xl bg-white border ${t.border} text-center shadow-sm">
                                <div class="text-[10px] font-bold ${t.text}">${t.name.split(' ')[1] || t.name}</div>
                                <div class="text-base font-black text-slate-900 font-mono">${t.score}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Main Round Stage Area -->
                <div id="oly-stage-content" class="min-h-[460px]">
                    <!-- Injected according to currentRound -->
                </div>

                <!-- Bottom Back Button -->
                <div class="flex items-center justify-between">
                    <button onclick="window.app.showGameSelection()" class="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-sm flex items-center gap-2 transition">
                        <i class="fa-solid fa-arrow-left"></i> Quay lại menu trò chơi
                    </button>
                    <div class="text-xs text-slate-500 font-medium">
                        Hệ thống tự động cộng điểm cho các đội khi trả lời chính xác
                    </div>
                </div>
            </div>
        `;

        this.switchRound(this.currentRound);
    }

    switchRound(round) {
        this.currentRound = round;
        this.clearTimer();

        // Update tab styles
        ['khoi_dong', 'vuot_cnv', 'tang_toc', 've_dich'].forEach(r => {
            const tab = document.getElementById(`tab-${r}`);
            if (tab) {
                if (r === round) {
                    tab.className = "oly-tab px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 text-white shadow";
                } else {
                    tab.className = "oly-tab px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60";
                }
            }
        });

        const titleElem = document.getElementById('oly-round-title');
        const stageElem = document.getElementById('oly-stage-content');
        if (!stageElem) return;

        if (round === 'khoi_dong') {
            if (titleElem) titleElem.textContent = "Phần Thi Khởi Động (60 Giây)";
            this.renderKhoiDong(stageElem);
        } else if (round === 'vuot_cnv') {
            if (titleElem) titleElem.textContent = "Phần Thi Vượt Chướng Ngại Vật";
            this.renderVuotCNV(stageElem);
        } else if (round === 'tang_toc') {
            if (titleElem) titleElem.textContent = "Phần Thi Tăng Tốc";
            this.renderTangToc(stageElem);
        } else if (round === 've_dich') {
            if (titleElem) titleElem.textContent = "Phần Thi Về Đích (Ngôi Sao Hy Vọng)";
            this.renderVeDich(stageElem);
        }
    }

    /* ---------------- ROUND 1: KHỞI ĐỘNG ---------------- */
    renderKhoiDong(container) {
        this.timeLeft = 60;
        this.roundIndex = 0;

        container.innerHTML = `
            <div class="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[460px]">
                <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div class="flex items-center gap-3">
                        <span class="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 shadow-sm">
                            Trả lời nhanh nhiều câu hỏi nhất trong 60 giây (+10 điểm/câu)
                        </span>
                    </div>
                    <div class="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200 shadow-sm">
                        <i class="fa-solid fa-stopwatch text-amber-600 text-xl"></i>
                        <span id="kd-timer" class="font-mono text-2xl font-black text-amber-700">60s</span>
                    </div>
                </div>

                <!-- Question Box -->
                <div class="my-6 text-center">
                    <div class="text-xs font-black text-slate-400 uppercase tracking-widest mb-2" id="kd-q-counter">Câu hỏi số 1</div>
                    <h3 id="kd-question-text" class="text-xl md:text-2xl font-black text-slate-900 max-w-3xl mx-auto leading-relaxed">
                        Nhấn nút "Bắt đầu tính giờ" bên dưới để khởi động lượt thi!
                    </h3>
                </div>

                <!-- Options -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto w-full" id="kd-options-grid">
                    <!-- Dynamic -->
                </div>

                <!-- Bottom Controller -->
                <div class="flex items-center justify-between pt-6 border-t border-slate-100">
                    <button id="kd-start-btn" onclick="window.olympiaGame.startKhoiDongClock()" class="px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black shadow transition">
                        <i class="fa-solid fa-play mr-2"></i> Bắt đầu tính giờ 60s
                    </button>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-slate-500 font-bold">Cộng điểm cho:</span>
                        <select id="kd-assign-team" class="bg-slate-50 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                            ${window.classManager.teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    startKhoiDongClock() {
        const startBtn = document.getElementById('kd-start-btn');
        if (startBtn) startBtn.classList.add('hidden');

        this.timeLeft = 60;
        this.roundIndex = 0;
        this.loadKhoiDongQuestion(0);

        this.clearTimer();
        this.timer = setInterval(() => {
            this.timeLeft--;
            const timerElem = document.getElementById('kd-timer');
            if (timerElem) timerElem.textContent = `${this.timeLeft}s`;

            if (this.timeLeft <= 10 && this.timeLeft > 0) window.soundFX.playWarningTick();
            else if (this.timeLeft > 10) window.soundFX.playTick();

            if (this.timeLeft <= 0) {
                this.clearTimer();
                window.soundFX.playFanfare();
                alert("HẾT THỜI GIAN KHỞI ĐỘNG 60 GIÂY!");
            }
        }, 1000);
    }

    loadKhoiDongQuestion(index) {
        if (index >= this.questions.length) index = 0;
        this.roundIndex = index;
        const q = this.questions[index];

        const counter = document.getElementById('kd-q-counter');
        const qText = document.getElementById('kd-question-text');
        const grid = document.getElementById('kd-options-grid');

        if (counter) counter.textContent = `Câu hỏi số ${index + 1}`;
        if (qText) qText.innerHTML = q.question;

        if (grid) {
            grid.innerHTML = ['A', 'B', 'C', 'D'].map(l => `
                <button onclick="window.olympiaGame.checkKhoiDong('${l}')" class="p-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-500 text-left transition flex items-center gap-3 shadow-sm">
                    <span class="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-black flex items-center justify-center text-sm border border-blue-200">${l}</span>
                    <span class="text-slate-800 text-base font-semibold flex-1">${q.options[l]}</span>
                </button>
            `).join('');
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
        const teamId = teamSelect ? parseInt(teamSelect.value) : 1;

        if (isCorrect) {
            window.soundFX.playCorrect();
            window.classManager.addScoreToTeam(teamId, 10);
            this.renderGame();
        } else {
            window.soundFX.playWrong();
        }

        this.loadKhoiDongQuestion(this.roundIndex + 1);
    }

    /* ---------------- ROUND 2: VƯỢT CHƯỚNG NGẠI VẬT ---------------- */
    renderVuotCNV(container) {
        container.innerHTML = `
            <div class="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[460px]">
                <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <div class="flex items-center gap-3">
                        <span class="px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200 shadow-sm">
                            Trả lời 4 hàng ngang để tìm từ khóa chướng ngại vật (+10 điểm/hàng ngang, +40 điểm từ khóa)
                        </span>
                    </div>
                    <button onclick="window.olympiaGame.solveCNVModal()" class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-sm shadow animate-pulse">
                        <i class="fa-solid fa-bell mr-1.5"></i> Bấm chuông giải CNV!
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
                                        Trả lời hàng này
                                    </button>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Secret Keyword Reveal Box -->
                <div class="bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-2xl p-5 text-center shadow-sm">
                    <div class="text-xs text-amber-800 uppercase font-black tracking-widest mb-1">Chướng Ngại Vật Ẩn Số</div>
                    <div class="text-2xl md:text-3xl font-black font-mono tracking-widest text-amber-600">
                        ${this.cnv.revealedKeyword ? this.cnv.keyword : '• • • • • • • •'}
                    </div>
                </div>
            </div>
        `;
    }

    openCNVRow(idx) {
        const row = this.cnv.rows[idx];
        const ans = prompt(`HÀNG NGANG SỐ ${idx + 1}:\n${row.q}\n\nNhập câu trả lời (hoặc nhấn OK để xác nhận đúng):`);
        if (ans !== null) {
            row.solved = true;
            window.soundFX.playCorrect();
            window.classManager.teams[0].score += 10;
            this.switchRound('vuot_cnv');
        }
    }

    solveCNVModal() {
        const guess = prompt("NHẬP TỪ KHÓA CHƯỚNG NGẠI VẬT:");
        if (guess && guess.toUpperCase().trim() === this.cnv.keyword) {
            this.cnv.revealedKeyword = true;
            window.soundFX.playFanfare();
            if (window.confetti) window.confetti({ particleCount: 150 });
            alert("CHÍNH XÁC! TỪ KHÓA LÀ " + this.cnv.keyword + " (+40 ĐIỂM)!");
            window.classManager.teams[0].score += 40;
            this.switchRound('vuot_cnv');
        } else if (guess !== null) {
            window.soundFX.playWrong();
            alert("Rất tiếc! Chưa chính xác từ khóa.");
        }
    }

    /* ---------------- ROUND 3: TĂNG TỐC ---------------- */
    renderTangToc(container) {
        const subIndex = this.roundIndex % 4;
        const speedTimes = [30, 20, 20, 10];
        const q = this.questions[this.roundIndex] || this.questions[0];

        container.innerHTML = `
            <div class="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[460px]">
                <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div class="flex items-center gap-3">
                        <span class="px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 font-bold text-xs border border-amber-300 shadow-sm">
                            Câu hỏi Tăng Tốc số ${subIndex + 1} / 4 (Mức thưởng: 40 - 30 - 20 - 10 điểm)
                        </span>
                    </div>
                    <div class="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200 shadow-sm">
                        <i class="fa-solid fa-stopwatch text-amber-600 text-xl"></i>
                        <span id="tt-timer" class="font-mono text-2xl font-black text-amber-700">${speedTimes[subIndex]}s</span>
                    </div>
                </div>

                <div class="my-6 text-center">
                    <h3 class="text-xl md:text-2xl font-black text-slate-900 max-w-3xl mx-auto leading-relaxed">
                        ${q.question}
                    </h3>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto w-full">
                    ${['A', 'B', 'C', 'D'].map(l => `
                        <button onclick="window.olympiaGame.checkTangToc('${l}')" class="p-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-amber-400 text-left transition flex items-center gap-3 shadow-sm">
                            <span class="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 font-black flex items-center justify-center text-sm border border-amber-300">${l}</span>
                            <span class="text-slate-800 text-base font-semibold flex-1">${q.options[l]}</span>
                        </button>
                    `).join('')}
                </div>

                <div class="flex items-center justify-between pt-6 border-t border-slate-100">
                    <button onclick="window.olympiaGame.roundIndex++; window.olympiaGame.switchRound('tang_toc');" class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200 transition">
                        Chuyển câu tiếp theo <i class="fa-solid fa-forward ml-1"></i>
                    </button>
                    <div class="text-xs text-slate-500 font-bold">Đội trả lời nhanh nhất nhận điểm tối đa!</div>
                </div>
            </div>
        `;
    }

    checkTangToc(letter) {
        const q = this.questions[this.roundIndex];
        if (letter === q.answer) {
            window.soundFX.playCorrect();
            if (window.confetti) window.confetti({ particleCount: 70 });
            alert(`CHÍNH XÁC! (+40 Điểm Tăng Tốc)`);
            window.classManager.teams[0].score += 40;
            this.roundIndex++;
            this.switchRound('tang_toc');
        } else {
            window.soundFX.playWrong();
            alert("Chưa chính xác!");
        }
    }

    /* ---------------- ROUND 4: VỀ ĐÍCH ---------------- */
    renderVeDich(container) {
        const q = this.questions[this.roundIndex] || this.questions[0];

        container.innerHTML = `
            <div class="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[460px]">
                <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div class="flex items-center gap-3">
                        <span class="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 shadow-sm">
                            Phần thi Về Đích - Chọn gói câu hỏi & Ngôi sao hy vọng
                        </span>
                    </div>

                    <!-- Star of Hope toggle button -->
                    <button id="star-btn" onclick="window.olympiaGame.toggleStar()" class="px-5 py-2.5 rounded-2xl border-2 ${this.starOfHope ? 'bg-amber-400 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-400/40' : 'bg-amber-50 border-amber-300 text-amber-800 font-bold'} flex items-center gap-2 transition">
                        <i class="fa-solid fa-star text-lg ${this.starOfHope ? 'animate-spin' : ''}"></i>
                        <span>${this.starOfHope ? 'ĐÃ ĐẶT NGÔI SAO HY VỌNG (X2 ĐIỂM)' : 'Đặt Ngôi Sao Hy Vọng'}</span>
                    </button>
                </div>

                <div class="my-6 text-center">
                    <div class="text-xs text-amber-700 font-black uppercase tracking-widest mb-2">Câu hỏi 20 Điểm</div>
                    <h3 class="text-xl md:text-2xl font-black text-slate-900 max-w-3xl mx-auto leading-relaxed">
                        ${q.question}
                    </h3>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto w-full">
                    ${['A', 'B', 'C', 'D'].map(l => `
                        <button onclick="window.olympiaGame.checkVeDich('${l}')" class="p-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-amber-400 text-left transition flex items-center gap-3 shadow-sm">
                            <span class="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 font-black flex items-center justify-center text-sm border border-amber-300">${l}</span>
                            <span class="text-slate-800 text-base font-semibold flex-1">${q.options[l]}</span>
                        </button>
                    `).join('')}
                </div>

                <div class="flex items-center justify-between pt-6 border-t border-slate-100">
                    <button onclick="window.olympiaGame.roundIndex++; window.olympiaGame.switchRound('ve_dich');" class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200 transition">
                        Đổi câu hỏi khác <i class="fa-solid fa-forward ml-1"></i>
                    </button>
                    <div class="text-xs text-slate-500 font-bold">Đúng nhân đôi nếu có Sao Hy Vọng, sai bị trừ điểm!</div>
                </div>
            </div>
        `;
    }

    toggleStar() {
        this.starOfHope = !this.starOfHope;
        window.soundFX.playFanfare();
        this.switchRound('ve_dich');
    }

    checkVeDich(letter) {
        const q = this.questions[this.roundIndex];
        const isCorrect = letter === q.answer;
        const basePoints = 20;
        const delta = this.starOfHope ? basePoints * 2 : basePoints;

        if (isCorrect) {
            window.soundFX.playCorrect();
            if (window.confetti) window.confetti({ particleCount: 120 });
            alert(`CHÍNH XÁC! BẠN NHẬN ĐƯỢC +${delta} ĐIỂM!`);
            window.classManager.teams[0].score += delta;
        } else {
            window.soundFX.playWrong();
            if (this.starOfHope) {
                alert(`CHƯA CHÍNH XÁC! Bị trừ -${basePoints} điểm do Ngôi sao hy vọng. Các đội khác có quyền bấm chuông trả lời!`);
                window.classManager.teams[0].score = Math.max(0, window.classManager.teams[0].score - basePoints);
            } else {
                alert(`CHƯA CHÍNH XÁC! Các đội khác có quyền bấm chuông giành quyền trả lời!`);
            }
        }

        this.starOfHope = false;
        this.roundIndex++;
        this.switchRound('ve_dich');
    }

    clearTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}

window.olympiaGame = new OlympiaGame();
