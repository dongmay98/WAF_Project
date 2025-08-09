# OWASP CRS Docker 이미지

[![dockeri.co](http://dockeri.co/image/owasp/modsecurity-crs)](https://hub.docker.com/r/owasp/modsecurity-crs/)

[![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fcoreruleset%2Fmodsecurity-crs-docker%2Fbadge%3Fref%3Dmain&style=flat)](https://actions-badge.atrox.dev/coreruleset/modsecurity-crs-docker/goto?ref=main
) [![GitHub issues](https://img.shields.io/github/issues-raw/coreruleset/modsecurity-crs-docker.svg)](https://github.com/coreruleset/modsecurity-crs-docker/issues
) [![GitHub PRs](https://img.shields.io/github/issues-pr-raw/coreruleset/modsecurity-crs-docker.svg)](https://github.com/coreruleset/modsecurity-crs-docker/pulls
) [![License](https://img.shields.io/github/license/coreruleset/modsecurity-crs-docker.svg)](https://github.com/coreruleset/modsecurity-crs-docker/blob/master/LICENSE)

## OWASP CRS란 무엇인가

OWASP CRS는 ModSecurity 또는 호환 가능한 웹 애플리케이션 방화벽에서 사용할 수 있는 일반적인 공격 탐지 규칙 세트입니다.
ModSecurity는 Nginx용 오픈소스 크로스 플랫폼 웹 애플리케이션 방화벽(WAF) 엔진입니다.

## 지원되는 태그

### 안정 태그 (Stable Tags)

안정 태그는 다음으로 구성됩니다:
   * CRS 버전, `<major>[.<minor>[.<patch]]` 형식
   * 웹 서버 변형 (nginx)
   * OS 변형 (선택사항)
   * 쓰기 가능 (선택사항)
   * 날짜, `YYYYMMDDHHMM` 형식

안정 태그 형식: `<CRS 버전>-<웹 서버>[-<os>][-<writable>]-<날짜>`
예제:
   * `4-nginx-202401121309`
   * `4.0-nginx-alpine-202401121309`

### 롤링 태그 (Rolling Tags)

롤링 태그는 새로운 안정 태그가 릴리스될 때마다 업데이트됩니다. 롤링 태그는 실용적이지만 프로덕션 환경에서는 사용하지 않는 것이 좋습니다.

롤링 태그는 다음으로 구성됩니다:
   * 웹 서버 변형 (nginx)
   * OS 변형 (선택사항)
   * 쓰기 가능 (선택사항)

롤링 태그 형식: `<웹 서버>[-<os>][-<writable>]`
예제:
   * `nginx`
   * `nginx-alpine`

## OS 변형

* nginx – *Nginx 1.28.0 공식 안정 베이스 이미지 기반 최신 안정 ModSecurity v3, 최신 안정 OWASP CRS 4.17.0*
   * [nginx](https://github.com/coreruleset/modsecurity-crs-docker/blob/master/nginx/Dockerfile)
   * [nginx-alpine](https://github.com/coreruleset/modsecurity-crs-docker/blob/master/nginx/Dockerfile-alpine)

## 읽기 전용 루트 파일시스템

> [!IMPORTANT]
> 읽기 전용 파일시스템 변형은 현재 nginx 기반 이미지에서만 사용할 수 있습니다.

기본적으로 컨테이너의 루트 파일시스템은 쓰기 가능합니다. 보안 강화를 위해 읽기 전용 파일시스템에서 실행되도록 설정된 이미지도 제공합니다.

예제:
   * `nginx-read-only`
   * `nginx-alpine-read-only`

## 지원되는 아키텍처

우리의 빌드는 공식 nginx 이미지를 기반으로 하므로, nginx가 지원하는 아키텍처만 지원할 수 있습니다.

현재 다음 아키텍처에 대한 이미지를 제공합니다:

* linux/amd64
* linux/arm/v7
* linux/arm64/v8
* linux/i386

### 빌딩

빌드 대상을 확인하려면 다음을 사용하세요:

```bash
docker buildx bake -f ./docker-bake.hcl --print
```

선택한 플랫폼에 대해 빌드하려면 다음 예제를 사용하세요:

```bash
docker buildx create --use --platform linux/amd64,linux/i386,linux/arm64,linux/arm/v7
docker buildx bake -f docker-bake.hcl
```

단일 플랫폼에 대해서만 특정 대상을 빌드하려면 (예제에서 대상 및 플랫폼 문자열을 원하는 것으로 바꾸세요):

```bash
docker buildx bake -f docker-bake.hcl --set "*.platform=linux/amd64" nginx-alpine-writable
```

## 컨테이너 헬스 체크

🆕 이미지에 헬스체크를 추가하여 컨테이너가 `/healthz` 엔드포인트에서 HTTP 상태 코드 200을 반환하도록 했습니다. 컨테이너에 헬스체크가 지정되면 정상 상태 외에 _건강 상태_를 가지게 됩니다. 이 상태는 초기에 `starting`입니다. 헬스 체크가 통과될 때마다 `healthy`가 됩니다(이전 상태가 무엇이든 상관없이). 연속으로 일정 횟수 실패하면 `unhealthy`가 됩니다. 자세한 정보는 <https://docs.docker.com/engine/reference/builder/#healthcheck>를 참조하세요.

## CRS 버전

> 이전에 컨테이너와 함께 특정 git 버전을 사용했는데 어떻게 된 건가요?

원하는 버전을 가져와서 docker volumes를 사용하면 동일한 결과를 얻을 수 있습니다. 이 예제를 참조하세요:

```bash
git clone https://github.com/coreruleset/coreruleset.git myrules
cd myrules
git checkout ac2a0d1
docker run -p 8080:8080 -ti -e BLOCKING_PARANOIA=4 -v rules:/opt/owasp-crs/rules:ro --rm owasp/modsecurity-crs
```

## 빠른 참조

* **도움을 받을 곳**: [OWASP CRS 컨테이너 리포지토리](https://github.com/coreruleset/modsecurity-crs-docker), [OWASP CRS Slack 채널](https://owasp.org/slack/invite) (owasp.slack.com의 #coreruleset), 또는 [Stack Overflow](https://stackoverflow.com/questions/tagged/mod-security)

* **이슈를 제출할 곳**: [OWASP CRS 컨테이너 리포지토리](https://github.com/coreruleset/modsecurity-crs-docker)

* **유지보수**: CRS 프로젝트 유지보수자들

## ModSecurity란 무엇인가

ModSecurity는 Nginx용 오픈소스 크로스 플랫폼 웹 애플리케이션 방화벽(WAF) 엔진입니다. 웹 애플리케이션에 대한 다양한 공격으로부터 보호를 제공하고 HTTP 트래픽 모니터링, 로깅 및 실시간 분석을 가능하게 하는 강력한 이벤트 기반 프로그래밍 언어를 가지고 있습니다.

### Nginx 기반 이미지 주요 변경사항

| ⚠️ 경고          |
|:---------------------------|
| Nginx 기반 이미지는 이제 업스트림 nginx를 기반으로 합니다. 이로 인해 nginx 설정 파일이 생성되는 방식이 변경되었습니다.  |

[Nginx 환경 변수](https://github.com/coreruleset/modsecurity-crs-docker#nginx-env-variables) 사용만으로는 충분하지 않은 경우, 자체 `nginx.conf` 파일을 기본 설정 생성을 위한 새로운 템플릿으로 마운트할 수 있습니다.

예제는 [docker-compose](https://github.com/coreruleset/modsecurity-crs-docker/blob/master/docker-compose.yaml) 파일에서 확인할 수 있습니다.

> 💬 `/etc/nginx/conf.d/default.conf`와 같은 다른 파일에서 변경을 하고 싶다면 어떻게 해야 하나요?
> 로컬 파일(예: `nginx/default.conf`)을 새로운 템플릿으로 마운트하면 됩니다: `/etc/nginx/templates/conf.d/default.conf.template`. 다른 파일들도 마찬가지로 할 수 있습니다. templates 디렉토리의 파일들은 복사되고 하위 디렉토리는 보존됩니다.

nginx 컨테이너는 이제 **비특권 사용자**로 실행됩니다. 이는 1024 미만의 포트에 바인딩할 수 없음을 의미하므로 `PORT` 및 `SSL_PORT` 설정을 수정해야 할 수 있습니다. 이제 nginx의 기본값은 `8080`과 `8443`입니다.

## TLS/HTTPS

> [!IMPORTANT]  
> 기본 설정은 처음 실행 시 자체 서명된 인증서를 생성합니다. 자체 인증서를 사용하려면(권장) `server.crt`와 `server.key`를 `/etc/nginx/conf/`에 복사하거나 마운트(`-v`)하세요. 이미지 실행 시 HTTPS 포트를 게시하는 것을 잊지 마세요.
>
> ```bash
> docker build -t my-modsec .
> docker run -p 8443:8443 my-modsec
> ```

TLS는 `8443` 포트에 구성되며 기본적으로 활성화됩니다.

[Mozilla SSL config tool](https://ssl-config.mozilla.org/)에서 가져온 합리적인 중간 기본값을 사용합니다. 기본값을 검토하고 요구사항에 가장 적합한 것을 선택하세요.

`NGINX_ALWAYS_TLS_REDIRECT` 환경 변수를 설정하여 `http`에서 `https`로 항상 리다이렉트할 수 있습니다.

## 프록시 구성

owasp/modsecurity-crs 컨테이너 이미지는 기본 구성(즉, 설정 파일의 수동 변경이나 재정의 없이)에서 리버스 프록시로 작동하며 `BACKEND` 환경 변수를 통해 지정된 주소에서 실행 중인 백엔드가 필요합니다.

> [!IMPORTANT]
> `BACKEND` 변수를 웹 서버가 수신 대기하는 주소로 설정해야 합니다. 그렇지 않으면 owasp/modsecurity-crs 컨테이너에 요청을 보낼 때 유용한 일이 일어나지 않습니다(최소한 기본 구성에서는).

ModSecurity는 다음과 같은 속성을 가진 리버스 프록시 설정에서 자주 사용됩니다:
- 리버스 프록시가 공개 엔드포인트 역할
- 리버스 프록시가 TLS 종료 수행(ModSecurity가 콘텐츠를 검사하는 데 필요)
- ModSecurity가 리버스 프록시에서 실행되어 트래픽 필터링
- 정상적인 트래픽만 백엔드로 전달

이를 통해 기본 애플리케이션을 호스팅하는 웹서버를 수정하지 않고 ModSecurity를 사용할 수 있으며, ModSecurity를 현재 임베드할 수 없는 웹 서버도 보호할 수 있습니다.

## 실제 사용 예제

다음은 nginx 기반 WAF 프로젝트의 docker-compose.yaml 예제입니다:

```yaml
version: '3.8'

services:
  waf:
    image: owasp/modsecurity-crs:nginx
    ports:
      - "8080:8080"
      - "8443:8443"
    environment:
      # WAF 기본 설정
      BACKEND: http://backend:80
      
      # 보안 레벨 설정
      BLOCKING_PARANOIA: 2
      DETECTION_PARANOIA: 2
      
      # 이상 점수 임계값
      ANOMALY_INBOUND: 10
      ANOMALY_OUTBOUND: 5
      
      # ModSecurity 설정
      MODSEC_RULE_ENGINE: "On"
      MODSEC_AUDIT_ENGINE: "RelevantOnly"
      MODSEC_AUDIT_LOG_FORMAT: "JSON"
      
      # Nginx 설정
      NGINX_ALWAYS_TLS_REDIRECT: "off"
      KEEPALIVE_TIMEOUT: "60s"
      WORKER_CONNECTIONS: "1024"
      
    volumes:
      - ./REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf:/etc/modsecurity.d/owasp-crs/rules/REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf
      - ./RESPONSE-999-EXCLUSION-RULES-AFTER-CRS.conf:/etc/modsecurity.d/owasp-crs/rules/RESPONSE-999-EXCLUSION-RULES-AFTER-CRS.conf

  backend:
    image: nginx:alpine
    expose:
      - "80"
```

이 예제는 nginx WAF가 백엔드 서비스 앞에서 보안 필터링을 수행하는 구성을 보여줍니다.