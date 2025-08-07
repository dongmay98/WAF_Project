# OWASP CRS Docker 이미지

[![dockeri.co](http://dockeri.co/image/owasp/modsecurity-crs)](https://hub.docker.com/r/owasp/modsecurity-crs/)

[![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fcoreruleset%2Fmodsecurity-crs-docker%2Fbadge%3Fref%3Dmain&style=flat)](https://actions-badge.atrox.dev/coreruleset/modsecurity-crs-docker/goto?ref=main
) [![GitHub issues](https://img.shields.io/github/issues-raw/coreruleset/modsecurity-crs-docker.svg)](https://github.com/coreruleset/modsecurity-crs-docker/issues
) [![GitHub PRs](https://img.shields.io/github/issues-pr-raw/coreruleset/modsecurity-crs-docker.svg)](https://github.com/coreruleset/modsecurity-crs-docker/pulls
) [![License](https://img.shields.io/github/license/coreruleset/modsecurity-crs-docker.svg)](https://github.com/coreruleset/modsecurity-crs-docker/blob/master/LICENSE)

## OWASP CRS란 무엇인가

OWASP CRS는 ModSecurity 또는 호환 가능한 웹 애플리케이션 방화벽에서 사용할 수 있는 일반적인 공격 탐지 규칙 세트입니다.
ModSecurity는 Apache, IIS 및 Nginx용 오픈소스 크로스 플랫폼 웹 애플리케이션 방화벽(WAF) 엔진입니다.

## 지원되는 태그

### 안정 태그 (Stable Tags)

안정 태그는 다음으로 구성됩니다:
   * CRS 버전, `<major>[.<minor>[.<patch]]` 형식
   * 웹 서버 변형
   * OS 변형 (선택사항, nginx만)
   * 쓰기 가능 (선택사항)
   * 날짜, `YYYYMMDDHHMM` 형식

안정 태그 형식: `<CRS 버전>-<웹 서버>[-<os>][-<writable>]-<날짜>`
예제:
   * `4-nginx-202401121309`
   * `4.0-apache-alpine-202401121309`

### 롤링 태그 (Rolling Tags)

롤링 태그는 새로운 안정 태그가 릴리스될 때마다 업데이트됩니다. 롤링 태그는 실용적이지만 프로덕션 환경에서는 사용하지 않는 것이 좋습니다.

롤링 태그는 다음으로 구성됩니다:
   * 웹 서버 변형
   * OS 변형 (선택사항)
   * 쓰기 가능 (선택사항, nginx만)

롤링 태그 형식: `<웹 서버>[-<os>][-<writable>]`
예제:
   * `nginx`
   * `apache-alpine`

## OS 변형

* nginx – *Nginx 1.28.0 공식 안정 베이스 이미지 기반 최신 안정 ModSecurity v3, 최신 안정 OWASP CRS 4.17.0*
   * [nginx](https://github.com/coreruleset/modsecurity-crs-docker/blob/master/nginx/Dockerfile)
   * [nginx-alpine](https://github.com/coreruleset/modsecurity-crs-docker/blob/master/nginx/Dockerfile-alpine)
* Apache httpd – *Apache 2.4.65 공식 안정 베이스 이미지 기반 최신 안정 ModSecurity v2, 최신 안정 OWASP CRS 4.17.0*
   * [apache](https://github.com/coreruleset/modsecurity-crs-docker/blob/master/apache/Dockerfile)
   * [apache-alpine](https://github.com/coreruleset/modsecurity-crs-docker/blob/master/apache/Dockerfile-alpine)

## 읽기 전용 루트 파일시스템

> [!IMPORTANT]
> 읽기 전용 파일시스템 변형은 현재 nginx 기반 이미지에서만 사용할 수 있습니다.

기본적으로 컨테이너의 루트 파일시스템은 쓰기 가능합니다. 보안 강화를 위해 읽기 전용 파일시스템에서 실행되도록 설정된 이미지도 제공합니다.

예제:
   * `nginx-read-only`
   * `nginx-alpine-read-only`

### 이 이미지의 Openresty 버전에 관한 참고사항

* 유지보수자를 찾지 못해 해당 버전은 제거되었습니다.

## 지원되는 아키텍처

우리의 빌드는 공식 Apache httpd, nginx 및 Openresty 이미지를 기반으로 하므로, 이들이 지원하는 아키텍처만 지원할 수 있습니다.

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

단일 플랫폼에 대해만 특정 대상을 빌드하려면 (예제에서 대상 및 플랫폼 문자열을 원하는 것으로 바꾸세요):

```bash
docker buildx bake -f docker-bake.hcl --set "*.platform=linux/amd64" nginx-alpine-writable
```

### 이미지의 Openresty 버전에 관한 참고사항

Openresty 이미지 빌드는 현재 다음 아키텍처만 지원합니다:

* linux/amd64
* linux/arm64

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

ModSecurity는 Apache, IIS 및 Nginx용 오픈소스 크로스 플랫폼 웹 애플리케이션 방화벽(WAF) 엔진입니다. 웹 애플리케이션에 대한 다양한 공격으로부터 보호를 제공하고 HTTP 트래픽 모니터링, 로깅 및 실시간 분석을 가능하게 하는 강력한 이벤트 기반 프로그래밍 언어를 가지고 있습니다.

### Nginx 기반 이미지 주요 변경사항

| ⚠️ 경고          |
|:---------------------------|
| Nginx 기반 이미지는 이제 업스트림 nginx를 기반으로 합니다. 이로 인해 nginx 설정 파일이 생성되는 방식이 변경되었습니다.  |

[Nginx 환경 변수](https://github.com/coreruleset/modsecurity-crs-docker#nginx-env-variables) 사용만으로는 충분하지 않은 경우, 자체 `nginx.conf` 파일을 기본 설정 생성을 위한 새로운 템플릿으로 마운트할 수 있습니다.

예제는 [docker-compose](https://github.com/coreruleset/modsecurity-crs-docker/blob/master/docker-compose.yaml) 파일에서 확인할 수 있습니다.

> 💬 `/etc/nginx/conf.d/default.conf`와 같은 다른 파일에서 변경을 하고 싶다면 어떻게 해야 하나요?
> 로컬 파일(예: `nginx/default.conf`)을 새로운 템플릿으로 마운트하면 됩니다: `/etc/nginx/templates/conf.d/default.conf.template`. 다른 파일들도 마찬가지로 할 수 있습니다. templates 디렉토리의 파일들은 복사되고 하위 디렉토리는 보존됩니다.

nginx와 httpd 컨테이너 모두 이제 **비특권 사용자**로 실행됩니다. 이는 1024 미만의 포트에 바인딩할 수 없음을 의미하므로 `PORT` 및 `SSL_PORT` 설정을 수정해야 할 수 있습니다. 이제 nginx와 httpd 모두의 기본값은 `8080`과 `8443`입니다.

### 공통 환경 변수

이러한 변수들은 이미지 변형에 공통적이며 이미지 이름에 따라 기본값을 설정합니다.
| 이름 | 설명 | httpd 기본값 | nginx / Openresty 기본값 (다른 경우) |
| -- | -- | -- | -- |
| ACCESSLOG | 사용자 정의 로그 파일의 위치 | `/var/log/apache2/access.log` | `/var/log/nginx/access.log` |
| BACKEND | `ProxyPass` (httpd) 및 `proxy_pass` (nginx) 지시문의 원격 서버 부분 URL | `http://localhost:80` | - |
| ERRORLOG | 오류 로그 파일의 위치 | `/proc/self/fd/2` | - |
| LOGLEVEL | 오류 로그에 기록될 로그 메시지의 최소 레벨 | `warn` | - |
| METRICS_ALLOW_FROM | 메트릭에 액세스할 수 있는 IP 주소 범위 | `127.0.0.0/255.0.0.0 ::1/128` | `127.0.0.0/24` |
| METRICS_DENY_FROM | 메트릭에 액세스할 수 없는 IP 주소 범위 | `All` | `all` |
| METRICSLOG | 메트릭 로그 파일의 위치 | `/dev/null` | - |
| PROXY_SSL_CERT | 프록시된 서버의 PEM 인코딩된 X.509 인증서 데이터 파일 또는 토큰 식별자의 경로를 나타내는 문자열 | `/usr/local/apache2/conf/proxy.crt` | `/etc/nginx/conf/proxy.crt` |
| PROXY_SSL_CERT_KEY | 프록시된 서버의 PEM 인코딩된 개인 키 파일의 경로를 나타내는 문자열 | `/usr/local/apache2/conf/proxy.key` | `/etc/nginx/conf/proxy.key` |
| PROXY_SSL_CIPHERS| TLS를 통해 백엔드에 연결할 암호화 스위트를 나타내는 문자열 | `"ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384"` | - |
| PROXY_SSL_PROTOCOLS | 백엔드 연결에 사용할 TLS 프로토콜 | `"all -SSLv3 -TLSv1 -TLSv1.1"` | `TLSv1.2 TLSv1.3` |
| PROXY_SSL  | SSL 프록시 엔진 작동 스위치 | `off` | - |
| PROXY_SSL_VERIFY | 프록시 서버 인증서 검증 유형을 나타내는 문자열 값 | `none` | `off` |
| PROXY_TIMEOUT  | 프록시된 요청의 타임아웃 초 수 | `60` | `60s` |
| SERVER_NAME | 서버 이름 | `localhost` | - |
| SSL_CERT | 프록시된 서버의 PEM 인코딩된 X.509 인증서 데이터 파일 또는 토큰 식별자의 경로를 나타내는 문자열 | `/usr/local/apache2/conf/server.crt` | `/etc/nginx/conf/server.crt` |
| SSL_CERT_KEY | 프록시된 서버의 PEM 인코딩된 개인 키 파일의 경로를 나타내는 문자열 | `/usr/local/apache2/conf/server.key` | `/etc/nginx/conf/server.key` |
| SSL_CIPHERS| 수신 TLS 연결용 암호화 스위트를 나타내는 문자열 | `"ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384"` | - |
| SSL_OCSP_STAPLING | OCSP 스테이플링 활성화/비활성화 | `On` | `on` |
| SSL_PROTOCOLS | 백엔드 연결에 사용할 TLS 프로토콜 | `"all -SSLv3 -TLSv1 -TLSv1.1"` | `TLSv1.2 TLSv1.3` |

### Apache ENV Variables

| Name     | Description|
| -------- | ------------------------------------------------------------------- |
| APACHE_ALWAYS_TLS_REDIRECT | A string value indicating if http should redirect to https (Allowed values: `on`, `off`. Default: `off`) |
| APACHE_ERRORLOG_FORMAT | A string value indicating the `ErrorLogFormat` that Apache should use. (Default: `'"[%{u}t] [%-m:%l] [pid %P:tid %T] %7F: %E: [client\ %a] %M% ,\ referer\ %{Referer}i"'` |
| APACHE_LOGFORMAT | A string value indicating the LogFormat that apache should use. (Default: `'"%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-agent}i\""'` (combined). Tip: use single quotes outside your double quoted format string.) ⚠️ Do not add a `|` as part of the log format. It is used internally.  |
| APACHE_METRICS_LOGFORMAT | A string value indicating the LogFormat that the additional log apache metrics should use. (Default:'"%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-agent}i\""' (combined). Tip: use single quotes outside your double quoted format string.) ⚠️ Do not add a `|` as part of the log format. It is used internally.  |
| BACKEND_WS | A string indicating the IP/URL of the WebSocket service (Default: `ws://localhost:8081`) |
| H2_PROTOCOLS  | A string value indicating the protocols supported by the HTTP2 module (Default: `h2 http/1.1`) |
| MUTEX | Configure mutex and lock file directory for all specified mutexes (see [Mutex](https://httpd.apache.org/docs/2.4/mod/core.html#mutex)) (Default: `default`) |
| PORT | An int value indicating the port where the webserver is listening to | `8080` | - |
| PROXY_ERROR_OVERRIDE  | A string indicating that errors from the backend services should be overridden by this proxy server (see [ProxyErrorOverride](https://httpd.apache.org/docs/2.4/mod/mod_proxy.html#proxyerroroverride) directive). (Allowed values: `on`, `off`. Default: `on`) |
| PROXY_PRESERVE_HOST  | A string indicating the use of incoming Host HTTP request header for proxy request (Default: `on`) |
| PROXY_SSL_CA_CERT  | A string indicating the path to the PEM-encoded list of accepted CA certificates for the proxied server (Default: `/etc/ssl/certs/ca-certificates.ca`) |
| PROXY_SSL_CHECK_PEER_NAME  | A string indicating if the host name checking for remote server certificates is to be enabled (Default: `on`) |
| REMOTEIP_INT_PROXY  | A string indicating the client intranet IP addresses trusted to present the RemoteIPHeader value (Default: `10.1.0.0/16`) |
| REQ_HEADER_FORWARDED_PROTO  | A string indicating the transfer protocol of the initial request (Default: `https`) |
| SERVER_ADMIN  | A string value indicating the address where problems with the server should be e-mailed (Default: `root@localhost`) |
| SERVER_SIGNATURE | A string value configuring the footer on server-generated documents (Allowed values: `On`, `Off`, `EMail`. Default: `Off`) |
| SERVER_TOKENS | Option defining the server information presented to clients in the `Server` HTTP response header. Also see `MODSEC_SERVER_SIGNATURE`. (Allowed values: `Full`, `Prod[uctOnly]`, `Major`, `Minor`, `Min[imal]`, `OS`. Default: `Full`). |
| SSL_ENGINE  | A string indicating the SSL Engine Operation Switch (Default: `on`) |
| SSL_HONOR_CIPHER_ORDER | A string indicating if the server should [honor the cipher list provided by the client](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslhonorcipherorder) (Allowed values: `on`, `off`. Default: `off`) |
| SSL_PORT | Port number where the SSL enabled webserver is listening | `8443` | - |
| SSL_SESSION_TICKETS | A string to enable or disable the use of [TLS session tickets](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslsessiontickets) (RFC 5077). (Default: `off`) |
| TIMEOUT  | Number of seconds before receiving and sending timeout (Default: `60`) |
| WORKER_CONNECTIONS  | Maximum number of MPM request worker processes (Default: `400`) |

> [!NOTE]
> Apache access and metric logs can be disabled by exporting the `nologging=1` environment variable, or using `ACCESSLOG=/dev/null` and `METRICSLOG=/dev/null`.

### Nginx ENV Variables

| Name     | Description|
| -------- | ------------------------------------------------------------------- |
| CORS_HEADER_403_ALLOW_ORIGIN | The value of the [Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) header for `403` responses. Determines which origins can access the response. (Default: `"*"`). |
| CORS_HEADER_403_ALLOW_METHODS | The value of the [Access-Control-Request-Method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Method) header for `403` responses. Determines the allowed request methods for the resource. Default: `"GET, POST, PUT, DELETE, OPTIONS"` |
| CORS_HEADER_403_CONTENT_TYPE | The value of the  `Content-Type` header for `403` responses. Default: (`"text/plain"`) |
| CORS_HEADER_403_MAX_AGE | The value of the [Access-Control-Max-Age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age) header for `403` responses. The number of seconds that preflight requests for this resource may be cached by the browser. (Default: `3600`) |
| DNS_SERVER  | Deprecated. Use `RESOLVERS`.
| KEEPALIVE_TIMEOUT  | Number of seconds for a keep-alive client connection to stay open on the server side (Default: `60s`) |
| NGINX_ALWAYS_TLS_REDIRECT | A string value indicating if http should redirect to https (Allowed values: `on`, `off`. Default: `off`) |
| PORT | An int value indicating the port where the webserver is listening to | `8080` | We run as unprivileged user. |
| PROXY_SSL_VERIFY_DEPTH  | An integer value indicating the verification depth for the client certificate chain (Default: `1`) |
| REAL_IP_HEADER | Name of the header containing the real IP value(s) (Default: `X-REAL-IP`). See [real_ip_header](http://nginx.org/en/docs/http/ngx_http_realip_module.html#real_ip_header) |
| REAL_IP_PROXY_HEADER | Name of the header containing `$remote_addr` to be passed to proxy (Default: `X-REAL-IP`). See [proxy_set_header](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header) |
| REAL_IP_RECURSIVE | A string value indicating whether to use recursive replacement on addresses in `REAL_IP_HEADER` (Allowed values: `on`, `off`. Default: `on`). See [real_ip_recursive](http://nginx.org/en/docs/http/ngx_http_realip_module.html#real_ip_recursive) |
| RESOLVERS  | A string of one or more DNS server IP addresses (IPv4 or IPv6, space separated, with optional port number. See [nginx docs](https://nginx.org/en/docs/http/ngx_http_core_module.html#resolver)). The name servers are used to resolve names of upstream servers into addresses. If this variable is not set, the `nameserver` entry from `/etc/resolv.conf` will be used. For localhost backend the variable should not be set (Default: _not defined_) |
| RESOLVER_CONFIG  | A string of options for the `resolver` directive (see [nginx docs](https://nginx.org/en/docs/http/ngx_http_core_module.html#resolver)) (Default: `valid=5s`)
| SERVER_TOKENS | A boolean value for enabling / disabling emission of server identifying information in the `Server` HTTP response header and on error pages. (Allowed values: `on`, `off`, `build`. Default: `off`). |
| SET_REAL_IP_FROM | A string of comma separated IP, CIDR, or UNIX domain socket addresses that are trusted to replace addresses in `REAL_IP_HEADER` (Default: `127.0.0.1`). See [set_real_ip_from](http://nginx.org/en/docs/http/ngx_http_realip_module.html#set_real_ip_from) |
| SSL_DH_BITS | A numeric value indicating the size (in bits) to use for the generated DH-params file (Default 2048) |
| SSL_PORT | Port number where the SSL enabled webserver is listening | `8443` | We run as unprivileged user. |
| SSL_PREFER_CIPHERS | A string value indicating if the server ciphers should be preferred over client ciphers when using the SSLv3 and TLS protocols (Allowed values: `on`, `off`. Default: `off`)|
| SSL_VERIFY  | A string value indicating if the client certificates should be verified (Allowed values: `on`, `off`. Default: `off`) |
| SSL_VERIFY_DEPTH  | An integer value indicating the verification depth for the client certificate chain (Default: `1`) |
| WORKER_CONNECTIONS  | Maximum number of simultaneous connections that can be opened by a worker process (Default: `1024`) |

### Openresty ENV Variables

Openresty uses the same environment variables as the nginx version.

### ModSecurity ENV Variables

All these variables impact in configuration directives in the modsecurity engine running inside the container. The [reference manual](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-(v2.x)) has the extended documentation, and for your reference we list the specific directive we change when you modify the ENV variables for the container.

| Name     | Description|
| -------- | ------------------------------------------------------------------- |
| MODSEC_ARGUMENT_SEPARATOR | A character to use as the separator for `application/x-www-form-urlencoded` content. (Default: `&`). :warning: Do not touch unless you really know what you are doing. See [SecArgumentSeparator](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-%28v2.x%29#secargumentseparator) |
| MODSEC_ARGUMENTS_LIMIT | An integer indicating the maximum number of arguments that can be processed before setting the `REQBODY_ERROR` variable (Default `1000`). See [SecArgumentsLimit](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-%28v2.x%29#secargumentslimit)|
| MODSEC_AUDIT_ENGINE  | A string used to configure the audit engine, which logs complete transactions (Default: `RelevantOnly`). Accepted values: `On`, `Off`, `RelevantOnly`. See [SecAuditEngine](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-%28v2.x%29#SecAuditEngine) for additional information. |
| MODSEC_AUDIT_LOG  | A string indicating the path to the main audit log file or the concurrent logging index file (Default: `/dev/stdout`) |
| MODSEC_AUDIT_LOG_FORMAT  | A string indicating the output format of the AuditLogs (Default: `JSON`). Accepted values: `JSON`, `Native`. See [SecAuditLogFormat](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-%28v2.x%29#SecAuditLogFormat) for additional information. |
| MODSEC_AUDIT_LOG_PARTS  | A string that defines which parts of each transaction are going to be recorded in the audit log (Default: `'ABIJDEFHZ'`). See [SecAuditLogParts](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-(v2.x)#secauditlogparts) for the accepted values. |
| MODSEC_AUDIT_LOG_RELEVANT_STATUS | A regular expression string that defines the http error codes that are relevant for audit logging (Default: `"^(?:5|4(?!04))"`). See [SecAuditLogRelevantStatus](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-%28v2.x%29#secauditlogrelevantstatus) |
| MODSEC_AUDIT_LOG_TYPE  | A string indicating the type of audit logging mechanism to be used (Default: `Serial`). Accepted values: `Serial`, `Concurrent` (`HTTPS` works only on Nginx - v3). See [SecAuditLogType](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-%28v2.x%29#secauditlogtype) for additional information. |
| MODSEC_COOKIE_FORMAT | The cookie format used (Default: `0` use Netscape cookies) :warning: Do not touch unless you really know what you are doing. See [SecCookieFormat](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-%28v2.x%29#seccookieformat). |
| MODSEC_AUDIT_STORAGE_DIR  | A string indicating the directory where concurrent audit log entries are to be stored (Default: `/var/log/modsecurity/audit/`) |
| MODSEC_DATA_DIR  | A string indicating the path where persistent data (e.g., IP address data, session data, and so on) is to be stored (Default: `/tmp/modsecurity/data`) |
| MODSEC_DEBUG_LOG  | A string indicating the path to the ModSecurity debug log file (Default: `/dev/null`) |
| MODSEC_DEBUG_LOGLEVEL  | An integer indicating the verboseness of the debug log data (Default: `0`). Accepted values: `0` - `9`. See [SecDebugLogLevel](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-(v2.x)#secdebugloglevel). |
| MODSEC_DEFAULT_PHASE1_ACTION | ModSecurity string with the contents for the default action in phase 1 (Default: `'phase:1,log,auditlog,pass,tag:\'\${MODSEC_TAG}\''`) |
| MODSEC_DEFAULT_PHASE2_ACTION | ModSecurity string with the contents for the default action in phase 2 (Default: `'phase:2,log,auditlog,pass,tag:\'\${MODSEC_TAG}\''`) |
| MODSEC_DISABLE_BACKEND_COMPRESSION  | A string indicating whether or not to disable backend compression (Default: `On`). Allowed values: `On`, `Off`. See [SecDisableBackendCompression](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-(v2.x)#secdisablebackendcompression) for more. Only supported in ModSecurity 2.x, will have no effect on 3.x |
| MODSEC_PCRE_MATCH_LIMIT  | An integer value indicating the limit for the number of internal executions in the PCRE function (Default: `100000`) (Only valid for Apache - v2). See [SecPcreMatchLimit](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-(v2.x)#SecPcreMatchLimit) |
| MODSEC_PCRE_MATCH_LIMIT_RECURSION  | An integer value indicating the limit for the depth of recursion when calling PCRE function (Default: `100000`) |
| MODSEC_REQ_BODY_ACCESS  | A string value allowing ModSecurity to access request bodies (Default: `On`). Allowed values: `On`, `Off`. See [SecRequestBodyAccess](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-(v2.x)#secrequestbodyaccess) for more information. |
| MODSEC_REQ_BODY_JSON_DEPTH_LIMIT | An integer value indicating the maximum JSON request depth (Default: `512`). See [SecRequestBodyJsonDepthLimit](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-%28v2.x%29#SecRequestBodyJsonDepthLimit) for additional information. |
| MODSEC_REQ_BODY_LIMIT_ACTION  | A string value for the action when `SecRequestBodyLimit` is reached (Default: `Reject`). Accepted values: `Reject`, `ProcessPartial`. See [SecRequestBodyLimitAction](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-(v2.x)#secrequestbodylimitaction) for additional information. |
| MODSEC_REQ_BODY_LIMIT  | An integer value indicating the maximum request body size  accepted for buffering (Default: `13107200`). See [SecRequestBodyLimit](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-(v2.x)#secrequestbodylimit) for additional information. |
| MODSEC_REQ_BODY_NOFILES_LIMIT  | An integer indicating the maximum request body size ModSecurity will accept for buffering (Default: `131072`). See [SecRequestBodyNoFilesLimit](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-(v2.x)#secrequestbodynofileslimit) for more information. |
| MODSEC_RESP_BODY_ACCESS  | A string value allowing ModSecurity to access response bodies (Default: `On`). Allowed values: `On`, `Off`. See [SecResponseBodyAccess](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-%28v2.x%29#secresponsebodyaccess) for more information. |
| MODSEC_RESP_BODY_LIMIT_ACTION  | A string value for the action when `SecResponseBodyLimit` is reached (Default: `ProcessPartial`). Accepted values: `Reject`, `ProcessPartial`. See [SecResponseBodyLimitAction](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-(v2.x)#secresponsebodylimitaction) for additional information. |
| MODSEC_RESP_BODY_LIMIT  | An integer value indicating the maximum response body size accepted for buffering (Default: `1048576`) |
| MODSEC_RESP_BODY_MIMETYPE  | A string with the list of mime types that will be analyzed in the response (Default: `'text/plain text/html text/xml'`). You might consider adding `application/json` documented [here](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-\(v2.x\)#secresponsebodymimetype). |
| MODSEC_RULE_ENGINE  | A string value enabling ModSecurity itself (Default: `On`). Accepted values: `On`, `Off`, `DetectionOnly`. See [SecRuleEngine](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-%28v2.x%29#secruleengine) for additional information. |
| MODSEC_SERVER_SIGNATURE  | Sets the directive [SecServerSignature](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-%28v2.x%29#secserversignature) and instructs ModSecurity to change the data presented in the "Server:" response header token when Apache `ServerTokens` directive is set to `Full`. Also see Apache `SERVER_TOKENS`. Only supported in ModSecurity 2.x, will have no effect on 3.x. (Default: `Apache`). |
| MODSEC_STATUS_ENGINE  | A string used to configure the status engine, which sends statistical information (Default: `Off`). Accepted values: `On`, `Off`. See [SecStatusEngine](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-%28v2.x%29#SecStatusEngine) for additional information. |
| MODSEC_TAG  | A string indicating the default tag action, which will be inherited by the rules in the same configuration context (Default: `modsecurity`) |
| MODSEC_TMP_DIR  | A string indicating the path where temporary files will be created (Default: `/tmp/modsecurity/tmp`) |
| MODSEC_TMP_SAVE_UPLOADED_FILES  | A string indicating if temporary uploaded files are saved (Default: `On`) (only relevant in Apache - ModSecurity v2) |
| MODSEC_UNICODE_MAPPING | The unicode Code Point to use form the default file(Default: `20127`). See [SecUnicodeMapFile](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-%28v2.x%29#secunicodemapfile) |
| MODSEC_UPLOAD_DIR  | A string indicating the path where intercepted files will be stored (Default: `/tmp/modsecurity/upload`) |
| MODSEC_UPLOAD_FILE_MODE | (Default: `0600`) |
| MODSEC_UPLOAD_KEEP_FILES | Configures whether or not the intercepted files will be kept after transaction is processed.  (Default: `RelevantOnly` on Apache, `Off` on nginx) Accepted values: `On`, `Off`, `RelevantOnly` (only modsec2). See [SecUploadKeepFiles](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-%28v2.x%29#secuploadkeepfiles) and [libmodsecurity3](https://github.com/owasp-modsecurity/ModSecurity/wiki/Reference-Manual-%28v3.x%29#secuploadkeepfiles)

### CRS specific

| Name     | Description|
| -------- | ------------------------------------------------------------------- |
| ALLOWED_HTTP_VERSIONS | A string indicating the allowed_http_versions (Default: `HTTP/1.0 HTTP/1.1 HTTP/2 HTTP/2.0`) |
| ALLOWED_METHODS | A string indicating the allowed_methods (Default: `GET HEAD POST OPTIONS`) |
| ALLOWED_REQUEST_CONTENT_TYPE | A string indicating the allowed_request_content_type (Default: `\|application/x-www-form-urlencoded\| \|multipart/form-data\| \|multipart/related\| \|text/xml\| \|application/xml\| \|application/soap+xml\| \|application/json\| \|application/cloudevents+json\| \|application/cloudevents-batch+json\|`) |
| ALLOWED_REQUEST_CONTENT_TYPE_CHARSET | A string indicating the allowed_request_content_type_charset (Default: `\|utf-8\| \|iso-8859-1\| \|iso-8859-15\| \|windows-1252\|`) |
| ANOMALY_INBOUND | An integer indicating the inbound_anomaly_score_threshold (Default: `5`) |
| ANOMALY_OUTBOUND | An integer indicating the outbound_anomaly_score_threshold (Default: `4`) |
| ARG_LENGTH | An integer indicating the arg_length (Default: `unlimited`) |
| ARG_NAME_LENGTH | An integer indicating the arg_name_length (Default: `unlimited`) |
| BLOCKING_PARANOIA | (:new: Replaces `PARANOIA` in CRSv4) An integer indicating the paranoia level (Default: `1`) |
| COMBINED_FILE_SIZES | An integer indicating the combined_file_sizes (Default: `unlimited`) |
| CRS_DISABLE_PLUGINS | A boolean indicating whether plugins will be **disabled** (Only from v4 and up. Default: `0`) |
| CRS_ENABLE_TEST_MARKER | A boolean indicating whether to write test markers to the log file (Used for running the CRS test suite. Default: `0`) |
| DETECTION_PARANOIA | (:new: Replaces `EXECUTING_PARANOIA` in CRSv4) An integer indicating the detection_paranoia_level (Default: `BLOCKING_PARANOIA`) |
| ENFORCE_BODYPROC_URLENCODED | A boolean indicating the enforce_bodyproc_urlencoded (Default: `0`) |
| EXECUTING_PARANOIA | An integer indicating the executing_paranoia_level (Default: `PARANOIA`) |
| MANUAL_MODE | A boolean indicating that you are providing your own `crs-setup.conf` file mounted as volume. (Default: `0`). ⚠️ None of the following variables are used if you set it to `1`. |
| MAX_FILE_SIZE | An integer indicating the max_file_size (Default: `unlimited`) |
| MAX_NUM_ARGS | An integer indicating the max_num_args (Default: `unlimited`) |
| PARANOIA | An integer from `1` through `4`, indicating the paranoia level (Default: `1`) |
| REPORTING_LEVEL | An integer from `0` through `5`, indicating the level of verbosity when reporting anomaly scores. See [rule 900115](https://github.com/coreruleset/coreruleset/blob/1a8f408ea730c7447e0dbb009ac3cef88368f74e/crs-setup.conf.example#L349) for details. (Default: `4`) |
| RESTRICTED_EXTENSIONS | A string indicating the restricted_extensions (Default: `.asa/ .asax/ .ascx/ .axd/ .backup/ .bak/ .bat/ .cdx/ .cer/ .cfg/ .cmd/ .com/ .config/ .conf/ .cs/ .csproj/ .csr/ .dat/ .db/ .dbf/ .dll/ .dos/ .htr/ .htw/ .ida/ .idc/ .idq/ .inc/ .ini/ .key/ .licx/ .lnk/ .log/ .mdb/ .old/ .pass/ .pdb/ .pol/ .printer/ .pwd/ .rdb/ .resources/ .resx/ .sql/ .swp/ .sys/ .vb/ .vbs/ .vbproj/ .vsdisco/ .webinfo/ .xsd/ .xsx/`) |
| RESTRICTED_HEADERS_BASIC | A string indicating the restricted_headers_basic (Default: `/content-encoding/ /proxy/ /lock-token/ /content-range/ /if/ /x-http-method-override/ /x-http-method/ /x-method-override/`) |
| RESTRICTED_HEADERS_EXTENDED | A string indicating the restricted_headers_extended (Default: `/accept-charset/`) |
| STATIC_EXTENSIONS | A string indicating the static_extensions (Default: `/.jpg/ /.jpeg/ /.png/ /.gif/ /.js/ /.css/ /.ico/ /.svg/ /.webp/`) |
| TOTAL_ARG_LENGTH | An integer indicating the total_arg_length (Default: `unlimited`) |
| VALIDATE_UTF8_ENCODING | A boolean indicating the crs_validate_utf8_encoding (Default: `0`) |

## TLS/HTTPS

> [!IMPORTANT]  
> The default configuration generates a self signed certificate on first run. To use your own certificates (recommended) `COPY` or mount (`-v`) your `server.crt` and `server.key` into `/usr/local/apache2/conf/` or `/etc/nginx/conf/`. Remember to publish the HTTPS port when running the image.
>
> ```bash
> docker build -t my-modsec .
> docker run -p 8443:8443 my-modsec
> ```

TLS is configured on port `8443` and enabled by default.

We use sane intermediate defaults taken from the [Mozilla SSL config tool](https://ssl-config.mozilla.org/). Please review the defaults and choose the ones that best match your needs.

You can set the `*_ALWAYS_TLS_REDIRECT` environment variables to always redirect from `http` to `https`.

## Proxy Configuration

The owasp/modsecurity-crs container images in their default configuration (i.e., without manual changes to / overrides of configuration files) act as reverse proxies and require a running backend at the address specified through the `BACKEND` environment variable.

> [!IMPORTANT]
> Make sure to set the `BACKEND` variable to an address where a web server is listening. Otherwise nothing useful will happen when you send requests to the owasp/modsecurity-crs container (at least not with the default configuration).

ModSecurity is often used in a reverse proxy setup with the following properties:
- reverse proxy acts as public end point
- reverse proxy performs TLS termination (necessary for ModSecurity to inspect content)
- ModSecurity runs on the reverse proxy to filter traffic
- only benign traffic is passed to the backend

This allows one to use ModSecurity without modifying the webserver hosting the underlying application and also protects web servers that ModSecurity cannot currently be embedded into.

Tips:
* the application web server (the one receiving traffic from the reverse proxy) should not listen on a public interface. Only the reverse proxy should be exposed to the public. With Docker, this could mean setting up a network for both containers and only exposing the reverse proxy with `-p 8080:8080`, for example. `docker compose` takes care of this automatically. See the `docker-compose.yaml` for an example setup.

```bash
docker build -t my-modsec . -f
docker run -p 8080:8080 -e BACKEND=http://example.com my-modsec
```

## ServerName

It is often convenient to set your server name (set to `localhost` by default). To do this simply use the `SERVER_NAME` environment variable.

```bash
docker build -t modsec .
docker run -p 8080:8080 -e SERVER_NAME=myhost my-modsec
```

## ModSecurity CRS Tuning

There are two possible ways to pass ModSecurity CRS tuning rules to the container:

* To map the ModSecurity tuning file(s) via volumes into the container during the run command
* To copy the ModSecurity tuning file(s) into the created container and then start the container

### Map ModSecurity tuning file via volume

```bash
docker run -dti --rm \
   -p 8080:8080 \
   -v /path/to/REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf:/etc/modsecurity.d/owasp-crs/rules/REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf \
   -v /path/to/RESPONSE-999-EXCLUSION-RULES-AFTER-CRS.conf:/etc/modsecurity.d/owasp-crs/rules/RESPONSE-999-EXCLUSION-RULES-AFTER-CRS.conf \
   owasp/modsecurity-crs:apache
```

### Copy ModSecurity tuning file into created container

This example can be helpful when no volume mounts are possible (some CI pipelines).

```bash
docker create -ti --name modseccrs \
   -p 8080:8080 \
   owasp/modsecurity-crs:apache

docker cp /path/to/RESPONSE-999-EXCLUSION-RULES-AFTER-CRS.conf \
   modseccrs:/etc/modsecurity.d/owasp-crs/rules/RESPONSE-999-EXCLUSION-RULES-AFTER-CRS.conf

docker start modseccrs
```

## Full docker run example of possible setup

The following example illustrates how to use `docker run` with some of the variables. Its purpose is illustration only and it should not be used to run a container in production.

Some important things to note:
- Error and audit logs are enabled and mapped to files on the host, so that their contents are accessible and don't pollute the container filesystem. Docker requires these files to exist, otherwise they would be created as directories, hence the use of the `touch ...` commands.
- For containers with read-only filesystems, the volumes might have to be specified differently, e.g., using `tmpfs`. Alternatively, if only one log output is required, the output could be redirected to `stdout` (`/proc/self/fd/2`).
- The example expects a backend web server to be running at `localhost:8081`.

```bash
touch /tmp/host-fs-auditlog.log
touch /tmp/host-fs-errorlog.log
docker run \
   -dti \
   -p 8080:8080 \
   --rm \
   -v /tmp/host-fs-auditlog.log:/var/log/modsec_audit.log \
   -v /tmp/host-fs-errorlog.log:/var/log/modsec_error.log \
   -e MODSEC_AUDIT_ENGINE=on \
   -e MODSEC_AUDIT_LOG=/var/log/modsec_audit.log \
   -e LOGLEVEL=warn \
   -e ERRORLOG=/var/log/modsec_error.log \
   -e BLOCKING_PARANOIA=2 \
   -e DETECTION_PARANOIA=2 \
   -e ENFORCE_BODYPROC_URLENCODED=1 \
   -e ANOMALY_INBOUND=10 \
   -e ANOMALY_OUTBOUND=5 \
   -e ALLOWED_METHODS="GET POST PUT" \
   -e ALLOWED_REQUEST_CONTENT_TYPE="text/xml|application/xml|text/plain" \
   -e ALLOWED_REQUEST_CONTENT_TYPE_CHARSET="utf-8|iso-8859-1" \
   -e ALLOWED_HTTP_VERSIONS="HTTP/1.1 HTTP/2 HTTP/2.0" \
   -e RESTRICTED_EXTENSIONS=".cmd/ .com/ .config/ .dll/" \
   -e RESTRICTED_HEADERS="/proxy/ /if/" \
   -e STATIC_EXTENSIONS="/.jpg/ /.jpeg/ /.png/ /.gif/" \
   -e MAX_NUM_ARGS=128 \
   -e ARG_NAME_LENGTH=50 \
   -e ARG_LENGTH=200 \
   -e TOTAL_ARG_LENGTH=6400 \
   -e MAX_FILE_SIZE=100000 \
   -e COMBINED_FILE_SIZES=1000000 \
   -e TIMEOUT=60 \
   -e SERVER_ADMIN=root@localhost \
   -e SERVER_NAME=localhost \
   -e PORT=8080 \
   -e MODSEC_RULE_ENGINE=on \
   -e MODSEC_REQ_BODY_ACCESS=on \
   -e MODSEC_REQ_BODY_LIMIT=13107200 \
   -e MODSEC_REQ_BODY_NOFILES_LIMIT=131072 \
   -e MODSEC_RESP_BODY_ACCESS=on \
   -e MODSEC_RESP_BODY_LIMIT=524288 \
   -e MODSEC_PCRE_MATCH_LIMIT=1000 \
   -e MODSEC_PCRE_MATCH_LIMIT_RECURSION=1000 \
   -e VALIDATE_UTF8_ENCODING=1 \
   -e CRS_ENABLE_TEST_MARKER=1 \
   -e BACKEND="http://localhost:8081" \
   owasp/modsecurity-crs:apache
```

## Kubernetes

:warning: If you see this error in your k8s deployment logs:

```
...
/docker-entrypoint.d/20-envsubst-on-templates.sh: 53: envsubst: Argument list too long
```

This happens because kubernetes is injecting service related environment variables. Adding `enableServiceLinks: false` in your pod spec, solves the problem:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
spec:
  replicas: 1
  template:
    spec:
      enableServiceLinks: false
      containers:
        - name: my-container
          image: owasp/modsecurity-crs:4.8.0-nginx-202411071011
```
