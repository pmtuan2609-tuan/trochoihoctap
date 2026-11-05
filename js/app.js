/**
 * Main Educational Games Application Orchestrator
 */
class App {
    constructor() {
        this.questions = [];
        this.selectedGame = null;
        this.isFullscreen = false;
    }

    init() {
        // Load default question bank on startup
        this.questions = QuestionParser.getSampleBank('chung');
        this.updateQuestionStats();
        this.updateClassStats();
        this.setupEventListeners();

        // Render math on page load
        if (window.renderMathInElement) {
            window.renderMathInElement(document.body, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                ]
            });
        }
    }

    setupEventListeners() {
        // Docx file input
        const docxInput = document.getElementById('docx-file-input');
        if (docxInput) {
            docxInput.addEventListener('change', (e) => this.handleDocxUpload(e));
        }

        // Excel file input
        const excelInput = document.getElementById('excel-file-input');
        if (excelInput) {
            excelInput.addEventListener('change', (e) => this.handleExcelUpload(e));
        }

        // Keyboard shortcuts: Space for wheel spin / Escape for modals
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /* ---------------- FILE HANDLERS ---------------- */
    async handleDocxUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const statusElem = document.getElementById('docx-status');
        if (statusElem) {
            statusElem.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-cyan-400 mr-2"></i>Đang đọc và phân dạng câu hỏi từ file Word...`;
            statusElem.classList.remove('hidden');
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const parsedQuestions = await window.questionParser.parseDocx(arrayBuffer);

            if (!parsedQuestions || parsedQuestions.length === 0) {
                alert("Không nhận diện được câu hỏi trong file Word. Vui lòng kiểm tra định dạng (Câu 1: ... A. ... B. ... C. ... D. ... Đáp án: A)");
                return;
            }

            this.questions = parsedQuestions;
            this.updateQuestionStats();
            window.soundFX.playCorrect();

            if (statusElem) {
                statusElem.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400 mr-2"></i>Tải thành công <strong>${this.questions.length}</strong> câu hỏi từ file "${file.name}"!`;
            }
        } catch (error) {
            console.error("Docx error:", error);
            alert("Lỗi khi đọc file Word: " + error.message);
            if (statusElem) {
                statusElem.innerHTML = `<i class="fa-solid fa-circle-xmark text-rose-400 mr-2"></i>Lỗi tải file Word`;
            }
        }
    }

    async handleExcelUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const statusElem = document.getElementById('excel-status');
        if (statusElem) {
            statusElem.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-amber-400 mr-2"></i>Đang nạp danh sách học sinh từ Excel...`;
            statusElem.classList.remove('hidden');
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const students = await window.classManager.parseExcel(arrayBuffer);

            this.updateClassStats();
            window.soundFX.playCorrect();

            if (statusElem) {
                statusElem.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400 mr-2"></i>Đã nhập <strong>${students.length}</strong> học sinh lớp "${window.classManager.className}"!`;
            }
        } catch (error) {
            console.error("Excel error:", error);
            alert("Lỗi khi đọc file Excel: " + error.message);
            if (statusElem) {
                statusElem.innerHTML = `<i class="fa-solid fa-circle-xmark text-rose-400 mr-2"></i>Lỗi tải file Excel`;
            }
        }
    }

    loadSampleBank(type) {
        this.questions = QuestionParser.getSampleBank(type);
        this.updateQuestionStats();
        window.soundFX.playClick();
        const statusElem = document.getElementById('docx-status');
        if (statusElem) {
            statusElem.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400 mr-2"></i>Đã nạp <strong>${this.questions.length}</strong> câu hỏi mẫu chất lượng cao!`;
            statusElem.classList.remove('hidden');
        }
    }

    updateQuestionStats() {
        const countElem = document.getElementById('q-total-count');
        const easyElem = document.getElementById('q-easy-count');
        const medElem = document.getElementById('q-med-count');
        const hardElem = document.getElementById('q-hard-count');

        if (countElem) countElem.textContent = this.questions.length;

        const easy = this.questions.filter(q => q.difficulty === 'Dễ').length;
        const hard = this.questions.filter(q => q.difficulty === 'Khó').length;
        const med = this.questions.length - easy - hard;

        if (easyElem) easyElem.textContent = `${easy} Dễ`;
        if (medElem) medElem.textContent = `${med} Vừa`;
        if (hardElem) hardElem.textContent = `${hard} Khó`;
    }

    updateClassStats() {
        const studentCountElem = document.getElementById('class-student-count');
        const classNameElem = document.getElementById('class-current-name');

        if (studentCountElem) studentCountElem.textContent = `${window.classManager.students.length} Học sinh`;
        if (classNameElem) classNameElem.textContent = window.classManager.className;
    }

    /* ---------------- SIDEBAR & LAYOUT CONTROLS ---------------- */
    toggleSidebar(force) {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (!sidebar) return;

        const isClosed = sidebar.classList.contains('-translate-x-full');
        const shouldOpen = force !== undefined ? force : isClosed;

        if (shouldOpen) {
            sidebar.classList.remove('-translate-x-full');
            if (backdrop) backdrop.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            if (backdrop) backdrop.classList.add('hidden');
        }
    }

    setActiveSidebar(element) {
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
        });
        if (element) {
            element.classList.add('active');
        }
        // Auto-close on mobile if clicked
        if (window.innerWidth < 1024) {
            this.toggleSidebar(false);
        }
    }

    filterSidebarGames(query) {
        const term = (query || '').toLowerCase().trim();
        const list = document.getElementById('sidebar-games-list');
        if (!list) return;

        const buttons = list.querySelectorAll('button');
        buttons.forEach(btn => {
            const text = btn.textContent.toLowerCase();
            if (!term || text.includes(term)) {
                btn.classList.remove('hidden');
            } else {
                btn.classList.add('hidden');
            }
        });
    }

    toggleTeacherDrawer() {
        window.soundFX.playClick();
        this.showGameSelection();
        const drawer = document.getElementById('teacher-files-drawer');
        if (drawer) {
            drawer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            drawer.classList.add('ring-4', 'ring-purple-400');
            setTimeout(() => drawer.classList.remove('ring-4', 'ring-purple-400'), 1500);
        }
    }

    openPinRoomModal() {
        window.soundFX.playClick();
        const modal = document.getElementById('global-modal');
        const body = document.getElementById('global-modal-body');
        if (!modal || !body) return;

        // Generate a fun 6-digit classroom room PIN
        const randomPin = Math.floor(100000 + Math.random() * 900000);

        body.innerHTML = `
            <div class="text-center py-3 text-slate-900">
                <div class="w-16 h-16 rounded-2xl bg-purple-100 border border-purple-200 mx-auto flex items-center justify-center text-purple-700 text-3xl mb-3 shadow-sm">
                    <i class="fa-solid fa-gamepad"></i>
                </div>
                <h3 class="text-2xl font-black text-slate-900 mb-1 font-heading">Tham Gia Phòng Chơi Bằng Mã PIN</h3>
                <p class="text-xs text-slate-500 mb-5">Học sinh nhập mã PIN trên điện thoại/máy tính hoặc giáo viên phát mã cho lớp</p>

                <!-- PIN Code Display Box -->
                <div class="bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border-2 border-dashed border-purple-300 rounded-3xl p-6 mb-6 shadow-sm">
                    <div class="text-[11px] font-bold text-purple-800 uppercase tracking-widest mb-1">Mã PIN Phòng Học Hiện Tại</div>
                    <div class="text-4xl md:text-5xl font-black font-mono tracking-widest text-purple-700 my-2 select-all">${randomPin}</div>
                    <div class="text-xs text-slate-500">Học sinh kết nối cùng thi đấu trực tiếp theo thời gian thực</div>
                </div>

                <!-- Input to join another room -->
                <div class="max-w-xs mx-auto mb-6">
                    <div class="text-xs font-bold text-slate-700 text-left mb-1.5">Hoặc nhập mã PIN phòng khác:</div>
                    <div class="flex gap-2">
                        <input type="text" maxlength="6" placeholder="Nhập 6 số PIN..." class="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-lg font-black tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <button onclick="alert('Đã kết nối thành công vào phòng chơi!'); window.app.closeAllModals();" class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow">
                            Vào
                        </button>
                    </div>
                </div>

                <div class="flex justify-center">
                    <button onclick="window.app.closeAllModals()" class="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200">
                        Đóng
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    /* ---------------- GAME NAVIGATION ---------------- */
    selectGame(gameId) {
        window.soundFX.playClick();
        this.selectedGame = gameId;

        // Hide dashboard, show game arena
        const dashboard = document.getElementById('teacher-dashboard');
        const arena = document.getElementById('game-arena');
        if (dashboard) dashboard.classList.add('hidden');
        if (arena) arena.classList.remove('hidden');

        // Update top breadcrumb
        const breadcrumb = document.getElementById('top-breadcrumb');
        const titles = {
            'olympia': 'Đường lên đỉnh Olympia',
            'millionaire': 'Ai là triệu phú',
            'goldminer': 'Đào vàng tri thức',
            'wheel': 'Vòng quay may mắn',
            'mystery': 'Hộp quà bí mật'
        };
        if (breadcrumb) {
            breadcrumb.textContent = titles[gameId] || 'Trò chơi';
        }

        // Close mobile sidebar if open
        if (window.innerWidth < 1024) {
            this.toggleSidebar(false);
        }

        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Launch specific game
        switch(gameId) {
            case 'millionaire':
                window.millionaireGame.start(this.questions);
                break;
            case 'goldminer':
                window.goldMinerGame.start(this.questions);
                break;
            case 'olympia':
                window.olympiaGame.start(this.questions);
                break;
            case 'wheel':
                window.funGames.startWheel();
                break;
            case 'mystery':
                window.funGames.startMysteryBoxes(this.questions);
                break;
            default:
                this.showGameSelection();
        }
    }

    showGameSelection() {
        window.soundFX.stopSuspense();
        window.soundFX.playClick();

        const dashboard = document.getElementById('teacher-dashboard');
        const arena = document.getElementById('game-arena');
        if (arena) arena.classList.add('hidden');
        if (dashboard) dashboard.classList.remove('hidden');

        const breadcrumb = document.getElementById('top-breadcrumb');
        if (breadcrumb) breadcrumb.textContent = 'Trang chủ';

        const homeBtn = document.getElementById('side-home-btn');
        if (homeBtn) {
            document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
            homeBtn.classList.add('active');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ---------------- TOOLBAR ACTIONS ---------------- */
    toggleSound() {
        const isMuted = window.soundFX.toggleMute();
        const icon = document.getElementById('sound-icon');
        const label = document.getElementById('sound-label');

        if (icon) {
            icon.className = isMuted ? 'fa-solid fa-volume-xmark text-rose-400' : 'fa-solid fa-volume-high text-cyan-400';
        }
        if (label) {
            label.textContent = isMuted ? 'Tắt âm' : 'Bật âm';
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                this.isFullscreen = true;
                const icon = document.getElementById('fullscreen-icon');
                if (icon) icon.className = 'fa-solid fa-compress';
            }).catch(err => console.log(err));
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => {
                    this.isFullscreen = false;
                    const icon = document.getElementById('fullscreen-icon');
                    if (icon) icon.className = 'fa-solid fa-expand';
                });
            }
        }
    }

    quickPickStudent() {
        const student = window.classManager.getRandomStudent();
        if (!student) {
            alert("Chưa có danh sách học sinh. Vui lòng tải file Excel!");
            return;
        }

        window.soundFX.playFanfare();
        if (window.confetti) window.confetti({ particleCount: 70 });

        const modal = document.getElementById('global-modal');
        const body = document.getElementById('global-modal-body');
        if (modal && body) {
            const team = window.classManager.teams.find(t => t.id === student.teamId);
            body.innerHTML = `
                <div class="text-center py-4 text-slate-900">
                    <div class="w-20 h-20 rounded-full bg-blue-100 border-2 border-blue-400 mx-auto flex items-center justify-center text-blue-600 text-3xl mb-4 animate-bounce shadow-sm">
                        <i class="fa-solid fa-user-check"></i>
                    </div>
                    <div class="text-xs text-blue-700 font-bold uppercase tracking-wider">Học sinh được chọn ngẫu nhiên</div>
                    <h2 class="text-3xl font-black text-slate-900 mt-1 mb-2">${student.name}</h2>
                    <div class="inline-block px-4 py-1.5 rounded-full ${team ? team.bg + '/15 border ' + team.border + ' ' + team.text : 'bg-slate-100 text-slate-700'} text-xs font-bold mb-6">
                        ${team ? team.name : 'STT: ' + student.id} • Lớp ${student.className}
                    </div>
                    <div class="flex gap-3 justify-center">
                        <button onclick="window.app.quickPickStudent()" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow transition">
                            <i class="fa-solid fa-shuffle mr-1"></i> Chọn bạn khác
                        </button>
                        <button onclick="window.app.closeAllModals()" class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200 transition">
                            Xong
                        </button>
                    </div>
                </div>
            `;
            modal.classList.remove('hidden');
        }
    }

    openQuestionPreviewModal() {
        window.soundFX.playClick();
        const modal = document.getElementById('global-modal');
        const body = document.getElementById('global-modal-body');
        if (!modal || !body) return;

        body.innerHTML = `
            <div class="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 text-slate-900">
                <div class="flex items-center gap-2 text-blue-700 font-bold text-lg">
                    <i class="fa-solid fa-list-check"></i>
                    <span>Ngân Hàng Câu Hỏi (${this.questions.length} câu)</span>
                </div>
                <button onclick="window.app.closeAllModals()" class="text-slate-400 hover:text-slate-700">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>

            <div class="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
                ${this.questions.map((q, idx) => `
                    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left shadow-sm">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-black text-amber-700 text-sm">Câu ${idx + 1}</span>
                            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                q.difficulty === 'Dễ' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                q.difficulty === 'Khó' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }">${q.difficulty || 'Vừa'}</span>
                        </div>
                        <div class="text-sm font-bold text-slate-900 mb-3 leading-relaxed">${q.question}</div>
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            ${['A', 'B', 'C', 'D'].map(l => `
                                <div class="p-2.5 rounded-xl ${l === q.answer ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-black' : 'bg-white text-slate-700 border border-slate-200'}">
                                    <span class="font-black mr-1">${l}.</span> ${q.options[l] || ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                <button onclick="window.app.closeAllModals()" class="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200">
                    Đóng
                </button>
            </div>
        `;

        modal.classList.remove('hidden');

        if (window.renderMathInElement) {
            window.renderMathInElement(body, { delimiters: [{left: '$', right: '$', display: false}] });
        }
    }

    openClassListModal() {
        window.soundFX.playClick();
        const modal = document.getElementById('global-modal');
        const body = document.getElementById('global-modal-body');
        if (!modal || !body) return;

        const students = window.classManager.students;
        body.innerHTML = `
            <div class="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 text-slate-900">
                <div class="flex items-center gap-2 text-amber-700 font-bold text-lg">
                    <i class="fa-solid fa-users"></i>
                    <span>Danh Sách Lớp: ${window.classManager.className} (${students.length} HS)</span>
                </div>
                <button onclick="window.app.closeAllModals()" class="text-slate-400 hover:text-slate-700">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>

            <!-- Teams Summary -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 font-bold">
                ${window.classManager.teams.map(t => `
                    <div class="p-2.5 rounded-xl bg-white border ${t.border} text-center shadow-sm">
                        <div class="text-[11px] font-bold ${t.text}">${t.name}</div>
                        <div class="text-base font-black text-slate-900 font-mono mt-0.5">${t.score} điểm</div>
                    </div>
                `).join('')}
            </div>

            <div class="max-h-[50vh] overflow-y-auto pr-2">
                <table class="w-full text-left text-xs text-slate-800">
                    <thead class="bg-slate-100 text-slate-700 uppercase font-black sticky top-0 border-b border-slate-200">
                        <tr>
                            <th class="p-2.5">STT</th>
                            <th class="p-2.5">Họ và tên</th>
                            <th class="p-2.5">Đội thi</th>
                            <th class="p-2.5 text-right">Điểm</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200">
                        ${students.map(s => {
                            const team = window.classManager.teams.find(t => t.id === s.teamId);
                            return `
                                <tr class="hover:bg-slate-50">
                                    <td class="p-2.5 font-mono text-slate-400 font-bold">${s.id}</td>
                                    <td class="p-2.5 font-bold text-slate-900">${s.name}</td>
                                    <td class="p-2.5"><span class="${team ? team.text : ''} font-bold">${team ? team.name : ''}</span></td>
                                    <td class="p-2.5 text-right font-mono font-black text-amber-600">${s.score}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <button onclick="window.classManager.exportToExcel()" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow">
                    <i class="fa-solid fa-file-excel"></i> Xuất kết quả ra Excel
                </button>
                <button onclick="window.app.closeAllModals()" class="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200">
                    Đóng
                </button>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    openLogoModal() {
        window.soundFX.playClick();
        const modal = document.getElementById('global-modal');
        const body = document.getElementById('global-modal-body');
        if (!modal || !body) return;

        const logos = [
            {
                id: 'cap',
                name: 'EduPlay Classic',
                sub: 'Mũ Cử Nhân & Tay Cầm Game Neon',
                file: 'assets/logos/logo-controller-cap.svg',
                desc: 'Biểu tượng kinh điển kết hợp tay cầm chơi game và nón tốt nghiệp rực rỡ.',
                border: 'border-cyan-400'
            },
            {
                id: 'brain',
                name: 'Brain Quest',
                sub: 'Não Tri Thức & Sấm Sét Arcade',
                file: 'assets/logos/logo-brain-quest.svg',
                desc: 'Năng lượng trí tuệ với các đường vân mạch điện tử và tia chớp sức mạnh.',
                border: 'border-pink-500'
            },
            {
                id: 'olympia',
                name: 'Olympia Champ',
                sub: 'Khiên Vàng & Nguyệt Quế Vô Địch',
                file: 'assets/logos/logo-olympia-shield.svg',
                desc: 'Huy hiệu hoàng kim danh giá dành riêng cho các kỳ thi tài và đấu trường tri thức.',
                border: 'border-amber-400'
            },
            {
                id: 'rocket',
                name: 'Edu Rocket',
                sub: 'Tên Lửa Tri Thức Cất Cánh',
                file: 'assets/logos/logo-rocket-book.svg',
                desc: 'Tên lửa cánh sách bay vào dải ngân hà kiến thức đầy cảm hứng cho học sinh.',
                border: 'border-blue-400'
            }
        ];

        body.innerHTML = `
            <div class="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 text-slate-900">
                <div class="flex items-center gap-2 text-purple-700 font-bold text-lg">
                    <i class="fa-solid fa-palette text-purple-600"></i>
                    <span>Bộ Sưu Tập Logo Trò Chơi Giáo Dục (Edu Game)</span>
                </div>
                <button onclick="window.app.closeAllModals()" class="text-slate-400 hover:text-slate-700">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>

            <!-- Showcase Banner Preview -->
            <div class="mb-5 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                <div class="text-[11px] font-bold text-slate-600 px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                    <span><i class="fa-solid fa-image text-blue-600 mr-1.5"></i>Bản Thiết Kế 3D Vector Edu Game Showcase</span>
                    <a href="assets/logos/eduplay_logo_showcase.jpg" target="_blank" class="text-blue-600 hover:underline">Xem ảnh gốc HD</a>
                </div>
                <img src="assets/logos/eduplay_logo_showcase.jpg" alt="Edu Game Logos Showcase" class="w-full max-h-48 object-cover object-top hover:opacity-95 transition">
            </div>

            <div class="text-xs text-slate-600 font-bold mb-3 flex items-center justify-between">
                <span>Chọn mẫu Logo vector SVG để thay đổi giao diện website:</span>
            </div>

            <!-- Grid 4 Vector SVG Logos -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[48vh] overflow-y-auto pr-1">
                ${logos.map(l => `
                    <div class="p-4 rounded-2xl bg-white border-2 ${l.border} flex flex-col justify-between hover:scale-[1.02] transition shadow-sm">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 p-1.5 shadow-sm flex-shrink-0">
                                <img src="${l.file}" alt="${l.name}" class="w-full h-full object-contain">
                            </div>
                            <div>
                                <h4 class="text-sm font-black text-slate-900">${l.name}</h4>
                                <div class="text-[11px] text-amber-700 font-bold">${l.sub}</div>
                                <p class="text-[10px] text-slate-500 mt-1 line-clamp-2">${l.desc}</p>
                            </div>
                        </div>
                        <div class="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                            <button onclick="window.app.applyLogo('${l.file}')" class="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition shadow flex items-center justify-center gap-1">
                                <i class="fa-solid fa-check"></i> Đặt làm Logo
                            </button>
                            <a href="${l.file}" download="${l.id}-logo.svg" class="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1 border border-slate-200" title="Tải file vector SVG gốc">
                                <i class="fa-solid fa-download"></i> SVG
                            </a>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                <button onclick="window.app.closeAllModals()" class="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200">
                    Đóng
                </button>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    applyLogo(svgPath) {
        window.soundFX.playFanfare();
        if (window.confetti) window.confetti({ particleCount: 80 });

        const badge = document.getElementById('app-logo-badge');
        if (badge) {
            badge.innerHTML = `
                <img src="${svgPath}" alt="Logo" class="w-full h-full object-contain rounded-xl p-0.5 animate-scale-up">
            `;
        }
        alert("Đã cập nhật logo trang web thành công!");
    }

    closeAllModals() {
        const modal = document.getElementById('global-modal');
        if (modal) modal.classList.add('hidden');

        const milModal = document.getElementById('mil-modal-overlay');
        if (milModal) milModal.classList.add('hidden');

        const goldModal = document.getElementById('gold-modal-overlay');
        if (goldModal) goldModal.classList.add('hidden');

        const boxModal = document.getElementById('box-modal');
        if (boxModal) boxModal.classList.add('hidden');
    }
}

window.app = new App();
window.addEventListener('DOMContentLoaded', () => {
    window.app.init();

    // Dismiss splash screen / preloader smoothly
    setTimeout(() => {
        const preloader = document.getElementById('page-preloader');
        if (preloader) {
            preloader.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => {
                if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
            }, 550);
        }
    }, 800);
});
