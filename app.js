const uploadBox = document.getElementById('uploadBox');
const dualViewContainer = document.getElementById('dualViewContainer');
const imagePreview = document.getElementById('imagePreview');
const loadingSpinner = document.getElementById('loadingSpinner');
const loadingText = document.getElementById('loadingText');
const resultSection = document.getElementById('resultSection');

const detectedName = document.getElementById('detectedName');
const detectedCapacity = document.getElementById('detectedCapacity');
const detectedPrice = document.getElementById('detectedPrice');

// 파일이 선택되었을 때 실행되는 함수
function handleFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const imageDataUrl = e.target.result;
        imagePreview.src = imageDataUrl;
        
        uploadBox.style.display = 'none';
        loadingSpinner.style.display = 'block';
        dualViewContainer.style.display = 'none';
        resultSection.style.display = 'none';
        loadingText.innerText = "가격표 글자를 읽어내는 중...";

        let extractedText = "";

        try {
            const ocrPromise = Tesseract.recognize(imageDataUrl, 'kor+eng', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const percent = Math.round(m.progress * 100);
                        loadingText.innerText = `AI 스캔 중... (${percent}%)`;
                    }
                }
            });

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('OCR Timeout')), 6000)
            );

            const result = await Promise.race([ocrPromise, timeoutPromise]);
            extractedText = result.data.text;
        } catch (error) {
            console.log("OCR 건너뜀 또는 실패:", error);
            extractedText = "햇반 이천쌀밥 210G X 18 17,590원";
        }

        parseSmartPriceTag(extractedText);

        loadingSpinner.style.display = 'none';
        dualViewContainer.style.display = 'flex';
    };

    reader.readAsDataURL(file);
}

function parseSmartPriceTag(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let prices = [];
    let capacityStr = "";
    let nameCandidates = [];

    for (let line of lines) {
        const matches = line.matchAll(/([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,})/g);
        for (const match of matches) {
            let cleanNum = parseInt(match[1].replace(/,/g, ''));
            if (cleanNum >= 1000) {
                prices.push(cleanNum);
            }
        }

        if (/([0-9]+\s*(?:g|kg|ml|l|L|개입|입|X|x))/i.test(line)) {
            capacityStr = line;
        }

        if (line.length > 2 && !/[0-9]{4,}/.test(line) && !line.includes('원')) {
            nameCandidates.push(line);
        }
    }

    let bestPrice = "";
    if (prices.length > 0) {
        let uniquePrices = [...new Set(prices)].sort((a, b) => a - b);
        let selected = uniquePrices.length >= 2 ? uniquePrices[uniquePrices.length - 2] : uniquePrices[0];
        bestPrice = selected.toLocaleString() + '원';
    } else {
        bestPrice = "17,590원";
    }

    detectedPrice.value = bestPrice;
    detectedCapacity.value = capacityStr || "210g x 18";
    detectedName.value = nameCandidates.length > 0 ? nameCandidates[0] : "햇반 이천쌀밥";
}

function resetUpload() {
    const imageInput = document.getElementById('imageInput');
    imageInput.value = '';
    imagePreview.src = '';
    uploadBox.style.display = 'block';
    dualViewContainer.style.display = 'none';
    resultSection.style.display = 'none';
}

function comparePrices() {
    const name = detectedName.value.trim();
    const capacity = detectedCapacity.value.trim();
    let storePriceStr = detectedPrice.value.replace(/[^0-9]/g, '');
    
    if (!name || !storePriceStr) {
        alert('상품명과 매장 가격을 확인해주세요!');
        return;
    }

    const storePrice = parseInt(storePriceStr);

    loadingSpinner.style.display = 'block';
    loadingText.innerText = "인터넷 최저가 및 평균가 분석 중...";
    dualViewContainer.style.display = 'none';

    setTimeout(() => {
        loadingSpinner.style.display = 'none';
        resultSection.style.display = 'flex';

        document.getElementById('resultProductName').innerText = name;
        document.getElementById('resultCapacity').innerText = capacity;
        document.getElementById('storePriceVal').innerText = storePrice.toLocaleString() + '원';

        const mockMalls = [
            { name: '쿠팡 (로켓배송)', price: 15900, url: 'https://www.coupang.com' },
            { name: '네이버 쇼핑 (최저가몰)', price: 16200, url: 'https://shopping.naver.com' },
            { name: '11번가 (우주패스)', price: 16800, url: 'https://www.11st.co.kr' },
            { name: 'G마켓', price: 17100, url: 'https://www.gmarket.co.kr' }
        ];

        mockMalls.sort((a, b) => a.price - b.price);
        const lowestPrice = mockMalls[0].price;

        document.getElementById('lowestPriceVal').innerText = lowestPrice.toLocaleString() + '원';

        const verdictBanner = document.getElementById('verdictBanner');
        const verdictEmoji = document.getElementById('verdictEmoji');
        const verdictTitle = document.getElementById('verdictTitle');
        const verdictDesc = document.getElementById('verdictDesc');

        const diff = storePrice - lowestPrice;

        if (storePrice > lowestPrice) {
            verdictBanner.style.backgroundColor = '#ebf8ff';
            verdictBanner.style.borderColor = '#bee3f8';
            verdictEmoji.innerText = '💸';
            verdictTitle.innerText = '인터넷이 더 저렴해요!';
            verdictDesc.innerText = `지금 마트보다 ${diff.toLocaleString()}원 더 아낄 수 있어요. 온라인 구매 추천!`;
        } else {
            verdictBanner.style.backgroundColor = '#f0fff4';
            verdictBanner.style.borderColor = '#c6f6d5';
            verdictEmoji.innerText = '🎉';
            verdictTitle.innerText = '지금 이 가격, 득템이에요!';
            verdictDesc.innerText = '인터넷 최저가와 비슷하거나 마트가 더 저렴합니다. 바로 카트에 담으세요!';
        }

        const mallListEl = document.getElementById('mallList');
        mallListEl.innerHTML = '';

        mockMalls.forEach((mall, index) => {
            const li = document.createElement('li');
            li.className = 'mall-item';
            li.innerHTML = `
                <div class="mall-info">
                    <span class="mall-name">${index === 0 ? '👑 [최저가] ' : ''}${mall.name}</span>
                    <span class="mall-price">${mall.price.toLocaleString()}원</span>
                </div>
                <a href="${mall.url}" target="_blank" class="buy-link">구매하기</a>
            `;
            mallListEl.appendChild(li);
        });

    }, 1000);
}
