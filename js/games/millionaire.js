/**
 * Game 1: Ai Là Triệu Phú (Who Wants to Be a Millionaire) - Light & Crisp Theme
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
                    <div class="bg-white border border-slate-200 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm font-bold text-xl">
                                <i class="fa-solid fa-graduation-cap"></i>
                            </div>
                            <div>
                                <div class="text-xs font-bold text-blue-700 uppercase tracking-wider">Người chơi hiện tại</div>
                                <div class="text-lg font-black text-slate-900 flex items-center gap-2" id="mil-player-name">
                                    ${this.currentPlayer ? this.currentPlayer.name : 'Đại diện lớp'}
                                    <button onclick="window.millionaireGame.pickNewPlayer()" title="Chọn ngẫu nhiên học sinh khác" class="text-xs bg-slate-100 hover:bg-slate-200 text-blue-700 font-bold px-2.5 py-1 rounded-lg border border-slate-200 transition">
                                        <i class="fa-solid fa-shuffle mr-1"></i>Đổi bạn
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Timer Wheel -->
                        <div class="flex items-center gap-3">
                            <div class="relative w-14 h-14 flex items-center justify-center">
                                <svg class="w-full h-full transform -rotate-90">
                                    <circle cx="28" cy="28" r="24" stroke="currentColor" stroke-width="4" class="text-slate-200 fill-none" />
                                    <circle id="mil-timer-circle" cx="28" cy="28" r="24" stroke="currentColor" stroke-width="4" 
                                        stroke-dasharray="150" stroke-dashoffset="0"
                                        class="text-amber-500 fill-none transition-all duration-1000 ease-linear" />
                                </svg>
                                <span id="mil-timer-text" class="absolute text-xl font-black text-amber-600">30</span>
                            </div>
                        </div>

                        <!-- Lifelines -->
                        <div class="flex items-center gap-2">
                            <button id="btn-life-half" onclick="window.millionaireGame.use5050()" class="lifeline-btn px-3.5 py-2 rounded-xl font-black text-xs bg-blue-50 border border-blue-300 text-blue-700 shadow-sm hover:bg-blue-100 active:scale-95 transition" title="Trợ giúp 50:50">
                                <span>50:50</span>
                            </button>
                            <button id="btn-life-audience" onclick="window.millionaireGame.useAudience()" class="lifeline-btn px-3.5 py-2 rounded-xl font-black text-xs bg-purple-50 border border-purple-300 text-purple-700 shadow-sm hover:bg-purple-100 active:scale-95 transition" title="Hỏi ý kiến cả lớp">
                                <i class="fa-solid fa-users"></i>
                            </button>
                            <button id="btn-life-call" onclick="window.millionaireGame.useCall()" class="lifeline-btn px-3.5 py-2 rounded-xl font-black text-xs bg-amber-50 border border-amber-300 text-amber-800 shadow-sm hover:bg-amber-100 active:scale-95 transition" title="Gọi cố vấn / Thầy cô">
                                <i class="fa-solid fa-phone"></i>
                            </button>
                            <button id="btn-life-change" onclick="window.millionaireGame.useChange()" class="lifeline-btn px-3.5 py-2 rounded-xl font-black text-xs bg-emerald-50 border border-emerald-300 text-emerald-700 shadow-sm hover:bg-emerald-100 active:scale-95 transition" title="Đổi câu hỏi mới">
                                <i class="fa-solid fa-arrows-rotate"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Question Container (High-Contrast Dramatic Blue on White) -->
                    <div class="my-6">
                        <div class="relative bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-900 border-4 border-amber-400 rounded-3xl p-6 md:p-8 shadow-xl text-center min-h-[160px] flex flex-col justify-center items-center">
                            <span class="inline-block px-4 py-1 rounded-full bg-amber-400/20 text-amber-300 font-black text-xs border border-amber-400/50 mb-3 tracking-wider" id="mil-q-num">
                                CÂU HỎI 1 / 15
                            </span>
                            <h2 id="mil-question-text" class="text-xl md:text-2xl font-bold text-white tracking-wide leading-relaxed">
                                Đang tải câu hỏi...
                            </h2>
                        </div>
                    </div>

                    <!-- Options Grid (Crisp White Cards with Bold Colored Badges) -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="mil-options-grid">
                        <!-- Rendered dynamically -->
                    </div>

                    <!-- Explanation Card (Hidden by default) -->
                    <div id="mil-explanation" class="hidden mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 text-sm shadow-sm">
                        <div class="font-bold flex items-center gap-2 mb-1 text-emerald-800">
                            <i class="fa-solid fa-lightbulb text-amber-500"></i> Giải thích chi tiết:
                        </div>
                        <div id="mil-explanation-text"></div>
                    </div>

                    <!-- Action Bar -->
                    <div class="mt-6 flex items-center justify-between">
                        <button onclick="window.app.showGameSelection()" class="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-sm flex items-center gap-2 transition">
                            <i class="fa-solid fa-arrow-left"></i> Quay lại menu
                        </button>
                        <button id="mil-next-btn" onclick="window.millionaireGame.nextQuestion()" class="hidden px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 flex items-center gap-2 animate-bounce">
                            Câu tiếp theo <i class="fa-solid fa-forward"></i>
                        </button>
                    </div>
                </div>

                <!-- Money Ladder Sidebar (Clean White) -->
                <div class="w-full lg:w-72 bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col">
                    <div class="text-center font-black text-slate-900 text-xs tracking-widest uppercase mb-3 pb-2 border-b border-slate-100 flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-trophy text-amber-500"></i> Bậc Thang Điểm Thưởng
                    </div>
                    <div class="flex-1 flex flex-col-reverse gap-1.5 overflow-y-auto pr-1" id="mil-ladder-list">
                        <!-- Ladder steps 1 to 15 -->
                    </div>
                </div>
            </div>

            <!-- Lifeline Modal Container -->
            <div id="mil-modal-overlay" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
                <div class="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative animate-scale-up text-slate-900" id="mil-modal-body">
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
                <div id="ladder-step-${idx}" class="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                    isMilestone ? 'text-amber-800 bg-amber-50 border border-amber-300' : 'text-slate-600 hover:bg-slate-50'
                }">
                    <span class="flex items-center gap-2">
                        <span class="w-5 text-right opacity-60">${idx + 1}</span>
                        ${isMilestone ? '<i class="fa-solid fa-star text-amber-500 text-[10px]"></i>' : '•'}
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
                <button onclick="window.millionaireGame.pickNewPlayer()" title="Chọn ngẫu nhiên bạn khác" class="text-xs bg-slate-100 hover:bg-slate-200 text-blue-700 font-bold px-2 py-1 rounded-lg border border-slate-200">
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
            numElem.textContent = `CÂU HỎI ${index + 1} / ${Math.min(this.questions.length, 15)} • MỨC: ${this.moneyLevels[index] || '150.000.000'} VNĐ`;
        }
        if (qTextElem) {
            qTextElem.innerHTML = q.question;
        }

        // Highlight ladder step
        for (let i = 0; i < 15; i++) {
            const step = document.getElementById(`ladder-step-${i}`);
            if (step) {
                step.classList.remove('bg-amber-400', 'text-slate-950', 'scale-105', 'shadow-md', 'font-black');
                if (i === index) {
                    step.classList.add('bg-amber-400', 'text-slate-950', 'scale-105', 'shadow-md', 'font-black');
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

        // If True / False question
        if (q.type === 'true_false') {
            const isAHidden = this.hiddenOptions.includes('A');
            const isBHidden = this.hiddenOptions.includes('B');

            grid.innerHTML = `
                <button id="mil-opt-A" 
                    onclick="window.millionaireGame.selectAnswer('A')"
                    class="mil-option group relative p-6 rounded-3xl bg-white hover:bg-emerald-50 border-3 border-emerald-300 hover:border-emerald-500 text-left transition-all duration-200 flex items-center gap-4 shadow-md ${isAHidden ? 'invisible pointer-events-none' : ''}">
                    <span class="w-14 h-14 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center font-black text-emerald-700 text-2xl group-hover:bg-emerald-600 group-hover:text-white transition shadow-sm">
                        <i class="fa-solid fa-check"></i>
                    </span>
                    <div class="flex-1">
                        <div class="text-xs font-bold text-emerald-700 uppercase tracking-wider">Khẳng định này</div>
                        <div class="text-2xl font-black text-emerald-800">ĐÚNG</div>
                    </div>
                </button>

                <button id="mil-opt-B" 
                    onclick="window.millionaireGame.selectAnswer('B')"
                    class="mil-option group relative p-6 rounded-3xl bg-white hover:bg-rose-50 border-3 border-rose-300 hover:border-rose-500 text-left transition-all duration-200 flex items-center gap-4 shadow-md ${isBHidden ? 'invisible pointer-events-none' : ''}">
                    <span class="w-14 h-14 rounded-2xl bg-rose-100 border-2 border-rose-300 flex items-center justify-center font-black text-rose-700 text-2xl group-hover:bg-rose-600 group-hover:text-white transition shadow-sm">
                        <i class="fa-solid fa-xmark"></i>
                    </span>
                    <div class="flex-1">
                        <div class="text-xs font-bold text-rose-700 uppercase tracking-wider">Khẳng định này</div>
                        <div class="text-2xl font-black text-rose-800">SAI</div>
                    </div>
                </button>
            `;
            return;
        }

        // Standard 4 choices multiple choice (A, B, C, D)
        const letters = ['A', 'B', 'C', 'D'];
        grid.innerHTML = letters.map(letter => {
            const optText = q.options[letter] || '';
            const isHidden = this.hiddenOptions.includes(letter);
            return `
                <button id="mil-opt-${letter}" 
                    onclick="window.millionaireGame.selectAnswer('${letter}')"
                    class="mil-option group relative p-4 md:p-5 rounded-2xl bg-white hover:bg-blue-50/60 border-2 border-slate-200 hover:border-blue-500 text-left transition-all duration-200 flex items-center gap-3.5 shadow-sm ${
                        isHidden ? 'invisible pointer-events-none' : ''
                    }">
                    <span class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-black text-blue-700 text-base group-hover:bg-blue-600 group-hover:text-white transition">
                        ${letter}
                    </span>
                    <span class="flex-1 text-slate-800 font-semibold text-base md:text-lg group-hover:text-blue-900 leading-snug">
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
                circle.classList.remove('text-amber-500');
                circle.classList.add('text-rose-600');
            } else {
                circle.classList.remove('text-rose-600');
                circle.classList.add('text-amber-500');
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
            selectedBtn.classList.remove('border-slate-200', 'bg-white');
            selectedBtn.classList.add('bg-amber-400', 'border-amber-500', 'text-slate-950', 'scale-[1.02]', 'animate-pulse');
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
            chosenBtn.classList.remove('bg-amber-400', 'border-amber-500', 'animate-pulse');
        }

        if (isCorrect) {
            // Correct answer
            window.soundFX.playCorrect();
            if (window.confetti) {
                window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            }
            if (correctBtn) {
                correctBtn.classList.add('bg-emerald-500', 'border-emerald-600', 'text-white', 'scale-105');
                const badge = correctBtn.querySelector('span');
                if (badge) badge.className = 'w-10 h-10 rounded-xl bg-white text-emerald-700 font-black flex items-center justify-center text-base';
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
                chosenBtn.classList.add('bg-rose-500', 'border-rose-600', 'text-white');
            }
            if (correctBtn) {
                correctBtn.classList.add('bg-emerald-500', 'border-emerald-600', 'text-white');
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
            correctBtn.classList.add('bg-emerald-500', 'border-emerald-600', 'text-white');
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
                <div class="w-16 h-16 rounded-full bg-purple-100 border border-purple-200 mx-auto flex items-center justify-center text-purple-700 text-2xl mb-3 shadow-sm">
                    <i class="fa-solid fa-chart-column"></i>
                </div>
                <h3 class="text-xl font-black text-slate-900 mb-1">Ý Kiến Của Các Bạn Trong Lớp</h3>
                <p class="text-xs text-slate-500 mb-6">Biểu đồ tổng hợp bình chọn của khán giả học sinh:</p>
                <div class="grid grid-cols-4 gap-3 items-end h-48 px-4 pb-4 border-b border-slate-200">
                    ${['A', 'B', 'C', 'D'].map(col => `
                        <div class="flex flex-col items-center gap-2">
                            <span class="text-xs font-bold text-slate-700">${pollData[col]}%</span>
                            <div class="w-full bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end" style="height: 120px;">
                                <div class="bg-gradient-to-t ${col === q.answer ? 'from-emerald-500 to-green-400' : 'from-blue-600 to-cyan-500'} transition-all duration-1000 rounded-t" style="height: ${pollData[col]}%;"></div>
                            </div>
                            <span class="font-black text-sm text-slate-800">${col}</span>
                        </div>
                    `).join('')}
                </div>
                <button onclick="window.millionaireGame.closeModal()" class="mt-6 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow">
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
                <div class="w-16 h-16 rounded-full bg-amber-100 border border-amber-200 mx-auto flex items-center justify-center text-amber-700 text-2xl mb-3 shadow-sm animate-bounce">
                    <i class="fa-solid fa-phone"></i>
                </div>
                <h3 class="text-xl font-black text-slate-900 mb-1">Kết Nối Với ${advisor.name}</h3>
                <div class="text-xs text-amber-700 uppercase font-bold mb-4">${advisor.role}</div>
                <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-slate-800 text-base italic leading-relaxed mb-6 shadow-sm">
                    "${advisor.quote}"
                </div>
                <button onclick="window.millionaireGame.closeModal()" class="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow">
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
        let finalPrize = "0 VNĐ";
        if (this.currentQuestionIdx >= 10) finalPrize = "22.000.000 VNĐ";
        else if (this.currentQuestionIdx >= 5) finalPrize = "2.000.000 VNĐ";

        this.showModal(`
            <div class="text-center">
                <div class="w-16 h-16 rounded-full bg-rose-100 border border-rose-200 mx-auto flex items-center justify-center text-rose-600 text-3xl mb-3 shadow-sm">
                    <i class="fa-solid fa-heart-crack"></i>
                </div>
                <h3 class="text-2xl font-black text-slate-900 mb-2">${isTimeOut ? 'Hết Thời Gian!' : 'Rất Tiếc! Chưa Chính Xác'}</h3>
                <p class="text-slate-600 text-sm mb-4">
                    Đáp án đúng là: <strong class="text-emerald-700 font-bold">${q.answer}. ${q.options[q.answer]}</strong>
                </p>
                <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">
                    <div class="text-xs text-slate-500 uppercase font-bold">Phần thưởng đạt được</div>
                    <div class="text-2xl font-black text-amber-600 mt-1 font-mono">${finalPrize}</div>
                    <div class="text-xs text-slate-600 mt-1">Người chơi: <strong>${this.currentPlayer ? this.currentPlayer.name : 'Đại diện lớp'}</strong></div>
                </div>
                <div class="flex gap-3 justify-center">
                    <button onclick="window.millionaireGame.start(window.millionaireGame.questions)" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow transition">
                        <i class="fa-solid fa-rotate-left mr-1"></i> Chơi lại lượt mới
                    </button>
                    <button onclick="window.millionaireGame.closeModal(); window.app.showGameSelection();" class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition">
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
                <div class="w-20 h-20 rounded-full bg-amber-100 border-2 border-amber-400 mx-auto flex items-center justify-center text-amber-600 text-4xl mb-4 shadow-md animate-bounce">
                    <i class="fa-solid fa-crown"></i>
                </div>
                <h2 class="text-3xl font-black text-amber-600 mb-2">CHIẾN THẮNG TUYỆT ĐỐI!</h2>
                <p class="text-slate-700 text-lg mb-4">Chúc mừng <strong class="text-blue-700 font-bold">${this.currentPlayer ? this.currentPlayer.name : 'Lớp Chúng Ta'}</strong> đã vượt qua 15 câu hỏi!</p>
                <div class="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 mb-6 shadow-sm">
                    <div class="text-xs font-bold text-amber-800 uppercase">Phần thưởng tối cao</div>
                    <div class="text-4xl font-black text-amber-600 my-2 font-mono">150.000.000 VNĐ</div>
                    <div class="text-sm text-slate-600 font-medium">+150 Điểm tích lũy cho lớp học!</div>
                </div>
                <button onclick="window.millionaireGame.closeModal(); window.app.showGameSelection();" class="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-lg shadow-md transition">
                    Trở về màn hình chính
                </button>
            </div>
        `);
    }
}

window.millionaireGame = new MillionaireGame();
