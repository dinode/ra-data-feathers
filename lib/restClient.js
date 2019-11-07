'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _reactAdmin = require('react-admin');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _objectDiff = require('object-diff');

var _objectDiff2 = _interopRequireDefault(_objectDiff);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var dbg = (0, _debug2.default)('ra-data-feathers:rest-client');

var defaultIdKey = 'id';

function getIdKey(_ref) {
  var resource = _ref.resource,
      options = _ref.options;

  return options[resource] && options[resource].id || options.id || defaultIdKey;
}

function deleteProp(obj, prop) {
  var res = Object.assign({}, obj);
  delete res[prop];
  return res;
}

exports.default = function (client) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var usePatch = !!options.usePatch;
  var mapRequest = function mapRequest(type, resource, params) {
    var idKey = getIdKey({ resource: resource, options: options });
    dbg('type=%o, resource=%o, params=%o, idKey=%o', type, resource, params, idKey);
    var service = client.service(resource);
    var query = {};

    switch (type) {
      case _reactAdmin.GET_MANY:
        var ids = params.ids || [];
        query[idKey] = { $in: ids };
        query.$limit = ids.length;
        return service.find({ query: query });
      case _reactAdmin.GET_MANY_REFERENCE:
        if (params.target && params.id) {
          query[params.target] = params.id;
        }
      case _reactAdmin.GET_LIST:
        var _ref2 = params.pagination || {},
            page = _ref2.page,
            perPage = _ref2.perPage;

        var _ref3 = params.sort || {},
            field = _ref3.field,
            order = _ref3.order;

        dbg('field=%o, order=%o', field, order);
        if (perPage && page) {
          query.$limit = perPage;
          query.$skip = perPage * (page - 1);
        }
        if (order) {
          query.$sort = _defineProperty({}, field === defaultIdKey ? idKey : field, order === 'DESC' ? -1 : 1);
        }
        Object.assign(query, params.filter);
        dbg('query=%o', query);
        return service.find({ query: query });
      case _reactAdmin.GET_ONE:
        return service.get(params.id);
      case _reactAdmin.UPDATE:
        if (usePatch) {
          var data = params.previousData ? (0, _objectDiff2.default)(params.previousData, params.data) : params.data;
          return service.patch(params.id, data);
        } else {
          var _data = idKey !== defaultIdKey ? deleteProp(params.data, defaultIdKey) : params.data;
          return service.update(params.id, _data);
        }
      case _reactAdmin.UPDATE_MANY:
        if (usePatch) {
          var _data2 = params.previousData ? (0, _objectDiff2.default)(params.previousData, params.data) : params.data;
          return Promise.all(params.ids.map(function (id) {
            return service.patch(id, _data2);
          }));
        } else {
          var _data3 = idKey !== defaultIdKey ? deleteProp(params.data, defaultIdKey) : params.data;
          return Promise.all(params.ids.map(function (id) {
            return service.update(id, _data3);
          }));
        }
      case _reactAdmin.CREATE:
        return service.create(params.data);
      case _reactAdmin.DELETE:
        return service.remove(params.id);
      case _reactAdmin.DELETE_MANY:
        if (service.options.multi) {
          return service.remove(null, {
            query: _defineProperty({}, idKey, {
              $in: params.ids
            })
          });
        }
        return Promise.all(params.ids.map(function (id) {
          return service.remove(id);
        }));
      default:
        return Promise.reject('Unsupported FeathersJS restClient action type ' + type);
    }
  };

  var mapResponse = function mapResponse(response, type, resource, params) {
    var idKey = getIdKey({ resource: resource, options: options });
    switch (type) {
      case _reactAdmin.GET_ONE:
      case _reactAdmin.UPDATE:
      case _reactAdmin.DELETE:
        return { data: _extends({}, response, { id: response[idKey] }) };
      case _reactAdmin.UPDATE_MANY:
      case _reactAdmin.DELETE_MANY:
        return { data: response.map(function (record) {
            return record[idKey];
          }) };
      case _reactAdmin.CREATE:
        return { data: _extends({}, params.data, response, { id: response[idKey] }) };
      case _reactAdmin.GET_MANY_REFERENCE: // fix GET_MANY_REFERENCE missing id
      case _reactAdmin.GET_MANY: // fix GET_MANY missing id
      case _reactAdmin.GET_LIST:
        var res = void 0;
        // support paginated and non paginated services
        if (!response.data) {
          response.total = response.length;
          res = response;
        } else {
          res = response.data;
        }
        response.data = res.map(function (_item) {
          var item = _item;
          if (idKey !== defaultIdKey) {
            item.id = _item[idKey];
          }
          return _item;
        });
        return response;
      default:
        return response;
    }
  };

  return function (type, resource, params) {
    return mapRequest(type, resource, params).then(function (response) {
      return mapResponse(response, type, resource, params);
    });
  };
};

module.exports = exports['default'];