# PNG to WebP 변환 스크립트

`assets/games/weapon-levelup/images` 폴더의 모든 PNG 파일을 WebP로 변환합니다.

## 사용 방법

### Node.js 버전 (추천)

1. sharp 모듈 설치:
```bash
npm install sharp
```

2. 스크립트 실행:
```bash
node convert-png-to-webp.js
```

### Python 버전

1. Pillow 모듈 설치:
```bash
pip install Pillow
```

2. 스크립트 실행:
```bash
python convert-png-to-webp.py
```

## 설정

- **품질**: 80
- **투명도**: 유지됨
- **원본 PNG**: 보존됨
- **WebP 파일**: `assets/games/weapon-levelup/images/webp/` 폴더에 저장

