export const ROADMAP_STATIONS = [
  { id: 'station-1', name: 'Trạm Base Camp: Nhập môn Số học', desc: 'Làm quen với các phép toán cơ bản và quy luật số học.', altitude: '500m', progress: 100, completed: true },
  { id: 'station-2', name: 'Vực thẳm Đại số: Đơn thức & Đa thức', desc: 'Rút gọn biểu thức phức tạp, phương trình bậc nhất.', altitude: '1,500m', progress: 75, completed: false, isCurrent: true },
  { id: 'station-3', name: 'Đèo Hình học: Hệ thức lượng & Góc', desc: 'Chinh phục các định lý tam giác, lượng giác căn bản.', altitude: '3,200m', progress: 0, completed: false },
  { id: 'station-4', name: 'Vách đá Giải tích: Đạo hàm & Giới hạn', desc: 'Tiệm cận độ dốc toán học tối đa của đỉnh Peak.', altitude: '5,000m', progress: 0, completed: false },
  { id: 'station-5', name: 'ĐỈNH PEAK: Chuyên đề Tích phân & Tổng hợp', desc: 'Thử thách cuối cùng để cắm cờ chiến thắng Everest toán học.', altitude: '8,848m', progress: 0, completed: false }
];

export const QUIZ_QUESTIONS = [
  {
    "id": 1,
    "section": "I",
    "question": "Phương trình  với  có nghiệm là:",
    "explanation": "⇔[&x+10^{o}=30^{o}+k360^{o}&x+10^{o}=180^{o}-30^{o}+k360^{o})⇔[&x=20^{o}+k360^{o}&x=140^{o}+k360^{o})(k∈Z)\nMà .",
    "options": [
      "và",
      "và",
      "và",
      "và"
    ],
    "answer": 1,
    "images": [],
    "sol_images": []
  },
  {
    "id": 2,
    "section": "I",
    "question": "Cho hàm số  xác định trên R và có đồ thị bên dưới. Mệnh đề nào dưới đây sai?",
    "explanation": "Từ  đồ thị đã cho, ta có\nHàm số đã cho có điểm cực tiểu bằng  và giá trị cực tiểu bằng .\nHàm số đã cho có điểm cực đại bằng  và giá trị cực đại bằng .",
    "options": [
      "Hàm số đã cho có điểm cực tiểu bằng",
      "Hàm số đã cho có điểm cực đại bằng",
      "Hàm số đã cho có giá trị cực đại bằng",
      "Hàm số đã cho có giá trị cực tiểu bằng"
    ],
    "answer": 2,
    "images": [],
    "sol_images": []
  },
  {
    "id": 3,
    "section": "I",
    "question": "Cho cấp số cộng  với . Công sai của cấp số cộng đã cho bằng",
    "explanation": "",
    "options": [
      "",
      "",
      "",
      ""
    ],
    "answer": 1,
    "images": [],
    "sol_images": []
  },
  {
    "id": 4,
    "section": "I",
    "question": "Hằng ngày ông Thắng đều đi xe buýt từ nhà đến cơ quan. Dưới đây là bảng thống kê thời gian của 100 lần ông Thắng đi xe buýt từ nhà đến cơ quan. Thời gian (phút) Số lượt 22 38 27 8 4 1 Tứ phân vị thứ nhất của mẫu số liệu ghép nhóm trên (làm tròn kết quả đến hàng phần trăm) là",
    "explanation": "",
    "options": [
      "",
      "",
      "",
      ""
    ],
    "answer": 2,
    "images": [],
    "sol_images": []
  },
  {
    "id": 5,
    "section": "I",
    "question": "Cho hình lập phương . Góc giữa hai vectơ  và  là:",
    "explanation": "",
    "options": [
      "",
      "",
      "",
      ""
    ],
    "answer": 2,
    "images": [],
    "sol_images": []
  },
  {
    "id": 6,
    "section": "I",
    "question": "Cho hàm số  xác định trên R\\{-1} và bảng biến thiên như sau: Mệnh đề nào dưới đây đúng?",
    "explanation": "",
    "options": [
      "Hàm số đã cho nghịch biến trên các khoảng và",
      "Hàm số đã cho đồng biến trên khoảng",
      "Hàm số đã cho có điểm cực tiểu bằng",
      "Hàm số đã cho có giá trị cực đại bằng"
    ],
    "answer": 0,
    "images": [],
    "sol_images": []
  },
  {
    "id": 7,
    "section": "I",
    "question": "Cho hình chóp  có đáy là hình thang, // và . Lấy thuộc cạnh ,  thuộc cạnh  sao cho . Khẳng định nào dưới đây đúng?",
    "explanation": "Vì  nên đường thẳng  // . Mà ,  nên  song song với mặt phẳng .",
    "options": [
      "Đường thẳng  song song với mặt phẳng",
      "Đường thẳng  cắt đường thẳng",
      "Đường thẳng  song song với mặt phẳng",
      "Đường thẳng  song song với mặt phẳng"
    ],
    "answer": 2,
    "images": [],
    "sol_images": []
  },
  {
    "id": 8,
    "section": "I",
    "question": "Nếu  thì  bằng bao nhiêu?",
    "explanation": "Ta có .",
    "options": [
      "",
      "",
      "",
      ""
    ],
    "answer": 0,
    "images": [],
    "sol_images": []
  },
  {
    "id": 9,
    "section": "I",
    "question": "Cho hình chóp , có đáy  là hình bình hành tâm . Tam giác  đều cạnh bằng . Khi đó  bằng:",
    "explanation": "Vì tam giác  đều cạnh bằng  nên .\nDo đó",
    "options": [
      "",
      "",
      "",
      ""
    ],
    "answer": 3,
    "images": [],
    "sol_images": []
  },
  {
    "id": 10,
    "section": "I",
    "question": "Cho hình phẳng  được giới hạn bởi đồ thị của hàm số  và đồ thị của hàm số  (tham khảo hình vẽ). Thể tích của khối tròn xoay thu được khi quay  quanh trục  bằng",
    "explanation": "",
    "options": [
      "",
      "",
      "",
      ""
    ],
    "answer": 1,
    "images": [],
    "sol_images": []
  },
  {
    "id": 11,
    "section": "I",
    "question": "Trong không gian tọa độ , mặt phẳng  vuông góc với mặt phẳng nào dưới đây?",
    "explanation": "",
    "options": [
      "",
      "",
      "",
      ""
    ],
    "answer": 0,
    "images": [],
    "sol_images": []
  },
  {
    "id": 12,
    "section": "I",
    "question": "Trong không gian với hệ toạ độ , khoảng cách từ điểm  đến mặt phẳng  bằng",
    "explanation": "",
    "options": [
      "4",
      "5",
      "3",
      "2"
    ],
    "answer": 3,
    "images": [],
    "sol_images": []
  },
  {
    "id": 13,
    "section": "II",
    "question": "Bạn Nam chạy bộ trong 2 giờ, vận tốc  phụ thuộc vào thời gian  có đồ thị là một phần của đường Parabol với đỉnh  và trục đối xứng song song với trục tung  như hình vẽ. Vận tốc chạy bộ của bạn Nam trong giờ thứ tăng dần. Vận tốc lớn nhất trong 2 giờ chạy của bạn Nam là . Gia tốc chạy bộ của bạn Nam tại thời điểm giờ là . Quãng đường bạn Nam chạy được trong 1 giờ 30 phút kể từ lúc bắt đầu chạy là  (kết quả làm tròn đến 2 chữ số thập phân).",
    "explanation": "a) Từ đồ thị ta thấy: Vận tốc chạy bộ của bạn Nam trong khoảng  giờ  đầu tăng dần và  giờ sau giảm dần.\nVậy vận tốc chạy bộ của bạn Nam trong trong giờ thứ giảm dần.\nc) Đồ thị  đi qua gốc tọa độ nên  có dạng .\nĐồ thị  có đỉnh là  nên\nGia tốc chạy bộ của bạn Nam tại thời điểm   là :\nd) Ta có 1 giờ 30 phút = 1,5 giờ .\nDo đó, quãng đường bạn Nam chạy được trong 1 giờ 30 phút kể từ lúc bắt đầu chạy là\n.",
    "tfStatements": [],
    "answer": {
      "type": "tf",
      "vals": [
        "S",
        "Đ",
        "S",
        "S"
      ]
    },
    "images": [],
    "sol_images": []
  },
  {
    "id": 14,
    "section": "II",
    "question": "Cho hàm số Tập xác định của hàm số đã cho là D=R\\{-\\frac{1}{2}}. Phương trình  có hai nghiệm nguyên dương phân biệt. Hàm số đã cho có hai điểm cực trị và hai điểm cực trị này nằm về hai phía của trục tung Khi đồ thị hàm số đã cho có hai điểm cực trị thì đường thẳng đi qua hai điểm cực trị của đồ thị hàm số có phương trình",
    "explanation": "a) Tập xác định D=R\\{-\\frac{1}{2}}.\nb) , .\nc) Đồ thị hàm số có hai điểm cực trị là  và  và hai điểm cực trị này nằm về hai phía của trục tung\nd) Phương trình đường thẳng qua hai điểm cực trị  của đồ thị hàm số đã cho là: .",
    "tfStatements": [],
    "answer": {
      "type": "tf",
      "vals": [
        "Đ",
        "S",
        "Đ",
        "Đ"
      ]
    },
    "images": [],
    "sol_images": []
  },
  {
    "id": 15,
    "section": "II",
    "question": "Thầy Nam muốn xây một ngôi nhà có kích thước như hình 1. Ngôi nhà được gắn trong hệ trục tọa độ  như hình 2 (đơn vị: mét), trong đó nền nhà, bốn bức tường là hình chữ nhật và hai mái nhà là hai hình chữ nhật bằng nhau. \\vec{OP}=(4;0;4,7) Thầy Nam muốn treo bóng đèn tại trung điểm cạnh . Tọa độ vị trí bóng đèn là . Hai mái nhà hợp nhau một góc bằng  (làm tròn kết quả đến hàng phần mười của độ).",
    "explanation": "Từ hình vẽ, ta có kích thước ngôi nhà như sau:\nTọa độ các điểm là :\n.\na)\nb)\nc) Tọa độ trung điểm cạnh  là\nd) góc hợp bởi hai mái nhà là góc hai mặt phẳng  và (  hay góc\nTa có: .\nSuy ra cos\\vec{EPF}=cos(\\vec{PE},\\vec{PF})=\\frac{\\vec{PE}⋅\\vec{PF}}{|\\vec{PE}|⋅|\\vec{PF}|}=\\frac{(-4).(4)+0.0+(-1,2).(-1,2)}{(-4)^{2}+0^{2}+(-1,2)^{2}⋅4^{2}+0^{2}+(-1,2)^{2}}=-\\frac{91}{109}.\n⇒\\vec{EPF}≈146,6^{0}. Vậy hai mái nhà hợp nhau một góc bằng .",
    "tfStatements": [],
    "answer": {
      "type": "tf",
      "vals": [
        "Đ",
        "Đ",
        "Đ",
        "S"
      ]
    },
    "images": [],
    "sol_images": []
  },
  {
    "id": 16,
    "section": "II",
    "question": "Trong một cuộc khảo sát tình trạng công việc trên  người chỉ có bằng tốt nghiệp THPT tại một địa phương, người ta thu được số liệu như bảng dưới đây Chọn ngẫu nhiên một người trong nhóm này. Khi đó Xác suất để chọn được một nam là . Xác suất để chọn được một người có việc làm là . Tại địa phương này, nếu chỉ có bằng tốt nghiệp THPT thì tỉ lệ nữ thất nghiệp sẽ cao hơn nam. Khảo sát cho thấy xác suất để một người thất nghiệp khi người đó là nữ cao gấp 7 lần xác suất để một người thất nghiệp khi người đó là nam. Biết rằng đã chọn được một người có việc làm, xác suất để người này là nữ là .",
    "explanation": "a) Gọi  là biến cố:”Chọn được một người là nam”.\nTa có\nb) Gọi  là biến cố:”Chọn được một người có việc làm”.\nTa có\nc) Xác suất để một người thất nghiệp khi người đó là nữ cao gấp  lần xác suất để một người thất nghiệp khi người đó là nam.\nd) Gọi  là biến cố:”Chọn được một người là nữ”.\nGọi  là biến cố:”Chọn được một người có việc làm”.\nTa tính\nTa có",
    "tfStatements": [],
    "answer": {
      "type": "tf",
      "vals": [
        "Đ",
        "Đ",
        "S",
        "Đ"
      ]
    },
    "images": [],
    "sol_images": []
  },
  {
    "id": 17,
    "section": "III",
    "question": "Để trang trí một bảng gỗ hình chữ nhật  có chiều dài  và chiều rộng , người ta thiết kế một logo là hình phẳng giới hạn bởi nửa đường tròn đường kính tiếp xúc với , hai đường cong  là một phần của các đường parabol có trục đối xứng lần lượt là  với  là trung điểm của (tham khảo hình vẽ). Phần logo được sơn màu xanh với chi phí  đồng/  và phần còn lại của bảng gỗ được sơn màu trắng với chi phí  đồng/ . Hỏi cần bỏ ra bao nhiêu nghìn đồng để trang trí bảng gỗ trên (kết quả làm tròn đến hàng đơn vị)?",
    "explanation": "Diện tích hình chữ nhật  bằng .\nDiện tích của nửa đường tròn đường kính  bằng .\nTa xác định phương trình của parabol.\nChọn hệ trục tọa độ  như hình vẽ:\nGọi phương trình parabol có đỉnh  là , theo bài ra ta có:\nVậy .\nDiện tích của hình phẳng giới hạn bởi , trục hoành và hai đường thẳng  bằng: .\nDo tính đối xứng nên hình phẳng giới hạn bởi parabol có đỉnh , trục đối xứng , trục hoành và hai đường thẳng  có diện tích bằng .\nTổng diện tích phần bảng gỗ sơn màu xanh là: .\nDiện tích của phần bảng gỗ sơn màu trắng là: .\nChi phí cần bỏ ra là:  (nghìn đồng).",
    "answer": {
      "type": "short",
      "val": "1923",
      "rest": ""
    },
    "images": [],
    "sol_images": []
  },
  {
    "id": 18,
    "section": "III",
    "question": "Một công ty chuyên sản xuất dụng cụ thể thao nhận được đơn đặt hàng sản xuất  quả bóng rổ. Công ty có một số máy móc, mỗi máy có khả năng sản xuất  quả bóng rổ trong một giờ. Chi phí thiết lập mỗi máy là  nghìn đồng. Sau khi thiết lập, quá trình sản xuất sẽ diễn ra hoàn toàn tự động và chỉ cần có người giám sát. Chi phí trả cho người giám sát là  nghìn đồng mỗi giờ. Số máy móc công ty cần sử dụng để chi phí hoạt động đạt mức thấp nhất là bao nhiêu?",
    "explanation": "Gọi số máy móc công ty cần sử dụng để sản xuất  quả bóng rổ là:  ().\nChi phí thiết lập mỗi máy là  nghìn đồng nên chi phí thiết lập  máy là nghìn đồng.\nDo mỗi máy sản xuất trong 1h được  quả bóng rổ nên  máy trong 1h sẽ sản xuất được  quả.\nĐể sản xuất  quả bóng thì cần (h).\nChi phí trả cho người giám sát là  nghìn đồng 1h nên chi phí cần trả cho người giám sát là: nghìn đồng.\nTổng chi phí phải trả đề sản xuất  quả bóng là:\nTa có:\nBBT:\nTừ BBT ta có đạt giá trị bé nhất tại .\nVậy số máy móc công ty cần sử dụng để chi phí hoạt động đạt mức thấp nhất là 15.",
    "answer": {
      "type": "short",
      "val": "15",
      "rest": ""
    },
    "images": [],
    "sol_images": []
  },
  {
    "id": 19,
    "section": "III",
    "question": "Cho hình lăng trụ đứng  có đáy  là tam giác vuông tại ,  và . Tính khoảng cách từ điểm  đến mặt phẳng .",
    "explanation": "Kẻ; .\nTa có: .\nMà .\nDo đó khoảng cách từ điểm  đến mặt phẳng  bằng .\nXét tam giác  vuông tại  ta có .\nXét tam giác  vuông tại  ta có .",
    "answer": {
      "type": "short",
      "val": "3",
      "rest": ""
    },
    "images": [],
    "sol_images": []
  },
  {
    "id": 20,
    "section": "III",
    "question": "Có hai hộp đựng các viên bi: Hộp  có 6 bi đỏ và 4 bi xanh, hộp  có 5 bi đỏ và 5 bi xanh (các viên bi có cùng kích thước và khối lượng). Bạn Minh lấy ngẫu nhiên một viên bi từ hộp , bạn Như lấy ngẫu nhiên một viên bi từ hộp . Biết rằng có viên bi đỏ được lấy ra, khi đó xác suất để bạn Như lấy được viên bi đỏ là ( tối giản). Tính",
    "explanation": "Gọi  là biến cố: “Bạn Như lấy được viên bi đỏ”.\nGọi  là biến cố: “Có viên bi đỏ trong hai viên được lấy ra”.\nTa cần tìm xác suất .\nTheo công thức xác suất có điều kiện:\nTa có  (số cách lấy hai viên bi trong đó có ít nhất 1 bi đỏ) và  (số cách lấy hai viên bi trong đó viên bi của bạn Như là bi đỏ).\nThay số, ta được\nVậy",
    "answer": {
      "type": "short",
      "val": "-3",
      "rest": ""
    },
    "images": [],
    "sol_images": []
  },
  {
    "id": 21,
    "section": "III",
    "question": "Trong không gian với hệ trục , giả sử mặt đất trùng với mặt phẳng . Một bóng đèn trang trí dạng khối cầu có tâm  và bán kính  được treo cố định lên trần nhà (đơn vị trên mỗi trục tọa độ là ). Một con kiến bò tùy ý trên bóng đèn và một con kiến khác bò tùy ý trên mặt đất, giả sử vectơ tạo bởi tọa độ vị trí của 2 con kiến luôn cùng phương với đường thẳng (coi mỗi con kiến là một điểm). Biết lúc 2 con kiến gần nhau nhất có khoảng cách bằng . Bán khối cầu có độ dài bao nhiêu .",
    "explanation": "+ Gọi  là góc tạo bởi  và mặt  suy ra: .\nGọi  là hình chiếu của  lên , gọi  là giao điểm của  và khối cầu .  là giao điểm của đường thẳng qua  và song song  với .\nVì  là độ dài ngắn nhất giữa khối cầu  và  nên lúc 2 con kiến gần nhau nhất thì một con ở  và một con ở .\n+ Theo giả thiết: , suy ra: .\nVậy",
    "answer": {
      "type": "short",
      "val": "20",
      "rest": ""
    },
    "images": [],
    "sol_images": []
  },
  {
    "id": 22,
    "section": "III",
    "question": "Một mô hình trang trí có dạng là hình lập phương , cạnh bằng m (như hình vẽ). Người ta cần nối một đường dây điện đi từ điểm  (là trung điểm của ) đi qua điểm  thuộc cạnh , đi tiếp qua điểm  thuộc cạnh  rồi tới điểm . Biết độ dài đoạn dây điện bằng m. Tính độ dài đoạn (làm tròn kết quả đến hàng phần trăm)",
    "explanation": "Trải hình lập phương ra trên mặt phẳng ta được hình vẽ\nTa có  và .\nTa thấy\nSuy ra  thẳng hàng\nXét tam giác , có\n+ tan\\vec{D^{'}B^{'}E}=\\frac{15}{20}=\\frac{A^{'}N}{10} và .\n+  và .\nVậy (m)\nChị Hiền Mai chúc các em làm bài thật tốt!!\n---------------- HẾT----------------",
    "answer": {
      "type": "short",
      "val": "4,17",
      "rest": ""
    },
    "images": [],
    "sol_images": []
  }
];
