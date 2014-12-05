// The Antville Project
// http://code.google.com/p/antville
//
// Copyright 2001–2014 by the Workers of Antville.
//
// Licensed under the Apache License, Version 2.0 (the ``License'');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an ``AS IS'' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines the Antville Connect trail.
 */

"http://code.google.com/p/antville/wiki/ConnectFeature"

app.addRepository(app.dir + "/../trails/connect/scribe-1.3.0.jar");

// FIXME: Connecting with Twitter and Google currently does not return an e-mail address.
// Instead, noreplay@antville.org is used – which is very poor and should be fixed ASAP.

Connect.prototype.getUserByConnection = function(type, id) {
  var user;
  var connections = this.get(id);
  if (connections) {
    connections.forEach(function(index) {
      if (this.name === type + "_id") {
        user = this.parent;
      }
    });
  }
  return user;
};

Connect.prototype.getPermission = function(action) {
  switch (action) {
    case "connect":
    return true;
    case "disconnect":
    return User.require(User.REGULAR);
  }
};

Connect.prototype.connect_action = function() {
  try {
    switch (req.data.type) {
      case "facebook":
      this.facebook(req);
      break;
      case "google":
      this.google(req);
      break;
      case "twitter":
      this.scribe(req.data.type);
      break;
    }
  } catch (ex) {
    session.logout();
    res.message = String(ex);
    res.redirect(res.handlers.members.href("login"));
  }
  JSON.sendPaddedResponse(res.handlers.site.stories.getPermission("create"));
  res.redirect(User.getLocation() || res.handlers.site.href());
  return;
};

Connect.prototype.disconnect_action = function() {
  switch (req.data.type) {
    case "facebook":
    case "google":
    case "twitter":
    res.handlers.membership.creator.deleteMetadata(req.data.type + "_id");
    break;
  }
  res.redirect(req.data.http_referer);
  return;
};

Connect.prototype.trail_macro = function(param) {
  var defaultDomain = getProperty("domain.*");
  var domain = getProperty("domain." + res.handlers.site.name);
  if (defaultDomain && domain && !domain.endsWith(defaultDomain)) {
    return;
  }
  var suffix = param.context ? "_" + param.context : "";
  getProperty("connect.facebook.id") && this.renderSkin("Connect#facebook" + suffix);
  getProperty("connect.google.id") && this.renderSkin("Connect#google" + suffix);
  getProperty("connect.twitter.id") && this.renderSkin("Connect#twitter" + suffix);
};

Connect.prototype.scribe = function(type) {
  var name = type.titleize();
  var appId = getProperty("connect." + type + ".id");
  var secret = getProperty("connect." + type + ".key");

  if (!secret || req.data.denied) {
    throw Error(gettext("Connecting with {0} failed. {1} Please try again.", name,
        gettext("You denied the request.")));
  }

  if (req.isPost()) {
    try {
      User.login(req.postParams);
    } catch (ex) { }
  }

  var scribe = Packages.org.scribe;
  var provider, requestUrl, scope, getValues;
  var headers = {};

  switch (type) {
    case "google":
    provider = scribe.builder.api.GoogleApi;
    requestUrl = "http://www-opensocial.googleusercontent.com/api/people/@me/@self";
    scope = "http://www-opensocial.googleusercontent.com/api/people/";
    headers["GData-Version"] = "3.0";
    getValues = function(data) {
      data = data.entry;
      return {
        id: data.id,
        name: data.displayName,
        email: data.email,
        url: data.url
      }
    }
    break;

    case "twitter":
    provider = scribe.builder.api.TwitterApi.SSL;
    requestUrl = "https://api.twitter.com/1.1/account/verify_credentials.json";
    getValues = function(data) {
      return {
        id: data.id_str,
        name: data.screen_name,
        email: data.email,
        url: data.profileUrl
      }
    }
    break;
  }

  var url = this.href(req.action) + "?type=" + type;

  var service = new scribe.builder.ServiceBuilder()
      .provider(provider)
      .apiKey(appId)
      .apiSecret(secret)
      .callback(url);

  if (scope) {
    service.scope(scope);
  }

  var oauth = service.build();

  var verifier = req.data.oauth_verifier;
  if (!verifier) {
    // Because the service provider will redirect back to this URL the
    // request token needs to be stored in the session object
    session.data.requestToken = oauth.getRequestToken();
    res.redirect(oauth.getAuthorizationUrl(session.data.requestToken));
  }

  try {
    var accessToken = oauth.getAccessToken(session.data.requestToken,
        new scribe.model.Verifier(verifier));
  } catch (ex) {
    throw Error(gettext("Connecting with {0} failed. {1} Please try again.", name,
        gettext("Something went wrong.")));
  }

  var request = new scribe.model.OAuthRequest(scribe.model.Verb.GET, requestUrl);
  oauth.signRequest(accessToken, request);
  for (let name in headers) {
    request.addHeader(name, headers[name]);
  }
  var response = request.send();

  var data = getValues(JSON.parse(response.getBody()));
  var user = this.getUserByConnection(type, data.id);
  if (!user) {
    if (!session.user) {
      var name = root.users.getAccessName(data.name);
      user = User.register({
        name: name,
        hash: session.data.requestToken.getToken(),
        email: data.email || root.replyTo,
        url: data.url
      });
      session.login(user);
    } else {
      user = session.user;
    }
    user.setMetadata(type + "_id", data.id);
  } else if (user !== session.user) {
    user.touch();
    session.login(user);
  }

  return;
};

