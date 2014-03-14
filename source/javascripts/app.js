$(document).foundation();

// Override LinkedIn plugin icon style (see also CSS)
IN.Event.on(IN, 'systemReady', function() {
  $('.li-connect-mark')
  .addClass('fi-social-linkedin');
});

var resumeApp = angular.module('resumeApp', [])
  .config(function($locationProvider) {
    $locationProvider.html5Mode(true);
  })
  .constant('constants', {
    birthdate: moment(new Date(1980, 6, 24)),
    maxSkillLevel: 6
  });

resumeApp.controller('ExperienceCtrl', ['$scope', 'sheets', 'scroll', function ($scope, sheets, scroll) {
  $scope.secondaryExperiencesVisible = false;

  sheets.getExperiences().then(function(experiences) {
    var primaryExperiences = [],
        secondaryExperiences = [],
        dateFormat = 'MM/DD/YYYY'; // Date format from Google Sheets API

    angular.forEach(experiences, function(experience) {
      experience.extendedDescriptionVisible = false;
      if (experience.start) experience.start = moment(experience.start, dateFormat);
      if (experience.end) {
        experience.end = moment(experience.end, dateFormat);
      }
      else {
        experience.end = moment();
        experience.current = true;
      }
      if (experience.start && experience.end) experience.duration = moment.duration(experience.end - experience.start);
      if (experience.secondary) {
        experience.dateFormat = 'yyyy';
        secondaryExperiences.push(experience);
      }
      else {
        experience.dateFormat = 'MMMM yyyy';
        primaryExperiences.push(experience);
      }
    });

    $scope.primaryExperiences = primaryExperiences;
    $scope.secondaryExperiences = secondaryExperiences;

    scroll.anchorScrollAfterDigest();
  });
}]);

resumeApp.controller('EducationCtrl', ['$scope', 'sheets', 'scroll', function ($scope, sheets, scroll) {
  sheets.getEducations().then(function(educations) {
    var dateFormat = 'MM/DD/YYYY'; // Date format from Google Sheets API

    angular.forEach(educations, function(education) {
      if (education.start) education.start = moment(education.start, dateFormat);
      if (education.end) education.end = moment(education.end, dateFormat);
    });

    $scope.educations = educations;

    scroll.anchorScrollAfterDigest();
  });
}]);

resumeApp.controller('ProjectsCtrl', ['$scope', 'sheets', 'constants', 'scroll', function ($scope, sheets, constants, scroll) {
  var unfilteredRole = 'All';
  $scope.roles = [];
  $scope.selectedRole = unfilteredRole;
  $scope.allYears = [];
  $scope.selectedSkill = undefined;
  $scope.maxSkillLevel = constants.maxSkillLevel;

  for(var i = 2006; i <= 2014; i++) { // Could be calculated dynamically from projects
    $scope.allYears.push(i.toString());
  }

  sheets.getProjects().then(function(projects){
    $scope.projects = projects;
    angular.forEach($scope.projects, function(project){
      project.extendedDescriptionVisible = false;
      angular.forEach(project.roles, function(role){
        if ($scope.roles.indexOf(role) === -1)
          $scope.roles.push(role);
      });
    });
    $scope.roles.sort();
    $scope.roles.unshift(unfilteredRole);

    scroll.anchorScrollAfterDigest();
  });

  sheets.getSkills().then(function(skills) {
    $scope.skillHasDescription = function(name) {
      return skills.some(function(skill) {
        return skill.name === name;
      });
    }

    $scope.selectSkill = function(name) {
      $scope.selectedSkill = skills.filter(function(skill) {
        return skill.name === name;
      })[0];
    }
  });

  $scope.roleFilter = function(project){
    return $scope.selectedRole === unfilteredRole || angular.isArray(project.roles) && project.roles.indexOf($scope.selectedRole) !== -1;
  };

  $scope.sortNumbersDesc = function(a, b) {
    return b - a;
  };
}]);

resumeApp.controller('InfoCtrl', ['$scope', 'constants', function($scope, constants) {
  $scope.birthdate = constants.birthdate;
  $scope.age = moment().diff($scope.birthdate, 'years');
}]);

