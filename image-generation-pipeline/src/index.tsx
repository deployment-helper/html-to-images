import { FC, JSX } from "react";
import { config } from "dotenv";
config();
import katori from "./katori";
import fs from "fs";
import path from "path";

const HelloWorld: FC = (): JSX.Element => (
  <div
    style={{
      display: "flex",
      width: "100%",
      height: "100%",
      fontWeight: "1200",
      fontSize: "50px",
      backgroundColor: "teal",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <h1>Hello World</h1>
  </div>
);

const component = <HelloWorld />;

const svg = await katori(component);

function writesvg(svg: string): string {
  const outDir = path.resolve(__dirname, "../output");

  const filename = `image-${Date.now()}.svg`;
  const filePath = path.join(outDir, filename);

  fs.writeFileSync(filePath, svg, "utf8");
  return filePath;
}
console.log(svg);
if (process.env.NODE_MODE !== "PRODUCTION") {
  await writesvg(svg);
  console.log("Input processed.");
}
