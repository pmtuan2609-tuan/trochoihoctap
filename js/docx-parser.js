/**
 * Docx & Text Question Parser for Educational Games
 * Specializes in:
 * 1. Multiple Choice 4 Options (A, B, C, D)
 * 2. True / False Questions (Đúng / Sai)
 */
class QuestionParser {
    constructor() {
        this.questions = [];
    }

    /**
     * Parse arrayBuffer of .docx file
     */
    async parseDocx(arrayBuffer) {
        if (!window.mammoth) {
            throw new Error("Mammoth library is not loaded.");
        }

        const htmlResult = await window.mammoth.convertToHtml({ arrayBuffer });
        const rawResult = await window.mammoth.extractRawText({ arrayBuffer });

        return this.parseText(rawResult.value, htmlResult.value);
    }

    /**
     * Parse text content into structured question objects
     */
    parseText(plainText, htmlText = '') {
        const questions = [];
        if (!plainText || !plainText.trim()) return questions;

        const questionRegex = /(?:^|\n)\s*(?:câu|cau|question|bài|bai)\s*(\d+)[\s.:-]/gi;
        const matches = [...plainText.matchAll(questionRegex)];

        if (matches.length > 0) {
            for (let i = 0; i < matches.length; i++) {
                const startIdx = matches[i].index;
                const endIdx = (i + 1 < matches.length) ? matches[i + 1].index : plainText.length;
                const chunk = plainText.substring(startIdx, endIdx).trim();
                const qNum = matches[i][1];

                const parsed = this.parseQuestionChunk(chunk, qNum);
                if (parsed) {
                    questions.push(parsed);
                }
            }
        } else {
            const fallbackRegex = /(?:^|\n)\s*(\d+)[\s.)-]\s*/g;
            const numMatches = [...plainText.matchAll(fallbackRegex)];
            if (numMatches.length >= 2) {
                for (let i = 0; i < numMatches.length; i++) {
                    const startIdx = numMatches[i].index;
                    const endIdx = (i + 1 < numMatches.length) ? numMatches[i + 1].index : plainText.length;
                    const chunk = plainText.substring(startIdx, endIdx).trim();
                    const qNum = numMatches[i][1];
                    const parsed = this.parseQuestionChunk(chunk, qNum);
                    if (parsed) questions.push(parsed);
                }
            } else {
                const parsed = this.parseQuestionChunk(plainText, 1);
                if (parsed) questions.push(parsed);
            }
        }

