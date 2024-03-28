"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  isAdmin,
  ensureAuthToAccessUser
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");

function next(err) {
  if (err) throw new Error("Got error from middleware");
}


describe("authenticateJWT", function () {
  test("works: via header", function () {
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    const req = {};
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


describe("ensureLoggedIn", function () {
  test("works", function () {
    const req = {};
    const res = { locals: { user: { username: "test" } } };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    const req = {};
    const res = { locals: {} };
    expect(() => ensureLoggedIn(req, res, next))
      .toThrow(UnauthorizedError);
  });

  test("unauth if no valid login", function () {
    const req = {};
    const res = { locals: { user: {} } };
    expect(() => ensureLoggedIn(req, res, next))
      .toThrow(UnauthorizedError);
  });
});


describe("isAdmin", function () {
  test("works", function () {
    const req = {};
    const res = { locals: { user: { isAdmin: true } } };
    isAdmin(req, res, next);
  });

  test("not logged in", function () {
    const req = {};
    const res = { locals: {} };
    expect(() => isAdmin(req, res, next))
      .toThrow(UnauthorizedError);
  });

  test("unauth if not admin", function () {
    const req = {};
    const res = { locals: { user: { isAdmin: false } } };
    expect(() => isAdmin(req, res, next))
      .toThrow(UnauthorizedError);
  });
});


describe("ensureAuthToAccessUser", function () {
  test("works if admin", function () {
    const req = {};
    const res = { locals: { user: { isAdmin: true } } };
    ensureAuthToAccessUser(req, res, next);
  });

  test("works if user", function () {
    const req = { params: { username: "test" } };
    const res = { locals: { user: { username: "test" } } };
    ensureAuthToAccessUser(req, res, next);
  });

  test("not logged in", function () {
    const req = { params: { username: "test" } };
    const res = { locals: {} };
    expect(() => ensureAuthToAccessUser(req, res, next))
      .toThrow(UnauthorizedError);
  });

  test("unauth if not logged in user", function () {
    const req = { params: { username: "test" } };
    const res = { locals: { user: { username: "bob" } } };
    expect(() => ensureAuthToAccessUser(req, res, next))
      .toThrow(UnauthorizedError);
  });
});