# WAF Dashboard (ModSecurity + OWASP CRS)

Nginx(ModSecurity v3, OWASP CRS)로 보호되는 백엔드 API를 대상으로 공격 시뮬레이션, 감사 로그 수집, 대시보드 시각화를 제공하는 프로젝트입니다. 이 프로젝트는 **웹 애플리케이션 방화벽(WAF)의 동작, 기능, 그리고 실제 공격에 대한 방어 능력**을 이해하고 시각적으로 확인할 수 있도록 돕는 데 중점을 둡니다.

## 구성 요소
- Frontend: React + TypeScript + MUI (Nginx로 서빙)
- Backend: NestJS + MongoDB + Redis
- WAF: Nginx + ModSecurity + OWASP CRS
- Infra: Docker Compose

## 주요 기능
- 공격 시뮬레이션(API): SQLi, XSS, Command Injection, Path Traversal, 악성 파일 업로드
- 감사 로그 인제스트: ModSecurity JSON audit.log를 실시간 수집/저장
- 대시보드/로그: 통계 카드, 로그 테이블, 원본 감사 로그 뷰어
- 테넌트별 WAF 로그 격리: 로그인한 사용자별 WAF 로그 분리 및 관리

## WAF 통합 및 동작 방식 (핵심)
이 프로젝트의 핵심은 ModSecurity WAF가 어떻게 웹 애플리케이션을 보호하는지 시각적으로 보여주는 것입니다.

1.  **`crs-nginx` 서비스 (ModSecurity WAF)**:
    *   `docker-compose.yaml`에 정의된 `crs-nginx` 서비스는 Nginx 웹 서버에 ModSecurity 모듈과 OWASP Core Rule Set (CRS)이 사전 설정된 환경을 제공합니다.
    *   `localhost:8080` 포트로 들어오는 모든 HTTP 요청은 이 `crs-nginx` 컨테이너로 라우팅됩니다.
    *   Nginx는 요청을 백엔드 서비스로 프록시하기 전에 **ModSecurity가 먼저 요청 내용을 검사**하도록 설정되어 있습니다.

2.  **백엔드 보안 테스트와 WAF의 상호작용**:
    *   `backend/src/waf-logs/waf-logs.service.ts`의 `simulate*Attack` 메서드들은 `axios`를 사용하여 `http://localhost:8080` (즉, `crs-nginx` WAF)으로 공격 페이로드를 포함한 HTTP 요청을 보냅니다.
    *   이 요청은 실제 대상 서버로 가기 전에 ModSecurity WAF에 의해 가로채져 분석됩니다.

3.  **ModSecurity의 요청 처리 및 로깅**:
    *   ModSecurity는 OWASP CRS 규칙에 따라 요청 헤더, 바디, URL 파라미터 등을 면밀히 검사합니다.
    *   공격 패턴이 감지되면, ModSecurity는 해당 요청을 **차단**하고 (403 Forbidden 응답), 이 차단 이벤트를 `audit.log` 파일에 JSON 형식으로 상세히 기록합니다.
    *   차단되지 않은 정상 요청은 계속해서 백엔드 서비스로 프록시됩니다.

4.  **WAF 로그 수집 및 대시보드 연동 (`audit-ingest` 서비스)**:
    *   `backend/src/audit-ingest/audit-ingest.service.ts`는 `crs-nginx` 컨테이너 내의 ModSecurity `audit.log` 파일(`./waf-audit` 볼륨 마운트)을 실시간으로 감시합니다.
    *   새로운 로그 항목이 감지되면, 이를 파싱하여 MongoDB의 `waflogs` 컬렉션에 저장합니다.
    *   이 과정에서 로그인한 사용자의 `X-Tenant-ID` 헤더를 기반으로 로그를 테넌트(사용자)별로 격리하여 저장합니다.
    *   프론트엔드 대시보드는 이 MongoDB 데이터를 조회하여 실시간 WAF 로그, 통계, 차트 등을 시각화하여 보여줍니다.

이러한 과정을 통해 사용자는 다양한 공격 유형에 대한 WAF의 방어 동작을 직접 테스트하고, 그 결과를 시각적인 대시보드와 상세 로그를 통해 쉽게 이해할 수 있습니다.

## 빠른 시작
```bash
# 전체 서비스 실행
docker compose up -d --build # 최신 변경사항을 반영하기 위해 --build 옵션 권장
```

접속:
- Dashboard: http://localhost:3000
- Backend API: http://localhost:3001
- WAF(Target): http://localhost:8080
- MongoDB: localhost:27018, Redis: localhost:6380

## 환경 변수
- 백엔드/프론트 예시는 `.env.sample` 참고
- backend: `backend/.env.sample`, frontend: `frontend/.env.sample`

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
- Raw 감사 로그 조회: `GET /custom/security-logs/raw?limit=200`
- 전체 공격 시뮬레이션: `POST /custom/security-logs/test/all-attacks`

## 장애/트러블슈팅 핵심
- Raw 500: `GET /custom/security-logs/raw` 라우트는 `:id`보다 상단 선언
- EAI_AGAIN: `crs-nginx` 기동/Healthy 상태 확인 필요
- WAF 기동 실패: override는 최종파일이 아닌 템플릿 경로에 마운트

## 브랜치
- main: 안정
- feature/saas-dashboard: 대시보드 개발
- feature/waf-audit-rawlogs: 감사 인제스트/원본 로그 뷰어/컨테이너 헬스 정비

## 라이선스
MIT (LICENSE 참조)