        this.questions = questions;
        return questions;
    }

    /**
     * Extract question, options, answer, and detect whether it is Multiple Choice (4 choices) or True/False
     */
    parseQuestionChunk(chunk, defaultNum = 1) {
        if (!chunk) return null;

        let questionText = "";
        let options = { A: "", B: "", C: "", D: "" };
        let answer = "";
        let explanation = "";
        let difficulty = "Trung bình";
        let type = "multiple_choice"; // 'multiple_choice' or 'true_false'

        // Check for difficulty tag [Dễ], [Khó], [VD], [VDC], [NB], [TH]
        if (/\[(dễ|nhận biết|nb|easy)\]/i.test(chunk)) difficulty = "Dễ";
        else if (/\[(khó|vận dụng|vd|vdc|hard)\]/i.test(chunk)) difficulty = "Khó";
        else if (defaultNum <= 4) difficulty = "Dễ";
        else if (defaultNum > 10) difficulty = "Khó";

        // Extract explanation if any
        const expMatch = chunk.match(/(?:hướng dẫn giải|lời giải|giải thích|explanation|hdg)[\s.:-]([\s\S]*?)$/i);
        if (expMatch) {
            explanation = expMatch[1].trim();
            chunk = chunk.substring(0, expMatch.index).trim();
        }

        // Check if question is explicit True/False
        const isExplicitTF = /\[(đúng\s*\/\s*sai|đ\/s|t\/f|true\s*\/\s*false)\]/i.test(chunk) ||
                             /(?:đúng hay sai|chọn đúng hoặc sai|khẳng định sau đúng hay sai)/i.test(chunk);

        // Check for answer: "Đáp án: Đúng" / "Đáp án: Sai" or "Đáp án: A/B/C/D"
        const tfAnsMatch = chunk.match(/(?:đáp án|đáp số|dap an|answer|key|chọn|đ\/a)[\s.:-]*(đúng|sai|true|false|đ|s)/i);
        const ansMatch = chunk.match(/(?:đáp án|đáp số|dap an|answer|key|chọn|đ\/a)[\s.:-]*([A-D])/i);

        if (tfAnsMatch && !ansMatch) {
            type = "true_false";
            const val = tfAnsMatch[1].toLowerCase();
            answer = (val === 'đúng' || val === 'true' || val === 'đ') ? 'A' : 'B';
            chunk = chunk.replace(/(?:đáp án|đáp số|dap an|answer|key|chọn|đ\/a)[\s.:-]*(đúng|sai|true|false|đ|s)/i, '').trim();
        } else if (ansMatch) {
            answer = ansMatch[1].toUpperCase();
        }

        // Extract options: A. ... B. ... C. ... D. ...
        const optionRegex = /(?:^|\s|\n)([A-D])[\s.)-]\s*([\s\S]*?)(?=(?:(?:^|\s|\n)[A-D][\s.)-]|(?:đáp án|dap an|answer|key|chọn)|$))/gi;
        const optMatches = [...chunk.matchAll(optionRegex)];

        if (optMatches.length >= 2) {
            const firstOptIdx = optMatches[0].index;
            questionText = chunk.substring(0, firstOptIdx).trim();

            optMatches.forEach(m => {
                const optLetter = m[1].toUpperCase();
                let optText = m[2].trim();
                optText = optText.replace(/(?:đáp án|dap an|answer)[\s\S]*$/i, '').trim();
                options[optLetter] = optText;
            });

            // Detect if options are A. Đúng, B. Sai
            const optAText = options.A.toLowerCase().trim();
            const optBText = options.B.toLowerCase().trim();
            if ((optAText === 'đúng' || optAText.startsWith('đúng')) &&
                (optBText === 'sai' || optBText.startsWith('sai')) &&
                !options.C && !options.D) {
                type = "true_false";
            }
        } else {
            // Check line by line
            const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean);
            const qLines = [];
            lines.forEach(l => {
                const m = l.match(/^([A-D])[\s.)-]\s*(.*)$/i);
                if (m) {
                    options[m[1].toUpperCase()] = m[2].trim();
                } else if (!l.match(/^(đáp án|dap an|answer)/i)) {
                    qLines.push(l);
                }
            });
            questionText = qLines.join(' ');
        }

        // Clean question title
        questionText = questionText.replace(/^(?:câu|cau|question|bài|bai)\s*\d+[\s.:-]\s*/i, '');
        questionText = questionText.replace(/^\d+[\s.)-]\s*/, '').trim();

        // If explicitly True/False or detected as True/False
        if (isExplicitTF || type === "true_false") {
            type = "true_false";
            options.A = "Đúng";
            options.B = "Sai";
            options.C = "";
            options.D = "";
            if (!answer || (answer !== 'A' && answer !== 'B')) {
                answer = 'A';
            }
        } else {
            // Default 4 choices multiple choice
            if (!answer || !['A', 'B', 'C', 'D'].includes(answer)) {
                answer = 'A';
            }
            if (!options.A) options.A = "Lựa chọn A";
            if (!options.B) options.B = "Lựa chọn B";
            if (!options.C) options.C = "Lựa chọn C";
            if (!options.D) options.D = "Lựa chọn D";
        }

        return {
            id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            number: defaultNum,
            type: type, // 'multiple_choice' or 'true_false'
            question: questionText || `Câu hỏi số ${defaultNum}`,
            options: options,
            answer: answer,
            explanation: explanation,
            difficulty: difficulty
        };
    }

    /**
     * Get default sample questions containing both 4-choice Multiple Choice & True/False questions
     */
    static getSampleBank(category = 'chung') {
        const banks = {
            chung: [
                {
                    number: 1,
                    type: "multiple_choice",
                    question: "Thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam là thành phố nào?",
                    options: { A: "Hà Nội", B: "TP. Hồ Chí Minh", C: "Đà Nẵng", D: "Hải Phòng" },
                    answer: "A",
                    explanation: "Hà Nội là thủ đô của Việt Nam từ năm 1976 đến nay.",
                    difficulty: "Dễ"
                },
                {
                    number: 2,
                    type: "true_false",
                    question: "Trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông ($c^2 = a^2 + b^2$). Đúng hay Sai?",
                    options: { A: "Đúng", B: "Sai", C: "", D: "" },
                    answer: "A",
                    explanation: "Chính xác! Đây là định lý Pythagoras trong hình học Euclid.",
                    difficulty: "Dễ"
                },
                {
                    number: 3,
                    type: "multiple_choice",
                    question: "Hành tinh nào nằm ở vị trí gần Mặt Trời nhất trong Hệ Mặt Trời?",
                    options: { A: "Sao Kim (Venus)", B: "Sao Thủy (Mercury)", C: "Sao Hỏa (Mars)", D: "Trái Đất" },
                    answer: "B",
                    explanation: "Sao Thủy (Mercury) là hành tinh có quỹ đạo gần Mặt Trời nhất.",
                    difficulty: "Dễ"
                },
                {
                    number: 4,
                    type: "true_false",
                    question: "Mặt Trời quay quanh Trái Đất theo quỹ đạo tròn hoàn hảo. Đúng hay Sai?",
                    options: { A: "Đúng", B: "Sai", C: "", D: "" },
                    answer: "B",
                    explanation: "Sai! Theo thuyết nhật tâm của Copernicus và định luật Kepler, Trái Đất quay quanh Mặt Trời theo quỹ đạo elip.",
                    difficulty: "Dễ"
                },
                {
                    number: 5,
                    type: "multiple_choice",
                    question: "Ai là đại thi hào tác giả của kiệt tác văn học 'Truyện Kiều'?",
                    options: { A: "Nguyễn Trãi", B: "Nguyễn Du", C: "Hồ Xuân Hương", D: "Đoàn Thị Điểm" },
                    answer: "B",
                    explanation: "Đại thi hào Nguyễn Du (1765 - 1820) là tác giả của Truyện Kiều.",
                    difficulty: "Dễ"
                },
                {
                    number: 6,
                    type: "true_false",
                    question: "Số 2 là số nguyên tố chẵn duy nhất trong tập hợp các số nguyên tố. Đúng hay Sai?",
                    options: { A: "Đúng", B: "Sai", C: "", D: "" },
                    answer: "A",
                    explanation: "Đúng! Mọi số chẵn lớn hơn 2 đều chia hết cho 2 nên đều là hợp số.",
                    difficulty: "Trung bình"
                },
                {
                    number: 7,
                    type: "multiple_choice",
                    question: "Phương trình bậc hai $ax^2 + bx + c = 0$ ($a \\ne 0$) có nghiệm kép khi biệt thức $\\Delta$ bằng bao nhiêu?",
                    options: { A: "$\\Delta > 0$", B: "$\\Delta < 0$", C: "$\\Delta = 0$", D: "$\\Delta \\le 0$" },
                    answer: "C",
                    explanation: "Phương trình có nghiệm kép khi $\\Delta = b^2 - 4ac = 0$.",
                    difficulty: "Trung bình"
                },
                {
                    number: 8,
                    type: "true_false",
                    question: "Khí Oxy chiếm tỉ lệ phần trăm thể tích lớn nhất trong bầu khí quyển Trái Đất. Đúng hay Sai?",
                    options: { A: "Đúng", B: "Sai", C: "", D: "" },
                    answer: "B",
                    explanation: "Sai! Khí Nitơ chiếm khoảng 78% thể tích không khí, trong khi Oxy chỉ chiếm khoảng 21%.",
                    difficulty: "Trung bình"
                },
                {
                    number: 9,
                    type: "multiple_choice",
                    question: "Chiến thắng Điện Biên Phủ 'lừng lẫy năm châu, chấn động địa cầu' diễn ra vào năm nào?",
                    options: { A: "1945", B: "1954", C: "1975", D: "1968" },
                    answer: "B",
                    explanation: "Chiến thắng Điện Biên Phủ toàn thắng vào ngày 7 tháng 5 năm 1954.",
                    difficulty: "Trung bình"
                },
                {
                    number: 10,
                    type: "true_false",
                    question: "Đạo hàm của hàm số $f(x) = \\sin(x)$ là hàm số $f'(x) = \\cos(x)$. Đúng hay Sai?",
                    options: { A: "Đúng", B: "Sai", C: "", D: "" },
                    answer: "A",
                    explanation: "Đúng! Theo công thức đạo hàm cơ bản, $(\\sin x)' = \\cos x$.",
                    difficulty: "Trung bình"
                },
                {
                    number: 11,
                    type: "multiple_choice",
                    question: "Nguyên tố hóa học nào có ký hiệu là 'Au' trong bảng tuần hoàn?",
                    options: { A: "Bạc", B: "Đồng", C: "Vàng", D: "Nhôm" },
                    answer: "C",
                    explanation: "Au xuất phát từ tiếng Latin 'Aurum', nghĩa là vàng.",
                    difficulty: "Trung bình"
                },
                {
                    number: 12,
                    type: "true_false",
                    question: "Nước đóng băng ở 0°C và sôi ở 100°C ở áp suất khí quyển tiêu chuẩn 1 atm. Đúng hay Sai?",
                    options: { A: "Đúng", B: "Sai", C: "", D: "" },
                    answer: "A",
                    explanation: "Đúng! Đây là hai điểm chuẩn trong thang nhiệt độ Celsius.",
                    difficulty: "Trung bình"
                },
                {
                    number: 13,
                    type: "multiple_choice",
                    question: "Đơn vị đo cường độ dòng điện trong hệ đo lường quốc tế SI là gì?",
                    options: { A: "Volt (V)", B: "Ohm ($\\Omega$)", C: "Ampe (A)", D: "Watt (W)" },
                    answer: "C",
                    explanation: "Ampe (A) là đơn vị đo cường độ dòng điện.",
                    difficulty: "Khó"
                },
                {
                    number: 14,
                    type: "true_false",
                    question: "Thái Bình Dương là đại dương có diện tích nhỏ nhất trên Trái Đất. Đúng hay Sai?",
                    options: { A: "Đúng", B: "Sai", C: "", D: "" },
                    answer: "B",
                    explanation: "Sai! Thái Bình Dương là đại dương lớn nhất và sâu nhất trên Trái Đất (Bắc Băng Dương mới là nhỏ nhất).",
                    difficulty: "Khó"
                },
                {
                    number: 15,
                    type: "multiple_choice",
                    question: "Cầu thủ bóng đá nào đã giành được nhiều Quả bóng Vàng (Ballon d'Or) nhất lịch sử?",
                    options: { A: "Cristiano Ronaldo", B: "Lionel Messi", C: "Pelé", D: "Diego Maradona" },
                    answer: "B",
                    explanation: "Lionel Messi sở hữu kỷ lục 8 Quả bóng Vàng.",
                    difficulty: "Khó"
                }
            ]
        };

        return banks[category] || banks.chung;
    }
}

window.questionParser = new QuestionParser();
