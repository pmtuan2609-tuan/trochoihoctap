/**
 * Game 1: Ai Là Triệu Phú (Who Wants to Be a Millionaire)
 */
class MillionaireGame {
    constructor() {
        this.currentQuestionIdx = 0;
        this.questions = [];
        this.selectedAnswer = null;
        this.isLocked = false;
        this.timer = null;
        this.timeLeft = 30;
        this.activeLifelines = {
            half: true,
            audience: true,
            call: true,
            change: true
        };
        this.hiddenOptions = [];
        this.currentPlayer = null;

        this.moneyLevels = [
            "200.000", "400.000", "600.000", "1.000.000", "2.000.000",
            "3.000.000", "6.000.000", "10.000.000", "14.000.000", "22.000.000",
            "30.000.000", "40.000.000", "60.000.000", "85.000.000", "150.000.000"
        ];
    }

    start(questions, player = null) {
        this.questions = questions && questions.length > 0 ? questions : QuestionParser.getSampleBank('chung');
        this.currentQuestionIdx = 0;
        this.selectedAnswer = null;
        this.isLocked = false;
        this.currentPlayer = player || window.classManager.getRandomStudent();
        this.activeLifelines = { half: true, audience: true, call: true, change: true };
        this.hiddenOptions = [];

        this.renderGame();
        this.loadQuestion(0);
    }

