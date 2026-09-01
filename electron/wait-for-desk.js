const http = require("http");

function check(port) {
  return new Promise((resolve) => {
    const req = http.get(
      { host: "127.0.0.1", port, path: "/desk", timeout: 800 },
      (res) => {
        const ok = Boolean(res.statusCode && res.statusCode < 500);
        res.resume();
        resolve(ok);
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

(async () => {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    for (const port of [3000, 3001, 3002]) {
      if (await check(port)) process.exit(0);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  console.error("[petassist] desk is not running on :3000–:3002");
  process.exit(1);
})();
