/**
 * Excel Class List Parser and Manager
 * Uses SheetJS (xlsx.full.min.js)
 */
class ClassManager {
    constructor() {
        this.students = [];
        this.teams = [
            { id: 1, name: "Đội Rồng Đỏ", color: "from-red-500 to-rose-600", border: "border-red-500", text: "text-red-500", bg: "bg-red-500", score: 0 },
            { id: 2, name: "Đội Đại Bàng Xanh", color: "from-blue-500 to-cyan-600", border: "border-blue-500", text: "text-blue-500", bg: "bg-blue-500", score: 0 },
            { id: 3, name: "Đội Hổ Vàng", color: "from-amber-400 to-yellow-500", border: "border-amber-500", text: "text-amber-500", bg: "bg-amber-500", score: 0 },
            { id: 4, name: "Đội Sư Tử Tím", color: "from-purple-500 to-indigo-600", border: "border-purple-500", text: "text-purple-500", bg: "bg-purple-500", score: 0 }
        ];
        this.className = "Lớp 10A1 (Mẫu)";
        this.loadSampleData();
    }

    loadSampleData() {
        const sampleNames = [
            "Nguyễn Văn An", "Trần Thị Bích", "Lê Hoàng Cường", "Phạm Thu Dung",
            "Vũ Minh Đức", "Hoàng Thúy Hằng", "Đặng Quang Huy", "Bùi Thanh Hương",
            "Đỗ Trọng Khang", "Ngô Mai Lan", "Dương Quốc Nam", "Phan Thảo Nguyên",
            "Mai Đình Phong", "Lý Quỳnh Như", "Trịnh Đức Sơn", "Lương Mỹ Tâm",
            "Chu Đình Tuấn", "Võ Phương Uyên", "Tạ Thanh Vân", "Hà Tuấn Vũ"
        ];

        this.students = sampleNames.map((name, idx) => ({
            id: idx + 1,
            name: name,
            className: "10A1",
            score: 0,
            answersCount: 0,
            teamId: (idx % 4) + 1
        }));
    }

    /**
     * Parse Excel file buffer
     */
    async parseExcel(arrayBuffer) {
        if (!window.XLSX) {
            throw new Error("SheetJS library is not loaded.");
        }

        const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawJson || rawJson.length < 2) {
            throw new Error("File Excel không có dữ liệu hoặc định dạng chưa đúng.");
        }

        // Identify header row
        let headerRowIndex = 0;
        let nameColIdx = -1;
        let sttColIdx = -1;
        let classColIdx = -1;

        for (let r = 0; r < Math.min(rawJson.length, 6); r++) {
            const row = rawJson[r];
            if (!Array.isArray(row)) continue;
            for (let c = 0; c < row.length; c++) {
                const cell = String(row[c] || '').toLowerCase().trim();
                if (cell.includes('họ') && cell.includes('tên') || cell.includes('hoten') || cell.includes('tên') || cell.includes('name')) {
                    nameColIdx = c;
                    headerRowIndex = r;
                }
                if (cell === 'stt' || cell.includes('thứ tự') || cell.includes('id')) {
                    sttColIdx = c;
                }
                if (cell.includes('lớp') || cell.includes('class')) {
                    classColIdx = c;
                }
            }
            if (nameColIdx !== -1) break;
        }

        if (nameColIdx === -1) {
            // Default to column 1 or 0
            nameColIdx = rawJson[headerRowIndex]?.length > 1 ? 1 : 0;
        }

        const parsedStudents = [];
        let idCounter = 1;

        for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
            const row = rawJson[r];
            if (!row || !row[nameColIdx]) continue;
            const name = String(row[nameColIdx]).trim();
            if (!name || name.toLowerCase().includes('tổng số') || name.toLowerCase().includes('kết quả')) continue;

            const stt = sttColIdx !== -1 && row[sttColIdx] ? parseInt(row[sttColIdx]) : idCounter;
            const cName = classColIdx !== -1 && row[classColIdx] ? String(row[classColIdx]).trim() : "Lớp chính";

            parsedStudents.push({
                id: stt || idCounter,
                name: name,
                className: cName,
                score: 0,
                answersCount: 0,
                teamId: ((idCounter - 1) % 4) + 1
            });
            idCounter++;
        }

        if (parsedStudents.length === 0) {
            throw new Error("Không tìm thấy danh sách học sinh hợp lệ trong file Excel.");
        }

        this.students = parsedStudents;
        this.className = firstSheetName || "Lớp mới";
        this.resetScores();
        return this.students;
    }

    resetScores() {
        this.students.forEach(s => {
            s.score = 0;
            s.answersCount = 0;
        });
        this.teams.forEach(t => t.score = 0);
    }

    addScoreToStudent(studentId, points) {
        const student = this.students.find(s => s.id === studentId);
        if (student) {
            student.score += points;
            student.answersCount++;
            const team = this.teams.find(t => t.id === student.teamId);
            if (team) {
                team.score += points;
            }
        }
    }

    addScoreToTeam(teamId, points) {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            team.score += points;
        }
    }

    getRandomStudent() {
        if (!this.students || this.students.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * this.students.length);
        return this.students[randomIndex];
    }

    exportToExcel() {
        if (!window.XLSX) return;
        const exportData = this.students.map(s => {
            const team = this.teams.find(t => t.id === s.teamId);
            return {
                "STT": s.id,
                "Họ và tên": s.name,
                "Lớp": s.className,
                "Đội thi đấu": team ? team.name : `Đội ${s.teamId}`,
                "Số lần trả lời": s.answersCount,
                "Điểm tích lũy": s.score
            };
        });

        const worksheet = window.XLSX.utils.json_to_sheet(exportData);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, "Kết quả trò chơi");
        window.XLSX.writeFile(workbook, `Ket_qua_${this.className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
}

window.classManager = new ClassManager();
