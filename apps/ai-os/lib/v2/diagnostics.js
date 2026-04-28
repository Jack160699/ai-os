import { NextResponse } from "next/server";

export function logRouteError(routeId, error, context = {}) {
  const message = error?.message || String(error);
  const stack = error?.stack || "no_stack";
  console.error(`[v2][${routeId}]`, { message, stack, ...context });
}

export function routeErrorResponse(routeId, error) {
  logRouteError(routeId, error);
  return NextResponse.json({ error: "internal_error", route: routeId }, { status: 500 });
}
