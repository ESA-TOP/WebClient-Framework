define([
	'backbone.marionette',
	'app',
	'communicator',
	'./AVViewController',
	'./AVViewRouter'
], function(Marionette, App, Communicator, AVViewController, AVViewRouterController) {

	'use strict';

	App.module('AVViewer', function(Module) {

		this.startsWithParent = true;

		// This is the start routine of the module, called automatically by Marionette
		// after the core system is loaded. The module is responsible for creating its
		// private implementation, the Module.Controller. The Module.Controller is the
		// connected to the event system of the application via the Communicator.
		// Moreover the Router responsible for this module is activated in this routine.
		this.on('start', function(options) {
			//this.instances = {};
			this.instance = undefined;
			this.idx = 0;

			console.log('[AVViewerModule] Finished module initialization');
		});

		this.createController = function(opts) {
			/*var id = undefined;
			

			if (typeof opts !== 'undefined') {
				id = opts.id;
			} 

			// Go through instances and return first free one
			for (var contr in this.instances) {
				if(!this.instances[contr].isActive()){
					console.log("Free analytics viewer returned " +contr);
					this.instances[contr].connectToView();
					return this.instances[contr];
				}
			};

			// If there are no free insances create a new one
			if (typeof id === 'undefined') {
				id = 'AVViewer.' + this.idx++;
			}
			console.log("New analytics viewer returned " +id);
			var controller = new AVViewController({});
			this.instances[id] = controller;

			return controller;*/
			var i = this.insance;
			if(this.insance === undefined){
				i = new AVViewController({});
				this.insance = i;
			}
			return i;

		};
	});
});