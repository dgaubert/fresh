import { FreshApp } from "@fresh/core";
import { ComponentChildren } from "preact";
import * as path from "@std/path";
import { Counter } from "./fixtures_islands/Counter.tsx";
import { JsonIsland } from "./fixtures_islands/JsonIsland.tsx";
import { NullIsland } from "./fixtures_islands/NullIsland.tsx";
import { Multiple1, Multiple2 } from "./fixtures_islands/Multiple.tsx";
import { signal } from "@preact/signals";
import { withBrowserApp } from "./test_utils.ts";
import { FreshScripts } from "../src/runtime/server/mod.tsx";
import { waitForText } from "./test_utils.ts";
import { freshStaticFiles } from "../src/middlewares/static_files.ts";
import { expect } from "$fresh-testing-library/expect.ts";

function Doc(props: { children?: ComponentChildren }) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Test</title>
      </head>
      <body>
        {props.children}
        <FreshScripts />
      </body>
    </html>
  );
}

function getIsland(pathname: string) {
  return path.join(
    import.meta.dirname!,
    "fixtures_islands",
    pathname,
  );
}

Deno.test("islands - should make signals interactive", async () => {
  const counterIsland = getIsland("Counter.tsx");

  const app = new FreshApp()
    .use(freshStaticFiles())
    .island(counterIsland, "Counter", Counter)
    .get("/", (ctx) => {
      const sig = signal(3);
      return ctx.render(
        <Doc>
          <Counter count={sig} />
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");
    await page.click(".increment");
    await waitForText(page, ".output", "4");
  });
});

Deno.test(
  "islands - revive multiple islands from one island file",
  async () => {
    const multipleIslands = getIsland("Multiple.tsx");

    const app = new FreshApp()
      .use(freshStaticFiles())
      .island(multipleIslands, "Multiple1", Multiple1)
      .island(multipleIslands, "Multiple2", Multiple2)
      .get("/", (ctx) => {
        return ctx.render(
          <Doc>
            <Multiple1 id="multiple-1" />
            <Multiple2 id="multiple-2" />
          </Doc>,
        );
      });

    await withBrowserApp(app, async (page, address) => {
      await page.goto(address);
      await page.waitForSelector("#multiple-1.ready");
      await page.waitForSelector("#multiple-2.ready");
      await page.click("#multiple-1 .increment");
      await page.click("#multiple-2 .increment");
      await waitForText(page, "#multiple-1 .output", "1");
      await waitForText(page, "#multiple-2 .output", "1");
    });
  },
);

Deno.test(
  "islands - revive multiple islands with shared signal",
  async () => {
    const counterIsland = getIsland("Counter.tsx");

    const app = new FreshApp()
      .use(freshStaticFiles())
      .island(counterIsland, "Counter", Counter)
      .get("/", (ctx) => {
        const sig = signal(0);
        return ctx.render(
          <Doc>
            <Counter id="counter-1" count={sig} />
            <Counter id="counter-2" count={sig} />
          </Doc>,
        );
      });

    await withBrowserApp(app, async (page, address) => {
      await page.goto(address);
      await page.waitForSelector("#counter-1.ready");
      await page.waitForSelector("#counter-2.ready");
      await page.click("#counter-1 .increment");
      await waitForText(page, "#counter-1 .output", "1");
      await waitForText(page, "#counter-2 .output", "1");
    });
  },
);

Deno.test("islands - import json", async () => {
  const jsonIsland = getIsland("JsonIsland.tsx");

  const app = new FreshApp()
    .use(freshStaticFiles())
    .island(jsonIsland, "JsonIsland", Counter)
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <JsonIsland />
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector("pre");
    const text = await page.$eval("pre", (el) => el.textContent);
    const json = JSON.parse(text);
    expect(json).toEqual({ foo: 123 });
  });
});

Deno.test("islands - returns null", async () => {
  const nullIsland = getIsland("NullIsland.tsx");

  const app = new FreshApp()
    .use(freshStaticFiles())
    .island(nullIsland, "NullIsland", NullIsland)
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <NullIsland />
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");
  });
});