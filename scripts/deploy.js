import { ContractFactory, JsonRpcProvider } from "ethers";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/IdentityRegistry.sol/IdentityRegistry.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const provider = new JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await provider.getSigner(0);
  const Factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address  = await contract.getAddress();
  console.log("✅ IdentityRegistry deployed to:", address);

  const info     = JSON.stringify({ address, abi: artifact.abi }, null, 2);

  // Save for backend
  const backendDir = path.join(__dirname, "../backend");
  if (!fs.existsSync(backendDir)) fs.mkdirSync(backendDir, { recursive: true });
  fs.writeFileSync(path.join(backendDir, "contract_info.json"), info);

  // Save for frontend
  const frontendDir = path.join(__dirname, "../frontend/src");
  if (!fs.existsSync(frontendDir)) fs.mkdirSync(frontendDir, { recursive: true });
  fs.writeFileSync(path.join(frontendDir, "contract_info.json"), info);

  console.log("✅ ABI saved to backend/ and frontend/src/");
}

main().catch((e) => { console.error(e); process.exit(1); });