    renderGame() {
        const container = document.getElementById('game-stage');
        if (!container) return;

        container.innerHTML = `
            <div class="relative w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 p-4">
                <!-- Main Game Zone -->
                <div class="flex-1 flex flex-col justify-between">
                    <!-- Top Bar: Player, Timer, Controls -->
                    <div class="bg-slate-900/90 backdrop-blur border border-cyan-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 font-bold text-xl">
                                <i class="fa-solid fa-graduation-cap"></i>
                            </div>
                            <div>
                                <div class="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Người chơi hiện tại</div>
                                <div class="text-lg font-bold text-white flex items-center gap-2" id="mil-player-name">
                                    ${this.currentPlayer ? this.currentPlayer.name : 'Đại diện lớp'}
                                    <button onclick="window.millionaireGame.pickNewPlayer()" title="Chọn ngẫu nhiên học sinh khác" class="text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 px-2 py-1 rounded border border-cyan-500/40">
                                        <i class="fa-solid fa-shuffle mr-1"></i>Đổi bạn
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Timer Wheel -->
                        <div class="flex items-center gap-3">
                            <div class="relative w-14 h-14 flex items-center justify-center">
                                <svg class="w-full h-full transform -rotate-90">
                                    <circle cx="28" cy="28" r="24" stroke="currentColor" stroke-width="4" class="text-slate-700 fill-none" />
                                    <circle id="mil-timer-circle" cx="28" cy="28" r="24" stroke="currentColor" stroke-width="4" 
                                        stroke-dasharray="150" stroke-dashoffset="0"
                                        class="text-amber-400 fill-none transition-all duration-1000 ease-linear" />
                                </svg>
                                <span id="mil-timer-text" class="absolute text-xl font-black text-amber-400">30</span>
                            </div>
                        </div>

                        <!-- Lifelines -->
                        <div class="flex items-center gap-2">
                            <button id="btn-life-half" onclick="window.millionaireGame.use5050()" class="lifeline-btn relative px-3 py-2 rounded-xl font-bold text-sm bg-gradient-to-b from-blue-700 to-indigo-900 border border-cyan-400/50 text-white shadow hover:scale-105 active:scale-95 transition" title="Trợ giúp 50:50">
                                <span>50:50</span>
                            </button>
                            <button id="btn-life-audience" onclick="window.millionaireGame.useAudience()" class="lifeline-btn relative px-3 py-2 rounded-xl font-bold text-sm bg-gradient-to-b from-blue-700 to-indigo-900 border border-cyan-400/50 text-white shadow hover:scale-105 active:scale-95 transition" title="Hỏi ý kiến cả lớp">
                                <i class="fa-solid fa-users"></i>
                            </button>
                            <button id="btn-life-call" onclick="window.millionaireGame.useCall()" class="lifeline-btn relative px-3 py-2 rounded-xl font-bold text-sm bg-gradient-to-b from-blue-700 to-indigo-900 border border-cyan-400/50 text-white shadow hover:scale-105 active:scale-95 transition" title="Gọi cố vấn / Thầy cô">
                                <i class="fa-solid fa-phone"></i>
                            </button>
                            <button id="btn-life-change" onclick="window.millionaireGame.useChange()" class="lifeline-btn relative px-3 py-2 rounded-xl font-bold text-sm bg-gradient-to-b from-blue-700 to-indigo-900 border border-cyan-400/50 text-white shadow hover:scale-105 active:scale-95 transition" title="Đổi câu hỏi mới">
                                <i class="fa-solid fa-arrows-rotate"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Question Container -->
                    <div class="my-6">
                        <div class="relative bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-2 border-amber-400/60 rounded-3xl p-6 md:p-8 shadow-2xl text-center min-h-[160px] flex flex-col justify-center items-center">
                            <span class="inline-block px-4 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-sm border border-amber-400/40 mb-3" id="mil-q-num">
                                Câu hỏi 1 / 15
                            </span>
                            <h2 id="mil-question-text" class="text-xl md:text-2xl font-bold text-white tracking-wide leading-relaxed">
                                Đang tải câu hỏi...
                            </h2>
                        </div>
                    </div>

                    <!-- Options Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="mil-options-grid">
                        <!-- Rendered dynamically -->
                    </div>

                    <!-- Explanation Card (Hidden by default) -->
                    <div id="mil-explanation" class="hidden mt-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-4 text-emerald-200 text-sm">
                        <div class="font-bold flex items-center gap-2 mb-1 text-emerald-300">
                            <i class="fa-solid fa-lightbulb"></i> Giải thích chi tiết:
                        </div>
                        <div id="mil-explanation-text"></div>
                    </div>

                    <!-- Action Bar -->
                    <div class="mt-6 flex items-center justify-between">
                        <button onclick="window.app.showGameSelection()" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 flex items-center gap-2">
                            <i class="fa-solid fa-arrow-left"></i> Quay lại
                        </button>
                        <button id="mil-next-btn" onclick="window.millionaireGame.nextQuestion()" class="hidden px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 flex items-center gap-2 animate-bounce">
                            Câu tiếp theo <i class="fa-solid fa-forward"></i>
                        </button>
                    </div>
                </div>

                <!-- Money Ladder Sidebar -->
                <div class="w-full lg:w-72 bg-slate-900/90 backdrop-blur border border-amber-400/30 rounded-2xl p-4 shadow-xl flex flex-col">
                    <div class="text-center font-black text-amber-400 text-sm tracking-widest uppercase mb-3 pb-2 border-b border-slate-800">
                        <i class="fa-solid fa-trophy mr-1"></i> Bậc Thang Điểm Thưởng
                    </div>
                    <div class="flex-1 flex flex-col-reverse gap-1.5 overflow-y-auto pr-1" id="mil-ladder-list">
                        <!-- Ladder steps 1 to 15 -->
                    </div>
                </div>
            </div>

            <!-- Lifeline Modal Container -->
            <div id="mil-modal-overlay" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
                <div class="bg-slate-900 border-2 border-cyan-400 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-scale-up" id="mil-modal-body">
                    <!-- Dynamic modal content -->
                </div>
            </div>
        `;

        this.renderLadder();
    }

    renderLadder() {
        const ladderList = document.getElementById('mil-ladder-list');
        if (!ladderList) return;

        ladderList.innerHTML = this.moneyLevels.map((val, idx) => {
            const isMilestone = idx === 4 || idx === 9 || idx === 14;
            return `
                <div id="ladder-step-${idx}" class="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                    isMilestone ? 'text-amber-300 bg-amber-500/10 border border-amber-500/30' : 'text-slate-400 hover:bg-slate-800/50'
                }">
                    <span class="flex items-center gap-2">
                        <span class="w-5 text-right opacity-70">${idx + 1}</span>
                        ${isMilestone ? '<i class="fa-solid fa-star text-amber-400 text-[10px]"></i>' : '•'}
                    </span>
                    <span class="font-mono text-sm">${val} VNĐ</span>
                </div>
            `;
        }).join('');
    }

