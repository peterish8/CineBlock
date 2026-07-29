---
name: google-angularjs-style-detailed
description: Comprehensive Google AngularJS style rules with section-level guidance. Use when google-angularjs-style is insufficient, for thorough reviews, or when the user names this skill.
disable-model-invocation: true
---

# Google AngularJS Style (Detailed)

Source: [https://google.github.io/styleguide/angularjs-google-style.html](https://google.github.io/styleguide/angularjs-google-style.html)

Pair with the quick reference: [google-angularjs-style](../google-angularjs-style/SKILL.md)

This skill expands the short skill with section-level rules from Google's guide.
For authoritative full text, see the official URL and [reference.md](reference.md).

## How to use

1. Start from [google-angularjs-style](../google-angularjs-style/SKILL.md) for everyday edits
2. Use this skill for reviews, ambiguous cases, or API/doc conventions
3. Consult [reference.md](reference.md) for source paths and supplemental docs

## Section rules

#### Manage dependencies with Closure's goog.require and goog.provide

- Choose a namespace for your project, and use goog.provide and goog.require.
- goog.provide('hello.about.AboutCtrl'); goog.provide('hello.versions.Versions'); Why? Google BUILD rules integrate nicely with closure provide/require.
#### Modules

- Your main application module should be in your root client directory. A module should never be altered other than the one where it is defined.
- Modules may either be defined in the same file as their components (this works well for a module that contains exactly one service) or in a separate file for wiring pieces together.
#### Modules should reference other modules using the Angular Module's "name" property

- // file submodulea.js: goog.provide('my.submoduleA'); my.submoduleA = angular.module('my.submoduleA', []); // ... // file app.js goog.require('my.submoduleA'); Yes: my.application.module = angular.module('hello', [my.submoduleA.name]); No: my.application.module = angular.module('hello', ['my.submoduleA']); Why? Using a property of my.submoduleA prevents Closure presubmit failures complaining that the file is required but never used. Using the .name property avoids duplicating strings.
#### Use a common externs file

- This maximally allows the JS compiler to enforce type safety in the presence of externally provided types from Angular, and means you don't have to worry about Angular vars being obfuscated in a confusing way.
#### JSCompiler Flags

- Reminder: According to the JS style guide, customer facing code must be compiled.
- Recommended: Use the JSCompiler (the closure compiler that works with js_binary by default) and ANGULAR_COMPILER_FLAGS_FULL from //javascript/angular/build_defs/build_defs for your base flags.
- "--generate_exports", If you are using @export for properties, you will need to add the flags:
#### Controllers and Scopes

- Controllers are classes. Methods should be defined on MyCtrl.prototype.
- Google Angular applications should use the 'controller as' style to export the controller onto the scope. This is fully implemented in Angular 1.2 and can be mimicked in pre-Angular 1.2 builds.
- /** * Home controller. * * @param {!angular.Scope} $scope * @constructor * @ngInject * @export */ hello.mainpage.HomeCtrl = function($scope) { /** @export */ $scope.homeCtrl = this; // This is a bridge until Angular 1.2 controller-as /** * @type {string} * @export */ this.myColor = 'blue'; }; /** * @param {number} a * @param {number} b * @export */ hello.mainpage.HomeCtrl.prototype.add = function(a, b) { return a + b; }; And the template:
- <div ng-controller="hello.mainpage.HomeCtrl"/> <span ng-class="homeCtrl.myColor">I'm in a color!</span> <span>{{homeCtrl.add(5, 6)}}</span> </div> After Angular 1.2, this looks like:
- /** * Home controller. * * @constructor * @ngInject * @export */ hello.mainpage.HomeCtrl = function() { /** * @type {string} * @export */ this.myColor = 'blue'; }; /** * @param {number} a * @param {number} b * @export */ hello.mainpage.HomeCtrl.prototype.add = function(a, b) { return a + b; }; If you are compiling with property renaming, expose properties and methods using the @export annotation. Remember to @export the constructor as well.
#### Directives

- All DOM manipulation should be done inside directives. Directives should be kept small and use composition. Files defining directives should goog.provide a static function which returns the directive definition object.
- goog.provide('hello.pane.paneDirective'); /** * Description and usage * @return {angular.Directive} Directive definition object. */ hello.pane.paneDirective = function() { // ... }; Exception: DOM manipulation may occur in services for DOM elements disconnected from the rest of the view, e.g. dialogs or keyboard shortcuts.
#### Services

- Services registered on the module with module.service are classes. Use module.service instead of module.provider or module.factory unless you need to do initialization beyond just creating a new instance of the class.
- /** * @param {!angular.$http} $http The Angular http service. * @constructor */ hello.request.Request = function($http) { /** @type {!angular.$http} */ this.http_ = $http; }; hello.request.Request.prototype.get = function() {/*...*/}; In the module:
#### Reserve $ for Angular properties and services

- Do not use $ to prepend your own object properties and service identifiers. Consider this style of naming reserved by AngularJS and jQuery.
- $scope.myModel = { value: 'foo' } myModule.service('myService', function() { /*...*/ }); var MyCtrl = function($http) {this.http_ = $http;}; No:
- $scope.$myModel = { value: 'foo' } // BAD $scope.myModel = { $value: 'foo' } // BAD myModule.service('$myService', function() { ... }); // BAD var MyCtrl = function($http) {this.$http_ = $http;}; // BAD Why? It's useful to distinguish between Angular / jQuery builtins and things you add yourself. In addition, $ is not an acceptable character for variables names in the JS style guide.
#### Custom elements

- For custom elements (e.g. <ng-include src="template"></ng-include>), IE8 requires special support (html5shiv-like hacks) to enable css styling. Be aware of this restriction in apps targeting old versions of IE.
### 3 Angular Tips, Tricks, and Best Practices

- These are not strict style guide rules, but are placed here as reference for folks getting started with Angular at Google.
#### Testing

- Angular is designed for test-driven development.
- The recommended unit testing setup is Jasmine + Karma (though you could use closure tests or js_test)
- Angular provides easy adapters to load modules and use the injector in Jasmine tests. module inject
#### Consider using the Best Practices for App Structure

- This directory structure doc describes how to structure your application with controllers in nested subdirectories and all components (e.g. services and directives) in a 'components' dir.
#### Be aware of how scope inheritance works

- See The Nuances of Scope Prototypal Inheritance
#### Use @ngInject for easy dependency injection compilation

- This removes the need to add myCtrl['$inject'] = ... to prevent minification from messing up Angular's dependency injection.
### 4 Best practices links and docs

- Best Practices from Angular on GitHub
- Meetup video (not Google specific)
