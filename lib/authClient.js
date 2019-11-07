'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _reactAdmin = require('react-admin');

var _jwtDecode = require('jwt-decode');

var _jwtDecode2 = _interopRequireDefault(_jwtDecode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

exports.default = function (client) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return function (type, params) {
    var _extends2;

    var _Object$assign = Object.assign({}, {
      storageKey: 'token',
      authenticate: { strategy: 'local' },
      permissionsKey: 'permissions',
      permissionsField: 'roles',
      passwordField: 'password',
      usernameField: 'email',
      logoutOnForbidden: true
    }, options),
        storageKey = _Object$assign.storageKey,
        authenticate = _Object$assign.authenticate,
        permissionsKey = _Object$assign.permissionsKey,
        permissionsField = _Object$assign.permissionsField,
        passwordField = _Object$assign.passwordField,
        usernameField = _Object$assign.usernameField,
        redirectTo = _Object$assign.redirectTo,
        logoutOnForbidden = _Object$assign.logoutOnForbidden;

    switch (type) {
      case _reactAdmin.AUTH_LOGIN:
        var username = params.username,
            password = params.password;

        return client.authenticate(_extends({}, authenticate, (_extends2 = {}, _defineProperty(_extends2, usernameField, username), _defineProperty(_extends2, passwordField, password), _extends2)));
      case _reactAdmin.AUTH_LOGOUT:
        localStorage.removeItem(permissionsKey);
        return client.logout();
      case _reactAdmin.AUTH_CHECK:
        var hasJwtInStorage = !!localStorage.getItem(storageKey);
        var hasReAuthenticate = Object.getOwnPropertyNames(client).includes('reAuthenticate') && typeof client.reAuthenticate === 'function';

        if (hasJwtInStorage && hasReAuthenticate) {
          return client.reAuthenticate().then(function () {
            return Promise.resolve();
          }).catch(function () {
            return Promise.reject({ redirectTo: redirectTo });
          });
        }

        return hasJwtInStorage ? Promise.resolve() : Promise.reject({ redirectTo: redirectTo });
      case _reactAdmin.AUTH_ERROR:
        var code = params.code;

        if (code === 401 || logoutOnForbidden && code === 403) {
          localStorage.removeItem(storageKey);
          localStorage.removeItem(permissionsKey);
          return Promise.reject();
        }
        return Promise.resolve();
      case _reactAdmin.AUTH_GET_PERMISSIONS:
        /*
        JWT token may be provided by oauth,
        so that's why the permissions are decoded here and not in AUTH_LOGIN.
        */
        // Get the permissions from localstorage if any.
        var localStoragePermissions = JSON.parse(localStorage.getItem(permissionsKey));
        // If any, provide them.
        if (localStoragePermissions) {
          return Promise.resolve(localStoragePermissions);
        }
        // Or find them from the token, save them and provide them.
        try {
          var jwtToken = localStorage.getItem(storageKey);
          var decodedToken = (0, _jwtDecode2.default)(jwtToken);
          var jwtPermissions = decodedToken[permissionsField] ? decodedToken[permissionsField] : [];
          localStorage.setItem(permissionsKey, JSON.stringify(jwtPermissions));
          return Promise.resolve(jwtPermissions);
        } catch (e) {
          return Promise.reject();
        }

      default:
        return Promise.reject('Unsupported FeathersJS authClient action type ' + type);
    }
  };
};

module.exports = exports['default'];