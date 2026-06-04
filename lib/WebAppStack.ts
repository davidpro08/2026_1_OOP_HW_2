import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NetworkConstruct } from "./NetworkConstruct";
import { StorageConstruct } from "./StorageConstruct";
import { ComputeConstruct } from "./ComputeConstruct";

// --- Stack: Network → Storage → Compute 순으로 조립 ---
export class WebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. 독립적인 네트워크 및 스토리지 인스턴스화
    const network = new NetworkConstruct(this, "NetworkTier");
    const storage = new StorageConstruct(this, "StorageTier");

    // 2. 컴퓨팅 인스턴스화 및 객체 참조 전달 (의존성 주입)
    new ComputeConstruct(this, "ComputeTier", {
      vpc: network.vpc,
      bucket: storage.bucket,
    });
  }
}
