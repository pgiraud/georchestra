'use strict';

/* Controllers */
angular.module('ldapadmin.controllers', [])
  .controller('GroupsCtrl', function($scope, $rootScope, Restangular) {
    Restangular.all('groups').getList().then(function(groups) {
      groups.sort(function(a, b) {
        return (a.cn < b.cn) ? -1 : 1;
      });
      $rootScope.groups = groups;

      var tree = [];
      var prefix;
      angular.forEach(groups, function(group, key) {
        addNode(tree, group);
      });
      $rootScope.groups_tree = tree;
    }, function errorCallback() {
      flash.error = 'Oops error from server :(';
    });
  })
  /**
   * Group Edit
   */
  .controller('GroupEditCtrl', function($scope, $routeParams, Restangular, flash) {
    var group = Restangular.one('groups', $routeParams.group);
    group.get().then(function(remote) {
      $scope.group = Restangular.copy(remote);

      // manually add an id field so that we can use Restangular without
      // changing the mapping to id field globally
      $scope.group.id = $scope.group.cn;

      $scope.save = function() {
        $scope.group.put().then(function() {
          flash.success = 'Group correctly updated';
          var index = findByAttr($scope.groups, 'cn', $routeParams.group);

          if (index !== false) {
            $scope.groups[index] = angular.copy($scope.group);
            remote = angular.copy($scope.group);
          }
        });
      };
      $scope.isClean = function() {
        return angular.equals(remote, $scope.group);
      };
      $scope.deleteGroup = function(group) {
        Restangular.one('groups', group).remove().then(
          function() {
            var index = findByAttr($scope.groups, 'cn', $routeParams.group);

            if (index !== false) {
              $scope.groups = $scope.groups.splice(index, 1);
              removeNode($scope.groups_tree, group);
            }
            window.location = '#/users';
            flash.success = 'Group correctly removed';
          },
          function errorCallback() {
            flash.error = 'Oops error from server :(';
          }
        );
      };
    });
  })
  /**
   * Group Create
   */
  .controller('GroupCreateCtrl', function($scope, Restangular, flash) {
      $scope.save = function() {
        Restangular.all('groups').post(
          $scope.group
        ).then(function(group) {
          $scope.groups.push(group);

          // update groups tree
          addNode($scope.groups_tree, group);

          window.location = "#/users";
          flash.success = 'Group correctly added';
        });
      };
  })
  .controller('UsersCtrl', function UsersCtrl($scope, Restangular) {
    var baseUsers = Restangular.all('users');
    baseUsers.getList().then(function(users) {
      $scope.users = users;
    }, function errorCallback() {
      flash.error = 'Oops error from server :(';
    });
  })

  /**
   * Users List
   */
  .controller('UsersListCtrl', function($scope, $rootScope, $routeParams, $filter, Restangular, flash) {
    //$scope.users is inherited from UsersCtrl's scope
    var group = $routeParams.group;
    $scope.groupFilter = group ? {groups: group} : null;
    $rootScope.selectedGroup = group;

    $scope.allSelected = false;

    $scope.selectedUsers = function() {
      var filter = {selected: true};
      // we also want to filter by group if a group is selected
      if (group) {
        filter.groups = group;
      }
      return $filter('filter')($scope.users, filter);
    };

    function filteredUsers() {
      var filter = {};
      if (group) {
        filter.groups = group;
      }
      return $filter('filter')($scope.users, filter);
    }

    $scope.$watch('users', function() {
      var filtered = filteredUsers(),
          selected = $scope.selectedUsers();

      $scope.allSelected = filtered && selected &&
        selected.length == filtered.length &&
        filtered.length > 0;
    }, true);

    $scope.selectAll = function() {
      angular.forEach(filteredUsers(), function(user) {
        user.selected = $scope.allSelected;
      });
    };

    function hasUsers(group) {
      var total = $scope.selectedUsers().length;
      var inGroup = _.filter($scope.selectedUsers(), function(user) {
        return user.groups.indexOf(group.cn) != -1;
      });
      if (inGroup.length === 0) {
        return false;
      }
      return inGroup.length == total ? 'all' : 'some';
    }
    $scope.selectGroup = function(group) {
      if (!group.hasUsers || group.hasUsers == 'some') {
        group.hasUsers = 'all';
      } else if (group.hasUsers == 'all') {
        group.hasUsers = false;
      }
      // check whether the list of groups changed
      $scope.groupsChanged = !angular.equals($scope.original_groups, $scope.user_groups);
    };

    // we wan't to initialize groups when the groups button is clicked
    $scope.initGroups = function() {
      // A copy of list of groups (w/ information on whether the user is part
      // of this group or not
      $scope.user_groups = angular.copy($scope.groups);

      var tree = [];
      var prefix;
      angular.forEach($scope.user_groups, function(group, key) {
        addNode(tree, group);
      });
      $scope.user_groups_tree = tree;

      angular.forEach($scope.user_groups, function(group, key) {
        group.hasUsers = hasUsers(group);
      });

      $scope.original_groups = angular.copy($scope.user_groups);

      $scope.groupsChanged = false;
    };

    // called when user submits modifications on groups list for a user
    $scope.apply = function() {
      postGroups($scope, $scope.selectedUsers(), Restangular, flash);
    };
    $scope.deleteGroup = function(group) {
      Restangular.one('groups', group).remove().then(
        function() {
          var index = findByAttr($scope.groups, 'cn', $routeParams.group);

          if (index !== false) {
            $scope.groups = $scope.groups.splice(index, 1);
            removeNode($scope.groups_tree, group);
          }
          window.location = '#/users';
          flash.success = 'Group correctly removed';
        },
        function errorCallback() {
          flash.error = 'Oops error from server :(';
        }
      );
    };
  })

  /**
   * User Edit
   */
  .controller('UserEditCtrl', function($scope, $routeParams, Restangular, flash) {
    var user = Restangular.one('users', $routeParams.userId);
    user.get().then(function(remote) {
      $scope.user = Restangular.copy(remote);

      // manually add an id field so that we can use Restangular without
      // changing the mapping to id field globally
      $scope.user.id = $scope.user.uid;

      $scope.groupsChanged = false;

      $scope.save = function() {
        $scope.user.put().then(function() {
          flash.success = 'User correctly updated';
          var index = findByAttr($scope.users, 'uid', $routeParams.userId);

          if (index !== false) {
            $scope.users[index] = angular.copy($scope.user);
            remote = angular.copy($scope.user);
          }
        });
      };
      $scope.deleteUser = function() {
        Restangular.one('users', $scope.user.uid).remove().then(
          function() {
            var index = findByAttr($scope.users, 'uid', $routeParams.userId);

            if (index !== false) {
              $scope.users = $scope.users.splice(index, 1);
            }
            window.history.back();
            flash.success = 'User correctly removed';
          },
          function errorCallback() {
            flash.error = 'Oops error from server :(';
          }
        );
      };
      $scope.isClean = function() {
        return angular.equals(remote, $scope.user);
      };
      $scope.selectGroup = function(group) {
        group.hasUsers = !group.hasUsers;
        // check whether the list of groups changed
        $scope.groupsChanged = !angular.equals($scope.original_groups, $scope.user_groups);
      };
      // we wan't to initialize groups when the groups button is clicked
      $scope.initGroups = function() {
        // A copy of list of groups (w/ information on whether the user is part
        // of this group or not
        $scope.user_groups = angular.copy($scope.groups);

        var tree = [];
        var prefix;
        angular.forEach($scope.user_groups, function(group, key) {
          addNode(tree, group);
        });
        $scope.user_groups_tree = tree;

        angular.forEach($scope.user_groups, function(group, key) {
          group.hasUsers = _.contains($scope.user.groups, group.cn);
        });

        $scope.original_groups = angular.copy($scope.user_groups);
        $scope.groupsChanged = false;
      };

      // called when user submits modifications on groups list for a user
      $scope.apply = function() {
        postGroups($scope, $scope.user, Restangular, flash, function() {
          var index = findByAttr($scope.users, 'uid', $routeParams.userId);
          if (index !== false) {
            $scope.users[index] = $scope.user;
          }
        });
      };
    });
  })
  .controller('UserCreateCtrl', function($scope, Restangular, flash) {
      $scope.save = function() {
        Restangular.all('users').post(
          $scope.user
        ).then(function(user) {
          $scope.users.push(user);
          window.location = "#/users";
          flash.success = 'User correctly added';
        });
      };
  })
  .controller('FooCtrl', function($scope) {
    $scope.foo = "bar";
  });

