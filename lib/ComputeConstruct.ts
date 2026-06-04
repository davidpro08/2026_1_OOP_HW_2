import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

// --- 컴퓨팅 모듈: EC2 + Security Group + S3 권한 연결 ---
export interface ComputeProps {
  vpc: ec2.IVpc;
  bucket: s3.IBucket;
}

export class ComputeConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ComputeProps) {
    super(scope, id);

    // 1. 퍼블릭 보안 그룹 (외부 HTTP 허용)
    const publicSg = new ec2.SecurityGroup(this, "PublicWebSG", {
      vpc: props.vpc,
    });
    publicSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP from Anywhere"
    );

    // 2. 프라이빗 보안 그룹 (네트워크 격리 강화: 오직 퍼블릭 EC2에서만 접근 허용)
    const privateSg = new ec2.SecurityGroup(this, "PrivateAppSG", {
      vpc: props.vpc,
    });
    privateSg.addIngressRule(
      publicSg,
      ec2.Port.tcp(80),
      "Allow HTTP only from Public Web"
    );

    // 3. 퍼블릭 서브넷에 배치되는 EC2 인스턴스 (제공하는 리소스)
    const publicInstance = new ec2.Instance(this, "PublicWebServer", {
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
      }),
      securityGroup: publicSg,
    });

    // 4. 프라이빗 서브넷에 배치되는 EC2 인스턴스 (숨기는 리소스)
    const privateInstance = new ec2.Instance(this, "PrivateAppServer", {
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
      }),
      securityGroup: privateSg,
    });

    // 5. 주입받은 버킷 객체와의 권한 통신 (메서드 호출 추상화)
    props.bucket.grantReadWrite(publicInstance.role);
    props.bucket.grantReadWrite(privateInstance.role);

    // 6. 명령형 쉘 스크립트 주입 (웹 서버 설치 및 구성)
    publicInstance.addUserData(
      "yum update -y",
      "yum install -y httpd",
      "systemctl start httpd",
      "systemctl enable httpd",
      `echo "<h1>Public Server: Connected to ${props.bucket.bucketName}</h1>" > /var/www/html/index.html`
    );
  }
}
