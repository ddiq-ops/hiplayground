(function() {
    'use strict';

    let container = null;
    let callbacks = {};

    // === 데이터 및 로직 ===
    let currentLang = 'ko';

    const UI_TEXTS = {
        ko: {
            title: "오늘의 운세",
            subtitle: "별들이 속삭이는 당신의 운명을 들어보세요.",
            labelName: "이름",
            labelDate: "생년월일",
            labelYear: "연도",
            labelMonth: "월",
            labelDay: "일",
            placeholderName: "이름을 입력해주세요",
            placeholderYear: "연도",
            placeholderMonth: "월",
            placeholderDay: "일",
            btnCheck: "운세 확인하기",
            luckScore: "오늘의 행운 지수",
            points: "점",
            generalLuck: "총운",
            loveLuck: "애정운",
            moneyLuck: "금전운",
            luckyColor: "행운의 색상",
            luckyNumber: "행운의 숫자",
            btnRetry: "다른 사람 운세 보기",
            titleSuffix: "님의 하루",
            alertInput: "이름과 생년월일을 모두 입력해주세요."
        },
        en: {
            title: "Daily Horoscope",
            subtitle: "Listen to the destiny the stars whisper to you.",
            labelName: "Name",
            labelDate: "Birth Date",
            labelYear: "Year",
            labelMonth: "Month",
            labelDay: "Day",
            placeholderName: "Enter your name",
            placeholderYear: "Year",
            placeholderMonth: "Month",
            placeholderDay: "Day",
            btnCheck: "Check Fortune",
            luckScore: "Luck Score",
            points: "pts",
            generalLuck: "General",
            loveLuck: "Love",
            moneyLuck: "Money",
            luckyColor: "Lucky Color",
            luckyNumber: "Lucky Number",
            btnRetry: "Check Another",
            titleSuffix: "'s Day",
            alertInput: "Please enter both name and birth date."
        }
    };

    const ZODIAC_SIGNS = [
        { name: "염소자리", nameEn: "Capricorn", icon: "♑", start: "01-01", end: "01-19" },
        { name: "물병자리", nameEn: "Aquarius", icon: "♒", start: "01-20", end: "02-18" },
        { name: "물고기자리", nameEn: "Pisces", icon: "♓", start: "02-19", end: "03-20" },
        { name: "양자리", nameEn: "Aries", icon: "♈", start: "03-21", end: "04-19" },
        { name: "황소자리", nameEn: "Taurus", icon: "♉", start: "04-20", end: "05-20" },
        { name: "쌍둥이자리", nameEn: "Gemini", icon: "♊", start: "05-21", end: "06-21" },
        { name: "게자리", nameEn: "Cancer", icon: "♋", start: "06-22", end: "07-22" },
        { name: "사자자리", nameEn: "Leo", icon: "♌", start: "07-23", end: "08-22" },
        { name: "처녀자리", nameEn: "Virgo", icon: "♍", start: "08-23", end: "09-23" },
        { name: "천칭자리", nameEn: "Libra", icon: "♎", start: "09-24", end: "10-22" },
        { name: "전갈자리", nameEn: "Scorpio", icon: "♏", start: "10-23", end: "11-22" },
        { name: "사수자리", nameEn: "Sagittarius", icon: "♐", start: "11-23", end: "12-24" },
        { name: "염소자리", nameEn: "Capricorn", icon: "♑", start: "12-25", end: "12-31" }
    ];

    const FORTUNE_TEXTS = {
        general: {
            ko: [
                "마치 사막 한가운데서 오아시스를 발견한 듯, 예기치 못한 곳에서 달콤한 행운이 당신을 기다리고 있는 날입니다. 우연히 집어 든 책의 한 구절이나 무심코 지나친 거리의 풍경 속에서 인생을 바꿀 작은 힌트를 얻게 될지도 모릅니다. 오늘은 당신의 직감이 그 어느 때보다 날카롭게 빛나고 있으니, 마음속 나침반이 가리키는 방향을 믿고 과감하게 발걸음을 옮겨보세요.",
                "거친 파도가 지나가고 잔잔한 수면 위로 평화로운 햇살이 비치는 형국입니다. 그동안 당신을 괴롭히던 복잡한 문제들이 실타래 풀리듯 하나둘씩 해결의 실마리를 찾게 될 것입니다. 지금 당장 눈앞에 큰 성과가 보이지 않는다고 해서 조급해할 필요는 전혀 없습니다. 오늘은 잠시 숨을 고르며 재충전의 시간을 가지는 것이 오히려 내일 더 멀리 도약할 수 있는 원동력이 되어줄 테니까요.",
                "당신의 잠재되어 있던 능력이 화산처럼 폭발하여 주변 사람들에게 강력한 인상을 남기는 하루입니다. 오랫동안 준비해왔던 프로젝트나 마음속에만 담아두었던 아이디어가 있다면 오늘이야말로 세상 밖으로 꺼내놓을 최적의 타이밍입니다. 타인의 시선을 의식하기보다는 스스로에 대한 확신을 가지고 밀고 나간다면, 기대했던 것보다 훨씬 더 찬란한 결실을 맺을 수 있을 것입니다.",
                "돌다리도 두들겨 보고 건너라는 옛말이 오늘처럼 중요한 날은 없을 것입니다. 겉보기에는 화려하고 매혹적인 제안이 들어올 수 있으나, 그 이면에는 예상치 못한 함정이 숨어 있을지도 모릅니다. 중요한 결정을 내리기 전에는 반드시 신뢰할 수 있는 멘토나 동료와 상의하는 지혜가 필요합니다.",
                "마치 봄날의 따스한 바람처럼 기분 좋은 에너지가 온몸을 휘감는 하루입니다. 미뤄왔던 운동을 시작하거나 새로운 취미 생활에 도전해보기에 더할 나위 없이 완벽한 타이밍입니다. 당신의 긍정적인 기운은 주변 사람들에게도 전파되어, 가는 곳마다 웃음꽃이 피어나고 분위기를 주도하는 주인공이 될 것입니다.",
                "짙은 안개가 걷히고 선명한 풍경이 드러나듯, 혼란스러웠던 마음이 차분하게 정리되는 날입니다. 오늘은 복잡한 인간관계나 소음에서 잠시 벗어나 오롯이 혼자만의 시간을 가져보는 것을 강력히 추천합니다. 조용한 카페에서 사색에 잠기거나 일기를 쓰며 내면의 소리에 귀 기울인다면, 앞으로 나아가야 할 명확한 이정표를 발견하게 될 것입니다.",
                "예상치 못한 소나기를 만날 수도 있지만, 곧이어 더욱 찬란한 무지개가 뜨는 격입니다. 오전에는 계획대로 일이 풀리지 않아 다소 답답함을 느낄 수도 있겠지만, 오후가 될수록 상황은 당신에게 유리한 쪽으로 반전될 것입니다. 작은 실수에 연연하여 기죽지 말고 대범하게 넘기는 여유를 가진다면, 전화위복의 기회를 반드시 잡을 수 있습니다.",
                "당신의 성실함과 꾸준함이 드디어 빛을 발하여 주변의 인정을 받게 되는 보람찬 하루입니다. 묵묵히 뿌려두었던 노력의 씨앗들이 싹을 틔우기 시작하니, 지금 하고 있는 일에 대한 자부심을 가져도 좋습니다. 오늘은 요행을 바라기보다는 정공법으로 승부하는 것이 최상의 결과를 가져다줄 것입니다."
            ],
            en: [
                "Like discovering an oasis in the middle of a desert, sweet luck awaits you in unexpected places today. You might find a small hint that could change your life in a passage of a book you picked up by chance. Your intuition is shining sharper than ever today, so trust the direction your inner compass points to.",
                "It is a situation where rough waves pass and peaceful sunlight shines on the calm water surface. Complex problems that have been bothering you will find clues to solutions one by one. There is no need to be impatient just because you don't see immediate results right now.",
                "It is a day when your latent abilities explode like a volcano, leaving a strong impression on those around you. If there is a project you have been preparing for a long time, today is the perfect timing to bring it out to the world. Push forward with confidence.",
                "There will be no day as important as today to look before you leap. A seemingly flashy and fascinating proposal may come in, but an unexpected trap may be hidden behind it. Consult with a trusted mentor before making important decisions.",
                "It is a day when pleasant energy wraps around your whole body like a warm spring breeze. It is a perfect timing to start exercising that you have been putting off or challenge a new hobby. Your positive energy will spread to those around you.",
                "Like thick fog clearing and a clear landscape revealed, it is a day when your confused mind is calmly organized. Taking time alone today away from complicated relationships is strongly recommended.",
                "You may encounter an unexpected shower, but soon a more brilliant rainbow will rise. In the morning, you may feel somewhat frustrated, but the situation will turn in your favor in the afternoon. Do not be discouraged by small mistakes.",
                "It is a rewarding day when your sincerity and consistency finally shine. The seeds of effort you silently sowed are starting to sprout, so be proud of what you are doing now. Competing head-on will bring the best results."
            ]
        },
        love: {
            ko: [
                "마치 로맨틱 영화의 주인공이 된 것처럼, 가슴 설레는 운명적인 만남이 당신을 기다리고 있습니다. 평소에 가지 않던 길로 퇴근을 하거나 새로운 카페에 들러보는 작은 일탈이 뜻밖의 인연을 선물해 줄지도 모릅니다. 오늘만큼은 당신의 매력이 200% 발산되는 날입니다.",
                "오래된 연인이라면 서로의 소중함을 다시 한번 깊이 깨닫게 되는 따뜻한 사건이 생길 것입니다. 화려한 이벤트보다는 진심이 담긴 손편지 한 장이나 따뜻한 위로의 말 한마디가 상대방의 마음을 완전히 녹일 수 있습니다.",
                "사소한 말실수가 불씨가 되어 예상치 못한 다툼으로 번질 수 있으니 각별한 주의가 필요합니다. 상대방의 말에 꼬투리를 잡기보다는 '그럴 수도 있겠다'라는 넓은 마음으로 이해하려는 노력이 관계를 지키는 열쇠가 될 것입니다.",
                "싱글이라면 과거의 잊지 못한 인연에게서 갑작스러운 연락이 올 수도 있는 날입니다. 하지만 섣불리 감정에 휩쓸리기보다는 냉정하게 현재의 상황을 판단하는 것이 좋습니다. 새로운 사랑은 생각보다 가까운 곳에 있을지도 모릅니다.",
                "오늘은 당신의 매력이 화려한 장미보다는 은은한 들꽃처럼 빛나는 날입니다. 과한 꾸밈보다는 있는 그대로의 솔직하고 담백한 모습이 상대방에게 더 큰 호감을 줄 수 있습니다."
            ],
            en: [
                "Like becoming the protagonist of a romantic movie, a heart-fluttering fateful encounter awaits you. A small deviation might gift you an unexpected connection. Today is a day when your charm radiates 200%.",
                "If you are a long-time couple, a warm event will occur where you realize the preciousness of each other once again. A sincere letter or a warm word of comfort can completely melt the other person's heart.",
                "Special caution is needed as a trivial slip of the tongue can become a spark for a quarrel. The effort to understand with a broad mind will be the key to protecting the relationship.",
                "If you are single, you might receive a sudden contact from a past relationship. However, it is better to judge the situation coolly. New love may be hiding in a place closer than you think.",
                "Today is a day when your charm shines like a subtle wildflower. An honest and plain appearance can give a greater favor to the other person than excessive decoration."
            ]
        },
        money: {
            ko: [
                "재물운의 흐름이 마치 순풍을 단 돛단배처럼 순조롭습니다. 생각지도 못했던 곳에서 쏠쏠한 용돈이 들어오거나, 과거에 투자했던 곳에서 반가운 수익 소식이 들려올 수 있습니다. 다만 계획적인 지출을 통해 실속을 챙기는 것이 좋습니다.",
                "지갑을 열기 전에 세 번은 더 고민해야 하는 날입니다. 겉보기에는 아주 그럴듯해 보이는 투자 정보가 유혹하겠지만, 그 속에는 거품이 끼어있을 확률이 높습니다. 오늘은 기존의 자산을 안전하게 지키는 것이 중요합니다.",
                "오랫동안 잊고 있었던 비상금을 발견하거나 빌려준 돈을 돌려받는 등 소소한 금전적 행운이 따르는 날입니다. 오늘 얻은 수익의 일부는 주변 사람들에게 베풀거나 기부한다면, 더 큰 복이 되어 돌아올 것입니다.",
                "미래를 위한 투자를 공부하기에 이보다 더 좋은 날은 없습니다. 당장의 수익을 쫓기보다는 경제 흐름을 읽는 안목을 기르거나 재테크 관련 서적을 읽으며 내공을 쌓는 시간이 훗날 큰 부를 가져다줄 것입니다.",
                "예상치 못한 지출로 인해 당황할 수도 있는 하루입니다. 갑자기 가전제품이 고장 나거나 경조사가 생기는 등 돈 나갈 곳이 생길 수 있으니 미리 여유 자금을 확인해두는 것이 좋습니다."
            ],
            en: [
                "The flow of financial luck is smooth like a sailboat with a fair wind. You may receive pocket money from unexpected places. However, it is better to take care of substance through planned spending.",
                "It is a day when you have to think three more times before opening your wallet. Seemingly plausible investment information will tempt you, but there is a high probability of bubbles. Protect your existing assets safely.",
                "It is a day followed by small financial luck, such as discovering emergency funds you had forgotten. If you share some of today's profits, it will come back as a greater blessing.",
                "There is no better day than this to study investment for the future. Focus on cultivating an eye for reading economic flows rather than chasing immediate profits.",
                "It is a day when you may be flustered by unexpected expenses. Check spare funds in advance as sudden events may occur."
            ]
        },
        colors: [
            { name: "미드나잇 블루", nameEn: "Midnight Blue", code: "#1e3a8a" },
            { name: "라벤더 퍼플", nameEn: "Lavender Purple", code: "#a78bfa" },
            { name: "포레스트 그린", nameEn: "Forest Green", code: "#15803d" },
            { name: "코랄 핑크", nameEn: "Coral Pink", code: "#fb7185" },
            { name: "골드 옐로우", nameEn: "Gold Yellow", code: "#eab308" },
            { name: "퓨어 화이트", nameEn: "Pure White", code: "#f8fafc" },
            { name: "차콜 그레이", nameEn: "Charcoal Gray", code: "#334155" },
            { name: "스카이 블루", nameEn: "Sky Blue", code: "#7dd3fc" },
            { name: "루비 레드", nameEn: "Ruby Red", code: "#e11d48" },
            { name: "에메랄드 민트", nameEn: "Emerald Mint", code: "#34d399" },
            { name: "로얄 바이올렛", nameEn: "Royal Violet", code: "#7c3aed" },
            { name: "선셋 오렌지", nameEn: "Sunset Orange", code: "#f97316" }
        ]
    };

    // === 화면 렌더링 함수 ===
    let containerElement = null;

    function renderInputScreen() {
        const texts = UI_TEXTS[currentLang];
        containerElement.innerHTML = `
            <div class="glass-panel slide-up">
                <div class="title-area">
                    <h1 class="main-title">${texts.title}</h1>
                    <p class="sub-title">${texts.subtitle}</p>
                </div>
                <div class="input-group">
                    <label class="input-label">${texts.labelName}</label>
                    <input type="text" id="userName" class="input-field" placeholder="${texts.placeholderName}">
                </div>
                <div class="input-group">
                    <label class="input-label">${texts.labelDate}</label>
                    <div class="date-input-group">
                        <input type="number" id="birthYear" class="input-field date-field" placeholder="${texts.placeholderYear}" min="1900" max="2100">
                        <span class="date-separator">${currentLang === 'ko' ? '년' : ''}</span>
                        <input type="number" id="birthMonth" class="input-field date-field" placeholder="${texts.placeholderMonth}" min="1" max="12">
                        <span class="date-separator">${currentLang === 'ko' ? '월' : ''}</span>
                        <input type="number" id="birthDay" class="input-field date-field" placeholder="${texts.placeholderDay}" min="1" max="31">
                        <span class="date-separator">${currentLang === 'ko' ? '일' : ''}</span>
                    </div>
                </div>
                <button id="btnCheck" class="btn-fortune">
                    <span>${texts.btnCheck}</span> <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
        document.getElementById('btnCheck').onclick = checkFortune;
    }

    function renderResultScreen(data) {
        const texts = UI_TEXTS[currentLang];
        containerElement.innerHTML = `
            <div class="glass-panel slide-up">
                <div class="result-header">
                    <div>
                        <h2 style="font-size:1.5rem; font-weight:bold; color:white;">
                            <span style="color:#a5b4fc;">${data.name}</span><span style="font-size:1rem; color:#94a3b8; font-weight:normal;">${texts.titleSuffix}</span>
                        </h2>
                        <p style="color:#818cf8; margin-top:4px;">${data.zodiacName} (${data.date})</p>
                    </div>
                    <div class="zodiac-icon">${data.zodiacIcon}</div>
                </div>

                <div class="score-area">
                    <div class="score-label">${texts.luckScore}</div>
                    <div class="score-val" style="color:${data.scoreColor}">${data.score}<span style="font-size:1.5rem; color:#64748b; font-weight:normal;">${texts.points}</span></div>
                </div>

                <div class="fortune-text-box" style="margin-bottom:16px;">
                    <div class="fortune-label"><i class="fas fa-star"></i> ${texts.generalLuck}</div>
                    <p class="fortune-content">${data.mainText}</p>
                </div>

                <div class="grid-2" style="margin-bottom:16px;">
                    <div class="fortune-text-box">
                        <div class="fortune-label" style="color:#f472b6;"><i class="fas fa-heart"></i> ${texts.loveLuck}</div>
                        <p class="fortune-content" style="font-size:0.85rem;">${data.loveText}</p>
                    </div>
                    <div class="fortune-text-box">
                        <div class="fortune-label" style="color:#facc15;"><i class="fas fa-coins"></i> ${texts.moneyLuck}</div>
                        <p class="fortune-content" style="font-size:0.85rem;">${data.moneyText}</p>
                    </div>
                </div>

                <div class="grid-2">
                    <div class="item-box">
                        <div style="font-size:0.8rem; color:#94a3b8;">${texts.luckyColor}</div>
                        <div class="color-circle" style="background:${data.luckyColorCode}"></div>
                        <div style="font-weight:bold; font-size:0.9rem;">${data.luckyColorName}</div>
                    </div>
                    <div class="item-box">
                        <div style="font-size:0.8rem; color:#94a3b8;">${texts.luckyNumber}</div>
                        <div style="font-size:2rem; font-weight:900; color:#a5b4fc;">${data.luckyNum}</div>
                    </div>
                </div>

                <button id="btnRetry" class="btn-fortune" style="margin-top:20px; background:rgba(255,255,255,0.1);">
                    <i class="fas fa-redo"></i> <span>${texts.btnRetry}</span>
                </button>
            </div>
        `;
        document.getElementById('btnRetry').onclick = renderInputScreen;
        containerElement.scrollTop = 0;
    }

    // === 로직 함수 ===
    function getZodiac(dateStr) {
        const date = new Date(dateStr);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const md = (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day;

        for (let z of ZODIAC_SIGNS) {
            if (md >= z.start && md <= z.end) return z;
        }
        return ZODIAC_SIGNS[0];
    }

    function seededRandom(seed) {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    function checkFortune() {
        const nameInput = document.getElementById('userName');
        const yearInput = document.getElementById('birthYear');
        const monthInput = document.getElementById('birthMonth');
        const dayInput = document.getElementById('birthDay');
        
        const name = nameInput.value.trim();
        const year = parseInt(yearInput.value);
        const month = parseInt(monthInput.value);
        const day = parseInt(dayInput.value);

        if (!name || !year || !month || !day) {
            alert(UI_TEXTS[currentLang].alertInput);
            return;
        }

        // 유효성 검사
        if (year < 1900 || year > 2100) {
            alert(currentLang === 'ko' ? '연도를 올바르게 입력해주세요 (1900-2100)' : 'Please enter a valid year (1900-2100)');
            return;
        }
        if (month < 1 || month > 12) {
            alert(currentLang === 'ko' ? '월을 올바르게 입력해주세요 (1-12)' : 'Please enter a valid month (1-12)');
            return;
        }
        if (day < 1 || day > 31) {
            alert(currentLang === 'ko' ? '일을 올바르게 입력해주세요 (1-31)' : 'Please enter a valid day (1-31)');
            return;
        }

        // 날짜 유효성 검사 (예: 2월 30일 같은 경우)
        const dateObj = new Date(year, month - 1, day);
        if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
            alert(currentLang === 'ko' ? '올바른 날짜를 입력해주세요' : 'Please enter a valid date');
            return;
        }

        // YYYY-MM-DD 형식으로 변환
        const monthStr = month < 10 ? '0' + month : month.toString();
        const dayStr = day < 10 ? '0' + day : day.toString();
        const birthDate = `${year}-${monthStr}-${dayStr}`;

        const zodiac = getZodiac(birthDate);
        
        // 시드 생성
        const today = new Date();
        const dateSeed = parseInt(`${today.getFullYear()}${today.getMonth()}${today.getDate()}`);
        const birthSeed = parseInt(birthDate.replace(/-/g, ''));
        const seedBase = dateSeed + birthSeed;

        // 텍스트 선택
        const f = FORTUNE_TEXTS;
        const score = Math.floor(seededRandom(seedBase) * 41) + 60;
        const mainIdx = Math.floor(seededRandom(seedBase + 1) * f.general[currentLang].length);
        const loveIdx = Math.floor(seededRandom(seedBase + 2) * f.love[currentLang].length);
        const moneyIdx = Math.floor(seededRandom(seedBase + 3) * f.money[currentLang].length);
        const colorIdx = Math.floor(seededRandom(seedBase + 4) * f.colors.length);
        const luckyNum = Math.floor(seededRandom(seedBase + 5) * 99) + 1;

        const scoreColor = score >= 90 ? '#facc15' : score >= 70 ? '#4ade80' : '#94a3b8';
        const zName = currentLang === 'en' ? zodiac.nameEn : zodiac.name;
        const cName = currentLang === 'en' ? f.colors[colorIdx].nameEn : f.colors[colorIdx].name;

        renderResultScreen({
            name: name,
            date: birthDate,
            zodiacName: zName,
            zodiacIcon: zodiac.icon,
            score: score,
            scoreColor: scoreColor,
            mainText: f.general[currentLang][mainIdx],
            loveText: f.love[currentLang][loveIdx],
            moneyText: f.money[currentLang][moneyIdx],
            luckyColorCode: f.colors[colorIdx].code,
            luckyColorName: cName,
            luckyNum: luckyNum
        });
    }

    // === 별 생성 로직 ===
    function createStarBackground(starContainer) {
        if (!starContainer) return;
        
        for(let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const size = Math.random() * 2 + 1;
            const duration = Math.random() * 3 + 2;
            const opacity = Math.random() * 0.5 + 0.1;

            star.style.left = `${x}%`;
            star.style.top = `${y}%`;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.setProperty('--duration', `${duration}s`);
            star.style.setProperty('--opacity', opacity);
            
            starContainer.appendChild(star);
        }
    }

    // === Game 객체 (GameShell 인터페이스) ===
    const Game = {
        init: function(gameContainer, options = {}) {
            container = gameContainer;
            callbacks = options || {};

            // 기존 내용 제거
            container.innerHTML = '';

            // === DOM 요소 생성 ===
            const wrapper = document.createElement('div');
            wrapper.className = 'fortune-wrapper';
            
            // 별 배경 컨테이너
            const starBg = document.createElement('div');
            starBg.className = 'star-bg';
            wrapper.appendChild(starBg);

            // 언어 스위치
            const langSwitch = document.createElement('div');
            langSwitch.className = 'lang-switch';
            langSwitch.innerHTML = `
                <div class="lang-btn active" data-lang="ko">KR</div>
                <div class="lang-btn" data-lang="en">EN</div>
            `;
            wrapper.appendChild(langSwitch);

            // 메인 컨테이너
            const fortuneContainer = document.createElement('div');
            fortuneContainer.className = 'fortune-container';
            wrapper.appendChild(fortuneContainer);

            // container에 추가
            container.appendChild(wrapper);

            // 별 배경 생성
            createStarBackground(starBg);

            // 컨테이너 요소 설정
            containerElement = fortuneContainer;

            // 언어 버튼 이벤트
            langSwitch.querySelectorAll('.lang-btn').forEach(btn => {
                btn.onclick = (e) => {
                    const lang = e.target.dataset.lang;
                    if(currentLang === lang) return;
                    currentLang = lang;
                    langSwitch.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    // 화면 갱신
                    renderInputScreen();
                };
            });

            // 첫 화면 렌더링
            renderInputScreen();
        },

        render: function() {
            // 필요시 재렌더링
            if (containerElement) {
                renderInputScreen();
            }
        },

        reset: function() {
            // 게임 리셋
            if (containerElement) {
                renderInputScreen();
            }
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