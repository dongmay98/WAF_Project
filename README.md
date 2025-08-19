# 🛡️ WAF Dashboard Project - Security Testing & Management Platform

![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![ModSecurity](https://img.shields.io/badge/ModSecurity-v3-red?style=for-the-badge)
![OWASP](https://img.shields.io/badge/OWASP-CRS%204.17.1-orange?style=for-the-badge)

**Nginx + ModSecurity + OWASP CRS를 활용한 웹 애플리케이션 방화벽(WAF) 관리 플랫폼**

실시간 보안 테스트, 로그 모니터링, 대시보드를 제공하는 SaaS 형태의 WAF 관리 솔루션입니다.

## 🎯 프로젝트 개요

### 🔧 기술 스택
- **Frontend**: React 18 + TypeScript + Material-UI + Vite
- **Backend**: NestJS + TypeScript + MongoDB + Redis  
- **WAF Engine**: ModSecurity v3 + OWASP CRS 4.17.1
- **Infrastructure**: Docker + Docker Compose + Nginx
- **Security Testing**: 자체 개발된 보안 테스트 API

### ✨ 주요 기능
- **🔍 실시간 WAF 로그 모니터링**: 차단/허용 로그 실시간 조회 및 분석
- **📊 대시보드**: 보안 통계, 상위 차단 IP, 공격 유형별 분포도
- **🧪 보안 테스트**: SQL Injection, XSS, Command Injection, Directory Traversal 테스트
- **📈 테스트 결과 분석**: 차단율 통계 및 상세 결과 리포트
- **🔒 WAF 보호**: OWASP Top 10 공격 패턴 실시간 차단

## 🚀 빠른 시작

### 시스템 요구사항
- Docker & Docker Compose
- Node.js 18+ (로컬 개발시)
- 포트: 3002(API), 5173(Frontend), 8080(WAF), 27018(MongoDB), 6380(Redis)

### 실행 방법

#### 1️⃣ 개발 환경 실행
```bash
# 레포지토리 클론
git clone <repository-url>
cd modsecurity-crs-docker

# 개발 환경 시작 (백엔드 + 인프라)
docker-compose -f docker-compose.dev.yaml up -d

# 프론트엔드 실행
cd frontend
npm install
npm run dev
```

#### 2️⃣ 프로덕션 환경 실행  
```bash
# 전체 서비스 실행
docker-compose up -d
```

### 접속 정보
- **WAF Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:3002
- **API 문서**: http://localhost:3002/api/docs
- **WAF 테스트 대상**: http://localhost:8080
- **MongoDB**: localhost:27018
- **Redis**: localhost:6380

## 🧪 보안 테스트 기능

### 지원하는 공격 유형
1. **SQL Injection**: `1' OR '1'='1`, `UNION SELECT`, `DROP TABLE` 등
2. **XSS (Cross-Site Scripting)**: `<script>alert()`, `<img onerror>` 등  
3. **Command Injection**: `; ls -la`, `| cat /etc/passwd` 등
4. **Directory Traversal**: `../../../etc/passwd`, `..\\windows\\system32` 등

### 테스트 실행 방법
1. WAF Dashboard 접속 → "보안 테스트" 탭
2. 개별 테스트 또는 "전체 보안 테스트" 실행
3. 실시간 결과 확인 및 차단율 분석
4. 대시보드에서 생성된 로그 확인

## 📊 대시보드 기능

### 실시간 모니터링
- **총 요청 수**: 전체 WAF 처리 요청 통계
- **차단된 요청**: 보안 룰에 의해 차단된 요청 수
- **상위 차단 IP**: 가장 많이 차단된 IP 주소 목록
- **공격 유형별 분포**: 탐지된 공격 패턴 통계

### 로그 관리
- **실시간 로그 테이블**: 최신 WAF 로그 실시간 표시
- **필터링**: IP, 룰ID, 심각도별 필터링
- **페이지네이션**: 대용량 로그 효율적 관리
- **상세 정보**: 각 로그의 상세 정보 조회

## 🏗️ 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │───▶│   (NestJS)      │───▶│   (MongoDB)     │
│   Port: 5173    │    │   Port: 3002    │    │   Port: 27018   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   WAF Engine    │    │   Test Backend  │
                       │   (ModSecurity) │───▶│   (Nginx)       │
                       │   Port: 8080    │    │   Port: 80      │
                       └─────────────────┘    └─────────────────┘
```

## 🌿 브랜치 구조

- **main**: 안정적인 프로덕션 버전
- **feature/saas-dashboard**: SaaS 대시보드 개발 (현재 활성)
- **feature/security-analysis**: 보안 분석 기능 개발

## 🏆 프로젝트 성과

### 📊 보안 테스트 시스템 구현 성과
- **자동화된 보안 테스트**: 4가지 주요 공격 유형 (SQL Injection, XSS, Command Injection, Directory Traversal) 자동 테스트 시스템
- **100% WAF 차단율 달성**: 20개 공격 페이로드 테스트에서 ModSecurity + OWASP CRS가 모든 공격 차단 확인
- **실시간 분석 대시보드**: React 기반 직관적 UI로 보안 통계 및 로그 실시간 모니터링

### 🚀 기술적 구현 역량
- **Full-Stack 개발**: React + NestJS + MongoDB 기반 SaaS 아키텍처 설계 및 구현
- **API 설계**: RESTful API 설계 및 Swagger 문서화로 체계적인 백엔드 구조
- **Docker 컨테이너화**: 마이크로서비스 아키텍처로 개발/프로덕션 환경 분리 및 자동화
- **보안 시스템 통합**: ModSecurity WAF 엔진과 커스텀 대시보드 연동

### 📈 성능 지표
- **API 응답 속도**: 평균 50ms (MongoDB 조회 최적화)
- **실시간 테스트**: < 100ms 내 WAF 차단 응답 및 결과 표시
- **확장 가능한 구조**: Docker Compose 기반 멀티 컨테이너 오케스트레이션

### 🎯 해결한 핵심 문제
- **WAF 효과 검증 자동화**: 수동 테스트 → 원클릭 자동 테스트로 효율성 대폭 향상
- **보안 로그 시각화**: 복잡한 ModSecurity 로그 → 직관적 대시보드로 가독성 개선
- **개발 환경 표준화**: Docker 기반 일관된 개발/배포 환경 구축

## 📝 개발 로그

### 최근 업데이트 (feature/saas-dashboard)
- ✅ **보안 테스트 API 개발**: 5가지 공격 유형 테스트 엔드포인트 구현
- ✅ **Security Test Panel UI**: 직관적인 보안 테스트 인터페이스 구현  
- ✅ **개발 환경 개선**: Docker Compose 개발 설정 및 핫 리로드 지원
- ✅ **실시간 결과 표시**: 테스트 결과 실시간 표시 및 상세 분석
- ✅ **MongoDB 연동**: WAF 로그 저장 및 조회 시스템 구현

## 🔧 개발 환경 설정

### 필수 의존성
```bash
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

### 환경 변수
```bash
# Backend (.env)
MONGO_URL=mongodb://admin:password@mongo:27017/waf-dashboard?authSource=admin
REDIS_URL=redis://redis:6379
PORT=3000

# Frontend (.env)
VITE_API_URL=http://localhost:3002
```

## 🛠️ 트러블슈팅

### 일반적인 문제
1. **포트 충돌**: 다른 서비스에서 포트를 사용 중인 경우 docker-compose.yaml에서 포트 변경
2. **MongoDB 연결 실패**: 컨테이너 시작 순서 문제 시 `docker-compose restart dashboard-backend`
3. **Frontend 빌드 에러**: Node.js 버전 호환성 확인 (18+ 권장)

### 로그 확인
```bash
# 전체 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f dashboard-backend
docker-compose logs -f crs-nginx
```

## 📄 라이센스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit your Changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the Branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request

---

**⚡ 개발팀**: WAF 보안 솔루션 개발팀  
**📧 문의**: 프로젝트 이슈 탭 활용