/**
 * Docx & Text Question Parser for Educational Games
 * Supports .docx via Mammoth.js and raw text formats
 * Detects questions, 4 options (A,B,C,D), answers, and LaTeX math
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

        // Convert to both HTML (for detecting bold/underlined answers) and plain text
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

        // Split text by Question delimiters (Câu 1, Câu 2, Question 1, Bài 1, etc.)
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
            // Fallback: Try splitting by double newline or numbered items like "1. ", "2. "
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
                // Single question chunk or unstructured
                const parsed = this.parseQuestionChunk(plainText, 1);
                if (parsed) questions.push(parsed);
            }
        }

        this.questions = questions;
        return questions;
    }

    /**
     * Extract question title, options A/B/C/D, answer, and explanation from a single text block
     */
    parseQuestionChunk(chunk, defaultNum = 1) {
        if (!chunk) return null;

        let questionText = "";
        let options = { A: "", B: "", C: "", D: "" };
        let answer = "";
        let explanation = "";
        let difficulty = "Trung bình"; // Dễ, Trung bình, Khó

        // Check for difficulty tag [Dễ], [Khó], [VD], [VDC], [NB], [TH]
        if (/\[(dễ|nhận biết|nb|easy)\]/i.test(chunk)) difficulty = "Dễ";
        else if (/\[(khó|vận dụng|vd|vdc|hard)\]/i.test(chunk)) difficulty = "Khó";
        else if (defaultNum <= 5) difficulty = "Dễ";
        else if (defaultNum > 10) difficulty = "Khó";

        // Extract explanation if any
        const expMatch = chunk.match(/(?:hướng dẫn giải|lời giải|giải thích|explanation|hdg)[\s.:-]([\s\S]*?)$/i);
        if (expMatch) {
            explanation = expMatch[1].trim();
            chunk = chunk.substring(0, expMatch.index).trim();
        }

        // Extract explicit answer: "Đáp án: A" or "Đ/A: B" or "Chọn C" or "Answer: D"
        const ansMatch = chunk.match(/(?:đáp án|đáp số|dap an|answer|key|chọn|đ\/a)[\s.:-]*([A-D])/i);
        if (ansMatch) {
            answer = ansMatch[1].toUpperCase();
        }

        // Extract options: A. ... B. ... C. ... D. ...
        // Handle inline and multi-line options
        const optionRegex = /(?:^|\s|\n)([A-D])[\s.)-]\s*([\s\S]*?)(?=(?:(?:^|\s|\n)[A-D][\s.)-]|(?:đáp án|dap an|answer|key|chọn)|$))/gi;
        const optMatches = [...chunk.matchAll(optionRegex)];

        if (optMatches.length >= 2) {
            // First find where options start
            const firstOptIdx = optMatches[0].index;
            questionText = chunk.substring(0, firstOptIdx).trim();

            optMatches.forEach(m => {
                const optLetter = m[1].toUpperCase();
                let optText = m[2].trim();
                // Remove trailing dots or answer lines if leaked
                optText = optText.replace(/(?:đáp án|dap an|answer)[\s\S]*$/i, '').trim();
                options[optLetter] = optText;
            });
        } else {
            // If options not detected with standard regex, check line by line
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

        // Clean question title: remove "Câu 1:", "Question 1.", etc.
        questionText = questionText.replace(/^(?:câu|cau|question|bài|bai)\s*\d+[\s.:-]\s*/i, '');
        questionText = questionText.replace(/^\d+[\s.)-]\s*/, '').trim();

        // Default answer to A if not found
        if (!answer || !['A', 'B', 'C', 'D'].includes(answer)) {
            // Look for marked answer in options (e.g. *A or (A))
            for (const key of ['A', 'B', 'C', 'D']) {
                if (options[key].includes('*') || options[key].startsWith('✓')) {
                    answer = key;
                    options[key] = options[key].replace(/[*✓]/g, '').trim();
                    break;
                }
            }
            if (!answer) answer = 'A';
        }

        // Ensure all options have some placeholder text if blank
        if (!options.A) options.A = "Lựa chọn A";
        if (!options.B) options.B = "Lựa chọn B";
        if (!options.C) options.C = "Lựa chọn C";
        if (!options.D) options.D = "Lựa chọn D";

        return {
            id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            number: defaultNum,
            question: questionText || `Câu hỏi số ${defaultNum}`,
            options: options,
            answer: answer,
            explanation: explanation,
            difficulty: difficulty
        };
    }

    /**
     * Get default sample questions for immediate demonstration
     */
    static getSampleBank(category = 'chung') {
        const banks = {
            chung: [
                {
                    number: 1,
                    question: "Thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam là thành phố nào?",
                    options: { A: "Hà Nội", B: "TP. Hồ Chí Minh", C: "Đà Nẵng", D: "Hải Phòng" },
                    answer: "A",
                    explanation: "Hà Nội là thủ đô của Việt Nam từ năm 1976 đến nay.",
                    difficulty: "Dễ"
                },
                {
                    number: 2,
                    question: "Hành tinh nào gần Mặt Trời nhất trong Hệ Mặt Trời?",
                    options: { A: "Sao Kim (Venus)", B: "Sao Thủy (Mercury)", C: "Sao Hỏa (Mars)", D: "Trái Đất" },
                    answer: "B",
                    explanation: "Sao Thủy (Mercury) là hành tinh nằm gần Mặt Trời nhất.",
                    difficulty: "Dễ"
                },
                {
                    number: 3,
                    question: "Trong tam giác vuông, bình phương cạnh huyền bằng gì?",
                    options: {
                        A: "Tổng bình phương hai cạnh góc vuông: $c^2 = a^2 + b^2$",
                        B: "Hiệu bình phương hai cạnh góc vuông",
                        C: "Tích hai cạnh góc vuông",
                        D: "Gấp đôi cạnh góc vuông nhỏ hơn"
                    },
                    answer: "A",
                    explanation: "Đây là định lý Pythagoras nổi tiếng trong hình học: $c^2 = a^2 + b^2$.",
                    difficulty: "Dễ"
                },
                {
                    number: 4,
                    question: "Ai là tác giả của tác phẩm văn học nổi tiếng 'Truyện Kiều'?",
                    options: { A: "Nguyễn Trãi", B: "Nguyễn Du", C: "Hồ Xuân Hương", D: "Đoàn Thị Điểm" },
                    answer: "B",
                    explanation: "Đại thi hào Nguyễn Du (1765 - 1820) là tác giả của Truyện Kiều.",
                    difficulty: "Dễ"
                },
                {
                    number: 5,
                    question: "Khí nào chiếm tỉ lệ thể tích lớn nhất trong bầu khí quyển Trái Đất?",
                    options: { A: "Khí Oxy ($O_2$)", B: "Khí Nitơ ($N_2$)", C: "Khí Carbonic ($CO_2$)", D: "Khí Argon" },
                    answer: "B",
                    explanation: "Khí Nitơ chiếm khoảng 78% thể tích không khí.",
                    difficulty: "Trung bình"
                },
                {
                    number: 6,
                    question: "Phương trình bậc hai $ax^2 + bx + c = 0$ ($a \\ne 0$) có nghiệm kép khi biệt thức $\\Delta$ bằng bao nhiêu?",
                    options: { A: "$\\Delta > 0$", B: "$\\Delta < 0$", C: "$\\Delta = 0$", D: "$\\Delta \\le 0$" },
                    answer: "C",
                    explanation: "Phương trình có nghiệm kép $x_1 = x_2 = -\\frac{b}{2a}$ khi $\\Delta = b^2 - 4ac = 0$.",
                    difficulty: "Trung bình"
                },
                {
                    number: 7,
                    question: "Chiến thắng Điện Biên Phủ 'lừng lẫy năm châu, chấn động địa cầu' diễn ra vào năm nào?",
                    options: { A: "1945", B: "1954", C: "1975", D: "1968" },
                    answer: "B",
                    explanation: "Chiến thắng Điện Biên Phủ toàn thắng vào ngày 7 tháng 5 năm 1954.",
                    difficulty: "Trung bình"
                },
                {
                    number: 8,
                    question: "Nguyên tố hóa học nào có ký hiệu là 'Au' trong bảng tuần hoàn?",
                    options: { A: "Bạc", B: "Đồng", C: "Vàng", D: "Nhôm" },
                    answer: "C",
                    explanation: "Au xuất phát từ tiếng Latin 'Aurum', nghĩa là vàng.",
                    difficulty: "Trung bình"
                },
                {
                    number: 9,
                    question: "Đỉnh núi nào được mệnh danh là 'Nóc nhà của Đông Dương'?",
                    options: { A: "Fansipan (Việt Nam)", B: "Phou Bia (Lào)", C: "Aural (Campuchia)", D: "Bạch Mộc Lương Tử" },
                    answer: "A",
                    explanation: "Fansipan cao 3.143m tại Sa Pa, Lào Cai, là đỉnh núi cao nhất bán đảo Đông Dương.",
                    difficulty: "Trung bình"
                },
                {
                    number: 10,
                    question: "Đạo hàm của hàm số $f(x) = \\sin(x)$ là hàm số nào sau đây?",
                    options: { A: "$-\\cos(x)$", B: "$\\cos(x)$", C: "$\\tan(x)$", D: "$-\\sin(x)$" },
                    answer: "B",
                    explanation: "Theo bảng đạo hàm cơ bản, $(\\sin x)' = \\cos x$.",
                    difficulty: "Trung bình"
                },
                {
                    number: 11,
                    question: "Đơn vị đo cường độ dòng điện trong hệ đo lường quốc tế SI là gì?",
                    options: { A: "Volt (V)", B: "Ohm ($\\Omega$)", C: "Ampe (A)", D: "Watt (W)" },
                    answer: "C",
                    explanation: "Ampe (A) là đơn vị đo cường độ dòng điện.",
                    difficulty: "Khó"
                },
                {
                    number: 12,
                    question: "Tập hợp các số thực $\\mathbb{R}$ bao gồm các tập số nào?",
                    options: {
                        A: "Số hữu tỉ $\\mathbb{Q}$ và số vô tỉ $\\mathbb{I}$",
                        B: "Chỉ số nguyên $\\mathbb{Z}$ và số tự nhiên $\\mathbb{N}$",
                        C: "Chỉ số nguyên tố",
                        D: "Chỉ các phân số dương"
                    },
                    answer: "A",
                    explanation: "Tập số thực $\\mathbb{R} = \\mathbb{Q} \\cup \\mathbb{I}$.",
                    difficulty: "Khó"
                },
                {
                    number: 13,
                    question: "Tổ chức Liên Hợp Quốc (UN) chính thức được thành lập vào năm nào?",
                    options: { A: "1919", B: "1945", C: "1950", D: "1977" },
                    answer: "B",
                    explanation: "Hiến chương Liên Hợp Quốc có hiệu lực vào ngày 24/10/1945.",
                    difficulty: "Khó"
                },
                {
                    number: 14,
                    question: "Đại dương nào có diện tích và độ sâu trung bình lớn nhất trên Trái Đất?",
                    options: { A: "Đại Tây Dương", B: "Ấn Độ Dương", C: "Thái Bình Dương", D: "Bắc Băng Dương" },
                    answer: "C",
                    explanation: "Thái Bình Dương chiếm hơn 30% diện tích bề mặt Trái Đất.",
                    difficulty: "Khó"
                },
                {
                    number: 15,
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
