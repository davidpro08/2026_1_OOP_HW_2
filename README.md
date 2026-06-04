# 2026 OOP HW2

**1단계: 프로젝트 초기화**

빈 폴더를 생성하고 TypeScript 기반의 CDK 프로젝트를 초기화한다.

```bash
mkdir my-project
cd my-project
cdk init app --language typescript
```

**2단계: 코드 적용**

초기화가 끝나면 프로젝트 내 `lib/my-project-stack.ts` 파일 내용 전체를 지우고, 위의 수정된 코드를 그대로 붙여넣는다. 이후, `bin/my-project.ts`에서 호출하는 스택 이름을 `WebAppStack`으로 수정한다.

```tsx
#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { WebAppStack } from "../lib/WebAppStack";

const app = new cdk.App();
new WebAppStack(app, "WebAppStack", {});
```

**3단계: 환경 부트스트래핑 (최초 1회)**

AWS 계정과 리전에 CDK를 처음 배포하는 경우, 인프라 배포 상태를 저장할 S3 버킷 등의 기본 자원을 생성하기 위해 부트스트랩을 실행해야 한다.

```bash
cdk bootstrap
```

**4단계: 템플릿 합성 및 검증**

작성한 코드가 문법적으로 올바른지 검증하고 CloudFormation 템플릿으로 변환한다.

```bash
cdk synth
```

**5단계: 클라우드 배포**

실제 AWS 인프라에 리소스를 만든다. IAM 권한 및 보안 그룹 변경 사항이 화면에 출력되면 확인 후 `y`를 입력하여 배포를 진행한다.

```bash
cdk deploy
```

**6단계: 리소스 삭제 (실습 종료 후)**
모든 테스트가 끝난 후 반드시 아래 명령어를 입력해 인프라를 삭제한다. **필요 없는 인프라를 지우는 것은 필수이다.**

```bash
cdk destroy
```

### 4.3 Results

1. **모듈별 배포 및 네트워크 격리 확인:** AWS CloudFormation 콘솔에 접속하면 각 티어가 논리적으로 분리되어 생성됨을 볼 수 있다.
2. EC2 대시보드를 확인하면, `PublicWebServer` 인스턴스에는 외부 통신을 위한 공인(Public) IPv4 주소가 부여된 반면,`PrivateAppServer`에는 공인 IP가 일절 부여되지 않아 인터넷으로부터 원천적으로 숨겨져(Network Isolation) 있음을 입증한다.
3. **보안 및 통신 검증:** 각 EC2 인스턴스의 '보안(Security)' 탭을 확인하면 코드로 합성한 IAM Role이 정상적으로 부착되어 있으며, 내부 정책에는 주입받은 `AppBucket`에 대한 `s3:PutObject`, `s3:GetObject` 권한이 자동으로 매핑되어 있다.
4. **애플리케이션 접속 테스트:** 할당된 퍼블릭 EC2 인스턴스의 공인 IP를 웹 브라우저에 입력한다.
5. **결과 확인:** `addUserData`로 주입했던 쉘 스크립트가 성공적으로 동작하여 `Public Server: Connected to AppBucket-xxxxx`라는 인사말이 출력된다. 반면, 프라이빗 인스턴스는 외부 브라우저에서 직접 접근할 수 없으며 오직 퍼블릭 인스턴스를 거쳐서만 통신할 수 있다.
