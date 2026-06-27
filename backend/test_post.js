const http = require('http');

function postJson(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const bodyStr = JSON.stringify(data);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function run() {
  try {
    // 1. Login
    console.log("Logging in...");
    const loginRes = await postJson('http://localhost:5002/api/auth/login', {
      email: 'admin@mathpeak.edu.vn',
      password: 'admin123'
    });
    console.log("Login status:", loginRes.statusCode);
    console.log("Login body:", loginRes.body);

    const loginData = JSON.parse(loginRes.body);
    const token = loginData.token;

    // 2. Create Question
    console.log("Creating question...");
    const payload = {
      chapter_id: "", // empty chapter id
      question_text: "Đây là câu hỏi kiểm tra",
      question_type: "single_choice",
      difficulty: "medium",
      explanation: "Giải thích câu hỏi",
      points: 10,
      options: [
        { key: "A", option_text: "Đúng", is_correct: true, option_value: "" },
        { key: "B", option_text: "Sai", is_correct: false, option_value: "" }
      ],
      images: [],
      sol_images: []
    };

    const qRes = await postJson('http://localhost:5002/api/admin/questions', payload, {
      'Authorization': `Bearer ${token}`
    });
    console.log("Question status:", qRes.statusCode);
    console.log("Question body:", qRes.body);
  } catch (err) {
    console.error(err);
  }
}

run();
