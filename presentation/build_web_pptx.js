// Exports the web deck as a PowerPoint file that looks the same: one full-slide picture per slide, with the speaker notes.
// The slides are pictures, so their text cannot be edited in PowerPoint; edit build_web.js and export again instead.
// Run:  node build_web.js && node build_web_pptx.js <folder of slide screenshots named 1.png, 2.png, ...>
// Screenshots (1920x1080 or larger, 16:9) can be taken with headless Chrome:
//   chrome --headless --window-size=1920,1080 --force-device-scale-factor=2 --screenshot=<folder>/N.png "file://.../ReviewLens_Presentation.html#N"
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const dir = process.argv[2];
if (!dir) throw new Error("give the folder with the slide screenshots");
const html = fs.readFileSync(path.join(__dirname, "ReviewLens_Presentation.html"), "utf8");
const unescape = (t) => t.replace(/<br>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");
const notes = [...html.matchAll(/<aside class="notes">([\s\S]*?)<\/aside>/g)].map((m) => unescape(m[1]));
const titles = [...html.matchAll(/<h2 class="title[^"]*">([\s\S]*?)<\/h2>/g)].map((m) => unescape(m[1]));
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "ReviewLens: Sentiment Classification of E-Commerce Product Reviews";
pres.author = "Bhone Kyaw Si Hein, Quoc Cuong Dinh, Longqi Sun";
notes.forEach((n, i) => {
  const img = path.join(dir, `${i + 1}.png`);
  if (!fs.existsSync(img)) throw new Error(`missing screenshot ${img}`);
  const s = pres.addSlide();
  s.addImage({ path: img, x: 0, y: 0, w: 10, h: 5.625, altText: titles[i] || `Slide ${i + 1}` });
  s.addNotes(n);
});
pres.writeFile({ fileName: path.join(__dirname, "ReviewLens_Presentation_WebStyle.pptx") }).then((f) => console.log("wrote", f, notes.length, "slides"));
