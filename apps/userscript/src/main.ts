import { createUserscriptRuntime } from "@subbatch/runtime";

import { createUserscriptHost } from "./userscript-host";

export const runtime = createUserscriptRuntime(createUserscriptHost());

