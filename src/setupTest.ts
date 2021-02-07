import { ResizeObserver } from "@juggle/resize-observer";

//@ts-expect-error
global.ResizeObserver = ResizeObserver;
