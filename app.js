const imageInput = document.getElementById('imageInput');
const uploadPlaceholder = document.querySelector('.upload-placeholder');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const productInfoGroup = document.getElementById('productInfoGroup');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultSection = document.getElementById('resultSection');

// OCR 인식 결과 인풋들
const detectedName = document.getElementById('detectedName');
const detectedCapacity = document.getElementById('detectedCapacity');
const detectedPrice = document.getElementById('detectedPrice');

// 1. 사진 업로드 시 시뮬레이션 (가격표 자동 스캔)
imageInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            uploadPlaceholder.style.display = 'none';
            previewContainer.style.display = 'block';
            
            // 로딩 후 가격표 인식 완료 가정
            loadingSpinner.style.display = 'block';
            productInfoGroup.style.display = 'none';
            resultSection.style.display = 'none';

            setTimeout(() => {
                loadingSpinner.style.display = 'none';
                productInfoGroup.style.display = 'block';

                // 가상의 마트 가격표 인식 데이터 자동 입력
                detectedName.value = "CJ 햇반 210g (12개입)";
                detectedCapacity.value = "210g x 12개";
                detectedPrice.value = "14,800원";
            }, 1200);
        }
        reader.readAsDataURL(file);
    }
});

// 사진 다시 찍기
function resetUpload() {
    imageInput.value = '';
    imagePreview.src = '';
    previewContainer.style.display = 'none';
    uploadPlaceholder.style.display = 'block';
    productInfoGroup.style.display = 'none';
    resultSection.style.display = 'none';
}

// 2. 인터넷 가격 비교 실행
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
    productInfoGroup.style.display = 'none';

    setTimeout(() => {
        loadingSpinner.style.display = 'none';
        resultSection.style.display = 'flex';

        document.getElementById('resultProductName').innerText = name;
        document.getElementById('resultCapacity').innerText = capacity;
        document.getElementById('storePriceVal').innerText = storePrice.toLocaleString() + '원';

        // 가상의 온라인 최저가 쇼핑몰 데이터 리스트 생성
        const mockMalls = [
            { name: '쿠팡 (로켓배송)', price: 12900, url: 'https://www.coupang.com' },
            { name: '네이버 쇼핑 (최저가몰)', price: 13200, url: 'https://shopping.naver.com' },
            { name: '11번가 (우주패스)', price: 13500, url: 'https://www.11st.co.kr' },
            { name: 'G마켓', price: 14100, url: 'https://www.gmarket.co.kr' }
        ];

        // 가격순 정렬
        mockMalls.sort((a, b) => a.price - b.price);
        const lowestPrice = mockMalls[0].price;

        document.getElementById('lowestPriceVal').innerText = lowestPrice.toLocaleString() + '원';

        // 판정 문구 변경
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

        // 쇼핑몰 리스트 렌더링
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
