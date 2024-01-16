const fs = require("fs");
const jwt = require("jsonwebtoken");

const privateKEY = fs.readFileSync("./private.key", "utf8");
const publicKEY = fs.readFileSync("./public.key", "utf8");

const signToken = (payload, option) => {
  const defPayload = {
    user_id: payload.user_id,
    first_name: payload.first_name,
    role_id: payload.role_id,
    email_id: payload.email_id,
    mobile_no: payload.mobile_no,
    status: payload.status,
  };

  const signOptions = {
    algorithm: "RS256",
    audience: option.audience,
    expiresIn: "7d",
    issuer: "Scoo",
  };

  const res = jwt.sign(defPayload, privateKEY, signOptions);
  return res;
};

const verifyToken = (fullToken, option) => {
  if (
    fullToken == null ||
    typeof fullToken === undefined ||
    fullToken.search("Bearer ") === -1
  ) {
    return false;
  }

  const token = fullToken.replace(/Bearer /g, "");

  const verifyOptions = {
    algorithm: "RS256",
    audience: option.audience,
    expiresIn: "7d",
    issuer: "Scoo",
  };

  try {
    return jwt.verify(token, publicKEY, verifyOptions);
  } catch (err) {
    return false;
  }
};

const verifyMiddleware = (req, res, next) => {
  const success = verifyToken(req.headers.authorization, {
    audience: req.headers.appName,
  });

  if (success === false) {
    const err = GetErrorObject(ErrorCodes.AuthTokenFailure);
    res.status(StatusCodes.AuthFailed).json(err);
  } else {
    next();
  }
};

const decodeToken = (fullToken) => {
  if (
    fullToken == null ||
    typeof fullToken === undefined ||
    fullToken.search("Bearer ") === -1
  ) {
    return false;
  }

  const token = fullToken.replace(/Bearer /g, "");

  return jwt.decode(token, { complete: true });
};

module.exports = {
  decodeToken,
  signToken,
  verifyMiddleware,
  verifyToken,
};
