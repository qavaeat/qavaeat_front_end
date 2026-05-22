import { NextResponse } from "next/server";

// ── Base ──────────────────────────────────────────────────────────────────────

export class HttpError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toResponse(): NextResponse {
    return NextResponse.json(
      { success: false, message: this.message },
      { status: this.status }
    );
  }
}

// ── Subclasses ────────────────────────────────────────────────────────────────

export class BadRequestError extends HttpError {
  constructor(message = "Bad request") {
    super(message, 400);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

// ── Route handler error wrapper ───────────────────────────────────────────────
//
// Wraps any route handler function and catches HttpError instances,
// returning a clean JSON response instead of crashing.
//
// Usage:
//   export const GET = withErrorHandler(async (req) => {
//     const data = await backendFetch("/orders");
//     return NextResponse.json(data);
//   });

type RouteHandler = (
  req: Request,
  ctx?: unknown
) => Promise<NextResponse>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return err.toResponse();
      }
      console.error("[route-handler-error]", err);
      return NextResponse.json(
        { success: false, message: "An unexpected error occurred." },
        { status: 500 }
      );
    }
  };
}