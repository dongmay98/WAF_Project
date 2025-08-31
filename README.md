# WAF Dashboard (ModSecurity + OWASP CRS)

Nginx(ModSecurity v3, OWASP CRS)로 보호되는 백엔드 API를 대상으로 공격 시뮬레이션, 감사 로그 수집, 대시보드 시각화를 제공하는 프로젝트입니다.

## 구성 요소
- Frontend: React + TypeScript + MUI (Nginx로 서빙)
- Backend: NestJS + MongoDB + Redis
- WAF: Nginx + ModSecurity + OWASP CRS
- Infra: Docker Compose

## 주요 기능
- 공격 시뮬레이션(API): SQLi, XSS, Command Injection, Path Traversal
- 감사 로그 인제스트: ModSecurity JSON audit.log를 실시간 수집/저장
- 대시보드/로그: 통계 카드, 로그 테이블, 원본 감사 로그 뷰어

## 빠른 시작
```bash
# 전체 서비스 실행
docker compose up -d
```

접속:
- Dashboard: http://localhost:3000
- Backend API: http://localhost:3001
- WAF(Target): http://localhost:8080
- MongoDB: localhost:27018, Redis: localhost:6380

## 환경 변수(핵심)
Backend 컨테이너 기준:
- MONGODB_URI: mongodb://admin:password@mongo:27017/waf-dashboard?authSource=admin
- AUDIT_LOG_FILE: /var/log/modsecurity/audit.log
- FRONTEND_URL, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL

## WAF 설정 요약
- docker-compose: `crs-nginx`가 `dashboard-backend:3001`을 보호
- 감사 로그: Serial(JSON)로 `/var/log/modsecurity/audit.log`
- 볼륨: `./waf-audit:/var/log/modsecurity` (백엔드에서 읽기 전용 마운트)
- override: 템플릿 경로에 마운트
  - `./nginx/templates/modsecurity.d/modsecurity-override.conf -> /etc/nginx/templates/modsecurity.d/modsecurity-override.conf.template`
- 커스텀 룰:
  - `REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf`
  - `RESPONSE-999-EXCLUSION-RULES-AFTER-CRS.conf`

## 감사 로그 인제스트
- 모듈: `backend/src/audit-ingest`
- 방식: 파일 존재 대기 → `tail`로 신규 라인 수집 → JSON 파싱 → Mongo 저장

## API 요약(일부)
- Raw 감사 로그 조회: `GET /api/waf-logs/raw?limit=200`
- 전체 공격 시뮬레이션: `POST /api/waf-logs/test/all-attacks`

## 장애/트러블슈팅 핵심
- Raw 500: `GET /api/waf-logs/raw` 라우트는 `:id`보다 상단 선언
- EAI_AGAIN: `crs-nginx` 기동/Healthy 상태 확인 필요
- WAF 기동 실패: override는 최종파일이 아닌 템플릿 경로에 마운트

## 브랜치
- main: 안정
- feature/saas-dashboard: 대시보드 개발
- feature/waf-audit-rawlogs: 감사 인제스트/원본 로그 뷰어/컨테이너 헬스 정비

## 라이선스
MIT (LICENSE 참조)