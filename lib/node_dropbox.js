var request = require('request');

var authUrl = "https://www.dropbox.com/1/oauth2/authorize?";
var apiRoot = "https://api.dropbox.com/1/";
var apiContentRoot = "https://api-content.dropbox.com/1/";
var api = {
  auth: {
    disable_token: '/disable_access_token'
  },
  account: '/account/info',
  metadata: '/metadata/auto',
  fileops: {
    createFolder: '/fileops/create_folder',
    remove: '/fileops/delete',
    copy: '/fileops/copy',
    move: '/fileops/move'
  },
  putFiles: '/files_put',
  getFiles: '/files'
};

exports.Authenticate = function(ckey, csecret, redirect_uri, cb) {
  var err = "";
  var redirect_url = "";

  if(ckey === "" || csecret === "" || redirect_uri === "") {
    err = "Missing client key and/or client secret key.";
  }else{
    redirect_url = authUrl + "client_id=" + ckey + "&response_type=token&redirect_uri=" + redirect_uri;
  }

  cb(err, redirect_url);
}

exports.AccessToken = function(ckey, csecret, auth_code, redirect_url, cb) {
  var url = apiRoot + '/oauth2/token';
  var body = {
    "code": auth_code,
    "grant_type": "authorization_code",
    "redirect_uri": redirect_url,
    "client_id": ckey,
    "client_secret": csecret
  };

  request.post(url, {form: body}, function(err, res, body) {
    cb(err, body);
  });
}

exports.api = function(access_token) {

  var access_token = access_token;

  return {
    account: function(cb) {
      options = optionsBuilder(apiRoot + api.account, access_token);
      request.get(options, function(err, res, body) {
        cb(err, res, body);
      })
    },

    createDir: function(path, cb) {
      options = postBuilder(apiRoot + api.fileops.createFolder,
        {root:"auto", path:path}, access_token);
      request.post(options, function(err, res, body) {
        cb(err, res, body);
      })
    },

    removeDir: function(path, cb) {
      options = postBuilder(apiRoot + api.fileops.remove,
        {root:"auto", path:path}, access_token);
      request.post(options, function(err, res, body) {
        cb(err, res, body);
      });
    },

    moveSomething: function(from, to, cb) {
      options = postBuilder(apiRoot + api.fileops.move,
        {root:"auto", from_path:from, to_path:to}, access_token);
      request.post(options, function(err, res, body) {
        cb(err, res, body);
      });
    },

    createFile: function(path, body, cb) {
      options = {
        method: "PUT",
        url: apiContentRoot + api.putFiles + "/auto/" + path,
        headers: {
          "Content-Length": body.length,
          "Authorization": "Bearer " + access_token
        },
        body: body
      }
      request(options, function(err, res, body) {
        cb(err, res, body);
      })
    },

    removeFile: function(path, cb) {
      options = postBuilder(apiRoot + api.fileops.remove,
        {root: "auto", path:path}, access_token);
      request.post(options, function(err, res, body) {
        cb(err, res, body);
      });
    },

    /**
     * get the metadata of a file or folder
     * the result body.contents can be used to list a folder's content
     */
    getMetadata: function(path, cb) {
      options = optionsBuilder(apiRoot + api.metadata + path, access_token);
      request.get(options, function(err, res, body) {
        cb(err, res, body);
      });
    },

    /**
     * Downloads a file.
     */
    getFile: function(path, cb) {
      options = optionsBuilder(apiContentRoot + api.getFiles + '/auto' + path, access_token);

      request(options, function(err, res, body) {
        cb(err, res, body);
      })
    },

    /**
     * Gets changes to files and folders in a user's Dropbox.
     */
    getDelta: function(cursor, path, cb) {
      options = postBuilder(apiRoot + '/delta',
        {cursor:cursor, path_prefix:path}, access_token);
      request.post(options, function(err, res, body) {
        cb(err, res, body);
      })
    },
  }

}

function optionsBuilder(url, access_token) {
  return {
    url: url,
    headers: {
      "Authorization": "Bearer " + access_token
    }
  }
}

function postBuilder(url, data, access_token) {
  return {
    url: url,
    headers: {
      "Authorization": "Bearer " + access_token
    },
    form: data
  }
}