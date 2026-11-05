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
        if (window.roomManager) {
            window.roomManager.openStudentJoinModal();
        } else {
            window.soundFX.playClick();
            alert("Đang khởi tạo hệ thống mã PIN phòng học...");
        }
    }

    /* ---------------- GAME INTRO & FULLSCREEN NAVIGATION ---------------- */
    selectGame(gameId) {
        this.openGameIntroModal(gameId);
    }

    openGameIntroModal(gameId) {
        window.soundFX.playClick();
        this.selectedGame = gameId;

        const modal = document.getElementById('global-modal');
        const body = document.getElementById('global-modal-body');
        if (!modal || !body) return;

        const gameMeta = {
            'olympia': {
                name: 'Đường Lên Đỉnh Olympia',
                icon: 'fa-mountain',
                iconBg: 'bg-rose-100 text-rose-600 border-rose-300',
                badge: '4 Phần Thi • Tính Giờ Từng Mili-giây',
                desc: 'Đấu trường đỉnh cao với 4 phần thi: Khởi động 60s đếm lùi từng mili-giây, Vượt chướng ngại vật bấm chuông giành quyền trả lời, Tăng tốc tính điểm sát nút, và Về đích với Ngôi sao hy vọng.',
                rules: [
                    'Khởi động: 60 giây trả lời nhanh liên tục, mỗi câu đúng nhận +10 điểm.',
                    'Vượt CNV: Trả lời 4 hàng ngang và bấm chuông giải từ khóa chướng ngại vật (+40 điểm).',
                    'Tăng tốc: Đội trả lời nhanh nhất nhận +40 điểm, nhanh nhì +30 điểm, nhanh ba +20 điểm, nhanh tư +10 điểm.',
                    'Về đích: Đặt Ngôi sao hy vọng nhân đôi điểm thưởng nếu trả lời đúng, sai trừ điểm và mở chuông cướp điểm!'
                ]
            },
            'millionaire': {
                name: 'Ai Là Triệu Phú',
                icon: 'fa-circle-question',
                iconBg: 'bg-blue-100 text-blue-600 border-blue-300',
                badge: '15 Câu Hỏi • 4 Quyền Trợ Giúp',
                desc: 'Trò chơi kinh điển trả lời câu hỏi trắc nghiệm 4 đáp án A, B, C, D hoặc Đúng/Sai với 4 quyền trợ giúp đắc lực (50:50, Hỏi cả lớp, Gọi điện cho cố vấn, Đổi câu hỏi).',
                rules: [
                    'Vượt qua 15 nấc thang điểm thưởng để chạm đến đỉnh vinh quang 150.000.000 VNĐ.',
                    'Có 3 mốc quan trọng không bị tụt điểm: Câu 5, Câu 10 và Câu 15.',
                    'Sử dụng 4 quyền trợ giúp thông minh khi gặp câu hỏi khó.'
                ]
            },
            'goldminer': {
                name: 'Đào Vàng Tri Thức',
                icon: 'fa-person-digging',
                iconBg: 'bg-amber-100 text-amber-700 border-amber-300',
                badge: 'Bốc Quặng • Tích Lũy Vàng',
                desc: 'Bốc trúng thỏi vàng hoàng kim, kim cương xanh, hồng ngọc hoặc túi bí ẩn -> Trả lời chính xác câu hỏi để kéo quặng lên và tích lũy điểm thưởng cho đội.',
                rules: [
                    'Mỗi loại quặng có giá trị vàng tương ứng (+150$ đến +300$).',
                    'Mỗi lượt trả lời trong vòng 25 giây đếm ngược.',
                    'Đúng được cộng vàng vào tổng điểm của đội, sai sẽ bị đứt dây tời và mất lượt.'
                ]
            },
            'wheel': {
                name: 'Vòng Quay May Mắn',
                icon: 'fa-dharmachakra',
                iconBg: 'bg-purple-100 text-purple-600 border-purple-300',
                badge: 'Quay Gọi Tên • Quay Điểm Thưởng',
                desc: 'Vòng quay sinh động gọi tên ngẫu nhiên học sinh trong danh sách lớp hoặc quay điểm thưởng may mắn (điểm 10 miệng, tràng pháo tay, miễn bài tập về nhà).',
                rules: [
                    'Chế độ 1: Quay gọi tên ngẫu nhiên học sinh lên bảng trả lời.',
                    'Chế độ 2: Quay trao thưởng điểm may mắn cho học sinh/đội trả lời xuất sắc.'
                ]
            },
            'mystery': {
                name: 'Hộp Quà Bí Mật',
                icon: 'fa-gift',
                iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-300',
                badge: '12 Hộp Quà • Thưởng Bất Ngờ',
                desc: 'Học sinh chọn hộp quà yêu thích -> Giải câu đố thử thách -> Mở phần quà bí ẩn (Điểm 10 kiểm tra miệng, nhân đôi điểm, quà tặng giáo viên).',
                rules: [
                    'Có 12 hộp quà bí mật chứa nhiều phần quà giá trị.',
                    'Trả lời đúng câu hỏi thử thách để được mở nắp hộp quà nhận thưởng.'
                ]
            }
        };

        const meta = gameMeta[gameId] || gameMeta['olympia'];
        const qCount = this.questions.length;
        const tfCount = this.questions.filter(q => q.type === 'true_false').length;
        const mcCount = qCount - tfCount;
        const teams = (window.roomManager && window.roomManager.teams) || (window.classManager && window.classManager.teams) || [];

        body.innerHTML = `
            <!-- Modal Header (Fixed Top) -->
            <div class="px-5 py-4 border-b border-slate-200 flex-shrink-0 flex items-center justify-between bg-white">
                <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-2xl ${meta.iconBg} border flex items-center justify-center text-xl shadow-sm">
                        <i class="fa-solid ${meta.icon}"></i>
                    </div>
                    <div>
                        <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">${meta.badge}</div>
                        <h3 class="text-base sm:text-lg font-black text-slate-900 font-heading leading-tight">${meta.name}</h3>
                    </div>
                </div>
                <button onclick="window.app.closeAllModals()" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition">
                    <i class="fa-solid fa-xmark text-sm"></i>
                </button>
            </div>

            <!-- Modal Body (Scrollable) -->
            <div class="p-5 overflow-y-auto flex-1 space-y-4 text-slate-800 text-left">
                
                <!-- Game Description -->
                <p class="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    ${meta.desc}
                </p>

                <!-- Rules Box -->
                <div class="bg-gradient-to-r from-purple-50/70 to-indigo-50/70 border border-purple-200 rounded-2xl p-4">
                    <div class="text-xs font-black text-purple-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <i class="fa-solid fa-circle-info text-purple-600"></i>
                        <span>Luật Chơi & Thể Lệ Thi Đấu</span>
                    </div>
                    <ul class="space-y-1.5 text-xs text-slate-700">
                        ${meta.rules.map(r => `
                            <li class="flex items-start gap-2">
                                <i class="fa-solid fa-check text-emerald-600 text-[11px] mt-0.5"></i>
                                <span>${r}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <!-- Match Setup Status Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <!-- Questions Info Card -->
                    <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <div class="flex items-center justify-between mb-1.5">
                            <span class="font-bold text-slate-500 uppercase text-[10px]">Ngân hàng câu hỏi</span>
                            <span class="font-black text-blue-700 font-mono text-sm">${qCount} Câu</span>
                        </div>
                        <div class="space-y-1 text-[11px] text-slate-600">
                            <div class="flex justify-between">
                                <span>Trắc nghiệm 4 đáp án (A-B-C-D):</span>
                                <strong class="text-slate-900">${mcCount} câu</strong>
                            </div>
                            <div class="flex justify-between">
                                <span>Trắc nghiệm Đúng / Sai:</span>
                                <strong class="text-emerald-700">${tfCount} câu</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Teams & PINs Info Card -->
                    <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div>
                            <div class="flex items-center justify-between mb-1.5">
                                <span class="font-bold text-slate-500 uppercase text-[10px]">Đội thi đấu (${teams.length} đội)</span>
                                <button onclick="window.roomManager.openTeamSetupModal()" class="text-[10px] text-purple-600 font-bold hover:underline">
                                    <i class="fa-solid fa-gear mr-1"></i>Đổi số đội
                                </button>
                            </div>
                            <div class="text-[11px] text-slate-600 leading-snug">
                                ${teams.map(t => `<span class="inline-block px-1.5 py-0.5 rounded bg-slate-100 ${t.text} font-bold mr-1 mb-1">${t.name.split(' ')[0] || t.name} (PIN: ${t.pin})</span>`).join('')}
                            </div>
                        </div>
                        <div class="text-[10px] text-slate-400 mt-1 italic">
                            * Danh sách học sinh: Có thể tải file Excel bất cứ lúc nào
                        </div>
                    </div>
                </div>

            </div>

            <!-- Modal Footer (Fixed Bottom with Fullscreen Launch Button) -->
            <div class="px-5 py-3.5 border-t border-slate-200 flex-shrink-0 flex items-center justify-between bg-slate-50">
                <button onclick="window.app.closeAllModals()" class="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition">
                    Đổi trò chơi khác
                </button>

                <button onclick="window.app.startSelectedGameFullscreen('${gameId}')"
                    class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black text-sm shadow-lg flex items-center gap-2 transform active:scale-95 transition">
                    <i class="fa-solid fa-expand"></i>
                    <span>BẮT ĐẦU CHƠI (TOÀN MÀN HÌNH)</span>
                </button>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    startSelectedGameFullscreen(gameId) {
        this.closeAllModals();
        this.selectedGame = gameId;

        // Hide dashboard, show dedicated fullscreen arena
        const dashboard = document.getElementById('teacher-dashboard');
        const arena = document.getElementById('game-arena');
        if (dashboard) dashboard.classList.add('hidden');
        if (arena) {
            arena.classList.remove('hidden');
            arena.classList.add('flex');
        }

        // Auto trigger browser fullscreen for projector
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        }

        // Update Arena Header HUD
        const titles = {
            'olympia': { name: 'Đường Lên Đỉnh Olympia', sub: 'Chế độ tính thời gian sát nút từng mili-giây', icon: 'fa-mountain' },
            'millionaire': { name: 'Ai Là Triệu Phú', sub: 'Chế độ 15 câu hỏi kịch tính • 4 quyền trợ giúp', icon: 'fa-circle-question' },
            'goldminer': { name: 'Đào Vàng Tri Thức', sub: 'Chế độ bốc quặng giải đố tích lũy vàng', icon: 'fa-person-digging' },
            'wheel': { name: 'Vòng Quay May Mắn', sub: 'Chế độ quay tên ngẫu nhiên & trao thưởng', icon: 'fa-dharmachakra' },
            'mystery': { name: 'Hộp Quà Bí Mật', sub: 'Chế độ 12 hộp quà bí ẩn may mắn', icon: 'fa-gift' }
        };

        const currentMeta = titles[gameId] || { name: 'Trò Chơi Học Tập', sub: 'Chế độ toàn màn hình máy chiếu', icon: 'fa-gamepad' };
        const arenaTitle = document.getElementById('arena-game-title');
        const arenaSub = document.getElementById('arena-game-subtitle');
        const arenaIcon = document.getElementById('arena-game-icon');

        if (arenaTitle) arenaTitle.textContent = currentMeta.name;
        if (arenaSub) arenaSub.textContent = currentMeta.sub;
        if (arenaIcon) arenaIcon.innerHTML = `<i class="fa-solid ${currentMeta.icon}"></i>`;

        // Update breadcrumb
        const breadcrumb = document.getElementById('top-breadcrumb');
        if (breadcrumb) breadcrumb.textContent = currentMeta.name;

        // Close mobile sidebar if open
        if (window.innerWidth < 1024) {
            this.toggleSidebar(false);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Launch specific game engine
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

    exitGameArena() {
        window.soundFX.stopSuspense();
        window.soundFX.playClick();

        if (window.olympiaGame) window.olympiaGame.clearAllTimers();
        if (window.goldMinerGame) window.goldMinerGame.clearTimer();
        if (window.millionaireGame) window.millionaireGame.clearTimer();

        // Exit fullscreen if active
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }

        const dashboard = document.getElementById('teacher-dashboard');
        const arena = document.getElementById('game-arena');
        if (arena) {
            arena.classList.add('hidden');
            arena.classList.remove('flex');
        }
        if (dashboard) dashboard.classList.remove('hidden');

        const breadcrumb = document.getElementById('top-breadcrumb');
        if (breadcrumb) breadcrumb.textContent = 'Trang chủ';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showGameSelection() {
        this.exitGameArena();
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
            <!-- Header (Fixed) -->
            <div class="px-5 py-3.5 border-b border-slate-200 flex-shrink-0 flex items-center justify-between bg-white">
                <div>
                    <h3 class="text-base font-black text-slate-900 flex items-center gap-2">
                        <i class="fa-solid fa-list-check text-blue-600"></i>
                        <span>Ngân Hàng Câu Hỏi (${this.questions.length} câu)</span>
                    </h3>
                    <p class="text-[11px] text-slate-500">Xem trước và kiểm tra nội dung câu hỏi trắc nghiệm</p>
                </div>
                <button onclick="window.app.closeAllModals()" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition">
                    <i class="fa-solid fa-xmark text-sm"></i>
                </button>
            </div>

            <!-- Body (Scrollable) -->
            <div class="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
                ${this.questions.map((q, idx) => `
                    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left shadow-sm">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <span class="font-black text-amber-700 text-xs">CÂU ${idx + 1}</span>
                                <span class="text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                    q.type === 'true_false' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-200 text-slate-700'
                                }">
                                    ${q.type === 'true_false' ? 'Đúng / Sai' : 'Trắc nghiệm 4 đáp án'}
                                </span>
                            </div>
                            <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                                q.difficulty === 'Dễ' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                q.difficulty === 'Khó' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }">${q.difficulty || 'Vừa'}</span>
                        </div>
                        <div class="text-sm font-bold text-slate-900 mb-3 leading-relaxed">${q.question}</div>
                        ${q.type === 'true_false' ? `
                            <div class="grid grid-cols-2 gap-2 text-xs">
                                <div class="p-2.5 rounded-xl ${q.answer === 'A' ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-400 font-black' : 'bg-white text-slate-600 border border-slate-200'} flex items-center justify-between">
                                    <span>A. ĐÚNG</span>
                                    ${q.answer === 'A' ? '<i class="fa-solid fa-check text-emerald-700"></i>' : ''}
                                </div>
                                <div class="p-2.5 rounded-xl ${q.answer === 'B' ? 'bg-rose-100 text-rose-900 border-2 border-rose-400 font-black' : 'bg-white text-slate-600 border border-slate-200'} flex items-center justify-between">
                                    <span>B. SAI</span>
                                    ${q.answer === 'B' ? '<i class="fa-solid fa-check text-rose-700"></i>' : ''}
                                </div>
                            </div>
                        ` : `
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                ${['A', 'B', 'C', 'D'].map(l => `
                                    <div class="p-2.5 rounded-xl ${l === q.answer ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-black' : 'bg-white text-slate-700 border border-slate-200'}">
                                        <span class="font-black mr-1">${l}.</span> ${q.options[l] || ''}
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                `).join('')}
            </div>

            <!-- Footer (Fixed) -->
            <div class="px-5 py-2.5 border-t border-slate-200 flex-shrink-0 flex justify-end bg-slate-50">
                <button onclick="window.app.closeAllModals()" class="px-5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition">
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
            <!-- Header (Fixed) -->
            <div class="px-5 py-3.5 border-b border-slate-200 flex-shrink-0 flex items-center justify-between bg-white">
                <div>
                    <h3 class="text-base font-black text-slate-900 flex items-center gap-2">
                        <i class="fa-solid fa-users text-amber-600"></i>
                        <span>Danh Sách Lớp: ${window.classManager.className} (${students.length} HS)</span>
                    </h3>
                    <p class="text-[11px] text-slate-500">Bảng theo dõi điểm số và phân chia đội thi đấu</p>
                </div>
                <button onclick="window.app.closeAllModals()" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition">
                    <i class="fa-solid fa-xmark text-sm"></i>
                </button>
            </div>

            <!-- Body (Scrollable) -->
            <div class="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
                <!-- Teams Summary -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 font-bold">
                    ${window.classManager.teams.map(t => `
                        <div class="p-2.5 rounded-xl bg-white border ${t.border} text-center shadow-sm">
                            <div class="text-[11px] font-bold ${t.text}">${t.name}</div>
                            <div class="text-base font-black text-slate-900 font-mono mt-0.5">${t.score} điểm</div>
                        </div>
                    `).join('')}
                </div>

                <div class="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
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
            </div>

            <!-- Footer (Fixed) -->
            <div class="px-5 py-2.5 border-t border-slate-200 flex-shrink-0 flex items-center justify-between bg-slate-50">
                <button onclick="window.classManager.exportToExcel()" class="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow">
                    <i class="fa-solid fa-file-excel"></i> Xuất kết quả ra Excel
                </button>
                <button onclick="window.app.closeAllModals()" class="px-5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition">
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
                name: 'EDU GAME Classic',
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
            <!-- Modal Header (Fixed Top) -->
            <div class="px-5 py-3.5 border-b border-slate-200 flex-shrink-0 flex items-center justify-between bg-white">
                <div>
                    <h3 class="text-base font-black text-slate-900 flex items-center gap-2">
                        <i class="fa-solid fa-palette text-purple-600"></i>
                        <span>Bộ Sưu Tập Logo EDU GAME</span>
                    </h3>
                    <p class="text-[11px] text-slate-500">Xem trước và chọn mẫu logo nhận diện website</p>
                </div>
                <button onclick="window.app.closeAllModals()" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition">
                    <i class="fa-solid fa-xmark text-sm"></i>
                </button>
            </div>

            <!-- Modal Scrollable Content Body -->
            <div class="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5">
                
                <!-- Compact 3D Showcase Banner -->
                <div class="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                    <div class="text-[11px] font-bold text-slate-600 px-3 py-1 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                        <span><i class="fa-solid fa-image text-purple-600 mr-1.5"></i>Bản Thiết Kế 3D Showcase</span>
                        <a href="assets/logos/eduplay_logo_showcase.jpg" target="_blank" class="text-purple-600 hover:underline flex items-center gap-1 font-bold">
                            <span>Xem ảnh gốc HD</span>
                            <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                        </a>
                    </div>
                    <img src="assets/logos/eduplay_logo_showcase.jpg" alt="EDU GAME Logos Showcase" class="w-full h-24 sm:h-32 object-cover object-top hover:opacity-95 transition">
                </div>

                <div class="text-xs font-bold text-slate-700">
                    Chọn mẫu Logo Vector SVG để đổi nhận diện website:
                </div>

                <!-- Grid 4 Vector SVG Logos -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${logos.map(l => `
                        <div class="p-3 rounded-2xl bg-white border-2 ${l.border} flex flex-col justify-between hover:shadow-md transition">
                            <div class="flex items-start gap-3 mb-2">
                                <div class="w-13 h-13 rounded-xl bg-slate-50 border border-slate-200 p-1 shadow-sm flex-shrink-0">
                                    <img src="${l.file}" alt="${l.name}" class="w-12 h-12 object-contain">
                                </div>
                                <div class="min-w-0">
                                    <h4 class="text-xs sm:text-sm font-black text-slate-900 truncate">${l.name}</h4>
                                    <div class="text-[10px] text-amber-700 font-bold truncate">${l.sub}</div>
                                    <p class="text-[10px] text-slate-500 mt-0.5 line-clamp-2">${l.desc}</p>
                                </div>
                            </div>
                            <div class="flex gap-2 pt-2 border-t border-slate-100">
                                <button onclick="window.app.applyLogo('${l.file}')" class="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow flex items-center justify-center gap-1">
                                    <i class="fa-solid fa-check"></i> Đặt làm Logo
                                </button>
                                <a href="${l.file}" download="${l.id}-logo.svg" class="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1 border border-slate-200" title="Tải file vector SVG gốc">
                                    <i class="fa-solid fa-download"></i> SVG
                                </a>
                            </div>
                        </div>
                    `).join('')}
                </div>

            </div>

            <!-- Modal Footer (Fixed Bottom) -->
            <div class="px-5 py-2.5 border-t border-slate-200 flex-shrink-0 flex items-center justify-end bg-slate-50">
                <button onclick="window.app.closeAllModals()" class="px-5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition">
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
