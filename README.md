# 🛡️ WAF Project - Nginx + ModSecurity + OWASP CRS

![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/nginx-%23009639.svg?style=for-the-badge&logo=nginx&logoColor=white)
![ModSecurity](https://img.shields.io/badge/ModSecurity-v3-red?style=for-the-badge)
![OWASP](https://img.shields.io/badge/OWASP-CRS%204.17.1-orange?style=for-the-badge)

Nginx + ModSecurity + OWASP Core Rule Set을 활용한 웹 애플리케이션 방화벽(WAF) 프로젝트입니다.

## 🎯 프로젝트 개요

이 프로젝트는 OWASP ModSecurity CRS를 기반으로 구축된 실용적인 WAF 솔루션입니다:
- **WAF 엔진**: ModSecurity v3 + OWASP CRS 4.17.1
- **웹서버**: Nginx (리버스 프록시)
- **백엔드**: nginx:alpine (테스트용)
- **오케스트레이션**: Docker Compose

## 🚀 빠른 시작

### 시스템 요구사항
- Docker & Docker Compose
- 8080, 8443 포트 사용 가능

### 실행 방법

1. **레포지토리 클론**
```bash
git clone https://github.com/dongmay98/WAF_Project.git
cd WAF_Project
```

2. **WAF 시스템 시작**
```bash
docker-compose up -d
```

3. **접속 확인**
```bash
# HTTP 접속
curl http://localhost:8080

# 브라우저에서 확인
open http://localhost:8080
```

4. **서비스 상태 확인**
```bash
docker-compose ps
```

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   클라이언트    │───▶│   WAF (Nginx)   │───▶│   백엔드 서버   │
│   (브라우저)    │    │ ModSecurity v3  │    │ (nginx:alpine)  │
│                 │    │ OWASP CRS 4.17.1│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
      Port 80/443           Port 8080/8443          Port 80
```

### 구성 요소
- **Frontend**: WAF (ModSecurity + Nginx) - 보안 필터링 수행
- **Backend**: nginx:alpine - 실제 웹 콘텐츠 서빙
- **통신**: HTTP/HTTPS 리버스 프록시 구조

## 🧪 테스트 방법

### 1. 기본 접속 테스트
```bash
# 메인 페이지
curl -i http://localhost:8080

# 정적 파일 테스트
curl -i http://localhost:8080/test.html

# 404 에러 테스트
curl -i http://localhost:8080/api/nonexistent
```

### 2. WAF 기능 테스트
```bash
# SQL Injection 테스트 (차단되어야 함)
curl "http://localhost:8080/?id=1' OR '1'='1"

# XSS 테스트 (차단되어야 함)
curl "http://localhost:8080/?search=<script>alert('xss')</script>"
```

### 3. 로그 확인
```bash
# WAF 로그 실시간 확인
docker-compose logs -f crs-nginx

# 백엔드 로그 확인
docker-compose logs backend
```

## ⚙️ 설정 관리

### WAF 보안 레벨 조정

`docker-compose.yaml`에서 보안 설정을 조정할 수 있습니다:

```yaml
environment:
  # 편집증 레벨 (1-4, 높을수록 엄격)
  PARANOIA: 1
  BLOCKING_PARANOIA: 1
  
  # 이상 점수 임계값 (낮을수록 엄격)
  ANOMALY_INBOUND: 5
  ANOMALY_OUTBOUND: 4
```

### 커스텀 룰 추가

WAF 룰을 커스터마이징하려면:

1. **사전 CRS 룰**: `REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf` 수정
2. **사후 CRS 룰**: `RESPONSE-999-EXCLUSION-RULES-AFTER-CRS.conf` 수정

예제:
```apache
# SQL Injection 특정 패턴 허용
SecRuleRemoveById 942100
```

## 🔧 문제 해결

### 자주 발생하는 문제들

**1. 502 Bad Gateway 에러**
```bash
# 백엔드 서비스 확인
docker-compose ps backend

# 백엔드 로그 확인
docker-compose logs backend
```

**2. WAF가 너무 엄격해서 정상 요청이 차단됨**
```bash
# PARANOIA 레벨을 낮춤 (docker-compose.yaml)
PARANOIA: 1  # 기본값

# 또는 특정 룰 비활성화
SecRuleRemoveById [rule_id]
```

**3. 포트 충돌**
```bash
# 사용 중인 포트 확인
netstat -tulpn | grep :8080

# docker-compose.yaml에서 포트 변경
ports:
  - "9080:8080"  # 로컬 포트를 9080으로 변경
```

## 📚 참고 자료

### 공식 문서
- [OWASP ModSecurity](https://owasp.org/www-project-modsecurity/)
- [OWASP Core Rule Set](https://owasp.org/www-project-modsecurity-core-rule-set/)
- [ModSecurity Reference Manual](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-(v3.x))

### 유용한 링크
- [WAF 테스트 도구](https://github.com/coreruleset/crs-toolchain)
- [보안 규칙 작성 가이드](https://coreruleset.org/docs/)
- [성능 튜닝 가이드](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-(v3.x)#Performance)

## 🤝 기여하기

프로젝트 개선에 기여하고 싶으시다면:

1. 이 레포지토리를 Fork 하세요
2. 새로운 기능 브랜치를 만드세요 (`git checkout -b feature/awesome-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add awesome feature'`)
4. 브랜치에 Push 하세요 (`git push origin feature/awesome-feature`)
5. Pull Request를 열어주세요

## 📄 라이센스

이 프로젝트는 [Apache License 2.0](LICENSE) 하에 배포됩니다.

## ⚠️ 면책 조항

이 프로젝트는 학습 및 테스트 목적으로 만들어졌습니다. 프로덕션 환경에서 사용하기 전에 반드시 보안 검토를 수행하시기 바랍니다.

---

## 🙏 감사 인사

이 프로젝트는 다음 오픈소스 프로젝트들을 기반으로 합니다:
- [OWASP ModSecurity Core Rule Set](https://github.com/coreruleset/coreruleset)
- [ModSecurity-nginx](https://github.com/owasp-modsecurity/ModSecurity-nginx)
- [OWASP ModSecurity](https://github.com/owasp-modsecurity/ModSecurity)