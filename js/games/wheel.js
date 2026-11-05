/**
 * Game 4: Vòng Quay May Mắn & Hộp Quà Bí Mật - Light & Crisp Theme
 */
class FunGames {
    constructor() {
        this.wheelCanvas = null;
        this.wheelCtx = null;
        this.wheelItems = [];
        this.currentAngle = 0;
        this.isSpinning = false;
        this.spinVelocity = 0;
        this.boxes = [];
    }

    /* ---------------- VÒNG QUAY MAY MẮN ---------------- */
    startWheel() {
        const container = document.getElementById('game-stage');
        if (!container) return;

        const students = window.classManager.students;
        if (students && students.length > 0) {
            this.wheelItems = students.slice(0, 16).map(s => s.name);
        } else {
            this.wheelItems = ["10 Điểm", "Tràng Pháo Tay", "Bút Chì", "Cộng 20 Điểm", "Ngôi Sao May Mắn", "Trả Lời Câu Hỏi", "Hộp Quà", "Thêm Lượt"];
        }

        container.innerHTML = `
            <div class="relative w-full max-w-5xl mx-auto flex flex-col items-center gap-6 p-4">
                <div class="bg-white border border-slate-200 rounded-3xl p-4 w-full flex items-center justify-between shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 font-black text-2xl shadow-sm">
                            <i class="fa-solid fa-dharmachakra"></i>
                        </div>
                        <div>
                            <div class="text-xs font-bold text-amber-800 uppercase tracking-wider">Trò chơi vui nhộn</div>
                            <div class="text-lg font-black text-slate-900">Vòng Quay May Mắn Lớp Học</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="window.funGames.setWheelMode('students')" class="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs hover:bg-blue-100 transition shadow-sm">
                            Quay tên học sinh
                        </button>
                        <button onclick="window.funGames.setWheelMode('prizes')" class="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 font-bold text-xs hover:bg-purple-100 transition shadow-sm">
                            Quay điểm thưởng
                        </button>
                    </div>
                </div>

                <!-- Wheel Canvas Box (Clean White Frame) -->
                <div class="relative flex flex-col items-center justify-center p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm">
                    <!-- Pointer Indicator -->
                    <div class="absolute top-2 z-20 text-red-500 text-4xl drop-shadow filter">
                        <i class="fa-solid fa-location-pin transform rotate-180"></i>
                    </div>

                    <canvas id="lucky-wheel-canvas" width="460" height="460" class="max-w-full aspect-square"></canvas>

                    <!-- Center Spin Button -->
                    <button id="spin-btn" onclick="window.funGames.spinWheel()" class="mt-6 px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20 transform active:scale-95 transition">
                        <i class="fa-solid fa-play mr-2"></i> QUAY NGAY
                    </button>
                </div>

                <!-- Winner Announcement Popup -->
                <div id="wheel-winner-display" class="hidden text-center p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl w-full max-w-md shadow-sm animate-bounce">
                    <div class="text-xs text-amber-800 uppercase font-black">Người được gọi tên</div>
                    <div id="wheel-winner-name" class="text-2xl md:text-3xl font-black text-slate-900 mt-1">Nguyễn Văn A</div>
                </div>

                <div class="w-full flex justify-start">
                    <button onclick="window.app.showGameSelection()" class="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-sm flex items-center gap-2 transition">
                        <i class="fa-solid fa-arrow-left"></i> Quay lại menu
                    </button>
                </div>
            </div>
        `;

        this.initWheel();
    }

    setWheelMode(mode) {
        if (mode === 'students') {
            const students = window.classManager.students;
            this.wheelItems = students && students.length > 0 ? students.slice(0, 16).map(s => s.name) : ["Học sinh 1", "Học sinh 2", "Học sinh 3", "Học sinh 4"];
        } else {
            this.wheelItems = ["+10 Điểm", "+20 Điểm", "+50 Điểm", "Điểm 10 Miệng", "Tràng Pháo Tay", "Được Miễn BTVN", "Cố Gắng Lần Sau", "Hộp Quà Bí Ẩn"];
        }
        this.drawWheel();
    }

    initWheel() {
        this.wheelCanvas = document.getElementById('lucky-wheel-canvas');
        if (!this.wheelCanvas) return;
        this.wheelCtx = this.wheelCanvas.getContext('2d');
        this.drawWheel();
    }

    drawWheel() {
        if (!this.wheelCtx) return;
        const ctx = this.wheelCtx;
        const numItems = this.wheelItems.length;
        const arc = (2 * Math.PI) / numItems;
        const radius = 220;
        const center = 230;

        ctx.clearRect(0, 0, 460, 460);

        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#10b981',
            '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
        ];

