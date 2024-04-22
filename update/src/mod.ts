import { parseArgs } from "@std/cli/parse-args";
import * as path from "@std/path";
import { ensureMinDenoVersion, error } from "./utils.ts";
import { updateProject } from "./update.ts";

const MIN_DENO_VERSION = "1.42.4";

const HELP = `@fresh/update

Update a Fresh project. This updates dependencies and optionally performs code
mods to update a project's source code to the latest recommended patterns.

To upgrade a project in the current directory, run:
  deno run -A jsr:@fresh/update .

USAGE:
    @fresh/update [DIRECTORY]
`;

ensureMinDenoVersion(MIN_DENO_VERSION);

const flags = parseArgs(Deno.args, {});

let unresolvedDirectory = Deno.args[0];
if (flags._.length !== 1) {
  const userInput = prompt("Where is the project directory?", ".");
  if (!userInput) {
    error(HELP);
  }

  unresolvedDirectory = userInput;
}

const dir = path.resolve(unresolvedDirectory);
await updateProject(dir);