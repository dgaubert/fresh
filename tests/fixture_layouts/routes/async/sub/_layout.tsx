import { FreshContext } from "$fresh/server.ts";

export default async function AsyncSubLayout(
  req: Request,
  ctx: FreshContext,
) {
  await new Promise((r) => setTimeout(r, 10));
  return (
    <div class="async-sub-layout">
      <p>Async Sub layout</p>
      <ctx.Component />
    </div>
  );
}
