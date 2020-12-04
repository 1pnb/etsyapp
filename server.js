// Get required
let express = require("express");
let http = require("http");
let oauth = require("oauth");
let LocalStorage = require("node-localstorage").LocalStorage;
localStorage = new LocalStorage("./scratch");

let app = express();
let server = http.createServer(app);

// Set Etsy temporary credentials
let key = "r1cymw4z676lorjmw8g4oy04";
let secret = "c5xfwhd80p";

// Set domain and callback
let domain = "https://myapphehe.bubbleapps.io/version-test/sukses_page?debug_mode=true";
let callback = "/callback";

// Instantiate OAuth object
let oa = new oauth.OAuth(
  "https://openapi.etsy.com/v2/oauth/request_token",
  "https://openapi.etsy.com/v2/oauth/access_token",
  key,
  secret,
  "1.0A",
  domain + callback,
  "HMAC-SHA1"
);

// Root route
app.get("/", function (req, res) {
  res.redirect("/get-access-token");
});

// Request OAuth request token, and redirect the user to authorization page
app.get("/get-access-token", function (req, res, next) {
  console.log("*** get-access-token ***");

  oa.getOAuthRequestToken(function (error, token, token_secret, results) {
    if (error) {
      console.log(error);
    } else {
      // console.log("token:", token, "token_secret:", token_secret);
      // put oauthrequest_token and oauthrequest_token_secret into localStorage, send them to /callback in order to get token_secret
      localStorage.setItem("token", token);
      localStorage.setItem("token_secret", token_secret);
      res.redirect(results["login_url"]); //qikjo te qon ne etsy page, si ti ranoj ALLOW bon kerkese ne /callback
    }
  });
});

// Get OAuth access token on callback
app.get("/callback", function (req, res) {
  console.log("*** callback ***");
  //get oauth_verifier from the query we send from bubble.io
  // get token and token secret from localStorage
  const { oauth_verifier } = req.query;
  let token = localStorage.getItem("token");
  let token_secret = localStorage.getItem("token_secret");

  oa.getOAuthAccessToken(
    token,
    token_secret,
    oauth_verifier,
    function (error, token, token_secret, results) {
      if (error) {
        console.log(error);
      } else {
        // send token and token_secret, grab them and make necessary requests.
        res.status(200).json({ token, token_secret });
        localStorage.clear("token");
        localStorage.clear("token_secret");
      }
    }
  );
});

// All of your API's go here(the one that require oauth), others can be done only with the api key sent as a header from bubble directly.
app.get("/user", (req, res, next) => {
  const { token, token_secret } = req.headers;
  oa.getProtectedResource(
    "https://openapi.etsy.com/v2/users/__SELF__",
    "GET",
    token,
    token_secret,
    function (error, data, response) {
      if (error) {
        console.log(error);
      } else {
        res.status(200).json({ data: JSON.parse(data) });
      }
    }
  );
});

app.get("/orders", (req, res, next) => {
  console.log("*** test ***");
  const { token, token_secret } = req.headers;
  oa.getProtectedResource(
    "https://openapi.etsy.com/v2/shops/PeterDummyShop/receipts",
    "GET",
    token,
    token_secret,
    function (error, data, response) {
      if (error) {
        console.log(error);
      } else {
        res.status(200).json({ data: JSON.parse(data) });
      }
    }
  );
});

server.listen(process.env.PORT || 80);