        for (let i = 0; i < numItems; i++) {
            const angle = this.currentAngle + i * arc;

            // Draw segment slice
            ctx.beginPath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, angle, angle + arc);
            ctx.lineTo(center, center);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(angle + arc / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 15px "Be Vietnam Pro", sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 4;

            const text = this.wheelItems[i];
            const truncated = text.length > 18 ? text.substring(0, 16) + '..' : text;
            ctx.fillText(truncated, radius - 20, 5);
            ctx.restore();
        }

        // Draw center gold hub
        ctx.beginPath();
        ctx.arc(center, center, 32, 0, 2 * Math.PI);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(center, center, 14, 0, 2 * Math.PI);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
    }

    spinWheel() {
        if (this.isSpinning) return;
        this.isSpinning = true;
        const spinBtn = document.getElementById('spin-btn');
        if (spinBtn) spinBtn.disabled = true;

        const winnerBox = document.getElementById('wheel-winner-display');
        if (winnerBox) winnerBox.classList.add('hidden');

        this.spinVelocity = 0.35 + Math.random() * 0.25;
        const friction = 0.985;
        let lastTickAngle = this.currentAngle;

        const animate = () => {
            this.currentAngle += this.spinVelocity;
            this.spinVelocity *= friction;

            const arc = (2 * Math.PI) / this.wheelItems.length;
            if (Math.abs(this.currentAngle - lastTickAngle) >= arc) {
                window.soundFX.playWheelClick();
                lastTickAngle = this.currentAngle;
            }

            this.drawWheel();

            if (this.spinVelocity > 0.002) {
                requestAnimationFrame(animate);
            } else {
                this.isSpinning = false;
                if (spinBtn) spinBtn.disabled = false;
                this.finishSpin();
            }
        };

        requestAnimationFrame(animate);
    }

    finishSpin() {
        const numItems = this.wheelItems.length;
        const arc = (2 * Math.PI) / numItems;
        const normalizedAngle = (3 * Math.PI / 2 - (this.currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const winningIndex = Math.floor(normalizedAngle / arc) % numItems;
        const winner = this.wheelItems[winningIndex];

        window.soundFX.playFanfare();
        if (window.confetti) window.confetti({ particleCount: 100 });

        const winnerBox = document.getElementById('wheel-winner-display');
        const winnerName = document.getElementById('wheel-winner-name');
        if (winnerBox && winnerName) {
            winnerName.textContent = winner;
            winnerBox.classList.remove('hidden');
        }
    }

    /* ---------------- HỘP QUÀ BÍ MẬT ---------------- */
    startMysteryBoxes(questions) {
        const container = document.getElementById('game-stage');
        if (!container) return;

        const qs = questions && questions.length > 0 ? questions : QuestionParser.getSampleBank('chung');
        const boxPrizes = [
            "+50 Điểm Thưởng", "+100 Điểm Thưởng", "Một Tràng Pháo Tay", "Điểm 10 Kiểm Tra Miệng",
            "Được Miễn Bài Tập Về Nhà", "Ngôi Sao May Mắn", "Thẻ Nhân Đôi Điểm Lượt Sau", "+30 Điểm",
            "Một Lời Khen Từ Giáo Viên", "+80 Điểm", "Được Chọn Bài Hát Giải Lao", "+60 Điểm"
        ];

        this.boxes = [];
        const count = Math.min(qs.length, 12);
        for (let i = 0; i < count; i++) {
            this.boxes.push({
                id: i + 1,
                q: qs[i],
                prize: boxPrizes[i % boxPrizes.length],
                opened: false
            });
        }

        container.innerHTML = `
            <div class="relative w-full max-w-5xl mx-auto flex flex-col gap-6 p-4">
                <div class="bg-white border border-slate-200 rounded-3xl p-4 flex items-center justify-between shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-300 flex items-center justify-center text-purple-700 font-black text-2xl shadow-sm">
                            <i class="fa-solid fa-gift"></i>
                        </div>
                        <div>
                            <div class="text-xs font-bold text-purple-800 uppercase tracking-wider">Trò chơi vui nhộn</div>
                            <div class="text-lg font-black text-slate-900">Hộp Quà Bí Mật Tri Thức</div>
                        </div>
                    </div>
                    <div class="text-xs text-purple-700 bg-purple-50 px-3.5 py-1.5 rounded-full border border-purple-200 font-bold shadow-sm">
                        Chọn hộp quà -> Trả lời câu hỏi -> Mở quà may mắn!
                    </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 py-6" id="boxes-grid">
                    ${this.renderBoxesGrid()}
                </div>

                <div class="w-full flex justify-start">
                    <button onclick="window.app.showGameSelection()" class="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-sm flex items-center gap-2 transition">
                        <i class="fa-solid fa-arrow-left"></i> Quay lại menu
                    </button>
                </div>
            </div>

            <!-- Box Question Modal -->
            <div id="box-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
                <div class="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl relative text-slate-900" id="box-modal-body">
                </div>
            </div>
        `;
    }

    renderBoxesGrid() {
        const boxColors = [
            'from-rose-500 to-pink-600', 'from-amber-400 to-orange-500', 'from-blue-500 to-cyan-600',
            'from-emerald-500 to-green-600', 'from-purple-500 to-indigo-600', 'from-teal-400 to-emerald-500'
        ];

        return this.boxes.map((box, idx) => {
            if (box.opened) {
                return `
                    <div class="p-6 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-300 text-center flex flex-col items-center justify-center min-h-[140px] opacity-75 shadow-sm">
                        <i class="fa-solid fa-box-open text-3xl text-purple-500 mb-2"></i>
                        <span class="text-xs font-black text-amber-700">${box.prize}</span>
                    </div>
                `;
            }

            const color = boxColors[idx % boxColors.length];
            return `
                <button onclick="window.funGames.openBox(${box.id})"
                    class="group relative p-6 rounded-3xl bg-gradient-to-tr ${color} shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex flex-col items-center justify-center min-h-[140px] border-2 border-white/50">
                    <span class="absolute top-2 right-3 text-xs font-black text-white/90">#${box.id}</span>
                    <i class="fa-solid fa-gift text-4xl text-white drop-shadow group-hover:rotate-12 transition-transform"></i>
                    <span class="text-xs font-black text-white mt-3 uppercase tracking-wider">Hộp Số ${box.id}</span>
                </button>
            `;
        }).join('');
    }

    openBox(boxId) {
        const box = this.boxes.find(b => b.id === boxId);
        if (!box || box.opened) return;

        window.soundFX.playClick();
        const modal = document.getElementById('box-modal');
        const modalBody = document.getElementById('box-modal-body');
        if (!modal || !modalBody) return;

        const q = box.q;
        modalBody.innerHTML = `
            <div class="text-center mb-6">
                <span class="px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200 shadow-sm">
                    Thử thách mở Hộp Quà Bí Mật #${box.id}
                </span>
                <h3 class="text-xl font-bold text-slate-900 mt-4 leading-relaxed">${q.question}</h3>
            </div>

            <div class="grid grid-cols-1 gap-3 mb-6">
                ${['A', 'B', 'C', 'D'].map(l => `
                    <button onclick="window.funGames.checkAnswerBox(${box.id}, '${l}')" class="p-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-purple-400 text-left transition flex items-center gap-3 shadow-sm">
                        <span class="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 font-black flex items-center justify-center text-sm border border-purple-200">${l}</span>
                        <span class="text-slate-800 text-sm md:text-base font-semibold flex-1">${q.options[l]}</span>
                    </button>
                `).join('')}
            </div>
        `;

        modal.classList.remove('hidden');

        if (window.renderMathInElement) {
            window.renderMathInElement(modalBody, { delimiters: [{left: '$', right: '$', display: false}] });
        }
    }

    checkAnswerBox(boxId, letter) {
        const box = this.boxes.find(b => b.id === boxId);
        const modalBody = document.getElementById('box-modal-body');
        const isCorrect = letter === box.q.answer;

        if (isCorrect) {
            box.opened = true;
            window.soundFX.playFanfare();
            if (window.confetti) window.confetti({ particleCount: 100 });

            modalBody.innerHTML = `
                <div class="text-center py-4">
                    <div class="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 mx-auto flex items-center justify-center text-emerald-600 text-3xl mb-3 animate-bounce shadow-sm">
                        <i class="fa-solid fa-gift"></i>
                    </div>
                    <h3 class="text-2xl font-black text-emerald-700 mb-1">CHÍNH XÁC! HỘP QUÀ ĐÃ MỞ!</h3>
                    <p class="text-sm text-slate-600 mb-4">Phần quà bí mật bên trong là:</p>
                    <div class="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-2xl text-2xl font-black text-amber-700 mb-6 shadow-sm">
                        ${box.prize}
                    </div>
                    <button onclick="document.getElementById('box-modal').classList.add('hidden'); window.funGames.startMysteryBoxes();" class="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow transition">
                        Đóng và tiếp tục
                    </button>
                </div>
            `;
        } else {
            window.soundFX.playWrong();
            modalBody.innerHTML = `
                <div class="text-center py-4">
                    <div class="w-16 h-16 rounded-full bg-rose-100 border border-rose-300 mx-auto flex items-center justify-center text-rose-600 text-3xl mb-3 shadow-sm">
                        <i class="fa-solid fa-lock"></i>
                    </div>
                    <h3 class="text-2xl font-black text-rose-600 mb-2">CHƯA MỞ ĐƯỢC HỘP!</h3>
                    <p class="text-sm text-slate-600 mb-6">Rất tiếc! Đáp án đúng là: <strong class="text-emerald-700">${box.q.answer}. ${box.q.options[box.q.answer]}</strong></p>
                    <button onclick="document.getElementById('box-modal').classList.add('hidden');" class="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300 transition">
                        Thử lại sau
                    </button>
                </div>
            `;
        }
    }
}

window.funGames = new FunGames();
