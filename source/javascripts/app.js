$(document).foundation();

// Override LinkedIn plugin icon style (see also CSS)
IN.Event.on(IN, 'systemReady', function() {
  $('.li-connect-mark')
  .addClass('fi-social-linkedin');
});

var resumeApp = angular.module('resumeApp', []);

resumeApp.controller('ProjectsCtrl', ['$scope', '$http', '$log', function ($scope, $http, $log) {
  $scope.roles = [];
  var unfilteredRole = 'All';
  $scope.selectedRole = unfilteredRole;
  $scope.allYears = [];
  
  for(var i = 2006; i < 2014; i++) { // Could be calculated dynamically from projects
    $scope.allYears.push(i.toString());
  }

  var keyPrefix = 'gsx$', valuePropertyName = '$t'; // Should be constants somewhere
  $http.get('https://spreadsheets.google.com/feeds/list/0ApJXKMOVLglTdE04c2Y0N192VWJQSlVzTWpicDBqbEE/1/public/values?alt=json').success(function(data) {
    $scope.projects = data.feed.entry.map(function(entry) {
      // Simple mapping of all properties from Google spreadsheet columns (in format such as entry.gsx$columnname.$t)
      var project = {
        extendedDescriptionVisible: false
      };
      
      for (key in entry) {
        if (key.indexOf(keyPrefix) === 0) {
          var value = entry[key][valuePropertyName];

          if (value.indexOf('\n') !== -1)
            value = value.split('\n');
          else
            value = value.toString();

          project[key.substring(keyPrefix.length)] = value;
        }
      }
      return project;
    });

    angular.forEach($scope.projects, function(project){
      angular.forEach(project.roles, function(role){
        if ($scope.roles.indexOf(role) === -1)
          $scope.roles.push(role);
      })
    });
    $scope.roles.sort();
    $scope.roles.unshift(unfilteredRole);
  });

  $scope.roleFilter = function(project){
    return $scope.selectedRole === unfilteredRole || angular.isArray(project.roles) && project.roles.indexOf($scope.selectedRole) !== -1;
  };

  $scope.sortNumbersDesc = function(a, b) {
    return b - a;
  };
}]);

resumeApp.controller('SkillsCtrl', ['$scope', '$http', '$log', function($scope, $http, $log) {
}]);