function getPrefix(group) {
  return group.cn.indexOf('_') != -1 &&
         group.cn.substring(0, group.cn.indexOf('_'));
}

function findByAttr(collection, attribute, value) {
  var i,
      len = collection.length;
  for (i = 0; i < len; i++) {
    if (collection[i][attribute] == value) {
      return i;
    }
  }
  return false;
}

function postGroups($scope, users, Restangular, flash, callback) {
  var i,
      len = $scope.user_groups.length,
      toPut = [],
      toDelete = [];
  users = _.isArray(users) ? users : [users];

  // get the list of groups to put or delete for user
  for (i=0; i < len; i++) {
    var g = $scope.user_groups[i],
        og = $scope.original_groups[i];

    if (g.hasUsers != og.hasUsers) {
      if (g.hasUsers === 'all' || g.hasUsers === true) {
        toPut.push(g.cn);
      } else if (g.hasUsers === false){
        toDelete.push(g.cn);
      }
      // 'some' shouldn't be possible here
    }
  }

  var body = {
    "users": _.pluck(users, 'uid'),
    "PUT": toPut,
    "DELETE": toDelete
  };

  Restangular.all('groups_users').post(body).then(
    function() {
      angular.forEach(users, function(user) {
        // add the groups
        user.groups = _.union(user.groups, toPut);
        // remove the groups
        user.groups = _.difference(user.groups, toDelete);
      });
      flash.success = 'Modified successfully';

      if (callback) {
        callback.call();
      }
    },
    function errorCallback() {
      flash.error = 'Oops error from server :(';
    }
  );
}

function addNode(tree, node) {
  var prefix = getPrefix(node);

  if (prefix) {
    // creating a branch
    var branch = _.find(tree, function(obj) {return obj.name ==  prefix;});
    if (!branch) {
      branch = {name: prefix, nodes: []};
      tree.push(branch);
    }
    branch.nodes.push({name: node.cn, group: node});
  } else {
    tree.push({name: node.cn, group: node});
  }
}

function removeNode(tree, nodeToRemove) {
  function loop(nodes) {
    angular.forEach(nodes, function(node, ndx) {
      if (node.nodes) {
        loop(node.nodes);
      } else {
        if (node.name == nodeToRemove) {
          nodes = nodes.splice(ndx, 1);
        }
      }
    });
  }
  loop(tree, nodeToRemove);
}

$(document)
  .on('click.dropdown-menu', '.dropdown-menu > li.noclose', function (e) {
    e.stopPropagation();
  });
$('.groups').delegate('.accordion', 'show hide', function (n) {
    $(n.target).siblings('.accordion-heading').find('.accordion-toggle i').toggleClass('icon-chevron-down icon-chevron-right');
});