Connect.prototype.facebook =function(req) {
  var appId = getProperty("connect.facebook.id");
  var secret = getProperty("connect.facebook.key");
  if (!secret || req.data.error) {
    throw Error(gettext("Could not connect with Facebook. ({0})", -1));
  }

  if (req.isPost()) {
    try {
      User.login(req.postParams);
    } catch (ex) { }
  }

  var url = this.href(req.action) + "?type=facebook";

  var code = req.data.code;
  if (!code) {
    res.redirect("https://www.facebook.com/dialog/oauth?client_id=" + appId +
        "&scope=email&redirect_uri=" + url);
    return;
  }

  var mime = getURL("https://graph.facebook.com/oauth/access_token?client_id=" + appId +
      "&redirect_uri=" + url + "&client_secret=" + secret + "&code=" + code);
  if (!mime || !mime.text) {
    throw Error(gettext("Could not connect with Facebook. ({0})", -3));
  }

  var token = mime.text;
  mime = getURL("https://graph.facebook.com/me?" + token);
  if (!mime) {
    throw Error(gettext("Could not connect with Facebook. ({0})", -4));
  }

  var content = Packages.org.apache.commons.io.IOUtils.toString(mime.inputStream);
  if (!content) {
    throw Error(gettext("Could not connect with Facebook. ({0})", -5));
  }

  var data = JSON.parse(content);
  var user = this.getUserByConnection("facebook", data.id);
  if (!user) {
    if (!session.user) {
      var name = root.users.getAccessName(data.name);
      user = User.register({
        name: name,
        hash: token,
        email: data.email,
        url: data.link,
      });
      session.login(user);
    } else {
      user = session.user;
    }
    user.setMetadata("facebook_id", data.id);
  } else if (user !== session.user) {
    user.touch();
    session.login(user);
  }

  return;
};

Connect.prototype.google = function(req) {
  if (req.isPost()) {
    try {
      User.login(req.postParams);
    } catch (ex) { }
  }

  var url = this.href('connect') + "?type=google";

  if (req.data.code) {
    var http = new helma.Http();
    http.setMethod("POST");
    http.setContent("code=" + encodeURIComponent(req.data.code) +
        "&client_id=" + encodeURIComponent(getProperty("connect.google.id")) +
        "&client_secret=" + encodeURIComponent(getProperty("connect.google.key")) +
        "&redirect_uri=" + encodeURIComponent(url) + "&grant_type=authorization_code");
    var response = http.getUrl("https://accounts.google.com/o/oauth2/token");
    var data = JSON.parse(response.content);
    var token = data.access_token;
    var mime = getURL("https://www.googleapis.com/oauth2/v1/userinfo?access_token=" +
        encodeURIComponent(data.access_token));
    var data = JSON.parse(Packages.org.apache.commons.io.IOUtils.toString(mime.inputStream));
    var user = this.getUserByConnection("google", data.id);
    if (!user) {
      if (!session.user) {
        var name = root.users.getAccessName(data.name);
        user = User.register({
          name: name,
          hash: token,
          email: data.email,
          url: data.link
        });
        session.login(user);
      } else {
        user = session.user;
      }
      user.setMetadata("google_id", data.id);
    } else if (user !== session.user) {
      user.touch();
      session.login(user);
    }
  } else {
    res.redirect("https://accounts.google.com/o/oauth2/auth?" +
        "client_id=" + encodeURIComponent(getProperty("connect.google.id")) +
        "&redirect_uri=" + encodeURIComponent(url) +
        "&scope=" + encodeURIComponent("https://www.googleapis.com/auth/userinfo.profile") +
        "+" + encodeURIComponent("https://www.googleapis.com/auth/userinfo.email") +
        "&response_type=code");
  }
};

Connect.prototype.href = function (action) {
  var href = root.trails.href('connect');
  return href + '/' + (action || String.EMPTY);
};

Connect.prototype.href_macro = function (param, action) {
  res.write(this.href(action));
};
