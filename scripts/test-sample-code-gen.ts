import { db } from "@/lib/db";
import { generateSampleCode } from "@/lib/sample-code";

async function main() {
  const codes = await db.$transaction(async (tx) => {
    const a = await generateSampleCode(tx);
    const b = await generateSampleCode(tx);
    return [a, b];
  });

  console.log("Generated:", codes);
  console.assert(codes[0] !== codes[1], "Sequential codes must differ");
  console.assert(codes[0]!.slice(0, 12) === codes[1]!.slice(0, 12), "Same date prefix expected");
  console.log("test-sample-code-gen: PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