    pickNewPlayer() {
        this.currentPlayer = window.classManager.getRandomStudent();
        const pElem = document.getElementById('mil-player-name');
        if (pElem && this.currentPlayer) {
            pElem.innerHTML = `
                ${this.currentPlayer.name}
                <button onclick="window.millionaireGame.pickNewPlayer()" title="Chọn ngẫu nhiên bạn khác" class="text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 px-2 py-1 rounded border border-cyan-500/40">
                    <i class="fa-solid fa-shuffle mr-1"></i>Đổi bạn
                </button>
            `;
            window.soundFX.playClick();
        }
    }

    loadQuestion(index) {
        if (index >= this.questions.length) {
            this.showVictory();
            return;
        }

        this.currentQuestionIdx = index;
        this.isLocked = false;
        this.selectedAnswer = null;
        this.hiddenOptions = [];

        const q = this.questions[index];
        const numElem = document.getElementById('mil-q-num');
        const qTextElem = document.getElementById('mil-question-text');
        const nextBtn = document.getElementById('mil-next-btn');
        const expCard = document.getElementById('mil-explanation');

        if (nextBtn) nextBtn.classList.add('hidden');
        if (expCard) expCard.classList.add('hidden');

        if (numElem) {
            numElem.textContent = `CÂU HỎI ${index + 1} / ${Math.min(this.questions.length, 15)} • Mức: ${this.moneyLevels[index] || '150.000.000'} VNĐ`;
        }
        if (qTextElem) {
            qTextElem.innerHTML = q.question;
        }

        // Highlight ladder step
        for (let i = 0; i < 15; i++) {
            const step = document.getElementById(`ladder-step-${i}`);
            if (step) {
                step.classList.remove('bg-amber-400', 'text-slate-950', 'scale-105', 'shadow-lg');
                if (i === index) {
                    step.classList.add('bg-amber-400', 'text-slate-950', 'scale-105', 'shadow-lg', 'font-black');
                }
            }
        }

        this.renderOptions(q);
        this.startTimer();

        // Render math with KaTeX if present
        if (window.renderMathInElement) {
            window.renderMathInElement(document.getElementById('game-stage'), {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ]
            });
        }
    }

    renderOptions(q) {
        const grid = document.getElementById('mil-options-grid');
        if (!grid) return;

        const letters = ['A', 'B', 'C', 'D'];
        grid.innerHTML = letters.map(letter => {
            const optText = q.options[letter] || '';
            const isHidden = this.hiddenOptions.includes(letter);
            return `
                <button id="mil-opt-${letter}" 
                    onclick="window.millionaireGame.selectAnswer('${letter}')"
                    class="mil-option group relative p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 border-2 border-cyan-500/40 hover:border-amber-400 hover:from-blue-900 hover:to-indigo-950 text-left transition-all duration-200 flex items-center gap-3 shadow-lg ${
                        isHidden ? 'invisible pointer-events-none' : ''
                    }">
                    <span class="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center font-black text-amber-300 text-base group-hover:bg-amber-400 group-hover:text-slate-950 transition">
                        ${letter}
                    </span>
                    <span class="flex-1 text-white font-medium text-base md:text-lg group-hover:text-amber-100">
                        ${optText}
                    </span>
                </button>
            `;
        }).join('');
    }

    startTimer() {
        this.clearTimer();
        this.timeLeft = 30;
        this.updateTimerDisplay();

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();

            if (this.timeLeft <= 5 && this.timeLeft > 0) {
                window.soundFX.playWarningTick();
            } else if (this.timeLeft > 5) {
                window.soundFX.playTick();
            }

            if (this.timeLeft <= 0) {
                this.clearTimer();
                this.timeOut();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const text = document.getElementById('mil-timer-text');
        const circle = document.getElementById('mil-timer-circle');
        if (text) text.textContent = this.timeLeft;
        if (circle) {
            const offset = 150 - (150 * (30 - this.timeLeft)) / 30;
            circle.style.strokeDashoffset = offset;
            if (this.timeLeft <= 5) {
                circle.classList.remove('text-amber-400');
                circle.classList.add('text-red-500');
            } else {
                circle.classList.remove('text-red-500');
                circle.classList.add('text-amber-400');
            }
        }
    }

    clearTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    selectAnswer(letter) {
        if (this.isLocked) return;
        this.isLocked = true;
        this.selectedAnswer = letter;
        this.clearTimer();

        window.soundFX.playClick();
        window.soundFX.startSuspense();

        // Highlight selected answer orange
        const selectedBtn = document.getElementById(`mil-opt-${letter}`);
        if (selectedBtn) {
            selectedBtn.classList.remove('border-cyan-500/40', 'from-slate-900', 'to-blue-950');
            selectedBtn.classList.add('bg-gradient-to-r', 'from-amber-600', 'to-yellow-500', 'border-amber-300', 'scale-[1.02]', 'animate-pulse');
        }

        // 2 seconds suspense delay before revealing answer
        setTimeout(() => {
            window.soundFX.stopSuspense();
            this.revealAnswer(letter);
        }, 2000);
    }

    revealAnswer(letter) {
        const q = this.questions[this.currentQuestionIdx];
        const isCorrect = letter === q.answer;
        const correctBtn = document.getElementById(`mil-opt-${q.answer}`);
        const chosenBtn = document.getElementById(`mil-opt-${letter}`);

        if (chosenBtn) {
            chosenBtn.classList.remove('from-amber-600', 'to-yellow-500', 'animate-pulse');
        }

        if (isCorrect) {
            // Correct answer
            window.soundFX.playCorrect();
            if (window.confetti) {
                window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            }
            if (correctBtn) {
                correctBtn.classList.add('bg-gradient-to-r', 'from-emerald-600', 'to-green-500', 'border-green-300', 'text-white', 'scale-105');
            }

            // Award points to current player
            if (this.currentPlayer) {
                window.classManager.addScoreToStudent(this.currentPlayer.id, (this.currentQuestionIdx + 1) * 10);
            }

            // Show explanation if available
            if (q.explanation) {
                const expCard = document.getElementById('mil-explanation');
                const expText = document.getElementById('mil-explanation-text');
                if (expCard && expText) {
                    expText.innerHTML = q.explanation;
                    expCard.classList.remove('hidden');
                }
            }

            // Show Next Question button
            const nextBtn = document.getElementById('mil-next-btn');
            if (nextBtn) nextBtn.classList.remove('hidden');

            if (this.currentQuestionIdx === 14) {
                setTimeout(() => this.showVictory(), 1500);
            }
        } else {
            // Wrong answer
            window.soundFX.playWrong();
            if (chosenBtn) {
                chosenBtn.classList.add('bg-gradient-to-r', 'from-red-600', 'to-rose-700', 'border-red-400');
            }
            if (correctBtn) {
                correctBtn.classList.add('bg-gradient-to-r', 'from-emerald-600', 'to-green-500', 'border-green-300');
            }

            // Show game over modal after delay
            setTimeout(() => {
                this.showGameOver(q);
            }, 1800);
        }
    }

    timeOut() {
        this.isLocked = true;
        window.soundFX.playWrong();
        const q = this.questions[this.currentQuestionIdx];
        const correctBtn = document.getElementById(`mil-opt-${q.answer}`);
        if (correctBtn) {
            correctBtn.classList.add('bg-gradient-to-r', 'from-emerald-600', 'to-green-500', 'border-green-300');
        }
        setTimeout(() => this.showGameOver(q, true), 1200);
    }

    nextQuestion() {
        window.soundFX.playClick();
        this.loadQuestion(this.currentQuestionIdx + 1);
    }

    use5050() {
        if (!this.activeLifelines.half || this.isLocked) return;
        this.activeLifelines.half = false;
        const btn = document.getElementById('btn-life-half');
        if (btn) btn.classList.add('opacity-40', 'pointer-events-none', 'line-through');

        window.soundFX.playExplosion();
        const q = this.questions[this.currentQuestionIdx];
        const wrongs = ['A', 'B', 'C', 'D'].filter(l => l !== q.answer);

        // Shuffle wrongs and pick 2 to eliminate
        wrongs.sort(() => Math.random() - 0.5);
        this.hiddenOptions = [wrongs[0], wrongs[1]];

        this.hiddenOptions.forEach(letter => {
            const optElem = document.getElementById(`mil-opt-${letter}`);
            if (optElem) {
                optElem.classList.add('invisible', 'pointer-events-none');
            }
        });
    }

    useAudience() {
        if (!this.activeLifelines.audience || this.isLocked) return;
        this.activeLifelines.audience = false;
        const btn = document.getElementById('btn-life-audience');
        if (btn) btn.classList.add('opacity-40', 'pointer-events-none', 'line-through');

        window.soundFX.playClick();
        const q = this.questions[this.currentQuestionIdx];

        // Generate synthetic poll with high probability on correct answer
        let correctPercent = Math.floor(55 + Math.random() * 30);
        let remain = 100 - correctPercent;
        const wrongPercents = [];
        for (let i = 0; i < 3; i++) {
            if (i === 2) {
                wrongPercents.push(remain);
            } else {
                const p = Math.floor(Math.random() * remain);
                wrongPercents.push(p);
                remain -= p;
            }
        }

        const pollData = {};
        const wrongs = ['A', 'B', 'C', 'D'].filter(l => l !== q.answer);
        pollData[q.answer] = correctPercent;
        wrongs.forEach((w, idx) => {
            pollData[w] = wrongPercents[idx];
        });

        this.showModal(`
            <div class="text-center">
                <div class="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400 mx-auto flex items-center justify-center text-cyan-400 text-2xl mb-3">
                    <i class="fa-solid fa-chart-column"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Ý Kiến Của Các Bạn Trong Lớp</h3>
                <p class="text-sm text-slate-400 mb-6">Biểu đồ tổng hợp bình chọn của khán giả học sinh:</p>
                <div class="grid grid-cols-4 gap-3 items-end h-48 px-4 pb-4 border-b border-slate-700">
                    ${['A', 'B', 'C', 'D'].map(col => `
                        <div class="flex flex-col items-center gap-2">
                            <span class="text-xs font-bold text-cyan-300">${pollData[col]}%</span>
                            <div class="w-full bg-slate-800 rounded-t-lg overflow-hidden flex flex-col justify-end" style="height: 120px;">
                                <div class="bg-gradient-to-t ${col === q.answer ? 'from-emerald-500 to-green-400' : 'from-blue-600 to-cyan-500'} transition-all duration-1000 rounded-t" style="height: ${pollData[col]}%;"></div>
                            </div>
                            <span class="font-black text-sm text-white">${col}</span>
                        </div>
                    `).join('')}
                </div>
                <button onclick="window.millionaireGame.closeModal()" class="mt-6 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition">
                    Đã xem xong
                </button>
            </div>
        `);
    }

    useCall() {
        if (!this.activeLifelines.call || this.isLocked) return;
        this.activeLifelines.call = false;
        const btn = document.getElementById('btn-life-call');
        if (btn) btn.classList.add('opacity-40', 'pointer-events-none', 'line-through');

        window.soundFX.playClick();
        const q = this.questions[this.currentQuestionIdx];

        const advisors = [
            { name: "Thầy Giáo Chủ Nhiệm", role: "Cố vấn thông thái", quote: `Thầy nghĩ chắc chắn là phương án **${q.answer}**, tự tin lên em nhé!` },
            { name: "Bạn Lớp Trưởng", role: "Học sinh gương mẫu", quote: `Tớ vừa xem lại bài này hôm qua, 99% là đáp án **${q.answer}** đấy!` },
            { name: "Bác Google", role: "Chuyên gia dữ liệu", quote: `Dựa trên cơ sở dữ liệu học tập, câu trả lời chính xác nhất là **${q.answer}**.` }
        ];
        const advisor = advisors[Math.floor(Math.random() * advisors.length)];

        this.showModal(`
            <div class="text-center">
                <div class="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400 mx-auto flex items-center justify-center text-amber-400 text-2xl mb-3 animate-bounce">
                    <i class="fa-solid fa-phone"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-1">Kết Nối Với ${advisor.name}</h3>
                <div class="text-xs text-cyan-400 uppercase font-semibold mb-4">${advisor.role}</div>
                <div class="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-slate-200 text-base italic leading-relaxed mb-6">
                    "${advisor.quote}"
                </div>
                <button onclick="window.millionaireGame.closeModal()" class="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition">
                    Cảm ơn cố vấn!
                </button>
            </div>
        `);
    }

    useChange() {
        if (!this.activeLifelines.change || this.isLocked) return;
        this.activeLifelines.change = false;
        const btn = document.getElementById('btn-life-change');
        if (btn) btn.classList.add('opacity-40', 'pointer-events-none', 'line-through');

        window.soundFX.playCorrect();
        // Replace current question with a fresh one from bank if available
        const backupPool = QuestionParser.getSampleBank('chung');
        const newQ = backupPool[Math.floor(Math.random() * backupPool.length)];
        this.questions[this.currentQuestionIdx] = newQ;
        this.loadQuestion(this.currentQuestionIdx);
    }

    showModal(htmlContent) {
        const overlay = document.getElementById('mil-modal-overlay');
        const body = document.getElementById('mil-modal-body');
        if (overlay && body) {
            body.innerHTML = htmlContent;
            overlay.classList.remove('hidden');
        }
    }

    closeModal() {
        const overlay = document.getElementById('mil-modal-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    showGameOver(q, isTimeOut = false) {
        const milestonePrizes = { 0: "0 VNĐ", 4: "2.000.000 VNĐ", 9: "22.000.000 VNĐ", 14: "150.000.000 VNĐ" };
        let finalPrize = "0 VNĐ";
        if (this.currentQuestionIdx >= 10) finalPrize = "22.000.000 VNĐ";
        else if (this.currentQuestionIdx >= 5) finalPrize = "2.000.000 VNĐ";

        this.showModal(`
            <div class="text-center">
                <div class="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500 mx-auto flex items-center justify-center text-rose-400 text-3xl mb-3">
                    <i class="fa-solid fa-heart-crack"></i>
                </div>
                <h3 class="text-2xl font-black text-white mb-2">${isTimeOut ? 'Hết Thời Gian!' : 'Rất Tiếc! Chưa Chính Xác'}</h3>
                <p class="text-slate-300 text-sm mb-4">
                    Đáp án đúng là: <strong class="text-emerald-400 font-bold">${q.answer}. ${q.options[q.answer]}</strong>
                </p>
                <div class="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 mb-6">
                    <div class="text-xs text-slate-400 uppercase font-semibold">Phần thưởng đạt được</div>
                    <div class="text-2xl font-black text-amber-400 mt-1">${finalPrize}</div>
                    <div class="text-xs text-slate-500 mt-1">Người chơi: ${this.currentPlayer ? this.currentPlayer.name : 'Đại diện lớp'}</div>
                </div>
                <div class="flex gap-3 justify-center">
                    <button onclick="window.millionaireGame.start(window.millionaireGame.questions)" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                        <i class="fa-solid fa-rotate-left mr-1"></i> Chơi lại lượt mới
                    </button>
                    <button onclick="window.millionaireGame.closeModal(); window.app.showGameSelection();" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700">
                        Chọn trò chơi khác
                    </button>
                </div>
            </div>
        `);
    }

    showVictory() {
        window.soundFX.playFanfare();
        if (window.confetti) {
            window.confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
        }
        this.showModal(`
            <div class="text-center py-4">
                <div class="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border-2 border-white mx-auto flex items-center justify-center text-slate-950 text-4xl mb-4 shadow-xl shadow-amber-500/30 animate-bounce">
                    <i class="fa-solid fa-crown"></i>
                </div>
                <h2 class="text-3xl font-black text-amber-400 mb-2">CHIẾN THẮNG TUYỆT ĐỐI!</h2>
                <p class="text-slate-200 text-lg mb-4">Chúc mừng <strong class="text-cyan-400 font-bold">${this.currentPlayer ? this.currentPlayer.name : 'Lớp Chúng Ta'}</strong> đã vượt qua 15 câu hỏi!</p>
                <div class="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-400/50 rounded-2xl p-6 mb-6">
                    <div class="text-sm font-semibold text-amber-300 uppercase">Phần thưởng tối cao</div>
                    <div class="text-4xl font-black text-amber-400 my-2 font-mono">150.000.000 VNĐ</div>
                    <div class="text-sm text-slate-300">+150 Điểm tích lũy cho lớp học!</div>
                </div>
                <button onclick="window.millionaireGame.closeModal(); window.app.showGameSelection();" class="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-lg shadow-xl shadow-amber-500/30">
                    Trở về màn hình chính
                </button>
            </div>
        `);
    }
}

window.millionaireGame = new MillionaireGame();
