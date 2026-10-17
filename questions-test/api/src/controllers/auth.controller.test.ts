import { compare } from "bcrypt";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../db/index.js";
import { HttpStatus } from "../utils/http-status.js";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "../utils/session.js";
import { login, logout } from "./auth.controller.js";

vi.mock("../db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("bcrypt", () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

type MockFn = ReturnType<typeof vi.fn>;

const dbMock = db as unknown as {
  select: MockFn;
  insert: MockFn;
  delete: MockFn;
};

const compareMock = compare as unknown as MockFn;

const insertValues = vi.fn().mockResolvedValue(undefined);
const deleteWhere = vi.fn().mockResolvedValue(undefined);

const user = {
  id: 1,
  name: "Budi",
  email: "budi@example.com",
  password: "hashed-password",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const publicUser = {
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
};

/** Atur hasil `db.select().from(users).where(...)`. */
function mockSelectRows(rows: unknown[]): void {
  dbMock.select.mockReturnValue({
    from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(rows) }),
  });
}

function createRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    cookies: {},
    ...overrides,
  } as unknown as Request;
}

type MockResponse = {
  status: MockFn;
  json: MockFn;
  send: MockFn;
  cookie: MockFn;
  clearCookie: MockFn;
};

function createResponse(): MockResponse {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
    send: vi.fn(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  } as unknown as MockResponse;

  res.status.mockReturnValue(res);
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
  dbMock.insert.mockReturnValue({ values: insertValues });
  dbMock.delete.mockReturnValue({ where: deleteWhere });
});

describe("login", () => {
  it("mengembalikan 200, user publik, dan cookie session saat kredensial valid", async () => {
    mockSelectRows([user]);
    compareMock.mockResolvedValue(true);

    const req = createRequest({
      body: { email: user.email, password: "rahasia123" },
    });
    const res = createResponse();

    await login(req, res as unknown as Response);

    expect(compareMock).toHaveBeenCalledWith("rahasia123", user.password);
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.json).toHaveBeenCalledWith({ user: publicUser });

    const inserted = insertValues.mock.calls[0]?.[0] as { id: string; userId: number };
    expect(inserted.userId).toBe(user.id);
    expect(res.cookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME, inserted.id, sessionCookieOptions);
  });

  it("mengembalikan 401 dan tidak memeriksa password saat email tidak terdaftar", async () => {
    mockSelectRows([]);

    const req = createRequest({
      body: { email: "tidak-ada@example.com", password: "rahasia123" },
    });
    const res = createResponse();

    await login(req, res as unknown as Response);

    expect(compareMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({ message: "Email atau password salah" });
    expect(res.cookie).not.toHaveBeenCalled();
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("mengembalikan 401 saat password salah", async () => {
    mockSelectRows([user]);
    compareMock.mockResolvedValue(false);

    const req = createRequest({
      body: { email: user.email, password: "password-salah" },
    });
    const res = createResponse();

    await login(req, res as unknown as Response);

    expect(compareMock).toHaveBeenCalledWith("password-salah", user.password);
    expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({ message: "Email atau password salah" });
    expect(res.cookie).not.toHaveBeenCalled();
    expect(insertValues).not.toHaveBeenCalled();
  });
});

describe("logout", () => {
  it("menghapus session, menghapus cookie, dan mengembalikan 204 saat ada token", async () => {
    const req = createRequest({ cookies: { [SESSION_COOKIE_NAME]: "token-123" } });
    const res = createResponse();

    await logout(req, res as unknown as Response);

    expect(deleteWhere).toHaveBeenCalledTimes(1);
    expect(res.clearCookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME, sessionCookieOptions);
    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.json).not.toHaveBeenCalled();
  });

  it("tetap menghapus cookie dan mengembalikan 204 tanpa token", async () => {
    const req = createRequest({ cookies: {} });
    const res = createResponse();

    await logout(req, res as unknown as Response);

    expect(dbMock.delete).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME, sessionCookieOptions);
    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});