resumeApp.factory('sheets', ['$http', '$location', function($http, $location) {
  var sheetUrls = {
        projects:   'https://spreadsheets.google.com/feeds/list/0ApJXKMOVLglTdE04c2Y0N192VWJQSlVzTWpicDBqbEE/1/public/values?alt=json',
        experience: 'https://spreadsheets.google.com/feeds/list/0ApJXKMOVLglTdE04c2Y0N192VWJQSlVzTWpicDBqbEE/3/public/values?alt=json',
        education:  'https://spreadsheets.google.com/feeds/list/0ApJXKMOVLglTdE04c2Y0N192VWJQSlVzTWpicDBqbEE/4/public/values?alt=json',
        skills:  'https://spreadsheets.google.com/feeds/list/0ApJXKMOVLglTdE04c2Y0N192VWJQSlVzTWpicDBqbEE/2/public/values?alt=json'
      },
      keyPrefix = 'gsx$',
      valuePropertyName = '$t';

  // Simple mapping of all properties from Google spreadsheet columns (in format such as entry.gsx$columnname.$t)
  function mapSheet(data) {
    var objects = data.feed.entry.map(function(entry) {
      var object = {};

      for (key in entry) {
        if (key.indexOf(keyPrefix) === 0) {
          var value = entry[key][valuePropertyName];

          if (value.indexOf('\n') !== -1)
            value = value.split('\n').filter(function(s) { return s.length > 0; });
          else
            value = value.toString();

          object[key.substring(keyPrefix.length)] = value;
        }
      }
      return object;
    });

    return objects;
  }

  function getSheet(url) {
    return $http.get(url)
      .then(function(response) {
        return mapSheet(response.data);
      });
  }

  return {
    getProjects: function() {
      return getSheet(sheetUrls.projects);
    },
    getEducations: function() {
      return getSheet(sheetUrls.education);
    },
    getExperiences: function() {
      return getSheet(sheetUrls.experience);
    },
    getSkills: function() {
      return getSheet(sheetUrls.skills);
    }
  };
}]);

resumeApp.factory('scroll', ['$location', '$timeout', '$anchorScroll', function($location, $timeout, $anchorScroll) {
  return {
    anchorScrollAfterDigest: function() {

      // Only scroll if location contains an anchor hash
      if ($location.hash().length > 0) {

        // Queue a scroll to anchor after the digest cycle
        $timeout(function() {
          $anchorScroll();
        })
      }
    }
  }
}]);

// Scroll progress meter directive - requires jQuery
resumeApp.directive('scrollProgressMeter', ['$window', '$timeout', function($window, $timeout) {
  return function(scope, element, attr) {
    var meter = angular.element(attr.scrollProgressMeter);

    var throttledScrollHandler = function() {
      var timeoutPromise = $timeout(function() {
        $timeout.cancel(timeoutPromise);

        var top = element.offset().top;
        var bottom = top + element.outerHeight();

        // Account for height of meter element's offset parent if it is currently in a fixed position (used when meter is in a fixed navigation bar, for example)
        var scrollTop = angular.element($window).scrollTop();
        var meterOffsetParent = meter.offsetParent();
        if (meterOffsetParent.css('position') === 'fixed') {
          scrollTop = scrollTop + meterOffsetParent.outerHeight();
        }

        var progress = ((bottom - scrollTop)/(bottom - top)) * 100;
        if (progress > 100) progress = 100;
        else if (progress < 0) progress = 0;

        meter.css('width', progress + '%');
      }, 30); // throttle to approx 30 FPS
    }

    angular.element($window).on('scroll resize', throttledScrollHandler);
  }
}]);

// This directive will trigger a scroll event on the window when the element is clicked
resumeApp.directive('triggerScrollOnclick', ['$timeout', '$window', function($timeout, $window) {
  return function(scope, element, attr) {
    element.on('click', function() {

      // defer until digest cycle is complete
      $timeout(function() {

        // trigger scroll event on the window
        $window.dispatchEvent(new Event('scroll'));
      });
    });
  };
}]);

// Directive to close all existing dropdowns.
// Workaround for Foundation dropdowns not functioning too well when reusing popup element for several targets.
resumeApp.directive('dropdownCloser', ['$document', function ($document) {
  return function(scope, element, attr) {
    element.on('mousedown', function(event) {
      $document.foundation('dropdown', 'closeall');
    });
  };
}]);

resumeApp.directive('odometer', function () {
  return {
    restrict: 'E',
    scope : {
      endValue : '=value'
    },
    link: function(scope, element, attr) {
      var od = new Odometer({
          el : element[0],
          value : 0,   // default value
          duration: 300
      });

      scope.$watch('endValue', function() {
        od.update(scope.endValue);
      });
    }
  };
});
