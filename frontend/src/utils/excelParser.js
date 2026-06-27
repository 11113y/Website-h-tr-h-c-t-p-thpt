import * as XLSX from 'xlsx';

export function extractQuestionsFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let tempIdCounter = 1;
        const questions = jsonData.map((row) => {
          // Normalize row keys to handle case/spaces/accents
          const getVal = (keys) => {
            for (const k of Object.keys(row)) {
              const cleanK = k.toLowerCase().replace(/\s+/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              if (keys.includes(cleanK)) {
                return row[k];
              }
            }
            return null;
          };

          const rawType = String(getVal(['loaicauhoi', 'questiontype', 'loai']) || '').trim().toLowerCase();
          const questionType = (rawType === 'dien_so' || rawType === 'dienso' || rawType === 'input_number') ? 'input_number' : 'single_choice';

          const rawDiff = String(getVal(['dokho', 'difficulty', 'muc']) || '').trim().toLowerCase();
          let difficulty = 'medium';
          if (rawDiff === 'de' || rawDiff === 'easy') difficulty = 'easy';
          else if (rawDiff === 'kho' || rawDiff === 'hard') difficulty = 'hard';

          const points = Number(getVal(['diemso', 'points', 'diem']) || 10);
          const questionText = String(getVal(['debai', 'questiontext', 'de', 'cauhoi']) || '').trim();
          const explanation = String(getVal(['loigiaichitiet', 'explanation', 'loigiaichitiet', 'loigiai', 'solution']) || '').trim();
          
          const optA = String(getVal(['luachona', 'optiona', 'a']) || '').trim();
          const optB = String(getVal(['luachonb', 'optionb', 'b']) || '').trim();
          const optC = String(getVal(['luachonc', 'optionc', 'c']) || '').trim();
          const optD = String(getVal(['luachond', 'optiond', 'd']) || '').trim();

          const correctAns = String(getVal(['dapandung', 'correctanswer', 'dapan', 'key']) || '').trim().toUpperCase();

          let options = [];
          if (questionType === 'single_choice') {
            options = [
              { key: 'A', option_text: optA, is_correct: correctAns === 'A' || correctAns === 'LỰA CHỌN A', option_value: '' },
              { key: 'B', option_text: optB, is_correct: correctAns === 'B' || correctAns === 'LỰA CHỌN B', option_value: '' },
              { key: 'C', option_text: optC, is_correct: correctAns === 'C' || correctAns === 'LỰA CHỌN C', option_value: '' },
              { key: 'D', option_text: optD, is_correct: correctAns === 'D' || correctAns === 'LỰA CHỌN D', option_value: '' }
            ];
          } else {
            options = [
              { key: 'ANSWER', option_text: 'Đáp án đúng', is_correct: true, option_value: correctAns }
            ];
          }

          return {
            tempId: tempIdCounter++,
            questionText,
            questionType,
            difficulty,
            explanation,
            points,
            selected: true,
            options
          };
        }).filter(q => q.questionText); // Filter out empty rows

        resolve(questions);
      } catch (err) {
        reject(new Error('Lỗi khi phân tích file Excel: ' + err.message));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function parseExcelAnswerKey(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const answerKey = {};
        jsonData.forEach((row) => {
          let questionNum = null;
          let answerVal = null;
          
          for (const k of Object.keys(row)) {
            const cleanK = k.toLowerCase().replace(/\s+/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (['cau', 'question', 'number', 'no', 'stt'].includes(cleanK)) {
              questionNum = String(row[k]).trim();
            }
            if (['dapan', 'answer', 'key', 'dapandung', 'correct'].includes(cleanK)) {
              answerVal = String(row[k]).trim().toUpperCase();
            }
          }
          
          if (questionNum === null || answerVal === null) {
            const keys = Object.keys(row);
            if (keys.length >= 2) {
              questionNum = String(row[keys[0]]).trim();
              answerVal = String(row[keys[1]]).trim().toUpperCase();
            }
          }

          if (questionNum && answerVal) {
            const numMatch = questionNum.match(/\d+/);
            if (numMatch) {
              const num = numMatch[0];
              answerKey[num] = answerVal;
            }
          }
        });

        resolve(answerKey);
      } catch (err) {
        reject(new Error('Lỗi khi phân tích file Excel đáp án: ' + err.message));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

