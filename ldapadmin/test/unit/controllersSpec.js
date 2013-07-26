'use strict';

/* jasmine specs for controllers go here */

describe('controllers', function(){
  beforeEach(module('ldapadmin.controllers'));
  beforeEach(module('restangular'));

  describe('FooCtrl', function() {
    it('should create foo', inject(function($rootScope, $controller) {
      var scope = $rootScope.$new();
      var ctrl = $controller("FooCtrl", {$scope: scope});
      expect(scope.foo).toEqual('bar');
    }));
  });

  describe('UsersCtrl', function() {
    var $httpBackend,
        scope,
        ctrl;
    beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/users').
        respond([
            {
                "id": 0,
                "picture": "http://placehold.it/32x32",
                "name": "Patrica Barton",
                "company": "Tellifly",
                "email": "patricabarton@tellifly.com",
                "group": []
            },
            {
                "id": 1,
                "picture": "http://placehold.it/32x32",
                "name": "James Mcgee",
                "company": "Blurrybus",
                "email": "jamesmcgee@blurrybus.com",
                "group": []
            }
          ]);
      scope = $rootScope.$new();
      ctrl = $controller('UsersCtrl', {$scope: scope});
    }));
    it('should create users with 2 items', inject(function($rootScope, $controller) {
      $httpBackend.flush();
      expect(scope.users.length).toEqual(2);
    }));
    it('should create groups with 5 items', inject(function($rootScope, $controller) {
      $httpBackend.flush();
      expect(scope.groups.length).toEqual(5);
    }));
  });

  describe('UsersListCtrl', function() {
    var scope,
        ctrl;

    it("shouldn't select any group", inject(function($rootScope, $controller) {
      scope = $rootScope.$new();
      ctrl = $controller('UsersListCtrl', {$scope: scope});
      expect(scope.groupFilter).toEqual(null);
      expect(scope.selectedGroup).toEqual(null);
    }));

    it("should select a group", inject(function($rootScope, $controller, $routeParams) {
      scope = $rootScope.$new();
      ctrl = $controller('UsersListCtrl', {$scope: scope, $routeParams: {group: 'foo'}});
      expect(scope.groupFilter).toEqual({group: 'foo'});
      expect(scope.selectedGroup).toEqual('foo');
    }));
  });
});