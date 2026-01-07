(function() {
    'use strict';

    // === 1. 단어 데이터 (샘플: 약 600개) ===
    // 실제로는 이 배열에 5만개 정도 넣어도 거뜬합니다.
    const WORD_LIST = [
        "가구", "가난", "가노라", "가누다", "가늘다", "가능", "가다", "가두다", "가라앉다", "가려움", "가로", "가루", "가르치다", "가리다", "가마", "가면", "가뭄", "가방", "가볍다", "가사", "가상", "가수", "가스", "가슴", "가위", "가을", "가이드", "가장", "가족", "가지", "가치", "각국", "각오", "각자",
        "나그네", "나라", "나머지", "나무", "나비", "나서다", "나아가다", "나오다", "나이", "나중", "낚시", "날개", "날씨", "날아가다", "날짜", "남녀", "남다", "남매", "남산", "남자", "남쪽", "남편", "낫다", "낭비", "낮다", "낯설다", "낳다", "내용", "내일", "냄새", "냉장고", "너구리", "넓다", "넘다", "네모", "넥타이", "노래", "노력", "노인", "노트", "녹다", "논리", "놀다", "놀이", "농구", "농담", "농사", "높다", "놓다", "뇌물", "누나", "누르다", "눈물", "느낌", "늑대", "능력", "늦다",
        "다녀오다", "다니다", "다르다", "다리", "다만", "다방", "다섯", "다시", "다음", "다이어트", "다치다", "다행", "닦다", "단구", "단어", "단점", "단체", "닫다", "달걀", "달력", "달리다", "닭고기", "담배", "답장", "당근", "당신", "대구", "대기", "대답", "대로", "대리", "대문", "대부분", "대신", "대왕", "대장", "대전", "대중", "대학", "대한민국", "대화", "대회", "더위", "덕분", "던지다", "덥다", "도구", "도덕", "도둑", "도서관", "도시", "도와주다", "도착", "도표", "독서", "독일", "돈가스", "돌다", "돌멩이", "돌아가다", "돕다", "동물", "동생", "동시", "동안", "동전", "동쪽", "동해", "돼지", "되다", "두부", "두통", "뒤쪽", "드라마", "드리다", "듣다", "들다", "들르다", "등산", "디자인", "따뜻하다", "딸기", "땀", "땅", "때", "떠나다", "떡", "떨어지다", "또", "똑똑하다", "똥", "뚜껑", "뛰다", "뜨겁다", "뜻",
        "라면", "라디오", "라켓", "란제리", "랄랄라", "람보", "랍스터", "랑데부", "래시피", "랜턴", "램프", "랫유", "러시아", "럭비", "런던", "레몬", "레슨", "레이저", "레코드", "렌즈", "로마", "로봇", "로켓", "록", "론", "롱다리", "뢰", "루비", "루트", "룰", "리듬", "리본", "리스트", "리우", "리터", "링", "링크",
        "마나", "마늘", "마당", "마르다", "마리", "마시다", "마을", "마음", "마지막", "마치", "마침내", "마트", "마흔", "막다", "막히다", "만나다", "만두", "만들다", "만화", "많다", "말다", "말리다", "말씀", "맛있다", "망원경", "맞다", "맞추다", "맡다", "매다", "매력", "매일", "매주", "맥주", "맵다", "머리", "먹다", "먼저", "멀다", "멈추다", "멋있다", "메뉴", "메모", "메시지", "며칠", "면도", "멸치", "명절", "몇", "모기", "모두", "모래", "모레", "모르다", "모습", "모양", "모이다", "모자", "목걸이", "목소리", "목요일", "목욕", "목적", "몸", "못하다", "몽골", "무게", "무궁화", "무겁다", "무너지다", "무늬", "무릎", "무섭다", "무슨", "무엇", "무용", "무지개", "묵다", "묶다", "문", "문구", "문제", "문화", "묻다", "물건", "물고기", "물론", "물음", "미국", "미래", "미리", "미술", "미안하다", "미용실", "미워하다", "미인", "미치다", "미터", "민속", "믿다", "밀가루", "밀다",
        "바꾸다", "바나나", "바다", "바닥", "바람", "바로", "바르다", "바쁘다", "바지", "바퀴", "박물관", "박수", "밖", "반대", "반드시", "반찬", "받다", "발견", "발음", "발표", "밝다", "밤", "밥", "방귀", "방문", "방법", "방송", "방학", "방향", "배고프다", "배구", "배달", "배우", "배추", "백화점", "뱀", "버섯", "버스", "번역", "번호", "벌다", "벌써", "벗다", "벚꽃", "베개", "베트남", "벽", "변호사", "별", "병", "병원", "보내다", "보다", "보도", "보람", "보리", "보석", "보이다", "보통", "복사", "복습", "복잡하다", "볶음밥", "볼펜", "봄", "봉투", "뵈다", "부드럽다", "부모", "부부", "부산", "부엌", "부자", "부장", "부정", "부족", "부탁", "북쪽", "분위기", "불고기", "불다", "불편", "붉다", "붓다", "붙이다", "브라질", "블라우스", "비", "비누", "비디오", "비밀", "비빔밥", "비슷하다", "비싸다", "비행기", "빌리다", "빗", "빙수", "빛", "빠르다", "빨래", "빨리", "빵", "빼다", "뽑다", "뿌리",
        "사과", "사귀다", "사고", "사람", "사랑", "사무실", "사실", "사업", "사용", "사월", "사이", "사장", "사전", "사진", "사탕", "사회", "산", "산책", "살다", "살리다", "삼겹살", "삼계탕", "상", "상자", "상처", "상품", "새", "새로", "새벽", "색", "샌드위치", "생각", "생선", "생일", "생활", "샤워", "서다", "서로", "서류", "서비스", "서울", "서점", "서쪽", "선물", "선생", "선수", "선택", "설거지", "설날", "설렁탕", "설명", "설탕", "섬", "성격", "성공", "성적", "세계", "세수", "세탁", "센터", "소개", "소고기", "소금", "소리", "소설", "소식", "소파", "소포", "소풍", "소화", "속", "손", "손가락", "손수건", "손님", "송이", "쇼핑", "수고", "수박", "수술", "수업", "수영", "수저", "수첩", "수학", "숙제", "순서", "숟가락", "술", "쉬다", "슈퍼마켓", "스웨터", "스카프", "스키", "스트레스", "스포츠", "슬프다", "습관", "승리", "시", "시간", "시계", "시골", "시끄럽다", "시다", "시민", "시원하다", "시작", "시장", "시청", "시험", "식구", "식당", "식사", "식탁", "신다", "신문", "신발", "신부", "신용카드", "신청", "실례", "실수", "실패", "싫다", "심하다", "싱겁다", "싶다", "싸다", "싸우다", "쌀", "씻다", "쓰다", "쓰레기", "씨", "씩",
        "아가씨", "아기", "아내", "아니요", "아들", "아래", "아름답다", "아무리", "아버지", "아이스크림", "아저씨", "아줌마", "아주", "아직", "아침", "아파트", "아프다", "아홉", "악기", "안", "안경", "안내", "안녕하다", "안다", "앉다", "알다", "알맞다", "앞", "애", "액자", "야구", "야채", "약", "약국", "약속", "얇다", "양말", "양복", "양식", "양파", "얘기", "어깨", "어둡다", "어디", "어떤", "어렵다", "어른", "어리다", "어머니", "어제", "억", "언니", "언제", "얼굴", "얼마", "엄마", "없다", "에어컨", "엘리베이터", "여권", "여기", "여덟", "여동생", "여러", "여름", "여보세요", "여자", "여행", "역", "역사", "연결", "연극", "연락", "연세", "연습", "연예인", "연필", "연휴", "열", "열다", "열쇠", "열심히", "열차", "엽서", "영국", "영상", "영어", "영화", "옆", "예", "예쁘다", "예습", "예약", "옛날", "오늘", "오다", "오래", "오랜만", "오렌지", "오르다", "오른쪽", "오빠", "오십", "오월", "오이", "오전", "오후", "올라가다", "올해", "옷", "옷장", "와이셔츠", "왜", "외국", "외모", "외출", "왼쪽", "요금", "요리", "요일", "요즘", "우리", "우산", "우유", "우체국", "운동", "운전", "울다", "울산", "움직이다", "웃다", "원", "원피스", "월급", "월요일", "위", "위치", "위험", "유리", "유명하다", "유학", "유행", "육", "윷놀이", "은행", "음료수", "음식", "음악", "의미", "의사", "의자", "이", "이것", "이기다", "이날", "이따가", "이름", "이모", "이불", "이사", "이상", "이야기", "이용", "이유", "이전", "이제", "이틀", "이해", "인기", "인도", "인사", "인삼", "인상", "인생", "인터넷", "인형", "일", "일곱", "일기", "일본", "일어나다", "일요일", "일주일", "일찍", "읽다", "잃어버리다", "입", "입구", "입다", "입원", "잇다", "있다", "잊다",
        "자", "자다", "자동차", "자라다", "자리", "자신", "자연", "자유", "자장면", "자주", "작년", "작다", "작업", "작은아버지", "잔", "잔치", "잘", "잘못", "잘생기다", "잠", "잠깐", "잡다", "잡지", "장", "장갑", "장미", "장소", "장점", "재료", "재미있다", "재산", "저", "저기", "저녁", "저희", "적", "적다", "전", "전공", "전기", "전망", "전문", "전세", "전시회", "전철", "전통", "전화", "절", "절대", "젊다", "점", "점심", "점원", "접시", "젓가락", "정", "정다", "정도", "정류장", "정리", "정말", "정문", "정보", "정식", "정신", "정오", "정원", "정직", "정치", "젖다", "제", "제공", "제목", "제일", "제주도", "조", "조금", "조사", "조심", "조용하다", "조카", "졸업", "좀", "좁다", "종교", "종류", "종이", "좋다", "좋아하다", "죄송하다", "주", "주다", "주로", "주말", "주머니", "주문", "주민", "주소", "주스", "주위", "주인", "주일", "주차", "주황색", "죽", "죽다", "준비", "줄", "줄다", "중", "중국", "중심", "중요", "중학교", "즐겁다", "즐기다", "증세", "지갑", "지구", "지난달", "지난번", "지난주", "지내다", "지도", "지루하다", "지방", "지우개", "지하", "지하철", "직업", "직원", "직장", "직접", "진담", "진심", "진짜", "질문", "짐", "집", "집들이", "짜다", "짧다", "쪽", "찍다",
        "차", "차다", "차이", "착하다", "참", "참다", "참석", "참외", "창문", "찾다", "채소", "책", "책상", "책임", "처음", "천", "천천히", "철", "첫", "청바지", "청소", "청소년", "청첩장", "체온", "체육", "체험", "쳐다보다", "초", "초대", "초등학교", "초록색", "초콜릿", "최고", "최근", "최저", "추석", "추억", "축구", "축제", "축하", "출구", "출근", "출발", "출장", "춤", "춥다", "취미", "취직", "층", "치과", "치다", "치료", "치마", "친구", "친절", "친척", "칠", "칠판", "침대", "칫솔",
        "카드", "카레", "카메라", "카페", "칼", "캐나다", "커피", "컴퓨터", "컵", "케이크", "켜다", "코", "코트", "콜라", "콧물", "콩", "크기", "크다", "크리스마스", "큰아버지", "키", "키로",
        "타다", "탁구", "탈", "탑", "태권도", "태어나다", "태풍", "택시", "턱", "털", "테니스", "테이블", "텔레비전", "토끼", "토마토", "토요일", "통", "통장", "통화", "퇴근", "특별", "특히", "틀리다", "티셔츠", "팀",
        "파", "파란색", "파랑", "파티", "팔", "팔다", "팔월", "패션", "퍼센트", "펴다", "편리", "편지", "편집", "평일", "포도", "포장", "표", "표정", "표현", "푹", "풀", "풀다", "프랑스", "프로그램", "피", "피곤하다", "피다", "피아노", "피우다", "피자", "필요",
        "하나", "하늘", "하다", "하루", "하얀색", "하얗다", "하여튼", "학교", "학기", "학년", "학생", "학원", "한", "한강", "한국", "한글", "한복", "한식", "한잔", "한참", "할머니", "할아버지", "할인", "함께", "항상", "해", "해결", "해외", "핸드폰", "햄버거", "햇빛", "행동", "행복", "행사", "허리", "현금", "현재", "형", "형제", "혜택", "호", "호랑이", "호수", "호주", "호텔", "혹시", "혼자", "홍차", "화", "화가", "화나다", "화요일", "화장", "화장실", "확인", "환영", "환자", "환전", "활동", "회사", "회의", "횡단보도", "효과", "후", "후배", "훌륭하다", "훔치다", "훨씬", "휴가", "휴대폰", "휴식", "휴일", "휴지", "휴지통", "흐리다", "흔들다", "흘리다", "흙", "흡연", "희망", "흰색", "힘", "힘들다"
    ];

    // 두음법칙 맵 (간단 버전)
    const DUEUM_MAP = {
        '라': '나', '락': '낙', '란': '난', '랄': '날', '람': '남', '랍': '납', '랑': '낭', '래': '내', '랭': '냉', '략': '약', '량': '양', '려': '여', '녀': '여', '력': '역', '련': '연', '렬': '열', '렴': '염', '렵': '엽', '령': '영', '녕': '영', '례': '예', '로': '노', '록': '녹', '론': '논', '롱': '농', '뢰': '뇌', '료': '요', '뇨': '요', '룡': '용', '루': '누', '류': '유', '뉴': '유', '륙': '육', '륜': '윤', '률': '율', '륭': '융', '르': '느', '륵': '늑', '름': '늠', '릉': '능', '리': '이', '니': '이', '린': '인', '림': '임', '님': '임', '립': '입'
    };

    // 상태 변수
    let container = null;
    let callbacks = {};
    let gameHistory = new Set();
    let lastWord = "";
    let playerScore = 0;
    let timer = null;
    let timeLeft = 100;

    // DOM 요소
    let wrapper, chatArea, input, sendBtn, timerBar, scoreDisplay;

    function createUI() {
        // 기존 내용 제거
        if (container) {
            container.innerHTML = '';
        } else {
            return;
        }

        wrapper = document.createElement('div');
        wrapper.className = 'wc-wrapper';

        // 헤더
        const header = document.createElement('div');
        header.className = 'wc-header';
        header.innerHTML = `
            <div class="wc-title">🗣️ 무한 끝말잇기</div>
            <div class="wc-score">SCORE: <span id="wc-score-val">0</span></div>
        `;
        wrapper.appendChild(header);

        // 타이머 바
        timerBar = document.createElement('div');
        timerBar.className = 'timer-bar';
        wrapper.appendChild(timerBar);

        // 채팅 영역
        chatArea = document.createElement('div');
        chatArea.className = 'wc-chat-area';
        wrapper.appendChild(chatArea);

        // 입력 영역
        const inputArea = document.createElement('div');
        inputArea.className = 'wc-input-area';
        
        input = document.createElement('input');
        input.className = 'wc-input';
        input.type = 'text';
        input.placeholder = '단어를 입력하세요...';
        input.onkeypress = (e) => { if(e.key === 'Enter') handleInput(); };

        sendBtn = document.createElement('button');
        sendBtn.className = 'wc-btn';
        sendBtn.innerText = '전송';
        sendBtn.onclick = handleInput;

        inputArea.appendChild(input);
        inputArea.appendChild(sendBtn);
        wrapper.appendChild(inputArea);

        container.appendChild(wrapper);
        scoreDisplay = document.getElementById('wc-score-val');
    }

    // === 게임 로직 ===

    function startGame() {
        gameHistory.clear();
        playerScore = 0;
        updateScore(0);
        chatArea.innerHTML = '';
        
        // 컴퓨터가 먼저 시작
        const startWords = ["기차", "사과", "노래", "하늘", "바다"];
        const firstWord = startWords[Math.floor(Math.random() * startWords.length)];
        
        addMessage("system", "게임이 시작되었습니다! 컴퓨터가 먼저 시작합니다.");
        computerTurn(firstWord, true);
    }

    function handleInput() {
        const word = input.value.trim();
        if (!word) return;

        // 1. 유효성 검사
        const error = checkValidity(word);
        if (error) {
            addMessage("system", `❌ ${error}`);
            input.value = '';
            // 틀려도 게임오버는 아니고 경고만 줌 (관대함)
            return;
        }

        // 2. 플레이어 단어 등록
        addMessage("user", word);
        gameHistory.add(word);
        lastWord = word;
        input.value = '';
        input.focus();
        resetTimer(); // 턴 넘길 때 타이머 리셋

        // 3. 점수 획득
        updateScore(word.length * 10);

        // 4. 컴퓨터 턴
        input.disabled = true;
        sendBtn.disabled = true;
        
        setTimeout(() => {
            const comWord = findWord(word);
            if (comWord) {
                computerTurn(comWord);
                input.disabled = false;
                sendBtn.disabled = false;
                input.focus();
            } else {
                gameOver(true); // 플레이어 승리
            }
        }, Math.random() * 500 + 500); // 0.5~1초 딜레이
    }

    function computerTurn(word, isFirst = false) {
        addMessage("bot", word);
        // 단어 뜻 찾기 (가짜 데이터로 흉내, 실제 API 연동 가능)
        // const def = getDefinition(word); 
        // if(def) addMessage("def", def);

        gameHistory.add(word);
        lastWord = word;
        resetTimer();
    }

    // 단어 유효성 검사
    function checkValidity(word) {
        // 한글만 허용
        if (!/^[가-힣]+$/.test(word)) return "한글만 입력해주세요.";
        if (word.length < 2) return "두 글자 이상 입력해주세요.";
        if (gameHistory.has(word)) return "이미 사용한 단어입니다.";
        
        // 끝말잇기 규칙 확인
        if (lastWord) {
            const lastChar = lastWord[lastWord.length - 1];
            const firstChar = word[0];
            
            // 두음법칙 적용된 예상 글자들
            const possibleStarts = [lastChar];
            if (DUEUM_MAP[lastChar]) possibleStarts.push(DUEUM_MAP[lastChar]);

            if (!possibleStarts.includes(firstChar)) {
                return `'${possibleStarts.join("' 또는 '")}'(으)로 시작해야 합니다.`;
            }
        }

        // 사전에 있는지 확인
        if (!WORD_LIST.includes(word)) {
            // 게임의 재미를 위해 '사전에 없는 단어'도 
            // 한글 구조상 말이 되면 받아주는 '오픈 모드'라면 이 체크를 끌 수 있습니다.
            // 하지만 여기선 엄격하게 체크합니다.
            return "사전에 없는 단어입니다. (혹은 제가 모르는 단어네요 😅)";
        }

        return null;
    }

    // 컴퓨터가 이을 단어 찾기
    function findWord(prevWord) {
        const lastChar = prevWord[prevWord.length - 1];
        const targets = [lastChar];
        if (DUEUM_MAP[lastChar]) targets.push(DUEUM_MAP[lastChar]);

        // 가능한 단어 필터링
        const candidates = WORD_LIST.filter(w => {
            if (gameHistory.has(w)) return false;
            return targets.includes(w[0]);
        });

        if (candidates.length === 0) return null;
        
        // 랜덤 선택
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    function addMessage(type, text) {
        const el = document.createElement('div');
        el.className = `msg msg-${type}`;
        el.innerText = text;
        chatArea.appendChild(el);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function updateScore(points) {
        playerScore += points;
        if (scoreDisplay) {
            scoreDisplay.innerText = playerScore;
        }
        // 콜백 호출
        if (callbacks.onScoreUpdate) {
            callbacks.onScoreUpdate(playerScore);
        }
    }

    // 타이머 로직
    function resetTimer() {
        if (timer) clearInterval(timer);
        timeLeft = 100;
        timerBar.style.width = '100%';
        timerBar.style.background = '#ff4757';

        timer = setInterval(() => {
            timeLeft -= 0.5; // 속도 조절
            timerBar.style.width = `${timeLeft}%`;
            
            if (timeLeft < 30) timerBar.style.background = '#e84118';
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                gameOver(false); // 시간 초과 패배
            }
        }, 50);
    }

    function gameOver(win) {
        input.disabled = true;
        sendBtn.disabled = true;
        if (timer) clearInterval(timer);

        if (win) {
            addMessage("system", "🎉 축하합니다! 당신의 승리입니다! 🎉");
            addMessage("bot", "제가 졌네요.. 대단한 어휘력입니다!");
        } else {
            addMessage("system", "⏰ 시간 초과! (혹은 컴퓨터가 이겼습니다)");
            addMessage("bot", `게임 오버! 최종 점수: ${playerScore}점`);
        }

        // 재시작 버튼
        const restartBtn = document.createElement('button');
        restartBtn.className = 'wc-btn';
        restartBtn.style.margin = '10px auto';
        restartBtn.style.display = 'block';
        restartBtn.innerText = '다시 하기';
        restartBtn.onclick = () => {
            restartBtn.remove();
            input.disabled = false;
            sendBtn.disabled = false;
            startGame();
        };
        chatArea.appendChild(restartBtn);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    // === Game 객체 (GameShell 인터페이스) ===
    const Game = {
        init: function(gameContainer, options = {}) {
            container = gameContainer;
            callbacks = options || {};

            // 기존 내용 제거
            container.innerHTML = '';

            createUI();
            startGame();
        },

        render: function() {
            // 필요시 재렌더링
            if (container && wrapper) {
                // UI는 이미 생성되어 있음
            }
        },

        reset: function() {
            // 게임 리셋
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
            startGame();
        },

        setMuted: function(muted) {
            // 사운드 처리 (필요시)
        }
    };

    // Export
    if (typeof window !== 'undefined') {
        window.Game = Game;
    }

})();